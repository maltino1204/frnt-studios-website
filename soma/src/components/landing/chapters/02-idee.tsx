import { nextChapter, titleId } from "../nav/chapters";
import { ChapterFoot } from "../primitives/chapter-foot";
import { Clauses } from "../primitives/clauses";
import { Eyebrow } from "../primitives/eyebrow";
import { LandingArch } from "../primitives/landing-arch";
import { LandingImage } from "../primitives/landing-image";
import { Ortszeile } from "../primitives/ortszeile";
import { Chapter, LpContainer } from "./chapter";

/**
 * 02 · Idee (spec § 4.2): the editorial statement. The doorway scene (`data-scene="doorway"`): in the full tier the
 * motion layer widens the arch mask (`data-arch-mask="doorway"`) from the room you stay in to the hallway where the
 * Profi's kit already stands. Static (and without JS): the end state, the full arch, all text visible.
 */
export function IdeeChapter() {
  const next = nextChapter(2)!;
  return (
    <Chapter n={2}>
      <LpContainer>
        <div data-scene="doorway" className="lp-idee">
          <div className="lp-idee-head">
            <Eyebrow nn="02">Die Idee</Eyebrow>
            <Clauses
              as="h2"
              id={titleId("idee")}
              tabIndex={-1}
              className="mt-4 max-w-[20ch] type-display-l text-ink outline-none"
              parts={["Dein Termin richtet sich nach deinem Leben.", "Nicht umgekehrt."]}
            />
          </div>
          <figure className="lp-idee-figure">
            <LandingArch mask="doorway" tone="massage">
              <LandingImage
                src="/images/landing/philosophy.jpg"
                alt="Blick aus dem Flur durch einen Rundbogen in ein Wohnzimmer mit Stehlampe; an der Wand stehen die Tasche und die zusammengeklappte Liege eines Profis."
                sizes="(min-width: 1440px) 628px, (min-width: 1024px) 45vw, (min-width: 768px) 69vw, calc(100vw - 40px)"
                focal="50% 50%"
              />
            </LandingArch>
            <figcaption className="mt-3">
              <Ortszeile text="Flur · Berlin-Schöneberg · 18:40" />
            </figcaption>
          </figure>
          <div className="lp-idee-text">
            {/* One clause group: the statement arrives with the third line, never before it (audit I-12; the doorway
                scene triggers these units at its progress marks in the full tier). */}
            <div data-reveal="clause" data-doorway-lines="">
              <p className="flex flex-col gap-6 type-display-m text-ink md:gap-3">
                <span data-reveal-order={0} className="block">
                  Kein Weg durch die Stadt.
                </span>{" "}
                <span data-reveal-order={1} className="block">
                  Kein Parkplatz.
                </span>{" "}
                <span data-reveal-order={2} className="block">
                  Kein Wartebereich.
                </span>
              </p>
              <p data-reveal-order={3} className="mt-10 max-w-[36ch] type-lead text-ink">
                Du bleibst, wo du bist. Dein Profi kommt – mit allem, was die Behandlung braucht.
              </p>
            </div>
            <p className="mt-4 type-small text-ink-muted">Soma ist das altgriechische Wort für Körper.</p>
            <ChapterFoot className="mt-10" next={{ id: next.id, name: next.name }} />
          </div>
        </div>
      </LpContainer>
    </Chapter>
  );
}
