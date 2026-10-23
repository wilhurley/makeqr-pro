import { NextRequest, NextResponse } from "next/server";
import { findCustomersByEmail, normalizeEmail } from "@/lib/email";
import { claimsForSubscription, findEntitledSubscription } from "@/lib/pro-access";
import { withProCookie } from "@/lib/pro-cookie";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  let rawEmail: unknown = null;
  try {
    const body = await req.json();
    rawEmail = body && typeof body === "object" && "email" in body ? body.email : null;
  } catch {
    rawEmail = null;
  }
  const email = normalizeEmail(rawEmail);
  if (!email) {
    return NextResponse.json({ pro: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const ip = clientIp(req.headers);
  if (!rateLimit(`restore:ip:${ip}`, 8, WINDOW_MS) || !rateLimit(`restore:email:${email}`, 5, WINDOW_MS)) {
    return NextResponse.json(
      { pro: false, error: "Too many restore attempts. Try again later." },
      { status: 429 },
    );
  }

  try {
    const stripe = getStripe();
    // Case-insensitive: Checkout may have stored "Ada@Example.com".
    const customers = await findCustomersByEmail(stripe, rawEmail);
    for (const customer of customers) {
      const subscription = await findEntitledSubscription(stripe, customer.id);
      if (!subscription) continue;
      const claims = claimsForSubscription(subscription, customer.id);
      if (!claims) continue;
      // Restore proves only that someone knows the email, so it unlocks Pro features
      // on this browser but never billing access (no qr_billing cookie). Managing
      // billing from a restored browser goes through Stripe's emailed sign-in link.
      return withProCookie(NextResponse.json({ pro: true, billing: false }), claims);
    }
    return NextResponse.json(
      { pro: false, error: "No active subscription found for that email." },
      { status: 404 },
    );
  } catch (err) {
    console.error("restore failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { pro: false, error: "Could not look up that subscription. Try again." },
      { status: 500 },
    );
  }
}
