import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { formatProPrice, proPriceAmount } from "@/lib/pricing";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = "https://makeqr.pro";
const SITE_NAME = "MakeQR Pro";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Free QR Code Generator — MakeQR.pro | URL, WiFi, Contact, SMS",
    template: "%s | MakeQR Pro",
  },
  description:
    "Generate QR codes instantly — free, no signup, no watermark. Supports URL, WiFi, contact card, SMS, email, and phone. Download PNG or SVG. Trusted by thousands of businesses.",
  keywords: [
    "free qr code generator",
    "qr code maker",
    "qr code creator",
    "dynamic qr alternatives",
    "static qr code generator",
    "custom qr code",
    "wifi qr code",
    "url to qr code",
    "restaurant wifi qr code",
    "qr code for menu",
    "qr code for business card",
    "qr code for business",
    "bulk qr code generator",
    "qr code with logo",
    "free qr code no signup",
    "create qr code online",
    "download qr code svg",
    "makeqr",
    "make qr code",
    "qr code download",
    "qr code png",
    "qr code svg",
  ],
  authors: [{ name: "ARC Technologies LLC", url: "https://arctechnologiesllc.com" }],
  creator: "ARC Technologies LLC",
  publisher: "ARC Technologies LLC",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Free QR Code Generator — MakeQR.pro",
    description:
      "Create QR codes for URLs, WiFi, contacts, SMS, email and more. Free, instant, no account needed. Download PNG or SVG.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MakeQR Pro — Free QR Code Generator",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free QR Code Generator — MakeQR.pro",
    description:
      "Create QR codes for URLs, WiFi, contacts, SMS and more. Free, instant, no signup.",
    images: ["/og-image.png"],
    creator: "@ARCTechLLC",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
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

function buildJsonLd() {
  const priceLabel = formatProPrice();
  const priceAmount = proPriceAmount();
  return {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: SITE_NAME,
      url: SITE_URL,
      description:
        "Free online QR code generator. Create QR codes for URLs, WiFi networks, contact cards, SMS, email, and phone numbers. No signup required.",
      applicationCategory: "UtilityApplication",
      operatingSystem: "Web",
      offers: [
        {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free tier — URL and Text QR codes, PNG download",
        },
        {
          "@type": "Offer",
          price: priceAmount,
          priceCurrency: "USD",
          description: `Pro plan — all 7 QR types, logo overlay, bulk generator, SVG export, larger sizes (${priceLabel}/month)`,
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is MakeQR Pro really free to use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `Yes. URL and text QR codes, custom colors, and PNG download are 100% free with no signup required. Pro unlocks WiFi, SMS, Contact, logo overlay, bulk generation, SVG export, and sizes up to 1024px for ${priceLabel}/month.`,
          },
        },
        {
          "@type": "Question",
          name: "How do I create a QR code for a website URL?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Select the 'URL' tab, paste your website address, customize the color and size if you like, then click Download PNG. Your QR code is ready instantly — no account needed.",
          },
        },
        {
          "@type": "Question",
          name: "How do I create a WiFi QR code?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Select the 'WiFi' tab (Pro feature), enter your network name (SSID), password, and security type, then download the QR code. Customers or guests can scan it to connect automatically — no typing needed.",
          },
        },
        {
          "@type": "Question",
          name: "Can I add my logo to a QR code?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `Yes — with a Pro subscription (${priceLabel}/month) you can upload any image as a logo and it will appear in the center of your QR code. The high error correction level ensures the code remains scannable.`,
          },
        },
        {
          "@type": "Question",
          name: "Do QR codes expire?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. QR codes generated by MakeQR Pro are static and never expire. The code links directly to the URL or data you entered, and works forever.",
          },
        },
        {
          "@type": "Question",
          name: "What formats can I download my QR code in?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Free users can download QR codes as PNG. Pro users also get SVG (vector format), which scales to any size perfectly — ideal for print, signage, and merchandise.",
          },
        },
        {
          "@type": "Question",
          name: "Can I generate QR codes in bulk?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — Pro subscribers can use the Bulk Generator to paste or upload a list of URLs (one per line) and download all QR codes as a ZIP file in seconds.",
          },
        },
      ],
    },
    {
      "@type": "Organization",
      "@id": "https://arctechnologiesllc.com/#org",
      name: "ARC Technologies LLC",
      url: "https://arctechnologiesllc.com",
      sameAs: ["https://makeqr.pro", "https://floodzone.fyi", "https://snap.vin"],
    },
  ],
};
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = buildJsonLd();
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-8175259221220756" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8175259221220756"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
