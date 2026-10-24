"use client";
import { PRO_PRICE } from "@/lib/pricing";

type PublicPlan = { id: "monthly" | "yearly" | "lifetime"; price: string; per: string; badge?: string };
type PlansState = { configured: boolean; plans: PublicPlan[] };

const WAITLIST_HREF =
  "mailto:support@ridgelineapps.us?subject=" +
  encodeURIComponent("MakeQR Pro waitlist") +
  "&body=" +
  encodeURIComponent("Please let me know when MakeQR Pro is available.");

import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { activationSucceeded, PENDING_SESSION_KEY, pendingSessionId } from "@/lib/activation";
import { isFreeType, previewAllowed, typeForEntitlement, type QRType } from "@/lib/qr-types";
import { checkScanability, type ECLevel } from "@/app/lib/scanability";

export type { QRType };

interface WifiData { ssid: string; password: string; encryption: string; }
interface VCardData { name: string; phone: string; email: string; company: string; website: string; }
interface GeoData   { lat: string; lng: string; label: string; }
interface EventData { title: string; location: string; start: string; end: string; notes: string; }

const TABS: { id: QRType; label: string; icon: string; pro?: boolean }[] = [
  { id: "url",   label: "Website", icon: "🔗" },
  { id: "text",  label: "Text",    icon: "📝" },
  { id: "wifi",  label: "WiFi",    icon: "📶", pro: true },
  { id: "vcard", label: "Contact", icon: "👤", pro: true },
  { id: "email", label: "Email",   icon: "✉️",  pro: true },
  { id: "phone", label: "Phone",   icon: "📞", pro: true },
  { id: "sms",   label: "SMS",     icon: "💬", pro: true },
  { id: "geo",   label: "Location",icon: "📍", pro: true },
  { id: "event", label: "Event",   icon: "📅", pro: true },
];

const COLORS = ["#000000", "#1d4ed8", "#15803d", "#b91c1c", "#7c3aed", "#c2410c", "#0f766e"];

// One-tap output presets — set size + error correction for common print/screen needs.
const OUTPUT_PRESETS: { id: string; label: string; icon: string; size: number; ec: ECLevel; desc: string }[] = [
  { id: "flyer",   label: "Print on a flyer", icon: "📄", size: 1024, ec: "H", desc: "Large & high-res for posters" },
  { id: "sticker", label: "Small sticker",    icon: "🔖", size: 512,  ec: "H", desc: "Max error correction, tiny prints" },
  { id: "card",    label: "Business card",    icon: "💳", size: 600,  ec: "Q", desc: "Crisp at card size" },
  { id: "screen",  label: "Share on screen",  icon: "📱", size: 256,  ec: "M", desc: "Quick on-screen sharing" },
];

// Format a datetime-local value (e.g. 2026-01-15T14:30) as an iCalendar local stamp
// (20260115T143000). Seconds are appended since the picker omits them.
function toICalStamp(v: string): string {
  if (!v) return "";
  return v.replace(/[-:]/g, "") + "00";
}

const PRO_FEATURES = [
  { icon: "📶", title: "WiFi, SMS, Contact QR codes", desc: "All 7 QR types" },
  { icon: "🖼️", title: "Logo in QR code", desc: "Add your brand logo to the center" },
  { icon: "📦", title: "Bulk generator", desc: "Paste a list of URLs, one per line, and download a ZIP" },
  { icon: "📐", title: "Larger sizes up to 1024px", desc: "High-res for print & signage" },
  { icon: "🚫", title: "No ads", desc: "Clean, distraction-free experience" },
  { icon: "⬇️", title: "SVG download", desc: "Perfect vector quality at any size" },
];

export default function QrGenerator({
  initialType = "url",
  children,
}: {
  initialType?: QRType;
  children?: ReactNode;
}) {
  const [type, setType]           = useState<QRType>(initialType);
  const [url, setUrl]             = useState("https://");
  const [text, setText]           = useState("");
  const [email, setEmail]         = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [phone, setPhone]         = useState("");
  const [smsPhone, setSmsPhone]   = useState("");
  const [smsMsg, setSmsMsg]       = useState("");
  const [wifi, setWifi]           = useState<WifiData>({ ssid: "", password: "", encryption: "WPA" });
  const [vcard, setVcard]         = useState<VCardData>({ name: "", phone: "", email: "", company: "", website: "" });
  const [geo, setGeo]             = useState<GeoData>({ lat: "", lng: "", label: "" });
  const [event, setEvent]         = useState<EventData>({ title: "", location: "", start: "", end: "", notes: "" });
  const [fgColor, setFgColor]     = useState("#000000");
  const [bgColor, setBgColor]     = useState("#ffffff");
  const [size, setSize]           = useState(256);
  const [ecLevel, setEcLevel]     = useState<ECLevel>("H");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied]       = useState(false);
  const [isPro, setIsPro]         = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [logoFile, setLogoFile]   = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlansState | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);
  const [canManageBilling, setCanManageBilling] = useState(false);
  const [billingMessage, setBillingMessage] = useState("");
  const [activationState, setActivationState] = useState<"idle" | "working" | "failed">("idle");
  const wasPro = useRef(false);
  const [restoreEmail, setRestoreEmail] = useState("");
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");
  const [showRestoreHint, setShowRestoreHint] = useState(false);
  const [bulkText, setBulkText]   = useState("https://example.com\nhttps://site2.com\nhttps://site3.com");
  const [bulkLoading, setBulkLoading] = useState(false);

  const proLocked = !isFreeType(type) && !isPro;
  // null while loading. "Pro coming soon" only once the server says Stripe is not configured.
  const proComingSoon = plans !== null && !plans.configured;
  const upgradeLabel = proComingSoon ? "Pro coming soon" : `Upgrade ${PRO_PRICE}/mo`;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/plans", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.configured === "boolean" && Array.isArray(data.plans)) {
          setPlans({ configured: data.configured, plans: data.plans as PublicPlan[] });
        } else {
          setPlans({ configured: false, plans: [] });
        }
      })
      .catch(() => { if (!cancelled) setPlans({ configured: false, plans: [] }); });
    return () => { cancelled = true; };
  }, []);

  // Apply a Free/Pro answer from the server. When Pro is revoked (was Pro, now Free)
  // a selected paid type drops back to URL. A free visitor who lands on a Pro page
  // (e.g. /qr-code-for/wifi) keeps the locked type, but proLocked blocks the preview
  // and every export.
  const applyEntitlement = useCallback((pro: boolean, billing: boolean) => {
    if (!pro && wasPro.current) setType((current) => typeForEntitlement(current, false));
    wasPro.current = pro;
    setIsPro(pro);
    setCanManageBilling(billing);
  }, []);

  // Verify a Checkout return. The session id is kept (URL + localStorage) until the
  // server confirms it, so a failure can be retried instead of leaving a payer on Free.
  const activateCheckout = useCallback(async (): Promise<void> => {
    const sessionId = pendingSessionId(window.location.search, localStorage.getItem(PENDING_SESSION_KEY));
    if (!sessionId) return;
    localStorage.setItem(PENDING_SESSION_KEY, sessionId);
    setActivationState("working");
    let ok = false;
    try {
      const res = await fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`);
      const body = await res.json().catch(() => null);
      ok = activationSucceeded(res, body);
    } catch {
      ok = false;
    }
    if (ok) {
      localStorage.removeItem(PENDING_SESSION_KEY);
      window.history.replaceState({}, "", window.location.pathname);
      setActivationState("idle");
    } else {
      setActivationState("failed");
    }
  }, []);

  const refreshPro = useCallback(async (fresh: boolean): Promise<boolean | null> => {
    try {
      const res = await fetch(fresh ? "/api/pro?fresh=1" : "/api/pro");
      const data = await res.json();
      const pro = Boolean(data.pro);
      applyEntitlement(pro, Boolean(data.billing));
      if (pro) {
        // Already active (for example a retry in another tab worked).
        localStorage.removeItem(PENDING_SESSION_KEY);
        setActivationState("idle");
      }
      return pro;
    } catch {
      return null;
    }
  }, [applyEntitlement]);

  // Pro comes from a signed httpOnly cookie that the server re-checks against Stripe.
  useEffect(() => {
    let cancelled = false;
    const legacyPro = localStorage.getItem("qrpro") === "true";
    localStorage.removeItem("qrpro");

    const load = async () => {
      const params = new URLSearchParams(window.location.search);
      const billingReturn = params.get("billing") === "return";

      await activateCheckout();
      if (billingReturn) window.history.replaceState({}, "", window.location.pathname);
      if (cancelled) return;

      const pro = await refreshPro(billingReturn);
      if (!cancelled && legacyPro && pro !== true) setShowRestoreHint(true);
    };

    void load();
    const interval = window.setInterval(() => { void load(); }, 60 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activateCheckout, refreshPro]);

  const retryActivation = async () => {
    await activateCheckout();
    await refreshPro(true);
  };

  const buildQrData = useCallback((): string => {
    switch (type) {
      case "url":   return url || "https://makeqr.pro";
      case "text":  return text;
      case "email": return `mailto:${email}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ""}`;
      case "phone": return `tel:${phone}`;
      case "sms":   return `sms:${smsPhone}${smsMsg ? `?body=${encodeURIComponent(smsMsg)}` : ""}`;
      case "wifi":  return `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password};;`;
      case "vcard":
        return ["BEGIN:VCARD","VERSION:3.0",`FN:${vcard.name}`,
          vcard.company ? `ORG:${vcard.company}` : "",
          vcard.phone   ? `TEL:${vcard.phone}` : "",
          vcard.email   ? `EMAIL:${vcard.email}` : "",
          vcard.website ? `URL:${vcard.website}` : "",
          "END:VCARD"].filter(Boolean).join("\n");
      case "geo":
        if (!geo.lat || !geo.lng) return "";
        return `geo:${geo.lat},${geo.lng}${geo.label ? `?q=${encodeURIComponent(geo.label)}` : ""}`;
      case "event":
        if (!event.title) return "";
        return ["BEGIN:VEVENT",
          `SUMMARY:${event.title}`,
          event.location ? `LOCATION:${event.location}` : "",
          event.start ? `DTSTART:${toICalStamp(event.start)}` : "",
          event.end   ? `DTEND:${toICalStamp(event.end)}` : "",
          event.notes ? `DESCRIPTION:${event.notes}` : "",
          "END:VEVENT"].filter(Boolean).join("\n");
      default: return "";
    }
  }, [type, url, text, email, emailSubject, phone, smsPhone, smsMsg, wifi, vcard, geo, event]);

  const generateQR = useCallback(async (data: string, w: number, fg: string, bg: string, logo: string | null, ec: ECLevel): Promise<string> => {
    const dataUrl = await QRCode.toDataURL(data, {
      width: w, margin: 2,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: ec,
    });
    if (!logo) return dataUrl;

    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = w;
      const ctx = canvas.getContext("2d")!;
      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 0, 0, w, w);
        const logoImg = new Image();
        logoImg.onload = () => {
          const logoSize = w * 0.22;
          const logoX = (w - logoSize) / 2;
          const logoY = (w - logoSize) / 2;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(logoX - 6, logoY - 6, logoSize + 12, logoSize + 12, 8);
          ctx.fill();
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          resolve(canvas.toDataURL("image/png"));
        };
        logoImg.src = logo;
      };
      qrImg.src = dataUrl;
    });
  }, []);

  useEffect(() => {
    // Free visitors on a Pro type (landing pages like /qr-code-for/wifi, or right after
    // Pro is revoked) get no QR image at all: a preview could be scanned or saved,
    // bypassing the guarded PNG/copy buttons.
    if (!previewAllowed(type, isPro)) { setQrDataUrl(""); return; }
    const data = buildQrData();
    if (!data) { setQrDataUrl(""); return; }
    let stale = false;
    const effectiveSize = isPro ? size : Math.min(size, 512);
    generateQR(data, effectiveSize, fgColor, bgColor, isPro ? logoFile : null, ecLevel)
      .then((url) => { if (!stale) setQrDataUrl(url); })
      .catch(() => { if (!stale) setQrDataUrl(""); });
    // A slow render that started while Pro was on must not land after a revoke.
    return () => { stale = true; };
  }, [buildQrData, type, fgColor, bgColor, size, logoFile, isPro, ecLevel, generateQR]);

  const scanReport = useMemo(() => {
    const effectiveSize = isPro ? size : Math.min(size, 512);
    const report = checkScanability({
      fg: fgColor,
      bg: bgColor,
      size: effectiveSize,
      contentLength: new TextEncoder().encode(buildQrData()).length,
      margin: 2,
      ec: ecLevel,
    });
    if (isPro && logoFile && ecLevel !== "H") {
      report.issues.push({ level: "warning", message: "Logos cover part of the code; use High error correction." });
    }
    return report;
  }, [buildQrData, fgColor, bgColor, size, isPro, logoFile, ecLevel]);

  const applyPreset = (p: typeof OUTPUT_PRESETS[0]) => {
    setSize(p.size);
    setEcLevel(p.ec);
    setActivePreset(p.id);
  };

  const handleTabClick = (t: typeof TABS[0]) => {
    if (t.pro && !isPro) {
      if (t.id !== type) setShowUpgrade(true);
      return;
    }
    setType(t.id);
  };

  const startCheckout = async (plan: PublicPlan["id"]) => {
    setCheckoutLoading(plan);
    setCheckoutError("");
    try {
      const res  = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.comingSoon) {
        setPlans({ configured: false, plans: [] });
        return;
      }
      setCheckoutError(typeof data.error === "string" ? data.error : "Could not start checkout.");
    } catch {
      setCheckoutError("Could not start checkout.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const openBillingPortal = async () => {
    setBillingLoading(true);
    setBillingMessage("");
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = await res.json();
      // url: our portal session. loginUrl: Stripe's emailed sign-in, for browsers
      // that restored Pro by email and so have no billing cookie.
      const next = typeof data.url === "string" ? data.url : typeof data.loginUrl === "string" ? data.loginUrl : "";
      if (next) { window.location.href = next; return; }
      setBillingMessage(typeof data.error === "string" ? data.error : "Could not open billing.");
      setBillingLoading(false);
    } catch {
      setBillingMessage("Could not open billing. Try again.");
      setBillingLoading(false);
    }
  };

  const restorePro = async () => {
    setRestoreLoading(true);
    setRestoreMessage("");
    try {
      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: restoreEmail }),
      });
      const data = await res.json();
      if (data.pro) {
        applyEntitlement(true, canManageBilling || Boolean(data.billing));
        setShowUpgrade(false);
        setShowRestoreHint(false);
        setRestoreMessage("");
      } else {
        setRestoreMessage(data.error || "No active subscription found for that email.");
      }
    } catch {
      setRestoreMessage("Could not reach the server. Try again.");
    } finally {
      setRestoreLoading(false);
    }
  };

  const downloadPng = () => {
    if (proLocked) { setShowUpgrade(true); return; }
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl; a.download = `makeqr-${type}.png`; a.click();
  };

  const downloadSvg = async () => {
    if (!isPro) { setShowUpgrade(true); return; }
    const data = buildQrData();
    if (!data) return;
    const svg = await QRCode.toString(data, { type: "svg", margin: 2, color: { dark: fgColor, light: bgColor }, errorCorrectionLevel: ecLevel });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `makeqr-${type}.svg`; a.click();
  };

  const copyToClipboard = async () => {
    if (proLocked) { setShowUpgrade(true); return; }
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl); const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch { await navigator.clipboard.writeText(qrDataUrl); }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoFile(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const generateBulk = async () => {
    if (!isPro) { setShowUpgrade(true); return; }
    setBulkLoading(true);
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const line of lines) {
      const dataUrl = await QRCode.toDataURL(line, { width: 512, margin: 2, color: { dark: fgColor, light: bgColor }, errorCorrectionLevel: ecLevel });
      const base64 = dataUrl.split(",")[1];
      const filename = line.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40) + ".png";
      zip.file(filename, base64, { base64: true });
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "qrcodes.zip"; a.click();
    setBulkLoading(false);
  };

  const inputClass = "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition";

  return (
    <>
      <header className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">Q</div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">MakeQR<span className="text-indigo-600">.pro</span></span>
            {isPro
              ? <span className="text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-medium">PRO</span>
              : <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">Free</span>
            }
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/scan" className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition">
              <span>📷</span><span>Scan</span>
            </Link>
            {(isPro || canManageBilling) && (
              <button onClick={openBillingPortal} disabled={billingLoading}
                className="text-xs border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition">
                {billingLoading ? "Opening..." : "Manage billing"}
              </button>
            )}
            {!isPro && (
              <div className="flex items-center gap-2">
                {!proComingSoon && (
                  <button onClick={() => setShowUpgrade(true)}
                    className="text-xs font-semibold text-indigo-600 hover:underline">
                    Restore
                  </button>
                )}
                <button onClick={() => setShowUpgrade(true)}
                  className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition">
                  {upgradeLabel}
                </button>
              </div>
            )}
          </div>
        </div>
        {billingMessage && (
          <p className="max-w-5xl mx-auto px-4 pb-2 text-right text-xs text-red-500">{billingMessage}</p>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {activationState !== "idle" && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-100 flex flex-wrap items-center gap-3">
            {activationState === "working"
              ? <span>Activating Pro...</span>
              : <>
                  <span className="flex-1">We could not confirm your Pro purchase yet. If you were charged, nothing is lost: try again in a moment.</span>
                  <button onClick={() => { void retryActivation(); }}
                    className="rounded-lg bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 hover:opacity-90">
                    Try again
                  </button>
                </>}
          </div>
        )}
        {showRestoreHint && !isPro && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="flex-1">
              Pro on this browser used to be saved only on this device. Restore it with the email from your Stripe receipt so cancellation applies here too.
            </p>
            <button onClick={() => setShowUpgrade(true)} className="text-sm font-semibold text-indigo-700 shrink-0">
              Restore Pro
            </button>
          </div>
        )}
        {children ?? (
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Free QR Code Generator</h1>
            <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto">
              Make a QR code for a link or text in seconds. Free, no signup, no watermark. Pro adds WiFi, contact cards, SMS, email, phone, locations, calendar events, logos and SVG.
            </p>
            <p className="mt-3">
              <Link href="/scan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline">
                📷 Need to read one? Scan a QR code →
              </Link>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">QR Type</p>
              <div className="flex flex-wrap gap-2">
                {TABS.map((t) => (
                  <button key={t.id} onClick={() => handleTabClick(t)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 min-h-11 rounded-xl text-sm font-medium transition-all relative ${
                      type === t.id
                        ? "bg-indigo-600 text-white shadow-md scale-105"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700"
                    }`}>
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    {t.pro && !isPro && <span className="text-[9px] ml-0.5 opacity-70">PRO</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Content</p>
              {type === "url"   && <input className={inputClass} type="url" placeholder="https://yourwebsite.com" value={url} onChange={e => setUrl(e.target.value)} />}
              {type === "text"  && <textarea className={inputClass} rows={4} placeholder="Enter any text..." value={text} onChange={e => setText(e.target.value)} />}
              {type === "email" && (<><input className={inputClass} type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} /><input className={inputClass} type="text" placeholder="Subject (optional)" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} /></>)}
              {type === "phone" && <input className={inputClass} type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />}
              {type === "sms"   && (<><input className={inputClass} type="tel" placeholder="Phone number" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} /><textarea className={inputClass} rows={3} placeholder="Message (optional)" value={smsMsg} onChange={e => setSmsMsg(e.target.value)} /></>)}
              {type === "wifi"  && (<><input className={inputClass} type="text" placeholder="Network name (SSID)" value={wifi.ssid} onChange={e => setWifi(w => ({ ...w, ssid: e.target.value }))} /><input className={inputClass} type="text" placeholder="Password" value={wifi.password} onChange={e => setWifi(w => ({ ...w, password: e.target.value }))} /><select className={inputClass} value={wifi.encryption} onChange={e => setWifi(w => ({ ...w, encryption: e.target.value }))}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">No Password</option></select></>)}
              {type === "vcard" && (<><input className={inputClass} type="text" placeholder="Full name *" value={vcard.name} onChange={e => setVcard(v => ({ ...v, name: e.target.value }))} /><input className={inputClass} type="text" placeholder="Company" value={vcard.company} onChange={e => setVcard(v => ({ ...v, company: e.target.value }))} /><input className={inputClass} type="tel" placeholder="Phone" value={vcard.phone} onChange={e => setVcard(v => ({ ...v, phone: e.target.value }))} /><input className={inputClass} type="email" placeholder="Email" value={vcard.email} onChange={e => setVcard(v => ({ ...v, email: e.target.value }))} /><input className={inputClass} type="url" placeholder="Website" value={vcard.website} onChange={e => setVcard(v => ({ ...v, website: e.target.value }))} /></>)}
              {type === "geo"   && (<><div className="grid grid-cols-2 gap-3"><input className={inputClass} type="text" inputMode="decimal" placeholder="Latitude *" value={geo.lat} onChange={e => setGeo(g => ({ ...g, lat: e.target.value }))} /><input className={inputClass} type="text" inputMode="decimal" placeholder="Longitude *" value={geo.lng} onChange={e => setGeo(g => ({ ...g, lng: e.target.value }))} /></div><input className={inputClass} type="text" placeholder="Place label (optional)" value={geo.label} onChange={e => setGeo(g => ({ ...g, label: e.target.value }))} /><p className="text-xs text-gray-400">Tip: copy coordinates from Google Maps (right-click a spot → the lat, long at the top).</p></>)}
              {type === "event" && (<><input className={inputClass} type="text" placeholder="Event title *" value={event.title} onChange={e => setEvent(v => ({ ...v, title: e.target.value }))} /><input className={inputClass} type="text" placeholder="Location (optional)" value={event.location} onChange={e => setEvent(v => ({ ...v, location: e.target.value }))} /><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="text-xs text-gray-500">Starts<input className={inputClass + " mt-1"} type="datetime-local" value={event.start} onChange={e => setEvent(v => ({ ...v, start: e.target.value }))} /></label><label className="text-xs text-gray-500">Ends<input className={inputClass + " mt-1"} type="datetime-local" value={event.end} onChange={e => setEvent(v => ({ ...v, end: e.target.value }))} /></label></div><textarea className={inputClass} rows={2} placeholder="Notes (optional)" value={event.notes} onChange={e => setEvent(v => ({ ...v, notes: e.target.value }))} /></>)}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick presets</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {OUTPUT_PRESETS.map(p => (
                  <button key={p.id} onClick={() => applyPreset(p)}
                    className={`text-left rounded-xl border p-3 transition active:scale-95 ${
                      activePreset === p.id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-500"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-gray-800"
                    }`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-base">{p.icon}</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{p.label}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">{p.desc}</p>
                  </button>
                ))}
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customize</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">QR Color</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setFgColor(c)}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${fgColor === c ? "border-indigo-500 scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                    <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Background</label>
                  <div className="flex items-center gap-2">
                    {["#ffffff","#f8fafc","#fef9c3","#fee2e2","#dbeafe"].map(c => (
                      <button key={c} onClick={() => setBgColor(c)}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${bgColor === c ? "border-indigo-500 scale-110" : "border-gray-200"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs text-gray-500 mb-1.5 block">
                  Size: <span className="font-semibold text-gray-700 dark:text-gray-300">{Math.min(size, isPro ? 1024 : 512)}×{Math.min(size, isPro ? 1024 : 512)}px</span>
                  {!isPro && size > 512 && <span className="text-indigo-500 ml-1">(unlock up to 1024px with Pro)</span>}
                </label>
                <input type="range" min={128} max={isPro ? 1024 : 512} step={32} value={Math.min(size, isPro ? 1024 : 512)}
                  onChange={e => { setSize(Number(e.target.value)); setActivePreset(null); }} className="w-full accent-indigo-600" />
              </div>
              <div className="mt-4">
                <label className="text-xs text-gray-500 mb-1.5 block">
                  Error correction
                  <span className="text-gray-400"> — higher = more scannable if damaged or has a logo</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { v: "L", t: "Low" },
                    { v: "M", t: "Medium" },
                    { v: "Q", t: "High" },
                    { v: "H", t: "Max" },
                  ] as { v: ECLevel; t: string }[]).map(o => (
                    <button key={o.v} onClick={() => { setEcLevel(o.v); setActivePreset(null); }}
                      className={`py-2 rounded-xl text-xs font-semibold transition active:scale-95 ${
                        ecLevel === o.v
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700"
                      }`}>
                      {o.t}
                    </button>
                  ))}
                </div>
              </div>

              {isPro && (
                <div className="mt-4">
                  <label className="text-xs text-gray-500 mb-1.5 block">Logo in center (Pro)</label>
                  <div className="flex items-center gap-3">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-gray-500" />
                    {logoFile && <button onClick={() => setLogoFile(null)} className="text-xs text-red-500 hover:underline">Remove</button>}
                  </div>
                </div>
              )}
              {!isPro && (
                <button onClick={() => setShowUpgrade(true)}
                  className="mt-4 w-full text-sm text-indigo-600 border border-dashed border-indigo-300 rounded-xl py-2.5 hover:bg-indigo-50 transition flex items-center justify-center gap-2">
                  🖼️ <span>Add logo to center <span className="font-semibold">— Pro feature</span></span>
                </button>
              )}
            </div>

            {isPro ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bulk Generator</p>
                  <span className="text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full">PRO</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">One URL per line. Download them as a ZIP. Paste the list, there&apos;s no spreadsheet upload.</p>
                <textarea className={inputClass} rows={5} value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder="https://site1.com&#10;https://site2.com&#10;https://site3.com" />
                <button onClick={generateBulk} disabled={bulkLoading}
                  className="mt-3 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition text-sm">
                  {bulkLoading ? "Generating..." : `Generate ${bulkText.split("\n").filter(l => l.trim()).length} QR Codes → ZIP`}
                </button>
              </div>
            ) : (
              <button onClick={() => setShowUpgrade(true)}
                className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-800 p-4 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950 transition">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📦</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Bulk QR Generator <span className="text-indigo-600">— Pro</span></p>
                    <p className="text-xs text-gray-500">Paste a list of URLs, one per line, and download a ZIP</p>
                  </div>
                </div>
              </button>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm sticky top-24">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Preview</p>
              <div className="flex items-center justify-center mb-4">
                {qrDataUrl ? (
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="QR Code" width={240} height={240} className="block" style={{ imageRendering: "pixelated" }} />
                  </div>
                ) : (
                  <div className="w-48 h-48 rounded-2xl bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span className="text-sm text-center px-3">{proLocked ? "Preview is part of Pro" : "Enter content above"}</span>
                  </div>
                )}
              </div>
              {qrDataUrl && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`mb-4 rounded-xl p-3 text-xs ${
                    scanReport.issues.length === 0
                      ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                      : scanReport.issues.some(i => i.level === "error")
                        ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                        : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {scanReport.issues.length === 0 ? (
                    <p className="font-medium">✓ Looks easy to scan</p>
                  ) : (
                    <ul className="space-y-1">
                      {scanReport.issues.map((issue, i) => (
                        <li
                          key={i}
                          className={issue.level === "error" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}
                        >
                          {issue.message}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-gray-400 mt-1.5">Contrast ratio: {scanReport.contrastRatio.toFixed(1)}:1</p>
                </div>
              )}
              <div className="space-y-2">
                <button onClick={downloadPng} disabled={!qrDataUrl}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-3 px-4 rounded-xl transition-all active:scale-95">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {proLocked ? "PNG — Pro" : "Download PNG"}
                </button>
                <button onClick={downloadSvg} disabled={!qrDataUrl}
                  className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-40 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-xl transition-all active:scale-95">
                  {isPro ? "Download SVG" : "SVG — Pro"}
                </button>
                <button onClick={copyToClipboard} disabled={!qrDataUrl}
                  className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-40 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium py-2.5 px-4 rounded-xl transition-all text-sm">
                  {copied ? "Copied" : proLocked ? "Copy — Pro" : "Copy to clipboard"}
                </button>
              </div>
              {proLocked && (
                <p className="text-center text-xs text-indigo-600 mt-2">
                  {proComingSoon ? "This code type is part of Pro, coming soon." : `This code type is part of Pro (${PRO_PRICE}/mo).`}
                </p>
              )}
              {!isPro && (
                <button onClick={() => setShowUpgrade(true)}
                  className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition">
                  {proComingSoon ? "Pro coming soon" : `Upgrade to Pro — ${PRO_PRICE}/mo`}
                </button>
              )}
              <p className="text-center text-xs text-gray-400 mt-2">Free for links and text · No watermark · No signup</p>
            </div>
          </div>
        </div>
      </div>

      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowUpgrade(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-6 relative max-h-[calc(100dvh-2rem)] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowUpgrade(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">×</button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">Q</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upgrade to Pro</h2>
              <p className="text-gray-500 mt-1">WiFi, contacts, logos, SVG, and bulk codes</p>
            </div>
            <div className="space-y-3 mb-6">
              {PRO_FEATURES.map(f => (
                <div key={f.title} className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{f.title}</p>
                    <p className="text-xs text-gray-500">{f.desc}</p>
                  </div>
                  <span className="ml-auto text-green-500 text-lg">✓</span>
                </div>
              ))}
            </div>
            {plans === null ? (
              <button disabled
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-2xl opacity-50 text-lg">
                Loading plans...
              </button>
            ) : !plans.configured ? (
              <>
                <a href={WAITLIST_HREF}
                  className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition text-lg">
                  Pro coming soon · Join the waitlist
                </a>
                <p className="text-center text-xs text-gray-400 mt-3">
                  Email <a href={WAITLIST_HREF} className="underline">support@ridgelineapps.us</a> and we&apos;ll tell you when Pro opens. Free codes work now.
                </p>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  {plans.plans.map((plan) => (
                    <button key={plan.id} onClick={() => void startCheckout(plan.id)} disabled={checkoutLoading !== null}
                      className={`w-full font-bold py-3.5 rounded-2xl hover:opacity-90 disabled:opacity-50 transition ${plan.id === "monthly" ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg" : "border-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"}`}>
                      {checkoutLoading === plan.id ? "Opening checkout..." : `Get Pro — ${plan.price} ${plan.per}`}
                      {plan.badge && <span className="block text-xs font-semibold opacity-80 mt-0.5">{plan.badge}</span>}
                    </button>
                  ))}
                </div>
                {checkoutError && <p className="text-center text-xs text-red-500 mt-2">{checkoutError}</p>}
                <p className="text-center text-xs text-gray-400 mt-3">
                  {plans.plans.some((plan) => plan.id === "lifetime")
                    ? "Subscriptions cancel anytime · Lifetime is a one-time payment · Secure checkout via Stripe"
                    : "Cancel anytime · Secure checkout via Stripe"}
                </p>
              </>
            )}
            {plans?.configured && <form onSubmit={(e) => { e.preventDefault(); void restorePro(); }} className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Already have Pro?</p>
              <p className="text-xs text-gray-500 mb-2">
                Enter the email from your Stripe receipt to turn Pro back on in this browser.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={restoreEmail}
                  onChange={(e) => setRestoreEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={inputClass}
                />
                <button type="submit" disabled={restoreLoading}
                  className="shrink-0 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold px-4 hover:opacity-90 disabled:opacity-50">
                  {restoreLoading ? "..." : "Restore"}
                </button>
              </div>
              {restoreMessage && <p className="text-xs text-red-500 mt-2">{restoreMessage}</p>}
            </form>}
          </div>
        </div>
      )}

    </>
  );
}
