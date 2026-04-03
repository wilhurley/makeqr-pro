import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | MakeQR Pro",
  description:
    "Terms of Service for MakeQR Pro, including acceptable use, subscription terms, and service limitations.",
  alternates: {
    canonical: "https://makeqr.pro/terms",
  },
};

const LAST_UPDATED = "April 3, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-6 inline-block">
            Back to MakeQR Pro
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-7 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Acceptance of terms</h2>
            <p>
              By using MakeQR Pro, you agree to these Terms of Service. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Service description</h2>
            <p>
              MakeQR Pro provides an online QR code generation tool with free and paid subscription features. Features and
              limits may change as the service evolves.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Acceptable use</h2>
            <p className="mb-2">You agree not to use MakeQR Pro for unlawful or harmful activities, including:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Malware distribution, phishing, fraud, or deceptive redirects</li>
              <li>Content that violates intellectual property rights</li>
              <li>Automated abuse that degrades service availability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Accounts and subscriptions</h2>
            <p>
              Pro subscriptions are billed through Stripe. You are responsible for maintaining valid billing details. Unless
              canceled, subscriptions renew according to the billing interval shown at checkout.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Payments and refunds</h2>
            <p>
              Fees are charged in advance for the selected billing period. Unless required by law, fees are non-refundable after
              the billing period begins. You can cancel renewal at any time through your billing portal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Content and generated output</h2>
            <p>
              You retain responsibility for any content encoded into QR codes. We do not guarantee the legality, accuracy,
              or safety of user-provided URLs, text, or files.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Availability and warranties</h2>
            <p>
              The service is provided on an as-is and as-available basis. We do not guarantee uninterrupted access,
              scan performance on every device, or suitability for every use case.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Limitation of liability</h2>
            <p>
              To the fullest extent allowed by law, ARC Technologies LLC is not liable for indirect, incidental, or consequential
              damages related to your use of MakeQR Pro.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Changes to terms</h2>
            <p>
              We may update these terms from time to time. Continued use after updates means you accept the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">10. Contact</h2>
            <p>Questions about these terms can be sent to support@makeqr.pro.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
