import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Checkout canceled | MakeQR Pro",
  robots: { index: false, follow: true },
};

/** Stripe Checkout cancel_url. Success returns to /?pro=success&session_id=... (verified by /api/verify-session). */
export default function ProCancelPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Checkout canceled</h1>
        <p className="text-gray-600 mb-8">No charge was made. The free generator still works as before.</p>
        <Link href="/" className="inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
          Back to MakeQR
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
