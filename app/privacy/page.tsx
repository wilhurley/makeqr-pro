import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { pageMetadata, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "Privacy Policy for MakeQR Pro — learn how we collect, use, and protect your data.",
  path: "/privacy",
});

const LAST_UPDATED = "October 22, 2026";
const CONTACT_EMAIL = SUPPORT_EMAIL;
const SITE_URL = "https://makeqr.pro";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-6 inline-block"
          >
            ← Back to MakeQR Pro
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Privacy Policy
          </h1>
          <p className="text-gray-500 text-sm">
            Last updated: {LAST_UPDATED} &nbsp;·&nbsp; Effective immediately
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <p>
              MakeQR Pro (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operated by Ridgeline Apps LLC
              in Wheelersburg, Ohio, is committed to protecting your privacy. This Privacy Policy explains what information we
              collect when you use <a href={SITE_URL} className="text-indigo-600">{SITE_URL}</a> (the
              &quot;Service&quot;), how we use it, and your rights regarding that information.
            </p>
            <p className="mt-3">
              By using MakeQR Pro you agree to the collection and use of information as described in
              this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Information We Collect
            </h2>
            <h3 className="font-medium text-gray-800 mb-2">Information you provide</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>QR code content</strong> — URLs, text, WiFi credentials, contact info, or
                other data you enter to generate a QR code. This data is processed in your browser
                and is <strong>not stored on our servers</strong>.
              </li>
              <li>
                <strong>Account information</strong> (Pro subscribers only) — email address and
                payment details collected via Stripe when you subscribe to MakeQR Pro.
              </li>
              <li>
                <strong>Support communications</strong> — any messages you send to us by email.
              </li>
            </ul>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">
              Information collected automatically
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Log data</strong> — IP address, browser type, pages visited, referring URL,
                and timestamps, collected automatically by our hosting provider (Vercel).
              </li>
              <li>
                <strong>Cookies &amp; local storage</strong> — small files placed on your device to
                remember your preferences (e.g., last-used QR type, color settings). You can clear
                these at any time through your browser settings.
              </li>
              <li>
                <strong>Analytics data</strong> — aggregated, anonymized usage statistics to
                understand how features are used.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Advertising — Google AdSense
            </h2>
            <p>
              We use <strong>Google AdSense</strong> (publisher ID:{" "}
              <code className="bg-gray-100 px-1 rounded text-sm">ca-pub-8175259221220756</code>) to
              display advertisements on MakeQR Pro. Google AdSense uses cookies and web beacons to
              serve ads based on your prior visits to this and other websites.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>
                Google&apos;s use of advertising cookies enables it and its partners to serve ads
                based on your visits to our site and/or other sites on the Internet.
              </li>
              <li>
                You may opt out of personalised advertising by visiting{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  className="text-indigo-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Ad Settings
                </a>
                .
              </li>
              <li>
                Third-party vendors, including Google, use cookies to serve ads based on a
                user&apos;s prior visits to our website or other websites.
              </li>
              <li>
                For more information, see the{" "}
                <a
                  href="https://policies.google.com/privacy"
                  className="text-indigo-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Privacy Policy
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Payments — Stripe
            </h2>
            <p>
              Pro subscriptions are processed by <strong>Stripe</strong>. We do not store your full
              credit card number, CVV, or billing address on our servers. All payment data is handled
              directly by Stripe under their{" "}
              <a
                href="https://stripe.com/privacy"
                className="text-indigo-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              . We receive a Stripe customer ID and subscription status and keep them in a signed
              httpOnly cookie so this browser can stay in sync with Stripe. We do not run a separate
              account database. If you restore Pro on another device, the email you enter is sent to
              Stripe to look up an active subscription and is not stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve the QR code generation service</li>
              <li>To process and manage Pro subscriptions</li>
              <li>To respond to support requests</li>
              <li>To display relevant advertisements via Google AdSense</li>
              <li>To monitor security and prevent abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> sell, rent, or trade your personal information to any third
              party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Cookies
            </h2>
            <p>
              MakeQR Pro uses the following types of cookies:
            </p>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 border border-gray-200 font-semibold">Type</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-gray-200">Essential</td>
                    <td className="p-3 border border-gray-200">
                      Session management, security, and the signed Pro subscription cookie
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">Preference</td>
                    <td className="p-3 border border-gray-200">Remembering your QR settings and colour choices</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200">Advertising</td>
                    <td className="p-3 border border-gray-200">Google AdSense personalised and non-personalised ads</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">Analytics</td>
                    <td className="p-3 border border-gray-200">Aggregated, anonymised usage statistics</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              You can control cookies through your browser settings. Disabling cookies may affect
              some features of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. Data Retention
            </h2>
            <p>
              QR code content you enter is never stored server-side — it exists only in your browser.
              Account data (email, subscription status) is retained for as long as your account is
              active and for a reasonable period thereafter. Log data is retained for up to 90 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Third-Party Services
            </h2>
            <p>We use the following third-party services, each governed by their own privacy policy:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <a href="https://vercel.com/legal/privacy-policy" className="text-indigo-600" target="_blank" rel="noopener noreferrer">Vercel</a> — hosting and CDN
              </li>
              <li>
                <a href="https://policies.google.com/privacy" className="text-indigo-600" target="_blank" rel="noopener noreferrer">Google AdSense</a> — advertising
              </li>
              <li>
                <a href="https://stripe.com/privacy" className="text-indigo-600" target="_blank" rel="noopener noreferrer">Stripe</a> — payment processing
              </li>
              <li>
                <a href="https://www.cloudflare.com/privacypolicy/" className="text-indigo-600" target="_blank" rel="noopener noreferrer">Cloudflare</a> — DNS and security
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Children&apos;s Privacy
            </h2>
            <p>
              MakeQR Pro is not directed at children under 13. We do not knowingly collect personal
              information from children. If you believe a child has provided us personal information,
              please contact us and we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. Your Rights
            </h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Opt out of personalised advertising</li>
              <li>Data portability (GDPR / CCPA where applicable)</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will revise the
              &quot;Last updated&quot; date at the top. Continued use of MakeQR Pro after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              11. Contact Us
            </h2>
            <p>
              If you have questions or concerns about this Privacy Policy, please contact:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mt-3 text-sm">
              <p className="font-medium text-gray-900">Ridgeline Apps LLC</p>
              <p>Wheelersburg, Ohio</p>
              <p>
                Email:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>Website: <a href={SITE_URL} className="text-indigo-600">{SITE_URL}</a></p>
            </div>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
