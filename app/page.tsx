import { PRO_PRICE } from "@/lib/pricing";
import Link from "next/link";
import QrGenerator from "@/components/QrGenerator";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { HOME_FAQS } from "@/lib/home-faq";
import { homeJsonLd } from "@/lib/schema";
import { pageMetadata } from "@/lib/site";
import { USE_CASES } from "@/lib/use-cases";

export const metadata = pageMetadata({
  title: "Free QR Code Generator, No Signup or Watermark | MakeQR",
  description:
    `Make a QR code for any link or text in seconds. Free, no signup, no watermark, PNG download. Pro (${PRO_PRICE}/mo) adds WiFi, contact, SMS, logos, SVG and bulk.`,
  path: "",
  absolute: true,
  ogTitle: "Free QR code generator, no signup, no watermark",
  ogDescription:
    "Paste a link, pick your colors, download a PNG. Codes are static, so they keep working as long as the link does.",
});

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <QrGenerator />

      <div className="max-w-5xl mx-auto px-4 pb-4 space-y-10 text-gray-600 dark:text-gray-300">
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Free vs Pro</h2>
          <p className="leading-relaxed">
            URL and text codes are free. You get custom colors, a PNG download, no signup, and no watermark. Free PNG goes up to 512px.
          </p>
          <p className="leading-relaxed mt-2">
            Pro is {PRO_PRICE} a month. It adds WiFi, email, phone, SMS, and contact cards, a logo in the center, SVG download, bulk codes, and sizes up to 1024px. Bulk is a pasted list of URLs, one per line, saved as a ZIP. There&apos;s no spreadsheet upload.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Do these codes depend on MakeQR Pro?</h2>
          <p className="leading-relaxed">
            Static QR codes encode your link directly, so they don&apos;t depend on our servers. There&apos;s no account holding the code. If the link changes, or you want different text, make a new code and print that one.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Printing tips</h2>
          <p className="leading-relaxed">
            Use a dark color on a light background, leave a blank margin around the code, and print it big enough for the distance. Try a sample on two phones before you print a stack. The longer version is on the{" "}
            <Link href="/best-practices" className="text-indigo-600 hover:underline">best practices</Link> page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Use cases</h2>
          <p className="leading-relaxed mb-4">
            A static code is a good fit for these. WiFi and contact cards are Pro. The others are a normal link or a bit of text, which is free.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {USE_CASES.map((useCase) => (
              <Link
                key={useCase.slug}
                href={`/qr-code-for/${useCase.slug}`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm hover:border-indigo-200"
              >
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {useCase.cardTitle}
                  {useCase.pro && <span className="ml-2 text-[10px] font-semibold text-indigo-600">PRO</span>}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{useCase.card}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Frequently asked questions</h2>
          <div className="space-y-5">
            {HOME_FAQS.map((faq) => (
              <div key={faq.question} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">{faq.question}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
      <JsonLd data={homeJsonLd} />
    </main>
  );
}
