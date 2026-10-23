import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/email";
import {
  claimsForLifetime,
  claimsForSubscription,
  customerHasLifetime,
  findEntitledSubscription,
} from "@/lib/pro-access";
import { withProCookie } from "@/lib/pro-cookie";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  let email: string | null = null;
  try {
    const body = await req.json();
    email = normalizeEmail(body && typeof body === "object" && "email" in body ? body.email : null);
  } catch {
    email = null;
  }
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
    const customers = await stripe.customers.list({ email, limit: 10 });
    for (const customer of customers.data) {
      if (customerHasLifetime(customer)) {
        return withProCookie(NextResponse.json({ pro: true }), claimsForLifetime(customer.id));
      }
      const subscription = await findEntitledSubscription(stripe, customer.id);
      if (!subscription) continue;
      const claims = claimsForSubscription(subscription, customer.id);
      if (!claims) continue;
      return withProCookie(NextResponse.json({ pro: true }), claims);
    }
    return NextResponse.json(
      { pro: false, error: "No active Pro plan found for that email." },
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
