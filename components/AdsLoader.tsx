"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { ADSENSE_SRC, shouldLoadAds } from "@/lib/ads";

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
    if (!shouldLoadAds(search, { ok: true, body: { pro: false } })) return; // checkout return: skip this load
    fetch("/api/pro", { cache: "no-store", credentials: "same-origin" })
      .then(async (res) => ({ ok: res.ok, body: await res.json().catch(() => null) }))
      .catch(() => null)
      .then((response) => {
        if (!cancelled && shouldLoadAds(search, response)) setLoad(true);
      });
    return () => { cancelled = true; };
  }, []);

  if (!load) return null;
  return <Script async src={ADSENSE_SRC} crossOrigin="anonymous" strategy="afterInteractive" />;
}
