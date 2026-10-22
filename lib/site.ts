import type { Metadata } from "next";

export const SITE_URL = "https://makeqr.pro";
export const SITE_NAME = "MakeQR Pro";
export const COMPANY = "Ridgeline Apps LLC";
export const COMPANY_LOCATION = "Wheelersburg, Ohio";
export const SUPPORT_EMAIL = "support@ridgelineapps.us";
export const FOUNDER = "Wil Hurley";

export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "MakeQR Pro, free QR code generator",
} as const;

type PageMetaInput = {
  title: string;
  description: string;
  /** Path beginning with `/`, or empty for the apex. */
  path: string;
  /** Use the title as-is. Otherwise the root template adds ` | MakeQR`. */
  absolute?: boolean;
  ogTitle?: string;
  ogDescription?: string;
};

export function pageMetadata(input: PageMetaInput): Metadata {
  const path = input.path === "/" ? "" : input.path;
  const url = path ? `${SITE_URL}${path}` : SITE_URL;
  const ogTitle = input.ogTitle ?? input.title;
  const ogDescription = input.ogDescription ?? input.description;

  return {
    title: input.absolute ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url,
      title: ogTitle,
      description: ogDescription,
      images: [{ ...OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [OG_IMAGE.url],
    },
  };
}
