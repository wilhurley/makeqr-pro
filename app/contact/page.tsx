import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { COMPANY, COMPANY_LOCATION, pageMetadata, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "How to reach the MakeQR Pro team for help, billing, privacy or anything else.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Back to MakeQR Pro
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-3">Contact</h1>
        <div className="space-y-5 text-gray-700 leading-relaxed mt-6">
          <p>
            MakeQR Pro is built and run by {COMPANY}, a small software company in {COMPANY_LOCATION}.
          </p>
          <p>
            Email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 font-semibold">{SUPPORT_EMAIL}</a> for
            help, billing, privacy or data requests. For billing questions, include the email on your Stripe receipt.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><Link href="/refund" className="text-indigo-600">Refund &amp; cancellation policy</Link></li>
            <li><Link href="/privacy" className="text-indigo-600">Privacy policy</Link></li>
            <li><Link href="/terms" className="text-indigo-600">Terms of service</Link></li>
          </ul>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
