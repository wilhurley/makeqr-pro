import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutConfig } from "./checkout-config.ts";

describe("checkout price id", () => {
  it("never falls back to the legacy NEXT_PUBLIC_STRIPE_PRO_PRICE_ID", () => {
    const config = checkoutConfig({ STRIPE_SECRET_KEY: "sk_test_x", CHECKOUT_ENABLED: "on", NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: "price_legacy_499" });
    assert.deepEqual(config, { configured: false, priceId: null });
  });

  it("is coming soon without STRIPE_PRO_PRICE_ID or the secret key", () => {
    assert.equal(checkoutConfig({}).configured, false);
    assert.equal(checkoutConfig({ STRIPE_SECRET_KEY: "sk_test_x", CHECKOUT_ENABLED: "on", STRIPE_PRO_PRICE_ID: "  " }).configured, false);
    assert.equal(checkoutConfig({ STRIPE_PRO_PRICE_ID: "price_new" }).configured, false);
  });

  it("uses STRIPE_PRO_PRICE_ID even when the legacy variable is also set", () => {
    const config = checkoutConfig({
      STRIPE_SECRET_KEY: "sk_test_x", CHECKOUT_ENABLED: "on",
      STRIPE_PRO_PRICE_ID: "price_new",
      NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: "price_legacy_499",
    });
    assert.deepEqual(config, { configured: true, priceId: "price_new" });
  });
});

describe("CHECKOUT_ENABLED gate (test mode)", () => {
  const env = { STRIPE_SECRET_KEY: "sk_test_x", STRIPE_PRO_PRICE_ID: "price_new" };
  it("is off by default", () => {
    assert.equal(checkoutConfig(env).configured, false);
  });
  it("turns on with CHECKOUT_ENABLED=on", () => {
    assert.equal(checkoutConfig({ ...env, CHECKOUT_ENABLED: "on" }).configured, true);
  });
  it("refuses a live key unless STRIPE_ALLOW_LIVE=yes", () => {
    const live = { ...env, CHECKOUT_ENABLED: "on", STRIPE_SECRET_KEY: "sk_" + "live_x" };
    assert.equal(checkoutConfig(live).configured, false);
    assert.equal(checkoutConfig({ ...live, STRIPE_ALLOW_LIVE: "yes" }).configured, true);
  });
});
