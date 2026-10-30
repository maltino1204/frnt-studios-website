"use client";

import { useState } from "react";
import { Minus, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/data";
import { EmptyState, Notice, Status } from "@/components/ui/feedback";
import { Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { formatDuration, formatPrice } from "@/lib/format";
import { upsertCategoryAction, upsertServiceAction } from "@/server/actions/admin";
import type { CategoryDTO, DocumentKind, RequiredDocumentDTO, ServiceDTO } from "@/server/dto";
import { ConfirmModal } from "./confirm";
import { centsToInput, parseEuroInput } from "./format";
import { DOCUMENT_KIND } from "./labels";
import { adminTable, numCell } from "./table";
import { useMutation } from "./use-mutation";

type CategoryWithServices = CategoryDTO & { services: ServiceDTO[] };
type Editor = { kind: "category"; value: CategoryDTO | null } | { kind: "service"; value: ServiceDTO | null; categoryId: string } | null;

const SLUG = /^[a-z0-9-]{2,60}$/;
export function slugify(v: string): string {
  return v
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "und")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Category & service CRUD. Changes go live immediately (data-driven taxonomy, no deploy). */
export function CatalogBoard({ categories }: { categories: CategoryWithServices[] }) {
  const [editor, setEditor] = useState<Editor>(null);
  const [toggle, setToggle] = useState<{ kind: "category"; value: CategoryDTO } | { kind: "service"; value: ServiceDTO } | null>(null);
  const nextSort = Math.max(0, ...categories.map((c) => c.sortOrder)) + 10;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <Notice kind="info" title="Ohne Deployment live." className="md:max-w-3xl">
          Neue oder geänderte Kategorien und Leistungen erscheinen sofort auf der Website, in der Suche und im Profi-Onboarding. Inaktive werden ausgeblendet; bestehende Buchungen bleiben unverändert.
        </Notice>
        <Button size="s" icon={<Icon icon={Plus} size={16} />} onClick={() => setEditor({ kind: "category", value: null })}>
          Kategorie anlegen
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState title="Noch keine Kategorien.">Legen Sie die erste Kategorie an.</EmptyState>
      ) : (
        categories.map((c) => (
          <section key={c.id} aria-labelledby={`cat-${c.id}`} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="type-label-s text-ink-muted num" title="Sortierung">
                  {String(c.sortOrder).padStart(2, "0")}
                </span>
                <h2 id={`cat-${c.id}`} className={`type-heading-m ${c.isActive ? "" : "text-ink-muted"}`}>
                  {c.name}
                </h2>
                <span className="code-ref text-ink-muted">{c.slug}</span>
                <Status tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Aktiv" : "Inaktiv"}</Status>
                <span className="type-caption text-ink-muted num">
                  {c.services.length} Leistungen · {c.requiredDocuments.length} Pflichtnachweis{c.requiredDocuments.length === 1 ? "" : "e"}
                  {c.seoTitle ? " · SEO gepflegt" : " · SEO fehlt"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button size="s" variant="ghost" onClick={() => setToggle({ kind: "category", value: c })}>
                  {c.isActive ? "Deaktivieren" : "Aktivieren"}
                </Button>
                <Button size="s" variant="ghost" icon={<Icon icon={Pencil} size={16} />} onClick={() => setEditor({ kind: "category", value: c })}>
                  Bearbeiten
                </Button>
                <Button size="s" variant="secondary" icon={<Icon icon={Plus} size={16} />} onClick={() => setEditor({ kind: "service", value: null, categoryId: c.id })}>
                  Leistung hinzufügen
                </Button>
              </div>
            </div>
            {c.services.length === 0 ? (
              <p className="border border-dashed border-line-strong px-4 py-4 type-body-s text-ink-muted">Noch keine Leistungen. Ohne Leistungen ist die Kategorie für Kundschaft nicht buchbar.</p>
            ) : (
              <Table dense className={`${adminTable} min-w-[860px] table-fixed`}>
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[24%]" />
                  <col className="w-[13%]" />
                  <col className="w-[10%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                  <col className="w-[152px]" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Leistung</th>
                    <th scope="col">Slug</th>
                    <th scope="col">Dauern</th>
                    <th scope="col" className="text-right">Ab-Preis</th>
                    <th scope="col" className="text-right">Sortierung</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">
                      <span className="sr-only">Aktionen</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {c.services.map((s) => (
                    <tr key={s.id} className={s.isActive ? undefined : "text-ink-muted"}>
                      <td className="truncate font-[520]" title={s.name}>{s.name}</td>
                      <td className="truncate">
                        <span className="code-ref text-ink-muted" title={s.slug}>{s.slug}</span>
                      </td>
                      <td className="num">
                        {s.durations.map((d) => (
                          <span key={d} className={d === s.defaultDuration ? "font-[520] text-ink" : "text-ink-muted"}>
                            {d}
                            {d === s.durations[s.durations.length - 1] ? " Min." : " · "}
                          </span>
                        ))}
                      </td>
                      <td className={numCell}>{s.priceHintFromCents != null ? `ab ${formatPrice(s.priceHintFromCents)}` : "—"}</td>
                      <td className={`${numCell} text-ink-muted`}>{s.sortOrder}</td>
                      <td>
                        <Status tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Aktiv" : "Inaktiv"}</Status>
                      </td>
                      <td className="text-right">
                        <Button size="s" variant="ghost" icon={<Icon icon={Pencil} size={16} />} onClick={() => setEditor({ kind: "service", value: s, categoryId: c.id })} aria-label={`${s.name} bearbeiten`}>
                          Bearbeiten
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </section>
        ))
      )}

      {editor?.kind === "category" ? <CategorySheet key={editor.value?.id ?? "new"} value={editor.value} nextSort={nextSort} onClose={() => setEditor(null)} /> : null}
      {editor?.kind === "service" ? (
        <ServiceSheet
          key={editor.value?.id ?? `new-${editor.categoryId}`}
          value={editor.value}
          categoryId={editor.categoryId}
          categories={categories}
          onClose={() => setEditor(null)}
        />
      ) : null}
      {toggle ? <ToggleActive target={toggle} onClose={() => setToggle(null)} /> : null}
    </div>
  );
}

function categoryInput(c: CategoryDTO) {
  return {
    id: c.id, slug: c.slug, name: c.name, tagline: c.tagline, description: c.description, imagePath: c.imagePath,
    sortOrder: c.sortOrder, isActive: c.isActive, seoTitle: c.seoTitle, seoDescription: c.seoDescription, requiredDocuments: c.requiredDocuments,
  };
}

function serviceInput(s: ServiceDTO) {
  return {
    id: s.id, categoryId: s.categoryId, slug: s.slug, name: s.name, description: s.description, durations: s.durations,
    defaultDuration: s.defaultDuration, priceHintFromCents: s.priceHintFromCents, attributes: s.attributes, sortOrder: s.sortOrder, isActive: s.isActive,
  };
}

function ToggleActive({ target, onClose }: { target: { kind: "category"; value: CategoryDTO } | { kind: "service"; value: ServiceDTO }; onClose: () => void }) {
  const next = !target.value.isActive;
  const cat = useMutation(upsertCategoryAction, { success: `${target.value.name} ist ${next ? "aktiv" : "inaktiv"}.`, onSuccess: onClose });
  const svc = useMutation(upsertServiceAction, { success: `${target.value.name} ist ${next ? "aktiv" : "inaktiv"}.`, onSuccess: onClose });
  const m = target.kind === "category" ? cat : svc;
  return (
    <ConfirmModal
      open
      onClose={onClose}
      title={`${target.value.name} ${next ? "aktivieren" : "deaktivieren"}?`}
      confirmLabel={next ? "Aktivieren" : "Deaktivieren"}
      confirmVariant={next ? "primary" : "destructive"}
      pending={m.pending}
      error={m.error}
      onConfirm={() => (target.kind === "category" ? cat.run({ ...categoryInput(target.value), isActive: next }) : svc.run({ ...serviceInput(target.value), isActive: next }))}
    >
      <p>
        {next
          ? "Ab sofort wieder auf der Website und in der Suche sichtbar."
          : target.kind === "category"
            ? "Die Kategorie und ihre Seiten verschwinden sofort von der Website und aus der Suche. Profis können sie nicht mehr neu anbieten; bestehende Buchungen bleiben bestehen."
            : "Die Leistung ist sofort nicht mehr buchbar. Bestehende Buchungen bleiben bestehen."}
      </p>
    </ConfirmModal>
  );
}

const KINDS = Object.keys(DOCUMENT_KIND) as DocumentKind[];

function CategorySheet({ value, nextSort, onClose }: { value: CategoryDTO | null; nextSort: number; onClose: () => void }) {
  const [f, setF] = useState({
    name: value?.name ?? "",
    slug: value?.slug ?? "",
    tagline: value?.tagline ?? "",
    description: value?.description ?? "",
    sortOrder: String(value?.sortOrder ?? nextSort),
    isActive: value?.isActive ?? true,
    seoTitle: value?.seoTitle ?? "",
    seoDescription: value?.seoDescription ?? "",
  });
  const [docs, setDocs] = useState<RequiredDocumentDTO[]>(value?.requiredDocuments ?? []);
  const [slugTouched, setSlugTouched] = useState(!!value);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const m = useMutation(upsertCategoryAction, { success: value ? "Kategorie gespeichert." : "Kategorie angelegt. Sie ist sofort live.", onSuccess: onClose });
  const fe = { ...m.fieldErrors, ...errors };
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = () => {
    const next: Record<string, string> = {};
    if (f.name.trim().length < 2) next.name = "Mindestens 2 Zeichen.";
    if (!SLUG.test(f.slug)) next.slug = "Nur Kleinbuchstaben, Ziffern und Bindestriche (2–60 Zeichen).";
    const sort = Number(f.sortOrder);
    if (!Number.isInteger(sort) || sort < 0 || sort > 1000) next.sortOrder = "Ganze Zahl von 0 bis 1000.";
    if (f.tagline.length > 160) next.tagline = "Höchstens 160 Zeichen.";
    if (f.seoTitle.length > 120) next.seoTitle = "Höchstens 120 Zeichen.";
    if (f.seoDescription.length > 300) next.seoDescription = "Höchstens 300 Zeichen.";
    docs.forEach((d, i) => {
      if (d.label.trim().length < 3) next[`requiredDocuments.${i}.label`] = "Mindestens 3 Zeichen.";
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    m.run({
      ...(value ? { id: value.id, imagePath: value.imagePath } : {}),
      name: f.name.trim(),
      slug: f.slug,
      tagline: f.tagline.trim() || null,
      description: f.description.trim() || null,
      sortOrder: sort,
      isActive: f.isActive,
      seoTitle: f.seoTitle.trim() || null,
      seoDescription: f.seoDescription.trim() || null,
      requiredDocuments: docs.map((d) => ({ kind: d.kind, label: d.label.trim() })),
    });
  };

  return (
    <Sheet
      open
      variant="drawer"
      onClose={onClose}
      title={value ? `${value.name} bearbeiten` : "Kategorie anlegen"}
      footer={
        <div className="flex flex-col gap-2">
          {m.error && !Object.keys(m.fieldErrors).length ? <p className="type-caption text-danger">{m.error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button size="s" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button size="s" type="submit" form="category-form" loading={m.pending}>
              {value ? "Speichern" : "Anlegen"}
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="category-form"
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          dense
          label="Name"
          value={f.name}
          onChange={(e) => setF((x) => ({ ...x, name: e.target.value, slug: slugTouched ? x.slug : slugify(e.target.value) }))}
          error={fe.name}
          placeholder="z. B. Yoga"
          maxLength={80}
        />
        <Input
          dense
          label="Slug (URL)"
          value={f.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setF((x) => ({ ...x, slug: e.target.value }));
          }}
          error={fe.slug}
          hint={`/behandlungen/${f.slug || "…"}${value && f.slug !== value.slug ? " · Achtung: alte URLs funktionieren dann nicht mehr" : ""}`}
          className="[&_input]:font-mono"
        />
        <Input dense label="Kurzbeschreibung" optional value={f.tagline} onChange={set("tagline")} error={fe.tagline} hint={`${f.tagline.length}/160`} />
        <Textarea label="Beschreibung" optional value={f.description} onChange={set("description")} error={fe.description} rows={4} maxLength={2000} />
        <div className="grid grid-cols-2 items-end gap-4">
          <Input dense label="Sortierung" inputMode="numeric" value={f.sortOrder} onChange={set("sortOrder")} error={fe.sortOrder} hint="Kleiner = weiter vorn" />
          <Switch label="Aktiv" checked={f.isActive} onChange={(e) => setF((x) => ({ ...x, isActive: e.target.checked }))} />
        </div>

        <fieldset className="flex flex-col gap-3 border-t border-line pt-4">
          <legend className="float-left mb-1 type-heading-s">Pflichtnachweise</legend>
          <p className="clear-left type-caption text-ink-muted">Zusätzlich zu Ausweis, Gewerbeanmeldung und Haftpflicht. Profis müssen sie für diese Kategorie hochladen.</p>
          {docs.map((d, i) => (
            <div key={i} className="flex items-start gap-2">
              <Select dense label={`Nachweis ${i + 1}: Art`} hideLabel value={d.kind} onChange={(e) => setDocs((all) => all.map((x, j) => (j === i ? { ...x, kind: e.target.value as DocumentKind } : x)))} className="w-40 shrink-0">
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {DOCUMENT_KIND[k]}
                  </option>
                ))}
              </Select>
              <Input dense label={`Nachweis ${i + 1}: Bezeichnung`} hideLabel value={d.label} onChange={(e) => setDocs((all) => all.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} error={fe[`requiredDocuments.${i}.label`]} placeholder="z. B. Kosmetikausbildung" className="min-w-0 flex-1" />
              <Button size="s" variant="ghost" aria-label={`Nachweis ${i + 1} entfernen`} onClick={() => setDocs((all) => all.filter((_, j) => j !== i))} icon={<Icon icon={Minus} size={16} />} />
            </div>
          ))}
          <div>
            <Button size="s" variant="ghost" disabled={docs.length >= 10} icon={<Icon icon={Plus} size={16} />} onClick={() => setDocs((all) => [...all, { kind: "qualification", label: "" }])}>
              Nachweis hinzufügen
            </Button>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4 border-t border-line pt-4">
          <legend className="float-left mb-1 type-heading-s">Suchmaschinen</legend>
          <Input dense label="SEO-Titel" optional value={f.seoTitle} onChange={set("seoTitle")} error={fe.seoTitle} hint={`${f.seoTitle.length}/120 · empfohlen bis 60`} className="clear-left" />
          <Textarea label="SEO-Beschreibung" optional value={f.seoDescription} onChange={set("seoDescription")} error={fe.seoDescription} hint={`${f.seoDescription.length}/300 · empfohlen bis 160`} rows={3} />
        </fieldset>
      </form>
    </Sheet>
  );
}

function ServiceSheet({ value, categoryId, categories, onClose }: { value: ServiceDTO | null; categoryId: string; categories: CategoryWithServices[]; onClose: () => void }) {
  const cat = categories.find((c) => c.id === categoryId);
  const [f, setF] = useState({
    categoryId: value?.categoryId ?? categoryId,
    name: value?.name ?? "",
    slug: value?.slug ?? "",
    description: value?.description ?? "",
    durations: value?.durations.join(", ") ?? "60",
    defaultDuration: String(value?.defaultDuration ?? 60),
    price: value?.priceHintFromCents != null ? centsToInput(value.priceHintFromCents) : "",
    sortOrder: String(value?.sortOrder ?? ((cat?.services.length ?? 0) + 1) * 10),
    isActive: value?.isActive ?? true,
  });
  const [slugTouched, setSlugTouched] = useState(!!value);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const m = useMutation(upsertServiceAction, { success: value ? "Leistung gespeichert." : "Leistung angelegt. Sie ist sofort buchbar, sobald Profis sie anbieten.", onSuccess: onClose });
  const fe = { ...m.fieldErrors, ...errors };
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const durations = f.durations.split(/[,;\s]+/).filter(Boolean).map(Number);
  const validDurations = durations.length > 0 && durations.every((d) => Number.isInteger(d) && d >= 15 && d <= 480);

  const submit = () => {
    const next: Record<string, string> = {};
    if (f.name.trim().length < 2) next.name = "Mindestens 2 Zeichen.";
    if (!/^[a-z0-9-]{2,80}$/.test(f.slug)) next.slug = "Nur Kleinbuchstaben, Ziffern und Bindestriche (2–80 Zeichen).";
    if (!validDurations || durations.length > 6) next.durations = "1 bis 6 Dauern in Minuten (15–480), z. B. 60, 90.";
    const def = Number(f.defaultDuration);
    if (validDurations && !durations.includes(def)) next.defaultDuration = "Muss eine der Dauern sein.";
    const price = f.price.trim() ? parseEuroInput(f.price) : null;
    if (f.price.trim() && (price == null || price > 100_000)) next.priceHintFromCents = "Betrag bis 1.000 €, z. B. 69,00.";
    const sort = Number(f.sortOrder);
    if (!Number.isInteger(sort) || sort < 0 || sort > 1000) next.sortOrder = "Ganze Zahl von 0 bis 1000.";
    setErrors(next);
    if (Object.keys(next).length) return;
    m.run({
      ...(value ? { id: value.id } : {}),
      categoryId: f.categoryId,
      name: f.name.trim(),
      slug: f.slug,
      description: f.description.trim() || null,
      durations: [...new Set(durations)].sort((a, b) => a - b),
      defaultDuration: def,
      priceHintFromCents: price,
      attributes: value?.attributes ?? {},
      sortOrder: sort,
      isActive: f.isActive,
    });
  };

  return (
    <Sheet
      open
      variant="drawer"
      onClose={onClose}
      title={value ? `${value.name} bearbeiten` : `Leistung in ${cat?.name ?? "Kategorie"}`}
      footer={
        <div className="flex flex-col gap-2">
          {m.error && !Object.keys(m.fieldErrors).length ? <p className="type-caption text-danger">{m.error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button size="s" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button size="s" type="submit" form="service-form" loading={m.pending}>
              {value ? "Speichern" : "Anlegen"}
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="service-form"
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Select dense label="Kategorie" value={f.categoryId} onChange={set("categoryId")}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.isActive ? "" : " (inaktiv)"}
            </option>
          ))}
        </Select>
        <Input
          dense
          label="Name"
          value={f.name}
          onChange={(e) => setF((x) => ({ ...x, name: e.target.value, slug: slugTouched ? x.slug : slugify(e.target.value) }))}
          error={fe.name}
          maxLength={120}
        />
        <Input
          dense
          label="Slug"
          value={f.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setF((x) => ({ ...x, slug: e.target.value }));
          }}
          error={fe.slug}
          className="[&_input]:font-mono"
        />
        <Textarea label="Beschreibung" optional value={f.description} onChange={set("description")} rows={3} maxLength={2000} hint="Keine Heilversprechen (HWG)." />
        <div className="grid grid-cols-2 gap-4">
          <Input dense label="Dauern (Min.)" value={f.durations} onChange={set("durations")} error={fe.durations} hint="Kommagetrennt, z. B. 60, 90" />
          <Select dense label="Standarddauer" value={f.defaultDuration} onChange={set("defaultDuration")} error={fe.defaultDuration}>
            {(validDurations ? [...new Set(durations)].sort((a, b) => a - b) : [Number(f.defaultDuration)]).map((d) => (
              <option key={d} value={d}>
                {formatDuration(d)}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input dense label="Ab-Preis (€)" optional inputMode="decimal" value={f.price} onChange={set("price")} error={fe.priceHintFromCents} hint="Nur auf Kategorie- und SEO-Seiten" />
          <Input dense label="Sortierung" inputMode="numeric" value={f.sortOrder} onChange={set("sortOrder")} error={fe.sortOrder} />
        </div>
        <Switch label="Aktiv" description="Inaktive Leistungen sind nicht buchbar." checked={f.isActive} onChange={(e) => setF((x) => ({ ...x, isActive: e.target.checked }))} />
      </form>
    </Sheet>
  );
}
