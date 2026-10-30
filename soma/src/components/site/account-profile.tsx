"use client";

import { useActionState, useState } from "react";
import { changePasswordAction } from "@/server/actions/auth";
import { updateProfileAction } from "@/server/actions/account";
import { initialActionState } from "@/server/actions/types";
import type { ProfileDTO } from "@/server/dto";
import { Checkbox, Input } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/ui/form";

/** Name, phone and marketing opt-in. E-mail is shown read-only (login identity). */
export function ProfileForm({ profile }: { profile: ProfileDTO }) {
  const [state, action] = useActionState(updateProfileAction, initialActionState);
  const [v, setV] = useState({
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    phone: profile.phone ?? "",
    marketing: profile.marketingOptIn,
  });
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
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
      <SubmitButton className="self-start">Änderungen speichern</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, initialActionState);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} noValidate className="flex flex-col gap-5" key={state?.ok ? "done" : "form"}>
      <Input label="Aktuelles Passwort" name="currentPassword" type="password" autoComplete="current-password" error={fe?.currentPassword} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Neues Passwort" name="newPassword" type="password" autoComplete="new-password" hint="Mindestens 10 Zeichen." error={fe?.newPassword} required />
        <Input label="Neues Passwort wiederholen" name="newPasswordConfirm" type="password" autoComplete="new-password" error={fe?.newPasswordConfirm} required />
      </div>
      {state && (state.ok || !fe) ? <FormMessage state={state} /> : null}
      <SubmitButton variant="secondary" className="self-start">
        Passwort ändern
      </SubmitButton>
    </form>
  );
}
