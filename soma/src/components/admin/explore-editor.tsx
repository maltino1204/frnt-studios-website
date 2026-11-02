"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Minus, Plus, Trash2 } from "lucide-react";
import { CollectionCard } from "@/components/site/explore-cards";
import { EXPLORE_ZEIT_OPTIONS, SPONSORED_LABEL } from "@/components/site/explore-copy";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { routes } from "@/lib/routes";
import { deleteExploreCollectionAction, saveExploreCollectionAction } from "@/server/actions/explore";
import type { AdminExploreCollectionDTO, AdminExploreItemDTO, AdminExploreOptionsDTO } from "@/server/services/explore-admin";
import { slugify } from "./catalog-board";
import { ConfirmButton } from "./confirm";
import type { CoverOption } from "./explore-images";
import { Card } from "./page";
import { useMutation } from "./use-mutation";

type Item = AdminExploreItemDTO & { key: string };

/** Words the brand voice excludes for collections (BRAND_VOICE § 6.2/6.3, HWG). Soft check only. */
const FLAGGED = ["kuratiert", "handverlesen", "Luxus", "exklusiv", "verwöhnen", "Auszeit", "Erlebnis", "heilt", "lindert", "Schmerzen", "!"];
const CUSTOM = "__custom";

// ---------------------------------------------------------------------------
// Europe/Berlin wall time ↔ instant for <input type="datetime-local"> (same on server and client: no hydration drift)
// ---------------------------------------------------------------------------
const berlinParts = (ms: number) => {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(ms))
    .reduce<Record<string, string>>((a, x) => ({ ...a, [x.type]: x.value }), {});
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};
function toLocalInput(iso: string | null): string {
  return iso ? berlinParts(Date.parse(iso)) : "";
}
function fromLocalInput(v: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const guess = Date.parse(`${v}:00Z`);
  // Two passes find the Berlin offset (CET/CEST) for that wall time.
  let t = guess;
  for (let i = 0; i < 2; i += 1) t = guess - (Date.parse(`${berlinParts(t)}:00Z`) - t);
  return new Date(t).toISOString();
}

let seq = 0;
const newKey = () => `n${(seq += 1)}`;

export function ExploreEditor({ initial, options, covers }: { initial: AdminExploreCollectionDTO | null; options: AdminExploreOptionsDTO; covers: CoverOption[] }) {
  const router = useRouter();
  const [f, setF] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    subline: initial?.subline ?? "",
    coverImage: initial?.coverImage ?? "",
    isPublished: initial?.isPublished ?? false,
    activeFrom: toLocalInput(initial?.activeFrom ?? null),
    activeUntil: toLocalInput(initial?.activeUntil ?? null),
    sortOrder: String(initial?.sortOrder ?? 100),
    isSponsored: initial?.isSponsored ?? false,
    sponsorName: initial?.sponsorName ?? "",
  });
  const [items, setItems] = useState<Item[]>(() => (initial?.items ?? []).map((it, i) => ({ ...it, key: `i${i}` })));
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [coverMode, setCoverMode] = useState<"list" | "custom">(initial?.coverImage && !covers.some((c) => c.path === initial.coverImage) ? "custom" : "list");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation(saveExploreCollectionAction, {
    success: initial ? "Sammlung gespeichert." : "Sammlung angelegt.",
    onSuccess: (d) => {
      if (!initial) router.replace(routes.admin.exploreCollection(d.id));
    },
  });
  const del = useMutation(deleteExploreCollectionAction, { success: "Sammlung gelöscht.", onSuccess: () => router.replace(routes.admin.explore()) });
  const fe = { ...save.fieldErrors, ...errors };
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const services = useMemo(() => options.categories.flatMap((c) => c.services.map((s) => ({ ...s, categoryId: c.id, categoryName: c.name }))), [options]);
  const flagged = useMemo(() => {
    const text = [f.title, f.subline, ...items.flatMap((i) => [i.title ?? "", i.note ?? ""])].join(" ").toLowerCase();
    return FLAGGED.filter((w) => text.includes(w.toLowerCase()));
  }, [f.title, f.subline, items]);
  const groups = useMemo(() => [...new Set(covers.map((c) => c.group))], [covers]);
  const tone = (() => {
    const first = items[0];
    const catId = first ? (first.kind === "category" ? first.categoryId : services.find((s) => s.id === first.serviceId)?.categoryId) : null;
    return options.categories.find((c) => c.id === catId)?.slug ?? "massage";
  })();

  const update = (key: string, patch: Partial<Item>) => setItems((all) => all.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) =>
    setItems((all) => {
      const next = [...all];
      const [x] = next.splice(i, 1);
      next.splice(i + d, 0, x);
      return next;
    });

  const submit = () => {
    const next: Record<string, string> = {};
    if (f.title.trim().length < 2) next.title = "Mindestens 2 Zeichen.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug) || f.slug.length < 2) next.slug = "Nur Kleinbuchstaben, Ziffern und einzelne Bindestriche (2–60 Zeichen).";
    const sort = Number(f.sortOrder);
    if (!Number.isInteger(sort) || sort < 0 || sort > 10_000) next.sortOrder = "Ganze Zahl von 0 bis 10000.";
    if (f.isSponsored && f.sponsorName.trim().length < 2) next.sponsorName = "Bei einer Anzeige muss der Auftraggeber genannt werden.";
    if (f.activeFrom && !fromLocalInput(f.activeFrom)) next.activeFrom = "Ungültiger Zeitpunkt.";
    if (f.activeUntil && !fromLocalInput(f.activeUntil)) next.activeUntil = "Ungültiger Zeitpunkt.";
    items.forEach((it, i) => {
      if (it.kind === "service" && !it.serviceId) next[`items.${i}.serviceId`] = "Bitte eine Leistung wählen.";
      if (it.kind === "category" && !it.categoryId) next[`items.${i}.categoryId`] = "Bitte eine Kategorie wählen.";
    });
    if (f.isPublished && items.length === 0) next.items = "Eine aktive Sammlung braucht mindestens einen Eintrag.";
    setErrors(next);
    if (Object.keys(next).length) return;
    void save.run({
      ...(initial ? { id: initial.id } : {}),
      title: f.title.trim(),
      slug: f.slug,
      subline: f.subline.trim() || null,
      coverImage: f.coverImage.trim() || null,
      isPublished: f.isPublished,
      activeFrom: f.activeFrom ? fromLocalInput(f.activeFrom) : null,
      activeUntil: f.activeUntil ? fromLocalInput(f.activeUntil) : null,
      sortOrder: sort,
      isSponsored: f.isSponsored,
      sponsorName: f.isSponsored ? f.sponsorName.trim() : null,
      items: items.map(({ key: _k, id: _id, ...it }) => ({
        kind: it.kind,
        serviceId: it.kind === "service" ? it.serviceId : null,
        providerId: it.kind === "service" ? it.providerId || null : null,
        categoryId: it.kind === "category" ? it.categoryId : null,
        filters: it.kind === "category" ? it.filters : {},
        title: it.title?.trim() || null,
        note: it.note?.trim() || null,
      })),
    });
  };

  return (
    <form
      noValidate
      aria-label="Sammlung bearbeiten"
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex min-w-0 flex-col gap-6">
        <Card as="section" aria-labelledby="ex-inhalt" className="flex flex-col gap-5 p-4 md:p-6">
          <h2 id="ex-inhalt" className="type-heading-m">
            Inhalt
          </h2>
          <Input
            dense
            label="Titel"
            value={f.title}
            maxLength={80}
            onChange={(e) => setF((x) => ({ ...x, title: e.target.value, slug: slugTouched ? x.slug : slugify(e.target.value) }))}
            error={fe.title}
            hint={`${f.title.length}/80 · kurz, ohne Ausrufezeichen`}
          />
          <Input
            dense
            label="Adresse"
            value={f.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setF((x) => ({ ...x, slug: e.target.value }));
            }}
            error={fe.slug}
            hint={`/entdecken/${f.slug || "…"}${initial && f.slug !== initial.slug ? " · Achtung: der alte Link funktioniert dann nicht mehr" : ""}`}
            className="[&_input]:font-mono"
          />
          <Textarea label="Unterzeile" optional value={f.subline} onChange={set("subline")} rows={2} maxLength={140} error={fe.subline} hint={`${f.subline.length}/140 · ein Satz`} />
        </Card>

        <Card as="section" aria-labelledby="ex-bild" className="flex flex-col gap-5 p-4 md:p-6">
          <h2 id="ex-bild" className="type-heading-m">
            Titelbild
          </h2>
          <Select
            dense
            label="Bild aus dem Bildbestand"
            value={coverMode === "custom" ? CUSTOM : f.coverImage}
            onChange={(e) => {
              if (e.target.value === CUSTOM) setCoverMode("custom");
              else {
                setCoverMode("list");
                setF((x) => ({ ...x, coverImage: e.target.value }));
              }
            }}
          >
            <option value="">Kein Titelbild (Fläche in der Kategoriefarbe)</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {covers
                  .filter((c) => c.group === g)
                  .map((c) => (
                    <option key={c.path} value={c.path}>
                      {c.path.replace(/^\/images\//, "")}
                    </option>
                  ))}
              </optgroup>
            ))}
            <option value={CUSTOM}>Anderer Pfad …</option>
          </Select>
          {coverMode === "custom" ? (
            <Input
              dense
              label="Bildpfad"
              value={f.coverImage}
              onChange={set("coverImage")}
              error={fe.coverImage}
              placeholder="/images/explore/mittagspause.jpg"
              hint="Ein Pfad unter /images/ (jpg, png, webp). Fehlt die Datei, zeigt die Karte die Kategoriefarbe."
              className="[&_input]:font-mono"
            />
          ) : fe.coverImage ? (
            <p className="type-caption text-danger">{fe.coverImage}</p>
          ) : null}
        </Card>

        <Card as="section" aria-labelledby="ex-eintraege" className="flex flex-col gap-4 p-4 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="ex-eintraege" className="type-heading-m">
                Einträge <span className="type-label-s font-normal text-ink-muted num">({items.length})</span>
              </h2>
              <p className="type-caption text-ink-muted">Eine Leistung (auf Wunsch bei einem bestimmten Profi) oder eine Kategorie mit Suchfiltern. Die Karten verlinken ins Profil oder in die Suche.</p>
            </div>
          </div>
          {fe.items ? <p className="type-caption text-danger">{fe.items}</p> : null}
          <ol className="flex flex-col gap-3">
            {items.map((it, i) => {
              const svc = services.find((s) => s.id === it.serviceId);
              const pros = svc ? options.providers.filter((p) => p.serviceIds.includes(svc.id)) : [];
              const cat = options.categories.find((c) => c.id === it.categoryId);
              return (
                <li key={it.key} className="flex flex-col gap-4 rounded-tile bg-surface-sunken/50 px-4 py-4 ring-1 ring-line ring-inset" data-testid={`eintrag-${i}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2.5">
                      <span className="inline-flex size-6 items-center justify-center rounded-full bg-surface-raised type-caption font-[600] text-ink-muted shadow-raised num">{i + 1}</span>
                      <span className="type-label-s text-ink">{it.kind === "service" ? "Leistung" : "Kategorie mit Filtern"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Button size="s" variant="ghost" aria-label={`Eintrag ${i + 1} nach oben`} disabled={i === 0} onClick={() => move(i, -1)} icon={<Icon icon={ArrowUp} size={16} />} />
                      <Button size="s" variant="ghost" aria-label={`Eintrag ${i + 1} nach unten`} disabled={i === items.length - 1} onClick={() => move(i, 1)} icon={<Icon icon={ArrowDown} size={16} />} />
                      <Button size="s" variant="ghost" aria-label={`Eintrag ${i + 1} entfernen`} onClick={() => setItems((all) => all.filter((x) => x.key !== it.key))} icon={<Icon icon={Minus} size={16} />} />
                    </span>
                  </div>
                  {it.kind === "service" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Select dense label="Leistung" value={it.serviceId ?? ""} onChange={(e) => update(it.key, { serviceId: e.target.value || null, providerId: null })} error={fe[`items.${i}.serviceId`]}>
                        <option value="">Bitte wählen</option>
                        {options.categories.map((c) => (
                          <optgroup key={c.id} label={c.name}>
                            {c.services.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </Select>
                      <Select
                        dense
                        label="Profi"
                        optional
                        value={it.providerId ?? ""}
                        onChange={(e) => update(it.key, { providerId: e.target.value || null })}
                        disabled={!svc}
                        error={fe[`items.${i}.providerId`]}
                        hint={svc ? `${pros.length} ${pros.length === 1 ? "Profi bietet" : "Profis bieten"} die Leistung an` : "Erst die Leistung wählen"}
                      >
                        <option value="">Kein bestimmter Profi (Suche)</option>
                        {pros.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.displayName}
                            {p.cityName ? ` · ${p.cityName}` : ""}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Select dense label="Kategorie" value={it.categoryId ?? ""} onChange={(e) => update(it.key, { categoryId: e.target.value || null, filters: { ...it.filters, leistung: undefined } })} error={fe[`items.${i}.categoryId`]}>
                        <option value="">Bitte wählen</option>
                        {options.categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                      <Select dense label="Leistung" optional value={it.filters.leistung ?? ""} disabled={!cat} onChange={(e) => update(it.key, { filters: { ...it.filters, leistung: e.target.value || undefined } })} error={fe[`items.${i}.filters.leistung`]}>
                        <option value="">Alle Leistungen der Kategorie</option>
                        {cat?.services.map((s) => (
                          <option key={s.id} value={s.slug}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                      <Select dense label="Tageszeit" optional value={it.filters.zeit ?? ""} onChange={(e) => update(it.key, { filters: { ...it.filters, zeit: (e.target.value || undefined) as Item["filters"]["zeit"] } })}>
                        <option value="">Jederzeit</option>
                        {EXPLORE_ZEIT_OPTIONS.map((z) => (
                          <option key={z.value} value={z.value}>
                            {z.label}
                          </option>
                        ))}
                      </Select>
                      <div className="grid grid-cols-2 gap-4">
                        <Input dense label="PLZ" optional inputMode="numeric" maxLength={5} value={it.filters.plz ?? ""} onChange={(e) => update(it.key, { filters: { ...it.filters, plz: e.target.value || undefined } })} error={fe[`items.${i}.filters.plz`]} />
                        <Input dense label="Datum" optional type="date" value={it.filters.datum ?? ""} onChange={(e) => update(it.key, { filters: { ...it.filters, datum: e.target.value || undefined } })} error={fe[`items.${i}.filters.datum`]} />
                      </div>
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input dense label="Titel auf der Karte" optional maxLength={80} value={it.title ?? ""} onChange={(e) => update(it.key, { title: e.target.value })} hint={it.kind === "service" ? "Leer: Name der Leistung" : "Leer: Name der Kategorie"} />
                    <Input dense label="Notiz" optional maxLength={140} value={it.note ?? ""} onChange={(e) => update(it.key, { note: e.target.value })} hint="Eine Zeile, keine Versprechen zu Terminen" />
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button size="s" variant="secondary" icon={<Icon icon={Plus} size={16} />} disabled={items.length >= 24} onClick={() => setItems((all) => [...all, { key: newKey(), kind: "service", serviceId: null, providerId: null, categoryId: null, filters: {}, title: null, note: null }])}>
              Leistung hinzufügen
            </Button>
            <Button size="s" variant="ghost" icon={<Icon icon={Plus} size={16} />} disabled={items.length >= 24} onClick={() => setItems((all) => [...all, { key: newKey(), kind: "category", serviceId: null, providerId: null, categoryId: null, filters: {}, title: null, note: null }])}>
              Kategorie hinzufügen
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-6">
        <Card as="section" aria-labelledby="ex-sicht" className="flex flex-col gap-4 p-4 md:p-5">
          <h2 id="ex-sicht" className="type-heading-m">
            Sichtbarkeit
          </h2>
          <Switch label="Aktiv" description="Öffentlich, sobald der Zeitraum läuft." checked={f.isPublished} onChange={(e) => setF((x) => ({ ...x, isPublished: e.target.checked }))} />
          <Input dense type="datetime-local" label="Sichtbar ab" optional value={f.activeFrom} onChange={set("activeFrom")} error={fe.activeFrom} hint="Berliner Zeit; leer: sofort" />
          <Input dense type="datetime-local" label="Sichtbar bis" optional value={f.activeUntil} onChange={set("activeUntil")} error={fe.activeUntil} hint="Leer: ohne Ende" />
          <Input dense label="Sortierung" inputMode="numeric" value={f.sortOrder} onChange={set("sortOrder")} error={fe.sortOrder} hint="Kleiner = weiter vorn" />
        </Card>

        <Card as="section" aria-labelledby="ex-kennz" className="flex flex-col gap-4 p-4 md:p-5">
          <h2 id="ex-kennz" className="type-heading-m">
            Kennzeichnung
          </h2>
          <Switch
            label="Bezahlte Platzierung"
            description={`Die Sammlung erscheint als „${SPONSORED_LABEL}“, mit Auftraggeber.`}
            checked={f.isSponsored}
            onChange={(e) => setF((x) => ({ ...x, isSponsored: e.target.checked }))}
          />
          {f.isSponsored ? (
            <Input dense label="Auftraggeber" value={f.sponsorName} maxLength={80} onChange={set("sponsorName")} error={fe.sponsorName} hint="Erscheint als „Bezahlte Platzierung im Auftrag von …“" />
          ) : (
            <p className="type-caption text-ink-muted">Ohne Bezahlung: „Von SOMA ausgewählt“, mit dem Hinweis, dass niemand für die Aufnahme zahlt.</p>
          )}
        </Card>

        <Card as="section" aria-labelledby="ex-vorschau" className="flex flex-col gap-3 p-4 md:p-5">
          <h2 id="ex-vorschau" className="type-heading-m">
            Karte
          </h2>
          <div inert className="max-w-72">
            <CollectionCard
              collection={{
                id: initial?.id ?? "neu",
                slug: f.slug || "neu",
                title: f.title || "Titel der Sammlung",
                subline: f.subline || null,
                coverImage: f.coverImage || null,
                tone,
                itemCount: items.length,
                isSponsored: f.isSponsored,
                sponsorName: f.sponsorName || null,
              }}
              sizes="288px"
            />
          </div>
          {initial ? (
            <ButtonLink href={routes.explorePreview(initial.id)} target="_blank" size="s" variant="ghost" icon={<Icon icon={ExternalLink} size={16} />} className="self-start">
              Vorschau der Seite
            </ButtonLink>
          ) : (
            <p className="type-caption text-ink-muted">Nach dem Speichern gibt es eine Vorschau der ganzen Seite.</p>
          )}
        </Card>

        {flagged.length ? (
          <Notice kind="warning" title="Bitte Formulierung prüfen">
            Gefunden: {flagged.map((w) => `„${w}“`).join(", ")}. SOMA verzichtet auf Superlative, Ausrufezeichen und Heilversprechen.
          </Notice>
        ) : null}
        {save.error ? <Notice kind="danger">{save.error}</Notice> : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" loading={save.pending}>
            {initial ? "Speichern" : "Anlegen"}
          </Button>
          {initial ? (
            <ConfirmButton
              label="Löschen"
              variant="ghost"
              icon={<Icon icon={Trash2} size={16} />}
              title={`„${initial.title}“ löschen?`}
              confirmLabel="Löschen"
              confirmVariant="destructive"
              pending={del.pending}
              error={del.error}
              onConfirm={async () => (await del.run(initial.id)).ok}
            >
              <p>Die Sammlung verschwindet sofort von Entdecken; ihr Link führt dann ins Leere. Der Vorgang wird protokolliert.</p>
            </ConfirmButton>
          ) : null}
        </div>
      </div>
    </form>
  );
}
