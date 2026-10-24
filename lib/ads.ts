/**
 * AdSense is only for visitors the server has confirmed are NOT Pro.
 * Pure helpers (no imports) so they run under plain `node --test`.
 */
export const ADSENSE_CLIENT = "ca-pub-8175259221220756";
export const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

/**
 * Ad region policy (Super Bot for Jason, 2026-10-24, option b).
 * Visitors in the EEA, the UK and Switzerland get NO AdSense at all. Google says even
 * non-personalized ads use cookies for frequency capping and reporting, and that cookie
 * consent is still required there (https://support.google.com/adsense/answer/9007336,
 * https://support.google.com/adsense/answer/7670312). We have no certified consent tool,
 * so we don't load the ad script for these visitors. Unknown country also means no ads.
 */
export const AD_RESTRICTED_COUNTRIES: ReadonlySet<string> = new Set([
  // EU 27
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV",
  "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // Rest of the EEA
  "IS", "LI", "NO",
  // UK and Switzerland
  "GB", "CH",
]);

/** Header Vercel sets to the visitor's ISO 3166-1 alpha-2 country. */
export const COUNTRY_HEADER = "x-vercel-ip-country";

/**
 * True only for a known, well-formed country outside the restricted list.
 * Missing, empty, malformed or placeholder ("XX", "T1" Tor) values fail safe to false.
 */
export function adsAllowedForCountry(country: string | null | undefined): boolean {
  if (typeof country !== "string") return false;
  const code = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return false;
  if (code === "XX" || code === "EU" || code === "UK") return false;
  return !AD_RESTRICTED_COUNTRIES.has(code);
}

/** Header Cloudflare adds (makeqr.pro is proxied through Cloudflare) with the visitor's country. */
export const CF_COUNTRY_HEADER = "cf-ipcountry";

/**
 * Request-level decision. Vercel's header is required; because Cloudflare sits in front,
 * Vercel may geolocate the Cloudflare edge instead of the visitor, so when Cloudflare's own
 * country header is present it must ALSO allow ads. Either one saying restricted/unknown wins.
 */
export function adsAllowedForRequest(vercelCountry: string | null | undefined, cfCountry?: string | null): boolean {
  if (!adsAllowedForCountry(vercelCountry)) return false;
  if (cfCountry === null || cfCountry === undefined) return true;
  return adsAllowedForCountry(cfCountry);
}

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
 * Load ads only on an explicit, successful "not Pro" answer from /api/pro that also
 * says ads are allowed in the visitor's region (`ads: true`).
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
  const b = body as { pro: unknown; ads?: unknown };
  return b.pro === false && b.ads === true;
}
