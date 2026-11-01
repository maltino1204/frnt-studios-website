import { Rail } from "@/components/site/discovery-rail";
import { capitalize, numberWord } from "@/components/site/discovery-copy";
import { routes } from "@/lib/routes";
import { CategoryCard } from "../behandlungen/category-card";
import { IndexList } from "../behandlungen/index-list";
import type { CategoryItem } from "../behandlungen/types";
import { nextChapter, titleId } from "../nav/chapters";
import { ChapterFoot } from "../primitives/chapter-foot";
import { Clauses } from "../primitives/clauses";
import { Eyebrow } from "../primitives/eyebrow";
import { Chapter, LpContainer } from "./chapter";

/**
 * 03 · Behandlungen (spec § 4.3). Two server-rendered presentations of the same catalogue, switched by CSS so there
 * is no hydration mismatch and no shift: the editorial index with a preview arch (≥ 1024 with hover and a fine
 * pointer), otherwise the snap rail of cards (78 % at 390, about 2.4 per view at 768). Every category is one link
 * to `/behandlungen/{slug}`; prices are real floors („ab“, without travel) or absent.
 */
export function BehandlungenChapter({ items }: { items: CategoryItem[] }) {
  const next = nextChapter(3)!;
  return (
    <Chapter n={3}>
      <LpContainer>
        <div className="lp-cat-head">
          <Eyebrow nn="03">Behandlungen</Eyebrow>
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
          <IndexList items={items} />
          <div className="lp-cat-rail">
            <Rail
              label="Behandlungen"
              perView={3}
              className="[&>ul>li]:w-[78%] md:[&>ul>li]:w-[calc((100%-2*1.25rem)/2.4)] lg:[&>ul>li]:w-[calc((100%-3*1.5rem)/3.4)]"
            >
              {items.map((it) => (
                <CategoryCard key={it.slug} item={it} />
              ))}
            </Rail>
          </div>
        </div>

        <ChapterFoot
          className="mt-4 lg:mt-12"
          cta={{ label: "Alle Behandlungen", href: routes.categories(), kind: "link" }}
          next={{ id: next.id, name: next.name }}
        />
      </LpContainer>
    </Chapter>
  );
}
