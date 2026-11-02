import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { FaqItem } from "@/components/site/discovery-copy";
import { Icon } from "@/components/ui/icon";
import { routes } from "@/lib/routes";
import { titleId } from "../nav/chapters";
import { lpLinkClass, lpLinkText } from "../primitives/chapter-foot";
import { Clauses } from "../primitives/clauses";
import { Eyebrow } from "../primitives/eyebrow";
import { Chapter, LpContainer } from "./chapter";

/**
 * 06 · Fragen (spec § 4.9): practical answers, true to the product. The items are Conversion's `landingFaq()` (deck
 * § 09, the five most important of the nine, every value bound to `getPublicTerms()`), the same array that feeds the
 * FAQPage JSON-LD, so all five are rendered at every width. „Alle Fragen“ leads to `/hilfe`. Native <details>: works
 * without JS, several may be open, find-in-page reaches the answers. The chevron turns 180° when open (the motion
 * layer animates it).
 */
export function FragenChapter({ items }: { items: FaqItem[] }) {
  return (
    <Chapter n={6} cv={{ desktop: 434, tablet: 600, mobile: 580 }}>
      <LpContainer className="lp-faq">
        <div className="lp-faq-aside">
          <Eyebrow nn="06">Fragen &amp; Antworten</Eyebrow>
          <Clauses as="h2" id={titleId("fragen")} tabIndex={-1} className="mt-4 type-display-m text-ink outline-none" parts={["Antworten,", "bevor du fragst."]} />
        </div>

        <div className="lp-faq-list">
          <div className="border-t border-line">
            {items.map((it) => (
              <details key={it.q} className="lp-faq-item group border-b border-line">
                <summary className="-mx-3 flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-6 rounded-control px-3 py-4 transition-colors duration-fast focus-ring hover:bg-surface-sunken [&::-webkit-details-marker]:hidden">
                  <h3 className="type-heading-m text-ink">{it.q}</h3>
                  <Icon icon={ChevronDown} size={20} className="lp-faq-chevron shrink-0 text-ink group-open:rotate-180" />
                </summary>
                <div className="pr-6 pb-6 md:pr-12">
                  <p className="max-w-[64ch] type-body text-ink-muted">{it.a}</p>
                </div>
              </details>
            ))}
          </div>
          <Link href={routes.help()} prefetch={false} className={`${lpLinkClass} mt-6`}>
            <span className={lpLinkText}>Alle Fragen</span>
            <Icon icon={ArrowRight} size={16} />
          </Link>
        </div>
      </LpContainer>
    </Chapter>
  );
}
