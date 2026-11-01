"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { AuraArt } from "@/components/ui/aura";
import { Button } from "@/components/ui/button";
import { EmptyState, Notice, Status } from "@/components/ui/feedback";
import { Input, Select, Switch } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatDuration, formatPrice } from "@/lib/format";
import { deleteProServiceAction, upsertProServiceAction } from "@/server/actions/pro";
import { routes } from "@/lib/routes";
import type { CategoryWithServicesDTO, ProServiceDTO } from "@/server/dto";
import { centsToInput, formatPercent, parseEuroToCents, proError } from "./labels";

export type CommissionRates = { rate: number; repeatClientRate: number; ownClientRate: number } | null;

type Draft = { mode: "add" | "edit"; categoryId: string; serviceId: string; duration: number; price: string; isActive: boolean; providerServiceId?: string };

/** Services & prices CRUD (upsertProServiceAction / deleteProServiceAction). */
export function ServicesEditor({ services, catalog, rates }: { services: ProServiceDTO[]; catalog: CategoryWithServicesDTO[]; rates: CommissionRates }) {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();

  const offeredCategoryIds = useMemo(() => new Set(services.filter((s) => s.isActive).map((s) => s.categoryId)), [services]);
  const groups = useMemo(() => {
    const m = new Map<string, { name: string; slug: string; items: ProServiceDTO[] }>();
    for (const s of services) {
      const g = m.get(s.categoryId) ?? { name: s.categoryName, slug: s.categorySlug, items: [] };
      g.items.push(s);
      m.set(s.categoryId, g);
    }
    return [...m.entries()];
  }, [services]);

  const category = catalog.find((c) => c.id === draft?.categoryId) ?? null;
  const service = category?.services.find((s) => s.id === draft?.serviceId) ?? null;
  const priceCents = draft ? parseEuroToCents(draft.price) : null;

  // "Leistung hinzufügen" starts on a service the pro does not offer yet (audit-4 A4-2).
  const offeredServiceIds = useMemo(() => new Set(services.map((s) => s.serviceId)), [services]);
  const firstNewService = (c: CategoryWithServicesDTO | undefined) => c?.services.find((x) => !offeredServiceIds.has(x.id)) ?? c?.services[0];

  const openAdd = () => {
    const c =
      catalog.find((x) => offeredCategoryIds.has(x.id) && x.services.some((y) => !offeredServiceIds.has(y.id))) ??
      catalog.find((x) => x.services.some((y) => !offeredServiceIds.has(y.id))) ??
      catalog[0];
    const s = firstNewService(c);
    setErrors({});
    setError(null);
    setDraft({
      mode: "add",
      categoryId: c?.id ?? "",
      serviceId: s?.id ?? "",
      duration: s?.defaultDuration ?? 60,
      price: s?.priceHintFromCents ? centsToInput(s.priceHintFromCents) : "",
      isActive: true,
    });
  };

  const openEdit = (o: ProServiceDTO) => {
    setErrors({});
    setError(null);
    setDraft({ mode: "edit", categoryId: o.categoryId, serviceId: o.serviceId, duration: o.durationMinutes, price: centsToInput(o.priceCents), isActive: o.isActive, providerServiceId: o.providerServiceId });
  };

  const save = () => {
    if (!draft) return;
    setErrors({});
    setError(null);
    if (priceCents === null) return setErrors({ price: "Bitte gib einen Preis in Euro an, z. B. 85." });
    start(async () => {
      const res = await upsertProServiceAction({ serviceId: draft.serviceId, durationMinutes: draft.duration, priceCents, isActive: draft.isActive, createOnly: draft.mode === "add" });
      if (!res.ok) {
        const fe = res.fieldErrors ?? {};
        setErrors({ price: fe.priceCents, duration: fe.durationMinutes, service: fe.serviceId });
        setError(proError(res.error));
        return;
      }
      setDraft(null);
      toast.show(draft.mode === "add" ? `${res.data.serviceName} hinzugefügt.` : "Preis gespeichert.");
      router.refresh();
    });
  };

  const remove = () => {
    if (!draft?.providerServiceId) return;
    start(async () => {
      const res = await deleteProServiceAction(draft.providerServiceId!);
      setConfirmDelete(false);
      if (!res.ok) return setError(proError(res.error));
      setDraft(null);
      toast.show(res.data.deactivated ? "Es gibt schon Buchungen für diese Leistung – sie ist jetzt pausiert statt gelöscht." : "Leistung entfernt.");
      router.refresh();
    });
  };

  const isNewCategory = draft?.mode === "add" && category && !offeredCategoryIds.has(category.id);
  const alreadyOffered = draft?.mode === "add" ? services.find((o) => o.serviceId === draft.serviceId && o.durationMinutes === draft.duration) ?? null : null;

  return (
    <div className="flex flex-col gap-8">
      {groups.length ? (
        <div className="flex flex-col gap-4">
          {groups.map(([id, g]) => {
            // F2/F3: offerings of a category whose documents are missing or unreviewed are not bookable yet.
            const awaiting = g.items.filter((o) => o.awaitingDocuments);
            const missing = [...new Set(awaiting.flatMap((o) => o.missingDocuments))];
            return (
            <section key={id} className="overflow-hidden rounded-card bg-surface-raised shadow-raised" aria-label={g.name}>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
                <span aria-hidden className="relative size-9 shrink-0 overflow-hidden rounded-[11px] shadow-[inset_0_0_0_1px_rgb(37_33_31/0.08)]">
                  <AuraArt seed={`kat-${g.slug}`} tone={g.slug} grain={false} />
                </span>
                <h2 className="min-w-0 flex-1 type-heading-s">{g.name}</h2>
                <span className="type-caption text-ink-muted num">{g.items.length === 1 ? "1 Leistung" : `${g.items.length} Leistungen`}</span>
              </div>
              {awaiting.length ? (
                <div className="px-4 pt-3 sm:px-5">
                  <Notice kind="info" title="Wartet auf Nachweis">
                    {`${missing.length ? `Es fehlt noch: ${missing.join(", ")}. ` : ""}Bis wir den Nachweis geprüft haben, ${awaiting.length === 1 ? "ist diese Leistung" : "sind diese Leistungen"} nicht buchbar. `}
                    <Link href={routes.pro.verification()}>Zur Verifizierung</Link>
                  </Notice>
                </div>
              ) : null}
              <ul className="divide-y divide-line">
                {g.items.map((o) => (
                  <li key={o.providerServiceId}>
                    <button
                      type="button"
                      onClick={() => openEdit(o)}
                      className="group flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left transition-colors duration-fast focus-ring hover:bg-surface-tint sm:px-5"
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className={cn("type-body-s font-[560]", o.isActive ? "text-ink" : "text-ink-muted")}>{o.serviceName}</span>
                        <span className="type-caption text-ink-muted num">
                          {formatDuration(o.durationMinutes)}
                          {o.priceHintFromCents ? ` · Richtwert ab ${formatPrice(o.priceHintFromCents)}` : ""}
                        </span>
                        {o.awaitingDocuments ? (
                          <Status tone="warning" className="mt-1 type-caption!">
                            Wartet auf Nachweis · nicht buchbar
                          </Status>
                        ) : null}
                      </span>
                      {!o.awaitingDocuments && !o.isActive ? <Status tone="neutral">Pausiert</Status> : null}
                      <span className="type-heading-s num text-ink">{formatPrice(o.priceCents)}</span>
                      <Icon icon={ChevronRight} size={16} className="text-ink-muted transition-transform duration-fast group-hover:translate-x-0.5" />
                      <span className="sr-only">bearbeiten</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-card bg-surface-raised px-5 shadow-raised">
          <EmptyState className="py-6!" seed="pro-leistungen" title="Noch keine Leistungen.">
            Wähle aus dem SOMA-Katalog, was du anbietest, und leg Dauer und Preis fest. Kundschaft sieht immer den Endpreis inklusive Anfahrt.
          </EmptyState>
        </div>
      )}

      <Button size="l" variant={groups.length ? "secondary" : "primary"} className="self-start max-sm:w-full" onClick={openAdd} icon={<Icon icon={Plus} />}>
        Leistung hinzufügen
      </Button>

      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.mode === "edit" ? "Leistung bearbeiten" : "Leistung hinzufügen"}
        footer={
          <div className="flex flex-col gap-2 md:flex-row-reverse md:items-center">
            <Button size="l" block loading={pending && !confirmDelete} onClick={save} disabled={!!alreadyOffered} className="md:w-auto">
              {draft?.mode === "edit" ? "Speichern" : "Hinzufügen"}
            </Button>
            {draft?.mode === "edit" ? (
              <Button size="l" variant="ghost" block onClick={() => setConfirmDelete(true)} className="text-danger! md:mr-auto md:w-auto">
                Entfernen
              </Button>
            ) : null}
          </div>
        }
      >
        {draft ? (
          <div className="flex flex-col gap-5">
            {draft.mode === "add" ? (
              <>
                <Select
                  label="Kategorie"
                  value={draft.categoryId}
                  onChange={(e) => {
                    const c = catalog.find((x) => x.id === e.target.value);
                    const s = firstNewService(c);
                    setDraft({ ...draft, categoryId: e.target.value, serviceId: s?.id ?? "", duration: s?.defaultDuration ?? 60, price: s?.priceHintFromCents ? centsToInput(s.priceHintFromCents) : "" });
                  }}
                >
                  {catalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Leistung"
                  value={draft.serviceId}
                  error={errors.service}
                  onChange={(e) => {
                    const s = category?.services.find((x) => x.id === e.target.value);
                    setDraft({ ...draft, serviceId: e.target.value, duration: s?.defaultDuration ?? 60, price: s?.priceHintFromCents ? centsToInput(s.priceHintFromCents) : draft.price });
                  }}
                >
                  {category?.services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                {service?.description ? <p className="-mt-2 type-caption text-ink-muted">{service.description}</p> : null}
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="type-overline text-ink-muted">{category?.name}</p>
                <p className="type-heading-m">{service?.name ?? services.find((s) => s.providerServiceId === draft.providerServiceId)?.serviceName}</p>
              </div>
            )}

            {draft.mode === "add" ? (
              <Select label="Dauer" value={String(draft.duration)} error={errors.duration} onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) })}>
                {(service?.durations ?? [draft.duration]).map((d) => (
                  <option key={d} value={d}>
                    {formatDuration(d)}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="type-body-s text-ink-muted">
                Dauer: <span className="text-ink num">{formatDuration(draft.duration)}</span> – für eine andere Dauer legst du die Leistung neu an.
              </p>
            )}

            {alreadyOffered ? (
              <Notice kind="info" title="Schon in deinem Angebot">
                {`Du bietest ${alreadyOffered.serviceName} (${formatDuration(alreadyOffered.durationMinutes)}) schon für ${formatPrice(alreadyOffered.priceCents)} an. `}
                <button type="button" className="underline underline-offset-4" onClick={() => openEdit(alreadyOffered)}>
                  Preis dort ändern
                </button>
              </Notice>
            ) : null}

            <Input
              label="Preis in Euro"
              inputMode="decimal"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              error={errors.price}
              placeholder="z. B. 85"
              hint={service?.priceHintFromCents ? `Richtwert: ab ${formatPrice(service.priceHintFromCents)}. Du bestimmst deinen Preis selbst.` : "Du bestimmst deinen Preis selbst."}
            />

            {rates && priceCents ? (
              <div className="flex flex-col gap-3 rounded-tile bg-surface-sunken/80 px-4 py-3.5 inset-shadow-sunken">
                <p className="type-label-s text-ink">Das bleibt dir (ohne Anfahrt, die ist provisionsfrei)</p>
                <dl className="flex flex-col gap-2.5">
                  {[
                    { label: "Neukundschaft", rate: rates.rate },
                    { label: "Stammkundschaft", rate: rates.repeatClientRate },
                    { label: "Eigene Kundschaft", rate: rates.ownClientRate },
                  ].map((t) => (
                    <div key={t.label} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="type-body-s text-ink-muted hyphens-none">
                          {t.label} <span className="num">· {formatPercent(t.rate)}</span>
                        </dt>
                        <dd className="type-label num">{formatPrice(Math.round(priceCents * (1 - t.rate)))}</dd>
                      </div>
                      <span aria-hidden className="flex h-1.5 overflow-hidden rounded-full bg-surface-raised">
                        <span className="h-full rounded-full bg-ink transition-[width] duration-spring ease-settle" style={{ width: `${(1 - t.rate) * 100}%` }} />
                      </span>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <Switch
              label="Buchbar"
              description={draft.isActive ? "Erscheint in deinem Profil und in der Suche." : "Pausiert – nicht buchbar."}
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
            />

            {isNewCategory && category.requiredDocuments.length ? (
              <Notice kind="info" title={`Für ${category.name} brauchen wir zusätzlich`}>
                {category.requiredDocuments.map((d) => d.label).join(", ")}. Du lädst den Nachweis unter Verifizierung hoch.
              </Notice>
            ) : null}
            <div aria-live="polite">{error ? <Notice kind="danger">{error}</Notice> : null}</div>
          </div>
        ) : null}
      </Sheet>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Leistung entfernen?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={pending}>
              Behalten
            </Button>
            <Button variant="destructive" loading={pending} onClick={remove}>
              Entfernen
            </Button>
          </>
        }
      >
        Die Leistung verschwindet aus deinem Profil. Gibt es schon Buchungen dafür, wird sie pausiert – bestehende Termine bleiben unverändert.
      </Modal>
    </div>
  );
}
