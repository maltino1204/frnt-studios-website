import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Container, Section } from "@/components/ui/layout";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { formatRating } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { SocialProofDTO } from "@/server/services/site-ext-2";

const NBSP = " ";
const COLS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };

/**
 * Home proof band under the hero (audit-1 R14): real aggregates from the database,
 * two or three real review quotes with an Ortszeile, and the named SOMA-Garantie.
 * Typographic only: no logos, no badges, no press.
 */
export function ProofBand({ proof, disputeWindowHours }: { proof: SocialProofDTO | null; disputeWindowHours: number }) {
  const stats: Array<{ key: string; value: ReactNode; label: string }> = [];
  if (proof && proof.reviewCount > 0 && proof.ratingAvg != null) {
    stats.push({
      key: "rating",
      value: (
        <>
          {formatRating(proof.ratingAvg)}
          <Star aria-hidden size={20} strokeWidth={1.5} absoluteStrokeWidth className="fill-ink text-ink" />
          <span className="sr-only"> von 5 Sternen</span>
        </>
      ),
      label: `aus${NBSP}${proof.reviewCount.toLocaleString("de-DE")} verifizierten Bewertungen`,
    });
  }
  if (proof && proof.approvedProviders > 0) {
    stats.push({ key: "pros", value: proof.approvedProviders.toLocaleString("de-DE"), label: "geprüfte Profis" });
    if (proof.cities > 0) stats.push({ key: "cities", value: proof.cities.toLocaleString("de-DE"), label: proof.cities === 1 ? "Stadt" : "Städte" });
  }
  const quotes = proof?.quotes ?? [];
  const guarantee = `${BRAND_NAME}-Garantie`;

  return (
    <Section aria-labelledby="stimmen-titel" className="pb-0">
      <Container className="flex flex-col gap-12 md:gap-16">
        {stats.length || quotes.length ? (
          <div className="flex flex-col gap-10 md:gap-12">
            <div className="flex flex-col gap-4">
              <h2 id="stimmen-titel" className="type-overline text-ink-muted">
                Verifizierte Bewertungen
              </h2>
              {stats.length ? (
                <dl className={cn("grid border-y border-line", COLS[stats.length])}>
                  {stats.map((s, i) => (
                    <div key={s.key} className={cn("flex min-w-0 flex-col gap-1.5 py-5 md:py-7", i > 0 ? "border-l border-line pl-4 md:pl-6" : "pr-4")}>
                      <dt className="order-2 type-caption text-ink-muted md:type-body-s">{s.label}</dt>
                      <dd className="order-1 flex items-center gap-1.5 type-display-m num">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
            {quotes.length ? (
              <ul className="grid gap-10 md:grid-cols-3 md:gap-0">
                {quotes.map((q, i) => (
                  <li key={q.id} className={cn("min-w-0 md:pr-6", i > 0 && "md:pl-6", i > 1 && "hidden md:block")}>
                    <figure className="flex flex-col gap-4">
                      <blockquote className="type-display-s text-ink">
                        <p>{`„${q.comment}“`}</p>
                      </blockquote>
                      <figcaption className="type-caption text-ink-muted">
                        {`${q.authorName} · ${q.serviceName} bei `}
                        <Link href={routes.provider(q.providerSlug)} className="text-ink underline decoration-1 underline-offset-[0.2em] hover:text-accent">
                          {q.providerName}
                        </Link>
                        {q.cityName ? ` · ${q.cityName}` : null}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <h2 id="stimmen-titel" className="sr-only">
            {guarantee}
          </h2>
        )}

        <div className="grid gap-4 border-t border-line pt-8 lg:grid-cols-12 lg:gap-6 lg:pt-10">
          <h3 className="type-overline text-ink lg:col-span-4">{guarantee}</h3>
          <div className="flex flex-col gap-4 lg:col-span-8">
            <p className="max-w-[40rem] type-display-s text-ink">
              {`Wenn etwas nicht stimmt, melden Sie es innerhalb von ${disputeWindowHours}${NBSP}Stunden – wir finden eine Lösung: Nachbesserung, Gutschrift oder Erstattung.`}
            </p>
            <Link
              href={`${routes.help()}#garantie`}
              className="inline-flex min-h-touch items-center gap-2 self-start type-label text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover"
            >
              So funktioniert die Garantie
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
