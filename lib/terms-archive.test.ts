import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { TERMS_D1_SOURCE, termsD1Markdown } from "./terms-archive-d1.ts";
import { termsD2Markdown } from "./terms-archive-d2.ts";
import { termsMarkdown } from "./terms-content.ts";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const sha = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

const BANNER_PLANS =
  "Archived version, no longer in effect. Kept for our records only. The plans and prices below are not offered. Only the monthly Pro plan was ever sold. Current Terms: https://makeqr.pro/terms";
const BANNER =
  "Archived version, no longer in effect. Kept for our records only. Current Terms: https://makeqr.pro/terms";
const OLD_REFUND = "Approved refunds go back to your original payment method; banks can take 5 to 10 business days to show them.";
const NEW_REFUND =
  "If we approve a refund, we send it to your original payment method within 7 business days. After that, your bank or card company may take another 5 to 10 business days to show it on your statement. We don't control that part.";

/** Hashes pinned from the archived text as published at main 8cb7c8f (live 2026-10-24). */
const PINNED = {
  d1Source: "9a7a6f38d5ed8c5ed3bf4f83a9199535fbe4e6f43f489c0fa70b9ac3b6632b8f",
  d1Rendered: "d617962bd7cca2fae5374475790a8427861a111f0fd3a2c31e1b2e726e2e7d50",
  d2Rendered: "45191b5237b1b028e638d180167c666bd379194557137d4850aa4ac76f6d3d72",
  /** app/terms/archive/2026-10-24-v0/page.tsx from its <h1> to the end, with only the old banner line removed. */
  v0Body: "8a1fb35476fa06049bf89a8d84dc9bc8e41fa093e2840341c952bf639179347d",
};

const PAGES = {
  v0: "../app/terms/archive/2026-10-24-v0/page.tsx",
  d1: "../app/terms/archive/2026-10-24-d1/page.tsx",
  d2: "../app/terms/archive/2026-10-24-d2/page.tsx",
};

describe("archived Terms: old text unchanged byte-for-byte apart from the banner", () => {
  it("d1 source and rendered text match what was published", () => {
    assert.equal(sha(TERMS_D1_SOURCE), PINNED.d1Source);
    assert.equal(sha(termsD1Markdown()), PINNED.d1Rendered);
  });
  it("d2 archive is exactly the d2 text that was live at /terms", () => {
    assert.equal(sha(termsD2Markdown()), PINNED.d2Rendered);
    assert.match(termsD2Markdown(), /Version 2026-10-24-d2 · Effective October 24, 2026/);
  });
  it("v0 page body (JSX) is unchanged apart from the banner", () => {
    const src = read(PAGES.v0);
    const body = src.slice(src.indexOf('        <h1 className="text-4xl'));
    assert.equal(sha(body), PINNED.v0Body);
  });
  it("d3 differs from d2 only in the refund timing sentence and the version label", () => {
    const d2 = termsD2Markdown();
    assert.equal(d2.split(OLD_REFUND).length, 2);
    const expected = d2.replace(OLD_REFUND, NEW_REFUND).replace("Version 2026-10-24-d2 ·", "Version 2026-10-24-d3 ·");
    assert.equal(termsMarkdown({ pro: "$3.99" }), expected);
  });
});

describe("archived Terms: banner, noindex, out of nav and sitemap", () => {
  const banner = read("../components/ArchivedTermsBanner.tsx");
  it("banner component renders the exact ruling text", () => {
    const lead = (s: string) => s.slice(0, s.length - "https://makeqr.pro/terms".length);
    assert.ok(banner.includes(`"${lead(BANNER_PLANS)}"`));
    assert.ok(banner.includes(`"${lead(BANNER)}"`));
    assert.match(banner, /<a href="https:\/\/makeqr\.pro\/terms" className="underline">https:\/\/makeqr\.pro\/terms<\/a>/);
  });
  it("v0 and d1 show the plans banner above the old text; d2 shows the plain banner", () => {
    for (const [key, marker] of [["v0", "<h1"], ["d1", "<TermsMarkdown"], ["d2", "<TermsMarkdown"]] as const) {
      const src = read(PAGES[key]);
      const tag = key === "d2" ? "<ArchivedTermsBanner plans={false} />" : "<ArchivedTermsBanner plans />";
      assert.equal(src.split("<ArchivedTermsBanner").length, 2, key);
      assert.ok(src.includes(tag), key);
      assert.ok(src.indexOf(tag) < src.indexOf(marker), `${key}: banner above old text`);
      assert.match(src, /metadata\.robots = \{ index: false, follow: true \};/, key);
    }
    assert.match(read("../app/terms/archive/page.tsx"), /robots: \{ index: false, follow: true \}/);
  });
  it("archives are not in the sitemap or the footer nav", () => {
    assert.doesNotMatch(read("../app/sitemap.ts"), /archive/);
    assert.doesNotMatch(read("../components/SiteFooter.tsx"), /archive/);
  });
});

describe("refund timing wording", () => {
  it("current Terms carry the new sentence once and not the old one", () => {
    const md = termsMarkdown({ pro: "$3.99" });
    assert.equal(md.split(NEW_REFUND).length, 2);
    assert.ok(!md.includes(OLD_REFUND));
    assert.doesNotMatch(md, /refunded in 7 days/i);
  });
  it("refund page uses the short line; no old '5-10' form on live pages", () => {
    const refund = read("../app/refund/page.tsx");
    assert.ok(refund.includes("Approved refunds are sent within 7 business days. Your bank may take 5 to 10 more business days to post them."));
    for (const f of ["../app/refund/page.tsx", "../app/pricing/page.tsx", "../app/page.tsx", "../components/QrGenerator.tsx", "./home-faq.ts", "./terms-content.ts"]) {
      const src = read(f);
      assert.doesNotMatch(src, /5-10 business days|banks can take 5 to 10|refunded in 7 days/i, f);
    }
  });
});
