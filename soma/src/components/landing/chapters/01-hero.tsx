import type { EntryCategory } from "@/components/site/discovery-copy";
import { HeroArch } from "../hero/hero-arch";
import { HeroBookingSlot } from "../hero/hero-booking-slot";
import { PlaceSwitch } from "../hero/place-switch";
import { titleId } from "../nav/chapters";
import { lpLinkClass, lpLinkText } from "../primitives/chapter-foot";
import { TaglineLines } from "../primitives/tagline";
import { Chapter, LpContainer } from "./chapter";

/**
 * 01 · Bei dir (spec § 4.1). One <h1>: the tagline (Newsreader Display Italic, lang="en", the page's one italic and
 * this view's serif headline) and the German line in the sans. DOM order is the same at every width (place switch →
 * h1 → figure → lead → link → sill), the grid places the figure in its own column from 1024. Nothing is hidden at
 * load: the text, the entry and the trust row paint final from the first frame.
 */
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
  return (
    <Chapter n={1} padded={false} className="lp-hero">
      <LpContainer>
        <div data-scene="hero-place" className="lp-hero-grid">
          <div className="lp-hero-head">
            <PlaceSwitch />
            <h1 id={titleId("bei-dir")} tabIndex={-1} className="outline-none">
              <span className="lp-hero-tagline block type-display-xl type-accent text-ink">
                <TaglineLines />
              </span>{" "}
              <span className="mt-5 block max-w-[30ch] type-heading-l text-ink lg:mt-7">Beauty &amp; Wellness bei dir zu Hause, im Hotel oder im Büro.</span>
            </h1>
          </div>
          <HeroArch className="lp-hero-figure" />
          <div className="lp-hero-rest">
            <p className="lp-hero-lead max-w-[40ch] type-lead text-ink-muted">{lead}</p>
            <a href="#so-funktionierts" className={`${lpLinkClass} -my-1 self-start`}>
              <span className={lpLinkText}>So funktioniert’s</span>
            </a>
            <HeroBookingSlot catalog={catalog} postalExample={postalExample} postalExamples={postalExamples} trustItems={trustItems} />
          </div>
        </div>
      </LpContainer>
    </Chapter>
  );
}
