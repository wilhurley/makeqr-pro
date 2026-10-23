import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findPlan,
  isPlanId,
  LIFETIME_BADGE,
  lifetimeGrantFromSession,
  lifetimeRevokedByRefund,
  planConfig,
} from "./plans.ts";
import {
  claimsNeedRefresh,
  isEntitledStatus,
  isLifetimeClaims,
  issueClaims,
  LIFETIME_STATUS,
  LIFETIME_SUB,
  signProToken,
  verifyProToken,
} from "./pro-token.ts";

const BASE = { STRIPE_SECRET_KEY: "sk_test_x", STRIPE_PRO_PRICE_ID: "price_month" };

describe("plan config", () => {
  it("is not configured without the secret key or the monthly price", () => {
    assert.deepEqual(planConfig({}), { configured: false, plans: [] });
    assert.equal(planConfig({ STRIPE_SECRET_KEY: "sk_test_x" }).configured, false);
    assert.equal(planConfig({ STRIPE_PRO_PRICE_ID: "price_month" }).configured, false);
    assert.equal(planConfig({ STRIPE_SECRET_KEY: "  ", STRIPE_PRO_PRICE_ID: "price_month" }).configured, false);
    // Yearly/lifetime alone never turn checkout on.
    assert.equal(
      planConfig({ STRIPE_SECRET_KEY: "sk", STRIPE_PRO_YEARLY_PRICE_ID: "p_y", STRIPE_PRO_LIFETIME_PRICE_ID: "p_l" }).configured,
      false,
    );
  });

  it("offers only monthly at $3.99 when only the monthly price is set", () => {
    const config = planConfig(BASE);
    assert.equal(config.configured, true);
    assert.deepEqual(config.plans.map((p) => [p.id, p.cents, p.mode]), [["monthly", 399, "subscription"]]);
  });

  it("accepts the legacy NEXT_PUBLIC_STRIPE_PRO_PRICE_ID", () => {
    const config = planConfig({ STRIPE_SECRET_KEY: "sk", NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: "price_legacy" });
    assert.equal(findPlan(config, "monthly")?.priceId, "price_legacy");
  });

  it("adds yearly ($29) and lifetime ($39, one-time) only when their price ids are set", () => {
    const yearlyOnly = planConfig({ ...BASE, STRIPE_PRO_YEARLY_PRICE_ID: "price_year" });
    assert.deepEqual(yearlyOnly.plans.map((p) => p.id), ["monthly", "yearly"]);
    assert.equal(findPlan(yearlyOnly, "lifetime"), null);

    const all = planConfig({ ...BASE, STRIPE_PRO_YEARLY_PRICE_ID: "price_year", STRIPE_PRO_LIFETIME_PRICE_ID: "price_life" });
    assert.deepEqual(all.plans.map((p) => [p.id, p.cents, p.mode, p.priceId]), [
      ["monthly", 399, "subscription", "price_month"],
      ["yearly", 2900, "subscription", "price_year"],
      ["lifetime", 3900, "payment", "price_life"],
    ]);
    assert.equal(findPlan(all, "lifetime")?.badge, "Launch lifetime deal, limited");
    assert.equal(LIFETIME_BADGE, "Launch lifetime deal, limited");
  });

  it("uses the display-price env vars and ignores bad values", () => {
    const config = planConfig({
      ...BASE,
      STRIPE_PRO_YEARLY_PRICE_ID: "price_year",
      STRIPE_PRO_LIFETIME_PRICE_ID: "price_life",
      NEXT_PUBLIC_PRO_PRICE_CENTS: "500",
      NEXT_PUBLIC_PRO_YEARLY_PRICE_CENTS: "3500",
      NEXT_PUBLIC_PRO_LIFETIME_PRICE_CENTS: "nope",
    });
    assert.deepEqual(config.plans.map((p) => p.cents), [500, 3500, 3900]);
  });

  it("only accepts known plan ids from the browser", () => {
    for (const id of ["monthly", "yearly", "lifetime"]) assert.equal(isPlanId(id), true);
    for (const id of ["", "Lifetime", "free", null, 1]) assert.equal(isPlanId(id), false);
  });
});

describe("lifetime grant", () => {
  const paid = {
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    metadata: { plan: "lifetime", source: "makeqr.pro" },
    customer: "cus_1",
    payment_intent: "pi_1",
  };

  it("grants for a paid lifetime one-time session", () => {
    assert.deepEqual(lifetimeGrantFromSession(paid), { customerId: "cus_1", paymentIntentId: "pi_1" });
    assert.deepEqual(
      lifetimeGrantFromSession({ ...paid, customer: { id: "cus_2" }, payment_intent: { id: "pi_2" } }),
      { customerId: "cus_2", paymentIntentId: "pi_2" },
    );
  });

  it("does not grant for subscriptions, unpaid, incomplete, other plans, or missing ids", () => {
    assert.equal(lifetimeGrantFromSession({ ...paid, mode: "subscription" }), null);
    assert.equal(lifetimeGrantFromSession({ ...paid, payment_status: "unpaid" }), null);
    assert.equal(lifetimeGrantFromSession({ ...paid, status: "open" }), null);
    assert.equal(lifetimeGrantFromSession({ ...paid, metadata: { plan: "monthly" } }), null);
    assert.equal(lifetimeGrantFromSession({ ...paid, metadata: null }), null);
    assert.equal(lifetimeGrantFromSession({ ...paid, customer: null }), null);
    assert.equal(lifetimeGrantFromSession({ ...paid, payment_intent: null }), null);
  });

  it("revokes only on a full refund of the recorded payment", () => {
    assert.equal(lifetimeRevokedByRefund({ refunded: true, payment_intent: "pi_1" }, "pi_1"), true);
    assert.equal(lifetimeRevokedByRefund({ refunded: false, payment_intent: "pi_1" }, "pi_1"), false);
    assert.equal(lifetimeRevokedByRefund({ refunded: true, payment_intent: "pi_other" }, "pi_1"), false);
    assert.equal(lifetimeRevokedByRefund({ refunded: true, payment_intent: "pi_1" }, undefined), false);
  });
});

describe("lifetime cookie", () => {
  it("signs and verifies a lifetime cookie that never needs a period-end refresh", () => {
    process.env.PRO_COOKIE_SECRET = "test-secret-should-be-long-enough";
    try {
      const now = 1_700_000_000_000;
      const claims = issueClaims({ sub: LIFETIME_SUB, cus: "cus_1", status: LIFETIME_STATUS, periodEnd: 0, now });
      const parsed = verifyProToken(signProToken(claims));
      assert.ok(parsed);
      assert.equal(isLifetimeClaims(parsed), true);
      assert.equal(isEntitledStatus(parsed.st), true);
      assert.equal(claimsNeedRefresh(parsed, now + 60_000), false);
      // Still re-checked against Stripe hourly so a refund or dispute takes effect.
      assert.equal(claimsNeedRefresh(parsed, now + 2 * 60 * 60 * 1000), true);
    } finally {
      delete process.env.PRO_COOKIE_SECRET;
    }
  });

  it("still rejects made-up sub values", () => {
    process.env.PRO_COOKIE_SECRET = "test-secret-should-be-long-enough";
    try {
      const forged = issueClaims({ sub: "lifetime-forever", cus: "cus_1", status: "lifetime", periodEnd: 0 });
      assert.equal(verifyProToken(signProToken(forged)), null);
    } finally {
      delete process.env.PRO_COOKIE_SECRET;
    }
  });
});
