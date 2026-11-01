import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Quote, ShieldCheck, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Container, Section } from "@/components/ui/layout";
import { CountUp, Reveal, ScrollRegion } from "@/components/ui/motion";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { SocialProofDTO } from "@/server/services/site-ext-2";

const NBSP = " ";
const COLS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };

/**
 * Home proof band under the hero (audit-1 R14): real aggregates from the
 * database (counting up once when they scroll into view) and two or three real
 * review quotes. No logos, no press, no invented numbers.
 */
export function ProofBand({ proof }: { proof: SocialProofDTO | null }) {
  const stats: Array<{ key: string; value: ReactNode; label: string }> = [];
  if (proof && proof.reviewCount > 0 && proof.ratingAvg != null) {
    stats.push({
      key: "rating",
      value: (
        <>
          <CountUp value={Math.round(proof.ratingAvg * 10) / 10} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
          <Icon icon={Star} size={22} className="fill-ink text-ink" />
          <span className="sr-only"> von 5 Sternen</span>
        </>
      ),
      label: `aus${NBSP}${proof.reviewCount.toLocaleString("de-DE")} verifizierten Bewertungen`,
    });
  }
  if (proof && proof.approvedProviders > 0) {
    stats.push({ key: "pros", value: <CountUp value={proof.approvedProviders} />, label: "geprüfte Profis" });
    if (proof.cities > 0) stats.push({ key: "cities", value: <CountUp value={proof.cities} />, label: proof.cities === 1 ? "Stadt" : "Städte" });
  }
  const quotes = proof?.quotes ?? [];
  if (!stats.length && !quotes.length) return null;

  return (
    <Section aria-labelledby="stimmen-titel" className="pt-4 pb-0 md:pt-6">
      <Container className="flex flex-col gap-6 md:gap-8">
        <h2 id="stimmen-titel" className="sr-only">
          Verifizierte Bewertungen
        </h2>
        {stats.length ? (
          <Reveal>
            <dl className={cn("grid rounded-card bg-surface-raised shadow-raised", COLS[stats.length])}>
              {stats.map((s, i) => (
                <div key={s.key} className={cn("relative flex min-w-0 flex-col gap-1.5 px-4 py-5 md:px-8 md:py-7", i > 0 && "before:absolute before:inset-y-5 before:left-0 before:w-px before:bg-line md:before:inset-y-7")}>
                  <dt className="order-2 type-caption text-ink-muted md:type-body-s">{s.label}</dt>
                  <dd className="order-1 flex items-center gap-1.5 type-stat">{s.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        ) : null}
        {quotes.length ? (
          // Phones: one swipeable row (no auto-advance) instead of stacked quotes; from md three columns.
          // A5-5: while it scrolls it is a focusable, named region (keyboard scrolling).
          <ScrollRegion
            label="Stimmen"
            className="@container -mx-(--space-gutter) -my-4 flex snap-x snap-mandatory scroll-px-(--space-gutter) overflow-x-auto px-(--space-gutter) pt-4 pb-8 scrollbar-none md:mx-0 md:block md:snap-none md:overflow-visible md:px-0"
          >
            <Reveal as="ul" stagger aria-label="Stimmen aus verifizierten Bewertungen" className="flex shrink-0 gap-3 md:grid md:grid-cols-3 md:gap-5 lg:gap-6">
              {quotes.map((q) => (
                <li key={q.id} className="w-[84cqw] shrink-0 snap-start md:w-auto md:min-w-0">
                  <figure className="flex h-full flex-col justify-between gap-6 rounded-card bg-surface-raised p-5 shadow-raised md:p-6">
                    <div className="flex flex-col gap-3">
                      <Icon icon={Quote} size={20} className="text-line-strong" />
                      <blockquote className="type-title-serif text-ink">
                        <p>{`„${q.comment}“`}</p>
                      </blockquote>
                    </div>
                    <figcaption className="flex items-center gap-3">
                      <Avatar name={q.authorName} size={32} />
                      <span className="min-w-0 type-caption text-ink-muted">
                        <span className="block font-[560] text-ink">{q.authorName}</span>
                        {`${q.serviceName} bei `}
                        <Link href={routes.provider(q.providerSlug)} className="text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
                          {q.providerName}
                        </Link>
                        {q.cityName ? ` · ${q.cityName}` : null}
                      </span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </Reveal>
          </ScrollRegion>
        ) : null}
      </Container>
    </Section>
  );
}

/**
 * The named SOMA-Garantie: one Stone panel (umber-deep secondary text, 4.7:1) with the real dispute window from the
 * platform terms.
 */
export function GuaranteePanel({ disputeWindowHours, className }: { disputeWindowHours: number; className?: string }) {
  const guarantee = `${BRAND_NAME}-Garantie`;
  return (
    <div className={cn("relative isolate flex flex-col gap-5 overflow-clip rounded-panel bg-surface-stone p-6 md:p-10", className)}>
      <div className="flex items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-surface-raised text-ink shadow-raised">
          <Icon icon={ShieldCheck} size={22} />
        </span>
        <Badge tone="aura" dot>
          {guarantee}
        </Badge>
      </div>
      <h3 className="max-w-[34rem] type-display-s text-ink">
        {`Wenn etwas nicht stimmt, melden Sie es innerhalb von ${disputeWindowHours}${NBSP}Stunden. Wir finden eine Lösung.`}
      </h3>
      <ul className="flex flex-wrap gap-2" aria-label="Mögliche Lösungen">
        {["Nachbesserung", "Gutschrift", "Erstattung"].map((x) => (
          <li key={x} className="inline-flex h-8 items-center rounded-full bg-surface-raised px-3.5 type-label-s text-ink">
            {x}
          </li>
        ))}
      </ul>
      <Link
        href={`${routes.help()}#garantie`}
        className="group inline-flex min-h-touch items-center gap-2 self-start rounded-full type-label text-ink focus-ring"
      >
        <span className="underline decoration-1 underline-offset-[0.2em]">So funktioniert die Garantie</span>
        <Icon icon={ArrowRight} size={16} className="transition-transform duration-base ease-settle group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
