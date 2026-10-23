/**
 * Dynamic QR codes: the printed code points at https://makeqr.pro/r/<slug>,
 * and the owner can change where that slug redirects. Pure logic lives here so
 * it can be unit tested without Redis or Next.
 */

export const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const SLUG_LENGTH = 7;
export const MAX_URL_LENGTH = 2048;
export const MAX_LABEL_LENGTH = 80;
export const MAX_CODES_PER_OWNER = 500;
/** Creation limits. Edits get a looser limit. */
export const CREATE_LIMIT_PER_OWNER = { limit: 20, windowSec: 60 * 60 };
export const CREATE_LIMIT_PER_IP = { limit: 30, windowSec: 60 * 60 };
export const EDIT_LIMIT_PER_OWNER = { limit: 120, windowSec: 60 * 60 };

/** Hosts we refuse to redirect to: our own redirect host (loops) and local/private targets. */
const BLOCKED_HOSTS = new Set(["makeqr.pro", "www.makeqr.pro", "qrmaker.pro", "www.qrmaker.pro", "localhost"]);

export type DynamicCode = {
  slug: string;
  owner: string;
  destination: string;
  label: string;
  createdAt: number;
  updatedAt: number;
  scans: number;
  lastScanAt: number;
};

export type ValidationResult = { ok: true; url: string } | { ok: false; error: string };

function isPrivateIpv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** Only absolute http(s) URLs. Blocks javascript:, data:, file:, etc. */
export function validateDestination(input: unknown): ValidationResult {
  if (typeof input !== "string") return { ok: false, error: "Enter a link." };
  // Strip whitespace and control characters people paste in by accident.
  const raw = input.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!raw) return { ok: false, error: "Enter a link." };
  if (raw.length > MAX_URL_LENGTH) return { ok: false, error: "That link is too long (2,048 characters max)." };
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false, error: "That doesn't look like a valid link." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "Only http:// and https:// links can be used." };
  }
  if (url.username || url.password) return { ok: false, error: "Links with a username or password aren't allowed." };
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") && !host.startsWith("[")) return { ok: false, error: "That doesn't look like a public website." };
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local") || host.startsWith("[") || isPrivateIpv4(host)) {
    return { ok: false, error: "That link can't be used as a destination." };
  }
  if (url.href.length > MAX_URL_LENGTH) return { ok: false, error: "That link is too long (2,048 characters max)." };
  return { ok: true, url: url.href };
}

export function cleanLabel(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, MAX_LABEL_LENGTH);
}

export function isValidSlug(slug: unknown): slug is string {
  if (typeof slug !== "string" || slug.length !== SLUG_LENGTH) return false;
  for (const ch of slug) if (!SLUG_ALPHABET.includes(ch)) return false;
  return true;
}

export function generateSlug(randomBytes: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  // Rejection sampling keeps the distribution even.
  const max = 256 - (256 % SLUG_ALPHABET.length);
  let out = "";
  while (out.length < SLUG_LENGTH) {
    for (const b of randomBytes(SLUG_LENGTH * 2)) {
      if (b < max) out += SLUG_ALPHABET[b % SLUG_ALPHABET.length];
      if (out.length === SLUG_LENGTH) break;
    }
  }
  return out;
}

export function redirectUrl(slug: string, origin = "https://makeqr.pro"): string {
  return `${origin}/r/${slug}`;
}

/** Storage the service needs. Redis in production, a Map in tests. */
export interface DynamicStore {
  get(slug: string): Promise<DynamicCode | null>;
  /** Insert only if the slug is free. Returns false on collision. */
  insert(code: DynamicCode): Promise<boolean>;
  updateDestination(slug: string, destination: string, label: string, now: number): Promise<void>;
  listByOwner(owner: string): Promise<DynamicCode[]>;
  countByOwner(owner: string): Promise<number>;
  recordScan(slug: string, now: number): Promise<void>;
  /** Fixed-window counter. Returns true if this hit is allowed. */
  hit(key: string, limit: number, windowSec: number): Promise<boolean>;
}

export type ServiceError = { ok: false; status: number; error: string };
type Ok<T> = { ok: true; value: T };

/**
 * `owner` is the Stripe customer id from the signed Pro cookie, or null.
 * `pro` is whether that customer currently has Pro.
 */
export type Caller = { owner: string | null; pro: boolean; ip: string };

const LOCKED: ServiceError = {
  ok: false,
  status: 402,
  error: "Editing needs an active Pro plan. Your existing codes still redirect.",
};

export async function createCode(
  store: DynamicStore,
  caller: Caller,
  input: { destination?: unknown; label?: unknown },
  now = Date.now(),
  slugFn: () => string = generateSlug,
): Promise<Ok<DynamicCode> | ServiceError> {
  if (!caller.owner) return { ok: false, status: 401, error: "Sign in to Pro to make dynamic codes." };
  if (!caller.pro) return { ok: false, status: 402, error: "Dynamic codes are a Pro feature." };
  const v = validateDestination(input.destination);
  if (!v.ok) return { ok: false, status: 400, error: v.error };
  const okIp = await store.hit(`rl:dq:create:ip:${caller.ip}`, CREATE_LIMIT_PER_IP.limit, CREATE_LIMIT_PER_IP.windowSec);
  const okOwner = await store.hit(`rl:dq:create:own:${caller.owner}`, CREATE_LIMIT_PER_OWNER.limit, CREATE_LIMIT_PER_OWNER.windowSec);
  if (!okIp || !okOwner) return { ok: false, status: 429, error: "You're making codes very quickly. Try again in an hour." };
  if ((await store.countByOwner(caller.owner)) >= MAX_CODES_PER_OWNER) {
    return { ok: false, status: 400, error: `You've hit the limit of ${MAX_CODES_PER_OWNER} dynamic codes. Email support if you need more.` };
  }
  for (let i = 0; i < 5; i++) {
    const code: DynamicCode = {
      slug: slugFn(),
      owner: caller.owner,
      destination: v.url,
      label: cleanLabel(input.label),
      createdAt: now,
      updatedAt: now,
      scans: 0,
      lastScanAt: 0,
    };
    if (await store.insert(code)) return { ok: true, value: code };
  }
  return { ok: false, status: 500, error: "Couldn't create a code. Try again." };
}

export async function updateCode(
  store: DynamicStore,
  caller: Caller,
  slug: unknown,
  input: { destination?: unknown; label?: unknown },
  now = Date.now(),
): Promise<Ok<DynamicCode> | ServiceError> {
  if (!caller.owner) return { ok: false, status: 401, error: "Sign in to Pro to edit codes." };
  if (!isValidSlug(slug)) return { ok: false, status: 404, error: "Code not found." };
  const existing = await store.get(slug);
  // Same answer for "missing" and "not yours" so slugs can't be probed.
  if (!existing || existing.owner !== caller.owner) return { ok: false, status: 404, error: "Code not found." };
  if (!caller.pro) return LOCKED;
  const v = validateDestination(input.destination);
  if (!v.ok) return { ok: false, status: 400, error: v.error };
  if (!(await store.hit(`rl:dq:edit:own:${caller.owner}`, EDIT_LIMIT_PER_OWNER.limit, EDIT_LIMIT_PER_OWNER.windowSec))) {
    return { ok: false, status: 429, error: "Too many edits. Try again in a bit." };
  }
  const label = input.label === undefined ? existing.label : cleanLabel(input.label);
  await store.updateDestination(slug, v.url, label, now);
  return { ok: true, value: { ...existing, destination: v.url, label, updatedAt: now } };
}

/**
 * What /r/<slug> should do. Works whether or not the owner still has Pro.
 * Re-validates the stored URL so a bad value can never be served.
 */
export async function resolveRedirect(store: DynamicStore, slug: unknown, now = Date.now()): Promise<string | null> {
  if (!isValidSlug(slug)) return null;
  const code = await store.get(slug);
  if (!code) return null;
  const v = validateDestination(code.destination);
  if (!v.ok) return null;
  try {
    await store.recordScan(slug, now);
  } catch {
    // Never break a redirect because the counter failed.
  }
  return v.url;
}

/** In-memory store for tests and local dev without Redis. */
export class MemoryStore implements DynamicStore {
  codes = new Map<string, DynamicCode>();
  counters = new Map<string, { n: number; reset: number }>();
  clock: () => number = () => Date.now();
  async get(slug: string) {
    const c = this.codes.get(slug);
    return c ? { ...c } : null;
  }
  async insert(code: DynamicCode) {
    if (this.codes.has(code.slug)) return false;
    this.codes.set(code.slug, { ...code });
    return true;
  }
  async updateDestination(slug: string, destination: string, label: string, now: number) {
    const c = this.codes.get(slug);
    if (c) Object.assign(c, { destination, label, updatedAt: now });
  }
  async listByOwner(owner: string) {
    return [...this.codes.values()].filter((c) => c.owner === owner).map((c) => ({ ...c }));
  }
  async countByOwner(owner: string) {
    return (await this.listByOwner(owner)).length;
  }
  async recordScan(slug: string, now: number) {
    const c = this.codes.get(slug);
    if (c) {
      c.scans += 1;
      c.lastScanAt = now;
    }
  }
  async hit(key: string, limit: number, windowSec: number) {
    const now = this.clock();
    const cur = this.counters.get(key);
    if (!cur || cur.reset <= now) {
      this.counters.set(key, { n: 1, reset: now + windowSec * 1000 });
      return true;
    }
    cur.n += 1;
    return cur.n <= limit;
  }
}
