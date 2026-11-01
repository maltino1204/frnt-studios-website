import { ArrowDown } from "lucide-react";
import { Rail } from "@/components/site/discovery-rail";
import { Icon } from "@/components/ui/icon";
import type { DiscoveryProviderDTO } from "@/server/services/site-ext";
import { nextChapter, titleId } from "../nav/chapters";
import { ProviderCard } from "../profis/provider-card";
import { ChapterFoot, lpLinkClass, lpLinkText } from "../primitives/chapter-foot";
import { Clauses } from "../primitives/clauses";
import { Eyebrow } from "../primitives/eyebrow";
import { LandingArch } from "../primitives/landing-arch";
import { LandingImage } from "../primitives/landing-image";
import { Ortszeile } from "../primitives/ortszeile";
import { Chapter, LpContainer } from "./chapter";

/** Minimum number of approved Profis for the rail (INTEGRATION.md § 5.1); otherwise the deck's fallback without faces. */
const MIN_PROVIDERS = 3;

/**
 * 06 · Profis (spec § 4.6): the human side, real data only (`listDiscoveryProviders`, approved Profis, established
 * profiles first). Fallback without faces when fewer than three approved Profis exist. Never invented names,
 * testimonials, counts or badges.
 */
export function ProfisChapter({ providers }: { providers: DiscoveryProviderDTO[] }) {
  const next = nextChapter(6)!;
  const enough = providers.length >= MIN_PROVIDERS;
  const header = (
    <div className="max-w-[40rem]">
      <Eyebrow nn="06">Die Profis</Eyebrow>
      <Clauses as="h2" id={titleId("profis")} tabIndex={-1} className="mt-4 type-display-m text-ink outline-none" parts={["Wer bei dir klingelt."]} />
      {enough ? (
        <p className="mt-6 max-w-[48ch] type-body-l text-ink-muted">
          Selbstständige Profis mit eigener Handschrift. Geprüft, bevor sie buchbar sind – bewertet nur von Menschen, die wirklich gebucht haben.
        </p>
      ) : null}
    </div>
  );

  return (
    <Chapter n={6} cv={{ desktop: 1000, mobile: 1200 }}>
      <LpContainer>
        {enough ? (
          <Rail
            label="Profis auf SOMA"
            perView={4}
            header={header}
            className="[&>ul>li]:w-[64%] md:[&>ul>li]:w-[calc((100%-2*1.25rem)/2.6)] lg:[&>ul>li]:w-[calc((100%-3*1.5rem)/4)]"
          >
            {providers.map((p) => (
              <ProviderCard key={p.providerId} provider={p} />
            ))}
          </Rail>
        ) : (
          <div className="lp-profis-fallback">
            <div className="lp-profis-fallback-head">{header}</div>
            <figure className="lp-profis-fallback-figure">
              <LandingArch tone="massage" reveal="arch">
                <LandingImage
                  src="/images/editorial/details-v2.jpg"
                  alt="Das Werkzeug eines Profis auf einem Leinentuch: Pinsel, Kamm, Schere, Handtücher und ein Fläschchen Öl."
                  sizes="(min-width: 1024px) 40vw, calc(100vw - 40px)"
                  focal="50% 50%"
                />
              </LandingArch>
              <figcaption className="mt-3">
                <Ortszeile text="Was mitkommt" />
              </figcaption>
            </figure>
            <div className="lp-profis-fallback-text">
              <p className="max-w-[44ch] type-body-l text-ink">
                Auf SOMA arbeiten selbstständige Profis – mit eigenen Preisen, eigenen Zeiten und eigenem Stil. Wer buchbar ist, hat Ausweis, Gewerbeanmeldung, Berufshaftpflicht und je nach Kategorie eine Qualifikation nachgewiesen.
              </p>
            </div>
          </div>
        )}

        <ChapterFoot
          className="mt-6 lg:mt-10"
          cta={
            enough
              ? { label: "Selbst Profi?", href: "#fuer-profis", kind: "link" }
              : { label: "Freie Termine finden", href: "#termin", kind: "button", booking: "ch06" }
          }
          next={{ id: next.id, name: next.name }}
        />
        {enough ? null : (
          <a href="#fuer-profis" className={`${lpLinkClass} mt-2`}>
            <span className={lpLinkText}>Selbst Profi?</span>
            <Icon icon={ArrowDown} size={16} />
          </a>
        )}
      </LpContainer>
    </Chapter>
  );
}
