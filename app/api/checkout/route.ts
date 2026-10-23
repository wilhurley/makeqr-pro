import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/email";
import { getAppUrl, getProPriceId, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let email: string | null = null;
  try {
    const body = await req.json();
    email = normalizeEmail(body && typeof body === "object" && "email" in body ? body.email : null);
  } catch {
    email = null;
  }

  // Never fall back to the legacy NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ($4.99 Price).
  const priceId = getProPriceId();
  if (!priceId) {
    return NextResponse.json(
      { comingSoon: true, error: "Pro is coming soon. You have not been charged." },
      { status: 503 },
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(email ? { customer_email: email } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getAppUrl()}/?pro=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/?pro=cancel`,
      metadata: { source: "makeqr.pro" },
      subscription_data: { metadata: { source: "makeqr.pro" } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
