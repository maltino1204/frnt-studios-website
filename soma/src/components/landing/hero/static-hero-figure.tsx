import { LandingArch } from "../primitives/landing-arch";
import { LandingImg, type LandingImgAttrs } from "../primitives/landing-img";
import { Ortszeile } from "../primitives/ortszeile";
import { HERO_FIGURE_ID, PLACES } from "./places";

/**
 * The hero figure without the place switch's layers: „Zu Hause“ (the LCP photo) and its Ortszeile, the same markup
 * the arch island renders first. The island boundary's fallback (audit-4 R4-1).
 */
export function StaticHeroFigure({ image, className }: { image: LandingImgAttrs; className?: string }) {
  const home = PLACES[0];
  return (
    <figure id={HERO_FIGURE_ID} className={className}>
      <div className="lp-hero-arch-wrap">
        <LandingArch aspect="fill" tone="massage" className="lp-hero-arch">
          <div data-place-layer="" data-state="current" className="absolute inset-0">
            <LandingImg img={image} alt={home.alt} data-lcp="" className="object-cover" />
          </div>
        </LandingArch>
      </div>
      <figcaption className="mt-3">
        <Ortszeile text={home.place} />
      </figcaption>
    </figure>
  );
}
