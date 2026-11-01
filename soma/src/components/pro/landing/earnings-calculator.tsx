"use client";

import { useId, useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented";
import { formatPrice, formatPriceExact } from "@/lib/format";
import { formatPercent } from "../labels";

type Tier = "base" | "repeat" | "own_client";

/** 52 weeks / 12 months */
const WEEKS_PER_MONTH = 52 / 12;

/**
 * Live payout example with the real commission tiers (travel fee is commission-free),
 * plus a monthly projection: bookings per week × average price × (1 − commission) = net.
 */
export function EarningsCalculator({ rates }: { rates: { rate: number; repeatClientRate: number; ownClientRate: number } }) {
  const priceId = useId();
  const travelId = useId();
  const weeklyId = useId();
  const [price, setPrice] = useState(85);
  const [travel, setTravel] = useState(5);
  const [weekly, setWeekly] = useState(6);
  const [tier, setTier] = useState<Tier>("base");
  const rate = tier === "base" ? rates.rate : tier === "repeat" ? rates.repeatClientRate : rates.ownClientRate;
  const priceCents = price * 100;
  const travelCents = travel * 100;
  const commission = Math.round(priceCents * rate);
  const payout = priceCents - commission + travelCents;

  const monthlyBookings = weekly * WEEKS_PER_MONTH;
  // A projection, not a receipt: whole euros.
  const euros = (cents: number) => Math.round(cents / 100) * 100;
  const monthlyNetTreatments = euros(monthlyBookings * priceCents * (1 - rate));
  const monthlyTravel = euros(monthlyBookings * travelCents);
  const monthlyTotal = monthlyNetTreatments + monthlyTravel;

  return (
    <div className="flex flex-col gap-6 rounded-panel bg-surface-raised p-5 shadow-float sm:p-6 md:p-8">
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
      <Slider id={priceId} label="Dein Preis für die Behandlung" value={price} min={30} max={250} step={5} onChange={setPrice} display={formatPriceExact(priceCents)} valueText={`${price} Euro`} />
      <Slider id={travelId} label="Deine Anfahrtspauschale" value={travel} min={0} max={30} step={1} onChange={setTravel} display={formatPriceExact(travelCents)} valueText={`${travel} Euro`} />

      <dl className="flex flex-col border-t border-line pt-4" aria-live="polite">
        {/* Where the customer's money goes: your share, travel (commission-free), commission. */}
        <div aria-hidden className="mb-3 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-surface-sunken">
          <span className="h-full rounded-l-full bg-ink transition-[width] duration-base ease-settle" style={{ width: `${((priceCents - commission) / (priceCents + travelCents)) * 100}%` }} />
          <span className="h-full bg-ink/45 transition-[width] duration-base ease-settle" style={{ width: `${(travelCents / (priceCents + travelCents)) * 100}%` }} />
          <span className="h-full rounded-r-full bg-chart-2 transition-[width] duration-base ease-settle" style={{ width: `${(commission / (priceCents + travelCents)) * 100}%` }} />
        </div>
        <div aria-hidden className="mb-3 flex flex-wrap gap-x-4 gap-y-1 type-caption text-ink-muted">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-ink" />Dein Anteil</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-ink/45" />Anfahrt</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-2" />Provision</span>
        </div>
        <Row label="Kundschaft zahlt" value={formatPriceExact(priceCents + travelCents)} />
        <Row label={`Provision ${formatPercent(rate)} auf die Behandlung`} value={`−${formatPriceExact(commission)}`} />
        <Row label="Provision auf die Anfahrt" value={"0,00 €"} />
        <div className="mt-2 flex items-baseline justify-between gap-4 rounded-tile bg-surface-tint px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--color-line-mid)]">
          <dt className="type-heading-m hyphens-none">Du erhältst pro Termin</dt>
          <dd className="type-stat">{formatPriceExact(payout)}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-5 border-t border-line pt-6">
        <p className="type-heading-s">Pro Monat</p>
        <Slider id={weeklyId} label="Termine pro Woche" value={weekly} min={1} max={25} step={1} onChange={setWeekly} display={String(weekly)} valueText={`${weekly} Termine pro Woche`} />
        <dl className="flex flex-col" aria-live="polite">
          <Row
            label={`${weekly} × ${WEEKS_PER_MONTH.toLocaleString("de-DE", { maximumFractionDigits: 2 })} Wochen × ${formatPrice(priceCents)} × (1 − ${formatPercent(rate)})`}
            value={formatPrice(monthlyNetTreatments)}
          />
          <Row label="Anfahrt, provisionsfrei" value={`+${formatPrice(monthlyTravel)}`} />
          <div className="mt-2 flex items-baseline justify-between gap-4 rounded-tile bg-ink px-4 py-3.5 text-ink-inverse shadow-ink">
            <dt className="type-heading-m hyphens-none">Netto pro Monat</dt>
            <dd className="type-stat">{formatPrice(monthlyTotal)}</dd>
          </div>
        </dl>
      </div>
      <p className="type-caption text-ink-muted">
        Beispielrechnung vor Steuern. Wie viele Termine du bekommst, hängt von Stadt, freien Zeiten und Bewertungen ab. Umsatzsteuer und Abgaben regelst du als selbstständiger Profi
        selbst – auch die Kleinunternehmerregelung ist möglich.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-9 items-baseline justify-between gap-4 py-1">
      <dt className="min-w-0 type-body-s text-ink-muted hyphens-none num">{label}</dt>
      <dd className="shrink-0 type-body-s num">{value}</dd>
    </div>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  valueText,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  valueText: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="type-label-s text-ink-muted">
          {label}
        </label>
        <span className="type-label num">{display}</span>
      </div>
      {/* Custom track: ink fill up to the value; the thumb is a white disc that grows while held. */}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={valueText}
        style={{ ["--p" as string]: `${((value - min) / (max - min)) * 100}%` }}
        className={[
          "h-touch w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none",
          "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--color-ink)_var(--p),var(--color-surface-pressed)_var(--p))]",
          "[&::-webkit-slider-thumb]:-mt-[9px] [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-surface-raised [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgb(37_33_31/0.12),0_2px_6px_rgb(37_33_31/0.18)] [&::-webkit-slider-thumb]:transition-[scale,box-shadow] [&::-webkit-slider-thumb]:duration-spring [&::-webkit-slider-thumb]:ease-spring active:[&::-webkit-slider-thumb]:scale-110",
          "focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_2px_var(--color-focus),0_0_0_8px_var(--color-focus-glow)]",
          "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-surface-pressed [&::-moz-range-progress]:h-1.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-ink",
          "[&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-surface-raised [&::-moz-range-thumb]:shadow-[0_0_0_1px_rgb(37_33_31/0.12),0_2px_6px_rgb(37_33_31/0.18)]",
        ].join(" ")}
      />
    </div>
  );
}
