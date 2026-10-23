import Stripe from "stripe";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

/** Price charged to new subscribers. Existing subscriptions stay on their own Price. */
export function getProPriceId(): string {
  const priceId = process.env.STRIPE_PRO_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_PRO_PRICE_ID is not set");
  return priceId;
}

export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "https://makeqr.pro";
  return raw.replace(/\/$/, "");
}

export function isMissingResource(err: unknown): boolean {
  return err instanceof Stripe.errors.StripeError && err.code === "resource_missing";
}
