import type { Metadata } from "next";
import { requireRole } from "@/server/auth/guards";
import { getProfile } from "@/server/services/account";
import { PageHeader } from "@/components/ui/layout";
import { PasswordForm, ProfileForm } from "@/components/site/account-profile";
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
      <section aria-labelledby="loeschen" className="flex flex-col gap-2 border-t border-line pt-8">
        <h2 id="loeschen" className="type-heading-m">
          Konto löschen
        </h2>
        <p className="max-w-reading type-body-s text-ink-muted">
          Sie können die Löschung Ihres Kontos und Ihrer Daten jederzeit verlangen. Schreiben Sie uns dazu von Ihrer Anmeldeadresse an{" "}
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Konto löschen")}`} className="text-accent underline underline-offset-[0.2em]">
            {SUPPORT_EMAIL}
          </a>
          . Offene Termine sollten Sie vorher stornieren; Rechnungsdaten bewahren wir so lange auf, wie es das Gesetz verlangt.
        </p>
      </section>
    </div>
  );
}
