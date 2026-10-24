import type { MetadataRoute } from "next";
import { USE_CASES } from "@/lib/use-cases";

/**
 * lastModified is the day that page's copy last changed.
 * Bump a single entry when you edit that page. Don't stamp every URL
 * with `new Date()` on each build, or the dates stop meaning anything.
 */
const UPDATED: Record<string, string> = {
  "https://makeqr.pro": "2026-10-22",
  "https://makeqr.pro/about": "2026-10-22",
  "https://makeqr.pro/best-practices": "2026-10-22",
  "https://makeqr.pro/privacy": "2026-10-22",
  "https://makeqr.pro/terms": "2026-10-23",
  "https://makeqr.pro/refund": "2026-10-23",
  "https://makeqr.pro/pricing": "2026-10-24",
  "https://makeqr.pro/contact": "2026-10-23",
  ...Object.fromEntries(
    USE_CASES.map((useCase) => [`https://makeqr.pro/qr-code-for/${useCase.slug}`, "2026-10-22"]),
  ),
};

function lastModified(url: string) {
  const day = UPDATED[url];
  if (!day) throw new Error(`sitemap lastmod missing for ${url}`);
  return new Date(`${day}T00:00:00.000Z`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/best-practices", changeFrequency: "monthly", priority: 0.7 },
    ...USE_CASES.map((useCase) => ({
      path: `/qr-code-for/${useCase.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.5 },
    { path: "/refund", changeFrequency: "yearly", priority: 0.3 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
  ];

  return pages.map((page) => {
    const url = page.path ? `https://makeqr.pro${page.path}` : "https://makeqr.pro";
    return {
      url,
      lastModified: lastModified(url),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    };
  });
}
