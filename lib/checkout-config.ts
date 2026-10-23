/**
 * Which Stripe Price new Pro checkouts charge. Pure, so it can be unit-tested.
 *
 * Only STRIPE_PRO_PRICE_ID is read. The legacy NEXT_PUBLIC_STRIPE_PRO_PRICE_ID is
 * deliberately ignored: it pointed at the old $4.99 Price, and the site now shows
 * a different price. With STRIPE_PRO_PRICE_ID (or STRIPE_SECRET_KEY) unset, Pro is
 * "coming soon" and checkout refuses to start, so nobody is charged.
 */
type Env = Record<string, string | undefined>;

export type CheckoutConfig =
  | { configured: true; priceId: string }
  | { configured: false; priceId: null };

export function checkoutConfig(env: Env = process.env): CheckoutConfig {
  const secret = (env.STRIPE_SECRET_KEY ?? "").trim();
  const priceId = (env.STRIPE_PRO_PRICE_ID ?? "").trim();
  if (!secret || !priceId) return { configured: false, priceId: null };
  return { configured: true, priceId };
}
