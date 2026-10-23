import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "QR Code Best Practices: Size, Contrast and Print Tips",
  description:
    "How big to print a QR code, which colors still scan, where to put a logo, and how to test before you print 500 flyers. Practical tips, no fluff.",
  path: "/best-practices",
  absolute: true,
});

export default function BestPracticesPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Back to MakeQR Pro
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-3">QR code best practices</h1>
        <p className="text-gray-600 leading-relaxed">
          A code that looks fine on your laptop can fail on a flyer. These are the checks that prevent a reprint.
        </p>

        <div className="space-y-6 text-gray-700 leading-relaxed mt-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Minimum print size</h2>
            <p>
              A practical rule: the code&apos;s width should be about one tenth of the distance someone will scan from. A table tent scanned from a foot away can be about an inch to an inch and a half. A poster across a room needs to be bigger. A yard-sign rider read from the curb wants a code several inches wide.
            </p>
            <p className="mt-2">
              Don&apos;t go under about 0.8 inch (2 cm) even for a business card, and go larger if the code is dense. Print one at the real size and scan it from the real spot before you order the rest.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Contrast and colors that scan</h2>
            <p>
              Dark squares on a light background. Black on white is the boring choice that works. Navy, dark green, or burgundy on white or cream usually works too.
            </p>
            <p className="mt-2">
              Pale yellow, light gray, and a code sitting on a photograph are the ones that fail. Light squares on a dark background are unreliable, so don&apos;t invert it to match a dark invite. If the brand color is light, use it in the border or the headline, and keep the code itself dark.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiet zone</h2>
            <p>
              Leave a blank margin around the code, about as wide as four of the small squares. Don&apos;t crop off the white edge the download includes, and don&apos;t set type or a border tight against the squares. Phones use that empty space to find where the code starts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Logos and error correction</h2>
            <p>
              A logo in the center is a Pro feature. MakeQR Pro builds codes with high error correction, which is what lets a modest logo still scan. Keep the logo small, and don&apos;t cover the three big squares in the corners.
            </p>
            <p className="mt-2">
              Add the logo, then scan the result on two phones. If either one hesitates, shrink the logo or take it off. A pretty code that doesn&apos;t scan is just a sticker.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">PNG vs SVG for print</h2>
            <p>
              PNG is free. It&apos;s a grid of pixels, so it stays sharp if you print it near the size you exported. Free PNG goes up to 512px. Pro PNG goes up to 1024px, which is enough for a lot of flyers and counter cards.
            </p>
            <p className="mt-2">
              SVG is Pro. It&apos;s a vector file, so a print shop can scale it for a banner or a yard sign and the edges stay clean. Send SVG when someone else is printing it large. PNG is fine for a receipt, a table tent, or a page on the web.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Test on two phones before printing</h2>
            <p>
              Print one sample at the final size. Scan it with an iPhone and an Android phone, in the light the real thing will live in. Daylight through a window and a dim restaurant are different tests.
            </p>
            <p className="mt-2">
              If the code will sit under laminate or behind glass, test that too. Glare is a real failure, and you&apos;ll only see it on the finished piece. Open the link or read the text all the way through. A scan that lands on the wrong page is worse than a scan that fails.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Static codes: keep the link stable</h2>
            <p>
              The address you paste is the address the code opens, forever. MakeQR Pro doesn&apos;t sit in the middle, so we can&apos;t point an old code at a new page.
            </p>
            <p className="mt-2">
              Put the code on a page you control, like yoursite.com/menu or your own listing page, and update that page when the details change. The printed code can stay. If you encode a link you don&apos;t control, and that link dies, the code dies with it. You&apos;ll need a new one.
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm text-gray-600">
          Ready to make one? Use the <Link href="/" className="text-indigo-600 hover:underline">generator</Link>.
          Menus, signs, and events each have a short page:{" "}
          <Link href="/qr-code-for/menu" className="text-indigo-600 hover:underline">menu</Link>,{" "}
          <Link href="/qr-code-for/real-estate-sign" className="text-indigo-600 hover:underline">real estate sign</Link>,{" "}
          <Link href="/qr-code-for/event" className="text-indigo-600 hover:underline">event</Link>.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
