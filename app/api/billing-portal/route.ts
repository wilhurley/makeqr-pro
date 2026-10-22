import { NextRequest, NextResponse } from "next/server";
import { withProCookie } from "@/lib/pro-cookie";
import { PRO_COOKIE_NAME, verifyProToken } from "@/lib/pro-token";
import { getAppUrl, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(PRO_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Restore Pro before managing billing." }, { status: 401 });
  }

  let claims;
  try {
    claims = verifyProToken(token);
  } catch (err) {
    console.error("billing portal cookie unavailable", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Pro is not configured." }, { status: 500 });
  }
  if (!claims) {
    return NextResponse.json({ error: "Restore Pro before managing billing." }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: claims.cus,
      return_url: `${getAppUrl()}/?billing=return`,
    });
    // Slide the cookie so the return trip re-checks Stripe immediately via ?billing=return.
    return withProCookie(NextResponse.json({ url: session.url }), claims);
  } catch (err) {
    console.error("billing portal failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Could not open the billing portal." }, { status: 500 });
  }
}
