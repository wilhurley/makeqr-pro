/**
 * Pro plans offered at checkout. Pure functions with no imports so they can be
 * unit-tested with plain `node --test`.
 *
 * Approved prices (Jason, 2026-10-23): $3.99/mo, $29/yr, $39 lifetime (launch deal, first 300).
 *
 * - Monthly needs STRIPE_PRO_PRICE_ID and STRIPE_SECRET_KEY. The legacy NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
 *   (the old $4.99 Price) is never used, so a $3.99 display can't charge $4.99. Without both, Stripe is "not configured" and the site shows "Pro coming soon" with a waitlist link.
 * - Yearly shows only when STRIPE_PRO_YEARLY_PRICE_ID is set. Display price: NEXT_PUBLIC_PRO_YEARLY_PRICE_CENTS (default 2900).
 * - Lifetime shows only when STRIPE_PRO_LIFETIME_PRICE_ID is set. One-time Checkout (mode "payment").
 *   Display price: NEXT_PUBLIC_PRO_LIFETIME_PRICE_CENTS (default 3900).
 */

export type PlanId = "monthly" | "yearly" | "lifetime";

export type PlanOption = {
  id: PlanId;
  priceId: string;
  cents: number;
  mode: "subscription" | "payment";
  /** Short label for the button, e.g. "/ month". */
  per: string;
  badge?: string;
};

export type PlanConfig = {
  configured: boolean;
  plans: PlanOption[];
};

export const DEFAULT_MONTHLY_CENTS = 399;
export const DEFAULT_YEARLY_CENTS = 2900;
export const DEFAULT_LIFETIME_CENTS = 3900;
export const LIFETIME_BADGE = "Launch lifetime deal, limited";

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
  return value === "monthly" || value === "yearly" || value === "lifetime";
}

/**
 * TEST MODE gate (2026-10-24). Checkout only starts when CHECKOUT_ENABLED is on (default off)
 * and STRIPE_SECRET_KEY is set. A live key (sk_live_/rk_live_) is refused unless STRIPE_ALLOW_LIVE=yes.
 */
export function checkoutAllowed(env: Env = process.env): boolean {
  const flag = clean(env.CHECKOUT_ENABLED).toLowerCase();
  if (!["on", "true", "1", "yes"].includes(flag)) return false;
  const secret = clean(env.STRIPE_SECRET_KEY);
  if (!secret) return false;
  if (/^(sk|rk)_live_/.test(secret) && clean(env.STRIPE_ALLOW_LIVE) !== "yes") return false;
  return true;
}

function flagOn(value: string | undefined): boolean {
  return ["on", "true", "1", "yes"].includes(clean(value).toLowerCase());
}

/**
 * Legal Review launch rules (2026-10-24):
 * - Monthly only at launch. Yearly needs PRO_YEARLY_ENABLED=on and lifetime needs PRO_LIFETIME_ENABLED=on
 *   (both off by default) even when their Stripe price ids are set.
 * - Stripe Tax only when STRIPE_AUTOMATIC_TAX=on (after Jason's Ohio vendor's license).
 * - Card statement: RIDGELINE* MAKEQR. One-time (lifetime) Checkout sets the suffix per session;
 *   subscription charges use the Product's statement_descriptor "RIDGELINE MAKEQR" (set by /workspace/stripe-setup).
 */
export const STATEMENT_DESCRIPTOR_SUFFIX = "MAKEQR";
export const SUPPORT_EMAIL_ADDRESS = "support@ridgelineapps.us";
export const RENEWAL_CONSENT_TEXT = "I agree to the Terms and understand this plan renews automatically every month until I cancel.";

export function automaticTaxOn(env: Env = process.env): boolean {
  return flagOn(env.STRIPE_AUTOMATIC_TAX);
}

/** Auto-renew disclosure shown directly above the subscribe button (common/checkout-and-subscription-disclosures.md). */
export function renewalDisclosure(price: string): { headline: string; body: string } {
  return {
    headline: `MakeQR Pro — ${price} per month, billed monthly until you cancel.`,
    body: `Your card is charged today and then every month on the same date. Cancel anytime online with the Manage billing button or by emailing ${SUPPORT_EMAIL_ADDRESS}. Cancelling stops future charges, and you keep access until the end of the period you already paid for. No refunds for partial months unless the law requires one. Sold by Ridgeline Apps LLC, an Ohio limited liability company.`,
  };
}

export function planConfig(env: Env = process.env): PlanConfig {
  const secret = checkoutAllowed(env) ? clean(env.STRIPE_SECRET_KEY) : "";
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
  const yearly = flagOn(env.PRO_YEARLY_ENABLED) ? clean(env.STRIPE_PRO_YEARLY_PRICE_ID) : "";
  if (yearly) {
    plans.push({
      id: "yearly",
      priceId: yearly,
      cents: parseCents(env.NEXT_PUBLIC_PRO_YEARLY_PRICE_CENTS, DEFAULT_YEARLY_CENTS),
      mode: "subscription",
      per: "/ year",
    });
  }
  const lifetime = flagOn(env.PRO_LIFETIME_ENABLED) ? clean(env.STRIPE_PRO_LIFETIME_PRICE_ID) : "";
  if (lifetime) {
    plans.push({
      id: "lifetime",
      priceId: lifetime,
      cents: parseCents(env.NEXT_PUBLIC_PRO_LIFETIME_PRICE_CENTS, DEFAULT_LIFETIME_CENTS),
      mode: "payment",
      per: "one time",
      badge: LIFETIME_BADGE,
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
