/**
 * Clickwrap for Pro checkout (Legal Review clickwrap-spec.md, sections 2 and 3).
 * Pure functions with no imports so node:test can load them directly.
 *
 * Box 1 (Terms + Privacy) is always required. Box 2 (automatic renewal) is required for
 * subscriptions (monthly, yearly) and not shown for a one-time payment (none is offered). The server rejects a checkout
 * request unless both required boxes were ticked for the current Terms version; the HTML
 * `required` attribute alone is not relied on. Stripe Checkout also collects its own
 * terms-of-service consent (consent_collection.terms_of_service = "required").
 */

export type ConsentPlan = { id: "monthly" | "yearly"; mode: "subscription" | "payment"; price: string };

export const TERMS_BOX_TEXT = "I agree to the Terms of Service and have read the Privacy Policy.";

/** Box 2 text, exactly per the spec's MakeQR row. Null for a one-time payment (no renewal). */
export function renewalBoxText(plan: ConsentPlan): string | null {
  if (plan.mode !== "subscription") return null;
  const period = plan.id === "yearly" ? "year" : "month";
  return `I agree that Pro renews automatically at ${plan.price} every ${period} until I cancel. I can cancel anytime online with Manage billing.`;
}

/** Text Stripe shows next to its own unchecked Terms box on the hosted Checkout page. */
export const STRIPE_TERMS_MESSAGE =
  "I agree to the [Terms of Service](https://makeqr.pro/terms) and have read the [Privacy Policy](https://makeqr.pro/privacy).";

export type ConsentBody = { acceptTerms?: unknown; acceptRenewal?: unknown; termsVersion?: unknown };

/** Returns an error message, or null when the required boxes were ticked for this Terms version. */
export function consentError(body: ConsentBody, plan: ConsentPlan, termsVersion: string): string | null {
  if (body.acceptTerms !== true) return "Please tick the box to agree to the Terms of Service.";
  if (plan.mode === "subscription" && body.acceptRenewal !== true) {
    return "Please tick the box to agree to automatic renewal.";
  }
  if (body.termsVersion !== termsVersion) return "The Terms were updated. Reload the page and review them before checkout.";
  return null;
}

/**
 * Acceptance record (spec section 3), stored as Stripe metadata on the Checkout Session and on the
 * Subscription or PaymentIntent. Privacy-minimal: no IP, no user agent. The buyer (account) is the
 * Stripe customer email Stripe attaches to the session. Server time, UTC ISO 8601.
 */
export function acceptanceMetadata(input: {
  plan: ConsentPlan;
  termsVersion: string;
  termsSha256: string;
  privacyVersion: string;
  now: Date;
}): Record<string, string> {
  const { plan } = input;
  const subscription = plan.mode === "subscription";
  return {
    terms_version: input.termsVersion,
    terms_sha256: input.termsSha256,
    privacy_version: input.privacyVersion,
    accepted_at: input.now.toISOString().replace(/\.\d{3}Z$/, "Z"),
    boxes: subscription ? "terms,renewal" : "terms",
    ...(subscription ? { renewal_terms: `pro ${plan.price} USD ${plan.id === "yearly" ? "year" : "month"}` } : {}),
    source: "web-checkout",
  };
}

/** For the webhook: did Stripe record the buyer's Terms acceptance on the session? */
export function stripeTermsAccepted(session: { consent?: { terms_of_service?: string | null } | null }): boolean {
  return session.consent?.terms_of_service === "accepted";
}
