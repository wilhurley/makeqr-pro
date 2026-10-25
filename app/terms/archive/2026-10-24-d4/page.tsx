import type { Metadata } from "next";
import Link from "next/link";
import { ArchivedTermsD4Banner } from "@/components/ArchivedTermsBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { TermsMarkdown } from "@/components/TermsMarkdown";
import { pageMetadata } from "@/lib/site";
import { termsD4Markdown } from "@/lib/terms-archive-d4";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service (archived version 2026-10-24-d4)",
  description: "An earlier version of the MakeQR Pro Terms of Service.",
  path: "/terms/archive/2026-10-24-d4",
});
metadata.robots = { index: false, follow: true };

export default function ArchivedTermsD4Page() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/terms" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Current Terms
        </Link>
        <ArchivedTermsD4Banner />
        <TermsMarkdown source={termsD4Markdown()} />
      </div>
      <SiteFooter />
    </main>
  );
}
