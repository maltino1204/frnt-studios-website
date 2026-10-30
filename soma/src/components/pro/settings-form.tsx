"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Input, RadioRow, Select, Switch } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { keepValuesOnSubmit } from "@/components/site/keep-values";
import { useToast } from "@/components/ui/toast";
import { changePasswordAction } from "@/server/actions/auth";
import { updateProSettingsAction } from "@/server/actions/pro";
import type { BookingMode, NotificationPreferencesDTO, ProSettingsDTO, VatMode } from "@/server/dto";
import { proError, VAT_MODE_OPTIONS } from "./labels";

const LEAD_TIMES = [60, 120, 180, 240, 360, 720, 1440, 2880];
const BUFFERS = [15, 30, 45, 60];
const ADVANCE = [7, 14, 30, 60, 90, 120, 180];

const leadLabel = (m: number) => (m < 1440 ? `${m / 60} ${m === 60 ? "Stunde" : "Stunden"}` : `${m / 1440} ${m === 1440 ? "Tag" : "Tage"}`);

const NOTIFY: { key: keyof NotificationPreferencesDTO; label: string; description: string }[] = [
  { key: "emailBookings", label: "E-Mail bei neuen Anfragen und Buchungen", description: "Empfohlen – damit dir keine Anfrage entgeht." },
  { key: "pushBookings", label: "Push-Mitteilungen", description: "Auf diesem Gerät, wenn SOMA als App installiert ist." },
  { key: "emailReminders", label: "Erinnerung per E-Mail", description: "24 Stunden vor jedem Termin." },
  { key: "smsReminders", label: "Erinnerung per SMS", description: "Für kurzfristige Termine." },
  { key: "emailMarketing", label: "Tipps und Neuigkeiten für Profis", description: "Höchstens zweimal im Monat." },
];

/** Booking mode, lead time, buffer, max advance and notification channels. */
export function SettingsForm({ settings, canUseInstant }: { settings: ProSettingsDTO; canUseInstant: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<BookingMode>(settings.bookingMode);
  const [lead, setLead] = useState(settings.leadTimeMinutes);
  const [buffer, setBuffer] = useState(settings.travelBufferMinutes);
  const [advance, setAdvance] = useState(settings.maxAdvanceDays);
  const [vatMode, setVatMode] = useState<VatMode>(settings.vatMode);
  const [prefs, setPrefs] = useState<NotificationPreferencesDTO>(settings.notificationPreferences);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const withCurrent = (list: number[], v: number) => (list.includes(v) ? list : [...list, v].sort((a, b) => a - b));

  const save = () =>
    start(async () => {
      setErrors({});
      setError(null);
      const res = await updateProSettingsAction({ bookingMode: mode, leadTimeMinutes: lead, travelBufferMinutes: buffer, maxAdvanceDays: advance, vatMode, notificationPreferences: prefs });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setError(proError(res.error));
        return;
      }
      toast.show(res.message ?? "Einstellungen gespeichert.");
      router.refresh();
    });

  return (
    <form
      className="flex flex-col gap-10"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 type-heading-m">Buchungsmodus</legend>
        <div className="border-y border-line">
          <RadioRow
            name="bookingMode"
            value="request"
            checked={mode === "request"}
            onChange={() => setMode("request")}
            label="Auf Anfrage"
            description="Du bestätigst jede Buchung selbst. Die Zahlung ist bis zu deiner Antwort nur reserviert."
          />
          <RadioRow
            name="bookingMode"
            value="instant"
            checked={mode === "instant"}
            onChange={() => setMode("instant")}
            disabled={!canUseInstant && settings.bookingMode !== "instant"}
            label="Sofort bestätigen"
            description={
              canUseInstant
                ? "Freie Zeiten sind direkt buchbar. Profis mit Sofortbuchung erscheinen in der Suche weiter oben."
                : "Wird nach drei abgeschlossenen Terminen mit mindestens 4,5 Sternen verfügbar."
            }
          />
        </div>
        {errors.bookingMode ? <p className="type-caption text-danger">{errors.bookingMode}</p> : null}
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-2 type-heading-m">Planung</legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <Select label="Vorlaufzeit" value={String(lead)} onChange={(e) => setLead(Number(e.target.value))} error={errors.leadTimeMinutes} hint="Frühestens so lange vorher buchbar">
            {withCurrent(LEAD_TIMES, lead).map((m) => (
              <option key={m} value={m}>
                {leadLabel(m)}
              </option>
            ))}
          </Select>
          <Select label="Puffer zwischen Terminen" value={String(buffer)} onChange={(e) => setBuffer(Number(e.target.value))} error={errors.travelBufferMinutes} hint="Für Anfahrt und Aufbau">
            {withCurrent(BUFFERS, buffer).map((m) => (
              <option key={m} value={m}>
                {m} Min.
              </option>
            ))}
          </Select>
          <Select label="Buchbar im Voraus" value={String(advance)} onChange={(e) => setAdvance(Number(e.target.value))} error={errors.maxAdvanceDays} hint="So weit reicht dein Kalender">
            {withCurrent(ADVANCE, advance).map((d) => (
              <option key={d} value={d}>
                {d} Tage
              </option>
            ))}
          </Select>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-2 type-heading-m">Umsatzsteuer</legend>
        <Select
          label="Umsatzsteuer"
          value={vatMode}
          onChange={(e) => setVatMode(e.target.value as VatMode)}
          error={errors.vatMode}
          hint="Bestimmt den Preishinweis für deine Kundschaft. Bestehende Buchungen behalten ihren Hinweis."
        >
          {VAT_MODE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </fieldset>

      <fieldset className="flex flex-col">
        <legend className="mb-2 type-heading-m">Benachrichtigungen</legend>
        <div className="divide-y divide-line border-y border-line">
          {NOTIFY.map((n) => (
            <Switch key={n.key} label={n.label} description={n.description} checked={prefs[n.key]} onChange={(e) => setPrefs({ ...prefs, [n.key]: e.target.checked })} className="py-3" />
          ))}
        </div>
      </fieldset>

      <div aria-live="polite">{error ? <Notice kind="danger">{error}</Notice> : null}</div>
      <Button type="submit" size="l" loading={pending} className="self-start">
        Einstellungen speichern
      </Button>
    </form>
  );
}

/** Password change (changePasswordAction, form action). */
export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};
  // Cleared only after a successful change; errors keep what was typed (N5).
  const [resets, setResets] = useState(0);
  useEffect(() => {
    if (state?.ok) setResets((n) => n + 1);
  }, [state]);
  return (
    <form key={resets} action={action} onSubmit={keepValuesOnSubmit(action)} className="flex flex-col gap-5" noValidate>
      <Input name="currentPassword" type="password" label="Aktuelles Passwort" autoComplete="current-password" error={fe.currentPassword} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input name="newPassword" type="password" label="Neues Passwort" autoComplete="new-password" hint="Mindestens 10 Zeichen" error={fe.newPassword} />
        <Input name="newPasswordConfirm" type="password" label="Neues Passwort wiederholen" autoComplete="new-password" error={fe.newPasswordConfirm} />
      </div>
      <div aria-live="polite">
        {state?.ok ? <Notice kind="success">Dein Passwort wurde geändert.</Notice> : <FormMessage state={state} />}
      </div>
      <SubmitButton variant="secondary" className="self-start" loading={pending}>
        Passwort ändern
      </SubmitButton>
    </form>
  );
}
