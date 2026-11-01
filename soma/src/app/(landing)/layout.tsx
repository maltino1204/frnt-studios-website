import { SiteFooter } from "@/components/site/site-footer";
import { RouteTransition } from "@/components/ui/motion";
import { BookingBar } from "@/components/landing/booking/booking-bar";
import { BookingSheet } from "@/components/landing/booking/booking-sheet";
import { ChapterLinks } from "@/components/landing/nav/chapter-links";
import { ChapterOverlay } from "@/components/landing/nav/chapter-overlay";
import { FooterNote } from "@/components/landing/nav/footer-note";
import { LandingDock } from "@/components/landing/nav/landing-dock";
import { LandingHeader } from "@/components/landing/nav/landing-header";
import { SkipLinks } from "@/components/landing/nav/skip-links";
import localFont from "next/font/local";
import type { CSSProperties } from "react";
import "./landing.css";

/*
 * Fonts on / (spec § 10.5): the hero's first line is the italic tagline, so the landing preloads Newsreader Display
 * Italic next to the root's Instrument Sans and Newsreader roman (3 files, 102 KB, within the 150 KB budget) without
 * touching the root layout, which keeps the italic on demand for every other route. The landing's accent family is
 * this preloaded face (same file, metric-matched Times fallback, so no layout shift when it swaps in).
 */
const accent = localFont({
  src: "../../styles/fonts/newsreader-display-italic.woff2",
  style: "italic",
  weight: "400",
  display: "swap",
  preload: true,
  adjustFontFallback: "Times New Roman",
});
const accentScope = { "--font-accent": `${accent.style.fontFamily}, Georgia, "Times New Roman", serif` } as CSSProperties;

/**
 * Landing layout (docs/landing/LANDING_DESIGN_SPEC.md D8, § 11.1): skip links · LandingHeader · LandingDock (< 1024,
 * directly after the header) · main#inhalt · SiteFooter. The chapter overlay, the booking bar and sheet are mounted
 * once here. Like the (site) layout it never reads cookies or headers, so `/` stays static (ISR); the account link
 * hydrates on the client.
 *
 * Motion integration point: the motion layer's <MotionLoader/> (src/components/landing/motion/loader.tsx) mounts
 * here, after the page; it writes html[data-motion], the runtime attributes of § 11.3 and imports landing-motion.css.
 */
export default function LandingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="contents" style={accentScope}>
      <SkipLinks />
      <LandingHeader />
      <LandingDock />
      <RouteTransition as="main" id="inhalt" tabIndex={-1} className="lp flex-1 focus:outline-none">
        {children}
      </RouteTransition>
      <SiteFooter />
      <FooterNote />
      <ChapterOverlay />
      <ChapterLinks />
      <BookingBar />
      <BookingSheet />
    </div>
  );
}
