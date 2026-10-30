"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { useActionState, useEffect, useId, useState, useTransition } from "react";
import { changePasswordAction } from "@/server/actions/auth";
import { requestAccountDeletionAction, requestDataExportAction, updateProfileAction } from "@/server/actions/account";
import { initialActionState } from "@/server/actions/types";
import type { ProfileDTO } from "@/server/dto";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/feedback";
import { Checkbox, Input } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { keepValuesOnSubmit } from "./keep-values";

/** Name, phone and marketing opt-in. E-mail is shown read-only (login identity). */
export function ProfileForm({ profile }: { profile: ProfileDTO }) {
  const [state, action, pending] = useActionState(updateProfileAction, initialActionState);
  const [v, setV] = useState({
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    phone: profile.phone ?? "",
    marketing: profile.marketingOptIn,
  });
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Vorname" name="firstName" autoComplete="given-name" value={v.firstName} onChange={(e) => setV({ ...v, firstName: e.target.value })} error={fe?.firstName} required />
        <Input label="Nachname" name="lastName" autoComplete="family-name" value={v.lastName} onChange={(e) => setV({ ...v, lastName: e.target.value })} error={fe?.lastName} required />
      </div>
      <Input label="E-Mail" type="email" value={profile.email} readOnly aria-readonly hint="Ihre Anmeldeadresse. Zum Ändern schreiben Sie uns bitte." className="[&_input]:bg-surface-sunken" />
      <Input
        label="Mobilnummer"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        optional
        placeholder="+49 151 23456789"
        hint="Für Rückfragen der Fachkraft am Termintag."
        value={v.phone}
        onChange={(e) => setV({ ...v, phone: e.target.value })}
        error={fe?.phone}
      />
      <Checkbox
        name="marketingOptIn"
        checked={v.marketing}
        onChange={(e) => setV({ ...v, marketing: e.target.checked })}
        label="Neuigkeiten und Angebote von SOMA erhalten"
        description="Jederzeit abbestellbar."
      />
      <FormMessage state={state} />
      <SubmitButton className="self-start" loading={pending}>Änderungen speichern</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialActionState);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  // Cleared only after a successful change (a new key per success); errors keep what was typed.
  const [resets, setResets] = useState(0);
  useEffect(() => {
    if (state?.ok) setResets((n) => n + 1);
  }, [state]);
  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} noValidate className="flex flex-col gap-5" key={resets}>
      <Input label="Aktuelles Passwort" name="currentPassword" type="password" autoComplete="current-password" error={fe?.currentPassword} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Neues Passwort" name="newPassword" type="password" autoComplete="new-password" hint="Mindestens 10 Zeichen." error={fe?.newPassword} required />
        <Input label="Neues Passwort wiederholen" name="newPasswordConfirm" type="password" autoComplete="new-password" error={fe?.newPasswordConfirm} required />
      </div>
      {state && (state.ok || !fe) ? <FormMessage state={state} /> : null}
      <SubmitButton variant="secondary" className="self-start" loading={pending}>
        Passwort ändern
      </SubmitButton>
    </form>
  );
}

/**
 * "Meine Daten exportieren" (Art. 15/20 DSGVO): asks the server for a JSON export of
 * the account and hands it to the browser as a download.
 */
export function DataExportButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const run = () => {
    setResult(null);
    start(async () => {
      const res = await requestDataExportAction();
      if (!res.ok) {
        setResult({ ok: false, text: res.error });
        return;
      }
      const url = URL.createObjectURL(new Blob([res.data.json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = res.data.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setResult({ ok: true, text: `Ihr Datenexport wurde heruntergeladen (${res.data.fileName}).` });
    });
  };
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="secondary" icon={<Icon icon={Download} />} loading={pending} onClick={run}>
        Meine Daten exportieren
      </Button>
      <div aria-live="polite" className="w-full empty:hidden">
        {result ? <Notice kind={result.ok ? "success" : "danger"}>{result.text}</Notice> : null}
      </div>
    </div>
  );
}

/**
 * "Konto löschen" (Art. 17 DSGVO): a modal with the consequences and a password
 * re-confirmation. On success the server signs out and redirects to the home page.
 */
export function DeleteAccount({ email }: { email: string }) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(requestAccountDeletionAction, initialActionState);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} className="self-start text-danger! hover:bg-danger-soft!">
        Konto löschen
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Konto endgültig löschen?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Konto behalten
            </Button>
            <Button type="submit" form={formId} variant="destructive" loading={pending}>
              Endgültig löschen
            </Button>
          </>
        }
      >
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>Name, Mobilnummer, Adressen, Favoriten und Benachrichtigungen werden gelöscht. Sie können sich nicht mehr anmelden.</li>
          <li>Ihr Guthaben verfällt. Vergangene Buchungen bleiben ohne Adresse und Hinweise erhalten, weil wir Rechnungsdaten aufbewahren müssen. Ihre Bewertungen bleiben ohne Namen sichtbar.</li>
          <li>Offene Termine stornieren Sie bitte vorher. Das lässt sich nicht rückgängig machen.</li>
        </ul>
        <form id={formId} action={action} onSubmit={keepValuesOnSubmit(action)} noValidate className="mt-5 flex flex-col gap-3 text-ink">
          <Input
            label="Passwort zur Bestätigung"
            name="password"
            type="password"
            autoComplete="current-password"
            error={fe?.password}
            hint={`Angemeldet als ${email}.`}
            required
          />
          {state && !state.ok && !fe?.password ? <Notice kind="danger">{state.error}</Notice> : null}
          <p className="type-caption text-ink-muted">
            Noch kein Passwort festgelegt?{" "}
            <Link href="/passwort-vergessen" className="text-accent underline underline-offset-[0.2em]">
              Passwort festlegen
            </Link>
          </p>
        </form>
      </Modal>
    </>
  );
}
