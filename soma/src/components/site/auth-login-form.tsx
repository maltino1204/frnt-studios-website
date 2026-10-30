"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction } from "@/server/actions/auth";
import { initialActionState } from "@/server/actions/types";
import { Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/feedback";
import { SubmitButton } from "@/components/ui/form";
import { routes } from "@/lib/routes";

export type DemoAccount = { label: string; email: string; role: string };

/** Login form. Field labels "E-Mail" / "Passwort" and the button "Anmelden" are relied on by QA scripts. */
export function LoginForm({ next, demo, demoPassword }: { next?: string | null; demo?: DemoAccount[]; demoPassword?: string }) {
  const [state, action] = useActionState(signInAction, initialActionState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <div className="flex flex-col gap-8">
      <form action={action} noValidate className="flex flex-col gap-5">
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
          <Link href="/passwort-vergessen" className="inline-flex h-touch items-center self-end type-label-s text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover">
            Passwort vergessen?
          </Link>
        </div>
        {state && !state.ok && !fe ? <Notice kind="danger">{state.error}</Notice> : null}
        <SubmitButton size="l" block>
          Anmelden
        </SubmitButton>
        <p className="type-body-s text-ink-muted">
          Noch kein Konto?{" "}
          <Link href={routes.register(next ?? undefined)} className="text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover">
            Jetzt registrieren
          </Link>
        </p>
      </form>

      {demo?.length ? (
        <section aria-labelledby="demo-titel" className="flex flex-col gap-3 border-t border-line pt-6">
          <div className="flex flex-col gap-1">
            <h2 id="demo-titel" className="type-overline text-ink-muted">
              Demo-Zugänge
            </h2>
            <p className="type-caption text-ink-muted">
              Füllt die Zugangsdaten aus. Passwort für alle: <span className="code-ref text-ink">{demoPassword}</span>
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {demo.map((d) => (
              <li key={d.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(demoPassword ?? "");
                  }}
                  className="inline-flex h-touch flex-col items-start justify-center rounded-xs border border-line-strong bg-surface-raised px-3.5 text-left transition-colors duration-fast hover:border-ink"
                  aria-label={`Demo-Zugang ${d.label} einsetzen (${d.email})`}
                >
                  <span className="type-label-s text-ink">{d.label}</span>
                  <span className="type-caption text-ink-muted">{d.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
