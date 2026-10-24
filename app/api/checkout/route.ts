import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/email";
import { findPlan, isPlanId, planConfig, type PlanId } from "@/lib/plans";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { acceptanceMetadata, consentError, STRIPE_TERMS_MESSAGE, type ConsentBody } from "@/lib/checkout-consent";
import { termsSha256 } from "@/lib/terms-content";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/terms-version";
import { formatProPrice, PRO_PRICE } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let email: string | null = null;
  let planId: PlanId = "monthly";
  let consent: ConsentBody = {};
  try {
    const body = await req.json();
    if (body && typeof body === "object") {
      email = normalizeEmail("email" in body ? body.email : null);
      if ("plan" in body && isPlanId(body.plan)) planId = body.plan;
      consent = { acceptTerms: body.acceptTerms, acceptRenewal: body.acceptRenewal, termsVersion: body.termsVersion };
    }
  } catch {
    email = null;
  }

  const config = planConfig();
  if (!config.configured) {
    return NextResponse.json(
      { comingSoon: true, error: "Pro is coming soon. Join the waitlist at support@ridgelineapps.us." },
      { status: 503 },
    );
  }
  const plan = findPlan(config, planId);
  if (!plan) {
    return NextResponse.json({ error: "That plan is not available." }, { status: 400 });
  }
  // Clickwrap (Legal Review clickwrap-spec.md section 2.6): reject unless the required boxes were ticked.
  const consentPlan = { id: plan.id, mode: plan.mode, price: formatProPrice(plan.cents) };
  const notAccepted = consentError(consent, consentPlan, TERMS_VERSION);
  if (notAccepted) {
    return NextResponse.json({ error: notAccepted, consentRequired: true }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    // Acceptance record (spec section 3): Terms version + hash, renewal terms shown, server time.
    const metadata = {
      site: "makeqr.pro",
      plan: plan.id,
      ...acceptanceMetadata({
        plan: consentPlan,
        termsVersion: TERMS_VERSION,
        termsSha256: termsSha256({ pro: PRO_PRICE }),
        privacyVersion: PRIVACY_VERSION,
        now: new Date(),
      }),
    };
    const common = {
      ...(email ? { customer_email: email } : {}),
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${getAppUrl()}/?pro=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/?pro=cancel`,
      metadata,
      // Stripe-hosted unchecked Terms box. Needs the Terms URL (https://makeqr.pro/terms) saved in
      // Stripe Dashboard > Settings > Public details before checkout is turned on, or session creation fails.
      consent_collection: { terms_of_service: "required" as const },
      custom_text: { terms_of_service_acceptance: { message: STRIPE_TERMS_MESSAGE } },
    };
    // Subscriptions only. One-time plans are not offered.
    const session = await stripe.checkout.sessions.create({
      ...common,
      mode: "subscription",
      subscription_data: { metadata },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
