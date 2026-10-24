/**
 * Email restore without leaking or unlocking anything (Legal Review 2026-10-24 §3b.2).
 * Pure (type-only imports, dependencies injected) so it runs under plain `node --test`.
 *
 * - With an email sender configured, POST /api/restore emails a single-use, 15-minute
 *   sign-in link to the address Stripe has on file, and always returns the same
 *   response, whether or not the email has Pro.
 * - Without one, restore is off (HTTP 410) and users manage billing through Stripe's
 *   own emailed portal sign-in link.
 *
 * Never call stripe.billingPortal.sessions.create with a customer found by email.
 */
export const RESTORE_GENERIC_MESSAGE =
  "If that email has MakeQR Pro, we've emailed a sign-in link. It expires in 15 minutes.";
export const RESTORE_DISABLED_MESSAGE =
  "To manage billing, use the Stripe sign-in link; for help, email wil@ridgelineapps.us.";

/** Stripe Customer metadata key holding the current single-use link id. */
export const RESTORE_JTI_METADATA_KEY = "makeqr_restore_jti";

export type RestoreResponse = { status: number; body: { ok: boolean; message: string } };

export const RESTORE_GENERIC: RestoreResponse = { status: 200, body: { ok: true, message: RESTORE_GENERIC_MESSAGE } };
export const RESTORE_DISABLED: RestoreResponse = { status: 410, body: { ok: false, message: RESTORE_DISABLED_MESSAGE } };

/** Magic-link restore needs a mail sender. Both values are required. */
export function restoreEmailConfigured(env: Record<string, string | undefined>): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.RESTORE_EMAIL_FROM?.trim());
}

export type RestoreDeps = {
  /** Stripe customers with this email that currently have Pro (lifetime or an entitled subscription). */
  findEntitledCustomers(email: string): Promise<{ id: string; email: string | null | undefined }[]>;
  /** Store the link id on the Customer; any earlier unused link stops working. */
  saveJti(customerId: string, jti: string): Promise<void>;
  newJti(): string;
  signToken(customerId: string, jti: string): string;
  sendLink(to: string, link: string): Promise<void>;
  appUrl: string;
  log?(message: string): void;
};

/**
 * Always resolves to RESTORE_GENERIC, so the response never says whether an email has
 * Pro, and never sets a cookie. Only the inbox owner can finish the restore.
 */
export async function requestRestoreLink(
  email: string | null,
  allowed: boolean,
  deps: RestoreDeps,
): Promise<RestoreResponse> {
  if (!email || !allowed) return RESTORE_GENERIC;
  try {
    const customers = await deps.findEntitledCustomers(email);
    const customer = customers.find((c) => typeof c.email === "string" && c.email.length > 0);
    if (!customer || !customer.email) return RESTORE_GENERIC;
    const jti = deps.newJti();
    await deps.saveJti(customer.id, jti);
    const token = deps.signToken(customer.id, jti);
    await deps.sendLink(customer.email, `${deps.appUrl}/api/restore/verify?t=${encodeURIComponent(token)}`);
  } catch (err) {
    deps.log?.(`restore link failed: ${err instanceof Error ? err.message : "unknown"}`);
  }
  return RESTORE_GENERIC;
}

/** The link is valid only if the Customer still holds the same, non-empty jti. */
export function restoreJtiMatches(stored: string | null | undefined, claimed: string): boolean {
  return typeof stored === "string" && stored.length > 0 && stored === claimed;
}
