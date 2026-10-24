import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { TermsMarkdown } from "@/components/TermsMarkdown";
import { pageMetadata } from "@/lib/site";
import { termsD1Markdown } from "@/lib/terms-archive-d1";
import { TERMS_VERSION } from "@/lib/terms-version";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service (archived version 2026-10-24-d1)",
  description: "An earlier version of the MakeQR Pro Terms of Service.",
  path: "/terms/archive/2026-10-24-d1",
});
metadata.robots = { index: false, follow: true };

export default function ArchivedTermsD1Page() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Back to MakeQR Pro
        </Link>
        <p className="mt-4 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Archived version. This version was replaced by version {TERMS_VERSION}. See the{" "}
          <Link href="/terms" className="underline">current Terms</Link>. Plans it mentions other than monthly Pro were never sold.
        </p>
        <TermsMarkdown source={termsD1Markdown()} />
      </div>
      <SiteFooter />
    </main>
  );
}
