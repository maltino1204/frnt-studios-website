import type { NextConfig } from "next";

/**
 * SOMA — Next.js configuration.
 *
 * Cache Components are intentionally disabled: nearly every SOMA view is
 * request-time (session, availability, bookings). The previous dynamic-by-
 * default model keeps those views predictable; public marketing/SEO pages opt
 * into static rendering + revalidation explicitly. See docs/architecture.md.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" },
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
