import type { Metadata } from "next";
import { requireRole } from "@/server/auth/guards";
import { getNotificationPreferences } from "@/server/services/account";
import { listNotifications } from "@/server/services/notifications";
import { PageHeader } from "@/components/ui/layout";
import { NotificationInbox, NotificationPrefs } from "@/components/site/account-notifications";

export const metadata: Metadata = { title: "Benachrichtigungen" };

export default async function BenachrichtigungenPage() {
  const session = await requireRole("customer", "/konto/benachrichtigungen");
  const [prefs, items] = await Promise.all([getNotificationPreferences(session), listNotifications(session, { limit: 50 })]);
  return (
    <div className="flex flex-col gap-12">
      <PageHeader title="Benachrichtigungen" className="pb-0" />
      <section aria-labelledby="eingang" className="flex flex-col gap-4">
        <h2 id="eingang" className="type-heading-m">
          Mitteilungen
        </h2>
        <NotificationInbox items={items} />
      </section>
      <section aria-labelledby="einstellungen" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="einstellungen" className="type-heading-m">
            Einstellungen
          </h2>
          <p className="type-body-s text-ink-muted">Wichtige Nachrichten zu einer Buchung, etwa eine Absage, senden wir immer.</p>
        </div>
        <NotificationPrefs initial={prefs} />
      </section>
    </div>
  );
}
