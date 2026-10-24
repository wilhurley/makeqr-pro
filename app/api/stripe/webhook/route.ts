import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { grantLifetimeFromSession, PRO_BLOCK_METADATA_KEY, revokeLifetimeForRefund } from "@/lib/pro-access";
import { getStripe } from "@/lib/stripe";
import { stripeTermsAccepted } from "@/lib/checkout-consent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function chargeIdOf(value: string | Stripe.Charge | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * Stripe is the source of truth. This route does not write to a database.
 * Subscription changes take effect the next time /api/pro re-checks Stripe
 * (within an hour, or immediately after the billing portal return).
 * Disputes and early-fraud warnings set Customer metadata that those checks honor.
 * Lifetime (one-time) purchases are recorded on the Customer as metadata when the
 * Checkout Session is paid, and cleared again if that payment is fully refunded.
 */
async function blockCustomerForCharge(stripe: Stripe, chargeId: string, reason: string) {
  const charge = await stripe.charges.retrieve(chargeId);
  const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  if (!customerId) return;
  const customer = await stripe.customers.retrieve(customerId);
  if ("deleted" in customer && customer.deleted) return;
  if (customer.metadata?.[PRO_BLOCK_METADATA_KEY]) return;
  await stripe.customers.update(customerId, {
    metadata: { [PRO_BLOCK_METADATA_KEY]: reason },
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("stripe webhook signature failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        break;
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        // Clickwrap check (spec section 2.7): Stripe should only complete a session after its
        // required Terms box was ticked. Log loudly if it wasn't, so it can be reviewed.
        if (!stripeTermsAccepted(event.data.object)) {
          console.error("checkout session completed without Terms consent", event.data.object.id);
        }
        // Subscriptions need nothing here. Lifetime payments are recorded on the Customer.
        await grantLifetimeFromSession(stripe, event.data.object);
        break;
      case "charge.dispute.created":
      case "radar.early_fraud_warning.created": {
        const chargeId = chargeIdOf(event.data.object.charge);
        if (chargeId) {
          const reason = event.type === "charge.dispute.created" ? "dispute" : "early_fraud_warning";
          await blockCustomerForCharge(stripe, chargeId, reason);
        }
        break;
      }
      case "charge.refunded":
        // A refund does not by itself end a subscription; access follows subscription
        // status on the next re-check. A full refund of a lifetime payment ends lifetime Pro.
        await revokeLifetimeForRefund(stripe, event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("stripe webhook handler failed", event.type, err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
