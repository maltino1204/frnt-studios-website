import type { ReactNode } from "react";
import { DEMO_MODE } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { StepButtons } from "../ablauf/step-buttons";
import { VignetteBook, VignetteDiscover, VignetteStay, type WalkthroughData } from "../ablauf/vignettes";
import { nextChapter, titleId } from "../nav/chapters";
import { ArchOutline } from "../primitives/arch-outline";
import { ChapterFoot } from "../primitives/chapter-foot";
import { Clauses } from "../primitives/clauses";
import { Eyebrow } from "../primitives/eyebrow";
import { IslandBoundary } from "../primitives/island-boundary";
import { Chapter, LpContainer } from "./chapter";

const STEPS = [
  {
    id: "schritt-1",
    title: "Entdecken",
    line: "Finde deine Behandlung.",
    detail: "PLZ, Behandlung, Zeitraum: Du siehst nur echte freie Termine – mit Endpreis inklusive Anfahrt.",
  },
  {
    id: "schritt-2",
    title: "Buchen",
    line: "Wähl Ort und Uhrzeit.",
    detail: "Zuhause, Hotel oder Büro. Bezahlt wird online, belastet erst nach dem Termin.",
  },
  {
    id: "schritt-3",
    title: "Bleiben",
    line: "Dein Profi kommt zu dir.",
    detail: "Mit deinem vierstelligen Start-Code beginnt der Termin. Du bleibst, wo du bist.",
  },
] as const;

const NBSP = "\u00a0";

/**
 * The three trust points under the steps (v2; formerly chapter 07's callouts, deck § 07, verbatim): the cancellation
 * title carries the real free window (`freeHours` from `terms.cancellationPolicy`, as in the hero trust row), the
 * deck's „Stornofrist“ when there is none.
 */
function trustPoints(freeHours: number | null) {
  const storno = freeHours == null ? "Stornofrist" : freeHours > 0 ? `Kostenlos stornierbar bis ${freeHours}${NBSP}Std. vorher` : "Kostenlos stornierbar bis zum Termin";
  return [
    { title: "Endpreis", line: "Inklusive Anfahrt, bevor du buchst." },
    { title: "Start-Code", line: "Vier Ziffern, mit denen dein Termin beginnt." },
    { title: storno, line: "Mit Datum und Uhrzeit, nicht im Kleingedruckten." },
  ];
}

/** The stage picture of one step: the Espresso outline with the vignette below its springline, or the pair. */
function StepVisual({ n, data, instance }: { n: 1 | 2 | 3; data: WalkthroughData; instance: string }) {
  if (n === 3) return <VignetteStay />;
  return (
    <div className="lp-walk-frame">
      <ArchOutline className="lp-walk-outline text-ink" />
      <div className="lp-walk-vignette">{n === 1 ? <VignetteDiscover data={data} /> : <VignetteBook data={data} instance={instance} />}</div>
    </div>
  );
}

function Decorative({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div aria-hidden inert className={className}>
      {children}
    </div>
  );
}

/**
 * 03 · So funktioniert’s (spec § 4.4) on Stone. One DOM for every tier:
 * - lite / none (and < 1024): step buttons + a horizontal snap row of three panels (vignette + text);
 * - full (`html[data-motion="full"] [data-scene="walkthrough"][data-scene-ready]`, landing.css): the step blocks
 *   become a vertical column (`data-step-trigger`) and the sticky stage (`data-stage`) shows the active vignette
 *   (`data-step-item`); step 3 is the signature pair.
 * Vignettes are real kit components with real data, `aria-hidden` and `inert` (no fake actions). Under the steps, one
 * compact row of three trust points (v2), then the foot.
 */
export function AblaufChapter({ data }: { data: WalkthroughData }) {
  const next = nextChapter(3)!;
  const caption = DEMO_MODE ? "Vorschau · Demo-Daten" : "Vorschau";
  return (
    <Chapter n={3}>
      <LpContainer>
        <div className="max-w-[44rem]">
          <Eyebrow nn="03">So funktioniert’s</Eyebrow>
          <Clauses as="h2" id={titleId("so-funktionierts")} tabIndex={-1} className="mt-4 type-display-m text-ink outline-none" parts={["Drei Schritte.", "Kein Weg."]} />
        </div>

        <div data-scene="walkthrough" className="lp-walk mt-10 md:mt-12 lg:mt-16">
          <div className="lp-walk-controls mb-6 md:mb-8">
            {/* Without the buttons the snap row still scrolls natively. */}
            <IslandBoundary name="03 step buttons">
              <StepButtons rowId="ablauf-schritte" steps={STEPS.map((s) => ({ id: s.id, label: s.title }))} />
            </IslandBoundary>
          </div>

          <div className="lp-walk-body">
            {/* A focusable, named region (keyboard scrolling, WCAG 2.1.1) without the kit ScrollRegion's mount-time layout read. */}
            <div role="region" aria-label="Drei Schritte" tabIndex={0} className="lp-walk-scroller focus-ring">
              <ol id="ablauf-schritte" className="lp-walk-steps">
                {STEPS.map((s, i) => {
                  const n = (i + 1) as 1 | 2 | 3;
                  return (
                    <li key={s.id} id={s.id} data-step-trigger={n} className="lp-walk-step">
                      <Decorative className="lp-walk-panel-visual">
                        <StepVisual n={n} data={data} instance={`p${n}`} />
                      </Decorative>
                      <div className="lp-walk-text">
                        <p className="type-numeric text-ink num">{String(n).padStart(2, "0")}</p>
                        <h3 className="mt-3 type-heading-l text-ink">{s.title}</h3>
                        <p className="mt-2 type-lead text-ink">{s.line}</p>
                        <p className="mt-3 max-w-[38ch] type-body text-ink-muted">{s.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <Decorative className="lp-walk-stage-col">
              <div data-stage="" className="lp-walk-stage">
                <div className="lp-walk-stage-box">
                  <ArchOutline draw className="lp-walk-stage-outline text-ink" />
                  {([1, 2, 3] as const).map((n) => (
                    <div key={n} data-step-item={n} className={cn("lp-walk-item", n === 3 && "lp-walk-item-pair")}>
                      {n === 3 ? <VignetteStay /> : <div className="lp-walk-vignette">{n === 1 ? <VignetteDiscover data={data} /> : <VignetteBook data={data} instance="stage" />}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </Decorative>
          </div>
          <p className="lp-walk-caption mt-4 type-caption text-ink-muted">{caption}</p>
        </div>

        <dl className="lp-walk-trust mt-12 grid gap-5 border-t border-line pt-6 md:grid-cols-3 md:gap-6 lg:mt-16">
          {trustPoints(data.freeHours).map((t) => (
            <div key={t.title}>
              <dt className="type-heading-m text-ink">{t.title}</dt>
              <dd className="mt-1 max-w-[34ch] type-body-s text-ink-muted">{t.line}</dd>
            </div>
          ))}
        </dl>

        <ChapterFoot
          className="mt-10 lg:mt-14"
          cta={{ label: "Freie Termine finden", href: "#termin", kind: "button", booking: "ch03" }}
          next={{ id: next.id, name: next.name }}
        />
      </LpContainer>
    </Chapter>
  );
}
