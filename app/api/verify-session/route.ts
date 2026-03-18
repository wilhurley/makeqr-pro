import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ valid: false });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const valid = session.payment_status === "paid" || session.status === "complete";
    const email = session.customer_email || session.customer_details?.email || "";
    return NextResponse.json({ valid, email });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
