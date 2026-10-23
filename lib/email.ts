export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

/** Trimmed address exactly as typed, or null. Keeps case for Stripe lookups. */
export function typedEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim();
  return normalizeEmail(email) ? email : null;
}

export function sameEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Stripe Search query for an exact (case-insensitive) customer email match. */
export function customerEmailQuery(email: string): string {
  return `email:"${email.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export type CustomerLike = { id: string; email?: string | null };

export type CustomerLookupClient<C extends CustomerLike> = {
  customers: {
    list(params: { email: string; limit: number }): Promise<{ data: C[] }>;
    search(params: { query: string; limit: number }): Promise<{ data: C[] }>;
  };
};

/**
 * Stripe's `customers.list({ email })` filter is case-sensitive, and Checkout stores
 * the address as the buyer typed it. Look up the typed and lowercased forms with
 * `list` (no indexing delay), then Stripe Search (case-insensitive, may lag ~1 min),
 * and keep only customers whose email matches ignoring case.
 */
export async function findCustomersByEmail<C extends CustomerLike>(
  stripe: CustomerLookupClient<C>,
  rawEmail: unknown,
): Promise<C[]> {
  const typed = typedEmail(rawEmail);
  const lower = normalizeEmail(rawEmail);
  if (!typed || !lower) return [];
  const found = new Map<string, C>();
  const keep = (list: C[]) => {
    for (const customer of list) {
      if (sameEmail(customer.email, lower) && !found.has(customer.id)) found.set(customer.id, customer);
    }
  };
  for (const variant of new Set([typed, lower])) {
    keep((await stripe.customers.list({ email: variant, limit: 10 })).data);
  }
  try {
    keep((await stripe.customers.search({ query: customerEmailQuery(lower), limit: 10 })).data);
  } catch (err) {
    // Search is unavailable in some regions; the list lookups above still ran.
    console.error("customer search failed", err instanceof Error ? err.message : "unknown");
  }
  return [...found.values()];
}
