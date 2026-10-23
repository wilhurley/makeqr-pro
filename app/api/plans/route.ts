import { NextResponse } from "next/server";
import { planConfig } from "@/lib/plans";
import { formatProPrice } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: which Pro plans checkout can sell right now. Never returns Stripe ids. */
export async function GET() {
  const config = planConfig();
  return NextResponse.json(
    {
      configured: config.configured,
      plans: config.plans.map((plan) => ({
        id: plan.id,
        price: formatProPrice(plan.cents),
        per: plan.per,
        ...(plan.badge ? { badge: plan.badge } : {}),
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
