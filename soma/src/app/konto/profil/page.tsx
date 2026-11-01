import type { Metadata } from "next";
import { requireRole } from "@/server/auth/guards";
import { getProfile } from "@/server/services/account";
import { Download, KeyRound, Trash2, UserRound, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Notice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/layout";
import { DataExportButton, DeleteAccount, PasswordForm, ProfileForm } from "@/components/site/account-profile";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import { formatDateLong } from "@/lib/format";

export const metadata: Metadata = { title: "Profil & Sicherheit" };

/** F7: shared demo logins stay usable for the next tester (the server refuses these actions too). */
function DemoNotice() {
  return (
    <Notice kind="info" className="max-w-reading">
      Im Demo-Zugang deaktiviert – so können alle mit denselben Zugangsdaten testen.
    </Notice>
  );
}

/** A settings card: icon tile, title, optional lead, content. */
function Card({ id, icon, title, lead, danger, children }: { id: string; icon: LucideIcon; title: string; lead?: React.ReactNode; danger?: boolean; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className={cn("flex flex-col gap-5 rounded-card bg-surface-raised p-5 shadow-raised md:p-7", danger && "ring-1 ring-danger/10 ring-inset")}>
      <div className="flex items-start gap-3.5">
        <span aria-hidden className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full", danger ? "bg-danger-soft text-danger" : "bg-surface-sunken text-ink")}>
          <Icon icon={icon} size={18} />
        </span>
        <div className="flex min-w-0 flex-col gap-1 pt-1.5">
          <h2 id={id} className="type-heading-m">
            {title}
          </h2>
          {lead ? <div className="max-w-reading type-body-s text-ink-muted">{lead}</div> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function ProfilPage() {
  const session = await requireRole("customer", "/konto/profil");
  const profile = await getProfile(session);
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email;
  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <PageHeader title="Profil & Sicherheit" description={`Bei ${BRAND_NAME} seit ${formatDateLong(profile.createdAt)}`} className="pb-1" />
      <Card id="angaben" icon={UserRound} title="Deine Angaben">
        <div className="flex items-center gap-3.5 rounded-tile bg-surface-sunken p-3.5">
          <Avatar src={profile.avatarUrl} name={fullName} size={48} />
          <div className="min-w-0">
            <p className="truncate type-label text-ink">{fullName}</p>
            <p className="truncate type-caption text-ink-muted">{profile.email}</p>
          </div>
        </div>
        <ProfileForm profile={profile} />
      </Card>
      <Card id="passwort" icon={KeyRound} title="Passwort">
        {session.isDemoAccount ? <DemoNotice /> : <PasswordForm />}
      </Card>
      <Card
        id="daten"
        icon={Download}
        title="Deine Daten"
        lead="Lade alles herunter, was wir zu deinem Konto speichern: Angaben, Adressen, Buchungen, Bewertungen und Guthaben, als JSON-Datei."
      >
        <DataExportButton />
      </Card>
      <Card
        id="loeschen"
        icon={Trash2}
        title="Konto löschen"
        danger
        lead={
          <>
            Wir löschen deine persönlichen Angaben und deinen Zugang. Offene Termine storniere bitte vorher; Rechnungsdaten bewahren wir ohne deine Kontaktdaten so lange auf,
            wie es das Gesetz verlangt. Fragen dazu beantworten wir unter{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
              {SUPPORT_EMAIL}
            </a>
            .
          </>
        }
      >
        {session.isDemoAccount ? <DemoNotice /> : <DeleteAccount email={profile.email} />}
      </Card>
    </div>
  );
}
