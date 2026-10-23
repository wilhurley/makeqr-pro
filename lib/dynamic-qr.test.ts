import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCode, CREATE_LIMIT_PER_OWNER, generateSlug, isValidSlug, MemoryStore, resolveRedirect, updateCode, validateDestination,
} from "./dynamic-qr.ts";

const pro = { owner: "cus_A", pro: true, ip: "1.2.3.4" };
const lapsed = { owner: "cus_A", pro: false, ip: "1.2.3.4" };
const other = { owner: "cus_B", pro: true, ip: "5.6.7.8" };

describe("validateDestination", () => {
  it("accepts http(s) and adds https:// when missing", () => {
    assert.deepEqual(validateDestination("https://example.com/a?b=1"), { ok: true, url: "https://example.com/a?b=1" });
    assert.deepEqual(validateDestination("example.com"), { ok: true, url: "https://example.com/" });
  });
  it("blocks dangerous schemes", () => {
    for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", " java\tscript:alert(1)", "data:text/html,<b>x</b>", "file:///etc/passwd", "vbscript:x", "ftp://example.com"]) {
      assert.equal(validateDestination(bad).ok, false, bad);
    }
  });
  it("blocks loops, local hosts, credentials, junk and huge URLs", () => {
    for (const bad of ["https://makeqr.pro/r/abcdefg", "http://localhost:3000", "http://127.0.0.1", "http://192.168.1.1", "http://[::1]/", "https://user:pw@example.com", "", "   ", 42, "http://intranet", `https://example.com/${"a".repeat(2100)}`]) {
      assert.equal(validateDestination(bad).ok, false, String(bad).slice(0, 40));
    }
  });
});

describe("slugs", () => {
  it("are 7 chars from the alphabet", () => {
    for (let i = 0; i < 200; i++) assert.ok(isValidSlug(generateSlug()));
    assert.equal(isValidSlug("../etc"), false);
    assert.equal(isValidSlug("abc"), false);
  });
});

describe("create / edit / redirect", () => {
  it("requires Pro to create", async () => {
    const s = new MemoryStore();
    assert.equal((await createCode(s, { owner: null, pro: false, ip: "x" }, { destination: "example.com" })).ok, false);
    const r = await createCode(s, lapsed, { destination: "example.com" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.status, 402);
  });

  it("redirects, counts scans, and follows edits", async () => {
    const s = new MemoryStore();
    const r = await createCode(s, pro, { destination: "https://one.example", label: "Menu" });
    assert.ok(r.ok);
    if (!r.ok) return;
    const slug = r.value.slug;
    assert.equal(await resolveRedirect(s, slug), "https://one.example/");
    const u = await updateCode(s, pro, slug, { destination: "https://two.example/x" });
    assert.ok(u.ok);
    assert.equal(await resolveRedirect(s, slug), "https://two.example/x");
    assert.equal((await s.get(slug))?.scans, 2);
    assert.equal((await s.get(slug))?.label, "Menu", "label kept when not sent");
  });

  it("keeps redirecting but locks editing after Pro lapses", async () => {
    const s = new MemoryStore();
    const r = await createCode(s, pro, { destination: "https://one.example" });
    if (!r.ok) throw new Error("create failed");
    const u = await updateCode(s, lapsed, r.value.slug, { destination: "https://two.example" });
    assert.equal(u.ok, false);
    if (!u.ok) assert.equal(u.status, 402);
    assert.equal(await resolveRedirect(s, r.value.slug), "https://one.example/");
  });

  it("won't let another customer edit, and rejects bad edits", async () => {
    const s = new MemoryStore();
    const r = await createCode(s, pro, { destination: "https://one.example" });
    if (!r.ok) throw new Error("create failed");
    const u = await updateCode(s, other, r.value.slug, { destination: "https://evil.example" });
    assert.equal(u.ok, false);
    if (!u.ok) assert.equal(u.status, 404);
    assert.equal((await updateCode(s, pro, r.value.slug, { destination: "javascript:alert(1)" })).ok, false);
    assert.equal(await resolveRedirect(s, r.value.slug), "https://one.example/");
  });

  it("never serves a stored bad URL and 404s unknown slugs", async () => {
    const s = new MemoryStore();
    await s.insert({ slug: "abcdefg", owner: "cus_A", destination: "javascript:alert(1)", label: "", createdAt: 0, updatedAt: 0, scans: 0, lastScanAt: 0 });
    assert.equal(await resolveRedirect(s, "abcdefg"), null);
    assert.equal(await resolveRedirect(s, "zzzzzzz"), null);
    assert.equal(await resolveRedirect(s, "../x"), null);
  });

  it("rate limits creation per customer", async () => {
    const s = new MemoryStore();
    let last;
    for (let i = 0; i <= CREATE_LIMIT_PER_OWNER.limit; i++) last = await createCode(s, pro, { destination: `https://e${i}.example` });
    assert.ok(last && !last.ok && last.status === 429);
  });

  it("retries on slug collision", async () => {
    const s = new MemoryStore();
    const slugs = ["aaaaaaa", "aaaaaaa", "bbbbbbb"];
    await createCode(s, pro, { destination: "https://a.example" }, Date.now(), () => slugs.shift()!);
    const r = await createCode(s, pro, { destination: "https://b.example" }, Date.now(), () => slugs.shift()!);
    assert.ok(r.ok && r.value.slug === "bbbbbbb");
  });
});
