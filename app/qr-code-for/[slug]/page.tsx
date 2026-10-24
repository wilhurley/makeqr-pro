import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QrGenerator from "@/components/QrGenerator";
import { JsonLd } from "@/components/JsonLd";
import { RichText } from "@/components/RichText";
import { SiteFooter } from "@/components/SiteFooter";
import { faqEntities } from "@/lib/schema";
import { pageMetadata } from "@/lib/site";
import { getUseCase, USE_CASES } from "@/lib/use-cases";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return USE_CASES.map((useCase) => ({ slug: useCase.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) return {};

  return pageMetadata({
    title: useCase.title,
    description: useCase.description,
    path: `/qr-code-for/${useCase.slug}`,
    absolute: useCase.absoluteTitle,
  });
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) notFound();

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntities(useCase.faqs),
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <QrGenerator key={useCase.slug} initialType={useCase.tab}>
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">{useCase.h1}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-base">{useCase.intro}</p>
          {useCase.proNote && (
            <p className="mt-3 inline-block text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-800 rounded-full px-3 py-1">
              {useCase.proNote}
            </p>
          )}
        </div>
      </QrGenerator>

      <article className="max-w-3xl mx-auto px-4 pb-8 text-gray-700 dark:text-gray-300 leading-relaxed">
        <div className="space-y-6">
          {useCase.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-2">
                  <RichText text={paragraph} />
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-900 p-4 text-sm text-indigo-900 dark:text-indigo-100">
          {useCase.honesty}
        </p>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">Questions</h2>
        <div className="space-y-4">
          {useCase.faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">{faq.question}</h3>
              <p className="mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm">
          <Link href="/" className="text-indigo-600 hover:underline">Back to the generator</Link>
          {" · "}
          <Link href="/best-practices" className="text-indigo-600 hover:underline">QR code best practices</Link>
        </p>
      </article>

      <SiteFooter />
      <JsonLd data={faqLd} />
    </main>
  );
}
