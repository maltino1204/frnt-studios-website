import type { Metadata } from "next";
import { requireRole } from "@/server/auth/guards";
import { getProfile } from "@/server/services/account";
import { PageHeader } from "@/components/ui/layout";
import { DataExportButton, DeleteAccount, PasswordForm, ProfileForm } from "@/components/site/account-profile";
import { SUPPORT_EMAIL } from "@/lib/brand";
import { formatDateLong } from "@/lib/format";

export const metadata: Metadata = { title: "Profil & Sicherheit" };

export default async function ProfilPage() {
  const session = await requireRole("customer", "/konto/profil");
  const profile = await getProfile(session);
  return (
    <div className="flex flex-col gap-10">
      <PageHeader title="Profil & Sicherheit" description={`Kundin oder Kunde seit ${formatDateLong(profile.createdAt)}`} className="pb-0" />
      <section aria-labelledby="angaben" className="flex flex-col gap-5">
        <h2 id="angaben" className="type-heading-m">
          Ihre Angaben
        </h2>
        <ProfileForm profile={profile} />
      </section>
      <section aria-labelledby="passwort" className="flex flex-col gap-5 border-t border-line pt-8">
        <h2 id="passwort" className="type-heading-m">
          Passwort
        </h2>
        <PasswordForm />
      </section>
      <section aria-labelledby="daten" className="flex flex-col gap-5 border-t border-line pt-8">
        <div className="flex flex-col gap-2">
          <h2 id="daten" className="type-heading-m">
            Ihre Daten
          </h2>
          <p className="max-w-reading type-body-s text-ink-muted">
            Laden Sie alles herunter, was wir zu Ihrem Konto speichern: Angaben, Adressen, Buchungen, Bewertungen und Guthaben, als JSON-Datei.
          </p>
        </div>
        <DataExportButton />
      </section>
      <section aria-labelledby="loeschen" className="flex flex-col gap-4 border-t border-line pt-8">
        <div className="flex flex-col gap-2">
          <h2 id="loeschen" className="type-heading-m">
            Konto löschen
          </h2>
          <p className="max-w-reading type-body-s text-ink-muted">
            Wir löschen Ihre persönlichen Angaben und Ihren Zugang. Offene Termine stornieren Sie bitte vorher; Rechnungsdaten bewahren wir ohne Ihre Kontaktdaten so lange auf,
            wie es das Gesetz verlangt. Fragen dazu beantworten wir unter{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent underline underline-offset-[0.2em]">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
        <DeleteAccount email={profile.email} />
      </section>
    </div>
  );
}
