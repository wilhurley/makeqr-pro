import { NextRequest, NextResponse } from "next/server";
import {
  claimsForLifetime,
  claimsForSubscription,
  customerHasLifetime,
  customerIdOf,
  customerIsBlocked,
} from "@/lib/pro-access";
import { withoutBillingCookie, withProCookie, withoutProCookie } from "@/lib/pro-cookie";
import {
  BILLING_COOKIE_NAME,
  claimsNeedRefresh,
  isEntitledStatus,
  isLifetimeClaims,
  PRO_COOKIE_NAME,
  verifyBillingToken,
  verifyProToken,
} from "@/lib/pro-token";
import { getStripe, isMissingResource } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `pro`: paid features are unlocked. `billing`: this browser may open the billing
 * portal (qr_billing cookie from Checkout). They are independent so a lapsed
 * (past_due/unpaid) customer keeps "Manage billing" while Pro is off.
 */
function billingState(req: NextRequest): { billing: boolean; clear: boolean } {
  const token = req.cookies.get(BILLING_COOKIE_NAME)?.value;
  if (!token) return { billing: false, clear: false };
  try {
    const ok = verifyBillingToken(token) !== null;
    return { billing: ok, clear: !ok };
  } catch {
    return { billing: false, clear: false };
  }
}

export async function GET(req: NextRequest) {
  const bill = billingState(req);
  const reply = (pro: boolean) => {
    const res = NextResponse.json({ pro, billing: bill.billing });
    return bill.clear ? withoutBillingCookie(res) : res;
  };

  const token = req.cookies.get(PRO_COOKIE_NAME)?.value;
  if (!token) return reply(false);

  let claims;
  try {
    claims = verifyProToken(token);
  } catch (err) {
    console.error("pro cookie unavailable", err instanceof Error ? err.message : "unknown");
    return reply(false);
  }
  // Tampered or expired (exp is enforced in verifyProToken).
  if (!claims) return withoutProCookie(reply(false));

  const fresh = req.nextUrl.searchParams.get("fresh") === "1";
  if (!fresh && !claimsNeedRefresh(claims)) {
    return reply(true);
  }

  try {
    const stripe = getStripe();
    if (isLifetimeClaims(claims)) {
      // Lifetime never expires; it only ends on a dispute, fraud warning or full refund.
      const customer = await stripe.customers.retrieve(claims.cus);
      if (!customerHasLifetime(customer)) {
        return withoutProCookie(reply(false));
      }
      return withProCookie(reply(true), claimsForLifetime(claims.cus));
    }
    const subscription = await stripe.subscriptions.retrieve(claims.sub);
    const customerId = customerIdOf(subscription.customer) ?? claims.cus;
    if (!isEntitledStatus(subscription.status)) {
      return withoutProCookie(reply(false));
    }
    const customer = await stripe.customers.retrieve(customerId);
    if (customerIsBlocked(customer)) {
      return withoutProCookie(reply(false));
    }
    const nextClaims = claimsForSubscription(subscription, customerId);
    if (!nextClaims) return withoutProCookie(reply(false));
    return withProCookie(reply(true), nextClaims);
  } catch (err) {
    if (isMissingResource(err)) {
      return withoutProCookie(reply(false));
    }
    console.error("pro revalidation failed", err instanceof Error ? err.message : "unknown");
    const periodStillOpen = claims.pe === 0 || claims.pe * 1000 > Date.now();
    if (isEntitledStatus(claims.st) && periodStillOpen) {
      return reply(true);
    }
    return withoutProCookie(reply(false));
  }
}
