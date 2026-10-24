import { PRO_PRICE } from "@/lib/pricing";
export type QrTab = "url" | "text" | "wifi" | "vcard";

export type UseCaseSection = {
  heading: string;
  paragraphs: string[];
};

export type UseCase = {
  slug: string;
  tab: QrTab;
  pro: boolean;
  title: string;
  absoluteTitle: boolean;
  description: string;
  h1: string;
  intro: string;
  proNote?: string;
  cardTitle: string;
  card: string;
  sections: UseCaseSection[];
  honesty: string;
  faqs: { question: string; answer: string }[];
};

export const USE_CASES: UseCase[] = [
  {
    slug: "wifi",
    tab: "wifi",
    pro: true,
    absoluteTitle: true,
    title: "WiFi QR Code Generator (Pro): Let Guests Join Without a Password",
    description:
      "Make a QR code that connects phones to your WiFi with one scan. Enter your network name and password, download, print. WiFi codes are part of MakeQR Pro.",
    h1: "WiFi QR code generator (Pro)",
    intro:
      "Enter the network name and password, download the code, and guests can join from their camera.",
    proNote: `WiFi codes are part of MakeQR Pro (${PRO_PRICE}/mo). URL and text codes are free.`,
    cardTitle: "WiFi",
    card: "Guests join the network from a scan. Pro.",
    sections: [
      {
        heading: "How it works",
        paragraphs: [
          "A WiFi code holds three things: the network name, the password, and the security type. In the generator those are the SSID, the password, and a choice of WPA/WPA2, WEP, or no password.",
          "MakeQR Pro writes that into the image. A guest opens the camera, points it at the code, and taps the prompt to join. They don't type the password, and you don't have to read it across the counter.",
          "WPA/WPA2 is the right choice for almost every home and shop router. WEP is old and rare. No password is only for a network that really has none. If the security type doesn't match the router, the phone sees the code and then refuses to join.",
        ],
      },
      {
        heading: "Which phones can scan it",
        paragraphs: [
          "The camera app on a current iPhone reads WiFi codes, and so does the camera on most Android phones. Older phones sometimes still need a scanner app.",
          "If the code is for customers, test one iPhone and one Android before you print a stack of table cards. The {best-practices} page covers size and contrast if a phone is fussy.",
        ],
      },
      {
        heading: "Where to put it",
        paragraphs: [
          "The front desk, an Airbnb welcome card, a café table, the fridge in a rental. Put it where someone is standing still, around chest or table height, with enough light to see the squares.",
          "A code on a glossy screen can glare. A printed card is easier to scan, and easier to swap when the password changes.",
        ],
      },
      {
        heading: "Use a guest network",
        paragraphs: [
          "Anyone who can see the code can join that network. That's the point for guests, and a bad idea for the network that runs your card reader, cameras, or home computers.",
          "Use a guest network with its own password. If the card sits in a window facing the street, assume a neighbor can scan it too.",
        ],
      },
      {
        heading: "A new password means a new code",
        paragraphs: [
          "The password is baked in when you download. Changing it on the router does not change posters you already printed. There is no dashboard that updates them.",
          "Print a new code and replace the old cards. The same is true if you rename the network.",
        ],
      },
    ],
    honesty:
      "These are static QR codes. The network name and password are baked into the code, so it doesn't expire and there's no scan limit. If you change the password, you'll need a new code.",
    faqs: [
      {
        question: "Do I need an app to scan it?",
        answer:
          "Usually no. The camera app on a current iPhone, and on most Android phones, reads a WiFi code. Point the camera at it and tap the join prompt. An older phone may still need a scanner app.",
      },
      {
        question: "Does it work with hidden networks?",
        answer:
          "No. The generator doesn't have a hidden-network option. Use a visible guest network so the phone can join from the code.",
      },
      {
        question: "Is the WiFi QR code free?",
        answer:
          `No. WiFi codes are part of MakeQR Pro (${PRO_PRICE}/mo). URL and text codes are free, with no signup and no watermark.`,
      },
    ],
  },
  {
    slug: "google-reviews",
    tab: "url",
    pro: false,
    absoluteTitle: false,
    title: "QR Code for Google Reviews: Free Generator",
    description:
      "Turn your Google review link into a QR code for the counter, receipts or table tents. Paste the link, download a PNG. Free, no signup, no watermark.",
    h1: "QR code for Google reviews",
    intro: "Paste your Google review link, download a PNG, and put it where people are already standing.",
    cardTitle: "Google reviews",
    card: "A code for your Google review link. Free.",
    sections: [
      {
        heading: "Get your review link",
        paragraphs: [
          "Open your Google Business Profile and look for the way to ask for reviews, or to share the review form. Copy that link. It's an ordinary web address.",
          "If you have more than one location, copy the link for the shop you want the review attached to. A code can't guess which listing you meant.",
        ],
      },
      {
        heading: "Paste it and download",
        paragraphs: [
          "The URL tab is free. Paste the link, pick a color if you want, and download the PNG. There's no signup and no watermark on the file.",
          "A dark code on a white or cream background is the combination that scans with the least fuss. Light yellow on white is a common way to make a code that looks on-brand and doesn't scan.",
        ],
      },
      {
        heading: "Where to put the code",
        paragraphs: [
          "The checkout counter, the bottom of a receipt, an invoice, a table tent, the card in a takeout bag. People scan when the ask is in front of them.",
          "On a receipt, keep the code black and give it room. A thermal printer will mush a tiny mark into a gray blob. A card about the size of a business card on the counter is easier to scan than a speck at the bottom of a long receipt. If you only have room for one, use the counter card.",
          "Leave a little blank paper around the code. Don't cram it against a logo or a perforated edge. Size and margin notes are on the {best-practices} page.",
        ],
      },
      {
        heading: "Wording for the card",
        paragraphs: [
          "Say what the scan does, in a normal voice. \"Got 30 seconds? Tell people how we did.\" is enough. \"Scan here\" with no reason is easy to ignore.",
        ],
      },
      {
        heading: "Don't offer a reward",
        paragraphs: [
          "Don't trade a discount, a free item, or a drawing entry for a review. Google doesn't allow reviews given for a reward, and those reviews can be removed. A plain ask is the safe version.",
        ],
      },
    ],
    honesty:
      "These are static QR codes. The review link is baked into the code, so it doesn't expire and there's no scan limit. If Google gives you a new link, you'll need a new code.",
    faqs: [
      {
        question: "Will the code stop working?",
        answer:
          "The code itself doesn't expire. It keeps opening the same review link, with no scan limit. If that link changes, you'll need a new code.",
      },
      {
        question: "Can I add my logo?",
        answer:
          "Yes, with Pro. A logo can sit in the center of the code. The URL code, custom colors, and PNG download are free.",
      },
      {
        question: "PNG or SVG for printing?",
        answer:
          "PNG is free and fine for a counter card or a receipt. SVG is a Pro download. It's a vector file, so a print shop can scale it and the edges stay sharp.",
      },
    ],
  },
  {
    slug: "menu",
    tab: "url",
    pro: false,
    absoluteTitle: false,
    title: "Restaurant Menu QR Code Generator, Free",
    description:
      "Put your menu on every table with a QR code. Paste your menu link, pick colors, download a PNG. Free, no signup, no watermark. Static codes don't expire. The image keeps working as long as the link or text inside it is still valid. We don't host or redirect it.",
    h1: "QR code for your restaurant menu",
    intro: "Paste your menu link, pick colors, and download a PNG for the table.",
    cardTitle: "Restaurant menu",
    card: "A table code that opens your menu page. Free.",
    sections: [
      {
        heading: "Point the code at a page you can update",
        paragraphs: [
          "This is the part that matters with a static code. Put the menu on a page you control, like yoursite.com/menu, and encode that address. When the soup changes, update the page. The cards on the tables stay put.",
          "If you encode a file and later move it to a new address, the printed code still looks for the old one. Then you are reprinting tent cards, which is the job this setup is meant to avoid.",
        ],
      },
      {
        heading: "A phone page beats a PDF",
        paragraphs: [
          "A simple page with the dishes, the prices, and a phone number is easier to read than a PDF the guest has to pinch and zoom. A PDF link does work if that's what you already have. Open it on your own phone and see if you'd want to order from it.",
          "Big photos of every plate make the page slow on a spotty dining-room connection. A readable list beats a heavy slideshow.",
        ],
      },
      {
        heading: "Size for a table tent",
        paragraphs: [
          "A code around an inch and a half wide is comfortable when someone holds a phone over the table. Leave a blank margin around it. The notes on size, contrast, and that blank margin are on the {best-practices} page.",
          "Match the code to your colors if you want. Keep the squares dark and the background light, or some phones will give up.",
        ],
      },
      {
        heading: "Keep a paper menu",
        paragraphs: [
          "Some people won't scan. Dead battery, an old phone, or they simply don't want to. Keep a few printed menus at the host stand so nobody has to ask twice.",
          "The URL tab is free, colors included. You don't need Pro for one menu code. Pro is a logo in the middle, an SVG file for a print shop, or a ZIP of codes from a pasted list. Write \"Menu\" next to the square so people know what they're opening.",
        ],
      },
    ],
    honesty:
      "These are static QR codes. The menu link is baked into the code, so it doesn't expire and there's no scan limit. Point it at a page you can update, and the printed code can stay when the specials change.",
    faqs: [
      {
        question: "What if my menu changes?",
        answer:
          "Point the code at a page you control, like yoursite.com/menu, and update that page. The printed code stays the same. If the menu moves to a new address, you'll need a new code.",
      },
      {
        question: "Can I match my brand colors?",
        answer:
          "Yes. Custom colors are free on URL codes. Use a dark code on a light background so phones can still scan it.",
      },
      {
        question: "Do customers need an app?",
        answer:
          "No. The camera app on current iPhones and most Android phones opens a link from a QR code.",
      },
    ],
  },
  {
    slug: "business-card",
    tab: "vcard",
    pro: true,
    absoluteTitle: true,
    title: "Business Card QR Code (Pro): Save Your Contact in One Scan",
    description:
      "Add a QR code to your business card that saves your name, phone, email and company straight to their contacts. Contact QR codes are part of MakeQR Pro.",
    h1: "Business card QR code (Pro)",
    intro: "A contact code can save your name, phone, email, and company into someone's phone.",
    proNote: `Contact QR codes are part of MakeQR Pro (${PRO_PRICE}/mo). A link to your site is free.`,
    cardTitle: "Business card",
    card: "Save a contact in one scan. Pro.",
    sections: [
      {
        heading: "Contact code or a plain link",
        paragraphs: [
          "A contact code is a small vCard. After a scan, the phone can save your name, phone, email, and company into its contacts. That tab is part of Pro.",
          "The free option is a URL code that opens your website or your LinkedIn. If all you need is \"here's my page,\" use the URL tab and skip the contact fields.",
        ],
      },
      {
        heading: "Which fields to fill in",
        paragraphs: [
          "The form has name, company, phone, email, and website. Name is the one people look for. Every extra line makes the pattern denser, and a dense code is harder to scan when it's small.",
          "On a card that's already full of type, name, phone, and email are usually enough. Leave company and website off if you don't need them in the contact.",
        ],
      },
      {
        heading: "Size on a 3.5 by 2 inch card",
        paragraphs: [
          "Keep the code at least about 0.8 inch (2 cm) on a side, and bigger if you filled in every field. Give it a quiet white margin. Don't run it off the edge of the card, and don't print it on top of a photo.",
          "Dark squares, light background. If a print shop asks for a vector file, SVG is the Pro download. PNG is what you get on the free URL code, and it's fine for a short run you print yourself. More on that is on the {best-practices} page.",
        ],
      },
      {
        heading: "A new number means a new card",
        paragraphs: [
          "The phone number is part of the image. Order cards when the number is one you plan to keep. If it changes, the old cards still share the old number. Nothing updates them after they leave the printer.",
          "Before you pay for a box of cards, print one sheet at home at the same size and scan it with two phones. A code that looks sharp on screen can blur on a cheap print, and blur is enough to make the contact fail.",
          "The contact code doesn't open your website unless you fill in the website field. If you want both a saved contact and a page, include that field, then check the sample. The phone should offer to save a contact, not only open a browser.",
        ],
      },
    ],
    honesty:
      "These are static QR codes. The contact details are baked into the code, so it doesn't expire and there's no scan limit. A new phone number means a new code.",
    faqs: [
      {
        question: "Contact code or a link?",
        answer:
          "A contact code (Pro) can save your name, phone, email, and company into their contacts. A URL code is free and opens your site or LinkedIn. Use the URL if you only need to send people to a page.",
      },
      {
        question: "How small can it be?",
        answer:
          "On a standard 3.5 by 2 inch card, keep the code at least about 0.8 inch (2 cm) on a side, and bigger if you fill in every field. Fewer fields make a simpler code. Test it on two phones before you order the cards.",
      },
      {
        question: "Is it free?",
        answer:
          `The contact code is Pro (${PRO_PRICE}/mo). A URL code that opens your website is free.`,
      },
    ],
  },
  {
    slug: "payment-link",
    tab: "url",
    pro: false,
    absoluteTitle: false,
    title: "QR Code for Venmo, Cash App or PayPal Links",
    description:
      "Got a payment link? Turn it into a QR code people can scan to pay you. Paste your Venmo, Cash App or PayPal.me link and download. Free, no signup.",
    h1: "QR code for your payment link",
    intro: "Paste a Venmo, Cash App, or PayPal.me link and download a code people can scan to pay you.",
    cardTitle: "Payment link",
    card: "Venmo, Cash App, or PayPal.me. Free.",
    sections: [
      {
        heading: "Copy the link from the app",
        paragraphs: [
          "In Venmo, Cash App, or PayPal, open your profile and use share to copy your link. You want the address that opens your page, such as a PayPal.me link or your Venmo profile link.",
          "MakeQR Pro doesn't build a payment request with an amount filled in. It encodes the link you already have. If you need a specific amount, write it next to the code, or send the request inside the payment app. A scan only opens your page. The other person still chooses what to send.",
          "If you take more than one app, make more than one code and label them. One square that might be Venmo or might be PayPal makes people guess. A second code is free.",
        ],
      },
      {
        heading: "Paste it and download",
        paragraphs: [
          "Use the URL tab, paste the link, and download the PNG. That part is free: no signup, no watermark. A dark code on white is the safe pick for a sign in a window.",
        ],
      },
      {
        heading: "Test it on someone else's phone",
        paragraphs: [
          "Scan it with a phone that isn't signed into your own payment app. You want the payer's view: your name, and a way to send money. Do that before you print a stack of signs.",
        ],
      },
      {
        heading: "Markets, tip jars, and invoices",
        paragraphs: [
          "A tent card at a stall, a sticker on a tip jar, a code on an invoice. Put it where the person is already deciding to pay, and write a line next to it so they know which app they're opening.",
        ],
      },
      {
        heading: "Print it yourself",
        paragraphs: [
          "Print the code from the file you downloaded. Before a busy day, look at the sign and make sure nobody has stuck a different sticker over it. The code is only as trustworthy as the paper it's on.",
          "MakeQR Pro just turns your link into an image. The payment happens in Venmo, Cash App, or PayPal. We aren't affiliated with those companies, and we never see the money.",
        ],
      },
    ],
    honesty:
      "These are static QR codes. The payment link is baked into the code, so it doesn't expire and there's no scan limit. If your username or link changes, you'll need a new code.",
    faqs: [
      {
        question: "Does MakeQR handle the money?",
        answer:
          "No. MakeQR only encodes the link you paste. The payment happens in Venmo, Cash App, PayPal, or whichever app that link opens. MakeQR isn't affiliated with those companies.",
      },
      {
        question: "Will it work if I change my username?",
        answer:
          "No. The old link is baked into the code. A new username or a new payment link means a new code.",
      },
      {
        question: "Can I add my logo?",
        answer:
          "Yes, with Pro. The URL code, the colors, and the PNG download are free.",
      },
    ],
  },
  {
    slug: "real-estate-sign",
    tab: "url",
    pro: false,
    absoluteTitle: false,
    title: "Real Estate Sign QR Code Generator, Free",
    description:
      "Put a QR code on your yard sign or flyer that opens the listing page. Paste the link, download, print. Free PNG; Pro adds SVG for sharp large-format signs.",
    h1: "QR code for real estate signs",
    intro: "Paste the listing link, download, and print it for the yard sign or the flyer.",
    cardTitle: "Real estate sign",
    card: "A yard sign that opens the listing. Free PNG.",
    sections: [
      {
        heading: "Use a link that will still be there",
        paragraphs: [
          "Point the code at a page you control: your own property page, or a short address you can change later. Portal listing links often change, and a lot of them disappear when the home sells.",
          "The code keeps opening the address you pasted. It will not follow the listing somewhere new. If the page is yours, you can mark it under contract or sold and leave the rider up until the sign comes down.",
        ],
      },
      {
        heading: "Size for a read from the curb",
        paragraphs: [
          "Someone on the sidewalk is not holding a phone an inch from the sign. A yard-sign rider needs a code several inches wide. The distance rule and the contrast notes are on the {best-practices} page.",
          "Print one sample and scan it from the curb, in daylight, before you order a dozen riders.",
          "A flyer in the box can use a smaller code than the rider, because the person is holding the paper. Don't blow a small PNG up until it fills the rider. That's the job of the SVG download, and SVG is Pro. Write the street address next to the code so a scan matches the house in front of them.",
        ],
      },
      {
        heading: "Contrast outdoors",
        paragraphs: [
          "Glare and a photo behind the code are the usual failures. Use a dark code on a light background, with a blank margin, and no picture showing through the squares.",
          "A shiny sleeve can reflect the afternoon sun. Check the sign at the time of day you actually get showings.",
        ],
      },
      {
        heading: "PNG, SVG, and a list of listings",
        paragraphs: [
          "PNG is free and fine for a flyer. For a large sign, SVG is the Pro file. A print shop can scale it and the edges stay crisp. Pro PNG also goes up to 1024px. Free PNG stops at 512px.",
          "If you have several listing links, Pro can make a ZIP from a pasted list, one URL per line. There isn't a spreadsheet upload. Each code is still one static link.",
        ],
      },
    ],
    honesty:
      "These are static QR codes. The listing link is baked into the code, so it doesn't expire and there's no scan limit. If the sign needs to open a different page, you'll need a new code.",
    faqs: [
      {
        question: "What happens when the house sells?",
        answer:
          "The code keeps opening the same link. Point it at a page you can update, and you can change that page to sold without reprinting. A portal link can die when the listing comes down, and the code will still try to open it.",
      },
      {
        question: "How big should it be?",
        answer:
          "Big enough to scan from where a person will actually stand. A rider read from the curb needs a code several inches wide. Use the size notes on the best practices page, then test a printout from the curb.",
      },
      {
        question: "PNG or SVG?",
        answer:
          "PNG is free and works for a flyer. For a large yard sign, SVG (Pro) stays sharp when the print shop scales it. Pro PNG also goes up to 1024px.",
      },
    ],
  },
  {
    slug: "event",
    tab: "url",
    pro: false,
    absoluteTitle: true,
    title: "Event QR Code Generator for Tickets, RSVPs and Flyers",
    description:
      "Link your flyer or poster to the RSVP form, ticket page or event details with a QR code. Paste the link, download a PNG. Free, no signup, no watermark.",
    h1: "QR code for your event",
    intro: "Point a flyer or a poster at the RSVP, the tickets, or just the time and place.",
    cardTitle: "Event",
    card: "RSVP, tickets, or the time and place. Free.",
    sections: [
      {
        heading: "What to put in the code",
        paragraphs: [
          "Paste the link that does the job: the RSVP form, the ticket page, the schedule, or a shared photo album for a wedding or a party. The URL tab is free. Download a PNG. No signup, no watermark.",
          "MakeQR doesn't make add-to-calendar codes. A link to your event page is the stand-in. Guests open the page and use whatever the page offers.",
        ],
      },
      {
        heading: "A text code when you don't have a page",
        paragraphs: [
          "The Text tab is free too. You can put the time and the place in the code and skip the link. Nothing on the web can move out from under it.",
          "The tradeoff is the same as any static code. If the date changes, that text is still the old date, and you print again. A link to a page you can update is the flexible choice. A text code is the simple one.",
        ],
      },
      {
        heading: "Poster and table card",
        paragraphs: [
          "On a poster, put the code where a person can stand still and scan it, around chest height, not down by the floor. On a reception table, a tent card with a code about an inch and a half wide is enough.",
          "Leave a blank margin. If the invite color is a light pastel, don't use that same pastel for the squares. The {best-practices} page has the contrast details.",
        ],
      },
      {
        heading: "Test before the invitations go out",
        paragraphs: [
          "Print one at the real size. Scan it on two phones, in the light you'll actually have. If the code opens a form, fill the form in once yourself. Fix the form before you mail the cards, not after.",
          "If the flyer lists a start time, the page should list the same time. A code that opens a page with a different hour is how a room fills up early. Read both before you print.",
          "For a wedding or a party, a photo-album link works as a second code, separate from the RSVP, so guests aren't hunting for the schedule inside a camera roll. Two codes, two labels. Both can be free URL codes.",
        ],
      },
    ],
    honesty:
      "These are static QR codes. The link or the text is baked into the code, so it doesn't expire and there's no scan limit. If the date or the link changes, you'll need a new code. A code that opens a page you can update can stay on the flyer.",
    faqs: [
      {
        question: "Can I change the date after printing?",
        answer:
          "Not on the code. It's static. If the date is written into the code as text, print a new one. If the code opens an event page, update that page and the printed code can stay.",
      },
      {
        question: "Does it expire after the event?",
        answer:
          "No. The code keeps working. It doesn't shut off when the event is over. If it opens a page, you can update that page later. A text code keeps the time and place you typed.",
      },
      {
        question: "Can I match the colors to the invite?",
        answer:
          "Yes. Custom colors are free. Keep the code dark and the background light so it still scans, and test a sample on two phones before you print the invitations.",
      },
    ],
  },
];

export function getUseCase(slug: string) {
  return USE_CASES.find((useCase) => useCase.slug === slug);
}
