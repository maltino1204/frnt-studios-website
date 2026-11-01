"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction } from "@/server/actions/auth";
import { initialActionState } from "@/server/actions/types";
import { Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/feedback";
import { SubmitButton } from "@/components/ui/form";
import { keepValuesOnSubmit } from "./keep-values";
import { routes } from "@/lib/routes";

export type DemoAccount = { label: string; email: string; role: string };

/** Login form. Field labels "E-Mail" / "Passwort" and the button "Anmelden" are relied on by QA scripts. */
export function LoginForm({ next, demo, demoPassword }: { next?: string | null; demo?: DemoAccount[]; demoPassword?: string }) {
  const [state, action, pending] = useActionState(signInAction, initialActionState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <div className="flex flex-col gap-8">
      <form action={action} onSubmit={keepValuesOnSubmit(action)} noValidate className="flex flex-col gap-5">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Input
          label="E-Mail"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fe?.email}
          required
        />
        <div className="flex flex-col gap-1.5">
          <Input
            label="Passwort"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fe?.password}
            required
          />
          <Link href="/passwort-vergessen" className="inline-flex h-touch items-center self-end rounded-full type-label-s text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current focus-ring">
            Passwort vergessen?
          </Link>
        </div>
        {state && !state.ok && !fe ? <Notice kind="danger">{state.error}</Notice> : null}
        <SubmitButton variant="accent" size="l" block loading={pending}>
          Anmelden
        </SubmitButton>
        <p className="type-body-s text-ink-muted">
          Noch kein Konto?{" "}
          <Link href={routes.register(next ?? undefined)} className="text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
            Jetzt registrieren
          </Link>
        </p>
      </form>

      {demo?.length ? (
        <section aria-labelledby="demo-titel" className="flex flex-col gap-3 rounded-card bg-surface-sunken/70 p-4 sm:p-5">
          <div className="flex flex-col gap-1">
            <h2 id="demo-titel" className="type-overline text-ink-muted">
              Demo-Zugänge
            </h2>
            <p className="type-caption text-ink-muted">
              Füllt die Zugangsdaten aus. Passwort für alle: <span className="font-semibold text-ink num">{demoPassword}</span>
            </p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-3">
            {demo.map((d) => (
              <li key={d.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(demoPassword ?? "");
                  }}
                  className="inline-flex min-h-touch w-full flex-col items-start justify-center rounded-tile bg-surface-raised px-3 py-2 text-left shadow-raised pressable focus-ring hover:-translate-y-px hover:shadow-float"
                >
                  <span className="type-label-s text-ink">
                    {d.label}
                    <span className="sr-only">{`: Demo-Zugang einsetzen (${d.email})`}</span>
                  </span>
                  <span aria-hidden className="w-full truncate type-caption text-ink-muted">
                    {d.email.replace("@soma.test", "@…")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
