"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// Minimal typing for the native BarcodeDetector (not in the standard DOM lib).
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorCtor {
  new (opts?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

type Decoded = {
  raw: string;
  kind: "url" | "wifi" | "contact" | "phone" | "sms" | "email" | "geo" | "text";
  url?: string;
  warnings: string[];
};

const SHORTENERS = [
  "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly",
  "rebrand.ly", "cutt.ly", "shorturl.at", "rb.gy",
];

// Classify decoded text and flag anything that looks risky — in plain English.
function analyze(raw: string): Decoded {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  const warnings: string[] = [];

  if (lower.startsWith("wifi:")) return { raw: trimmed, kind: "wifi", warnings };
  if (lower.startsWith("begin:vcard") || lower.startsWith("mecard:"))
    return { raw: trimmed, kind: "contact", warnings };
  if (lower.startsWith("tel:")) return { raw: trimmed, kind: "phone", warnings };
  if (lower.startsWith("smsto:") || lower.startsWith("sms:"))
    return { raw: trimmed, kind: "sms", warnings };
  if (lower.startsWith("mailto:")) return { raw: trimmed, kind: "email", warnings };
  if (lower.startsWith("geo:")) return { raw: trimmed, kind: "geo", warnings };

  const looksLikeUrl =
    /^https?:\/\//i.test(trimmed) ||
    /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(trimmed);

  if (looksLikeUrl) {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    let host = "";
    try {
      const u = new URL(withProto);
      host = u.hostname;
      if (u.protocol !== "https:")
        warnings.push("This link is not secure (no HTTPS). Be careful before opening it.");
      if (u.username || u.password || withProto.includes("@"))
        warnings.push("This link contains an '@' sign, a common trick to hide the real destination.");
      if (host.startsWith("xn--") || host.includes(".xn--"))
        warnings.push("This web address uses special characters that can imitate a real site.");
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host))
        warnings.push("This link points to a raw IP address instead of a normal website name.");
      if (SHORTENERS.includes(host.toLowerCase()))
        warnings.push("This is a shortened link, so you cannot see where it really leads until you open it.");
      if (host.split(".").length > 4)
        warnings.push("This web address has an unusually long name, which can be a sign of a fake site.");
    } catch {
      warnings.push("This looks like a link but could not be read properly. Do not open it unless you trust the source.");
    }
    return { raw: trimmed, kind: "url", url: withProto, warnings };
  }

  return { raw: trimmed, kind: "text", warnings };
}

const KIND_LABEL: Record<Decoded["kind"], string> = {
  url: "Website link",
  wifi: "WiFi network",
  contact: "Contact card",
  phone: "Phone number",
  sms: "Text message",
  email: "Email",
  geo: "Map location",
  text: "Plain text",
};

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Decoded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => stop, [stop]);

  const onFound = useCallback(
    (raw: string) => {
      if (!raw) return;
      setResult(analyze(raw));
      stop();
    },
    [stop]
  );

  const start = useCallback(async () => {
    setError(null);
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Your browser does not support camera access. Try Chrome or Safari on your phone.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch {
      setError("Could not access the camera. Please allow camera permission and try again.");
      return;
    }
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    await video.play().catch(() => {});
    activeRef.current = true;
    setScanning(true);

    // Prefer the fast native detector; otherwise lazy-load jsQR only now.
    if (window.BarcodeDetector) {
      try {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const tick = async () => {
          if (!activeRef.current || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length && codes[0].rawValue) return onFound(codes[0].rawValue);
          } catch {
            /* ignore per-frame errors */
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return;
      } catch {
        /* fall through to jsQR */
      }
    }

    const jsQR = (await import("jsqr")).default;
    const tick = () => {
      if (!activeRef.current || !videoRef.current || !canvasRef.current) return;
      const v = videoRef.current;
      if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth) {
        const canvas = canvasRef.current;
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (code?.data) return onFound(code.data);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onFound]);

  const copy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked */
    }
  }, [result]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <header className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">Q</div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">MakeQR<span className="text-indigo-600">.pro</span></span>
          </Link>
          <Link href="/" className="text-sm text-indigo-600 font-semibold hover:underline">Create a QR code →</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Scan a QR code</h1>
          <p className="text-gray-500 dark:text-gray-400 text-base max-w-md mx-auto">
            Point your rear camera at any QR code. Nothing is uploaded — scanning happens entirely on your device.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-square flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${scanning ? "block" : "hidden"}`}
            />
            {scanning && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-3/5 aspect-square border-4 border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
            )}
            {!scanning && (
              <div className="text-center text-gray-400 px-6">
                <svg className="w-16 h-16 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8V6a2 2 0 012-2h2M17 4h2a2 2 0 012 2v2M21 16v2a2 2 0 01-2 2h-2M7 20H5a2 2 0 01-2-2v-2M8 12h8" />
                </svg>
                <p className="text-sm text-gray-300">Camera is off</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div className="mt-4">
            {!scanning ? (
              <button
                onClick={start}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95 text-base"
              >
                {result ? "Scan another code" : "Scan a QR code"}
              </button>
            ) : (
              <button
                onClick={stop}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-4 rounded-2xl transition-all active:scale-95 text-base"
              >
                Stop camera
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="mt-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Result</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                {KIND_LABEL[result.kind]}
              </span>
            </div>

            {/* Decoded content is always shown as plain text — never auto-opened. */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 text-sm text-gray-800 dark:text-gray-100 break-all font-mono">
              {result.raw}
            </div>

            {result.warnings.length > 0 && (
              <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3 text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">⚠️ Check this link before opening</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              {result.kind === "url" && result.url && (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all active:scale-95"
                >
                  Open link
                </a>
              )}
              <button
                onClick={copy}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-xl transition-all active:scale-95"
              >
                {copied ? "✓ Copied!" : "Copy text"}
              </button>
            </div>
            {result.kind === "url" && (
              <p className="mt-3 text-xs text-gray-400 text-center">
                Links never open automatically. Only tap “Open link” if you trust the source.
              </p>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          Works best on a phone. On desktop, allow camera access when prompted.
        </p>
      </div>

      <footer className="mt-12 border-t border-gray-100 dark:border-gray-800 py-6 text-center text-xs text-gray-400">
        <p>
          <Link href="/" className="text-indigo-500 hover:underline">QR Generator</Link> ·{" "}
          <a href="/qr-code-best-practices" className="text-indigo-500 hover:underline">QR Best Practices</a> ·{" "}
          <a href="/privacy" className="text-indigo-500 hover:underline">Privacy Policy</a>
        </p>
      </footer>
    </main>
  );
}
