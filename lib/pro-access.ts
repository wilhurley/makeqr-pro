import type Stripe from "stripe";
import { LIFETIME_METADATA_KEY, lifetimeGrantFromSession, lifetimeRevokedByRefund } from "./plans";
import { isEntitledStatus, issueClaims, LIFETIME_STATUS, LIFETIME_SUB, type ProClaims } from "./pro-token";

/** Set on the Stripe Customer when a dispute or early-fraud warning should revoke Pro. */
export const PRO_BLOCK_METADATA_KEY = "makeqr_pro_block";

export function periodEndSeconds(subscription: Stripe.Subscription): number {
  return subscription.items?.data?.[0]?.current_period_end ?? 0;
}

export function customerIdOf(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export function customerIsBlocked(customer: Stripe.Customer | Stripe.DeletedCustomer): boolean {
  if ("deleted" in customer && customer.deleted) return true;
  return Boolean(customer.metadata?.[PRO_BLOCK_METADATA_KEY]);
}

/**
 * Pro is any active or trialing subscription on the customer.
 * The Price id is intentionally ignored so monthly, yearly and any grandfathered
 * Prices all count. Lifetime buyers have no subscription; see customerHasLifetime.
 */
export async function findEntitledSubscription(
  stripe: Stripe,
  customerId: string,
): Promise<Stripe.Subscription | null> {
  const customer = await stripe.customers.retrieve(customerId);
  if (customerIsBlocked(customer)) return null;
  const list = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });
  return list.data.find((subscription) => isEntitledStatus(subscription.status)) ?? null;
}

export function claimsForSubscription(
  subscription: Stripe.Subscription,
  customerId: string,
): ProClaims | null {
  if (!isEntitledStatus(subscription.status)) return null;
  return issueClaims({
    sub: subscription.id,
    cus: customerId,
    status: subscription.status,
    periodEnd: periodEndSeconds(subscription),
  });
}

/** Paid lifetime purchase recorded on the Customer, and not blocked by a dispute. */
export function customerHasLifetime(customer: Stripe.Customer | Stripe.DeletedCustomer): boolean {
  if (customerIsBlocked(customer)) return false;
  return Boolean((customer as Stripe.Customer).metadata?.[LIFETIME_METADATA_KEY]);
}

export function claimsForLifetime(customerId: string): ProClaims {
  return issueClaims({ sub: LIFETIME_SUB, cus: customerId, status: LIFETIME_STATUS, periodEnd: 0 });
}

/**
 * Records a paid lifetime Checkout Session on the Customer (metadata, no database).
 * Called from both the webhook and the success-page verify so whichever arrives
 * first grants Pro. Idempotent. Returns the customer id when lifetime is granted.
 */
export async function grantLifetimeFromSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  const grant = lifetimeGrantFromSession(session);
  if (!grant) return null;
  const customer = await stripe.customers.retrieve(grant.customerId);
  if (customerIsBlocked(customer)) return null;
  if ((customer as Stripe.Customer).metadata?.[LIFETIME_METADATA_KEY] !== grant.paymentIntentId) {
    await stripe.customers.update(grant.customerId, {
      metadata: { [LIFETIME_METADATA_KEY]: grant.paymentIntentId },
    });
  }
  return grant.customerId;
}

/** A full refund of the lifetime payment removes lifetime Pro on the next re-check. */
export async function revokeLifetimeForRefund(stripe: Stripe, charge: Stripe.Charge): Promise<void> {
  const customerId = customerIdOf(charge.customer);
  if (!customerId) return;
  const customer = await stripe.customers.retrieve(customerId);
  if ("deleted" in customer && customer.deleted) return;
  const recorded = customer.metadata?.[LIFETIME_METADATA_KEY];
  if (!lifetimeRevokedByRefund(charge, recorded)) return;
  await stripe.customers.update(customerId, { metadata: { [LIFETIME_METADATA_KEY]: "" } });
}
