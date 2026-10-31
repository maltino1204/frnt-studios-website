import { InviteCard } from "@/components/pro/invite-card";
import { formatPercent } from "@/components/pro/labels";
import { ProHeader, ProPage } from "@/components/pro/page";
import { CardSection } from "@/components/pro/ui";
import { PasswordForm, SettingsForm } from "@/components/pro/settings-form";
import { Notice } from "@/components/ui/feedback";
import { FactList } from "@/components/ui/layout";
import { routes } from "@/lib/routes";
import { signOutAction } from "@/server/actions/auth";
import { requireRole } from "@/server/auth/guards";
import { getProDashboard, getProSettings } from "@/server/services/pro";
import { getProviderTerms } from "@/server/services/pro-ext";

export const metadata = { title: "Einstellungen" };

export default async function ProSettingsPage() {
  const session = await requireRole("provider", "/pro/einstellungen");
  const [settings, terms, dash] = await Promise.all([getProSettings(session), getProviderTerms(), getProDashboard(session)]);
  const canUseInstant = dash.completedCount >= 3 && (dash.ratingAvg == null || dash.ratingAvg >= 4.5);
  return (
    <ProPage width="narrow">
      <ProHeader back={{ href: routes.pro.profile(), label: "Profil" }} title="Einstellungen" description="Wie Kundschaft dich buchen kann und worüber wir dich informieren." />
      <SettingsForm settings={settings} canUseInstant={canUseInstant} />
      <InviteCard
        inviteUrl={settings.inviteUrl}
        ownClientRateLabel={terms.commission ? formatPercent(terms.commission.ownClientRate) : "5\u00a0%"}
        inactiveNote={dash.status === "approved" ? undefined : "Dein Link funktioniert, sobald dein Profil freigeschaltet ist."}
      />
      <CardSection id="konto" title="Konto" bodyClassName="gap-4">
        <FactList className="border-y border-line" items={[{ label: "E-Mail", value: session.email }, { label: "Einladungscode", value: <span className="code-ref">{settings.inviteCode}</span> }]} />
        {session.isDemoAccount ? (
          // F7: shared demo logins stay usable for the next tester (the server refuses these actions too).
          <Notice kind="info" title="Passwort ändern">
            Im Demo-Zugang deaktiviert – so können alle mit denselben Zugangsdaten testen.
          </Notice>
        ) : (
          <PasswordForm />
        )}
        <form action={signOutAction}>
          <button type="submit" className="inline-flex h-touch items-center rounded-full px-1 type-label text-ink underline decoration-1 underline-offset-[0.2em] focus-ring hover:text-ink-muted">
            Abmelden
          </button>
        </form>
      </CardSection>
    </ProPage>
  );
}
