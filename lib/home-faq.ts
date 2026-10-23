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
      "No. They're static codes: the link or text you enter is encoded directly in the image, so there's no server in the middle that can switch them off. If the link itself changes, you'll need to make and print a new code. Dynamic codes (Pro) work differently: see below.",
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
  {
    question: "What's a dynamic QR code?",
    answer:
      "A Pro code that points at a short makeqr.pro link instead of your link directly, so you can change where it goes after you've printed it and see a basic scan count. Because it goes through our server, it only works while MakeQR is running. If your Pro plan ends, your dynamic codes keep redirecting to their last destination as long as your account exists; you just can't edit them until you resubscribe.",
  },
];
