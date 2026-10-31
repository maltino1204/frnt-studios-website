"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Checkbox, Input, Select } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented";
import { formatPriceExact } from "@/lib/format";
import { createCommissionRuleAction, deactivateCommissionRuleAction, updatePlatformSettingAction } from "@/server/actions/admin";
import type { CommissionRuleDTO } from "@/server/dto";
import { ConfirmButton, ConfirmModal } from "./confirm";
import { centsToInput, formatPercent, parseEuroInput, parsePercentInput, ratioToInput } from "./format";
import { useMutation } from "./use-mutation";

type Scope = CommissionRuleDTO["scope"];
type Option = { id: string; name: string };

const RATE_FIELDS = [
  { key: "rate", label: "Basis", hint: "Neue Kundschaft über SOMA" },
  { key: "repeatClientRate", label: "Stammkundschaft", hint: "Ab der zweiten Buchung beim selben Profi" },
  { key: "ownClientRate", label: "Eigene Kundschaft", hint: "Über den Einladungslink des Profis" },
] as const;
type RateKey = (typeof RATE_FIELDS)[number]["key"];

/** Create or replace a commission rule, with a live example calculation. */
export function CommissionRuleForm({ rules, categories, providers, initial }: { rules: CommissionRuleDTO[]; categories: Option[]; providers: Option[]; initial?: CommissionRuleDTO | null }) {
  const global = rules.find((r) => r.scope === "global" && r.isActive);
  const seed = initial ?? global ?? null;
  const [scope, setScope] = useState<Scope>(initial?.scope ?? "global");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [providerId, setProviderId] = useState(initial?.providerId ?? "");
  const [rates, setRates] = useState<Record<RateKey, string>>({
    rate: seed ? ratioToInput(seed.rate) : "20",
    repeatClientRate: seed ? ratioToInput(seed.repeatClientRate) : "12",
    ownClientRate: seed ? ratioToInput(seed.ownClientRate) : "5",
  });
  const [price, setPrice] = useState("89,00");
  const [travel, setTravel] = useState("10,00");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const m = useMutation(createCommissionRuleAction, { onSuccess: () => setConfirming(false) });

  const parsed = useMemo(() => Object.fromEntries(RATE_FIELDS.map((f) => [f.key, parsePercentInput(rates[f.key])])) as Record<RateKey, number | null>, [rates]);
  const existing = rules.find(
    (r) => r.isActive && r.scope === scope && (scope !== "category" || r.categoryId === categoryId) && (scope !== "provider" || r.providerId === providerId),
  );
  const target = scope === "global" ? "Alle Buchungen" : scope === "category" ? categories.find((c) => c.id === categoryId)?.name : providers.find((p) => p.id === providerId)?.name;
  const priceCents = parseEuroInput(price) ?? 0;
  const travelCents = parseEuroInput(travel) ?? 0;
  const orderWarning = parsed.rate != null && parsed.repeatClientRate != null && parsed.ownClientRate != null && !(parsed.ownClientRate <= parsed.repeatClientRate && parsed.repeatClientRate <= parsed.rate);

  const validate = () => {
    const next: Record<string, string> = {};
    for (const f of RATE_FIELDS) {
      const v = parsed[f.key];
      if (v == null || v < 0 || v > 0.5) next[f.key] = "0 bis 50 %, z. B. 18 oder 12,5.";
    }
    if (scope === "category" && !categoryId) next.categoryId = "Bitte eine Kategorie wählen.";
    if (scope === "provider" && !providerId) next.providerId = "Bitte einen Profi wählen.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const fe: Record<string, string> = { ...m.fieldErrors };
  for (const [k, v] of Object.entries(errors)) if (v) fe[k] = v;

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        m.reset();
        if (validate()) setConfirming(true);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <span className="type-label-s text-ink" id="scope-label">
          Geltung
        </span>
        <SegmentedControl
          dense
          name="scope"
          label="Geltung"
          value={scope}
          onChange={(v) => setScope(v as Scope)}
          options={[
            { value: "global", label: "Global" },
            { value: "category", label: "Kategorie" },
            { value: "provider", label: "Profi" },
          ]}
          className="max-w-md"
        />
        {fe.scope ? <p className="type-caption text-danger">{fe.scope}</p> : null}
      </div>
      {scope === "category" ? (
        <Select dense label="Kategorie" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} error={fe.categoryId} className="max-w-md">
          <option value="">Bitte wählen</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      ) : null}
      {scope === "provider" ? (
        <Select dense label="Profi" value={providerId} onChange={(e) => setProviderId(e.target.value)} error={fe.providerId} className="max-w-md">
          <option value="">Bitte wählen</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        {RATE_FIELDS.map((f) => (
          <Input
            key={f.key}
            dense
            label={`${f.label} (%)`}
            inputMode="decimal"
            value={rates[f.key]}
            onChange={(e) => {
              setRates((r) => ({ ...r, [f.key]: e.target.value }));
              setErrors((x) => ({ ...x, [f.key]: "" }));
            }}
            error={fe[f.key]}
            hint={f.hint}
          />
        ))}
      </div>
      {orderWarning ? <Notice kind="warning">Üblich ist: Eigene Kundschaft ≤ Stammkundschaft ≤ Basis. Sonst lohnt es sich für Profis nicht, Kundschaft auf SOMA zu halten.</Notice> : null}

      <div className="flex flex-col gap-3 rounded-tile bg-surface-sunken/60 px-4 py-4 ring-1 ring-line ring-inset">
        <div className="flex flex-wrap items-start gap-3">
          <p className="w-full type-label-s text-ink-muted">Beispielrechnung</p>
          <Input dense label="Behandlung (€)" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="w-36" />
          <Input dense label="Anfahrt (€)" inputMode="decimal" value={travel} onChange={(e) => setTravel(e.target.value)} className="w-36" hint="provisionsfrei" />
        </div>
        <table className="w-full type-body-s">
          <thead>
            <tr className="border-b border-line text-left type-label-s text-ink-muted">
              <th scope="col" className="py-2 font-[520]">Stufe</th>
              <th scope="col" className="py-2 text-right font-[520]">Satz</th>
              <th scope="col" className="py-2 text-right font-[520]">Provision</th>
              <th scope="col" className="py-2 text-right font-[520]">Profi erhält</th>
            </tr>
          </thead>
          <tbody>
            {RATE_FIELDS.map((f) => {
              const r = parsed[f.key];
              const c = r != null ? Math.round(priceCents * r) : null;
              return (
                <tr key={f.key} className="border-b border-line last:border-b-0">
                  <th scope="row" className="py-2 text-left font-normal">{f.label}</th>
                  <td className="py-2 text-right num">{r != null ? formatPercent(r) : "—"}</td>
                  <td className="py-2 text-right num">{c != null ? formatPriceExact(c) : "—"}</td>
                  <td className="py-2 text-right font-[520] num">{c != null ? formatPriceExact(priceCents - c + travelCents) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="type-caption text-ink-muted">Kundschaft zahlt {formatPriceExact(priceCents + travelCents)}. Reihenfolge der Regeln: Profi → Kategorie → global.</p>
      </div>

      <Notice kind="info">Eine neue Regel ersetzt die aktive Regel derselben Geltung. Bestehende Buchungen behalten den Satz, der bei der Buchung galt.</Notice>
      <div>
        <Button type="submit" size="s">
          Regel speichern
        </Button>
      </div>

      {confirming ? (
        <ConfirmModal
          open
          onClose={() => setConfirming(false)}
          title="Provisionsregel speichern?"
          confirmLabel="Speichern"
          pending={m.pending}
          error={m.error}
          onConfirm={() =>
            m.run({
              scope,
              categoryId: scope === "category" ? categoryId : null,
              providerId: scope === "provider" ? providerId : null,
              rate: parsed.rate!,
              repeatClientRate: parsed.repeatClientRate!,
              ownClientRate: parsed.ownClientRate!,
            })
          }
        >
          <p>
            Geltung: <span className="font-[520] text-ink">{target}</span>
          </p>
          <table className="w-full type-body-s">
            <thead>
              <tr className="border-b border-line text-left type-label-s text-ink-muted">
                <th scope="col" className="py-1.5 font-[520]">Stufe</th>
                <th scope="col" className="py-1.5 text-right font-[520]">Bisher</th>
                <th scope="col" className="py-1.5 text-right font-[520]">Neu</th>
              </tr>
            </thead>
            <tbody>
              {RATE_FIELDS.map((f) => (
                <tr key={f.key} className="border-b border-line last:border-b-0">
                  <th scope="row" className="py-1.5 text-left font-normal">{f.label}</th>
                  <td className="py-1.5 text-right num">{existing ? formatPercent(existing[f.key]) : "—"}</td>
                  <td className="py-1.5 text-right font-[520] text-ink num">{formatPercent(parsed[f.key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>{existing ? "Die bisherige Regel wird deaktiviert und bleibt im Verlauf sichtbar." : "Für diese Geltung gibt es noch keine Regel."} Gilt ab sofort für neue Buchungen.</p>
        </ConfirmModal>
      ) : null}
    </form>
  );
}

export function DeactivateRuleButton({ ruleId, label }: { ruleId: string; label: string }) {
  const m = useMutation(deactivateCommissionRuleAction, { success: "Regel deaktiviert." });
  return (
    <ConfirmButton
      label="Deaktivieren"
      variant="ghost"
      title="Regel deaktivieren?"
      confirmLabel="Deaktivieren"
      confirmVariant="destructive"
      pending={m.pending}
      error={m.error}
      onOpen={m.reset}
      onConfirm={async () => (await m.run(ruleId)).ok}
    >
      <p>Für {label} gilt danach die nächst allgemeinere Regel. Bestehende Buchungen behalten ihren Satz.</p>
    </ConfirmButton>
  );
}

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------

/** One numeric setting with range validation, a warning and a before/after confirmation. */
export function NumberSettingForm({
  settingKey,
  label,
  description,
  value,
  min,
  max,
  unit,
  cents,
  warning,
}: {
  settingKey: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  cents?: boolean;
  warning: string;
}) {
  const show = (v: number) => (cents ? formatPriceExact(v) : `${v.toLocaleString("de-DE")} ${unit}`);
  const [input, setInput] = useState(cents ? centsToInput(value) : String(value));
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const m = useMutation(updatePlatformSettingAction, { success: `${label} gespeichert.`, onSuccess: () => setConfirming(false) });
  const parsed = cents ? parseEuroInput(input) : /^\d{1,4}$/.test(input.trim()) ? Number(input.trim()) : null;
  const dirty = parsed !== value;
  return (
    <form
      noValidate
      className="flex flex-col gap-3 px-4 py-4 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-x-8 sm:px-5"
      onSubmit={(e) => {
        e.preventDefault();
        m.reset();
        if (parsed == null || parsed < min || parsed > max) {
          setError(`Erlaubt: ${show(min)} bis ${show(max)}.`);
          return;
        }
        setError(null);
        if (dirty) setConfirming(true);
      }}
    >
      <div className="flex flex-col gap-1">
        <p className="type-body-s font-[520]">{label}</p>
        <p className="type-caption text-ink-muted">{description}</p>
      </div>
      <div className="flex items-start gap-2">
        <Input
          dense
          label={label}
          hideLabel
          inputMode={cents ? "decimal" : "numeric"}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          error={error ?? m.fieldErrors._ ?? null}
          hint={`${show(min)}–${show(max)}`}
          className="w-36"
        />
        <Button type="submit" size="s" variant="secondary" disabled={!dirty && !error}>
          Speichern
        </Button>
      </div>
      {confirming ? (
        <ConfirmModal open onClose={() => setConfirming(false)} title={`${label} ändern?`} confirmLabel="Ändern" pending={m.pending} error={m.error} onConfirm={() => m.run({ key: settingKey, value: parsed! })}>
          <p className="num">
            {show(value)} → <span className="font-[520] text-ink">{show(parsed!)}</span>
          </p>
          <Notice kind="warning">{warning}</Notice>
        </ConfirmModal>
      ) : null}
    </form>
  );
}

type Tier = { min_hours_before: number; fee_percent: number; travel_fee_retained?: boolean };

/** Cancellation tiers (applies to new bookings only; existing bookings keep their snapshot). */
export function CancellationPolicyForm({ tiers: initialTiers, noShowFeePercent, graceMinutes }: { tiers: Tier[]; noShowFeePercent: number; graceMinutes: number }) {
  const [tiers, setTiers] = useState(
    initialTiers.map((t) => ({ h: String(t.min_hours_before), p: String(t.fee_percent), travel: t.travel_fee_retained ?? t.fee_percent >= 100 })),
  );
  const [noShow, setNoShow] = useState(String(noShowFeePercent));
  const [grace, setGrace] = useState(String(graceMinutes));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const m = useMutation(updatePlatformSettingAction, { success: "Stornobedingungen gespeichert.", onSuccess: () => setConfirming(false) });

  const parse = () => {
    const next: Record<string, string> = {};
    const out: Tier[] = [];
    tiers.forEach((t, i) => {
      const h = Number(t.h.replace(",", "."));
      const p = Number(t.p.replace(",", "."));
      if (!/^\d+([.,]\d+)?$/.test(t.h.trim()) || h < 0 || h > 168) next[`h${i}`] = "0–168 Std.";
      if (!/^\d+([.,]\d+)?$/.test(t.p.trim()) || p < 0 || p > 100) next[`p${i}`] = "0–100 %";
      out.push({ min_hours_before: h, fee_percent: p, travel_fee_retained: t.travel });
    });
    const hours = out.map((t) => t.min_hours_before);
    if (new Set(hours).size !== hours.length) next.tiers = "Jede Staffel braucht eine eigene Stundenangabe.";
    if (!hours.includes(0)) next.tiers = "Eine Staffel muss bei 0 Std. beginnen (gilt bis zum Termin).";
    const ns = Number(noShow.replace(",", "."));
    if (!/^\d+([.,]\d+)?$/.test(noShow.trim()) || ns < 0 || ns > 100) next.noShow = "0–100 %";
    const gm = Number(grace.trim());
    if (!/^\d+$/.test(grace.trim()) || gm > 120) next.grace = "0–120 Min.";
    const sorted = [...out].sort((a, b) => b.min_hours_before - a.min_hours_before);
    if (sorted.some((t, i) => i > 0 && t.fee_percent < sorted[i - 1].fee_percent)) next.order = "Gebühren sollten zum Termin hin steigen.";
    setErrors(next);
    const blocking = Object.keys(next).filter((k) => k !== "order");
    return blocking.length
      ? null
      : { tiers: sorted, no_show_fee_percent: ns, provider_cancellation: "full_refund" as const, grace_minutes: gm, fee_basis: "service_price" as const };
  };
  const [pendingValue, setPendingValue] = useState<ReturnType<typeof parse>>(null);

  return (
    <form
      noValidate
      className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5"
      onSubmit={(e) => {
        e.preventDefault();
        m.reset();
        const v = parse();
        if (v) {
          setPendingValue(v);
          setConfirming(true);
        }
      }}
    >
      <div className="flex flex-col gap-1">
        <p className="type-body-s font-[520]">Stornobedingungen</p>
        <p className="type-caption text-ink-muted">Gebühr in Prozent des Behandlungspreises, je nachdem wie viele Stunden vor dem Termin die Kundschaft storniert. Die Anfahrt wird nur in Staffeln mit „Anfahrt einbehalten“ berechnet und geht dann vollständig an den Profi. Profi-Stornierungen sind immer kostenlos für die Kundschaft.</p>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Staffeln</legend>
        {tiers.map((t, i) => (
          <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-tile bg-surface-sunken/60 py-2 pr-1.5 pl-3 ring-1 ring-line ring-inset">
            <span className="type-body-s text-ink-muted">ab</span>
            <Input dense label={`Staffel ${i + 1}: Stunden vor dem Termin`} hideLabel inputMode="numeric" value={t.h} onChange={(e) => setTiers((all) => all.map((x, j) => (j === i ? { ...x, h: e.target.value } : x)))} error={errors[`h${i}`]} className="w-20" />
            <span className="type-body-s text-ink-muted">Std. vorher</span>
            <Input dense label={`Staffel ${i + 1}: Gebühr in Prozent`} hideLabel inputMode="numeric" value={t.p} onChange={(e) => setTiers((all) => all.map((x, j) => (j === i ? { ...x, p: e.target.value } : x)))} error={errors[`p${i}`]} className="w-20" />
            <span className="mr-2 type-body-s text-ink-muted">% Gebühr</span>
            <Checkbox
              label="Anfahrt einbehalten"
              checked={t.travel}
              onChange={(e) => setTiers((all) => all.map((x, j) => (j === i ? { ...x, travel: e.target.checked } : x)))}
              className="flex-1 [&_label]:min-h-0 [&_label]:py-1"
            />
            <Button size="s" variant="ghost" aria-label={`Staffel ${i + 1} entfernen`} disabled={tiers.length <= 1} onClick={() => setTiers((all) => all.filter((_, j) => j !== i))} icon={<Icon icon={Minus} size={16} />} />
          </div>
        ))}
        {errors.tiers ? <p className="type-caption text-danger">{errors.tiers}</p> : null}
        <div>
          <Button size="s" variant="ghost" disabled={tiers.length >= 6} icon={<Icon icon={Plus} size={16} />} onClick={() => setTiers((all) => [...all, { h: "", p: "", travel: false }])}>
            Staffel hinzufügen
          </Button>
        </div>
      </fieldset>
      <Input dense label="Nicht angetroffen (No-Show), Gebühr in %" hint="Die Anfahrt wird immer berechnet." inputMode="numeric" value={noShow} onChange={(e) => setNoShow(e.target.value)} error={errors.noShow} className="w-56" />
      <Input dense label="Bedenkzeit nach der Buchung in Min." hint="So lange ist jede Stornierung kostenlos." inputMode="numeric" value={grace} onChange={(e) => setGrace(e.target.value)} error={errors.grace} className="w-56" />
      {errors.order ? <Notice kind="warning">{errors.order}</Notice> : null}
      <Notice kind="warning">Gilt nur für neue Buchungen; bestehende behalten ihre Bedingungen. Die Staffel muss zu AGB und Checkout-Text passen – Änderungen vorher rechtlich abstimmen.</Notice>
      <div>
        <Button type="submit" size="s" variant="secondary">
          Stornobedingungen speichern
        </Button>
      </div>
      {confirming && pendingValue ? (
        <ConfirmModal open onClose={() => setConfirming(false)} title="Stornobedingungen ändern?" confirmLabel="Ändern" pending={m.pending} error={m.error} onConfirm={() => m.run({ key: "cancellation_policy", value: pendingValue })}>
          <ul className="flex flex-col gap-1 type-body-s text-ink num">
            {pendingValue.tiers.map((t) => (
              <li key={t.min_hours_before}>
                ab {t.min_hours_before} Std. vorher: {t.fee_percent === 0 ? "kostenlos" : `${t.fee_percent} % des Behandlungspreises`}
                {t.travel_fee_retained ? " zzgl. Anfahrt" : t.fee_percent > 0 ? ", Anfahrt erstattet" : ""}
              </li>
            ))}
            <li>Nicht angetroffen: {pendingValue.no_show_fee_percent} % zzgl. Anfahrt</li>
            <li>Bedenkzeit: {pendingValue.grace_minutes} Min. nach der Buchung</li>
          </ul>
          <p>Neue Buchungen übernehmen diese Staffel ab sofort.</p>
        </ConfirmModal>
      ) : null}
    </form>
  );
}
