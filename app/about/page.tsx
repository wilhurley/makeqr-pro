import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { COMPANY, COMPANY_LOCATION, FOUNDER, pageMetadata, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "About MakeQR Pro: A Simple, Static QR Code Generator",
  description:
    `MakeQR Pro is a small QR code generator from Ridgeline Apps LLC in Wheelersburg, Ohio. Static codes, no signup, no watermark, and a Pro plan that's coming soon.`,
  path: "/about",
  absolute: true,
});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Back to MakeQR Pro
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-3">About MakeQR Pro</h1>
        <p className="text-gray-600 leading-relaxed">
          MakeQR Pro is a small QR code generator. You paste a link or some text, pick colors, and download a PNG.
        </p>

        <div className="space-y-6 text-gray-700 leading-relaxed mt-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Why it exists</h2>
            <p>
              Most free QR sites ask you to sign up, stamp a watermark on the code, or turn the link off after a trial. This one doesn&apos;t. The code is built in your browser from what you type. We don&apos;t keep a copy of it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">What&apos;s free, and what&apos;s Pro</h2>
            <p>
              Free is URL and text codes, custom colors, and a PNG download. No signup and no watermark. PNG on the free plan goes up to 512px.
            </p>
            <p className="mt-2">
              Pro is coming soon and isn&apos;t on sale yet. It will add WiFi, email, phone, SMS, and contact cards, a logo in the center, SVG download, sizes up to 1024px, and bulk codes. Bulk means you paste a list of URLs, one per line, and download a ZIP. There isn&apos;t a spreadsheet upload.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Why a static code doesn&apos;t depend on our servers</h2>
            <p>
              The link or the text is written into the image. There&apos;s no short link on our server that we can shut off, and we don&apos;t count scans. If the page you pointed at moves, or you want different words in the code, make a new one and print it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Who runs it</h2>
            <p>
              {COMPANY}, in {COMPANY_LOCATION}. {FOUNDER} is the founder. Another thing we make is{" "}
              <a href="https://snap.vin/" className="text-indigo-600 hover:underline">Snap.VIN</a>, a free VIN decoder.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact</h2>
            <p>
              Email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 hover:underline">{SUPPORT_EMAIL}</a>.
              The <Link href="/terms" className="text-indigo-600 hover:underline">terms</Link> and{" "}
              <Link href="/privacy" className="text-indigo-600 hover:underline">privacy policy</Link> are short on purpose. Printing help is on the{" "}
              <Link href="/best-practices" className="text-indigo-600 hover:underline">best practices</Link> page.
            </p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
