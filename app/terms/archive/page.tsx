import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { TERMS_EFFECTIVE, TERMS_VERSION } from "@/lib/terms-version";

export const metadata: Metadata = {
  title: "Terms of Service archive | MakeQR Pro",
  description: "Past versions of the MakeQR Pro Terms of Service.",
  robots: { index: false, follow: true },
};

export default function TermsArchivePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
        <Link href="/terms" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">← Current Terms</Link>
        <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-6">Terms of Service archive</h1>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <Link href="/terms" className="text-indigo-600 underline">Version {TERMS_VERSION}</Link>, effective {TERMS_EFFECTIVE} (current)
          </li>
          <li>
            <Link href="/terms/archive/2026-10-24-v0" className="text-indigo-600 underline">Earlier version</Link>, last updated October 24, 2026, replaced by {TERMS_VERSION}
          </li>
        </ul>
      </div>
      <SiteFooter />
    </main>
  );
}
