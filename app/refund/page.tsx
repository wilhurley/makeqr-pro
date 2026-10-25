import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { PRO_PRICE } from "@/lib/pricing";
import { COMPANY, COMPANY_LOCATION, pageMetadata, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Refund & Cancellation Policy",
  description: "How cancelling MakeQR Pro works, when refunds are given, and who to contact about a charge.",
  path: "/refund",
});

const LAST_UPDATED = "October 23, 2026";

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Back to MakeQR Pro
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-3">Refund &amp; Cancellation Policy</h1>
        <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-7 text-gray-700 leading-relaxed mt-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Who sells Pro</h2>
            <p>
              MakeQR Pro is operated by {COMPANY}, {COMPANY_LOCATION}. The free generator costs nothing. Pro is
              coming soon and isn&apos;t on sale yet. When it launches, Pro will be a monthly subscription billed by
              Stripe at a planned price of {PRO_PRICE} a month. This policy applies once Pro is on sale.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Cancelling</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Cancel anytime with the Manage billing button (Stripe&apos;s customer portal), or by emailing us.</li>
              <li>Pro stays on until the end of the month you already paid for, then stops renewing. No cancellation fee.</li>
              <li>Codes you already downloaded keep working. They&apos;re static images and don&apos;t depend on your plan.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Refunds</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>A month that has already started isn&apos;t refunded, unless the law requires it.</li>
              <li>
                Charged by mistake (a duplicate charge, or a renewal right after you tried to cancel)? Email us within 30
                days and we&apos;ll review it.
              </li>
              <li>Approved refunds are sent within 7 business days. Your bank may take 5 to 10 more business days to post them.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact</h2>
            <p>
              Email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600">{SUPPORT_EMAIL}</a> with the email
              on your Stripe receipt and the charge date.
            </p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
