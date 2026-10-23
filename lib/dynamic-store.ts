import type { DynamicCode, DynamicStore } from "./dynamic-qr";
import { MemoryStore } from "./dynamic-qr";

/**
 * Upstash Redis over its REST API (no SDK). On Vercel, add the Upstash Redis
 * integration from the Marketplace; it sets KV_REST_API_URL and KV_REST_API_TOKEN.
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are accepted too.
 *
 * Keys:
 *   dq:<slug>        hash  owner, destination, label, createdAt, updatedAt, scans, lastScanAt
 *   dq:own:<cus>     set   slugs owned by a Stripe customer
 *   rl:dq:...        counters for rate limits (expire on their own)
 */
type Cmd = (string | number)[];

class RedisStore implements DynamicStore {
  constructor(private url: string, private token: string) {}

  private async pipeline(cmds: Cmd[]): Promise<unknown[]> {
    const res = await fetch(`${this.url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmds.map((c) => c.map(String))),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`redis http ${res.status}`);
    const out = (await res.json()) as { result?: unknown; error?: string }[];
    return out.map((r) => {
      if (r.error) throw new Error("redis error");
      return r.result;
    });
  }

  private static parse(slug: string, flat: unknown): DynamicCode | null {
    if (!Array.isArray(flat) || flat.length === 0) return null;
    const h: Record<string, string> = {};
    for (let i = 0; i < flat.length; i += 2) h[String(flat[i])] = String(flat[i + 1]);
    if (!h.owner || !h.destination) return null;
    return {
      slug,
      owner: h.owner,
      destination: h.destination,
      label: h.label ?? "",
      createdAt: Number(h.createdAt) || 0,
      updatedAt: Number(h.updatedAt) || 0,
      scans: Number(h.scans) || 0,
      lastScanAt: Number(h.lastScanAt) || 0,
    };
  }

  async get(slug: string) {
    const [flat] = await this.pipeline([["HGETALL", `dq:${slug}`]]);
    return RedisStore.parse(slug, flat);
  }

  async insert(c: DynamicCode) {
    // HSETNX on owner claims the slug atomically.
    const [claimed] = await this.pipeline([["HSETNX", `dq:${c.slug}`, "owner", c.owner]]);
    if (Number(claimed) !== 1) return false;
    await this.pipeline([
      ["HSET", `dq:${c.slug}`, "destination", c.destination, "label", c.label, "createdAt", c.createdAt, "updatedAt", c.updatedAt, "scans", 0, "lastScanAt", 0],
      ["SADD", `dq:own:${c.owner}`, c.slug],
    ]);
    return true;
  }

  async updateDestination(slug: string, destination: string, label: string, now: number) {
    await this.pipeline([["HSET", `dq:${slug}`, "destination", destination, "label", label, "updatedAt", now]]);
  }

  async listByOwner(owner: string) {
    const [slugs] = await this.pipeline([["SMEMBERS", `dq:own:${owner}`]]);
    const list = Array.isArray(slugs) ? slugs.map(String) : [];
    if (list.length === 0) return [];
    const rows = await this.pipeline(list.map((s) => ["HGETALL", `dq:${s}`]));
    return rows
      .map((r, i) => RedisStore.parse(list[i], r))
      .filter((c): c is DynamicCode => !!c && c.owner === owner)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async countByOwner(owner: string) {
    const [n] = await this.pipeline([["SCARD", `dq:own:${owner}`]]);
    return Number(n) || 0;
  }

  async recordScan(slug: string, now: number) {
    await this.pipeline([
      ["HINCRBY", `dq:${slug}`, "scans", 1],
      ["HSET", `dq:${slug}`, "lastScanAt", now],
    ]);
  }

  async hit(key: string, limit: number, windowSec: number) {
    const [n] = await this.pipeline([["INCR", key], ["EXPIRE", key, windowSec, "NX"]]);
    return Number(n) <= limit;
  }
}

let memory: MemoryStore | null = null;

/** Null when Redis isn't configured in production, so the feature fails closed. */
export function getDynamicStore(): DynamicStore | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return new RedisStore(url, token);
  if (process.env.NODE_ENV !== "production") return (memory ??= new MemoryStore());
  return null;
}
