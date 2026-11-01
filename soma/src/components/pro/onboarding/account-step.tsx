"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Notice } from "@/components/ui/feedback";
import { Checkbox, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/form";
import { keepValuesOnSubmit } from "@/components/site/keep-values";
import { Icon } from "@/components/ui/icon";
import { routes } from "@/lib/routes";
import { signUpAction } from "@/server/actions/auth";
import { stepHref } from "./steps";

/** The sign-up action speaks the customer wording; the provider funnel names its own terms (AGB für Profis) per field. */
const DU_FIELD_MESSAGES: Record<string, string> = {
  firstName: "Bitte gib deinen Vornamen an.",
  lastName: "Bitte gib deinen Nachnamen an.",
  email: "Bitte gib eine gültige E-Mail-Adresse ein.",
  password: "Mindestens 10 Zeichen.",
  acceptTerms: "Bitte akzeptiere die AGB für Profis und die Datenschutzerklärung.",
};


/** Step 1 "Konto": creates a provider account (signUpAction, role = provider) and continues with step 2. */
export function AccountStep() {
  const [state, action, pending] = useActionState(signUpAction, null);
  const [show, setShow] = useState(false);
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};
  const err = (k: string) => (fe[k] ? DU_FIELD_MESSAGES[k] ?? fe[k] : undefined);
  const general = state && !state.ok && !Object.keys(fe).length ? state.error : state && !state.ok && Object.keys(fe).length ? "Bitte prüf die markierten Felder." : null;

  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="role" value="provider" />
      <input type="hidden" name="next" value={stepHref("profil")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input name="firstName" label="Vorname" autoComplete="given-name" required error={err("firstName")} />
        <Input name="lastName" label="Nachname" autoComplete="family-name" required error={err("lastName")} hint="Bleibt privat. Kundschaft sieht nur dein Initial." />
      </div>
      <Input name="email" type="email" label="E-Mail" autoComplete="email" inputMode="email" required error={err("email")} placeholder="z. B. lena@beispiel.de" />
      <div className="relative">
        <Input name="password" type={show ? "text" : "password"} label="Passwort" autoComplete="new-password" required error={err("password")} hint="Mindestens 10 Zeichen." className="[&_input]:pr-12" />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Passwort verbergen" : "Passwort anzeigen"}
          aria-pressed={show}
          className="absolute top-[23px] right-1 inline-flex size-touch items-center justify-center rounded-xs text-ink-muted hover:text-ink"
        >
          <Icon icon={show ? EyeOff : Eye} />
        </button>
      </div>
      <div className="flex flex-col gap-1 pt-1">
        <Checkbox
          name="acceptTerms"
          required
          error={err("acceptTerms")}
          label={
            <>
              Ich akzeptiere die <Link href="/agb-profis" className="text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">AGB für Profis</Link> und habe die{" "}
              <Link href={routes.privacy()} className="text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">Datenschutzerklärung</Link> gelesen.
            </>
          }
        />
        <Checkbox name="marketingOptIn" label="Schick mir Tipps und Neuigkeiten für Profis." description="Höchstens zweimal im Monat, jederzeit abbestellbar." />
      </div>
      <div aria-live="polite">{general ? <Notice kind="danger">{general}</Notice> : null}</div>
      <SubmitButton variant="accent" size="l" className="self-start" loading={pending}>
        Konto erstellen
      </SubmitButton>
      <p className="type-body-s text-ink-muted">
        Schon registriert?{" "}
        <Link href={routes.login("/pro/registrieren")} className="text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
