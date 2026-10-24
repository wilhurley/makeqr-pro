import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { pageMetadata, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How MakeQR Pro, run by Ridgeline Apps LLC, handles QR content, Pro purchases, cookies and ads.",
  path: "/privacy",
});

const LAST_UPDATED = "October 24, 2026";
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
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Text: Legal Review Bot, makeqr/PRIVACY-POLICY-DRAFT.md (Oct 24, 2026). Contact: SUPPORT_EMAIL (support@ridgelineapps.us). */}
        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <p>
              MakeQR Pro (makeqr.pro) is operated by <strong>Ridgeline Apps LLC, an Ohio limited liability company</strong>,
              Wheelersburg, Ohio (&quot;we,&quot; &quot;us&quot;). Questions: 
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600">{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>What you type into a QR code</strong> (links, text, WiFi names and passwords, contact details) is turned into an image <strong>in your browser</strong>. We don&apos;t receive or store it.</li>
              <li><strong>Pro purchases:</strong> Stripe collects your email and payment details. We receive your Stripe customer ID, email, plan and subscription status. We never see your full card number.</li>
              <li><strong>Restore Pro by email (when available):</strong> the email you type, used only to look up your Stripe purchase and, if it matches, email you a one-time sign-in link. We don&apos;t tell anyone whether an email has Pro.</li>
              <li><strong>Cookies:</strong> a signed cookie that remembers you&apos;re on Pro (<code>qr_pro</code>), a billing cookie (<code>qr_billing</code>), and browser storage for your color and type settings.</li>
              <li><strong>Server logs</strong> from our hosting providers (Vercel, Cloudflare): IP address, browser type, pages requested and time, kept by those providers under their own retention policies.</li>
              <li><strong>Email you send us.</strong></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Advertising (free pages only)</h2>
            <p>Free pages show Google AdSense ads. Pro users don&apos;t load the ad script.</p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this website or other websites.</li>
              <li>Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the Internet.</li>
              <li>You can opt out of personalized advertising at <a href="https://adssettings.google.com" className="text-indigo-600" target="_blank" rel="noopener noreferrer">https://adssettings.google.com</a> or <a href="https://www.aboutads.info" className="text-indigo-600" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.</li>
              <li>If you&apos;re in the EEA, the UK or Switzerland, or we can&apos;t tell where you are, we don&apos;t load Google AdSense at all. You see no ads, and no ad cookies are set.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How we use information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide the generator and Pro features.</li>
              <li>To check and manage your subscription with Stripe.</li>
              <li>To answer support email.</li>
              <li>To prevent abuse.</li>
              <li>To show ads on free pages.</li>
            </ul>
            <p className="mt-3">We <strong>don&apos;t sell</strong> your personal information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Sharing</h2>
            <p>
              We share information only with the services that run the site (<a href="https://stripe.com/privacy" className="text-indigo-600" target="_blank" rel="noopener noreferrer">Stripe</a>, 
              <a href="https://vercel.com/legal/privacy-policy" className="text-indigo-600" target="_blank" rel="noopener noreferrer">Vercel</a>, <a href="https://www.cloudflare.com/privacypolicy/" className="text-indigo-600" target="_blank" rel="noopener noreferrer">Cloudflare</a>, 
              <a href="https://policies.google.com/privacy" className="text-indigo-600" target="_blank" rel="noopener noreferrer">Google AdSense</a> on free pages), or when the law requires it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Retention</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Stripe keeps purchase records as required for payments.</li>
              <li>We keep support email as long as needed to help you.</li>
              <li>Cookies expire on their own (the Pro cookie within 14 days, and it&apos;s re-checked with Stripe about every hour; the billing cookie within 30 days), and you can clear them anytime.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Your choices</h2>
            <p>
              Email us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600">{CONTACT_EMAIL}</a> to access, correct or delete information we hold, or to cancel Pro. Cancelling is also available through Manage billing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Children</h2>
            <p>MakeQR Pro isn&apos;t directed at children under 13, and we don&apos;t knowingly collect their information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes</h2>
            <p>We&apos;ll post changes here with a new date.</p>
          </section>

          <section>
            <div className="bg-gray-50 rounded-lg p-4 mt-3 text-sm">
              <p className="font-medium text-gray-900">Ridgeline Apps LLC</p>
              <p>Wheelersburg, OH 45694</p>
              <p>
                Email: 
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600">{CONTACT_EMAIL}</a>
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
