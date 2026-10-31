"use client";

import { useId, useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { AuraArt } from "@/components/ui/aura";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { updateServiceAreaAction } from "@/server/actions/pro";
import type { ProProfileDTO } from "@/server/dto";
import { centsToInput, parseEuroToCents, travelFeeFor, proError } from "./labels";

const MAX_KM = 30;

/** Range input with an ink fill up to the value, a white thumb with a 3:1 ring and the accent focus glow. */
export const rangeClasses = cn(
  "h-touch w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none",
  "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--color-ink)_var(--fill),var(--color-line-mid)_var(--fill))]",
  "[&::-webkit-slider-thumb]:mt-[-9px] [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-surface-raised [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_var(--color-line-strong),0_2px_8px_rgb(23_22_31/0.18)] [&::-webkit-slider-thumb]:transition-[scale,box-shadow] [&::-webkit-slider-thumb]:duration-spring [&::-webkit-slider-thumb]:ease-spring active:[&::-webkit-slider-thumb]:scale-115",
  "focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_2px_var(--color-focus),0_0_0_8px_var(--color-focus-glow)]",
  "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-line-mid [&::-moz-range-progress]:h-1.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-ink",
  "[&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-surface-raised [&::-moz-range-thumb]:shadow-[0_0_0_1px_var(--color-line-strong),0_2px_8px_rgb(23_22_31/0.18)] focus-visible:[&::-moz-range-thumb]:shadow-[0_0_0_2px_var(--color-focus),0_0_0_8px_var(--color-focus-glow)]",
);
const fill = (v: number, min: number, max: number) => ({ "--fill": `${((v - min) / Math.max(1, max - min)) * 100}%` }) as CSSProperties;

/** Service area: base PLZ, radius 3–30 km, travel fee with a live example (same formula as the server). */
export function AreaForm({
  profile,
  cityLabel,
  submitLabel = "Einsatzgebiet speichern",
  onSaved,
}: {
  profile: Pick<ProProfileDTO, "basePostalCode" | "serviceRadiusKm" | "travelFeeBaseCents" | "travelFeeIncludedKm" | "travelFeePerKmCents">;
  cityLabel?: string | null;
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const radiusId = useId();
  const exampleId = useId();
  const [plz, setPlz] = useState(profile.basePostalCode ?? "");
  const [radius, setRadius] = useState(Math.round(profile.serviceRadiusKm || 10));
  const [base, setBase] = useState(centsToInput(profile.travelFeeBaseCents ?? 0));
  const [included, setIncluded] = useState(Math.round(profile.travelFeeIncludedKm ?? 0));
  const [perKm, setPerKm] = useState(centsToInput(profile.travelFeePerKmCents ?? 0));
  const [example, setExample] = useState(Math.min(6, Math.round(profile.serviceRadiusKm || 10)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const baseCents = parseEuroToCents(base);
  const perKmCents = parseEuroToCents(perKm);
  const cfg = { baseCents: baseCents ?? 0, includedKm: included, perKmCents: perKmCents ?? 0 };
  const ex = Math.min(example, radius);
  const exampleFee = travelFeeFor(ex, cfg);
  const marks = [...new Set([2, 5, 10, 15, 20, 30].filter((d) => d < radius).concat(radius))];

  const save = () => {
    setErrors({});
    setError(null);
    const local: Record<string, string> = {};
    if (!/^\d{5}$/.test(plz.trim())) local.basePostalCode = "Bitte gib eine fünfstellige Postleitzahl ein.";
    if (baseCents === null || baseCents < 0) local.travelFeeBaseCents = "Bitte gib einen Betrag an (0 für keine Pauschale).";
    if (perKmCents === null || perKmCents < 0) local.travelFeePerKmCents = "Bitte gib einen Betrag an (0 für keinen Kilometerpreis).";
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    start(async () => {
      const res = await updateServiceAreaAction({
        basePostalCode: plz.trim(),
        serviceRadiusKm: radius,
        travelFeeBaseCents: baseCents!,
        travelFeeIncludedKm: included,
        travelFeePerKmCents: perKmCents!,
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setError(proError(res.error));
        return;
      }
      toast.show(res.message ?? "Einsatzgebiet gespeichert.");
      if (onSaved) onSaved();
      else router.refresh();
    });
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      noValidate
    >
      <div role="group" aria-labelledby={`${radiusId}-where`} className="grid gap-6 rounded-card bg-surface-raised p-5 shadow-raised md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center lg:gap-8 lg:p-6">
        <RadiusVisual radius={radius} included={included} plz={plz} city={cityLabel && plz === profile.basePostalCode ? cityLabel : null} />
        <div className="flex flex-col gap-6">
          <h2 id={`${radiusId}-where`} className="type-heading-m">
            Wo du arbeitest
          </h2>
          <Input
            label="Postleitzahl deines Standorts"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={plz}
            onChange={(e) => setPlz(e.target.value.replace(/\D/g, "").slice(0, 5))}
            error={errors.basePostalCode}
            placeholder="z. B. 10115"
            hint={cityLabel && plz === profile.basePostalCode ? `${plz} · ${cityLabel}. Deine genaue Adresse ist nie öffentlich.` : "Nur die PLZ – deine genaue Adresse ist nie öffentlich."}
            className="sm:max-w-xs"
          />
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor={radiusId} className="type-label-s text-ink">
                Radius
              </label>
              <span className="type-heading-l num tracking-[-0.025em]" aria-hidden>
                {radius}
                <span className="ml-1 type-label text-ink-muted">km</span>
              </span>
            </div>
            <input
              id={radiusId}
              type="range"
              min={3}
              max={MAX_KM}
              step={1}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              aria-valuetext={`${radius} Kilometer`}
              className={rangeClasses}
              style={fill(radius, 3, MAX_KM)}
            />
            <div className="flex justify-between type-caption text-ink-muted num" aria-hidden>
              <span>3 km</span>
              <span>{MAX_KM} km</span>
            </div>
            {errors.serviceRadiusKm ? <p className="type-caption text-danger">{errors.serviceRadiusKm}</p> : null}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 type-caption text-ink-muted" aria-label="Legende">
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-ink/80" /> nur Pauschale (bis {Math.min(included, radius)} km)
            </li>
            {radius > included ? (
              <li className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded-full bg-white shadow-[0_0_0_1.5px_var(--color-ink)]" /> Pauschale + Kilometerpreis
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div role="group" aria-labelledby={`${radiusId}-travel`} className="flex flex-col gap-6 rounded-card bg-surface-raised p-5 shadow-raised lg:p-6">
        <div className="flex flex-col gap-1">
          <h2 id={`${radiusId}-travel`} className="type-heading-m">
            Anfahrt
          </h2>
          <p className="type-body-s text-ink-muted">Die Anfahrt zahlt die Kundschaft zusätzlich. Sie ist provisionsfrei und geht vollständig an dich.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Pauschale (€)" inputMode="decimal" value={base} onChange={(e) => setBase(e.target.value)} error={errors.travelFeeBaseCents} placeholder="z. B. 5" hint="0–30 €" />
          <Select label="Inklusive bis" value={String(included)} onChange={(e) => setIncluded(Number(e.target.value))} error={errors.travelFeeIncludedKm}>
            {Array.from({ length: 31 }, (_, i) => i).map((k) => (
              <option key={k} value={k}>
                {k === 0 ? "0 km (ab dem ersten km)" : `${k} km`}
              </option>
            ))}
          </Select>
          <Input label="Danach je km (€)" inputMode="decimal" value={perKm} onChange={(e) => setPerKm(e.target.value)} error={errors.travelFeePerKmCents} placeholder="z. B. 0,60" hint="höchstens 2 € pro km" />
        </div>

        <div className="flex flex-col gap-4 rounded-tile bg-surface-sunken/80 p-4 inset-shadow-sunken sm:p-5" aria-live="polite">
          <div className="flex flex-col gap-1">
            <label htmlFor={exampleId} className="type-label-s text-ink-muted">
              Beispiel: Entfernung zur Kundschaft
            </label>
            <input
              id={exampleId}
              type="range"
              min={0}
              max={radius}
              step={1}
              value={ex}
              onChange={(e) => setExample(Number(e.target.value))}
              aria-valuetext={`${ex} Kilometer`}
              className={rangeClasses}
              style={fill(ex, 0, radius)}
            />
          </div>
          <p className="type-heading-m">
            Für <span className="num">{ex}&nbsp;km</span> Entfernung zahlt die Kundschaft <span className="num whitespace-nowrap">{formatPrice(exampleFee)}</span> Anfahrt.
          </p>
          <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {marks.map((d) => (
              <div key={d} className={cn("flex flex-col gap-0.5 rounded-[10px] px-3 py-2 transition-colors duration-fast", d === ex ? "bg-ink text-ink-inverse shadow-ink" : "bg-surface-raised shadow-raised")}>
                <dt className={cn("type-caption num", d === ex ? "text-ink-inverse/70" : "text-ink-muted")}>{d} km</dt>
                <dd className="type-label num">{formatPrice(travelFeeFor(d, cfg))}</dd>
              </div>
            ))}
          </dl>
          <p className="type-caption text-ink-muted">Wird auf 50 Cent gerundet und in Suche, Profil und Checkout im Endpreis angezeigt.</p>
        </div>
      </div>

      <div aria-live="polite">{error ? <Notice kind="danger">{error}</Notice> : null}</div>
      <Button type="submit" size="l" loading={pending} className="self-start max-sm:w-full">
        {submitLabel}
      </Button>
    </form>
  );
}

/**
 * Radius visualisation: concentric rings on the aura, scaled to the 30 km
 * maximum. Inner disc = included distance, ring = service radius. Decorative;
 * the slider and its value are the accessible source.
 */
function RadiusVisual({ radius, included, plz, city }: { radius: number; included: number; plz: string; city: string | null }) {
  const inc = Math.min(included, radius);
  const pct = (km: number) => `${Math.max(8, (km / MAX_KM) * 92)}%`;
  return (
    <div aria-hidden className="relative isolate mx-auto aspect-square w-full max-w-[17rem] overflow-hidden rounded-panel md:max-w-[22rem] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.5)]">
      <AuraArt seed={`radius-${plz || "x"}`} tone="brows-lashes" />
      {/* scale rings: 10, 20, 30 km */}
      {[10, 20, 30].map((km) => (
        <span key={km} className="absolute top-1/2 left-1/2 aspect-square -translate-1/2 rounded-full border border-dashed border-white/55" style={{ width: pct(km) }} />
      ))}
      {/* service radius */}
      <span
        className="absolute top-1/2 left-1/2 aspect-square -translate-1/2 rounded-full bg-white/30 shadow-[0_0_0_1.5px_var(--color-ink),0_20px_60px_-20px_rgb(23_22_31/0.35)] backdrop-blur-[2px] transition-[width] duration-spring ease-settle"
        style={{ width: pct(radius) }}
      >
        <span className="absolute -top-3 left-1/2 inline-flex h-6 -translate-x-1/2 items-center rounded-full bg-ink px-2.5 text-[12px] leading-none font-[600] whitespace-nowrap text-ink-inverse shadow-ink num">
          {radius} km
        </span>
      </span>
      {/* included distance */}
      {inc > 0 ? (
        <span className="absolute top-1/2 left-1/2 aspect-square -translate-1/2 rounded-full bg-ink/12 shadow-[inset_0_0_0_1px_rgb(28_27_25/0.25)] transition-[width] duration-spring ease-settle" style={{ width: pct(inc) }} />
      ) : null}
      {/* centre */}
      <span className="absolute top-1/2 left-1/2 flex -translate-1/2 flex-col items-center gap-1.5">
        <span className="flex size-9 items-center justify-center rounded-full glass-strong glass-edge text-accent shadow-float">
          <MapPin size={18} strokeWidth={1.8} absoluteStrokeWidth />
        </span>
      </span>
      <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
        <span className="inline-flex h-7 items-center rounded-full glass-strong glass-edge px-3 type-label-s text-ink num">{plz || "PLZ"}{city ? ` · ${city}` : ""}</span>
        <span className="inline-flex h-7 items-center rounded-full glass-strong glass-edge px-3 type-caption text-ink num">max. {MAX_KM} km</span>
      </span>
    </div>
  );
}
