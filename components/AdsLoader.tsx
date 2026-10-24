"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { ADSENSE_SRC, shouldLoadAds } from "@/lib/ads";
import { PENDING_SESSION_KEY } from "@/lib/activation";

/**
 * Injects the AdSense script only after /api/pro says this browser is not Pro
 * (monthly, yearly and lifetime all count as Pro). Nothing ad-related is
 * requested before that answer, and nothing at all for Pro users.
 */
export default function AdsLoader() {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const search = window.location.search;
    let pending = false;
    try { pending = Boolean(localStorage.getItem(PENDING_SESSION_KEY)); } catch { pending = false; }
    if (!shouldLoadAds(search, { ok: true, body: { pro: false } }, pending)) return; // checkout return: skip this load
    fetch("/api/pro", { cache: "no-store", credentials: "same-origin" })
      .then(async (res) => ({ ok: res.ok, body: await res.json().catch(() => null) }))
      .catch(() => null)
      .then((response) => {
        if (!cancelled && shouldLoadAds(search, response, pending)) setLoad(true);
      });
    return () => { cancelled = true; };
  }, []);

  if (!load) return null;
  return <Script async src={ADSENSE_SRC} crossOrigin="anonymous" strategy="afterInteractive" />;
}
