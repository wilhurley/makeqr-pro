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
import { PRO_SALE_TERMS_PUBLISHED, TERMS_SOURCE, termsMarkdown, termsSha256 } from "./terms-content.ts";
import { PRIVACY_VERSION, TERMS_EFFECTIVE, TERMS_VERSION } from "./terms-version.ts";

const PRICES = { pro: "$3.99" };
const monthly = { id: "monthly", mode: "subscription", price: "$3.99" } as const;
const yearly = { id: "yearly", mode: "subscription", price: "$50" } as const;
const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");

describe("terms of service text (Legal Review 2026-10-24, version d5: Pro planned, not on sale)", () => {
  const md = termsMarkdown(PRICES);
  it("fills every placeholder: planned $3.99 price, version, effective date", () => {
    assert.doesNotMatch(md, /\{\{|\[PRO PRICE|\[price\]|\[date published\]|DRAFT|\$4\.99/);
    assert.equal(md.match(/\$3\.99/g)?.length, 2);
    assert.match(md, /Version 2026-10-24-d5 · Effective October 24, 2026/);
    assert.doesNotMatch(md, /lifetime|\$29|\$39|launch deal/i);
  });
  it("memo §3a-3f replacements are in, word for word", () => {
    for (const s of [
      "> - The **free** generator makes URL and text QR codes with no signup and no watermark. **Pro is planned but not on sale yet.** You can't buy it, pre-order it or pay a deposit for it, and we don't collect payment details. The planned price is $3.99 a month and may change.",
      "## A2. Pro (planned, not on sale yet)\n\n**Pro is not on sale yet.** You can't buy Pro today. We don't take pre-orders or deposits for it, and we don't collect card or other payment details. Nothing on makeqr.pro or in these Terms is an offer to sell Pro.",
      "**The planned price is $3.99 a month. The price and features may change before launch.**",
      "**Before anyone can buy Pro,** we'll publish a new version of these Terms with Pro's billing, automatic-renewal, cancellation and refund terms. Checkout will show those terms and the price before you pay, and you'll have to accept them by ticking the checkout boxes before you're charged. To hear when Pro opens, email support@ridgelineapps.us.",
      "They cover the free QR code generator at makeqr.pro. Pro isn't on sale yet (see A2).",
      "**When these Terms bind you.** MakeQR Pro is free to use today, and these Terms apply to that use; they're linked at the bottom of every page. If we start selling Pro, you'll accept the Terms version that covers it by ticking the checkbox at checkout.",
      "## C9. Payments, prices and taxes\n\nMakeQR Pro doesn't take payments today, and we don't collect card or other payment details. Any price we mention for Pro is a planned price.",
      "## C10. Refunds\n\nMakeQR Pro doesn't take payments today, so there is nothing to refund.",
      "## C11. Subscriptions and automatic renewal\n\nNo subscription is on sale, and nothing renews or charges you today.",
    ]) assert.ok(md.includes(s), s.slice(0, 60));
  });
  it("no current-offer wording is left (A2, C11, summary)", () => {
    assert.doesNotMatch(md, /Pro is \$3\.99 per month, billed in advance/);
    assert.doesNotMatch(md, /\*\*Pro: \$3\.99 per month/);
    assert.doesNotMatch(md, /\*\*Pro\*\* is \$3\.99 a month, \*\*renews automatically/);
    assert.doesNotMatch(md, /For every subscription we offer:/);
    assert.doesNotMatch(md, /SUBSCRIPTIONS AND AUTOMATIC RENEWAL/);
    assert.doesNotMatch(md, /the Pro subscription\./);
  });
  it("keeps the DENSO WAVE notice, C18 change rules and no 'keep using = agree' clause", () => {
    assert.match(md, /QR Code is a registered trademark of DENSO WAVE INCORPORATED\. MakeQR Pro is not affiliated with or endorsed by DENSO WAVE\./);
    assert.match(md, /\*\*No retroactive changes\.\*\*/);
    assert.match(md, /we'll email you at least 30 days before it takes effect/);
    assert.doesNotMatch(md, /keep using the site after that/i);
  });
  it("version constants agree and the hash is stable 16 hex chars", () => {
    assert.match(TERMS_SOURCE, /\{\{TERMS_VERSION\}\}/);
    assert.equal(TERMS_VERSION, "2026-10-24-d5");
    assert.equal(TERMS_EFFECTIVE, "October 24, 2026");
    assert.match(read("./terms-content.ts"), new RegExp(`const TERMS_VERSION = "${TERMS_VERSION}"`));
    assert.match(termsSha256(PRICES), /^[0-9a-f]{16}$/);
    assert.equal(termsSha256(PRICES), termsSha256(PRICES));
    assert.notEqual(termsSha256(PRICES), termsSha256({ ...PRICES, pro: "$4.99" }));
  });
  it("/terms page: memo description and notice; old 'keep using' clause only in the archive", () => {
    const page = read("../app/terms/page.tsx");
    assert.ok(page.includes(`description: "The terms for using MakeQR Pro's free QR code generator. Pro is planned and not on sale yet.",`));
    assert.ok(page.includes("Pro is planned and isn&apos;t on sale yet. These Terms cover the free generator; see A2."));
    assert.doesNotMatch(page, /planned price\. The\s+Pro and payment sections apply/);
    assert.doesNotMatch(page, /keep using/);
    assert.match(read("../app/terms/archive/2026-10-24-v0/page.tsx"), /archived version/);
    assert.match(read("../app/terms/archive/2026-10-24-d1/page.tsx"), /ArchivedTermsBanner plans/);
    assert.match(read("../app/terms/archive/2026-10-24-d2/page.tsx"), /ArchivedTermsBanner/);
    assert.match(read("../app/terms/archive/2026-10-24-d3/page.tsx"), /ArchivedTermsD3Banner/);
    assert.match(read("../app/terms/archive/2026-10-24-d4/page.tsx"), /ArchivedTermsD4Banner/);
    assert.match(read("../components/SiteFooter.tsx"), /<p className="mt-2">QR Code is a registered trademark of DENSO WAVE INCORPORATED\.<\/p>/);
  });
  it("the internal paid-terms draft is not in this public repo", () => {
    for (const f of ["./terms-content.ts", "./terms-archive-d3.ts", "../app/terms/page.tsx"]) {
      assert.doesNotMatch(read(f), /paid-terms-DRAFT|not-in-effect/, f);
    }
  });
});

describe("one contact address: support@ridgelineapps.us (Super Bot 2026-10-24; Cloudflare Email Routing forwards it)", () => {
  it("live Terms and site use support@, never wil@; archives d1-d3 are untouched", () => {
    const md = termsMarkdown(PRICES);
    assert.ok(md.includes("Ridgeline Apps LLC (Ohio) · support@ridgelineapps.us**"));
    assert.doesNotMatch(md, /wil@ridgelineapps\.us/);
    for (const f of ["./site.ts", "./restore.ts", "./terms-content.ts", "../app/api/checkout/route.ts",
      "../app/api/billing-portal/route.ts", "../app/privacy/page.tsx", "../components/QrGenerator.tsx",
      "../app/contact/page.tsx", "../app/pricing/page.tsx", "../app/terms/page.tsx"]) {
      assert.doesNotMatch(read(f), /wil@ridgelineapps\.us/, f);
    }
    assert.match(read("./site.ts"), /export const SUPPORT_EMAIL = "support@ridgelineapps\.us";/);
    for (const f of ["./terms-archive-d1.ts", "./terms-archive-d2.ts", "./terms-archive-d3.ts", "./terms-archive-d4.ts"]) {
      assert.match(read(f), /wil@ridgelineapps\.us/, `${f} stays as published`);
    }
  });
});

describe("d5 bump forces no re-accept flow", () => {
  it("the only version check is at checkout, which is off; the client always sends the current version", () => {
    const gen = read("../components/QrGenerator.tsx");
    assert.match(gen, /import \{ TERMS_VERSION \} from "@\/lib\/terms-version";/);
    assert.match(gen, /termsVersion: TERMS_VERSION/);
    for (const f of ["../app/api/pro/route.ts", "../app/api/restore/route.ts", "../app/api/restore/verify/route.ts",
      "../app/api/verify-session/route.ts", "../app/api/billing-portal/route.ts", "./pro-access.ts", "./pro-token.ts"]) {
      assert.doesNotMatch(read(f), /TERMS_VERSION|termsVersion|terms_version/, f);
    }
  });
});

describe("checkout stays off until paid Terms are published (Legal memo §3j)", () => {
  it("PRO_SALE_TERMS_PUBLISHED is false", () => {
    assert.equal(PRO_SALE_TERMS_PUBLISHED, false);
    assert.match(read("./terms-content.ts"), /export const PRO_SALE_TERMS_PUBLISHED = false;/);
  });
  it("/api/checkout returns the 503 comingSoon when the flag is false, even with Stripe configured", () => {
    const src = read("../app/api/checkout/route.ts");
    assert.match(src, /import \{ PRO_SALE_TERMS_PUBLISHED, termsSha256 \} from "@\/lib\/terms-content";/);
    const gate = src.indexOf("if (!config.configured || !PRO_SALE_TERMS_PUBLISHED) {");
    assert.ok(gate > 0, "gate present");
    const block = src.slice(gate, src.indexOf("}", src.indexOf("status: 503", gate)) + 1);
    assert.match(block, /comingSoon: true/);
    assert.match(block, /status: 503/);
    assert.ok(gate < src.indexOf("getStripe()"), "gate runs before any Stripe call");
    assert.ok(gate < src.indexOf("findPlan("), "gate runs before plan lookup");
  });
  it("/api/plans reports nothing on sale while the flag is false", () => {
    const src = read("../app/api/plans/route.ts");
    assert.match(src, /const onSale = config\.configured && PRO_SALE_TERMS_PUBLISHED;/);
    assert.match(src, /configured: onSale,/);
    assert.match(src, /\(onSale \? config\.plans : \[\]\)/);
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
      terms_version: "2026-10-24-d5", terms_sha256: "abcd", privacy_version: "2026-10-24",
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
