import "server-only";

import { z } from "zod";
import { withService, type Tx } from "../db/client";
import { rethrowDb } from "../db/errors";
import {
  collectionStatus,
  COLLECTION_SLUG,
  findSlotPromise,
  MAX_COLLECTION_ITEMS,
  RESERVED_COLLECTION_SLUGS,
  SLOT_PROMISE_MESSAGE,
  type CollectionStatus,
} from "../domain/explore";
import type { Session } from "../dto";
import { ServiceError } from "../errors";
import { assertAdmin, audit, parse, zUuid } from "./_shared";
import { resolveCollection, type ExploreCollectionDTO } from "./explore";

/**
 * Admin for „Von SOMA ausgewählt“ (/admin/entdecken). Every function: assertAdmin (session role + DB re-check)
 * inside a service transaction, then the use case; every write goes to audit_log (entity `explore_collection`).
 * withService: admin use case after assertAdmin; the tables have no API write grants (migration 0011).
 */

async function asAdmin<T>(session: Session, fn: (tx: Tx, admin: Session) => Promise<T>): Promise<T> {
  // withService: admin use case, authorised by assertAdmin() in the same transaction.
  return withService(async (tx) => {
    const admin = await assertAdmin(tx, session);
    return fn(tx, admin);
  }).catch(rethrowDb);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ExploreZeit = "morgens" | "mittags" | "abends";

export interface AdminExploreItemDTO {
  id?: string;
  kind: "service" | "category";
  serviceId: string | null;
  providerId: string | null;
  categoryId: string | null;
  filters: { plz?: string; leistung?: string; datum?: string; zeit?: ExploreZeit };
  title: string | null;
  note: string | null;
}

export interface AdminExploreCollectionRowDTO {
  id: string;
  slug: string;
  title: string;
  subline: string | null;
  coverImage: string | null;
  isPublished: boolean;
  activeFrom: string | null;
  activeUntil: string | null;
  sortOrder: number;
  isSponsored: boolean;
  sponsorName: string | null;
  status: CollectionStatus;
  itemCount: number;
  updatedAt: string;
  updatedByName: string | null;
}

export interface AdminExploreCollectionDTO extends AdminExploreCollectionRowDTO {
  items: AdminExploreItemDTO[];
}

export interface AdminExploreOptionsDTO {
  categories: Array<{ id: string; slug: string; name: string; services: Array<{ id: string; slug: string; name: string }> }>;
  /** approved Profis with the services they actively offer (pinning) */
  providers: Array<{ id: string; displayName: string; cityName: string | null; serviceIds: string[] }>;
}

export type AdminExploreCollectionInput = z.input<typeof CollectionSchema>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const zText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const zInstant = z
  .union([z.iso.datetime({ offset: true, error: "Ungültiger Zeitpunkt." }), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? new Date(v) : null));

const ItemSchema = z.object({
  kind: z.enum(["service", "category"]),
  serviceId: zUuid.nullish(),
  providerId: zUuid.nullish(),
  categoryId: zUuid.nullish(),
  filters: z
    .object({
      plz: z
        .string()
        .trim()
        .regex(/^\d{5}$/, "Fünfstellige Postleitzahl.")
        .optional()
        .or(z.literal("").transform(() => undefined)),
      leistung: z
        .string()
        .trim()
        .regex(/^[a-z0-9-]{2,80}$/, "Ungültige Leistung.")
        .optional()
        .or(z.literal("").transform(() => undefined)),
      datum: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum im Format JJJJ-MM-TT.")
        .optional()
        .or(z.literal("").transform(() => undefined)),
      zeit: z
        .enum(["morgens", "mittags", "abends"])
        .optional()
        .or(z.literal("").transform(() => undefined)),
    })
    .optional()
    .default({}),
  title: zText(80),
  note: zText(140),
});

const CollectionSchema = z
  .object({
    id: zUuid.optional(),
    slug: z
      .string()
      .trim()
      .min(2, "Mindestens 2 Zeichen.")
      .max(60, "Höchstens 60 Zeichen.")
      .regex(COLLECTION_SLUG, "Nur Kleinbuchstaben, Ziffern und einzelne Bindestriche.")
      .refine((s) => !(RESERVED_COLLECTION_SLUGS as readonly string[]).includes(s), "Diese Adresse ist reserviert."),
    title: z.string().trim().min(2, "Mindestens 2 Zeichen.").max(80, "Höchstens 80 Zeichen."),
    subline: zText(140),
    coverImage: z
      .string()
      .trim()
      .regex(/^\/images\/[A-Za-z0-9/_.-]+\.(jpg|jpeg|png|webp|avif)$/, "Ein Bildpfad aus /images/…, z. B. /images/explore/mittagspause.jpg.")
      .refine((p) => !p.includes(".."), "Ungültiger Bildpfad.")
      .nullish()
      .or(z.literal("").transform(() => null))
      .transform((v) => v ?? null),
    isPublished: z.boolean().default(false),
    activeFrom: zInstant,
    activeUntil: zInstant,
    sortOrder: z.number().int("Ganze Zahl.").min(0, "0 bis 10000.").max(10_000, "0 bis 10000.").default(100),
    isSponsored: z.boolean().default(false),
    sponsorName: zText(80),
    items: z.array(ItemSchema).max(MAX_COLLECTION_ITEMS, `Höchstens ${MAX_COLLECTION_ITEMS} Einträge.`).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.activeFrom && v.activeUntil && v.activeUntil <= v.activeFrom) {
      ctx.addIssue({ code: "custom", path: ["activeUntil"], message: "Das Ende muss nach dem Beginn liegen." });
    }
    if (v.isSponsored && (v.sponsorName ?? "").length < 2) {
      ctx.addIssue({ code: "custom", path: ["sponsorName"], message: "Bei einer Anzeige muss der Auftraggeber genannt werden." });
    }
    if (v.isPublished && v.items.length === 0) {
      ctx.addIssue({ code: "custom", path: ["items"], message: "Eine aktive Sammlung braucht mindestens einen Eintrag." });
    }
    // R1: editorial copy never promises availability (only the engine decides what is free).
    for (const field of ["title", "subline"] as const) {
      if (findSlotPromise(v[field])) ctx.addIssue({ code: "custom", path: [field], message: SLOT_PROMISE_MESSAGE });
    }
    v.items.forEach((it, i) => {
      for (const field of ["title", "note"] as const) {
        if (findSlotPromise(it[field])) ctx.addIssue({ code: "custom", path: ["items", i, field], message: SLOT_PROMISE_MESSAGE });
      }
      if (it.kind === "service" && !it.serviceId) ctx.addIssue({ code: "custom", path: ["items", i, "serviceId"], message: "Bitte eine Leistung wählen." });
      if (it.kind === "category" && !it.categoryId) ctx.addIssue({ code: "custom", path: ["items", i, "categoryId"], message: "Bitte eine Kategorie wählen." });
    });
  });

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------
interface RowDb {
  id: string;
  slug: string;
  title: string;
  subline: string | null;
  coverImage: string | null;
  isPublished: boolean;
  activeFrom: Date | null;
  activeUntil: Date | null;
  sortOrder: number;
  isSponsored: boolean;
  sponsorName: string | null;
  updatedAt: Date;
  itemCount: number;
  updatedByName: string | null;
}

function toRow(r: RowDb, now = new Date()): AdminExploreCollectionRowDTO {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    subline: r.subline,
    coverImage: r.coverImage,
    isPublished: r.isPublished,
    activeFrom: r.activeFrom ? r.activeFrom.toISOString() : null,
    activeUntil: r.activeUntil ? r.activeUntil.toISOString() : null,
    sortOrder: r.sortOrder,
    isSponsored: r.isSponsored,
    sponsorName: r.sponsorName,
    status: collectionStatus(r, now),
    itemCount: r.itemCount,
    updatedAt: r.updatedAt.toISOString(),
    updatedByName: r.updatedByName,
  };
}

async function queryRows(tx: Tx, id?: string): Promise<RowDb[]> {
  return tx<RowDb[]>`
    select c.id, c.slug, c.title, c.subline, c.cover_image, c.is_published, c.active_from, c.active_until, c.sort_order,
           c.is_sponsored, c.sponsor_name, c.updated_at,
           (select count(*)::int from public.explore_collection_items i where i.collection_id = c.id) as item_count,
           nullif(btrim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, '')), '') as updated_by_name
    from public.explore_collections c
    left join public.profiles pr on pr.id = c.updated_by
    ${id ? tx`where c.id = ${id}` : tx``}
    order by c.sort_order, c.title`;
}

export async function listExploreCollectionsAdmin(session: Session): Promise<AdminExploreCollectionRowDTO[]> {
  return asAdmin(session, async (tx) => (await queryRows(tx)).map((r) => toRow(r)));
}

export async function getExploreCollectionAdmin(session: Session, id: string): Promise<AdminExploreCollectionDTO | null> {
  const cid = parse(zUuid, id);
  return asAdmin(session, async (tx) => {
    const [row] = await queryRows(tx, cid);
    if (!row) return null;
    const items = await tx<Array<{ id: string; kind: "service" | "category"; serviceId: string | null; providerId: string | null; categoryId: string | null; filters: AdminExploreItemDTO["filters"]; title: string | null; note: string | null }>>`
      select id, kind, service_id, provider_id, category_id, filters, title, note
      from public.explore_collection_items where collection_id = ${cid} order by position, created_at`;
    return { ...toRow(row), items: items.map((i) => ({ ...i, filters: i.filters ?? {} })) };
  });
}

export async function getExploreEditorOptions(session: Session): Promise<AdminExploreOptionsDTO> {
  return asAdmin(session, async (tx) => {
    const [cats, services, providers] = await Promise.all([
      tx<{ id: string; slug: string; name: string }[]>`select id, slug, name from public.categories where is_active order by sort_order, name`,
      tx<{ id: string; slug: string; name: string; categoryId: string }[]>`
        select id, slug, name, category_id from public.services where is_active order by sort_order, name`,
      tx<{ id: string; displayName: string; cityName: string | null; serviceIds: string[] }[]>`
        select p.id, p.display_name, ci.name as city_name, array_agg(distinct ps.service_id) as service_ids
        from public.providers p
        join public.provider_services ps on ps.provider_id = p.id and ps.is_active
        left join public.postal_codes pc on pc.postal_code = p.base_postal_code
        left join public.cities ci on ci.slug = pc.city_slug
        where p.status = 'approved'
        group by p.id, p.display_name, ci.name
        order by p.display_name`,
    ]);
    return {
      categories: cats.map((c) => ({ ...c, services: services.filter((s) => s.categoryId === c.id).map(({ id, slug, name }) => ({ id, slug, name })) })),
      providers: providers.map((p) => ({ ...p, serviceIds: [...p.serviceIds] })),
    };
  });
}

/** Admin preview of any collection (drafts and scheduled ones too), resolved exactly like the public page. */
export async function getExploreCollectionPreview(session: Session, id: string): Promise<(ExploreCollectionDTO & { status: CollectionStatus }) | null> {
  const cid = parse(zUuid, id);
  return asAdmin(session, async (tx) => {
    const [row] = await tx<Array<{ id: string; slug: string; title: string; subline: string | null; coverImage: string | null; isSponsored: boolean; sponsorName: string | null; isPublished: boolean; activeFrom: Date | null; activeUntil: Date | null }>>`
      select id, slug, title, subline, cover_image, is_sponsored, sponsor_name, is_published, active_from, active_until
      from public.explore_collections where id = ${cid}`;
    if (!row) return null;
    const dto = await resolveCollection(tx, row);
    return { ...dto, status: collectionStatus(row) };
  });
}

// ---------------------------------------------------------------------------
// Writes (audited)
// ---------------------------------------------------------------------------
/** Creates or updates a collection and replaces its items in the given order. */
export async function saveExploreCollection(session: Session, input: AdminExploreCollectionInput): Promise<{ id: string; slug: string; previousSlug: string | null }> {
  const v = parse(CollectionSchema, input);
  return asAdmin(session, async (tx, admin) => {
    // References: active catalogue rows; a pinned Profi must be approved and offer the service.
    const fieldErrors: Record<string, string> = {};
    const serviceIds = v.items.flatMap((i) => (i.kind === "service" && i.serviceId ? [i.serviceId] : []));
    const categoryIds = v.items.flatMap((i) => (i.kind === "category" && i.categoryId ? [i.categoryId] : []));
    const [services, categories] = await Promise.all([
      serviceIds.length
        ? tx<{ id: string; slug: string; categoryId: string }[]>`select id, slug, category_id from public.services where id = any(${serviceIds}::uuid[]) and is_active`
        : Promise.resolve([]),
      categoryIds.length
        ? tx<{ id: string }[]>`select id from public.categories where id = any(${categoryIds}::uuid[]) and is_active`
        : Promise.resolve([]),
    ]);
    const categoryServices = categoryIds.length
      ? await tx<{ slug: string; categoryId: string }[]>`select slug, category_id from public.services where category_id = any(${categoryIds}::uuid[]) and is_active`
      : [];
    for (const [i, it] of v.items.entries()) {
      if (it.kind === "service") {
        if (!services.some((s) => s.id === it.serviceId)) fieldErrors[`items.${i}.serviceId`] = "Diese Leistung gibt es nicht (mehr).";
        if (it.providerId) {
          const [offers] = await tx<{ n: number }[]>`
            select count(*)::int as n from public.provider_services ps join public.providers p on p.id = ps.provider_id
            where ps.provider_id = ${it.providerId} and ps.service_id = ${it.serviceId ?? null} and ps.is_active and p.status = 'approved'`;
          if (!offers?.n) fieldErrors[`items.${i}.providerId`] = "Dieser Profi bietet die Leistung gerade nicht an.";
        }
      } else {
        if (!categories.some((c) => c.id === it.categoryId)) fieldErrors[`items.${i}.categoryId`] = "Diese Kategorie gibt es nicht (mehr).";
        if (it.filters.leistung && !categoryServices.some((s) => s.categoryId === it.categoryId && s.slug === it.filters.leistung)) {
          fieldErrors[`items.${i}.filters.leistung`] = "Diese Leistung gehört nicht zur Kategorie.";
        }
        if (it.filters.plz) {
          const [pc] = await tx<{ x: number }[]>`select 1 as x from public.postal_codes where postal_code = ${it.filters.plz}`;
          if (!pc) fieldErrors[`items.${i}.filters.plz`] = "Diese Postleitzahl kennen wir nicht.";
        }
      }
    }
    const [taken] = await tx<{ id: string }[]>`select id from public.explore_collections where slug = ${v.slug} and id is distinct from ${v.id ?? null}`;
    if (taken) fieldErrors.slug = "Diese Adresse ist schon vergeben.";
    if (Object.keys(fieldErrors).length) throw new ServiceError("validation", "Bitte die markierten Angaben prüfen.", fieldErrors);

    let id = v.id ?? null;
    const [prev] = id ? await tx<{ slug: string }[]>`select slug from public.explore_collections where id = ${id}` : [];
    const values = {
      slug: v.slug,
      title: v.title,
      subline: v.subline,
      coverImage: v.coverImage,
      isPublished: v.isPublished,
      activeFrom: v.activeFrom,
      activeUntil: v.activeUntil,
      sortOrder: v.sortOrder,
      isSponsored: v.isSponsored,
      sponsorName: v.isSponsored ? v.sponsorName : null,
    };
    if (id) {
      const [row] = await tx<{ id: string }[]>`
        update public.explore_collections set
          slug = ${values.slug}, title = ${values.title}, subline = ${values.subline}, cover_image = ${values.coverImage},
          is_published = ${values.isPublished}, active_from = ${values.activeFrom}, active_until = ${values.activeUntil},
          sort_order = ${values.sortOrder}, is_sponsored = ${values.isSponsored}, sponsor_name = ${values.sponsorName}, updated_by = ${admin.userId}
        where id = ${id} returning id`;
      if (!row) throw new ServiceError("not_found", "Diese Sammlung gibt es nicht mehr.");
      await tx`delete from public.explore_collection_items where collection_id = ${id}`;
    } else {
      const [row] = await tx<{ id: string }[]>`
        insert into public.explore_collections (slug, title, subline, cover_image, is_published, active_from, active_until, sort_order,
                                                is_sponsored, sponsor_name, created_by, updated_by)
        values (${values.slug}, ${values.title}, ${values.subline}, ${values.coverImage}, ${values.isPublished}, ${values.activeFrom},
                ${values.activeUntil}, ${values.sortOrder}, ${values.isSponsored}, ${values.sponsorName}, ${admin.userId}, ${admin.userId})
        returning id`;
      id = row.id;
    }
    for (const [position, it] of v.items.entries()) {
      const filters = it.kind === "category" ? Object.fromEntries(Object.entries(it.filters).filter(([, x]) => x)) : {};
      await tx`
        insert into public.explore_collection_items (collection_id, position, kind, service_id, provider_id, category_id, filters, title, note)
        values (${id}, ${position}, ${it.kind}, ${it.kind === "service" ? it.serviceId ?? null : null}, ${it.kind === "service" ? it.providerId ?? null : null},
                ${it.kind === "category" ? it.categoryId ?? null : null}, ${tx.json(filters)}, ${it.title}, ${it.note})`;
    }
    await audit(tx, admin.userId, v.id ? "explore.update" : "explore.create", "explore_collection", id, {
      slug: values.slug,
      title: values.title,
      published: values.isPublished,
      activeFrom: values.activeFrom?.toISOString() ?? null,
      activeUntil: values.activeUntil?.toISOString() ?? null,
      sponsored: values.isSponsored,
      sponsorName: values.sponsorName,
      items: v.items.length,
    });
    return { id, slug: values.slug, previousSlug: prev && prev.slug !== values.slug ? prev.slug : null };
  });
}

/** Switches a collection on or off (the active window still applies). */
export async function setExploreCollectionPublished(session: Session, id: string, published: boolean): Promise<{ slug: string; status: CollectionStatus }> {
  const v = parse(z.object({ id: zUuid, published: z.boolean() }), { id, published });
  return asAdmin(session, async (tx, admin) => {
    if (v.published) {
      const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from public.explore_collection_items where collection_id = ${v.id}`;
      if (n === 0) throw new ServiceError("invalid_state", "Eine aktive Sammlung braucht mindestens einen Eintrag.");
    }
    const [row] = await tx<Array<{ slug: string; isPublished: boolean; activeFrom: Date | null; activeUntil: Date | null }>>`
      update public.explore_collections set is_published = ${v.published}, updated_by = ${admin.userId}
      where id = ${v.id} returning slug, is_published, active_from, active_until`;
    if (!row) throw new ServiceError("not_found", "Diese Sammlung gibt es nicht mehr.");
    await audit(tx, admin.userId, v.published ? "explore.publish" : "explore.unpublish", "explore_collection", v.id, { slug: row.slug });
    return { slug: row.slug, status: collectionStatus(row) };
  });
}

export async function deleteExploreCollection(session: Session, id: string): Promise<{ slug: string }> {
  const cid = parse(zUuid, id);
  return asAdmin(session, async (tx, admin) => {
    const [row] = await tx<{ slug: string; title: string }[]>`delete from public.explore_collections where id = ${cid} returning slug, title`;
    if (!row) throw new ServiceError("not_found", "Diese Sammlung gibt es nicht mehr.");
    await audit(tx, admin.userId, "explore.delete", "explore_collection", cid, { slug: row.slug, title: row.title });
    return { slug: row.slug };
  });
}
