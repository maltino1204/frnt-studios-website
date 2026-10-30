"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { updateServiceAreaAction } from "@/server/actions/pro";
import type { ProProfileDTO } from "@/server/dto";
import { centsToInput, parseEuroToCents, travelFeeFor } from "./labels";

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
        setError(res.error);
        return;
      }
      toast.show(res.message ?? "Einsatzgebiet gespeichert.");
      if (onSaved) onSaved();
      else router.refresh();
    });
  };

  return (
    <form
      className="flex flex-col gap-10"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      noValidate
    >
      <fieldset className="flex flex-col gap-6">
        <legend className="mb-4 type-heading-m">Wo du arbeitest</legend>
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
          className="max-w-xs"
        />
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={radiusId} className="type-label-s text-ink">
              Radius
            </label>
            <span className="type-heading-m num">{radius} km</span>
          </div>
          <input
            id={radiusId}
            type="range"
            min={3}
            max={30}
            step={1}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            aria-valuetext={`${radius} Kilometer`}
            className="h-touch w-full cursor-pointer accent-[var(--color-ink)]"
          />
          <RadiusBar radius={radius} included={included} />
          {errors.serviceRadiusKm ? <p className="type-caption text-danger">{errors.serviceRadiusKm}</p> : null}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-2 type-heading-m">Anfahrt</legend>
        <p className="-mt-2 type-body-s text-ink-muted">Die Anfahrt zahlt die Kundschaft zusätzlich. Sie ist provisionsfrei und geht vollständig an dich.</p>
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

        <div className="flex flex-col gap-4 border border-line bg-surface-raised p-5" aria-live="polite">
          <div className="flex flex-col gap-2">
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
              className="h-touch w-full cursor-pointer accent-[var(--color-ink)]"
            />
          </div>
          <p className="type-heading-m">
            Für <span className="num">{ex}&nbsp;km</span> Entfernung zahlen Kund:innen <span className="num">{formatPrice(exampleFee)}</span> Anfahrt.
          </p>
          <dl className="grid grid-cols-3 gap-px border border-line bg-line sm:grid-cols-6">
            {marks.map((d) => (
              <div key={d} className="flex flex-col gap-0.5 bg-surface-raised px-3 py-2">
                <dt className="type-caption text-ink-muted num">{d} km</dt>
                <dd className="type-label num">{formatPrice(travelFeeFor(d, cfg))}</dd>
              </div>
            ))}
          </dl>
          <p className="type-caption text-ink-muted">Wird auf 50 Cent gerundet und in Suche, Profil und Checkout im Endpreis angezeigt.</p>
        </div>
      </fieldset>

      <div aria-live="polite">{error ? <Notice kind="danger">{error}</Notice> : null}</div>
      <Button type="submit" size="l" loading={pending} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}

/** Linear scale 0–30 km: included distance (ink), charged distance (line-strong), outside (line). */
function RadiusBar({ radius, included }: { radius: number; included: number }) {
  const inc = Math.min(included, radius);
  return (
    <div aria-hidden className="flex flex-col gap-1.5">
      <div className="flex h-2 w-full overflow-hidden bg-line">
        <span className="h-full bg-ink" style={{ width: `${(inc / 30) * 100}%` }} />
        <span className="h-full bg-line-strong" style={{ width: `${((radius - inc) / 30) * 100}%` }} />
      </div>
      <div className="flex justify-between type-caption text-ink-muted num">
        <span>0 km</span>
        <span>30 km</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 type-caption text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 bg-ink" /> nur Pauschale
        </span>
        <span className={cn("inline-flex items-center gap-1.5", radius === inc && "hidden")}>
          <span className="size-2 bg-line-strong" /> Pauschale + Kilometerpreis
        </span>
      </div>
    </div>
  );
}
