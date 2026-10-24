import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AD_RESTRICTED_COUNTRIES, adsAllowedForCountry, adsAllowedForRequest, isCheckoutReturn, shouldLoadAds } from "./ads.ts";

describe("ads gating", () => {
  it("loads ads only on an explicit successful not-Pro answer", () => {
    assert.equal(shouldLoadAds("", { ok: true, body: { pro: false, ads: true } }), true);
  });

  it("never loads ads for Pro (monthly, yearly or lifetime all answer pro: true)", () => {
    assert.equal(shouldLoadAds("", { ok: true, body: { pro: true } }), false);
  });

  it("does not load ads when the answer is unknown, failed or malformed", () => {
    assert.equal(shouldLoadAds("", null), false);
    assert.equal(shouldLoadAds("", { ok: false, body: { pro: false } }), false);
    assert.equal(shouldLoadAds("", { ok: true, body: null }), false);
    assert.equal(shouldLoadAds("", { ok: true, body: {} }), false);
    assert.equal(shouldLoadAds("", { ok: true, body: { pro: "false" } }), false);
    assert.equal(shouldLoadAds("", { ok: true, body: "nope" }), false);
  });

  it("skips ads on the page load that returns from Checkout or the billing portal", () => {
    for (const search of ["?pro=success&session_id=cs_1", "?session_id=cs_1", "?billing=return"]) {
      assert.equal(isCheckoutReturn(search), true, search);
      assert.equal(shouldLoadAds(search, { ok: true, body: { pro: false, ads: true } }), false, search);
    }
    assert.equal(isCheckoutReturn("?pro=cancel"), false);
  });
});

describe("ad region policy (no AdSense in the EEA, UK or Switzerland)", () => {
  it("restricted: every EU/EEA country plus GB and CH gets no ads", () => {
    const expected = [
      "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV",
      "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
    ];
    assert.equal(AD_RESTRICTED_COUNTRIES.size, expected.length);
    for (const code of expected) {
      assert.equal(adsAllowedForCountry(code), false, code);
      assert.equal(adsAllowedForCountry(code.toLowerCase()), false, code.toLowerCase());
    }
  });

  it("unrestricted: known countries outside the list get ads", () => {
    for (const code of ["US", "CA", "MX", "AU", "JP", "IN", "BR", " us "]) {
      assert.equal(adsAllowedForCountry(code), true, code);
    }
  });

  it("unknown: missing, empty, malformed or placeholder country fails safe to no ads", () => {
    for (const value of [null, undefined, "", "   ", "XX", "EU", "UK", "T1", "USA", "1", "U"]) {
      assert.equal(adsAllowedForCountry(value as string | null | undefined), false, String(value));
    }
  });

  it("the client loads ads only when /api/pro says ads: true", () => {
    assert.equal(shouldLoadAds("", { ok: true, body: { pro: false, ads: true } }), true);
    assert.equal(shouldLoadAds("", { ok: true, body: { pro: false, ads: false } }), false); // restricted or unknown
    assert.equal(shouldLoadAds("", { ok: true, body: { pro: false } }), false); // older/missing flag
    assert.equal(shouldLoadAds("", { ok: true, body: { pro: false, ads: "true" } }), false);
    assert.equal(shouldLoadAds("", { ok: true, body: { pro: true, ads: true } }), false);
  });

  it("end to end with the country header value: US loads, DE/GB/CH/unknown don't", () => {
    const answer = (country: string | null) => ({ ok: true, body: { pro: false, ads: adsAllowedForCountry(country) } });
    assert.equal(shouldLoadAds("", answer("US")), true);
    for (const c of ["DE", "GB", "CH", null, "XX"]) assert.equal(shouldLoadAds("", answer(c)), false, String(c));
  });

  it("request: Vercel header required; a Cloudflare header, when present, must also allow", () => {
    assert.equal(adsAllowedForRequest("US", null), true);
    assert.equal(adsAllowedForRequest("US", "US"), true);
    assert.equal(adsAllowedForRequest("US", "DE"), false); // Cloudflare says EEA
    assert.equal(adsAllowedForRequest("US", "XX"), false); // Cloudflare unknown
    assert.equal(adsAllowedForRequest("DE", "US"), false); // Vercel says EEA
    assert.equal(adsAllowedForRequest(null, "US"), false); // Vercel unknown
    assert.equal(adsAllowedForRequest(null, null), false);
  });
});
