import { DEMO_MODE } from "@/lib/brand";
import { ScreenTabs } from "../digital/screen-tabs";
import { availableCallouts, CALLOUTS, SCREEN_SIZES, type ScreenId } from "../digital/screens";
import { nextChapter, titleId } from "../nav/chapters";
import { ChapterFoot } from "../primitives/chapter-foot";
import { Clauses } from "../primitives/clauses";
import { Eyebrow } from "../primitives/eyebrow";
import { landingImgAttrs } from "../primitives/landing-image";
import type { LandingImgAttrs } from "../primitives/landing-img";
import { Chapter, LpContainer } from "./chapter";

/**
 * 07 · Deine Buchung (spec § 4.7) on Linen: the product, shown truthfully. A web app: no store badges, no device
 * frame, no unreleased features. The screens are real captures of the live demo app (A4); without them the chapter
 * keeps its text and the callouts as a plain list (no placeholder screens). The screenshots carry the product's own
 * Oxblood buttons, so the chapter CTA is primary (Espresso).
 */
export function DeineBuchungChapter() {
  const next = nextChapter(7)!;
  const items = availableCallouts();
  // The captures' <img> attributes (getImageProps on the server, intrinsic size), one per screen file.
  const images: Partial<Record<ScreenId, LandingImgAttrs>> = {};
  for (const it of items) images[it.file.id] ??= landingImgAttrs(it.file.src, { sizes: SCREEN_SIZES, width: it.file.width, height: it.file.height });
  const caption = DEMO_MODE ? "Live-App · Demo-Daten" : "Live-App";
  const head = (
    <>
      <Eyebrow nn="07">Deine Buchung</Eyebrow>
      <Clauses
        as="h2"
        id={titleId("deine-buchung")}
        tabIndex={-1}
        className="mt-4 type-display-m text-ink outline-none"
        parts={["Wer kommt. Wann. Was es kostet.", "Alles an einem Ort."]}
      />
      <p className="mt-6 max-w-[44ch] type-body-l text-ink-muted">
        SOMA läuft im Browser deines Smartphones – ohne Download. Alles zu deinem Termin steht in deiner Buchung.
      </p>
    </>
  );
  return (
    <Chapter n={7} cv={{ desktop: 970, tablet: 1125, mobile: 1220 }}>
      <LpContainer>
        {items.length ? (
          <ScreenTabs head={head} items={items} images={images} caption={caption} />
        ) : (
          <div>
            {head}
            <dl className="mt-10 grid gap-x-6 gap-y-6 border-t border-line pt-6 md:grid-cols-2 lg:grid-cols-3">
              {CALLOUTS.map((c) => (
                <div key={c.title}>
                  <dt className="type-heading-m text-ink">{c.title}</dt>
                  <dd className="mt-1 type-body-s text-ink-muted">{c.line}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <ChapterFoot
          className="mt-10 lg:mt-14"
          cta={{ label: "Freie Termine finden", href: "#termin", kind: "button", booking: "ch07" }}
          next={{ id: next.id, name: next.name }}
        />
      </LpContainer>
    </Chapter>
  );
}

