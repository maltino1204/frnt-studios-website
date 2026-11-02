import { SiteFooter } from "@/components/site/site-footer";
import { RouteTransition } from "@/components/ui/motion";
import { ChapterLinks } from "@/components/landing/nav/chapter-links";
import { LandingDock } from "@/components/landing/nav/landing-dock";
import { LandingHeader } from "@/components/landing/nav/landing-header";
import { LazySurfaces } from "@/components/landing/nav/lazy-surfaces";
import { MotionLoader } from "@/components/landing/motion/loader";
import { TIER_BOOT_SCRIPT } from "@/components/landing/motion/tier";
import { SkipLinks } from "@/components/landing/nav/skip-links";
import { StaticChapterList } from "@/components/landing/nav/static-chapter-list";
import localFont from "next/font/local";
import { Activity, type CSSProperties } from "react";
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
 * directly after the header) · main#inhalt · SiteFooter (with the landing's AI-imagery note in its base row). The
 * chapter overlay, the booking bar and sheet mount once, on idle or on the first intent (audit-1 PT-1). Like the (site) layout it never reads cookies or headers, so `/` stays static (ISR); the account link
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
      {/* The dock hides while any part of the footer is in view (spec § 5.6; INTEGRATION § 3.7: no legal links covered). */}
      {/* Hydrates after the page's shell, like chapters 02–10 (page.tsx `Later`). */}
      <Activity mode="visible">
        <div data-dock-hide="0" className="lp-footer-wrap">
          {/* Without JS, „Kapitel“ and „Menü“ link here (the overlay never mounts). */}
          <StaticChapterList />
          <SiteFooter tagline={false} note="Bilder: KI-generierte Entwicklungsassets" />
        </div>
      </Activity>
      <ChapterLinks />
      {/* The chapter overlay, the booking bar and the booking sheet load on idle or on first intent (nav/surfaces.ts). */}
      <LazySurfaces />
      <MotionLoader />
      {/*
        The motion tier on <html> before the first style pass (motion/tier.ts); the loader takes over after hydration.
        Last in the markup on purpose: an inline script waits for the stylesheets, so placed earlier it would split the
        first render (a partial first paint, then the rest of the initial layout as a long task after it).
      */}
      <script dangerouslySetInnerHTML={{ __html: TIER_BOOT_SCRIPT }} />
    </div>
  );
}
