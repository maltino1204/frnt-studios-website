import type { MetadataRoute } from "next";
import { BRAND_DESCRIPTOR, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND_NAME} – ${BRAND_TAGLINE}`,
    short_name: BRAND_NAME,
    description: `${BRAND_DESCRIPTOR} Geprüfte Profis kommen zu dir – nach Hause, ins Hotel oder ins Büro.`,
    lang: "de-DE",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Bone (brand § 3): the splash and the browser chrome match the page; the icon carries the Oxblood moment.
    background_color: "#F3EFE8",
    theme_color: "#F3EFE8",
    // "health" removed (BRAND_STRATEGY § 11.3: no medical association).
    categories: ["lifestyle", "beauty"],
    // brand/assets/icons/pwa: the mark (the S im O) in Bone on an Oxblood tile; maskable versions keep the mark inside the
    // 80 % safe circle; the monochrome icon serves Android themed icons.
    icons: [
      { src: "/brand/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/app-icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/brand/app-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/brand/app-icon-monochrome-512.png", sizes: "512x512", type: "image/png", purpose: "monochrome" },
      { src: "/brand/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Termin finden", url: "/suche" },
      { name: "Meine Termine", url: "/konto/termine" },
      { name: "SOMA Pro", url: "/pro" },
    ],
  };
}
