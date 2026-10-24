import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { findCustomersByEmail, normalizeEmail } from "@/lib/email";
import { sendRestoreEmail } from "@/lib/mailer";
import { customerHasLifetime, findEntitledSubscription } from "@/lib/pro-access";
import { issueRestoreClaims, signRestoreToken } from "@/lib/pro-token";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { RESTORE_DISABLED, RESTORE_JTI_METADATA_KEY, requestRestoreLink, restoreEmailConfigured } from "@/lib/restore";
import { getAppUrl, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 60 * 1000;

/**
 * POST /api/restore. Legal Review 2026-10-24 §3b.2: this never reveals whether an email
 * has Pro and never sets a cookie. With a mail sender configured it emails a single-use
 * sign-in link; without one, restore is off (410).
 */
export async function POST(req: NextRequest) {
  if (!restoreEmailConfigured(process.env)) {
    return NextResponse.json(RESTORE_DISABLED.body, { status: RESTORE_DISABLED.status });
  }

  let rawEmail: unknown = null;
  try {
    const body = await req.json();
    rawEmail = body && typeof body === "object" && "email" in body ? body.email : null;
  } catch {
    rawEmail = null;
  }
  const email = normalizeEmail(rawEmail);
  const allowed = Boolean(email)
    && rateLimit(`restore:ip:${clientIp(req.headers)}`, 8, WINDOW_MS)
    && rateLimit(`restore:email:${email}`, 5, WINDOW_MS);

  const result = await requestRestoreLink(email, allowed, {
    async findEntitledCustomers() {
      const stripe = getStripe();
      const out: { id: string; email: string | null | undefined }[] = [];
      // Case-insensitive: Checkout may have stored "Ada@Example.com".
      for (const customer of await findCustomersByEmail(stripe, rawEmail)) {
        if (customerHasLifetime(customer) || (await findEntitledSubscription(stripe, customer.id))) {
          out.push({ id: customer.id, email: customer.email });
        }
      }
      return out;
    },
    async saveJti(customerId, jti) {
      await getStripe().customers.update(customerId, { metadata: { [RESTORE_JTI_METADATA_KEY]: jti } });
    },
    newJti: () => randomUUID(),
    signToken: (customerId, jti) => signRestoreToken(issueRestoreClaims(customerId, jti)),
    sendLink: sendRestoreEmail,
    appUrl: getAppUrl(),
    log: (message) => console.error(message),
  });
  return NextResponse.json(result.body, { status: result.status });
}
