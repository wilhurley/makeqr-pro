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

const PRICES = { pro: "$3.99" };
const monthly = { id: "monthly", mode: "subscription", price: "$3.99" } as const;
const yearly = { id: "yearly", mode: "subscription", price: "$50" } as const;
const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");

describe("terms of service text (Legal Review 2026-10-24, version d3)", () => {
  const md = termsMarkdown(PRICES);
  it("fills every placeholder: $3.99 Pro price, version, effective date", () => {
    assert.doesNotMatch(md, /\{\{|\[PRO PRICE|\[price\]|\[date published\]|DRAFT|\$4\.99/);
    assert.equal(md.match(/\$3\.99/g)?.length, 3);
    assert.match(md, /Version 2026-10-24-d3 · Effective October 24, 2026/);
    assert.match(md, /Yearly and one-time plans are not currently offered\. See C11\./);
    assert.match(md, /Yearly and one-time plans are not currently offered; if we offer one later/);
    assert.match(md, /yearly plans get a reminder 15 to 45 days before each renewal/);
    assert.doesNotMatch(md, /lifetime|\$29|\$39|launch deal/i);
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
    assert.equal(TERMS_VERSION, "2026-10-24-d3");
    assert.equal(TERMS_EFFECTIVE, "October 24, 2026");
    assert.match(read("./terms-content.ts"), new RegExp(`const TERMS_VERSION = "${TERMS_VERSION}"`));
    assert.match(termsSha256(PRICES), /^[0-9a-f]{16}$/);
    assert.equal(termsSha256(PRICES), termsSha256(PRICES));
    assert.notEqual(termsSha256(PRICES), termsSha256({ ...PRICES, pro: "$4.99" }));
  });
  it("the old 'keep using the site' clause is gone from the live /terms page and kept only in the archive", () => {
    assert.doesNotMatch(read("../app/terms/page.tsx"), /keep using/);
    assert.match(read("../app/terms/archive/2026-10-24-v0/page.tsx"), /archived version/);
    assert.match(read("../app/terms/archive/2026-10-24-d1/page.tsx"), /ArchivedTermsBanner plans/);
    assert.match(read("../app/terms/archive/2026-10-24-d2/page.tsx"), /ArchivedTermsBanner/);
    assert.match(read("../components/SiteFooter.tsx"), /<p className="mt-2">QR Code is a registered trademark of DENSO WAVE INCORPORATED\.<\/p>/);
  });
});

describe("checkout clickwrap", () => {
  it("uses the spec's exact box wording", () => {
    assert.equal(renewalBoxText(monthly), "I agree that Pro renews automatically at $3.99 every month until I cancel. I can cancel anytime online with Manage billing.");
    assert.equal(renewalBoxText(yearly), "I agree that Pro renews automatically at $50 every year until I cancel. I can cancel anytime online with Manage billing.");
    assert.match(STRIPE_TERMS_MESSAGE, /^I agree to the \[Terms of Service\]\(https:\/\/makeqr\.pro\/terms\) and have read the \[Privacy Policy\]\(https:\/\/makeqr\.pro\/privacy\)\.$/);
  });
  it("rejects checkout server-side unless the required boxes are ticked for the current version", () => {
    const ok = { acceptTerms: true, acceptRenewal: true, termsVersion: TERMS_VERSION };
    assert.equal(consentError(ok, monthly, TERMS_VERSION), null);
    assert.match(consentError({ ...ok, acceptTerms: undefined }, monthly, TERMS_VERSION) ?? "", /Terms of Service/);
    assert.match(consentError({ ...ok, acceptTerms: "true" }, monthly, TERMS_VERSION) ?? "", /Terms of Service/);
    assert.match(consentError({ ...ok, acceptRenewal: false }, monthly, TERMS_VERSION) ?? "", /automatic renewal/);
    assert.match(consentError({ ...ok, acceptRenewal: false }, yearly, TERMS_VERSION) ?? "", /automatic renewal/);
    assert.match(consentError({ acceptTerms: true, termsVersion: TERMS_VERSION }, monthly, TERMS_VERSION) ?? "", /automatic renewal/);
    assert.match(consentError({ ...ok, termsVersion: "old" }, monthly, TERMS_VERSION) ?? "", /Terms were updated/);
    assert.notEqual(consentError({}, monthly, TERMS_VERSION), null);
  });
  it("builds a privacy-minimal acceptance record", () => {
    const now = new Date("2026-10-25T14:03:11.123Z");
    const m = acceptanceMetadata({ plan: monthly, termsVersion: TERMS_VERSION, termsSha256: "abcd", privacyVersion: PRIVACY_VERSION, now });
    assert.deepEqual(m, {
      terms_version: "2026-10-24-d3", terms_sha256: "abcd", privacy_version: "2026-10-24",
      accepted_at: "2026-10-25T14:03:11Z", boxes: "terms,renewal", renewal_terms: "pro $3.99 USD month", source: "web-checkout",
    });
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

describe("ads re-check 2026-10-24 11:45 (monthly only, DENSO footer, no 'in seconds')", () => {
  const files = [
    "../app/pricing/page.tsx", "../app/refund/page.tsx", "../app/page.tsx", "../app/layout.tsx", "../lib/schema.ts",
    "../components/QrGenerator.tsx", "../components/SiteFooter.tsx", "../app/terms/page.tsx", "../public/manifest.json",
  ];
  it("no yearly or one-time option, no lifetime or launch deal wording on live pages", () => {
    for (const f of files) {
      const src = read(f);
      assert.doesNotMatch(src, /lifetime|launch deal|\$29|\$39|PRO_YEARLY_PRICE|PRO_LIFETIME_PRICE/i, f);
    }
    assert.doesNotMatch(read("./pricing.ts"), /YEARLY|LIFETIME/);
  });
  it("JSON-LD offers only Free while Pro is coming soon (no Pro Offer, no price)", () => {
    const schema = read("./schema.ts");
    assert.equal(schema.match(/"@type": "Offer"/g)?.length, 1);
    assert.doesNotMatch(schema, /billingDuration|proPriceAmount/);
  });
  it("says 'quickly', never 'in seconds'", () => {
    for (const f of files) assert.doesNotMatch(read(f), /in seconds/i, f);
    assert.match(read("../components/QrGenerator.tsx"), /link or text quickly\./);
  });
  it("every page with a footer uses SiteFooter", () => {
    for (const f of ["../app/page.tsx", "../app/pricing/page.tsx", "../app/refund/page.tsx", "../app/terms/page.tsx", "../app/about/page.tsx", "../app/privacy/page.tsx", "../app/contact/page.tsx", "../app/best-practices/page.tsx", "../app/qr-code-for/[slug]/page.tsx"]) {
      assert.match(read(f), /<SiteFooter \/>/, f);
    }
  });
});

describe("Pro coming soon is the default (2026-10-24, no money until the Ohio vendor's license)", () => {
  it("server-rendered and loading state show 'Pro coming soon', not a paid upgrade", () => {
    const ui = read("../components/QrGenerator.tsx");
    assert.match(ui, /const proComingSoon = plans === null \|\| !plans\.configured;/);
    assert.doesNotMatch(ui, /Loading plans/);
  });
  it("marketing copy never says Pro costs X/mo as if it's on sale", () => {
    for (const f of ["../app/page.tsx", "../app/layout.tsx", "../app/about/page.tsx", "./home-faq.ts", "./use-cases.ts", "./schema.ts"]) {
      const src = read(f);
      assert.doesNotMatch(src, /PRO_PRICE|\$\d+(\.\d\d)?\s*\/\s*mo|Pro is \$/, f);
    }
  });
  it("/pricing says the price is planned and not on sale yet", () => {
    const src = read("../app/pricing/page.tsx");
    assert.match(src, /This is a planned price, and Pro is not on sale yet\./);
    assert.match(src, /Pro: coming soon/);
    assert.doesNotMatch(src, /Pro is a monthly subscription billed by Stripe that renews/);
  });
});
