import type { Metadata } from "next";
import Link from "next/link";
import { CancellationPolicyForm, CommissionRuleForm, DeactivateRuleButton, NumberSettingForm } from "@/components/admin/commission-forms";
import { formatDateTime, formatPercent } from "@/components/admin/format";
import { AdminPageHeader, AdminSection, MutedLink } from "@/components/admin/page";
import { AdminTable, hrefWith, numCell } from "@/components/admin/table";
import { Status } from "@/components/ui/feedback";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { CommissionRuleDTO } from "@/server/dto";
import { listCategoriesAdmin, listCommissionRules, listPlatformSettings, listProvidersAdmin } from "@/server/services/admin";

export const metadata: Metadata = { title: "Provisionen" };

const scopeLabel = (r: CommissionRuleDTO) => (r.scope === "global" ? "Global" : r.scope === "category" ? `Kategorie · ${r.categoryName ?? "—"}` : `Profi · ${r.providerName ?? "—"}`);

export default async function CommissionsPage({ searchParams }: { searchParams: Promise<{ verlauf?: string; regel?: string }> }) {
  const session = await requireRole("admin", routes.admin.commissions());
  const sp = await searchParams;
  const history = sp.verlauf === "1";
  const [rules, cats, providers, settings] = await Promise.all([
    listCommissionRules(session, { includeInactive: true }),
    listCategoriesAdmin(session),
    listProvidersAdmin(session, { status: ["approved", "suspended", "submitted", "in_review"], pageSize: 100 }),
    listPlatformSettings(session),
  ]);
  const shown = history ? rules : rules.filter((r) => r.isActive);
  const initial = sp.regel ? rules.find((r) => r.id === sp.regel) ?? null : null;
  const setting = (key: string) => settings.find((s) => s.key === key)?.value;
  const num = (key: string, fallback: number) => {
    const v = setting(key);
    return typeof v === "number" ? v : fallback;
  };
  const policy = (setting("cancellation_policy") ?? {}) as {
    tiers?: Array<{ min_hours_before: number; fee_percent: number; travel_fee_retained?: boolean }>;
    no_show_fee_percent?: number;
    grace_minutes?: number;
  };

  return (
    <>
      <AdminPageHeader
        group="Finanzen"
        title="Provisionen"
        description="Provisionssätze und Plattform-Einstellungen. Jede Änderung ist versioniert, gilt für neue Buchungen und wird protokolliert."
      />
      <div className="flex flex-col gap-12">
        <AdminSection
          id="rules"
          title="Provisionsregeln"
          description="Die spezifischste aktive Regel gewinnt: Profi vor Kategorie vor global. Die Anfahrt ist provisionsfrei."
          actions={
            <MutedLink href={hrefWith(routes.admin.commissions(), {}, { verlauf: history ? undefined : "1" })}>{history ? "Nur aktive Regeln" : "Verlauf anzeigen"}</MutedLink>
          }
        >
          <AdminTable label="Provisionsregeln">
            <thead>
              <tr>
                <th scope="col">Geltung</th>
                <th scope="col" className="text-right">Basis</th>
                <th scope="col" className="text-right">Stammkundschaft</th>
                <th scope="col" className="text-right">Eigene Kundschaft</th>
                <th scope="col">Status</th>
                <th scope="col">Geändert</th>
                <th scope="col" className="text-right">
                  <span className="sr-only">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className={r.isActive ? undefined : "text-ink-muted"}>
                  <td className="font-[520]">{scopeLabel(r)}</td>
                  <td className={numCell}>{formatPercent(r.rate)}</td>
                  <td className={numCell}>{formatPercent(r.repeatClientRate)}</td>
                  <td className={numCell}>{formatPercent(r.ownClientRate)}</td>
                  <td>
                    <Status tone={r.isActive ? "success" : "neutral"}>{r.isActive ? "Aktiv" : "Ersetzt"}</Status>
                  </td>
                  <td className="num text-ink-muted">{formatDateTime(r.updatedAt)}</td>
                  <td className="text-right">
                    {r.isActive ? (
                      <span className="flex items-center justify-end gap-1">
                        <Link
                          href={`${hrefWith(routes.admin.commissions(), { verlauf: history ? "1" : undefined }, { regel: r.id })}#regel`}
                          className="inline-flex h-control-s items-center rounded-xs px-3 type-label-s text-ink hover:bg-surface-sunken"
                        >
                          Ändern
                        </Link>
                        {r.scope !== "global" ? <DeactivateRuleButton ruleId={r.id} label={scopeLabel(r)} /> : null}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </AdminSection>

        <div className="grid gap-10 xl:grid-cols-2 xl:gap-8">
          <AdminSection id="regel" title={initial ? "Regel ändern" : "Regel anlegen oder ersetzen"} description={initial ? `Ersetzt: ${scopeLabel(initial)}` : "Startwerte sind die aktuellen globalen Sätze."}>
            <div className="border border-line bg-surface-raised p-4 md:p-6">
              <CommissionRuleForm
                key={initial?.id ?? "new"}
                rules={rules}
                initial={initial}
                categories={cats.map((c) => ({ id: c.id, name: c.isActive ? c.name : `${c.name} (inaktiv)` }))}
                providers={providers.items.map((p) => ({ id: p.providerId, name: p.displayName }))}
              />
            </div>
          </AdminSection>

          <AdminSection id="settings" title="Plattform-Einstellungen" description="Nur Werte, die gefahrlos im Betrieb geändert werden können. Alle Änderungen werden protokolliert.">
            <div className="divide-y divide-line border border-line bg-surface-raised">
              <CancellationPolicyForm tiers={policy.tiers ?? []} noShowFeePercent={policy.no_show_fee_percent ?? 100} graceMinutes={policy.grace_minutes ?? 0} />
              <NumberSettingForm
                settingKey="hold_minutes"
                label="Reservierung im Checkout"
                description="So lange bleibt ein Termin für die Zahlung reserviert."
                value={num("hold_minutes", 10)}
                min={5}
                max={60}
                unit="Min."
                warning="Längere Reservierungen blockieren Termine für andere Kundschaft; kürzere führen zu mehr abgebrochenen Zahlungen."
              />
              <NumberSettingForm
                settingKey="request_response_hours"
                label="Antwortfrist für Anfragen"
                description="Geschäftsstunden (8–21 Uhr), die Profis für eine Antwort haben, spätestens bis 2 Stunden vor dem Termin. Danach verfällt die Anfrage und die Reservierung wird freigegeben."
                value={num("request_response_hours", 4)}
                min={1}
                max={48}
                unit="Std."
                warning="Gilt für neue Anfragen. Kürzere Fristen erhöhen die Ablaufquote, längere lassen Kundschaft warten."
              />
              <NumberSettingForm
                settingKey="referral_reward_cents"
                label="Empfehlungsprämie"
                description="Guthaben für die empfehlende Person nach dem ersten abgeschlossenen Termin der eingeladenen Person."
                value={num("referral_reward_cents", 1500)}
                min={0}
                max={10_000}
                unit="€"
                cents
                warning="Wird als Guthaben gebucht und ist ein direkter Marketingkostenfaktor. Texte auf der Empfehlungsseite nennen den Betrag."
              />
              <NumberSettingForm
                settingKey="referral_welcome_cents"
                label="Willkommensguthaben"
                description="Guthaben für neue Kundschaft, die über eine Empfehlung kommt."
                value={num("referral_welcome_cents", 1500)}
                min={0}
                max={10_000}
                unit="€"
                cents
                warning="Wird als Guthaben gebucht. Texte auf der Empfehlungsseite nennen den Betrag."
              />
            </div>
          </AdminSection>
        </div>
      </div>
    </>
  );
}
