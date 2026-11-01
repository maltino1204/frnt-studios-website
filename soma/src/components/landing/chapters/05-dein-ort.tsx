import { buttonClasses } from "@/components/ui/button";
import { BookingLink } from "../booking/booking-link";
import { ExperienceSequence, StageCounter } from "../dein-ort/sequence";
import { nextChapter, titleId } from "../nav/chapters";
import { ChapterFoot } from "../primitives/chapter-foot";
import { Clauses } from "../primitives/clauses";
import { Eyebrow } from "../primitives/eyebrow";
import { Chapter, LpContainer } from "./chapter";

/**
 * 05 · Dein Ort (spec § 4.5), the page's one night band. The dusk and dawn spacers (`data-scene="dusk|dawn"`) are
 * 0 px unless the full tier is ready; then they are 32svh and the motion layer runs their colour. The stage scene
 * (`data-scene="stage"`, `data-stage`) pins and steps through the six places in the full tier; otherwise the list is a
 * vertical photo essay. No numbers, no availability promises (deck § 05 truth guard).
 */
export function DeinOrtChapter() {
  const next = nextChapter(5)!;
  return (
    <Chapter n={5} padded={false} className="lp-ort">
      <div data-scene="dusk" aria-hidden className="lp-spacer lp-spacer-dusk" />
      <div className="lp-ort-body">
        <LpContainer>
          <div className="lp-ort-head max-w-[52rem]">
            <Eyebrow nn="05">Bei dir</Eyebrow>
            <Clauses as="h2" id={titleId("dein-ort")} tabIndex={-1} className="mt-4 type-display-l text-ink outline-none" parts={["Nach der Massage:", "schon zu Hause."]} />
          </div>
        </LpContainer>

        <div data-scene="stage" className="lp-stage-scene">
          <div data-stage="" className="lp-stage">
            <LpContainer className="lp-stage-inner">
              <StageCounter />
              <ExperienceSequence />
              <div className="lp-stage-cta">
                <BookingLink source="ch05-stage" className={buttonClasses({ variant: "primary", size: "l" })}>
                  Freie Termine finden
                </BookingLink>
              </div>
            </LpContainer>
          </div>
        </div>

        <LpContainer>
          <ChapterFoot
            className="lp-ort-foot"
            cta={{ label: "Freie Termine finden", href: "#termin", kind: "link", booking: "ch05" }}
            next={{ id: next.id, name: next.name }}
          />
        </LpContainer>
      </div>
      <div data-scene="dawn" data-header-theme="light" aria-hidden className="lp-spacer lp-spacer-dawn" />
    </Chapter>
  );
}
