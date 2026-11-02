import type { Metadata, Viewport } from "next";
import { DM_Mono } from "next/font/google";
import localFont from "next/font/local";
import { BRAND_DESCRIPTOR, BRAND_NAME, BRAND_PROMISE, BRAND_TAGLINE, DEMO_MODE, OG_IMAGE, SITE_URL } from "@/lib/brand";
import { ToastProvider } from "@/components/ui/toast";
import { DemoRibbon } from "@/components/ui/demo-ribbon";
import { MotionRoot } from "@/components/ui/motion";
import { ServiceWorker } from "@/components/ui/service-worker";
import "./globals.css";

/*
 * Type system v3 (brand/BRAND_GUIDELINES.md § 4). Self-hosted, SIL OFL 1.1 (src/styles/fonts/OFL-*.txt).
 * Budget on /: 2 preloaded files, 79 KB (102 KB once an <em> pulls the italic); limit 2 files / 150 KB.
 * - Instrument Sans (variable: wdth 75–100, wght 400–700) works: UI, numbers, forms. Latin is preloaded (57 KB);
 *   latin-ext (19 KB) is a second face of the same family with its own unicode-range, so it downloads only when a
 *   glyph needs it (names like "Doğan").
 * - Newsreader Display roman (opsz 72, 400, 22 KB) speaks: display headlines, h1/h2. Preloaded on every route but `/`
 *   (DisplayFontScope in the other top-level layouts).
 * - Newsreader Display italic (same cut, 23 KB) is the accent: <em> in serif headlines, the tagline, quotes.
 *   Not preloaded (A5-9): most routes show no accent above the fold; the metric-matched Times fallback holds the
 *   space until it swaps in (no layout shift).
 * - DM Mono is for booking references in /pro and /admin only, never preloaded.
 */
// next/font names a local family after its constant ("somaSans"); the latin-ext face declares that same family.
// Loader options must be literals, hence the inlined ranges (the Google Fonts latin / latin-ext split).
const somaSans = localFont({
  src: "../styles/fonts/instrument-sans-variable-latin.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-sans-src",
  declarations: [
    { prop: "font-stretch", value: "75% 100%" },
    {
      prop: "unicode-range",
      value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

const somaSansExt = localFont({
  src: "../styles/fonts/instrument-sans-variable-latin-ext.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-sans-ext-src",
  declarations: [
    { prop: "font-family", value: "somaSans" },
    { prop: "font-stretch", value: "75% 100%" },
    {
      prop: "unicode-range",
      value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

// Not preloaded here: `/` does not need it above the fold (landing spec § 10.5). The other top-level layouts preload
// it through <DisplayFontScope> (src/components/brand/display-font.tsx).
const somaDisplay = localFont({
  src: "../styles/fonts/newsreader-display-roman-latin.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  preload: false,
  variable: "--font-display-src",
  adjustFontFallback: "Times New Roman",
});

const somaAccent = localFont({
  src: "../styles/fonts/newsreader-display-italic.woff2",
  style: "italic",
  weight: "400",
  display: "swap",
  preload: false,
  variable: "--font-accent-src",
  adjustFontFallback: "Times New Roman",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
  variable: "--font-mono-src",
});

/** iOS startup images per device (CSS px, pixel ratio), from brand/assets/splash/ios → public/splash. */
const STARTUP_IMAGES = (
  [
    [750, 1334, 375, 667, 2],
    [828, 1792, 414, 896, 2],
    [1125, 2436, 375, 812, 3],
    [1170, 2532, 390, 844, 3],
    [1179, 2556, 393, 852, 3],
    [1284, 2778, 428, 926, 3],
    [1290, 2796, 430, 932, 3],
    [1640, 2360, 820, 1180, 2],
    [1668, 2388, 834, 1194, 2],
    [2048, 2732, 1024, 1366, 2],
  ] as const
).map(([w, h, dw, dh, dpr]) => ({
  url: `/splash/apple-splash-${w}x${h}.png`,
  media: `(device-width: ${dw}px) and (device-height: ${dh}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
}));

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} – ${BRAND_DESCRIPTOR}`,
    template: `%s · ${BRAND_NAME}`,
  },
  description: BRAND_PROMISE,
  applicationName: BRAND_NAME,
  appleWebApp: {
    capable: true,
    title: BRAND_NAME,
    statusBarStyle: "default",
    // iOS PWA launch screens (brand/assets/splash/SPLASH.md): Bone ground, the stacked mark in Oxblood. Portrait only.
    startupImage: STARTUP_IMAGES,
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} – ${BRAND_TAGLINE}`,
    description: BRAND_PROMISE,
    images: [OG_IMAGE],
  },
  robots: DEMO_MODE ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#F3EFE8",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${somaSans.variable} ${somaSansExt.variable} ${somaDisplay.variable} ${somaAccent.variable} ${mono.variable}`}>
      <body className="flex min-h-dvh flex-col bg-surface text-ink">
        <ToastProvider>
          {DEMO_MODE ? <DemoRibbon /> : null}
          {children}
        </ToastProvider>
        <MotionRoot />
        <ServiceWorker />
      </body>
    </html>
  );
}
