import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { TermsMarkdown } from "@/components/TermsMarkdown";
import { PRO_PRICE } from "@/lib/pricing";
import { pageMetadata } from "@/lib/site";
import { termsMarkdown } from "@/lib/terms-content";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description: "The terms for using MakeQR Pro's free QR code generator and the Pro subscription.",
  path: "/terms",
});

export default function TermsPage() {
  const source = termsMarkdown({ pro: PRO_PRICE });
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Back to MakeQR Pro
        </Link>
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Pro is coming soon and isn&apos;t on sale yet. The {PRO_PRICE} price in these Terms is a planned price. The
          Pro and payment sections apply only once Pro is on sale and you buy it at checkout.
        </p>
        <TermsMarkdown source={source} />
        <p className="mt-10 text-sm text-gray-500">
          Past versions: <Link href="/terms/archive" className="text-indigo-600 underline">Terms archive</Link>.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
