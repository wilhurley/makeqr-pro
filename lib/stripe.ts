import Stripe from "stripe";
import { checkoutConfig } from "./checkout-config";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

/**
 * Price charged to new subscribers, or null when Pro is "coming soon".
 * Never falls back to NEXT_PUBLIC_STRIPE_PRO_PRICE_ID (see lib/checkout-config.ts).
 * Existing subscriptions stay on their own Price.
 */
export function getProPriceId(): string | null {
  const config = checkoutConfig();
  return config.configured ? config.priceId : null;
}

export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "https://makeqr.pro";
  return raw.replace(/\/$/, "");
}

/** Stripe-hosted billing portal sign-in (Stripe emails the customer a code). Optional. */
export function getBillingPortalLoginUrl(): string | null {
  const raw = (process.env.STRIPE_BILLING_PORTAL_LOGIN_URL ?? "").trim();
  return raw.startsWith("https://") ? raw : null;
}

export function isMissingResource(err: unknown): boolean {
  return err instanceof Stripe.errors.StripeError && err.code === "resource_missing";
}
