"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUpAction } from "@/server/actions/auth";
import { initialActionState } from "@/server/actions/types";
import { Checkbox, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/feedback";
import { SubmitButton } from "@/components/ui/form";
import { keepValuesOnSubmit } from "./keep-values";
import { routes } from "@/lib/routes";

/** Customer registration (role = customer). Providers register under /pro/registrieren. */
export function RegisterForm({ next, referralCode, inviteCode }: { next?: string | null; referralCode?: string | null; inviteCode?: string | null }) {
  const [state, action, pending] = useActionState(signUpAction, initialActionState);
  const [v, setV] = useState({ firstName: "", lastName: "", email: "", password: "", referral: referralCode ?? "", terms: false, marketing: false });
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="role" value="customer" />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {inviteCode ? <input type="hidden" name="inviteCode" value={inviteCode} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Vorname" name="firstName" autoComplete="given-name" value={v.firstName} onChange={(e) => setV({ ...v, firstName: e.target.value })} error={fe?.firstName} required />
        <Input label="Nachname" name="lastName" autoComplete="family-name" value={v.lastName} onChange={(e) => setV({ ...v, lastName: e.target.value })} error={fe?.lastName} required />
      </div>
      <Input label="E-Mail" name="email" type="email" autoComplete="email" inputMode="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} error={fe?.email} required />
      <Input
        label="Passwort"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Mindestens 10 Zeichen."
        value={v.password}
        onChange={(e) => setV({ ...v, password: e.target.value })}
        error={fe?.password}
        required
      />
      <Input
        label="Empfehlungscode"
        name="referralCode"
        optional
        autoComplete="off"
        value={v.referral}
        onChange={(e) => setV({ ...v, referral: e.target.value.toUpperCase() })}
        error={fe?.referralCode}
        hint={referralCode ? "Mit diesem Code bekommst du ein Startguthaben für deine erste Buchung." : undefined}
      />
      <div className="flex flex-col">
        <Checkbox
          name="acceptTerms"
          checked={v.terms}
          onChange={(e) => setV({ ...v, terms: e.target.checked })}
          error={fe?.acceptTerms}
          label={
            <>
              Ich akzeptiere die{" "}
              <Link href={routes.terms()} target="_blank" className="text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
                AGB
              </Link>{" "}
              und habe die{" "}
              <Link href={routes.privacy()} target="_blank" className="text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current hyphens-none">
                Datenschutzerklärung
              </Link>{" "}
              gelesen.
            </>
          }
        />
        <Checkbox
          name="marketingOptIn"
          checked={v.marketing}
          onChange={(e) => setV({ ...v, marketing: e.target.checked })}
          label="Ich möchte gelegentlich Neuigkeiten und Angebote von SOMA erhalten."
          description="Optional, per Newsletter. Jederzeit abbestellbar."
        />
      </div>
      {state && !state.ok && !fe ? <Notice kind="danger">{state.error}</Notice> : null}
      <SubmitButton variant="accent" size="l" block loading={pending}>
        Konto erstellen
      </SubmitButton>
      <p className="type-body-s text-ink-muted">
        Schon ein Konto?{" "}
        <Link href={routes.login(next ?? undefined)} className="text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
