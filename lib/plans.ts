/**
 * Pro plans offered at checkout. Pure functions with no imports so they can be
 * unit-tested with plain `node --test`.
 *
 * Offered: Pro $3.99/mo only (ads re-check 2026-10-24 11:45: yearly and one-time options removed).
 *
 * - Monthly needs STRIPE_PRO_PRICE_ID and STRIPE_SECRET_KEY. The legacy NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
 *   (the old $4.99 Price) is never used, so a $3.99 display can't charge $4.99. Without both, Stripe is "not configured" and the site shows "Pro coming soon" with a waitlist link.
 * - Yearly is not offered. The code path stays behind YEARLY_PLANS_ENABLED=on (off) plus
 *   STRIPE_PRO_YEARLY_PRICE_ID, for later, once a yearly price is approved and the reminder email works.
 * - No one-time plan exists. Checkout is subscription only.
 */

export type PlanId = "monthly" | "yearly";

export type PlanOption = {
  id: PlanId;
  priceId: string;
  cents: number;
  mode: "subscription";
  /** Short label for the button, e.g. "/ month". */
  per: string;
};

export type PlanConfig = {
  configured: boolean;
  plans: PlanOption[];
};

export const DEFAULT_MONTHLY_CENTS = 399;
/** No approved yearly price; 0 means YEARLY_PLANS_ENABLED also needs NEXT_PUBLIC_PRO_YEARLY_PRICE_CENTS. */
export const DEFAULT_YEARLY_CENTS = 0;

/** Customer metadata key that marks a paid lifetime purchase. Value is the PaymentIntent id. */
export const LIFETIME_METADATA_KEY = "makeqr_pro_lifetime";

type Env = Record<string, string | undefined>;

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

export function parseCents(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const cents = Number(raw);
  if (!Number.isInteger(cents) || cents < 0 || cents > 1_000_000) return fallback;
  return cents;
}

export function isPlanId(value: unknown): value is PlanId {
  return value === "monthly" || value === "yearly";
}

export function planConfig(env: Env = process.env): PlanConfig {
  const secret = clean(env.STRIPE_SECRET_KEY);
  // No fallback to NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: unset means "Pro coming soon", never a charge.
  const monthly = clean(env.STRIPE_PRO_PRICE_ID);
  if (!secret || !monthly) return { configured: false, plans: [] };
  const plans: PlanOption[] = [
    {
      id: "monthly",
      priceId: monthly,
      cents: parseCents(env.NEXT_PUBLIC_PRO_PRICE_CENTS, DEFAULT_MONTHLY_CENTS),
      mode: "subscription",
      per: "/ month",
    },
  ];
  // Yearly stays off until the 15-45-day renewal reminder email works (Legal funding memo 2026-10-24 §7).
  // Off by default; turn on only with YEARLY_PLANS_ENABLED=on after the reminder is live.
  const yearly = clean(env.YEARLY_PLANS_ENABLED) === "on" ? clean(env.STRIPE_PRO_YEARLY_PRICE_ID) : "";
  const yearlyCents = parseCents(env.NEXT_PUBLIC_PRO_YEARLY_PRICE_CENTS, DEFAULT_YEARLY_CENTS);
  if (yearly && yearlyCents > 0) {
    plans.push({
      id: "yearly",
      priceId: yearly,
      cents: yearlyCents,
      mode: "subscription",
      per: "/ year",
    });
  }
  return { configured: true, plans };
}

export function findPlan(config: PlanConfig, id: PlanId): PlanOption | null {
  return config.plans.find((plan) => plan.id === id) ?? null;
}

type SessionLike = {
  mode?: string | null;
  status?: string | null;
  payment_status?: string | null;
  metadata?: Record<string, string> | null;
  customer?: string | { id: string } | null;
  payment_intent?: string | { id: string } | null;
};

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * A completed, paid one-time Checkout Session that this server created for the
 * lifetime plan. Returns the customer and PaymentIntent to record, or null.
 * `metadata.plan` is set server-side in /api/checkout, never by the browser.
 */
export function lifetimeGrantFromSession(session: SessionLike): { customerId: string; paymentIntentId: string } | null {
  if (session.mode !== "payment") return null;
  if (session.metadata?.plan !== "lifetime") return null;
  if (session.status && session.status !== "complete") return null;
  if (session.payment_status !== "paid") return null;
  const customerId = idOf(session.customer);
  const paymentIntentId = idOf(session.payment_intent);
  if (!customerId || !paymentIntentId) return null;
  return { customerId, paymentIntentId };
}

/** True when a refunded charge fully refunds the recorded lifetime payment. */
export function lifetimeRevokedByRefund(
  charge: { refunded?: boolean | null; payment_intent?: string | { id: string } | null },
  recordedPaymentIntent: string | undefined,
): boolean {
  if (!charge.refunded || !recordedPaymentIntent) return false;
  return idOf(charge.payment_intent) === recordedPaymentIntent;
}
