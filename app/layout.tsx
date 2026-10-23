import { PRO_PRICE } from "@/lib/pricing";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import AdsLoader from "@/components/AdsLoader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Free QR Code Generator, No Signup or Watermark | MakeQR",
    template: "%s | MakeQR",
  },
  description:
    `Make a QR code for any link or text in seconds. Free, no signup, no watermark, PNG download. Pro (${PRO_PRICE}/mo) adds WiFi, contact, SMS, logos, SVG and bulk.`,
  authors: [{ name: "Ridgeline Apps LLC" }],
  creator: "Ridgeline Apps LLC",
  publisher: "Ridgeline Apps LLC",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Free QR code generator, no signup, no watermark",
    description:
      "Paste a link, pick your colors, download a PNG. Codes are static, so they keep working as long as the link does.",
    images: [{ ...OG_IMAGE }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free QR code generator, no signup, no watermark",
    description:
      "Paste a link, pick your colors, download a PNG. Codes are static, so they keep working as long as the link does.",
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  other: {
    "google-adsense-account": "ca-pub-8175259221220756",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-8175259221220756" />
      </head>
      <body className={inter.className}>
        {children}
        {/* AdSense loads only after the server confirms this browser is not Pro. */}
        <AdsLoader />
      </body>
    </html>
  );
}
