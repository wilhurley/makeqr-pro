import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  acceptanceMetadata,
  consentError,
  renewalBoxText,
  STRIPE_TERMS_MESSAGE,
  stripeTermsAccepted,
} from "./checkout-consent.ts";
import { TERMS_SOURCE, termsMarkdown, termsSha256 } from "./terms-content.ts";
import { PRIVACY_VERSION, TERMS_EFFECTIVE, TERMS_VERSION } from "./terms-version.ts";

const PRICES = { pro: "$3.99", yearly: "$29", lifetime: "$39" };
const monthly = { id: "monthly", mode: "subscription", price: "$3.99" } as const;
const yearly = { id: "yearly", mode: "subscription", price: "$29" } as const;
const lifetime = { id: "lifetime", mode: "payment", price: "$39" } as const;
const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");

describe("terms of service text (Legal Review 2026-10-24-d1)", () => {
  const md = termsMarkdown(PRICES);
  it("fills every placeholder: $3.99 Pro price, version, effective date", () => {
    assert.doesNotMatch(md, /\{\{|\[PRO PRICE|\[price\]|\[date published\]|DRAFT|\$4\.99/);
    assert.equal(md.match(/\$3\.99/g)?.length, 3);
    assert.match(md, /Version 2026-10-24-d1 · Effective October 24, 2026/);
    assert.match(md, /Yearly \(\$29, renews yearly until you cancel/);
    assert.match(md, /lifetime \(\$39, one-time, no renewal\)/);
  });
  it("keeps the DENSO WAVE notice, C18 change rules and no 'keep using = agree' clause", () => {
    assert.match(md, /QR Code is a registered trademark of DENSO WAVE INCORPORATED\. MakeQR Pro is not affiliated with or endorsed by DENSO WAVE\./);
    assert.match(md, /\*\*No retroactive changes\.\*\*/);
    assert.match(md, /we'll email you at least 30 days before it takes effect/);
    assert.doesNotMatch(md, /keep using the site after that/i);
    assert.match(md, /you accept these Terms by ticking the checkbox at checkout/);
  });
  it("version constants agree and the hash is stable 16 hex chars", () => {
    assert.match(TERMS_SOURCE, /\{\{TERMS_VERSION\}\}/);
    assert.equal(TERMS_VERSION, "2026-10-24-d1");
    assert.equal(TERMS_EFFECTIVE, "October 24, 2026");
    assert.match(read("./terms-content.ts"), new RegExp(`const TERMS_VERSION = "${TERMS_VERSION}"`));
    assert.match(termsSha256(PRICES), /^[0-9a-f]{16}$/);
    assert.equal(termsSha256(PRICES), termsSha256(PRICES));
    assert.notEqual(termsSha256(PRICES), termsSha256({ ...PRICES, pro: "$4.99" }));
  });
  it("the old 'keep using the site' clause is gone from the live /terms page and kept only in the archive", () => {
    assert.doesNotMatch(read("../app/terms/page.tsx"), /keep using/);
    assert.match(read("../app/terms/archive/2026-10-24-v0/page.tsx"), /archived version/);
    assert.match(read("../components/SiteFooter.tsx"), /DENSO WAVE INCORPORATED/);
  });
});

describe("checkout clickwrap", () => {
  it("uses the spec's exact box wording", () => {
    assert.equal(renewalBoxText(monthly), "I agree that Pro renews automatically at $3.99 every month until I cancel. I can cancel anytime online with Manage billing.");
    assert.equal(renewalBoxText(yearly), "I agree that Pro renews automatically at $29 every year until I cancel. I can cancel anytime online with Manage billing.");
    assert.equal(renewalBoxText(lifetime), null);
    assert.match(STRIPE_TERMS_MESSAGE, /^I agree to the \[Terms of Service\]\(https:\/\/makeqr\.pro\/terms\) and have read the \[Privacy Policy\]\(https:\/\/makeqr\.pro\/privacy\)\.$/);
  });
  it("rejects checkout server-side unless the required boxes are ticked for the current version", () => {
    const ok = { acceptTerms: true, acceptRenewal: true, termsVersion: TERMS_VERSION };
    assert.equal(consentError(ok, monthly, TERMS_VERSION), null);
    assert.match(consentError({ ...ok, acceptTerms: undefined }, monthly, TERMS_VERSION) ?? "", /Terms of Service/);
    assert.match(consentError({ ...ok, acceptTerms: "true" }, monthly, TERMS_VERSION) ?? "", /Terms of Service/);
    assert.match(consentError({ ...ok, acceptRenewal: false }, monthly, TERMS_VERSION) ?? "", /automatic renewal/);
    assert.match(consentError({ ...ok, acceptRenewal: false }, yearly, TERMS_VERSION) ?? "", /automatic renewal/);
    assert.equal(consentError({ acceptTerms: true, termsVersion: TERMS_VERSION }, lifetime, TERMS_VERSION), null);
    assert.match(consentError({ ...ok, termsVersion: "old" }, monthly, TERMS_VERSION) ?? "", /Terms were updated/);
    assert.notEqual(consentError({}, lifetime, TERMS_VERSION), null);
  });
  it("builds a privacy-minimal acceptance record", () => {
    const now = new Date("2026-10-25T14:03:11.123Z");
    const m = acceptanceMetadata({ plan: monthly, termsVersion: TERMS_VERSION, termsSha256: "abcd", privacyVersion: PRIVACY_VERSION, now });
    assert.deepEqual(m, {
      terms_version: "2026-10-24-d1", terms_sha256: "abcd", privacy_version: "2026-10-24",
      accepted_at: "2026-10-25T14:03:11Z", boxes: "terms,renewal", renewal_terms: "pro $3.99 USD month", source: "web-checkout",
    });
    const l = acceptanceMetadata({ plan: lifetime, termsVersion: TERMS_VERSION, termsSha256: "abcd", privacyVersion: PRIVACY_VERSION, now });
    assert.equal(l.boxes, "terms");
    assert.equal("renewal_terms" in l, false);
    for (const [k, v] of Object.entries(m)) { assert.ok(k.length <= 40); assert.ok(v.length <= 500); }
  });
  it("checkout route requires Stripe's own Terms box and checks consent before creating a session", () => {
    const route = read("../app/api/checkout/route.ts");
    assert.match(route, /consent_collection: \{ terms_of_service: "required" as const \}/);
    assert.match(route, /terms_of_service_acceptance: \{ message: STRIPE_TERMS_MESSAGE \}/);
    assert.ok(route.indexOf("consentError(") < route.indexOf("checkout.sessions.create"));
    assert.ok(route.indexOf("config.configured") < route.indexOf("consentError("), "503 coming-soon stays first");
    assert.equal(stripeTermsAccepted({ consent: { terms_of_service: "accepted" } }), true);
    assert.equal(stripeTermsAccepted({ consent: null }), false);
    const ui = read("../components/QrGenerator.tsx");
    assert.match(ui, /useState\(false\);\n  const \[acceptRenewal, setAcceptRenewal\] = useState\(false\)/);
  });
});
