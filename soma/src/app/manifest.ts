import type { MetadataRoute } from "next";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND_NAME} – ${BRAND_TAGLINE}`,
    short_name: BRAND_NAME,
    description: "Beauty- und Wellness-Profis, die zu Ihnen kommen – zu Hause, im Hotel oder im Büro.",
    lang: "de-DE",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF9F7",
    theme_color: "#FAF9F7",
    categories: ["lifestyle", "health", "beauty"],
    icons: [
      { src: "/brand/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/app-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Termin buchen", url: "/suche" },
      { name: "Meine Termine", url: "/konto/termine" },
      { name: "Profi-Bereich", url: "/pro" },
    ],
  };
}
