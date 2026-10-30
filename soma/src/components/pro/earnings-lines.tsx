import { cn } from "@/lib/cn";
import { formatPriceExact } from "@/lib/format";
import type { ProviderBookingDTO } from "@/server/dto";
import { formatPercent, TIER_LABEL } from "./labels";

/** Provider-side breakdown: treatment − commission + travel fee = payout (36px rows, no box). */
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
  if (settled) {
    return (
      <dl className={cn("flex flex-col", className)}>
        <div className="flex min-h-9 items-baseline justify-between gap-4 py-1.5">
          <dt className="type-body-s text-ink-muted hyphens-none">
            Ausfallgebühr
            <span className="block type-caption">abzüglich {formatPercent(earnings.commissionRate)} Provision</span>
          </dt>
          <dd className="type-body-s num text-ink">{formatPriceExact(earnings.cancellationFeeCents)}</dd>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3">
          <dt className="type-heading-m">Deine Auszahlung</dt>
          <dd className="type-heading-m num">{formatPriceExact(earnings.cancellationFeeCents > 0 ? earnings.payoutCents : 0)}</dd>
        </div>
      </dl>
    );
  }
  const rows: { label: string; detail?: string; value: string; muted?: boolean }[] = [
    { label: "Behandlung", value: formatPriceExact(earnings.servicePriceCents) },
    {
      label: `Provision · ${formatPercent(earnings.commissionRate)}`,
      detail: TIER_LABEL[earnings.commissionTier],
      value: `−${formatPriceExact(earnings.commissionCents)}`,
    },
    { label: "Anfahrt", detail: "provisionsfrei", value: formatPriceExact(earnings.travelFeeCents) },
  ];
  return (
    <dl className={cn("flex flex-col", className)}>
      {rows.map((r) => (
        <div key={r.label} className="flex min-h-9 items-baseline justify-between gap-4 py-1.5">
          <dt className="type-body-s text-ink-muted hyphens-none">
            {r.label}
            {r.detail ? <span className="block type-caption">{r.detail}</span> : null}
          </dt>
          <dd className="type-body-s num text-ink">{r.value}</dd>
        </div>
      ))}
      <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt className="type-heading-m">Deine Auszahlung</dt>
        <dd className="type-heading-m num">{formatPriceExact(earnings.payoutCents)}</dd>
      </div>
    </dl>
  );
}
