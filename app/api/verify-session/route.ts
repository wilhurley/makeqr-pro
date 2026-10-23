import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  claimsForLifetime,
  claimsForSubscription,
  customerIdOf,
  customerIsBlocked,
  grantLifetimeFromSession,
} from "@/lib/pro-access";
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

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    if (session.status !== "complete" || session.payment_status === "unpaid") {
      return NextResponse.json({ valid: false });
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

    // The Checkout Session id only reaches the buyer's browser, so it proves this
    // browser may manage billing. Email restore never issues this cookie.
    const res = withProCookie(NextResponse.json({ valid: true, billing: true }), claims);
    return withBillingCookie(res, issueBillingClaims(customerId));
  } catch (err) {
    console.error("verify-session failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
