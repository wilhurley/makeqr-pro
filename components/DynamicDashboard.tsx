"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

type Code = { slug: string; url: string; destination: string; label: string; scans: number; lastScanAt: number; createdAt: number };

function QrPreview({ value, name }: { value: string; name: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(value, { width: 512, margin: 2, errorCorrectionLevel: "M" }).then(setSrc).catch(() => setSrc(""));
  }, [value]);
  if (!src) return null;
  return (
    <div className="flex flex-col items-center gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`QR code for ${value}`} width={112} height={112} />
      <a href={src} download={`makeqr-${name}.png`} className="text-xs text-indigo-600 hover:underline">Download PNG</a>
    </div>
  );
}

function CodeRow({ code, pro, onSaved }: { code: Code; pro: boolean; onSaved: (c: Code) => void }) {
  const [editing, setEditing] = useState(false);
  const [dest, setDest] = useState(code.destination);
  const [err, setErr] = useState("");
  const save = async () => {
    setErr("");
    const res = await fetch(`/api/dynamic/${code.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: dest }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data.error ?? "Couldn't save.");
    onSaved(data.code);
    setEditing(false);
  };
  return (
    <li className="border border-gray-200 rounded-lg p-4 flex gap-4 items-start">
      <QrPreview value={code.url} name={code.slug} />
      <div className="flex-1 min-w-0 text-sm">
        {code.label && <p className="font-semibold text-gray-900">{code.label}</p>}
        <p className="text-gray-500">{code.url}</p>
        {editing ? (
          <div className="mt-2 flex gap-2">
            <input value={dest} onChange={(e) => setDest(e.target.value)} className="flex-1 border rounded px-2 py-1" />
            <button onClick={save} className="bg-indigo-600 text-white rounded px-3 py-1">Save</button>
            <button onClick={() => { setEditing(false); setDest(code.destination); }} className="px-2">Cancel</button>
          </div>
        ) : (
          <p className="mt-1 text-gray-800 break-all">
            Goes to: {code.destination}{" "}
            {pro && <button onClick={() => setEditing(true)} className="text-indigo-600 hover:underline ml-1">Change</button>}
          </p>
        )}
        {err && <p className="text-red-600 mt-1">{err}</p>}
        <p className="text-gray-500 mt-1">
          {code.scans} {code.scans === 1 ? "scan" : "scans"}
          {code.lastScanAt ? ` · last ${new Date(code.lastScanAt).toLocaleString()}` : ""}
        </p>
      </div>
    </li>
  );
}

export default function DynamicDashboard() {
  const [state, setState] = useState<"loading" | "signedout" | "ready" | "unavailable">("loading");
  const [pro, setPro] = useState(false);
  const [codes, setCodes] = useState<Code[]>([]);
  const [dest, setDest] = useState("");
  const [label, setLabel] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    // Re-check Pro with Stripe first so a lapsed plan locks editing right away.
    await fetch("/api/pro?fresh=1", { cache: "no-store" }).catch(() => null);
    const res = await fetch("/api/dynamic", { cache: "no-store" });
    if (res.status === 503) return setState("unavailable");
    if (res.status === 401) return setState("signedout");
    const data = await res.json();
    setPro(!!data.pro);
    setCodes(data.codes ?? []);
    setState("ready");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fetch on mount
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/dynamic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: dest, label }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data.error ?? "Couldn't create the code.");
    setCodes((c) => [data.code, ...c]);
    setDest("");
    setLabel("");
  };

  if (state === "loading") return <p className="text-gray-500">Loading…</p>;
  if (state === "unavailable") return <p className="text-gray-700">Dynamic codes aren&apos;t switched on yet. Check back soon.</p>;
  if (state === "signedout")
    return (
      <p className="text-gray-700">
        Dynamic codes come with Pro. <Link href="/" className="text-indigo-600 hover:underline">Upgrade or restore Pro</Link> on
        the home page in this browser, then come back here.
      </p>
    );

  return (
    <div>
      {pro ? (
        <form onSubmit={create} className="border border-indigo-200 bg-indigo-50 rounded-lg p-4 mb-8 space-y-3">
          <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="https://example.com/menu" className="w-full border rounded px-3 py-2" required />
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name (optional, only you see it)" className="w-full border rounded px-3 py-2" maxLength={80} />
          <button className="bg-indigo-600 text-white rounded px-4 py-2 font-medium">Make dynamic code</button>
          {err && <p className="text-red-600 text-sm">{err}</p>}
        </form>
      ) : (
        <p className="border border-amber-200 bg-amber-50 rounded-lg p-4 mb-8 text-sm text-amber-900">
          Your Pro plan isn&apos;t active, so editing is locked. Your codes below still redirect to where they pointed last.
        </p>
      )}
      {codes.length === 0 ? (
        <p className="text-gray-500">No dynamic codes yet.</p>
      ) : (
        <ul className="space-y-3">
          {codes.map((c) => (
            <CodeRow key={c.slug} code={c} pro={pro} onSaved={(n) => setCodes((all) => all.map((x) => (x.slug === n.slug ? n : x)))} />
          ))}
        </ul>
      )}
    </div>
  );
}
