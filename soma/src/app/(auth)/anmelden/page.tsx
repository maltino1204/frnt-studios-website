import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/server/auth/guards";
import { Notice } from "@/components/ui/feedback";
import { Overline } from "@/components/ui/layout";
import { LoginForm } from "@/components/site/auth-login-form";
import { DEMO_MODE } from "@/lib/brand";

export const metadata: Metadata = { title: "Anmelden", robots: { index: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || null;
const safe = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : null);

export default async function AnmeldenPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const next = safe(one(sp.next));
  const session = await getSession();
  if (session) redirect(next ?? homeForRole(session.role));
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Overline>Ihr Konto</Overline>
        <h1 className="type-display-m">Willkommen zurück.</h1>
        <p className="type-body text-ink-muted">Melden Sie sich an, um Termine zu buchen und zu verwalten.</p>
      </div>
      {one(sp.passwort) === "neu" ? <Notice kind="success">Ihr Passwort wurde geändert. Bitte melden Sie sich mit dem neuen Passwort an.</Notice> : null}
      {next?.startsWith("/buchen") ? <Notice kind="info">Ihre Terminauswahl bleibt erhalten. Nach der Anmeldung geht es direkt weiter.</Notice> : null}
      <LoginForm
        next={next}
        demo={
          DEMO_MODE
            ? [
                { label: "Kundin", email: "kundin@soma.test", role: "customer" },
                { label: "Profi", email: "profi@soma.test", role: "provider" },
                { label: "Admin", email: "admin@soma.test", role: "admin" },
              ]
            : undefined
        }
        demoPassword={DEMO_MODE ? "soma-demo-2026" : undefined}
      />
    </div>
  );
}
