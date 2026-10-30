import type { Metadata, Viewport } from "next";
import { Newsreader, Instrument_Sans, DM_Mono } from "next/font/google";
import { BRAND_NAME, BRAND_PROMISE, BRAND_TAGLINE, DEMO_MODE, SITE_URL } from "@/lib/brand";
import { images, resolveImage } from "@/lib/images";
import { ToastProvider } from "@/components/ui/toast";
import { DemoRibbon } from "@/components/ui/demo-ribbon";
import { ServiceWorker } from "@/components/ui/service-worker";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-display-src",
});

const sans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-sans-src",
});

const mono = DM_Mono({
  subsets: ["latin", "latin-ext"],
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
  themeColor: "#F5F2EC",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="flex min-h-dvh flex-col bg-surface text-ink">
        <ToastProvider>
          {DEMO_MODE ? <DemoRibbon /> : null}
          {children}
        </ToastProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
