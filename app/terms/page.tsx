import { PRO_LIFETIME_PRICE, PRO_PRICE, PRO_YEARLY_PRICE } from "@/lib/pricing";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { COMPANY, COMPANY_LOCATION, pageMetadata, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description: "The terms for using MakeQR Pro's free QR code generator and the Pro subscription.",
  path: "/terms",
});

const LAST_UPDATED = "October 24, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Back to MakeQR Pro
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-3">Terms of Service</h1>
        <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-7 text-gray-700 leading-relaxed mt-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Who operates the service</h2>
            <p>
              MakeQR Pro is operated by {COMPANY}, in {COMPANY_LOCATION}. These terms cover the free QR code generator at{" "}
              <a href="https://makeqr.pro" className="text-indigo-600">https://makeqr.pro</a> and the Pro subscription. If you use the site, you&apos;re agreeing to them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. What you can make</h2>
            <p>
              Free includes URL and text codes, custom colors, and a PNG download, with no signup and no watermark. Free PNG goes up to 512px.
            </p>
            <p className="mt-2">
              Pro is {PRO_PRICE} per month. It adds WiFi, email, phone, SMS, and contact codes, a logo in the center, SVG download, PNG sizes up to 1024px, and bulk generation. Bulk is a list of URLs you paste, one per line, downloaded as a ZIP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Codes are static</h2>
            <p>
              What you enter is encoded into the image when you download it. MakeQR Pro does not host that link, and it cannot change the code after you download it. If the encoded link or text needs to change, make and print a new code. We don&apos;t count scans, and we don&apos;t keep a copy of the content you typed. The code is built in your browser.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Pro billing and cancellation</h2>
            <p>
              Pro is billed by Stripe, {PRO_PRICE} per month, charged in advance. It renews each month until you cancel. You can cancel anytime with the Manage billing button or by emailing{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600">{SUPPORT_EMAIL}</a>.
              Canceling stops the next renewal. Unless the law requires it, we don&apos;t refund a month that has already started.
              See the <Link href="/refund" className="text-indigo-600">refund &amp; cancellation policy</Link>.
            </p>
            <p className="mt-3">
              When checkout offers them, Pro is also available yearly ({PRO_YEARLY_PRICE} per year, renews each year until you cancel)
              or as a one-time lifetime purchase ({PRO_LIFETIME_PRICE}, a launch deal). Lifetime has no renewals and keeps Pro on
              for as long as MakeQR Pro is offered. A dispute, chargeback, or refund of that payment ends lifetime Pro.
            </p>
            <p className="mt-2">
              We don&apos;t store your full card number. Stripe does. There isn&apos;t a separate MakeQR account or password. When checkout succeeds, Pro unlocks in the browser you used, and the server re-checks your subscription with Stripe. On another device, or after clearing site data, use Restore with the email from your Stripe receipt. Email us if you already paid and need a hand.
            </p>
            <p className="mt-2">
              We&apos;ll email you before any price change takes effect, with instructions on how to cancel. <em>(Yearly plan, if offered: we&apos;ll email a reminder 15–45 days before each yearly renewal.)</em>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Acceptable use</h2>
            <p className="mb-2">Don&apos;t use MakeQR Pro for anything unlawful or harmful, including:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Malware, phishing, fraud, or misleading links</li>
              <li>Content that violates someone else&apos;s rights</li>
              <li>Automated abuse that gets in the way of the site working for other people</li>
            </ul>
            <p className="mt-2">
              You&apos;re responsible for what you encode. We don&apos;t review every link, and we don&apos;t promise that a destination is safe or still online.
            </p>
            <p className="mt-2">
              Don&apos;t make codes that point to malware, phishing, scams or illegal content, or that impersonate another business. Don&apos;t encode someone else&apos;s WiFi password or personal details without permission. We may block Pro access for abuse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Availability</h2>
            <p>
              The site is provided as-is. We don&apos;t guarantee that it will be up every minute, that every phone will scan every code, or that a particular design will print well. Test a sample before you print a stack.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. No warranty</h2>
            <p>
              Apart from the promises in these terms, MakeQR Pro is provided &quot;as is.&quot; To the extent the law allows, we disclaim implied warranties, including merchantability and fitness for a particular purpose. Nothing here limits rights you have under the Ohio Consumer Sales Practices Act or other law that can&apos;t be waived.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Limitation of liability</h2>
            <p>
              To the extent the law allows, Ridgeline Apps LLC isn&apos;t liable for indirect, incidental or consequential damages, including reprinting costs, and our total liability for any claim is limited to what you paid us in the 12 months before the claim. This doesn&apos;t limit liability that can&apos;t be limited by law. These terms are governed by the laws of the State of Ohio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Changes</h2>
            <p>
              We may update these terms. When we do, we&apos;ll change the date at the top. If you keep using the site after that, you&apos;re agreeing to the update.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">10. Contact</h2>
            <p>
              Questions about these terms:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600">{SUPPORT_EMAIL}</a>.
              {COMPANY}, {COMPANY_LOCATION}. The <Link href="/privacy" className="text-indigo-600">privacy policy</Link> covers what the site collects.
            </p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
