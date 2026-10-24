/**
 * One-time, short-lived Checkout Session redemption (Legal Review 2026-10-24 §3b.1).
 * Pure (no imports) so it runs under plain `node --test`.
 *
 * A Checkout Session id (`cs_...`) in the success URL is a bearer credential: whoever
 * holds it could mint a billing-portal cookie. So a session can mint cookies once,
 * and only within an hour of being created.
 */
export const SESSION_REDEEM_WINDOW_SECONDS = 60 * 60;
/** Set on the Checkout Session's metadata once it has minted cookies. */
export const SESSION_REDEEMED_METADATA_KEY = "qr_billing_issued";

export type RedeemableSession = {
  id: string;
  created: number;
  metadata?: Record<string, string> | null;
};

export type RedeemCheck = "ok" | "expired" | "used";

export function checkSessionRedeemable(session: RedeemableSession, nowMs = Date.now()): RedeemCheck {
  if (session.metadata?.[SESSION_REDEEMED_METADATA_KEY] === "1") return "used";
  const created = Number(session.created);
  if (!Number.isFinite(created) || created <= 0) return "expired";
  const ageSeconds = Math.floor(nowMs / 1000) - created;
  if (ageSeconds > SESSION_REDEEM_WINDOW_SECONDS) return "expired";
  return "ok";
}

/** Metadata to write back so the session can't be redeemed again. Keeps existing keys. */
export function redeemedMetadata(session: RedeemableSession): Record<string, string> {
  return { ...(session.metadata ?? {}), [SESSION_REDEEMED_METADATA_KEY]: "1" };
}

/** Body + status for a used or expired session. Same answer for both, so it leaks nothing. */
export const SESSION_USED_OR_EXPIRED = { body: { valid: false, reason: "used_or_expired" }, status: 410 } as const;

/**
 * Best-effort in-process guard against two concurrent redemptions of the same session
 * (Stripe metadata has no compare-and-set). Serverless isolates don't share it.
 */
const inflight = new Set<string>();
export function beginRedeem(sessionId: string): boolean {
  if (inflight.has(sessionId)) return false;
  if (inflight.size > 5000) inflight.clear();
  inflight.add(sessionId);
  return true;
}
export function endRedeem(sessionId: string): void {
  inflight.delete(sessionId);
}
