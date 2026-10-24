import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan a QR Code — Free QR Scanner",
  description:
    "Scan any QR code with your phone camera. Free, private, and instant — nothing is uploaded, scanning happens on your device. See links as text with safety warnings before you open them.",
  alternates: { canonical: "https://makeqr.pro/scan" },
  openGraph: {
    title: "Scan a QR Code — MakeQR.pro",
    description:
      "Scan QR codes with your camera. Private, on-device, with safety warnings for suspicious links.",
    url: "https://makeqr.pro/scan",
  },
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
