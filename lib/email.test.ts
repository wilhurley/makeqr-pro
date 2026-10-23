import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { customerEmailQuery, findCustomersByEmail, sameEmail, typedEmail } from "./email.ts";

type C = { id: string; email: string | null };

/** Fake Stripe: list() is case-sensitive like Stripe's; search() is case-insensitive "contains". */
function fakeStripe(customers: C[], opts: { searchFails?: boolean } = {}) {
  const calls: string[] = [];
  return {
    calls,
    customers: {
      async list({ email }: { email: string; limit: number }) {
        calls.push(`list:${email}`);
        return { data: customers.filter((c) => c.email === email) };
      },
      async search({ query }: { query: string; limit: number }) {
        calls.push(`search:${query}`);
        if (opts.searchFails) throw new Error("search unavailable");
        const wanted = /^email:"(.*)"$/.exec(query)?.[1]?.toLowerCase() ?? "";
        return { data: customers.filter((c) => (c.email ?? "").toLowerCase().includes(wanted)) };
      },
    },
  };
}

describe("restore email lookup", () => {
  it("finds a customer stored with mixed case when the visitor types lowercase", async () => {
    const stripe = fakeStripe([{ id: "cus_A", email: "Ada@Example.com" }]);
    const found = await findCustomersByEmail(stripe, "ada@example.com");
    assert.deepEqual(found.map((c) => c.id), ["cus_A"]);
  });

  it("finds it by the exact typed address even if Search is unavailable", async () => {
    const stripe = fakeStripe([{ id: "cus_A", email: "Ada@Example.com" }], { searchFails: true });
    const found = await findCustomersByEmail(stripe, "  Ada@Example.com ");
    assert.deepEqual(found.map((c) => c.id), ["cus_A"]);
    assert.ok(stripe.calls.includes("list:Ada@Example.com"));
    assert.ok(stripe.calls.includes("list:ada@example.com"));
  });

  it("ignores Search results that only contain the address, and de-duplicates", async () => {
    const stripe = fakeStripe([
      { id: "cus_A", email: "ada@example.com" },
      { id: "cus_B", email: "ada@example.com.evil.test" },
      { id: "cus_C", email: "ADA@EXAMPLE.COM" },
    ]);
    const found = await findCustomersByEmail(stripe, "Ada@example.com");
    assert.deepEqual(found.map((c) => c.id).sort(), ["cus_A", "cus_C"]);
  });

  it("does not call Stripe for invalid input", async () => {
    const stripe = fakeStripe([]);
    assert.deepEqual(await findCustomersByEmail(stripe, "nope"), []);
    assert.deepEqual(stripe.calls, []);
  });

  it("helpers", () => {
    assert.equal(typedEmail("  Ada@Example.com "), "Ada@Example.com");
    assert.equal(sameEmail("Ada@Example.com", "ada@example.com"), true);
    assert.equal(sameEmail(null, "ada@example.com"), false);
    assert.equal(customerEmailQuery('a"b@x.io'), 'email:"a\\"b@x.io"');
  });
});
