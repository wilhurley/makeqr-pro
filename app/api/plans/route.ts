import { NextResponse } from "next/server";
import { planConfig } from "@/lib/plans";
import { formatProPrice } from "@/lib/pricing";
import { PRO_SALE_TERMS_PUBLISHED } from "@/lib/terms-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: which Pro plans checkout can sell right now. Never returns Stripe ids. */
export async function GET() {
  const config = planConfig();
  // Legal memo 2026-10-24 §3j: nothing is on sale until paid-terms Terms are published.
  const onSale = config.configured && PRO_SALE_TERMS_PUBLISHED;
  return NextResponse.json(
    {
      configured: onSale,
      plans: (onSale ? config.plans : []).map((plan) => ({
        id: plan.id,
        price: formatProPrice(plan.cents),
        per: plan.per,
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
