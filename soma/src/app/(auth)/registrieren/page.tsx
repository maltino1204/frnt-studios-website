import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSession, homeForRole } from "@/server/auth/guards";
import { safeRelativePath } from "@/server/auth/redirect";
import { getConfig } from "@/server/config";
import { Icon } from "@/components/ui/icon";
import { Overline } from "@/components/ui/layout";
import { RegisterForm } from "@/components/site/auth-register-form";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Konto erstellen", robots: { index: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || null;

export default async function RegistrierenPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  // Same guard as the login action (audit-2 N1): same-origin relative paths only, no control characters.
  const next = safeRelativePath(one(sp.next), getConfig().APP_URL);
  const session = await getSession();
  if (session) redirect(next ?? homeForRole(session.role));
  const referral = one(sp.empfehlung)?.slice(0, 16) ?? null;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Overline>Neu bei SOMA</Overline>
        <h1 className="type-h1">Konto erstellen.</h1>
        <p className="type-body text-ink-muted">Buchen Sie verifizierte Profis zu sich nach Hause, ins Hotel oder ins Büro – und behalten Sie Ihre Termine im Blick.</p>
      </div>
      <RegisterForm next={next} referralCode={referral} inviteCode={one(sp.einladung)?.slice(0, 16) ?? null} />
      <Link
        href={routes.pro.onboarding()}
        className="group flex min-h-touch items-center justify-between gap-4 rounded-card bg-surface-raised px-5 py-4 type-label text-ink shadow-raised pressable focus-ring hover:-translate-y-px hover:shadow-float"
      >
        <span>
          Sie sind Profi? <span className="text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">Hier registrieren</span>
        </span>
        <Icon icon={ArrowRight} className="transition-transform duration-base ease-settle group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
