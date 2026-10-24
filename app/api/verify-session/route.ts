import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  claimsForLifetime,
  claimsForSubscription,
  customerIdOf,
  customerIsBlocked,
  grantLifetimeFromSession,
} from "@/lib/pro-access";
import {
  beginRedeem,
  checkSessionRedeemable,
  endRedeem,
  redeemedMetadata,
  SESSION_USED_OR_EXPIRED,
} from "@/lib/checkout-guard";
import { withBillingCookie, withProCookie } from "@/lib/pro-cookie";
import { isEntitledStatus, issueBillingClaims } from "@/lib/pro-token";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveSubscription(
  stripe: Stripe,
  value: Stripe.Checkout.Session["subscription"],
): Promise<Stripe.Subscription | null> {
  if (!value) return null;
  if (typeof value === "string") return stripe.subscriptions.retrieve(value);
  return value;
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ valid: false });
  }

  if (!beginRedeem(sessionId)) {
    return NextResponse.json(SESSION_USED_OR_EXPIRED.body, { status: SESSION_USED_OR_EXPIRED.status });
  }
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    if (session.status !== "complete" || session.payment_status === "unpaid") {
      return NextResponse.json({ valid: false });
    }

    // Legal Review 2026-10-24 §3b.1: one-time and short-lived. A Checkout Session can
    // mint cookies once, within 1 hour of creation. Used and expired get the same answer.
    if (checkSessionRedeemable(session) !== "ok") {
      return NextResponse.json(SESSION_USED_OR_EXPIRED.body, { status: SESSION_USED_OR_EXPIRED.status });
    }
    // Burn it before any cookie is issued. If Stripe refuses the write, fail closed.
    try {
      await stripe.checkout.sessions.update(session.id, { metadata: redeemedMetadata(session) });
    } catch (err) {
      console.error("verify-session could not mark session redeemed", err instanceof Error ? err.message : "unknown");
      return NextResponse.json({ valid: false }, { status: 503 });
    }

    if (session.mode === "payment") {
      // Lifetime: one-time payment. Record it on the Customer (webhook does the same).
      const lifetimeCustomer = await grantLifetimeFromSession(stripe, session);
      if (!lifetimeCustomer) return NextResponse.json({ valid: false });
      const res = withProCookie(NextResponse.json({ valid: true, billing: true }), claimsForLifetime(lifetimeCustomer));
      return withBillingCookie(res, issueBillingClaims(lifetimeCustomer));
    }

    const subscription = await resolveSubscription(stripe, session.subscription);
    if (!subscription || !isEntitledStatus(subscription.status)) {
      return NextResponse.json({ valid: false });
    }

    const customerId = customerIdOf(session.customer) ?? customerIdOf(subscription.customer);
    if (!customerId) return NextResponse.json({ valid: false });

    const customer = await stripe.customers.retrieve(customerId);
    if (customerIsBlocked(customer)) return NextResponse.json({ valid: false });

    const claims = claimsForSubscription(subscription, customerId);
    if (!claims) return NextResponse.json({ valid: false });

    // The Checkout Session id only reaches the buyer's browser, and it is now burned
    // (one use, within an hour), so it proves this browser may manage billing.
    const res = withProCookie(NextResponse.json({ valid: true, billing: true }), claims);
    return withBillingCookie(res, issueBillingClaims(customerId));
  } catch (err) {
    console.error("verify-session failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ valid: false }, { status: 500 });
  } finally {
    endRedeem(sessionId);
  }
}
