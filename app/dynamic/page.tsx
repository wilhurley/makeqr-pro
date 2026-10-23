import type { Metadata } from "next";
import Link from "next/link";
import DynamicDashboard from "@/components/DynamicDashboard";
import { SiteFooter } from "@/components/SiteFooter";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Dynamic QR Codes",
    description: "Pro: make a QR code you can point at a new link later, and see how many times it's been scanned.",
    path: "/dynamic",
  }),
  robots: { index: false, follow: true },
};

export default function DynamicPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">← Back to MakeQR Pro</Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-3">Dynamic QR codes</h1>
        <p className="text-gray-700 mb-2">
          A dynamic code points at a short makeqr.pro link. You can change where that link goes at any time, so the
          printed code doesn&apos;t have to change. You&apos;ll also see a simple scan count.
        </p>
        <p className="text-gray-600 text-sm mb-8">
          How it works if you stop paying: your codes keep redirecting to their last destination as long as your
          account exists. You just can&apos;t edit them or make new ones until you have Pro again. Scan counts are a
          simple tally of redirects (bots and repeat scans count too), not detailed analytics.
        </p>
        <DynamicDashboard />
      </div>
      <SiteFooter />
    </main>
  );
}
