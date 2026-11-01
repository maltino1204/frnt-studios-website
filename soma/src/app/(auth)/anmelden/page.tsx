import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/server/auth/guards";
import { safeRelativePath } from "@/server/auth/redirect";
import { getConfig } from "@/server/config";
import { Notice } from "@/components/ui/feedback";
import { Overline } from "@/components/ui/layout";
import { LoginForm } from "@/components/site/auth-login-form";
import { DEMO_MODE } from "@/lib/brand";

export const metadata: Metadata = { title: "Anmelden", robots: { index: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || null;

export default async function AnmeldenPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  // Same guard as the login action (audit-2 N1): same-origin relative paths only, no control characters.
  const next = safeRelativePath(one(sp.next), getConfig().APP_URL);
  const session = await getSession();
  if (session) redirect(next ?? homeForRole(session.role));
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Overline>Dein Konto</Overline>
        <h1 className="type-h1">Willkommen zurück.</h1>
        <p className="type-body text-ink-muted">Melde dich an, um Termine zu buchen und zu verwalten.</p>
      </div>
      {one(sp.passwort) === "neu" ? <Notice kind="success">Dein Passwort wurde geändert. Bitte melde dich mit dem neuen Passwort an.</Notice> : null}
      {next?.startsWith("/buchen") ? <Notice kind="info">Deine Terminauswahl bleibt erhalten. Nach der Anmeldung geht es direkt weiter.</Notice> : null}
      <LoginForm
        next={next}
        demo={
          DEMO_MODE
            ? [
                { label: "Testkunde", email: "testkunde@soma.test", role: "customer" },
                { label: "Testkunde B2B (Profi)", email: "testkunde-b2b@soma.test", role: "provider" },
                { label: "Testadmin", email: "testadmin@soma.test", role: "admin" },
              ]
            : undefined
        }
        demoPassword={DEMO_MODE ? "soma-demo-2026" : undefined}
      />
    </div>
  );
}
