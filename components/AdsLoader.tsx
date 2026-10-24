"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { ADSENSE_SRC, isCheckoutReturn, shouldLoadAds } from "@/lib/ads";
import { PENDING_SESSION_KEY } from "@/lib/activation";

/**
 * Injects the AdSense script only after /api/pro says this browser is not Pro
 * (monthly, yearly and lifetime all count as Pro) AND that ads are allowed in the
 * visitor's region (never in the EEA, UK or Switzerland, or when the country is
 * unknown). Nothing ad-related is requested before that answer.
 */
export default function AdsLoader() {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const search = window.location.search;
    let pending = false;
    try { pending = Boolean(localStorage.getItem(PENDING_SESSION_KEY)); } catch { pending = false; }
    if (pending || isCheckoutReturn(search)) return; // checkout return: skip this load
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
