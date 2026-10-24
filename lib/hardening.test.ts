import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { activationOutcome, scrubbedUrl } from "./activation.ts";
import { isCheckoutReturn, shouldLoadAds } from "./ads.ts";
import {
  beginRedeem,
  checkSessionRedeemable,
  endRedeem,
  redeemedMetadata,
  SESSION_REDEEM_WINDOW_SECONDS,
  SESSION_REDEEMED_METADATA_KEY,
  SESSION_USED_OR_EXPIRED,
} from "./checkout-guard.ts";
import {
  issueRestoreClaims,
  RESTORE_TOKEN_TTL_SECONDS,
  signBillingToken,
  issueBillingClaims,
  signRestoreToken,
  verifyBillingToken,
  verifyRestoreToken,
} from "./pro-token.ts";
import {
  RESTORE_DISABLED,
  RESTORE_GENERIC,
  requestRestoreLink,
  restoreEmailConfigured,
  restoreJtiMatches,
  type RestoreDeps,
} from "./restore.ts";
import nextConfig from "../next.config.ts";

const SECRET = "test-secret-should-be-long-enough";
const NOW = 1_800_000_000_000;
const NOW_S = NOW / 1000;

afterEach(() => {
  delete process.env.PRO_COOKIE_SECRET;
});

describe("Checkout Session id is one-time and short-lived (§3b.1)", () => {
  it("accepts a fresh, unused session", () => {
    assert.equal(checkSessionRedeemable({ id: "cs_1", created: NOW_S - 60, metadata: {} }, NOW), "ok");
    assert.equal(checkSessionRedeemable({ id: "cs_1", created: NOW_S - SESSION_REDEEM_WINDOW_SECONDS }, NOW), "ok");
  });

  it("rejects a session older than 1 hour", () => {
    assert.equal(SESSION_REDEEM_WINDOW_SECONDS, 3600);
    assert.equal(checkSessionRedeemable({ id: "cs_1", created: NOW_S - 3601 }, NOW), "expired");
    assert.equal(checkSessionRedeemable({ id: "cs_1", created: 0 }, NOW), "expired");
  });

  it("rejects a session that already minted cookies, even when fresh", () => {
    const session = { id: "cs_1", created: NOW_S - 5, metadata: { plan: "monthly" } };
    const marked = redeemedMetadata(session);
    assert.deepEqual(marked, { plan: "monthly", [SESSION_REDEEMED_METADATA_KEY]: "1" });
    assert.equal(checkSessionRedeemable({ ...session, metadata: marked }, NOW), "used");
  });

  it("answers used and expired the same way (HTTP 410, no cookie)", () => {
    assert.equal(SESSION_USED_OR_EXPIRED.status, 410);
    assert.deepEqual(SESSION_USED_OR_EXPIRED.body, { valid: false, reason: "used_or_expired" });
  });

  it("blocks a concurrent second redemption of the same session in this process", () => {
    assert.equal(beginRedeem("cs_race"), true);
    assert.equal(beginRedeem("cs_race"), false);
    endRedeem("cs_race");
    assert.equal(beginRedeem("cs_race"), true);
    endRedeem("cs_race");
  });

  it("client drops a used/expired session instead of retrying forever", () => {
    assert.equal(activationOutcome({ ok: true, status: 200 }, { valid: true }), "activated");
    assert.equal(activationOutcome({ ok: false, status: 410 }, SESSION_USED_OR_EXPIRED.body), "drop");
    assert.equal(activationOutcome({ ok: false, status: 500 }, { valid: false }), "retry");
    assert.equal(activationOutcome(null, null), "retry");
  });

  it("strips session_id (and restore tokens) from the address bar, keeping other params", () => {
    assert.equal(scrubbedUrl("/", "?pro=success&session_id=cs_test_abc"), "/");
    assert.equal(scrubbedUrl("/qr-code-for/wifi", "?session_id=cs_x&utm_source=a", "#top"), "/qr-code-for/wifi?utm_source=a#top");
    assert.equal(scrubbedUrl("/", "?t=secret"), "/");
  });

  it("does not load AdSense on a checkout return, even after the URL was scrubbed", () => {
    const notPro = { ok: true, body: { pro: false } };
    assert.equal(shouldLoadAds("?session_id=cs_1", notPro), false);
    assert.equal(shouldLoadAds("", notPro, true), false);
    assert.equal(isCheckoutReturn("?restore=ok"), true);
    assert.equal(shouldLoadAds("", notPro, false), true);
  });
});

describe("Referrer-Policy (§3b.1)", () => {
  it("sends Referrer-Policy: no-referrer on every route", async () => {
    const rules = await nextConfig.headers!();
    const all = rules.find((rule) => rule.source === "/(.*)");
    assert.ok(all, "catch-all header rule");
    const header = all.headers.find((h) => h.key.toLowerCase() === "referrer-policy");
    assert.equal(header?.value, "no-referrer");
  });
});

describe("email restore never leaks or unlocks (§3b.2)", () => {
  function deps(entitled: { id: string; email: string }[]) {
    const sent: { to: string; link: string }[] = [];
    const saved: { cus: string; jti: string }[] = [];
    const d: RestoreDeps = {
      findEntitledCustomers: async () => entitled,
      saveJti: async (cus, jti) => { saved.push({ cus, jti }); },
      newJti: () => "11111111-2222-3333-4444-555555555555",
      signToken: (cus, jti) => `tok.${cus}.${jti}`,
      sendLink: async (to, link) => { sent.push({ to, link }); },
      appUrl: "https://makeqr.pro",
    };
    return { d, sent, saved };
  }

  it("is off (410) unless a mail sender is configured", () => {
    assert.equal(restoreEmailConfigured({}), false);
    assert.equal(restoreEmailConfigured({ RESEND_API_KEY: "x" }), false);
    assert.equal(restoreEmailConfigured({ RESEND_API_KEY: "x", RESTORE_EMAIL_FROM: "MakeQR <no-reply@makeqr.pro>" }), true);
    assert.equal(RESTORE_DISABLED.status, 410);
    assert.equal(RESTORE_DISABLED.body.ok, false);
  });

  it("returns the identical response for a subscriber, a non-subscriber, a bad email and a rate limit", async () => {
    const sub = deps([{ id: "cus_1", email: "Ada@Example.com" }]);
    const none = deps([]);
    const failing = deps([]);
    failing.d.findEntitledCustomers = async () => { throw new Error("stripe down"); };
    const results = [
      await requestRestoreLink("ada@example.com", true, sub.d),
      await requestRestoreLink("nobody@example.com", true, none.d),
      await requestRestoreLink(null, true, none.d),
      await requestRestoreLink("ada@example.com", false, sub.d),
      await requestRestoreLink("ada@example.com", true, failing.d),
    ];
    for (const r of results) assert.deepEqual(r, RESTORE_GENERIC);
    assert.equal(RESTORE_GENERIC.status, 200);
    assert.equal("pro" in RESTORE_GENERIC.body, false);
  });

  it("emails a link only to the subscriber's address on file, and stores the link id", async () => {
    const sub = deps([{ id: "cus_1", email: "Ada@Example.com" }]);
    await requestRestoreLink("ada@example.com", true, sub.d);
    assert.equal(sub.sent.length, 1);
    assert.equal(sub.sent[0].to, "Ada@Example.com");
    assert.match(sub.sent[0].link, /^https:\/\/makeqr\.pro\/api\/restore\/verify\?t=/);
    assert.deepEqual(sub.saved, [{ cus: "cus_1", jti: "11111111-2222-3333-4444-555555555555" }]);

    const none = deps([]);
    await requestRestoreLink("nobody@example.com", true, none.d);
    assert.equal(none.sent.length, 0);
    const limited = deps([{ id: "cus_1", email: "a@b.co" }]);
    await requestRestoreLink("a@b.co", false, limited.d);
    assert.equal(limited.sent.length, 0);
  });

  it("restore tokens are signed, purpose-bound, expire after 15 minutes and match one jti", () => {
    process.env.PRO_COOKIE_SECRET = SECRET;
    const claims = issueRestoreClaims("cus_1", "11111111-2222-3333-4444-555555555555", NOW);
    assert.equal(claims.exp, NOW_S + RESTORE_TOKEN_TTL_SECONDS);
    assert.equal(RESTORE_TOKEN_TTL_SECONDS, 15 * 60);
    const token = signRestoreToken(claims);
    assert.deepEqual(verifyRestoreToken(token, NOW + 1000), claims);
    assert.equal(verifyRestoreToken(token, (claims.exp + 1) * 1000), null);
    assert.equal(verifyRestoreToken(`${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`, NOW), null);
    // A restore token is not a billing token, and vice versa.
    assert.equal(verifyBillingToken(token, NOW), null);
    assert.equal(verifyRestoreToken(signBillingToken(issueBillingClaims("cus_1", NOW)), NOW), null);

    assert.equal(restoreJtiMatches(claims.jti, claims.jti), true);
    assert.equal(restoreJtiMatches("", claims.jti), false);
    assert.equal(restoreJtiMatches(undefined, claims.jti), false);
    assert.equal(restoreJtiMatches("other", claims.jti), false);
  });
});
