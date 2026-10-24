import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/email";
import { automaticTaxOn, findPlan, isPlanId, planConfig, STATEMENT_DESCRIPTOR_SUFFIX, type PlanId } from "@/lib/plans";
import { getAppUrl, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let email: string | null = null;
  let planId: PlanId = "monthly";
  let consent = false;
  try {
    const body = await req.json();
    if (body && typeof body === "object") {
      email = normalizeEmail("email" in body ? body.email : null);
      if ("plan" in body && isPlanId(body.plan)) planId = body.plan;
      consent = "consent" in body && body.consent === true;
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

  // Auto-renew consent: the unchecked box next to the button (ROSCA / CA ARL). Required for subscriptions.
  if (plan.mode === "subscription" && !consent) {
    return NextResponse.json(
      { error: "Please tick the box to confirm Pro renews monthly until you cancel." },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const consentAt = new Date().toISOString();
    const metadata: Record<string, string> = {
      source: "makeqr.pro",
      plan: plan.id,
      statement_descriptor_suffix: STATEMENT_DESCRIPTOR_SUFFIX,
      ...(plan.mode === "subscription" ? { renewal_consent: "true", renewal_consent_at: consentAt } : {}),
    };
    // Ohio tax stays off until Jason's vendor's license (STRIPE_AUTOMATIC_TAX=on).
    const tax = automaticTaxOn() ? { automatic_tax: { enabled: true } } : {};
    const common = {
      ...(email ? { customer_email: email } : {}),
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${getAppUrl()}/?pro=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/pro/cancel`,
      metadata,
      ...tax,
    };
    const session =
      plan.mode === "payment"
        ? await stripe.checkout.sessions.create({
            ...common,
            mode: "payment",
            // Lifetime Pro is recorded on the Customer, so one must exist.
            customer_creation: "always",
            payment_intent_data: { metadata, statement_descriptor_suffix: STATEMENT_DESCRIPTOR_SUFFIX },
          })
        : await stripe.checkout.sessions.create({
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
