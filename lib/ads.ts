/**
 * AdSense is only for visitors the server has confirmed are NOT Pro.
 * Pure helpers (no imports) so they run under plain `node --test`.
 */
export const ADSENSE_CLIENT = "ca-pub-8175259221220756";
export const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

/**
 * Returning from Stripe Checkout: the Pro cookie may not be set yet, so this
 * page load never shows ads. The next page load decides normally.
 */
export function isCheckoutReturn(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.has("session_id") || params.get("pro") === "success" || params.get("billing") === "return"
    || params.has("restore");
}

/**
 * Load ads only on an explicit, successful "not Pro" answer from /api/pro.
 * Unknown, errors, or anything malformed means no ads (the "No ads" promise wins).
 */
export function shouldLoadAds(
  search: string,
  response: { ok: boolean; body: unknown } | null,
  pendingCheckout = false,
): boolean {
  // The checkout page strips session_id from the URL immediately (Legal Review §3b.1),
  // so a saved pending session also counts as a checkout return.
  if (pendingCheckout || isCheckoutReturn(search)) return false;
  if (!response || !response.ok) return false;
  const body = response.body;
  if (!body || typeof body !== "object" || !("pro" in body)) return false;
  return (body as { pro: unknown }).pro === false;
}
