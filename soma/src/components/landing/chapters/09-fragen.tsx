import Link from "next/link";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import type { FaqItem } from "@/components/site/discovery-copy";
import { Icon } from "@/components/ui/icon";
import { routes } from "@/lib/routes";
import { titleId } from "../nav/chapters";
import { lpLinkClass, lpLinkText } from "../primitives/chapter-foot";
import { Clauses } from "../primitives/clauses";
import { Eyebrow } from "../primitives/eyebrow";
import { Chapter, LpContainer } from "./chapter";

/**
 * 09 · Fragen (spec § 4.9): practical answers, true to the product. The items come from Conversion's
 * `buildLandingFaq` (deck § 09, every value bound to `getPublicTerms()`), the same array that feeds the FAQPage
 * JSON-LD, so all nine are rendered at every width (no mobile limit). Native <details>: works without JS, several may
 * be open, find-in-page reaches the answers. The chevron turns 180° when open (the motion layer animates it).
 */
export function FragenChapter({ items, trust }: { items: FaqItem[]; trust: string[] }) {
  return (
    <Chapter n={9} cv={{ desktop: 1300, mobile: 2200 }}>
      <LpContainer className="lp-faq">
        <div className="lp-faq-aside">
          <Eyebrow nn="09">Fragen &amp; Antworten</Eyebrow>
          <Clauses as="h2" id={titleId("fragen")} tabIndex={-1} className="mt-4 type-display-m text-ink outline-none" parts={["Antworten,", "bevor du fragst."]} />
          {trust.length ? (
            <ul className="mt-8 flex flex-col gap-3 lg:mt-10" aria-label="Darauf kannst du dich verlassen">
              {trust.map((t) => (
                <li key={t} className="flex items-start gap-3 type-label text-ink">
                  <span aria-hidden className="mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                    <Icon icon={Check} size={13} strokeWidth={2.5} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-6 flex flex-col items-start lg:mt-8">
            <Link href={routes.help()} prefetch={false} className={lpLinkClass}>
              <span className={lpLinkText}>Alle Fragen und Antworten</span>
              <Icon icon={ArrowRight} size={16} />
            </Link>
            <Link href="/stornierung" prefetch={false} className={lpLinkClass}>
              <span className={lpLinkText}>Stornobedingungen</span>
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </div>
        </div>

        <div className="lp-faq-list border-t border-line">
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
      </LpContainer>
    </Chapter>
  );
}
