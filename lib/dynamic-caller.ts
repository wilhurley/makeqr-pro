import type { NextRequest } from "next/server";
import type { Caller } from "./dynamic-qr";
import { clientIp } from "./rate-limit";
import { isEntitledStatus, PRO_COOKIE_NAME, verifyProToken } from "./pro-token";

/**
 * Identity is the Stripe customer id inside the signed qr_pro cookie (there are
 * no separate accounts). The cookie is re-checked against Stripe by /api/pro at
 * least hourly; the dashboard calls /api/pro?fresh=1 before it loads.
 */
export function callerFrom(req: NextRequest): Caller {
  const ip = clientIp(req.headers);
  const token = req.cookies.get(PRO_COOKIE_NAME)?.value;
  if (!token) return { owner: null, pro: false, ip };
  try {
    const claims = verifyProToken(token);
    if (!claims) return { owner: null, pro: false, ip };
    const periodOpen = claims.pe === 0 || claims.pe * 1000 > Date.now();
    return { owner: claims.cus, pro: isEntitledStatus(claims.st) && periodOpen, ip };
  } catch {
    return { owner: null, pro: false, ip };
  }
}
