import { Activity } from "react";
import type { EntryCategory } from "@/components/site/discovery-copy";
import { HeroArch } from "../hero/hero-arch";
import { HeroBookingSlot } from "../hero/hero-booking-slot";
import { PlaceSwitch } from "../hero/place-switch";
import { StaticHeroFigure } from "../hero/static-hero-figure";
import { buttonClasses } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { IslandBoundary } from "../primitives/island-boundary";
import { DEMO_MODE } from "@/lib/brand";
import { heroSizes, PLACES, type PlaceId } from "../hero/places";
import { titleId } from "../nav/chapters";
import { lpLinkClass, lpLinkText } from "../primitives/chapter-foot";
import { landingImgAttrs } from "../primitives/landing-image";
import type { LandingImgAttrs } from "../primitives/landing-img";
import { TaglineLines } from "../primitives/tagline";
import { Chapter, LpContainer } from "./chapter";

/**
 * 01 · Bei dir (spec § 4.1). One <h1>: the tagline (Newsreader Display Italic, lang="en", the page's one italic and
 * this view's serif headline) and the German line in the sans. DOM order is the same at every width (place switch →
 * h1 → figure → lead → link → sill), the grid places the figure in its own column from 1024. Nothing is hidden at
 * load: the text, the entry and the trust row paint final from the first frame. The place photos' attributes are built
 * here, on the server (`getImageProps()`; Zu Hause is the preloaded LCP image), and handed to the arch island.
 */
/** The booking entry's stand-in if its island fails: the search, one tap away (audit-4 R4-1). */
function BookingFallback() {
  return (
    <div className="lp-sill">
      <div className="lp-sill-box">
        <a id="termin" href={routes.search()} className={buttonClasses({ variant: "accent", size: "l" })}>
          Freie Termine finden
        </a>
      </div>
    </div>
  );
}

export function HeroChapter({
  catalog,
  postalExample,
  postalExamples,
  lead,
  trustItems,
}: {
  catalog: EntryCategory[];
  postalExample: string;
  postalExamples: Record<string, string>;
  lead: string;
  trustItems: string[];
}) {
  const sizes = heroSizes(DEMO_MODE);
  const images = Object.fromEntries(
    PLACES.map((p) => [p.id, landingImgAttrs(p.src, { sizes, focal: p.focal, lcp: p.id === "zuhause" })]),
  ) as Record<PlaceId, LandingImgAttrs>;
  return (
    <Chapter n={1} padded={false} className={DEMO_MODE ? "lp-hero lp-hero-ribbon" : "lp-hero"}>
      <LpContainer>
        <div data-scene="hero-place" className="lp-hero-grid">
          <div className="lp-hero-head">
            <IslandBoundary name="place switch">
              <PlaceSwitch />
            </IslandBoundary>
            <h1 id={titleId("bei-dir")} tabIndex={-1} className="outline-none">
              <span className="lp-hero-tagline block type-display-xl type-accent text-ink">
                <TaglineLines />
              </span>{" "}
              <span className="mt-5 block max-w-[30ch] type-heading-l text-ink lg:mt-7">Beauty &amp; Wellness bei dir zu Hause, im Hotel oder im Büro.</span>
            </h1>
          </div>
          <IslandBoundary name="hero arch" fallback={<StaticHeroFigure image={images.zuhause} className="lp-hero-figure" />}>
            <HeroArch images={images} className="lp-hero-figure" />
          </IslandBoundary>
          <div className="lp-hero-rest">
            <p className="lp-hero-lead max-w-[40ch] type-lead text-ink-muted">{lead}</p>
            <a href="#so-funktionierts" className={`lp-hero-how ${lpLinkClass} -my-1 self-start`}>
              <span className={lpLinkText}>So funktioniert’s</span>
            </a>
            {/* Hydrates right after the shell, in its own time-sliced pass (like chapters 02–07); a tap on it before
                then hydrates it first and replays the event. */}
            <Activity mode="visible">
              <IslandBoundary name="hero booking entry" fallback={<BookingFallback />}>
                <HeroBookingSlot catalog={catalog} postalExample={postalExample} postalExamples={postalExamples} trustItems={trustItems} />
              </IslandBoundary>
            </Activity>
            {/* 768–1023 shows the entry before the lead (landing.css § 5), so the link is rendered a second time after
                the entry for that range only; `display: none` keeps exactly one in the focus order and the a11y tree,
                and the focus order follows the visual order at every width. */}
            <a href="#so-funktionierts" className={`lp-hero-how-after ${lpLinkClass} -my-1 self-start`}>
              <span className={lpLinkText}>So funktioniert’s</span>
            </a>
          </div>
        </div>
      </LpContainer>
    </Chapter>
  );
}
