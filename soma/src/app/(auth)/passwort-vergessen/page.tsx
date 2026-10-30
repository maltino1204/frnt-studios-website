import type { Metadata } from "next";
import Link from "next/link";
import { Overline } from "@/components/ui/layout";
import { ResetPasswordForm, ResetRequestForm } from "@/components/site/auth-reset-form";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Passwort vergessen", robots: { index: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || null;

export default async function PasswortPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const token = one(sp.token);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Overline>Passwort</Overline>
        <h1 className="type-display-m">{token ? "Neues Passwort festlegen." : "Passwort vergessen."}</h1>
        <p className="type-body text-ink-muted">
          {token
            ? "Wählen Sie ein neues Passwort mit mindestens 10 Zeichen."
            : "Geben Sie Ihre E-Mail-Adresse ein. Wir schicken Ihnen einen Link, mit dem Sie ein neues Passwort festlegen."}
        </p>
      </div>
      {token ? <ResetPasswordForm token={token} /> : <ResetRequestForm />}
      <p className="type-body-s text-ink-muted">
        <Link href={routes.login()} className="text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover">
          Zurück zur Anmeldung
        </Link>
      </p>
    </div>
  );
}
