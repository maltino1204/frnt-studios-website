import type { MetadataRoute } from "next";
import { DEMO_MODE, SITE_URL } from "@/lib/brand";

/**
 * Private areas are disallowed. Note the trailing slashes / `$`: robots rules are
 * prefix matches, so a bare "/pro" would also block "/profis/…".
 * DEMO_MODE (fictional data, test payments): nothing is crawled.
 */
export default function robots(): MetadataRoute.Robots {
  if (DEMO_MODE) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/konto", "/pro$", "/pro/", "/admin", "/buchen", "/buchung/", "/api/", "/anmelden", "/registrieren", "/passwort-vergessen", "/suche"],
      },
    ],
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    host: SITE_URL,
  };
}
