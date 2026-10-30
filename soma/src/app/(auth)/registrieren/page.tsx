import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSession, homeForRole } from "@/server/auth/guards";
import { Icon } from "@/components/ui/icon";
import { Overline } from "@/components/ui/layout";
import { RegisterForm } from "@/components/site/auth-register-form";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Konto erstellen", robots: { index: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || null;
const safe = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : null);

export default async function RegistrierenPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const next = safe(one(sp.next));
  const session = await getSession();
  if (session) redirect(next ?? homeForRole(session.role));
  const referral = one(sp.empfehlung)?.slice(0, 16) ?? null;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Overline>Neu bei SOMA</Overline>
        <h1 className="type-display-m">Konto erstellen.</h1>
        <p className="type-body text-ink-muted">Buchen Sie verifizierte Profis zu sich nach Hause, ins Hotel oder ins Büro – und behalten Sie Ihre Termine im Blick.</p>
      </div>
      <RegisterForm next={next} referralCode={referral} inviteCode={one(sp.einladung)?.slice(0, 16) ?? null} />
      <Link
        href={routes.pro.onboarding()}
        className="flex min-h-touch items-center justify-between gap-4 border-y border-line py-4 type-label text-ink hover:text-ink-muted"
      >
        <span>
          Sie sind Profi? <span className="text-accent underline decoration-1 underline-offset-[0.2em]">Hier registrieren</span>
        </span>
        <Icon icon={ArrowRight} />
      </Link>
    </div>
  );
}
