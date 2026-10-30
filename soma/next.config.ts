import type { NextConfig } from "next";

/**
 * SOMA — Next.js configuration.
 *
 * Cache Components are intentionally disabled: nearly every SOMA view is
 * request-time (session, availability, bookings). The previous dynamic-by-
 * default model keeps those views predictable; public marketing/SEO pages opt
 * into static rendering + revalidation explicitly. See docs/architecture.md.
 */
const isProd = process.env.NODE_ENV === "production";
const IMAGE_CDN = "https://d8j0ntlcm91z4.cloudfront.net";

/**
 * Content-Security-Policy (QA R5). Marketing/SEO pages are statically rendered,
 * so per-request nonces are not possible; inline scripts (Next.js hydration
 * payloads) are therefore allowed via 'unsafe-inline' while every external
 * script origin except Stripe is blocked. Applied in production only (the dev
 * server needs 'unsafe-eval' for Fast Refresh). See docs/architecture.md §3.3.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${IMAGE_CDN} https://*.stripe.com`,
  "font-src 'self'",
  "connect-src 'self' https://api.stripe.com https://*.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" },
  ...(isProd
    ? [
        { key: "Content-Security-Policy", value: csp },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["postgres"],
  experimental: {
    // Verification documents may be up to 10 MB (src/server/services/media.ts).
    serverActions: { bodySizeLimit: "11mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1280, 1600, 2048],
    // Art-directed photo set until `npm run images:fetch` stores it in /public.
    remotePatterns: [{ protocol: "https", hostname: "d8j0ntlcm91z4.cloudfront.net", pathname: "/user_3BLgL9zIBBkH931se5bWbkXZwpv/**" }],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
