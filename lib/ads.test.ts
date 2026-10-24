import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCheckoutReturn, shouldLoadAds } from "./ads.ts";

describe("ads gating", () => {
  it("loads ads only on an explicit successful not-Pro answer", () => {
    assert.equal(shouldLoadAds("", { ok: true, body: { pro: false } }), true);
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
      assert.equal(shouldLoadAds(search, { ok: true, body: { pro: false } }), false, search);
    }
    assert.equal(isCheckoutReturn("?pro=cancel"), false);
  });
});
