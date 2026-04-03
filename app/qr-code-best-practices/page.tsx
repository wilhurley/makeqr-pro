import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "QR Code Best Practices for Print and Marketing",
  description:
    "Learn practical QR code best practices: sizing, contrast, placement, testing, and campaign tracking tips for better scan rates.",
  keywords: [
    "qr code best practices",
    "qr code size for print",
    "how to make qr code scannable",
    "qr code marketing tips",
    "qr code contrast requirements",
  ],
  alternates: {
    canonical: "https://makeqr.pro/qr-code-best-practices",
  },
};

export default function QrBestPracticesPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            Back to generator
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-3">QR Code Best Practices</h1>
          <p className="text-gray-600">
            Better scan rates come from practical design choices, not just generating a code and hoping for the best.
          </p>
        </div>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Use sufficient size for distance</h2>
            <p>
              A common rule is roughly 1 inch of QR size for every 10 feet of scan distance. For flyers and business cards,
              1 to 1.2 inches usually works. For posters and storefront signs, increase size based on viewing distance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Keep high contrast</h2>
            <p>
              Dark foreground on a light background scans best. Avoid low-contrast color combos and busy photo backgrounds.
              If using brand colors, test with older phone cameras in bright and low-light conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Leave a quiet zone</h2>
            <p>
              QR codes need empty white space around all edges. Do not place logos, text, or borders too close to modules,
              or scanners may fail to detect the code boundary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Be careful with logo overlays</h2>
            <p>
              Center logos can work, but keep them modest in size and use high error correction. Always test on multiple
              devices before publishing to print.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Pair code with a clear call-to-action</h2>
            <p>
              Users scan more when they know what happens next. Add copy like &quot;Scan for menu&quot;, &quot;Join WiFi&quot;, &quot;Get quote&quot;,
              or &quot;View product specs&quot; directly beside the code.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Test before launch</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Test iOS and Android</li>
              <li>Test in daylight and indoor lighting</li>
              <li>Test printed sample at final size</li>
              <li>Test after laminating or placing behind glass</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Use clean destination URLs</h2>
            <p>
              Keep links readable and trustworthy. Avoid long, suspicious-looking URLs. For campaigns, use short branded links
              and analytics parameters only when needed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Prepare for print realities</h2>
            <p>
              Export SVG for large formats and professional print workflows. PNG can work for web and small print,
              but vector formats preserve edge sharpness when scaling.
            </p>
          </section>
        </div>

        <div className="mt-10 p-5 rounded-2xl border border-indigo-100 bg-indigo-50 text-sm text-indigo-900">
          Need a quick build? Generate your next code on the <Link href="/" className="font-semibold underline">MakeQR Pro homepage</Link>.
        </div>
      </div>
    </main>
  );
}
