import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  claimsForLifetime,
  claimsForSubscription,
  customerHasLifetime,
  customerIsBlocked,
  findEntitledSubscription,
} from "@/lib/pro-access";
import { withBillingCookie, withProCookie } from "@/lib/pro-cookie";
import { issueBillingClaims, verifyRestoreToken } from "@/lib/pro-token";
import { RESTORE_JTI_METADATA_KEY, restoreEmailConfigured, restoreJtiMatches } from "@/lib/restore";
import { getAppUrl, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function done(state: "ok" | "expired") {
  const res = NextResponse.redirect(`${getAppUrl()}/?restore=${state}`, 303);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

/**
 * GET /api/restore/verify?t=... The emailed link proves the person controls the inbox
 * Stripe has on file. Single use (jti on the Customer is cleared) and 15 minutes.
 */
export async function GET(req: NextRequest) {
  if (!restoreEmailConfigured(process.env)) return done("expired");
  let claims;
  try {
    claims = verifyRestoreToken(req.nextUrl.searchParams.get("t") ?? "");
  } catch {
    claims = null;
  }
  if (!claims) return done("expired");

  try {
    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(claims.cus);
    if (customerIsBlocked(customer)) return done("expired");
    const stored = (customer as Stripe.Customer).metadata?.[RESTORE_JTI_METADATA_KEY];
    if (!restoreJtiMatches(stored, claims.jti)) return done("expired");
    // Burn the link before issuing anything.
    await stripe.customers.update(claims.cus, { metadata: { [RESTORE_JTI_METADATA_KEY]: "" } });

    let pro = null;
    if (customerHasLifetime(customer)) {
      pro = claimsForLifetime(claims.cus);
    } else {
      const subscription = await findEntitledSubscription(stripe, claims.cus);
      pro = subscription ? claimsForSubscription(subscription, claims.cus) : null;
    }
    if (!pro) return done("expired");
    // Inbox ownership is proven, so billing access is acceptable here too.
    return withBillingCookie(withProCookie(done("ok"), pro), issueBillingClaims(claims.cus));
  } catch (err) {
    console.error("restore verify failed", err instanceof Error ? err.message : "unknown");
    return done("expired");
  }
}
