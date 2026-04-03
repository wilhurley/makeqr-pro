"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";

type QRType = "url" | "text" | "email" | "phone" | "sms" | "wifi" | "vcard";

interface WifiData  { ssid: string; password: string; encryption: string; }
interface VCardData { name: string; phone: string; email: string; company: string; website: string; }

// Free tier: URL + Text only. Pro: all types.
const FREE_TYPES: QRType[] = ["url", "text"];

const TABS: { id: QRType; label: string; icon: string; pro?: boolean }[] = [
  { id: "url",   label: "URL",     icon: "🔗" },
  { id: "text",  label: "Text",    icon: "📝" },
  { id: "wifi",  label: "WiFi",    icon: "📶", pro: true },
  { id: "email", label: "Email",   icon: "✉️",  pro: true },
  { id: "phone", label: "Phone",   icon: "📞", pro: true },
  { id: "sms",   label: "SMS",     icon: "💬", pro: true },
  { id: "vcard", label: "Contact", icon: "👤", pro: true },
];

const COLORS = ["#000000", "#1d4ed8", "#15803d", "#b91c1c", "#7c3aed", "#c2410c", "#0f766e"];

const PRO_FEATURES = [
  { icon: "📶", title: "WiFi, SMS, Contact QR codes", desc: "All 7 QR types" },
  { icon: "🖼️", title: "Logo in QR code", desc: "Add your brand logo to the center" },
  { icon: "📦", title: "Bulk generator", desc: "Upload CSV, download a ZIP of QR codes" },
  { icon: "📐", title: "Larger sizes up to 1024px", desc: "High-res for print & signage" },
  { icon: "🚫", title: "No ads", desc: "Clean, distraction-free experience" },
  { icon: "⬇️", title: "SVG download", desc: "Perfect vector quality at any size" },
];

export default function Home() {
  const [type, setType]           = useState<QRType>("url");
  const [url, setUrl]             = useState("https://");
  const [text, setText]           = useState("");
  const [email, setEmail]         = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [phone, setPhone]         = useState("");
  const [smsPhone, setSmsPhone]   = useState("");
  const [smsMsg, setSmsMsg]       = useState("");
  const [wifi, setWifi]           = useState<WifiData>({ ssid: "", password: "", encryption: "WPA" });
  const [vcard, setVcard]         = useState<VCardData>({ name: "", phone: "", email: "", company: "", website: "" });
  const [fgColor, setFgColor]     = useState("#000000");
  const [bgColor, setBgColor]     = useState("#ffffff");
  const [size, setSize]           = useState(256);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied]       = useState(false);
  const [isPro, setIsPro]         = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [logoFile, setLogoFile]   = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  // Bulk generator state
  const [showBulk, setShowBulk]   = useState(false);
  const [bulkText, setBulkText]   = useState("https://example.com\nhttps://site2.com\nhttps://site3.com");
  const [bulkLoading, setBulkLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check Pro status from localStorage + URL params on load
  useEffect(() => {
    const stored = localStorage.getItem("qrpro");
    if (stored === "true") { setIsPro(true); return; }

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const proStatus = params.get("pro");

    if (proStatus === "success" && sessionId) {
      fetch(`/api/verify-session?session_id=${sessionId}`)
        .then(r => r.json())
        .then(d => {
          if (d.valid) {
            setIsPro(true);
            localStorage.setItem("qrpro", "true");
            window.history.replaceState({}, "", "/");
          }
        });
    }
  }, []);

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
      default: return "";
    }
  }, [type, url, text, email, emailSubject, phone, smsPhone, smsMsg, wifi, vcard]);

  // Generate QR — with optional logo overlay for Pro
  const generateQR = useCallback(async (data: string, w: number, fg: string, bg: string, logo: string | null): Promise<string> => {
    const dataUrl = await QRCode.toDataURL(data, {
      width: w, margin: 2,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: "H",
    });
    if (!logo) return dataUrl;

    // Draw logo in center using canvas
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
          // White background circle behind logo
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
    const data = buildQrData();
    if (!data) { setQrDataUrl(""); return; }
    const effectiveSize = isPro ? size : Math.min(size, 512);
    generateQR(data, effectiveSize, fgColor, bgColor, isPro ? logoFile : null)
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [buildQrData, fgColor, bgColor, size, logoFile, isPro, generateQR]);

  const handleTabClick = (t: typeof TABS[0]) => {
    if (t.pro && !isPro) { setShowUpgrade(true); return; }
    setType(t.id);
  };

  const startCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res  = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { setCheckoutLoading(false); }
  };

  const downloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl; a.download = `makeqr-${type}.png`; a.click();
  };

  const downloadSvg = async () => {
    if (!isPro) { setShowUpgrade(true); return; }
    const data = buildQrData();
    if (!data) return;
    const svg = await QRCode.toString(data, { type: "svg", margin: 2, color: { dark: fgColor, light: bgColor } });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `makeqr-${type}.svg`; a.click();
  };

  const copyToClipboard = async () => {
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
      const dataUrl = await QRCode.toDataURL(line, { width: 512, margin: 2, color: { dark: fgColor, light: bgColor }, errorCorrectionLevel: "H" });
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
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">Q</div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">MakeQR<span className="text-indigo-600">.pro</span></span>
            {isPro
              ? <span className="text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-medium">PRO</span>
              : <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">Free</span>
            }
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500 hidden sm:block">No signup · No watermark</p>
            {!isPro && (
              <button onClick={() => setShowUpgrade(true)}
                className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition">
                Upgrade $4.99/mo
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Free QR Code Generator</h1>
          <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto">
            Create QR codes for URLs, WiFi, contacts, SMS, email and more — free, instant, no account needed.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left panel */}
          <div className="lg:col-span-3 space-y-5">
            {/* Type tabs */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">QR Type</p>
              <div className="flex flex-wrap gap-2">
                {TABS.map((t) => (
                  <button key={t.id} onClick={() => handleTabClick(t)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all relative ${
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

            {/* Inputs */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Content</p>
              {type === "url"   && <input className={inputClass} type="url" placeholder="https://yourwebsite.com" value={url} onChange={e => setUrl(e.target.value)} />}
              {type === "text"  && <textarea className={inputClass} rows={4} placeholder="Enter any text..." value={text} onChange={e => setText(e.target.value)} />}
              {type === "email" && (<><input className={inputClass} type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} /><input className={inputClass} type="text" placeholder="Subject (optional)" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} /></>)}
              {type === "phone" && <input className={inputClass} type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />}
              {type === "sms"   && (<><input className={inputClass} type="tel" placeholder="Phone number" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} /><textarea className={inputClass} rows={3} placeholder="Message (optional)" value={smsMsg} onChange={e => setSmsMsg(e.target.value)} /></>)}
              {type === "wifi"  && (<><input className={inputClass} type="text" placeholder="Network name (SSID)" value={wifi.ssid} onChange={e => setWifi(w => ({ ...w, ssid: e.target.value }))} /><input className={inputClass} type="text" placeholder="Password" value={wifi.password} onChange={e => setWifi(w => ({ ...w, password: e.target.value }))} /><select className={inputClass} value={wifi.encryption} onChange={e => setWifi(w => ({ ...w, encryption: e.target.value }))}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">No Password</option></select></>)}
              {type === "vcard" && (<><input className={inputClass} type="text" placeholder="Full name *" value={vcard.name} onChange={e => setVcard(v => ({ ...v, name: e.target.value }))} /><input className={inputClass} type="text" placeholder="Company" value={vcard.company} onChange={e => setVcard(v => ({ ...v, company: e.target.value }))} /><input className={inputClass} type="tel" placeholder="Phone" value={vcard.phone} onChange={e => setVcard(v => ({ ...v, phone: e.target.value }))} /><input className={inputClass} type="email" placeholder="Email" value={vcard.email} onChange={e => setVcard(v => ({ ...v, email: e.target.value }))} /><input className={inputClass} type="url" placeholder="Website" value={vcard.website} onChange={e => setVcard(v => ({ ...v, website: e.target.value }))} /></>)}
            </div>

            {/* Customize */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
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
                <input type="range" min={128} max={isPro ? 1024 : 512} step={32} value={size}
                  onChange={e => setSize(Number(e.target.value))} className="w-full accent-indigo-600" />
              </div>

              {/* Logo upload — Pro only */}
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

            {/* Bulk Generator — Pro */}
            {isPro ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bulk Generator</p>
                  <span className="text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full">PRO</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">One URL per line → downloads as ZIP</p>
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
                    <p className="text-xs text-gray-500">Upload a CSV, get a ZIP of QR codes instantly</p>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Right: Preview + Download */}
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
                    <span className="text-sm">Enter content above</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <button onClick={downloadPng} disabled={!qrDataUrl}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-3 px-4 rounded-xl transition-all active:scale-95">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download PNG
                </button>
                <button onClick={downloadSvg} disabled={!qrDataUrl}
                  className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-40 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-xl transition-all active:scale-95">
                  {isPro ? "Download SVG" : "🔒 SVG — Pro"}
                </button>
                <button onClick={copyToClipboard} disabled={!qrDataUrl}
                  className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-40 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium py-2.5 px-4 rounded-xl transition-all text-sm">
                  {copied ? "✓ Copied!" : "Copy to clipboard"}
                </button>
              </div>
              {!isPro && (
                <button onClick={() => setShowUpgrade(true)}
                  className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition">
                  ✨ Upgrade to Pro — $4.99/mo
                </button>
              )}
              <p className="text-center text-xs text-gray-400 mt-2">Free · No watermark · No signup</p>
            </div>
          </div>
        </div>

        {/* Use cases */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: "🏪", title: "Small Business", desc: "Menus, loyalty signage, WiFi sharing" },
            { icon: "📇", title: "Business Cards", desc: "Contact QR that saves to phone instantly" },
            { icon: "📶", title: "WiFi Sharing", desc: "Let guests connect without sharing passwords" },
            { icon: "📢", title: "Marketing", desc: "Flyers, posters, packaging with instant links" },
          ].map(u => (
            <div key={u.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center shadow-sm">
              <div className="text-2xl mb-2">{u.icon}</div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{u.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{u.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {[
              { q: "Is MakeQR Pro really free to use?", a: "The core features are 100% free — URL and text QR codes, custom colors, and PNG download with no signup required. Pro ($4.99/month) unlocks all 7 QR types, logo overlay, bulk generation, SVG export, and sizes up to 1024px." },
              { q: "How do I make a QR code for my website?", a: "Select the URL tab, paste your website link, pick a color and size, then click Download PNG. Your QR code is ready instantly — no account or email needed." },
              { q: "How do I create a WiFi QR code for my business?", a: "Select the WiFi tab (Pro feature), enter your network name (SSID), password, and security type. Customers scan the code to connect automatically — great for restaurants, coffee shops, retail, hotels, and Airbnbs." },
              { q: "What's included in Pro ($4.99/month)?", a: "All 7 QR types (URL, Text, WiFi, Email, Phone, SMS, Contact), logo overlay in the center of your QR code, bulk QR generator (paste a list of URLs → download as ZIP), SVG vector download, sizes up to 1024px for high-res print, and no ads." },
              { q: "Can I add my logo to a QR code?", a: "Yes — Pro subscribers can upload any image as a logo and it appears in the center of the QR code. The high error correction ensures it stays scannable even with a logo covering part of it." },
              { q: "Can I generate QR codes in bulk?", a: "Yes — Pro users can paste a list of URLs (one per line) in the Bulk Generator and download all QR codes as a ZIP file in seconds. Perfect for agencies, print shops, and businesses managing multiple locations." },
              { q: "What formats can I download my QR code in?", a: "Free: PNG (high quality for web and screens). Pro: PNG + SVG (vector format that scales to any size with no quality loss — ideal for large print, signage, and merchandise)." },
              { q: "Do QR codes from MakeQR Pro expire?", a: "No. All QR codes are static and never expire. They encode the data you entered directly, so there is no server dependency and no link rot." },
              { q: "Is MakeQR Pro good for print and signage?", a: "Yes — Pro users can download SVG files and generate QR codes up to 1024px, making them sharp at any print size. They are suitable for business cards, flyers, posters, packaging, and large-format signage." },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">{q}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-100 dark:border-gray-800 py-6 text-center text-xs text-gray-400">
        <p>MakeQR.pro — Free QR Code Generator | Built by <a href="https://arctechnologiesllc.com" className="text-indigo-500 hover:underline">ARC Technologies LLC</a></p>
        <p className="mt-1">Also: <a href="https://floodzone.fyi" className="text-indigo-500 hover:underline">floodzone.fyi</a> · <a href="https://snap.vin" className="text-indigo-500 hover:underline">snap.vin</a></p>
        <p className="mt-2">
          <a href="/qr-code-best-practices" className="text-indigo-500 hover:underline">QR Best Practices</a> · {" "}
          <a href="/about" className="text-indigo-500 hover:underline">About</a> · {" "}
          <a href="/privacy" className="text-indigo-500 hover:underline">Privacy Policy</a> · {" "}
          <a href="/terms" className="text-indigo-500 hover:underline">Terms</a>
        </p>
      </footer>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowUpgrade(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowUpgrade(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">×</button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">Q</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upgrade to Pro</h2>
              <p className="text-gray-500 mt-1">Everything you need for professional QR codes</p>
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
            <button onClick={startCheckout} disabled={checkoutLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-2xl hover:opacity-90 disabled:opacity-50 transition text-lg">
              {checkoutLoading ? "Redirecting..." : "Get Pro — $4.99 / month"}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">Cancel anytime · Secure checkout via Stripe</p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
