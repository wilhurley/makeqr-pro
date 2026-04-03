import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About MakeQR Pro",
  description:
    "Learn what MakeQR Pro is, who it is for, and how we build reliable QR code tools for businesses, creators, and everyday use.",
  keywords: [
    "about makeqr pro",
    "qr code tool company",
    "qr code generator for business",
    "static qr code platform",
  ],
  alternates: {
    canonical: "https://makeqr.pro/about",
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            Back to generator
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-3">About MakeQR Pro</h1>
          <p className="text-gray-600">
            MakeQR Pro is a fast, privacy-conscious QR code generator built for practical daily use.
          </p>
        </div>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Our goal</h2>
            <p>
              We built MakeQR Pro to remove friction from QR code creation. Most people need a code quickly and need it to
              scan reliably on different devices. We focus on clean output, practical formats, and controls that matter in
              real-world print and marketing scenarios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Who uses MakeQR Pro</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Small businesses creating menu, WiFi, and storefront QR codes</li>
              <li>Sales and marketing teams running print campaigns</li>
              <li>Event organizers sharing registration and contact links</li>
              <li>Creators and freelancers linking profiles and portfolios</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">How we design for reliability</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>High error-correction defaults for better scan tolerance</li>
              <li>Simple color controls that avoid low-contrast failures</li>
              <li>Support for PNG and SVG export for web and print workflows</li>
              <li>Clear guidance on logo overlays and practical sizing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Business model</h2>
            <p>
              Core QR creation stays free. Pro adds advanced capabilities for teams and high-volume workflows, including logo
              overlays, bulk generation, SVG export, and larger output sizes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Company</h2>
            <p>
              MakeQR Pro is operated by ARC Technologies LLC.
            </p>
          </section>
        </div>

        <div className="mt-10 p-5 rounded-2xl border border-indigo-100 bg-indigo-50">
          <p className="text-indigo-900 font-medium mb-2">Next steps</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/qr-code-best-practices" className="text-indigo-700 hover:underline">QR best practices</Link>
            <Link href="/privacy" className="text-indigo-700 hover:underline">Privacy policy</Link>
            <Link href="/terms" className="text-indigo-700 hover:underline">Terms</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
