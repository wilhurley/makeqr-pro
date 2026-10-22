import { createHmac, timingSafeEqual } from "node:crypto";

export const PRO_COOKIE_NAME = "qr_pro";
/** Browser lifetime of the signed cookie. Each successful Stripe re-check slides it. */
export const PRO_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 14;
/** How long a signed cookie is trusted before we ask Stripe again. */
export const PRO_REVALIDATE_AFTER_MS = 60 * 60 * 1000;

const ENTITLED_STATUSES = new Set(["active", "trialing"]);

export type ProClaims = {
  v: 1;
  /** Stripe subscription id */
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

export function signProToken(claims: ProClaims): string {
  const body = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const sig = createHmac("sha256", cookieSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyProToken(token: string): ProClaims | null {
  if (token.length === 0 || token.length > 4096) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot !== token.lastIndexOf(".")) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", cookieSecret()).update(body).digest("base64url");
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<ProClaims>;
    if (parsed.v !== 1 || typeof parsed.sub !== "string" || typeof parsed.cus !== "string") return null;
    if (!parsed.sub.startsWith("sub_") || !parsed.cus.startsWith("cus_")) return null;
    if (typeof parsed.st !== "string" || typeof parsed.pe !== "number") return null;
    if (typeof parsed.iat !== "number" || typeof parsed.exp !== "number") return null;
    return parsed as ProClaims;
  } catch {
    return null;
  }
}
