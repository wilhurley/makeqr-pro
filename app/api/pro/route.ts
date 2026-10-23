import { NextRequest, NextResponse } from "next/server";
import { claimsForSubscription, customerIdOf, customerIsBlocked } from "@/lib/pro-access";
import { withProCookie, withoutProCookie } from "@/lib/pro-cookie";
import { claimsNeedRefresh, isEntitledStatus, PRO_COOKIE_NAME, verifyProToken } from "@/lib/pro-token";
import { getStripe, isMissingResource } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(PRO_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ pro: false });

  let claims;
  try {
    claims = verifyProToken(token);
  } catch (err) {
    console.error("pro cookie unavailable", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ pro: false });
  }
  if (!claims) return withoutProCookie(NextResponse.json({ pro: false }));

  const fresh = req.nextUrl.searchParams.get("fresh") === "1";
  if (!fresh && !claimsNeedRefresh(claims)) {
    return NextResponse.json({ pro: true });
  }

  try {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(claims.sub);
    const customerId = customerIdOf(subscription.customer) ?? claims.cus;
    if (!isEntitledStatus(subscription.status)) {
      return withoutProCookie(NextResponse.json({ pro: false }));
    }
    const customer = await stripe.customers.retrieve(customerId);
    if (customerIsBlocked(customer)) {
      return withoutProCookie(NextResponse.json({ pro: false }));
    }
    const nextClaims = claimsForSubscription(subscription, customerId);
    if (!nextClaims) return withoutProCookie(NextResponse.json({ pro: false }));
    return withProCookie(NextResponse.json({ pro: true }), nextClaims);
  } catch (err) {
    if (isMissingResource(err)) {
      return withoutProCookie(NextResponse.json({ pro: false }));
    }
    console.error("pro revalidation failed", err instanceof Error ? err.message : "unknown");
    const periodStillOpen = claims.pe === 0 || claims.pe * 1000 > Date.now();
    if (isEntitledStatus(claims.st) && periodStillOpen) {
      return NextResponse.json({ pro: true });
    }
    return withoutProCookie(NextResponse.json({ pro: false }));
  }
}
