import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { routes } from "@/lib/routes";
import { getSession } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Als Profi registrieren",
  description: "Erstelle dein Profi-Profil auf SOMA: Leistungen, Einsatzgebiet, Verfügbarkeit und Verifizierung – Schritt für Schritt, jederzeit speicherbar.",
  robots: { index: false, follow: true },
};

/** Minimal chrome for the provider onboarding wizard (voice: du). */
export default async function ProOnboardingLayout({ children }: LayoutProps<"/pro/registrieren">) {
  const session = await getSession();
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-content items-center justify-between gap-4 px-(--space-gutter) md:h-18">
          <Link href={routes.forPros()} className="inline-flex items-center gap-3 text-ink" aria-label="SOMA für Profis">
            <Wordmark className="h-[18px]! w-auto lg:h-5!" />
            <span className="border-l border-line-strong pl-3 type-label-s text-ink-muted">Für Profis</span>
          </Link>
          {session?.role === "provider" ? (
            <span className="type-caption text-ink-muted">Jeder Schritt wird gespeichert</span>
          ) : !session ? (
            <Link href={routes.login("/pro/registrieren")} className="inline-flex h-touch items-center type-label text-ink hover:underline hover:underline-offset-4">
              Anmelden
            </Link>
          ) : null}
        </div>
      </header>
      <main id="inhalt" className="flex flex-1 flex-col pb-16">
        {children}
      </main>
    </div>
  );
}
