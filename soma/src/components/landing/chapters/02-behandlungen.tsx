import { capitalize, numberWord } from "@/components/site/discovery-copy";
import { routes } from "@/lib/routes";
import { CategoryCard } from "../behandlungen/category-card";
import { IndexList } from "../behandlungen/index-list";
import { PREVIEW_SIZES, type CategoryItem } from "../behandlungen/types";
import { nextChapter, titleId } from "../nav/chapters";
import { ChapterFoot } from "../primitives/chapter-foot";
import { Clauses } from "../primitives/clauses";
import { Eyebrow } from "../primitives/eyebrow";
import { landingImgAttrs } from "../primitives/landing-image";
import { SnapRail } from "../primitives/snap-rail";
import { Chapter, LpContainer } from "./chapter";

/**
 * 02 · Behandlungen (spec § 4.3). Two server-rendered presentations of the same catalogue, switched by CSS so there
 * is no hydration mismatch and no shift: the editorial index with a preview arch (≥ 1024 with hover and a fine
 * pointer), otherwise the snap rail of cards (78 % at 390, about 2.4 per view at 768). Every category is one link
 * to `/behandlungen/{slug}`; prices are real floors („ab“, without travel) or absent. The foot holds two quiet links:
 * „Alle Behandlungen“ and „Themenwelten entdecken“ (`/entdecken`, v2).
 */
export function BehandlungenChapter({ items }: { items: CategoryItem[] }) {
  const next = nextChapter(2)!;
  // The desktop preview's photos, built here (getImageProps on the server) for the index island.
  const previews = Object.fromEntries(items.map((it) => [it.slug, landingImgAttrs(it.image, { sizes: PREVIEW_SIZES, focal: it.focal })]));
  return (
    <Chapter n={2}>
      <LpContainer>
        <div className="lp-cat-head">
          <Eyebrow nn="02">Behandlungen</Eyebrow>
          <Clauses
            as="h2"
            id={titleId("behandlungen")}
            tabIndex={-1}
            className="mt-4 type-display-m text-ink outline-none"
            parts={[`${capitalize(numberWord(items.length))} Behandlungen.`, "Ein Ort: deiner."]}
          />
          <p className="mt-6 max-w-[44ch] type-body-l text-ink-muted">Von Profis, die mitbringen, was die Behandlung braucht – von der Liege bis zur Lampe.</p>
        </div>

        <div className="mt-10 md:mt-12 lg:mt-12">
          <IndexList items={items} previews={previews} />
          <div className="lp-cat-rail">
            <SnapRail id="behandlungen-rail" label="Behandlungen" perView={3} itemClassName="w-[78%] md:w-[calc((100%-2*1.25rem)/2.4)] lg:w-[calc((100%-3*1.5rem)/3.4)]">
              {items.map((it) => (
                <CategoryCard key={it.slug} item={it} />
              ))}
            </SnapRail>
          </div>
        </div>

        <ChapterFoot
          className="mt-4 lg:mt-12"
          cta={[
            { label: "Alle Behandlungen", href: routes.categories(), kind: "link" },
            { label: "Themenwelten entdecken", href: routes.explore(), kind: "link" },
          ]}
          next={{ id: next.id, name: next.name }}
        />
      </LpContainer>
    </Chapter>
  );
}
