/**
 * Checkout return handling. Pure, shared by the page and tests.
 * A Checkout Session id is kept until /api/verify-session confirms it, so a failed
 * or interrupted activation can be retried (button, reload, or the hourly check).
 */
export const PENDING_SESSION_KEY = "makeqr_pending_checkout_session";

export function isCheckoutSessionId(value: unknown): value is string {
  return typeof value === "string" && /^cs_[A-Za-z0-9_]{1,250}$/.test(value);
}

/** Only an HTTP 2xx with `{ valid: true }` activates. Anything else keeps the session for retry. */
export function activationSucceeded(res: { ok: boolean } | null, body: unknown): boolean {
  if (!res || !res.ok) return false;
  return Boolean(body && typeof body === "object" && (body as { valid?: unknown }).valid === true);
}

/** Session to verify: the one in the return URL, else one saved from an earlier failed attempt. */
export function pendingSessionId(search: string, saved: string | null): string | null {
  const params = new URLSearchParams(search);
  const fromUrl = params.get("pro") === "success" ? params.get("session_id") : null;
  if (isCheckoutSessionId(fromUrl)) return fromUrl;
  return isCheckoutSessionId(saved) ? saved : null;
}
