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

/**
 * What to do with a pending Checkout Session after /api/verify-session answers.
 * "drop": the session was already used or is over an hour old (HTTP 410), so retrying
 * can never work. Forget it; Pro still comes from the cookie or a restore link.
 */
export function activationOutcome(
  res: { ok: boolean; status?: number } | null,
  body: unknown,
): "activated" | "retry" | "drop" {
  if (activationSucceeded(res, body)) return "activated";
  if (res && res.status === 410) return "drop";
  return "retry";
}

/** Query params that must not stay in the address bar (history, screenshots, Referer). */
export const SENSITIVE_RETURN_PARAMS = ["session_id", "pro", "t"] as const;

/** The same URL with checkout/restore secrets removed. Keeps unrelated params and the hash. */
export function scrubbedUrl(pathname: string, search: string, hash = ""): string {
  const params = new URLSearchParams(search);
  for (const key of SENSITIVE_RETURN_PARAMS) params.delete(key);
  const rest = params.toString();
  return `${pathname}${rest ? `?${rest}` : ""}${hash}`;
}
