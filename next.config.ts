import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * AdSense and Stripe Checkout/Portal need these hosts.
 * unsafe-eval is limited to `next dev` (React refresh). Production does not send it.
 * X-Frame-Options ALLOWALL is not a real directive; SAMEORIGIN matches frame-ancestors.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "https://pagead2.googlesyndication.com",
    "https://partner.googleadservices.com",
    "https://adservice.google.com",
    "https://www.googletagservices.com",
    "https://tpc.googlesyndication.com",
    "https://www.google.com",
    "https://www.gstatic.com",
    "https://js.stripe.com",
    "https://*.stripe.com",
    "https://*.stripe.network",
  ]
    .filter(Boolean)
    .join(" "),
  [
    "frame-src",
    "https://googleads.g.doubleclick.net",
    "https://tpc.googlesyndication.com",
    "https://pagead2.googlesyndication.com",
    "https://www.google.com",
    "https://fundingchoicesmessages.google.com",
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    "https://checkout.stripe.com",
    "https://billing.stripe.com",
    "https://*.stripe.com",
    "https://*.stripe.network",
  ].join(" "),
  "img-src 'self' data: blob: https:",
  // AdSense beacons use many Google hosts. Keep https: so a tighter list does not drop ads.
  "connect-src 'self' https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
].join("; ");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.makeqr.pro" }],
        destination: "https://makeqr.pro/:path*",
        permanent: true,
      },
      {
        source: "/qr-code-best-practices",
        destination: "/best-practices",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Legal Review 2026-10-24 §3b.1: never leak ?session_id= or a restore token in Referer.
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
      {
        source: "/ads.txt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
          { key: "Content-Type", value: "text/plain" },
        ],
      },
    ];
  },
};

export default nextConfig;
