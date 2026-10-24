import { createHmac, timingSafeEqual } from "node:crypto";

export const PRO_COOKIE_NAME = "qr_pro";
/** Browser lifetime of the signed cookie. Each successful Stripe re-check slides it. */
export const PRO_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 14;
/**
 * Separate cookie that lets this browser open the Stripe billing portal.
 * Issued only after a completed Checkout (the Session id is proof of purchase),
 * never by email restore. It survives a lapsed subscription so past_due or unpaid
 * customers can still fix their card or cancel.
 */
export const BILLING_COOKIE_NAME = "qr_billing";
export const BILLING_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;
/** How long a signed cookie is trusted before we ask Stripe again. */
export const PRO_REVALIDATE_AFTER_MS = 60 * 60 * 1000;

/** `sub` and `st` used in the cookie for lifetime buyers. There is no subscription to point at. */
export const LIFETIME_SUB = "lifetime";
export const LIFETIME_STATUS = "lifetime";

const ENTITLED_STATUSES = new Set(["active", "trialing", LIFETIME_STATUS]);

export type ProClaims = {
  v: 1;
  /** Stripe subscription id, or "lifetime" for a one-time lifetime purchase */
  sub: string;
  /** Stripe customer id */
  cus: string;
  /** Subscription status at last successful Stripe check */
  st: string;
  /** Current period end, unix seconds. 0 if Stripe did not report one. */
  pe: number;
  /** Issued-at, unix milliseconds. */
  iat: number;
  /** Token expiry, unix seconds. */
  exp: number;
};

/** Billing-portal access for one Stripe customer. Not a Pro entitlement. */
export type BillingClaims = {
  v: 1;
  k: "billing";
  cus: string;
  iat: number;
  exp: number;
};

export function isEntitledStatus(status: string): boolean {
  return ENTITLED_STATUSES.has(status);
}

export function issueClaims(input: {
  sub: string;
  cus: string;
  status: string;
  periodEnd: number;
  now?: number;
}): ProClaims {
  const now = input.now ?? Date.now();
  return {
    v: 1,
    sub: input.sub,
    cus: input.cus,
    st: input.status,
    pe: input.periodEnd,
    iat: now,
    exp: Math.floor(now / 1000) + PRO_COOKIE_TTL_SECONDS,
  };
}

export function isLifetimeClaims(claims: Pick<ProClaims, "sub">): boolean {
  return claims.sub === LIFETIME_SUB;
}

export function claimsNeedRefresh(claims: ProClaims, now = Date.now()): boolean {
  if (!isEntitledStatus(claims.st)) return true;
  if (claims.exp * 1000 <= now) return true;
  if (now - claims.iat >= PRO_REVALIDATE_AFTER_MS) return true;
  if (claims.pe > 0 && claims.pe * 1000 <= now) return true;
  return false;
}

function cookieSecret(): string {
  const secret = process.env.PRO_COOKIE_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("PRO_COOKIE_SECRET must be set to at least 16 characters");
  }
  return secret;
}

type TokenPurpose = "pro" | "billing" | "restore";

/** HMAC input is prefixed per token type so a Pro token never verifies as a billing or restore token. */
function mac(purpose: TokenPurpose, body: string): string {
  const input = purpose === "pro" ? body : `${purpose}.${body}`;
  return createHmac("sha256", cookieSecret()).update(input).digest("base64url");
}

function sign(purpose: TokenPurpose, claims: object): string {
  const body = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  return `${body}.${mac(purpose, body)}`;
}

function openToken(purpose: TokenPurpose, token: string): Record<string, unknown> | null {
  if (token.length === 0 || token.length > 4096) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot !== token.lastIndexOf(".")) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(mac(purpose, body));
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** True once `exp` (unix seconds) has passed. Expired claims are never returned. */
export function isExpired(exp: number, now = Date.now()): boolean {
  return !Number.isFinite(exp) || exp * 1000 <= now;
}

export function signProToken(claims: ProClaims): string {
  return sign("pro", claims);
}

export function verifyProToken(token: string, now = Date.now()): ProClaims | null {
  const parsed = openToken("pro", token) as Partial<ProClaims> | null;
  if (!parsed) return null;
  if (parsed.v !== 1 || typeof parsed.sub !== "string" || typeof parsed.cus !== "string") return null;
  if (!(parsed.sub.startsWith("sub_") || parsed.sub === LIFETIME_SUB) || !parsed.cus.startsWith("cus_")) return null;
  if (typeof parsed.st !== "string" || typeof parsed.pe !== "number") return null;
  if (typeof parsed.iat !== "number" || typeof parsed.exp !== "number") return null;
  if (isExpired(parsed.exp, now)) return null;
  return parsed as ProClaims;
}

export function issueBillingClaims(cus: string, now = Date.now()): BillingClaims {
  return { v: 1, k: "billing", cus, iat: now, exp: Math.floor(now / 1000) + BILLING_COOKIE_TTL_SECONDS };
}

export function signBillingToken(claims: BillingClaims): string {
  return sign("billing", claims);
}

export function verifyBillingToken(token: string, now = Date.now()): BillingClaims | null {
  const parsed = openToken("billing", token) as Partial<BillingClaims> | null;
  if (!parsed) return null;
  if (parsed.v !== 1 || parsed.k !== "billing" || typeof parsed.cus !== "string") return null;
  if (!parsed.cus.startsWith("cus_")) return null;
  if (typeof parsed.iat !== "number" || typeof parsed.exp !== "number") return null;
  if (isExpired(parsed.exp, now)) return null;
  return parsed as BillingClaims;
}

/** Magic-link restore (Legal Review 2026-10-24 §3b.2). Single use via `jti` on the Stripe Customer. */
export const RESTORE_TOKEN_TTL_SECONDS = 15 * 60;

export type RestoreClaims = {
  v: 1;
  k: "restore";
  cus: string;
  /** Random id also stored on the Customer; cleared when the link is used. */
  jti: string;
  exp: number;
};

export function issueRestoreClaims(cus: string, jti: string, now = Date.now()): RestoreClaims {
  return { v: 1, k: "restore", cus, jti, exp: Math.floor(now / 1000) + RESTORE_TOKEN_TTL_SECONDS };
}

export function signRestoreToken(claims: RestoreClaims): string {
  return sign("restore", claims);
}

export function verifyRestoreToken(token: string, now = Date.now()): RestoreClaims | null {
  const parsed = openToken("restore", token) as Partial<RestoreClaims> | null;
  if (!parsed) return null;
  if (parsed.v !== 1 || parsed.k !== "restore" || typeof parsed.cus !== "string" || !parsed.cus.startsWith("cus_")) return null;
  if (typeof parsed.jti !== "string" || parsed.jti.length < 16 || typeof parsed.exp !== "number") return null;
  if (isExpired(parsed.exp, now)) return null;
  return parsed as RestoreClaims;
}
