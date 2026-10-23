import { proPriceAmount } from "@/lib/pricing";
import { HOME_FAQS } from "@/lib/home-faq";
import { COMPANY, SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

export function faqEntities(faqs: { question: string; answer: string }[]) {
  return faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  }));
}

export const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: COMPANY,
      legalName: COMPANY,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icon-512.png`,
      email: SUPPORT_EMAIL,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Wheelersburg",
        addressRegion: "OH",
        addressCountry: "US",
      },
      sameAs: ["https://snap.vin/"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      publisher: { "@id": `${SITE_URL}/#org` },
      inLanguage: "en-US",
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript",
      publisher: { "@id": `${SITE_URL}/#org` },
      description:
        "Free static QR code generator for links and text, with PNG download, custom colors, no signup and no watermark. Pro adds WiFi, email, phone, SMS and contact codes, logo overlay, SVG export, bulk generation and sizes up to 1024px.",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "USD",
          description:
            "URL and text QR codes, custom colors, PNG download. No signup, no watermark.",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: proPriceAmount(),
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: proPriceAmount(),
            priceCurrency: "USD",
            billingDuration: "P1M",
            unitCode: "MON",
          },
          description:
            "All 7 QR types (URL, Text, WiFi, Email, Phone, SMS, Contact), logo overlay, SVG export, bulk generator, sizes up to 1024px, no ads.",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: faqEntities(HOME_FAQS),
    },
  ],
};
