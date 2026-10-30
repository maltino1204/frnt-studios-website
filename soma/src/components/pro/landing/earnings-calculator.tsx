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
    <div className="flex flex-col gap-6 border border-line bg-surface-raised p-4 sm:p-5 md:p-8">
      <div className="flex flex-col gap-2">
        <p className="type-label-s text-ink-muted">Wer bucht?</p>
        <SegmentedControl
          name="tier"
          label="Art der Kundschaft"
          value={tier}
          onChange={(v) => setTier(v as Tier)}
          options={[
            { value: "base", label: "Neu" },
            { value: "repeat", label: <span className="condensed">Stammkundschaft</span> },
            { value: "own_client", label: "Eigene" },
          ]}
        />
      </div>
      <Slider id={priceId} label="Dein Preis für die Behandlung" value={price} min={30} max={250} step={5} onChange={setPrice} display={formatPriceExact(priceCents)} valueText={`${price} Euro`} />
      <Slider id={travelId} label="Deine Anfahrtspauschale" value={travel} min={0} max={30} step={1} onChange={setTravel} display={formatPriceExact(travelCents)} valueText={`${travel} Euro`} />

      <dl className="flex flex-col border-t border-line pt-4" aria-live="polite">
        <Row label="Kundschaft zahlt" value={formatPriceExact(priceCents + travelCents)} />
        <Row label={`Provision ${formatPercent(rate)} auf die Behandlung`} value={`−${formatPriceExact(commission)}`} />
        <Row label="Provision auf die Anfahrt" value={"0,00 €"} />
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-4">
          <dt className="type-heading-m hyphens-none">Du erhältst pro Termin</dt>
          <dd className="type-stat">{formatPriceExact(payout)}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-5 border-t border-ink pt-6">
        <p className="type-heading-s">Pro Monat</p>
        <Slider id={weeklyId} label="Termine pro Woche" value={weekly} min={1} max={25} step={1} onChange={setWeekly} display={String(weekly)} valueText={`${weekly} Termine pro Woche`} />
        <dl className="flex flex-col" aria-live="polite">
          <Row
            label={`${weekly} × ${WEEKS_PER_MONTH.toLocaleString("de-DE", { maximumFractionDigits: 2 })} Wochen × ${formatPrice(priceCents)} × (1 − ${formatPercent(rate)})`}
            value={formatPrice(monthlyNetTreatments)}
          />
          <Row label="Anfahrt, provisionsfrei" value={`+${formatPrice(monthlyTravel)}`} />
          <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-4">
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
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={valueText}
        className="h-touch w-full cursor-pointer accent-[var(--color-ink)]"
      />
    </div>
  );
}
