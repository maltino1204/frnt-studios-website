import type { Metadata } from "next";
import Link from "next/link";
import { CloudCheck } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Wordmark } from "@/components/brand/logo";
import { routes } from "@/lib/routes";
import { getSession } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Als Profi registrieren",
  description: "Erstelle dein Profi-Profil auf SOMA: Leistungen, Einsatzgebiet, Verfügbarkeit und Verifizierung – Schritt für Schritt, jederzeit speicherbar.",
  robots: { index: false, follow: true },
};

/** Minimal glass chrome for the provider onboarding wizard (voice: du). */
export default async function ProOnboardingLayout({ children }: LayoutProps<"/pro/registrieren">) {
  const session = await getSession();
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <a
        href="#inhalt"
        className="sr-only z-(--z-toast) rounded-full bg-surface-raised px-4 py-3 type-label text-ink shadow-float focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Zum Inhalt springen
      </a>
      <header className="sticky top-0 z-(--z-header) glass-strong shadow-[0_1px_0_var(--glass-hairline)]">
        <div className="mx-auto flex h-14 w-full max-w-content items-center justify-between gap-4 px-(--space-gutter) md:h-16">
          <Link href={routes.forPros()} className="inline-flex min-h-touch items-center gap-3 rounded-control text-ink focus-ring" aria-label="SOMA Pro – für Profis">
            <Wordmark className="h-[18px]! w-auto lg:h-5!" />
            <span className="inline-flex h-5 items-center gap-1 rounded-full bg-ink px-2 text-[11px] leading-none font-[620] tracking-[0.02em] text-ink-inverse">
              <span aria-hidden className="size-1.5 rounded-full bg-ink" />
              Pro
            </span>
          </Link>
          {session?.role === "provider" ? (
            <span className="inline-flex items-center gap-1.5 type-caption text-ink-muted">
              <Icon icon={CloudCheck} size={16} strokeWidth={1.6} className="text-success" />
              <span className="max-sm:sr-only">Jeder Schritt wird gespeichert</span>
              <span className="sm:hidden" aria-hidden>
                Schritte werden gespeichert
              </span>
            </span>
          ) : !session ? (
            <Link href={routes.login("/pro/registrieren")} className="inline-flex h-10 items-center rounded-full px-4 type-label text-ink ring-1 ring-line-mid ring-inset transition-colors pressable focus-ring hover:bg-surface-sunken">
              Anmelden
            </Link>
          ) : null}
        </div>
      </header>
      <main id="inhalt" tabIndex={-1} className="relative isolate flex flex-1 flex-col pb-16 focus:outline-none">
        {children}
      </main>
    </div>
  );
}
