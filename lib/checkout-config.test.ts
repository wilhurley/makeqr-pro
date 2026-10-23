import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutConfig } from "./checkout-config.ts";

describe("checkout price id", () => {
  it("never falls back to the legacy NEXT_PUBLIC_STRIPE_PRO_PRICE_ID", () => {
    const config = checkoutConfig({ STRIPE_SECRET_KEY: "sk_test_x", NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: "price_legacy_499" });
    assert.deepEqual(config, { configured: false, priceId: null });
  });

  it("is coming soon without STRIPE_PRO_PRICE_ID or the secret key", () => {
    assert.equal(checkoutConfig({}).configured, false);
    assert.equal(checkoutConfig({ STRIPE_SECRET_KEY: "sk_test_x", STRIPE_PRO_PRICE_ID: "  " }).configured, false);
    assert.equal(checkoutConfig({ STRIPE_PRO_PRICE_ID: "price_new" }).configured, false);
  });

  it("uses STRIPE_PRO_PRICE_ID even when the legacy variable is also set", () => {
    const config = checkoutConfig({
      STRIPE_SECRET_KEY: "sk_test_x",
      STRIPE_PRO_PRICE_ID: "price_new",
      NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: "price_legacy_499",
    });
    assert.deepEqual(config, { configured: true, priceId: "price_new" });
  });
});
