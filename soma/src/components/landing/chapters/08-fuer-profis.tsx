import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { routes } from "@/lib/routes";
import { titleId } from "../nav/chapters";
import { Clauses } from "../primitives/clauses";
import { Eyebrow } from "../primitives/eyebrow";
import { LandingArch } from "../primitives/landing-arch";
import { LandingImage } from "../primitives/landing-image";
import { Ortszeile } from "../primitives/ortszeile";
import { Chapter, LpContainer } from "./chapter";

const NBSP = " ";
const PLACE = `Treppenhaus, 2.${NBSP}OG · Berlin-Neukölln · 17:40`;

export type Commission = { rate: number; repeatClientRate: number; ownClientRate: number };

/** 0.2 → "20 %", 0.125 → "12,5 %" (NBSP before the sign). */
function percent(r: number): string {
  return `${(r * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })}${NBSP}%`;
}

/**
 * 08 · Für Profis (spec § 4.8): the second audience. ≥ 1024 the one full-bleed photo band (no arch: the Profi is on
 * the way), the text in the night scope on the image's calm left third (measured contrast), the band declaring
 * `data-header-theme="dark"`. < 1024 the app-pro photo in a full-width arch and the text on Bone. Below, on Bone:
 * the five benefits (no icons), the data-bound commission strip and the payment line. No income claims.
 */
export function FuerProfisChapter({ commission, payoutHoldHours }: { commission: Commission; payoutHoldHours: number | null }) {
  const benefits = [
    { title: "Gefunden werden", line: "Du erscheinst in Suchen in deinem Radius – mit deinem Endpreis inklusive Anfahrt." },
    { title: "Deine Zeiten", line: "Arbeitszeiten, Puffer, Vorlaufzeit und freie Tage legst du selbst fest." },
    { title: "Alles in SOMA Pro", line: "Anfragen annehmen oder ablehnen, Kalender, Start-Code und Einnahmen an einem Ort." },
    { title: "Dein Profil", line: "Portfolio, Leistungen und Bewertungen aus echten Terminen." },
    {
      title: "Dein Geschäft",
      line: `Eigene Preise und dein Einladungslink: Stammkundschaft bucht dich darüber für ${percent(commission.ownClientRate)} Provision.`,
    },
  ];
  const strip = [
    "Keine Grundgebühr",
    `${percent(commission.rate)} bei neuer Kundschaft über SOMA`,
    `${percent(commission.repeatClientRate)} bei Stammkundschaft`,
    `${percent(commission.ownClientRate)} mit deinem Einladungslink`,
    `0${NBSP}% auf die Anfahrt`,
  ];

  return (
    <Chapter n={8} padded={false} cv={{ desktop: 1600, mobile: 2100 }} className="lp-pros">
      <div data-scene="band" className="lp-band">
        <div className="lp-band-media" data-header-theme="dark">
          <LandingImage
            src="/images/editorial/provider-cta-v2.jpg"
            alt="Ein Profi mit Tasche steigt am frühen Abend die Holztreppe eines Berliner Altbaus hinauf."
            sizes="100vw"
            focal="68% 50%"
            settle
          />
        </div>
        <LpContainer className="lp-band-content">
          <figure className="lp-band-arch">
            <LandingArch tone="haare-styling" reveal="arch">
              <LandingImage
                src="/images/landing/app-pro.jpg"
                alt="Ein Profi steht im Treppenhaus eines Altbaus am Fenster und schaut auf das Smartphone."
                sizes="calc(100vw - 40px)"
                focal="50% 50%"
              />
            </LandingArch>
            <figcaption className="mt-3">
              <Ortszeile text={PLACE} />
            </figcaption>
          </figure>
          <div className="lp-band-text">
            <Eyebrow nn="08">SOMA für Profis</Eyebrow>
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
              <ButtonLink href={routes.pro.onboarding()} size="l" className="max-sm:w-full" data-cta="pro-werden-08">
                Profi werden
              </ButtonLink>
              <ButtonLink href={`${routes.forPros()}#provision`} prefetch={false} variant="secondary" size="l" className="max-sm:w-full" iconRight={<Icon icon={ArrowRight} size={18} />}>
                Konditionen ansehen
              </ButtonLink>
            </div>
          </div>
          <Ortszeile text={PLACE} className="lp-band-place" />
        </LpContainer>
      </div>

      <LpContainer className="pt-14 pb-(--space-section) lg:pt-20">
        <ul className="grid gap-x-6 gap-y-8 md:grid-cols-3 xl:grid-cols-5" aria-label="Was SOMA für Profis übernimmt">
          {benefits.map((b) => (
            <li key={b.title} className="border-t border-line pt-5">
              <h3 className="type-heading-m text-ink">{b.title}</h3>
              <p className="mt-2 max-w-[32ch] type-body-s text-ink-muted">{b.line}</p>
            </li>
          ))}
        </ul>
        <div className="mt-12 border-t border-line pt-6 lg:mt-16">
          <p className="type-label-s text-ink num">
            {strip.map((s, i) => (
              <span key={s}>
                {i > 0 ? `${NBSP}· ` : null}
                <span className="whitespace-nowrap">{s}</span>
              </span>
            ))}
          </p>
          <p className="mt-3 type-body-s text-ink-muted">
            Bezahlt wird über SOMA – nicht an der Tür.
            {payoutHoldHours != null ? ` Dein Anteil ist ${payoutHoldHours}${NBSP}Stunden nach dem Termin verfügbar.` : null}
          </p>
        </div>
      </LpContainer>
    </Chapter>
  );
}
