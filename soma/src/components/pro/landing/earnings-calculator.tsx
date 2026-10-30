"use client";

import { useId, useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented";
import { formatPriceExact } from "@/lib/format";
import { formatPercent } from "../labels";

type Tier = "base" | "repeat" | "own_client";

/** Live payout example with the real commission tiers (travel fee is commission-free). */
export function EarningsCalculator({ rates }: { rates: { rate: number; repeatClientRate: number; ownClientRate: number } }) {
  const priceId = useId();
  const travelId = useId();
  const [price, setPrice] = useState(85);
  const [travel, setTravel] = useState(5);
  const [tier, setTier] = useState<Tier>("base");
  const rate = tier === "base" ? rates.rate : tier === "repeat" ? rates.repeatClientRate : rates.ownClientRate;
  const priceCents = price * 100;
  const travelCents = travel * 100;
  const commission = Math.round(priceCents * rate);
  const payout = priceCents - commission + travelCents;

  return (
    <div className="flex flex-col gap-6 border border-line bg-surface-raised p-5 md:p-8">
      <div className="flex flex-col gap-2">
        <p className="type-label-s text-ink-muted">Wer bucht?</p>
        <SegmentedControl
          name="tier"
          label="Art der Kundschaft"
          value={tier}
          onChange={(v) => setTier(v as Tier)}
          options={[
            { value: "base", label: "Neu" },
            { value: "repeat", label: "Stammkundschaft" },
            { value: "own_client", label: "Eigene" },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor={priceId} className="type-label-s text-ink-muted">
            Dein Preis für die Behandlung
          </label>
          <span className="type-label num">{formatPriceExact(priceCents)}</span>
        </div>
        <input id={priceId} type="range" min={30} max={250} step={5} value={price} onChange={(e) => setPrice(Number(e.target.value))} aria-valuetext={`${price} Euro`} className="h-touch w-full cursor-pointer accent-[var(--color-ink)]" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor={travelId} className="type-label-s text-ink-muted">
            Deine Anfahrtspauschale
          </label>
          <span className="type-label num">{formatPriceExact(travelCents)}</span>
        </div>
        <input id={travelId} type="range" min={0} max={30} step={1} value={travel} onChange={(e) => setTravel(Number(e.target.value))} aria-valuetext={`${travel} Euro`} className="h-touch w-full cursor-pointer accent-[var(--color-ink)]" />
      </div>
      <dl className="flex flex-col border-t border-line pt-4" aria-live="polite">
        <div className="flex min-h-9 items-baseline justify-between gap-4 py-1">
          <dt className="type-body-s text-ink-muted">Kundschaft zahlt</dt>
          <dd className="type-body-s num">{formatPriceExact(priceCents + travelCents)}</dd>
        </div>
        <div className="flex min-h-9 items-baseline justify-between gap-4 py-1">
          <dt className="type-body-s text-ink-muted">Provision {formatPercent(rate)} auf die Behandlung</dt>
          <dd className="type-body-s num">−{formatPriceExact(commission)}</dd>
        </div>
        <div className="flex min-h-9 items-baseline justify-between gap-4 py-1">
          <dt className="type-body-s text-ink-muted">Provision auf die Anfahrt</dt>
          <dd className="type-body-s num">0,00&nbsp;€</dd>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-4">
          <dt className="type-heading-m">Du erhältst</dt>
          <dd className="type-stat">{formatPriceExact(payout)}</dd>
        </div>
      </dl>
      <p className="type-caption text-ink-muted">Beispielrechnung. Umsatzsteuer und Abgaben regelst du als selbstständiger Profi selbst – auch die Kleinunternehmerregelung ist möglich.</p>
    </div>
  );
}
