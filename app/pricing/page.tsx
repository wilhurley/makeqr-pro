import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { PRO_PRICE } from "@/lib/pricing";
import { COMPANY, COMPANY_LOCATION, pageMetadata, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Pricing",
  description: `MakeQR Pro pricing: the generator is free. Pro is coming soon at a planned price of ${PRO_PRICE}/month. It isn't on sale yet.`,
  path: "/pricing",
});

const LAST_UPDATED = "October 24, 2026";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Back to MakeQR Pro
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-3">Pricing</h1>
        <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-7 text-gray-700 leading-relaxed mt-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Free</h2>
            <p>
              URL and text QR codes, custom colors and PNG download. No signup and no watermark.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Pro: coming soon</h2>
            <p>
              <strong>Planned price: {PRO_PRICE}/month. This is a planned price, and Pro is not on sale yet.</strong>{" "}
              You can&apos;t buy Pro today, and we don&apos;t take pre-orders or deposits. The planned price may change
              before launch.
            </p>
            <p className="mt-2">
              Pro will unlock WiFi, Email, Phone, SMS and Contact codes, logo overlay, bulk generation, SVG export and
              sizes up to 1024px. When it launches, Pro will be a monthly subscription billed by Stripe that renews
              automatically until you cancel, and the price you pay will be the one shown at Stripe checkout. To hear
              when it opens, email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600">{SUPPORT_EMAIL}</a>.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Cancelling and refunds</h2>
            <p>
              When Pro launches, you&apos;ll be able to cancel anytime, and Pro will stay on until the end of the period you already paid for. See the{" "}
              <Link href="/refund" className="text-indigo-600">Refund &amp; Cancellation Policy</Link> and the{" "}
              <Link href="/terms" className="text-indigo-600">Terms</Link>.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Who sells Pro</h2>
            <p>
              MakeQR Pro is operated by {COMPANY}, {COMPANY_LOCATION}. Questions:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600">{SUPPORT_EMAIL}</a>.
            </p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
