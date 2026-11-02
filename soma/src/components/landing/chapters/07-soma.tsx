import { buttonClasses } from "@/components/ui/button";
import { IntentLink } from "@/components/ui/intent-link";
import { BRAND_SIGNATURE } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { SearchLink } from "../booking/booking-link";
import { titleId } from "../nav/chapters";
import { TaglineLines } from "../primitives/tagline";
import { ClosingLockup } from "../seal/closing-lockup";
import { Chapter } from "./chapter";

/**
 * 07 · SOMA (spec § 4.10): the final brand moment on Oxblood. The seal scene (`data-scene="seal"`): in the full tier
 * an Oxblood arch mask (`data-arch-mask="seal"`) opens from the bottom centre to full bleed; then the mark draws on
 * and the lockup reveals (motion layer). Static (and lite / none): the band is Oxblood with a hard edge and the final
 * frame. The <h2> is the visible lockup (role="img", "SOMA") followed by the tagline: "SOMA. Your body. Your place."
 */
export function SomaChapter() {
  return (
    <Chapter n={7} padded={false} className="lp-seal">
      <div data-scene="seal" className="lp-seal-scene">
        <div aria-hidden data-arch="mask" data-arch-mask="seal" className="lp-seal-mask" />
        <div className="lp-seal-content">
          <h2 id={titleId("soma")} tabIndex={-1} className="flex flex-col items-center text-center text-ink outline-none">
            <ClosingLockup className="w-[183px] md:w-[240px] lg:w-[285px]" />
            <span aria-hidden data-seal-part="rule" className="mt-6 block h-px w-10 bg-current" />
            <span data-seal-part="tagline" data-reveal="clause" className="mt-6 block type-display-l type-accent">
              <TaglineLines reveal />
            </span>
          </h2>
          <p data-seal-part="line" className="mt-6 text-center type-lead text-ink-muted">
            {BRAND_SIGNATURE}
          </p>
          <div data-dock-hide="0.3" className="mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:justify-center">
            <SearchLink className={buttonClasses({ variant: "accent", size: "l", className: "max-sm:w-full" })} data-cta="final-search">
              Freie Termine finden
            </SearchLink>
            {/* Prefetched on intent only (RT-9), like the search link. */}
            <IntentLink href={routes.pro.onboarding()} className={buttonClasses({ variant: "secondary", size: "l", className: "max-sm:w-full" })} data-cta="pro-werden-07">
              Profi werden
            </IntentLink>
          </div>
        </div>
      </div>
    </Chapter>
  );
}
