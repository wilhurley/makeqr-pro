import type Stripe from "stripe";
import { isEntitledStatus, issueClaims, type ProClaims } from "./pro-token";

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
 * The Price id is intentionally ignored so grandfathered $4.99 plans keep access
 * after new checkouts move to the $5 Price.
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
