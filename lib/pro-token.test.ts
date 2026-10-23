import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { normalizeEmail } from "./email.ts";
import { formatProPrice, getProPriceCents, proPriceAmount } from "./pricing.ts";
import {
  BILLING_COOKIE_TTL_SECONDS,
  claimsNeedRefresh,
  issueBillingClaims,
  issueClaims,
  isEntitledStatus,
  PRO_COOKIE_TTL_SECONDS,
  signBillingToken,
  signProToken,
  verifyBillingToken,
  verifyProToken,
} from "./pro-token.ts";

const SECRET = "test-secret-should-be-long-enough";

afterEach(() => {
  delete process.env.PRO_COOKIE_SECRET;
  delete process.env.NEXT_PUBLIC_PRO_PRICE_CENTS;
});

describe("entitlement", () => {
  it("allows active and trialing subscriptions and rejects every other status", () => {
    assert.equal(isEntitledStatus("active"), true);
    assert.equal(isEntitledStatus("trialing"), true);
    for (const status of ["past_due", "canceled", "unpaid", "incomplete", "incomplete_expired", "paused"]) {
      assert.equal(isEntitledStatus(status), false, status);
    }
  });
});

describe("pro cookie", () => {
  it("round-trips a signed token and rejects tampering", () => {
    process.env.PRO_COOKIE_SECRET = SECRET;
    const claims = issueClaims({
      sub: "sub_123",
      cus: "cus_123",
      status: "active",
      periodEnd: 2_000_000_000,
      now: 1_700_000_000_000,
    });
    const token = signProToken(claims);
    const now = 1_700_000_000_000 + 1_000;
    assert.deepEqual(verifyProToken(token, now), claims);

    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
    assert.equal(verifyProToken(tampered, now), null);
    assert.equal(verifyProToken("not-a-token"), null);
    assert.equal(verifyProToken(""), null);
  });

  it("does not accept a token signed with a different secret", () => {
    process.env.PRO_COOKIE_SECRET = SECRET;
    const token = signProToken(
      issueClaims({ sub: "sub_123", cus: "cus_123", status: "active", periodEnd: 0, now: 1_700_000_000_000 }),
    );
    process.env.PRO_COOKIE_SECRET = "a-different-secret-value";
    assert.equal(verifyProToken(token, 1_700_000_000_000), null);
  });

  it("rejects a correctly signed token once exp has passed", () => {
    process.env.PRO_COOKIE_SECRET = SECRET;
    const issuedAt = 1_700_000_000_000;
    const claims = issueClaims({ sub: "sub_123", cus: "cus_123", status: "active", periodEnd: 0, now: issuedAt });
    const token = signProToken(claims);
    const expiresAt = issuedAt + PRO_COOKIE_TTL_SECONDS * 1000;
    assert.deepEqual(verifyProToken(token, expiresAt - 1), claims, "valid just before exp");
    assert.equal(verifyProToken(token, expiresAt), null, "rejected at exp");
    assert.equal(verifyProToken(token, expiresAt + 86_400_000), null, "rejected after exp");
    // Real clock: a token issued in 2023 is long expired.
    assert.equal(verifyProToken(token), null);
  });

  it("asks Stripe again after an hour, when the period ends, or the status is not entitled", () => {
    const now = 1_700_000_000_000;
    const fresh = issueClaims({
      sub: "sub_123",
      cus: "cus_123",
      status: "active",
      periodEnd: Math.floor(now / 1000) + 86_400,
      now,
    });
    assert.equal(claimsNeedRefresh(fresh, now + 1_000), false);
    assert.equal(claimsNeedRefresh(fresh, now + 60 * 60 * 1000), true);
    assert.equal(
      claimsNeedRefresh({ ...fresh, pe: Math.floor(now / 1000) - 1 }, now),
      true,
    );
    assert.equal(claimsNeedRefresh({ ...fresh, st: "canceled" }, now), true);
  });
});

describe("billing cookie", () => {
  it("round-trips, expires, and is not interchangeable with the Pro cookie", () => {
    process.env.PRO_COOKIE_SECRET = SECRET;
    const issuedAt = 1_700_000_000_000;
    const billing = issueBillingClaims("cus_123", issuedAt);
    const token = signBillingToken(billing);
    const expiresAt = issuedAt + BILLING_COOKIE_TTL_SECONDS * 1000;
    assert.deepEqual(verifyBillingToken(token, issuedAt + 1), billing);
    assert.equal(verifyBillingToken(token, expiresAt), null);

    // A Pro token (which email restore can issue) never authorizes billing, and vice versa.
    const pro = signProToken(issueClaims({ sub: "sub_1", cus: "cus_123", status: "active", periodEnd: 0, now: issuedAt }));
    assert.equal(verifyBillingToken(pro, issuedAt + 1), null);
    assert.equal(verifyProToken(token, issuedAt + 1), null);
  });

  it("rejects billing claims for a non-customer id", () => {
    process.env.PRO_COOKIE_SECRET = SECRET;
    const token = signBillingToken({ ...issueBillingClaims("cus_1", 1_700_000_000_000), cus: "acct_1" });
    assert.equal(verifyBillingToken(token, 1_700_000_000_001), null);
  });
});

describe("price config", () => {
  it("defaults to $5.00 and formats whole dollars without cents", () => {
    assert.equal(getProPriceCents(), 500);
    assert.equal(formatProPrice(), "$5");
    assert.equal(proPriceAmount(), "5.00");
    assert.equal(formatProPrice(499), "$4.99");
    assert.equal(proPriceAmount(499), "4.99");
  });

  it("reads NEXT_PUBLIC_PRO_PRICE_CENTS and ignores invalid values", () => {
    process.env.NEXT_PUBLIC_PRO_PRICE_CENTS = "499";
    assert.equal(getProPriceCents(), 499);
    process.env.NEXT_PUBLIC_PRO_PRICE_CENTS = "nope";
    assert.equal(getProPriceCents(), 500);
  });
});

describe("email", () => {
  it("normalizes checkout emails and rejects junk", () => {
    assert.equal(normalizeEmail("  Ada@Example.com "), "ada@example.com");
    assert.equal(normalizeEmail("not-an-email"), null);
    assert.equal(normalizeEmail(""), null);
    assert.equal(normalizeEmail(null), null);
  });
});
