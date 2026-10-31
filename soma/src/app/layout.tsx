import type { Metadata, Viewport } from "next";
import { Inter, DM_Mono } from "next/font/google";
import localFont from "next/font/local";
import { BRAND_NAME, BRAND_PROMISE, BRAND_TAGLINE, DEMO_MODE, SITE_URL } from "@/lib/brand";
import { images, resolveImage } from "@/lib/images";
import { ToastProvider } from "@/components/ui/toast";
import { DemoRibbon } from "@/components/ui/demo-ribbon";
import { MotionRoot } from "@/components/ui/motion";
import { ServiceWorker } from "@/components/ui/service-worker";
import "./globals.css";

/*
 * Type system v2 (design-guideline §5). Font budget on "/": 2 preloaded files,
 * ~96 KB in total.
 * - Inter (variable: wght + opsz 14–32) is the UI and display face. Its optical
 *   size axis follows font-size, so headlines get the tighter display cut.
 *   Latin is preloaded (~73 KB); latin-ext downloads only for names like "Doğan".
 * - Newsreader Italic is the emotional accent (<em> in display headlines, the
 *   tagline, quotes). It is self-hosted as the static display cut (opsz 72,
 *   wght 400, latin, 23 KB, SIL OFL: src/styles/fonts/OFL-Newsreader.txt).
 * - DM Mono is for booking references in /pro and /admin only, never preloaded.
 */
const sans = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-sans-src",
});

const accent = localFont({
  src: "../styles/fonts/newsreader-display-italic.woff2",
  style: "italic",
  weight: "400",
  display: "swap",
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

const ogImage = resolveImage(images.og);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} – Beauty & Wellness bei Ihnen zu Hause, im Hotel oder Büro`,
    template: `%s · ${BRAND_NAME}`,
  },
  description: BRAND_PROMISE,
  applicationName: BRAND_NAME,
  appleWebApp: { capable: true, title: BRAND_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} – ${BRAND_TAGLINE}`,
    description: BRAND_PROMISE,
    images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
  },
  robots: DEMO_MODE ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#FAF9F7",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${sans.variable} ${accent.variable} ${mono.variable}`}>
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
