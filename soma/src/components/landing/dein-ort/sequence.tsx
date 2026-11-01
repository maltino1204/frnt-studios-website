import { PLACE_LINES } from "@/components/site/discovery-copy";
import { cn } from "@/lib/cn";
import { LandingArch } from "../primitives/landing-arch";
import { LandingImage } from "../primitives/landing-image";
import { Ortszeile } from "../primitives/ortszeile";

type Item = { line: string; note?: string; place: string; src: string; focal: string; alt: string; tone: string };

/** Deck § 05 (lines and Ortszeilen verbatim), crops from spec § 4.5 (verified in spec-assets/crops-experience.jpg). */
export const EXPERIENCE: readonly Item[] = [
  {
    line: "Die Stunde gehört der Behandlung. Nicht dem Weg dorthin.",
    place: PLACE_LINES.setup,
    src: "/images/landing/experience-time.jpg",
    focal: "78% 50%",
    alt: "Am Abend im eigenen Wohnzimmer: Eine Frau sitzt barfuß im Sessel, ein Profi arbeitet an einem kleinen Holztisch an ihren Händen.",
    tone: "manikuere",
  },
  {
    line: "Dein Sofa. Deine Decke. Dein Licht.",
    place: PLACE_LINES.after,
    src: "/images/landing/experience-comfort.jpg",
    focal: "45% 55%",
    alt: "Ein Mann ist nach der Behandlung unter einer Decke auf seinem Sofa eingeschlafen; im Hintergrund packt der Profi die Liege zusammen.",
    tone: "massage",
  },
  {
    line: "Deine Adresse sieht nur dein Profi – und erst nach der Bestätigung.",
    place: PLACE_LINES.home,
    src: "/images/landing/experience-privacy.jpg",
    focal: "50% 50%",
    alt: "Blick durch eine halb geöffnete Tür in ein ruhiges Zimmer, in dem ein Profi eine Massageliege vorbereitet.",
    tone: "kosmetik",
  },
  {
    line: "Geprüft, bevor es klingelt.",
    note: "Ausweis, Gewerbe, Berufshaftpflicht – und je nach Kategorie die Qualifikation.",
    place: PLACE_LINES.arrival,
    src: "/images/landing/experience-quality.jpg",
    focal: "50% 50%",
    alt: "Ein Profi mit Koffer klingelt im Treppenhaus eines Altbaus an einer hohen Wohnungstür.",
    tone: "haare-styling",
  },
  {
    line: "Du wählst die Person, nicht nur die Uhrzeit.",
    place: PLACE_LINES.hotel,
    src: "/images/landing/experience-choice.jpg",
    focal: "88% 50%",
    alt: "Ein Gast streift im Sessel die Schuhe ab, während der Profi dahinter die Massageliege aufbaut.",
    tone: "brows-lashes",
  },
  {
    line: "Morgens, nachmittags oder abends – du suchst nach deiner Zeit.",
    place: PLACE_LINES.office,
    src: "/images/landing/experience-flexible.jpg",
    focal: "62% 50%",
    alt: "Ein Profi massiert in einem Besprechungsraum den Nacken eines Mannes auf einem Massagestuhl; draußen liegt der Hafen.",
    tone: "pedikuere",
  },
];

/**
 * The six places of 05 as one `<ol>` (spec § 4.5). Each `<li data-step-item>` holds a `<figure>`: the photo in a 4:5
 * arch and a `<figcaption>` with the line (a serif statement `<p>`, not a heading) and the Ortszeile.
 * - lite / none: a vertical photo essay on Espresso, the arches alternately left and right (the contrapposto shift);
 * - full, once the motion layer marks the scene ready: the stepped stage (landing.css), one item visible at a time.
 */
export function ExperienceSequence({ className }: { className?: string }) {
  return (
    <ol className={cn("lp-essay", className)}>
      {EXPERIENCE.map((it, i) => (
        <li key={it.src} data-step-item={i + 1} className="lp-essay-item">
          <figure className="lp-essay-fig">
            <LandingArch tone={it.tone} reveal="arch" className="lp-essay-arch">
              <LandingImage src={it.src} alt={it.alt} sizes="(min-width: 1440px) 519px, (min-width: 1024px) 36vw, 86vw" focal={it.focal} />
            </LandingArch>
            <figcaption className="lp-essay-cap">
              <p className="lp-essay-line type-display-s text-ink">{it.line.replace(/ – /g, "\u00a0– ")}</p>
              {it.note ? <p className="lp-essay-note mt-3 max-w-[36ch] type-body-s text-ink-muted">{it.note}</p> : null}
              <Ortszeile text={it.place} className="lp-essay-place" />
            </figcaption>
          </figure>
        </li>
      ))}
    </ol>
  );
}

/** "03 / 06": one span per step, CSS shows the one of `[data-step]` (aria-hidden; the counter changes instantly). */
export function StageCounter() {
  const total = String(EXPERIENCE.length).padStart(2, "0");
  return (
    <p aria-hidden className="lp-stage-counter type-label text-ink-muted num">
      {EXPERIENCE.map((_, i) => (
        <span key={i} data-step-counter={i + 1}>
          {String(i + 1).padStart(2, "0")} / {total}
        </span>
      ))}
    </p>
  );
}
