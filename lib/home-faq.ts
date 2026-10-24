import { PRO_PRICE } from "@/lib/pricing";
export const HOME_FAQS: { question: string; answer: string }[] = [
  {
    question: "Is MakeQR Pro really free to use?",
    answer:
      `Yes. URL and text QR codes, custom colors and PNG download are free with no signup and no watermark. Pro (${PRO_PRICE}/month) unlocks WiFi, Email, Phone, SMS and Contact codes, logo overlay, bulk generation, SVG export and sizes up to 1024px.`,
  },
  {
    question: "Do QR codes from MakeQR Pro expire?",
    answer:
      "Static codes don't expire. The image keeps working as long as the link or text inside it is still valid. We don't host or redirect it. If the link itself changes, you'll need to make and print a new code.",
  },
  {
    question: "How do I create a WiFi QR code?",
    answer:
      "Pick the WiFi tab (Pro), enter your network name, password and security type, then download. Guests scan it and their phone joins the network.",
  },
  {
    question: "Can I add my logo to a QR code?",
    answer:
      "Yes, with Pro. Upload an image and it sits in the center of the code. High error correction keeps it scannable.",
  },
  {
    question: "What formats can I download?",
    answer:
      "Free: PNG. Pro: PNG and SVG. SVG is vector, so it stays sharp at any print size.",
  },
  {
    question: "Can I generate QR codes in bulk?",
    answer:
      "Yes, with Pro. Paste a list of URLs, one per line, and download all the codes as a ZIP.",
  },
];
