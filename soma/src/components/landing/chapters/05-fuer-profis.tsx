import { ArrowRight } from "lucide-react";
import { buttonClasses, ButtonLink } from "@/components/ui/button";
import { IntentLink } from "@/components/ui/intent-link";
import { Icon } from "@/components/ui/icon";
import { routes } from "@/lib/routes";
import { titleId } from "../nav/chapters";
import { Clauses } from "../primitives/clauses";
import { Eyebrow } from "../primitives/eyebrow";
import { IslandBoundary } from "../primitives/island-boundary";
import { LandingArch } from "../primitives/landing-arch";
import { LandingImage } from "../primitives/landing-image";
import { Ortszeile } from "../primitives/ortszeile";
import { Chapter, LpContainer } from "./chapter";

/** Daytime, as the v3 „Tageslicht“ photos are (PHOTOGRAPHY.md § 10: the time matches the light). */
const PLACE = "Treppenhaus, 2. OG · Berlin-Neukölln · 11:40";

/**
 * 05 · Für Profis (spec § 4.8): the second audience, compact since v2 (one headline, one line, the two CTAs; the
 * benefits, the commission strip and the payment line live on `/fuer-profis`, one tap away through „Konditionen
 * ansehen“). ≥ 1024 the one full-bleed photo band (no arch: the Profi is on the way), the text in the night scope on
 * the image's calm left third (measured contrast), the band declaring `data-header-theme="dark"`; the band is sized by
 * its content over a floor, and the CTAs and the Ortszeile stay in the flow under the text (audit-1 I-2: nothing can
 * collide at 1024–1180). < 1024 the text on Bone, then the app-pro photo in an arch with its Ortszeile (text first, so
 * a jump to 05 lands on the heading, audit-4 N4-4). No income claims.
 */
export function FuerProfisChapter() {
  return (
    <Chapter n={5} padded={false} cv={{ desktop: 680, tablet: "calc(454px + 105.9vw)", mobile: "calc(650px + 107vw)" }} className="lp-pros">
      <div data-scene="band" className="lp-band">
        <div className="lp-band-media" data-header-theme="dark">
          <LandingImage
            src="/images/editorial/provider-cta-v2.jpg"
            alt="Ein Profi mit Tasche auf der Holztreppe eines hellen Berliner Altbaus, am Vormittag."
            sizes="100vw"
            focal="68% 30%"
            settle
          />
        </div>
        <LpContainer className="lp-band-content">
          <div className="lp-band-text">
            <Eyebrow nn="05">SOMA für Profis</Eyebrow>
            <Clauses
              as="h2"
              id={titleId("fuer-profis")}
              tabIndex={-1}
              className="lp-band-title mt-4 type-display-l text-ink outline-none"
              parts={["Dein Können.", "Deine Preise.", "Deine Zeiten."]}
            />
            <p className="lp-band-lead mt-6 type-body-l text-ink-muted">
              SOMA macht dich für Kundschaft in deinem Einsatzgebiet sichtbar und kümmert sich um Buchung, Zahlung und Stornofristen.
            </p>
            <div className="lp-band-ctas mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {/* Prefetched on intent only: the onboarding route's prefetch preloads CSS `/` never uses (RT-9). */}
              <IslandBoundary
                name="05 Profi link"
                fallback={
                  <a href={routes.pro.onboarding()} className={buttonClasses({ size: "l", className: "max-sm:w-full" })} data-cta="pro-werden-05">
                    Profi werden
                  </a>
                }
              >
                <IntentLink href={routes.pro.onboarding()} className={buttonClasses({ size: "l", className: "max-sm:w-full" })} data-cta="pro-werden-05">
                  Profi werden
                </IntentLink>
              </IslandBoundary>
              <ButtonLink href={`${routes.forPros()}#provision`} prefetch={false} variant="secondary" size="l" className="max-sm:w-full" iconRight={<Icon icon={ArrowRight} size={18} />}>
                Konditionen ansehen
              </ButtonLink>
            </div>
          </div>
          {/* < 1024 the arch follows the text, so a jump to 05 shows its heading (audit-4 N4-4); ≥ 1024 it is hidden. */}
          <figure className="lp-band-arch">
            <LandingArch tone="haare-styling" reveal="arch">
              <LandingImage
                src="/images/landing/app-pro.jpg"
                alt="Ein Profi steht im Treppenhaus eines Altbaus am Fenster und schaut auf das Smartphone."
                sizes="(min-width: 768px) 70vw, calc(100vw - 40px)"
                focal="50% 50%"
              />
            </LandingArch>
            <figcaption className="mt-3">
              <Ortszeile text={PLACE} />
            </figcaption>
          </figure>
          <Ortszeile text={PLACE} className="lp-band-place" />
        </LpContainer>
      </div>
    </Chapter>
  );
}
