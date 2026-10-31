import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { ServiceDTO } from "@/server/dto";
import { durationsLabel, fromPrice } from "./discovery-copy";
import { ServicePickButton } from "./discovery-service-pick";
import { serviceActionClass } from "./discovery-styles";

/**
 * Service list for category and SEO pages: name, short description, durations
 * and the real "ab" price (cheapest active offering). A trailing button
 * preselects the service in the booking entry on the same page.
 */
export function ServiceList({
  services,
  floors,
  categorySlug,
  emptyPriceLabel = "Noch kein Angebot",
  linkTo,
}: {
  services: ServiceDTO[];
  floors: Record<string, number>;
  categorySlug: string;
  emptyPriceLabel?: string;
  /** without a booking entry on the page: link each row to this page with ?leistung= preselected */
  linkTo?: string;
}) {
  return (
    <ul className="flex flex-col divide-y divide-line rounded-card bg-surface-raised px-5 shadow-raised md:px-6">
      {services.map((s) => {
        const price = fromPrice(floors[s.id]);
        return (
          <li
            key={s.id}
            className={cn(
              "grid grid-cols-[1fr_auto] items-start gap-x-6 gap-y-1 pt-5 md:grid-cols-[1fr_7rem_8.5rem] md:items-center md:py-5",
              price ? "pb-4" : "pb-5",
            )}
          >
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="type-heading-m text-ink">{s.name}</h3>
              {s.description ? <p className="max-w-[36rem] type-body-s text-ink-muted">{s.description}</p> : null}
            </div>
            <div className="flex flex-col items-end gap-0.5 text-right md:items-start md:text-left">
              {price || emptyPriceLabel ? (
                <span className={price ? "type-label font-semibold text-ink num" : "type-label-s text-ink-muted"}>{price ?? emptyPriceLabel}</span>
              ) : null}
              <span className="type-caption text-ink-muted num">{durationsLabel(s.durations)}</span>
            </div>
            {/* Only bookable services get an action; nothing disabled to stare at. */}
            <div className="col-span-2 pt-2 md:col-span-1 md:justify-self-end md:pt-0">
              {!price ? null : linkTo ? (
                <Link href={`${linkTo}?leistung=${s.slug}#termin`} aria-label={`${s.name}: Profis finden`} className={serviceActionClass}>
                  Profis finden
                  <Icon icon={ArrowRight} size={16} />
                </Link>
              ) : (
                <ServicePickButton categorySlug={categorySlug} serviceId={s.id} label={s.name} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
