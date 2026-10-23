import { NextRequest, NextResponse } from "next/server";
import { withBillingCookie, withoutBillingCookie } from "@/lib/pro-cookie";
import { BILLING_COOKIE_NAME, issueBillingClaims, verifyBillingToken } from "@/lib/pro-token";
import { getAppUrl, getBillingPortalLoginUrl, getStripe, isMissingResource } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opens the Stripe billing portal. Authorized only by the qr_billing cookie, which
 * /api/verify-session issues after a completed Checkout. The Pro cookie (which email
 * restore can issue) is not enough. Works when Pro has lapsed (past_due, unpaid,
 * canceled) so the customer can update their card or cancel.
 */
function needsSignIn() {
  const loginUrl = getBillingPortalLoginUrl();
  const body = {
    error: loginUrl
      ? "Sign in to Stripe with the email on your subscription to manage billing."
      : "Billing opens from the browser you subscribed on. For help, email support@ridgelineapps.us.",
    ...(loginUrl ? { loginUrl } : {}),
  };
  return NextResponse.json(body, { status: 401 });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(BILLING_COOKIE_NAME)?.value;
  if (!token) return needsSignIn();

  let claims;
  try {
    claims = verifyBillingToken(token);
  } catch (err) {
    console.error("billing cookie unavailable", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Billing is not configured." }, { status: 500 });
  }
  if (!claims) return withoutBillingCookie(needsSignIn());

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: claims.cus,
      return_url: `${getAppUrl()}/?billing=return`,
    });
    // Slide the billing cookie. The return trip re-checks Pro via ?billing=return.
    return withBillingCookie(NextResponse.json({ url: session.url }), issueBillingClaims(claims.cus));
  } catch (err) {
    if (isMissingResource(err)) return withoutBillingCookie(needsSignIn());
    console.error("billing portal failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Could not open the billing portal." }, { status: 500 });
  }
}
