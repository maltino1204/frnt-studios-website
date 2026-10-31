import { cn } from "@/lib/cn";
import { formatPriceExact } from "@/lib/format";
import type { ProviderBookingDTO } from "@/server/dto";
import { formatPercent, TIER_LABEL } from "./labels";

/** Provider-side breakdown: treatment − commission + travel fee = payout (36px rows, dashed rule, large total). */
export function EarningsLines({
  earnings,
  settled = false,
  className,
}: {
  earnings: ProviderBookingDTO["earnings"];
  /** cancelled / no-show: only a retained fee (if any) is paid out */
  settled?: boolean;
  className?: string;
}) {
  const rows: { label: string; detail?: string; value: string; tone?: "minus" }[] = settled
    ? [{ label: "Ausfallgebühr", detail: `abzüglich ${formatPercent(earnings.commissionRate)} Provision`, value: formatPriceExact(earnings.cancellationFeeCents) }]
    : [
        { label: "Behandlung", value: formatPriceExact(earnings.servicePriceCents) },
        {
          label: `Provision · ${formatPercent(earnings.commissionRate)}`,
          detail: TIER_LABEL[earnings.commissionTier],
          value: `−${formatPriceExact(earnings.commissionCents)}`,
          tone: "minus",
        },
        { label: "Anfahrt", detail: "provisionsfrei", value: formatPriceExact(earnings.travelFeeCents) },
      ];
  const total = settled ? (earnings.cancellationFeeCents > 0 ? earnings.payoutCents : 0) : earnings.payoutCents;
  return (
    <dl className={cn("flex flex-col", className)}>
      {rows.map((r) => (
        <div key={r.label} className="flex min-h-9 items-baseline justify-between gap-4 py-1.5">
          <dt className="type-body-s text-ink-muted hyphens-none">
            {r.label}
            {r.detail ? <span className="block type-caption">{r.detail}</span> : null}
          </dt>
          <dd className={cn("type-body-s num", r.tone === "minus" ? "text-ink-muted" : "text-ink")}>{r.value}</dd>
        </div>
      ))}
      <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-dashed border-line-mid pt-3.5">
        <dt className="type-heading-s">Deine Auszahlung</dt>
        <dd className="type-heading-l num tracking-[-0.025em]">{formatPriceExact(total)}</dd>
      </div>
    </dl>
  );
}
