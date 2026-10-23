import { NextResponse } from "next/server";
import {
  BILLING_COOKIE_NAME,
  BILLING_COOKIE_TTL_SECONDS,
  PRO_COOKIE_NAME,
  PRO_COOKIE_TTL_SECONDS,
  signBillingToken,
  signProToken,
  type BillingClaims,
  type ProClaims,
} from "./pro-token";

function cookieOptions(maxAge = PRO_COOKIE_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function withProCookie(res: NextResponse, claims: ProClaims) {
  res.cookies.set(PRO_COOKIE_NAME, signProToken(claims), cookieOptions());
  return res;
}

export function withoutProCookie(res: NextResponse) {
  res.cookies.set(PRO_COOKIE_NAME, "", cookieOptions(0));
  return res;
}

export function withBillingCookie(res: NextResponse, claims: BillingClaims) {
  res.cookies.set(BILLING_COOKIE_NAME, signBillingToken(claims), cookieOptions(BILLING_COOKIE_TTL_SECONDS));
  return res;
}

export function withoutBillingCookie(res: NextResponse) {
  res.cookies.set(BILLING_COOKIE_NAME, "", cookieOptions(0));
  return res;
}
