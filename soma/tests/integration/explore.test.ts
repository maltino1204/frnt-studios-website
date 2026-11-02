/**
 * „Entdecken / Für dich“ (migration 0011): RLS on collections, admin-only writes (audited), „Für dich“ reads only the
 * customer's own data, the opt-out, and the popularity thresholds („Beliebt in <Stadt>“).
 */
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { withAnon, withService, withUser } from "@/server/db/client";
import { generateBookingReference } from "@/server/domain/reference";
import type { Session } from "@/server/dto";
import { createAddress, toggleFavorite } from "@/server/services/account";
import {
  getExploreCollection,
  getForYou,
  getPersonalizedSuggestions,
  listExploreCollections,
  listNewProviders,
  listPopularByCity,
  setPersonalizedSuggestions,
} from "@/server/services/explore";
import {
  deleteExploreCollection,
  getExploreCollectionPreview,
  saveExploreCollection,
  setExploreCollectionPublished,
} from "@/server/services/explore-admin";
import { createAdmin, createCustomer, createProvider, sql, type ProviderFixture } from "./support/fixtures";

const DAY = 86_400_000;
const tag = randomUUID().slice(0, 6);

/** A booking in the past (or a confirmed one in the future) written by the trusted owner connection (seed mode). */
async function booking(
  p: ProviderFixture,
  customer: Session,
  slug: string,
  opts: { status?: "completed" | "confirmed" | "cancelled"; startDays?: number; createdDays?: number; postalCode?: string; city?: string } = {},
): Promise<string> {
  const status = opts.status ?? "completed";
  const startDays = opts.startDays ?? -3;
  // spread the start times so confirmed (blocking) bookings never overlap
  const startsAt = new Date(Date.now() + startDays * DAY + Math.floor(Math.random() * 600) * 60_000);
  const createdAt = new Date(Date.now() - (opts.createdDays ?? 10) * DAY);
  return withService(async (tx) => {
    await tx`select set_config('soma.seed_mode', 'on', true)`;
    const [o] = await tx<{ id: string; serviceId: string; categoryId: string; name: string; durationMinutes: number; priceCents: number; bookingMode: string }[]>`
      select ps.id, ps.service_id, s.category_id, s.name, ps.duration_minutes, ps.price_cents, p.booking_mode
      from public.provider_services ps join public.services s on s.id = ps.service_id join public.providers p on p.id = ps.provider_id
      where ps.id = ${p.offerings[slug]}`;
    const endsAt = new Date(startsAt.getTime() + o.durationMinutes * 60_000);
    const [row] = await tx<{ id: string }[]>`
      insert into public.bookings (reference, customer_id, provider_id, provider_service_id, service_id, category_id, service_name,
        duration_minutes, starts_at, ends_at, blocked_range, status, booking_mode, address_line, postal_code, city,
        service_price_cents, total_cents, commission_rate, commission_cents, provider_payout_cents, cancellation_policy,
        created_at, confirmed_at, completed_at, cancelled_at)
      values (${generateBookingReference()}, ${customer.userId}, ${p.providerId}, ${o.id}, ${o.serviceId}, ${o.categoryId}, ${o.name},
        ${o.durationMinutes}, ${startsAt}, ${endsAt}, tstzrange(${startsAt}, ${endsAt}), ${status}, ${o.bookingMode}, 'Teststraße 1',
        ${opts.postalCode ?? "10115"}, ${opts.city ?? "Berlin"}, ${o.priceCents}, ${o.priceCents}, 0.2, ${Math.round(o.priceCents * 0.2)},
        ${o.priceCents - Math.round(o.priceCents * 0.2)}, '{}'::jsonb, ${createdAt}, ${createdAt},
        ${status === "completed" ? endsAt : null}, ${status === "cancelled" ? createdAt : null})
      returning id`;
    return row.id;
  });
}

async function insertCollection(slug: string, opts: { published?: boolean; from?: Date | null; until?: Date | null; sponsored?: string | null } = {}): Promise<string> {
  return withService(async (tx) => {
    const [c] = await tx<{ id: string }[]>`
      insert into public.explore_collections (slug, title, subline, is_published, active_from, active_until, is_sponsored, sponsor_name, sort_order)
      values (${slug}, ${`Test ${slug}`}, 'Eine Zeile.', ${opts.published ?? true}, ${opts.from ?? null}, ${opts.until ?? null},
              ${!!opts.sponsored}, ${opts.sponsored ?? null}, 9000)
      returning id`;
    await tx`insert into public.explore_collection_items (collection_id, position, kind, category_id)
             select ${c.id}, 0, 'category', id from public.categories where slug = 'massage'`;
    return c.id;
  });
}

describe("explore collections: RLS", () => {
  const slugs = { live: `t-live-${tag}`, draft: `t-draft-${tag}`, later: `t-later-${tag}`, ended: `t-ended-${tag}` };
  const ids: Record<string, string> = {};
  let admin: Session;
  let customer: Session;

  beforeAll(async () => {
    admin = await createAdmin();
    customer = await createCustomer();
    ids.live = await insertCollection(slugs.live);
    ids.draft = await insertCollection(slugs.draft, { published: false });
    ids.later = await insertCollection(slugs.later, { from: new Date(Date.now() + DAY) });
    ids.ended = await insertCollection(slugs.ended, { from: new Date(Date.now() - 10 * DAY), until: new Date(Date.now() - 60_000) });
  });

  it("anon sees only collections that are live now, and only their items", async () => {
    const all = Object.values(slugs);
    const rows = await withAnon((tx) => tx<{ slug: string }[]>`select slug from public.explore_collections where slug = any(${all})`);
    expect(rows.map((r) => r.slug)).toEqual([slugs.live]);
    const items = await withAnon((tx) => tx<{ collectionId: string }[]>`
      select collection_id from public.explore_collection_items where collection_id = any(${Object.values(ids)}::uuid[])`);
    expect(new Set(items.map((i) => i.collectionId))).toEqual(new Set([ids.live]));
  });

  it("signed-in customers see the same; admins see everything", async () => {
    const all = Object.values(slugs);
    const asCustomer = await withUser(customer.userId, (tx) => tx<{ slug: string }[]>`select slug from public.explore_collections where slug = any(${all})`);
    expect(asCustomer.map((r) => r.slug)).toEqual([slugs.live]);
    const asAdmin = await withUser(admin.userId, (tx) => tx<{ slug: string }[]>`select slug from public.explore_collections where slug = any(${all})`);
    expect(new Set(asAdmin.map((r) => r.slug))).toEqual(new Set(all));
  });

  it("the public service lists and resolves live collections only", async () => {
    const listed = (await listExploreCollections()).map((c) => c.slug);
    expect(listed).toContain(slugs.live);
    for (const s of [slugs.draft, slugs.later, slugs.ended]) expect(listed).not.toContain(s);
    expect(await getExploreCollection(slugs.draft)).toBeNull();
    expect(await getExploreCollection(slugs.later)).toBeNull();
    const live = await getExploreCollection(slugs.live);
    expect(live?.items).toHaveLength(1);
    expect(live?.items[0].href).toBe("/suche?kategorie=massage");
    // The admin preview resolves drafts too.
    const preview = await getExploreCollectionPreview(admin, ids.draft);
    expect(preview?.status).toBe("draft");
    expect(preview?.items).toHaveLength(1);
    await expect(getExploreCollectionPreview(customer, ids.draft)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("carries the sponsored flag and its sponsor; a sponsored row without a sponsor is refused by the database", async () => {
    const slug = `t-ad-${tag}`;
    await insertCollection(slug, { sponsored: "Studio Beispiel GmbH" });
    const card = (await listExploreCollections()).find((c) => c.slug === slug);
    expect(card).toMatchObject({ isSponsored: true, sponsorName: "Studio Beispiel GmbH" });
    const editorial = (await listExploreCollections()).find((c) => c.slug === slugs.live);
    expect(editorial).toMatchObject({ isSponsored: false, sponsorName: null });
    await expect(sql()`insert into public.explore_collections (slug, title, is_sponsored, sponsor_name) values (${`t-ad2-${tag}`}, 'Ohne Auftraggeber', true, ' ')`).rejects.toThrow(
      /explore_collections_sponsor/,
    );
  });
});

describe("explore collections: only admins write", () => {
  let admin: Session;
  let customer: Session;
  let pro: ProviderFixture;

  beforeAll(async () => {
    admin = await createAdmin();
    customer = await createCustomer();
    pro = await createProvider({ basePostalCode: "10119", services: [{ slug: "sportmassage", priceCents: 9100 }] });
  });

  it("anon and customers have no write privilege on collections or items", async () => {
    await expect(withAnon((tx) => tx`insert into public.explore_collections (slug, title) values (${`t-x-${tag}`}, 'X')`)).rejects.toThrow(/permission denied/);
    await expect(withUser(customer.userId, (tx) => tx`insert into public.explore_collections (slug, title) values (${`t-y-${tag}`}, 'Y')`)).rejects.toThrow(/permission denied/);
    await expect(withUser(customer.userId, (tx) => tx`update public.explore_collections set title = 'Gekapert'`)).rejects.toThrow(/permission denied/);
    await expect(withUser(customer.userId, (tx) => tx`delete from public.explore_collection_items`)).rejects.toThrow(/permission denied/);
    // an admin's own API session cannot write either: admin writes go through the audited service
    await expect(withUser(admin.userId, (tx) => tx`insert into public.explore_collections (slug, title) values (${`t-z-${tag}`}, 'Z')`)).rejects.toThrow(/permission denied/);
  });

  it("refuses the admin service for non-admins", async () => {
    await expect(saveExploreCollection(customer, { slug: `t-c-${tag}`, title: "Kunde", items: [] })).rejects.toMatchObject({ code: "forbidden" });
    await expect(saveExploreCollection({ ...customer, role: "admin" }, { slug: `t-c2-${tag}`, title: "Gefälscht", items: [] })).rejects.toMatchObject({ code: "forbidden" });
  });

  it("creates, activates, edits and deletes with an audit entry per write", async () => {
    const [svc] = await sql()<{ id: string }[]>`select id from public.services where slug = 'sportmassage'`;
    const slug = `t-admin-${tag}`;
    const created = await saveExploreCollection(admin, { slug, title: "Nach dem Training", subline: "Eine Zeile.", items: [{ kind: "service", serviceId: svc.id, providerId: pro.providerId }] });
    expect((await listExploreCollections()).map((c) => c.slug)).not.toContain(slug); // a draft until activated
    await setExploreCollectionPublished(admin, created.id, true);
    const live = await getExploreCollection(slug);
    expect(live?.items[0]).toMatchObject({ title: "Sportmassage", price: { cents: 9100, from: false }, provider: { providerId: pro.providerId } });
    expect(live?.items[0].href).toMatch(/^\/profis\/[^?]+\?leistung=sportmassage$/);

    expect(created.previousSlug).toBeNull();
    const renamed = await saveExploreCollection(admin, { id: created.id, slug: `${slug}-2`, title: "Nach dem Training", isPublished: true, items: [{ kind: "service", serviceId: svc.id }] });
    expect(renamed).toMatchObject({ slug: `${slug}-2`, previousSlug: slug }); // both paths are revalidated
    await saveExploreCollection(admin, {
      id: created.id, slug, title: "Nach dem Training", isPublished: true, isSponsored: true, sponsorName: "Beispiel AG",
      items: [{ kind: "category", categoryId: (await sql()<{ id: string }[]>`select id from public.categories where slug = 'massage'`)[0].id, filters: { zeit: "abends" } }],
    });
    const sponsored = await getExploreCollection(slug);
    expect(sponsored).toMatchObject({ isSponsored: true, sponsorName: "Beispiel AG" });
    expect(sponsored?.items[0].href).toBe("/suche?kategorie=massage&zeit=abends");

    await deleteExploreCollection(admin, created.id);
    expect(await getExploreCollection(slug)).toBeNull();
    const log = await sql()<{ action: string }[]>`select action from public.audit_log where entity = 'explore_collection' and entity_id = ${created.id} order by created_at`;
    expect(log.map((l) => l.action)).toEqual(["explore.create", "explore.publish", "explore.update", "explore.update", "explore.delete"]);
  });

  it("validates sponsor, reserved slugs, pinned Profis and duplicates", async () => {
    const [svc] = await sql()<{ id: string }[]>`select id from public.services where slug = 'hot-stone-massage'`;
    await expect(saveExploreCollection(admin, { slug: `t-v1-${tag}`, title: "Anzeige ohne Namen", isSponsored: true, items: [] })).rejects.toMatchObject({
      code: "validation", fieldErrors: { sponsorName: expect.any(String) },
    });
    await expect(saveExploreCollection(admin, { slug: "vorschau", title: "Reserviert", items: [] })).rejects.toMatchObject({ fieldErrors: { slug: expect.any(String) } });
    await expect(saveExploreCollection(admin, { slug: `t-v2-${tag}`, title: "Falscher Profi", items: [{ kind: "service", serviceId: svc.id, providerId: pro.providerId }] })).rejects.toMatchObject({
      fieldErrors: { "items.0.providerId": expect.any(String) },
    });
    await saveExploreCollection(admin, { slug: `t-v3-${tag}`, title: "Einmal", items: [] });
    await expect(saveExploreCollection(admin, { slug: `t-v3-${tag}`, title: "Zweimal", items: [] })).rejects.toMatchObject({ fieldErrors: { slug: expect.any(String) } });
  });
});

describe("„Für dich“", () => {
  let a: Session;
  let b: Session;
  let berlinMassage: ProviderFixture;
  let munichNails: ProviderFixture;
  let berlinNails: ProviderFixture;

  beforeAll(async () => {
    berlinMassage = await createProvider({ basePostalCode: "10115", services: [{ slug: "entspannungsmassage" }, { slug: "hot-stone-massage", priceCents: 12900 }] });
    munichNails = await createProvider({ basePostalCode: "80331", services: [{ slug: "klassische-manikuere", priceCents: 4200 }, { slug: "shellac-manikuere", priceCents: 5400 }] });
    berlinNails = await createProvider({ basePostalCode: "10119", services: [{ slug: "shellac-manikuere", priceCents: 5100 }] });
    a = await createCustomer({ firstName: "Ada" });
    b = await createCustomer({ firstName: "Bea" });
    await createAddress(a, { street: "Torstraße", houseNumber: "1", postalCode: "10115", city: "Berlin" });
    await createAddress(b, { street: "Marienplatz", houseNumber: "1", postalCode: "80331", city: "München" });
    await booking(berlinMassage, a, "entspannungsmassage", { startDays: -20 });
    await booking(munichNails, b, "klassische-manikuere", { startDays: -12, postalCode: "80331", city: "München" });
    await toggleFavorite(a, berlinMassage.providerId);
    await toggleFavorite(b, berlinNails.providerId);
  });

  it("is built only from the customer's own bookings, favourites and default address", async () => {
    const fa = await getForYou(a);
    expect(fa.state).toBe("on");
    if (fa.state !== "on") return;
    expect(fa.place?.postalCode).toBe("10115");
    expect(fa.rebook.map((r) => r.provider.providerId)).toEqual([berlinMassage.providerId]);
    expect(fa.rebook[0]).toMatchObject({ isFavorite: true, serviceName: "Entspannungsmassage (klassisch)" });
    // categories A booked (massage), Profis serving 10115, never the pair A already booked
    expect(fa.matching.length).toBeGreaterThan(0);
    expect(new Set(fa.matching.map((m) => m.categorySlug))).toEqual(new Set(["massage"]));
    expect(fa.matching.some((m) => m.provider?.providerId === berlinMassage.providerId && m.title === "Hot-Stone-Massage")).toBe(true);
    expect(fa.matching.some((m) => m.provider?.providerId === berlinMassage.providerId && m.title === "Entspannungsmassage (klassisch)")).toBe(false);
    const ids = new Set([...fa.matching.map((m) => m.provider?.providerId), ...fa.rebook.map((r) => r.provider.providerId), ...fa.nearbyNew.map((n) => n.providerId)]);
    expect(ids.has(munichNails.providerId)).toBe(false);
    // „Nächster freier Termin“ and the Endpreis come from the engine and the PLZ
    const hot = fa.matching.find((m) => m.title === "Hot-Stone-Massage" && m.provider?.providerId === berlinMassage.providerId);
    expect(hot?.nextSlot).toEqual(expect.any(String));
    expect(hot?.endPriceCents).toBeGreaterThanOrEqual(12900);
    expect(hot?.href).toContain("plz=10115");

    const fb = await getForYou(b);
    if (fb.state !== "on") throw new Error("B should be on");
    expect(fb.place?.postalCode).toBe("80331");
    expect(fb.rebook.map((r) => r.provider.providerId)).toEqual([munichNails.providerId, berlinNails.providerId]);
    expect(fb.rebook[1]).toMatchObject({ bookingId: null, isFavorite: true });
    expect(new Set(fb.matching.map((m) => m.categorySlug))).toEqual(new Set(["manikuere"]));
    expect(fb.matching.map((m) => m.provider?.providerId)).not.toContain(berlinMassage.providerId);
    expect(fb.matching.every((m) => m.provider?.providerId !== berlinNails.providerId)).toBe(true); // 10119 does not serve 80331
  });

  it("shows only what is real without history or address", async () => {
    const fresh = await createCustomer();
    const f = await getForYou(fresh);
    expect(f).toMatchObject({ state: "on", place: null, hasHistory: false, rebook: [], matching: [], nearbyNew: [] });
  });

  it("respects the opt-out: nothing is computed, and the flag is the customer's own", async () => {
    expect(await getPersonalizedSuggestions(a)).toBe(true);
    await setPersonalizedSuggestions(a, false);
    expect(await getForYou(a)).toEqual({ state: "off" });
    // B is unaffected; A cannot switch B's flag through the API
    expect((await getForYou(b)).state).toBe("on");
    const touched = await withUser(a.userId, (tx) => tx`update public.profiles set personalized_suggestions = false where id = ${b.userId}`);
    expect(touched.count).toBe(0);
    await expect(withAnon((tx) => tx`update public.profiles set personalized_suggestions = false`)).rejects.toThrow(/permission denied/);
    await withUser(a.userId, (tx) => tx`update public.profiles set personalized_suggestions = true where id = ${a.userId}`);
    expect((await getForYou(a)).state).toBe("on");
  });

  it("lists recently approved Profis as „Neu auf SOMA“", async () => {
    const list = await listNewProviders({ limit: 12 });
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((p) => Date.now() - Date.parse(p.approvedAt) <= 60 * DAY)).toBe(true);
    await sql()`update public.providers set approved_at = now() - interval '61 days' where id = ${munichNails.providerId}`;
    expect((await listNewProviders({ limit: 12 })).map((p) => p.providerId)).not.toContain(munichNails.providerId);
  });
});

describe("„Beliebt in <Stadt>“ thresholds", () => {
  let pro: ProviderFixture;
  let c: Session;
  const duesseldorf = { postalCode: "40213", city: "Düsseldorf" };
  const popular = async () => (await listPopularByCity()).find((x) => x.citySlug === "duesseldorf") ?? null;

  beforeAll(async () => {
    pro = await createProvider({
      basePostalCode: "40213",
      services: [{ slug: "entspannungsmassage", priceCents: 8700 }, { slug: "sportmassage", priceCents: 9300 }, { slug: "aromaoelmassage", priceCents: 9600 }],
    });
    c = await createCustomer();
  });

  it("shows a city only from 5 bookings and a service only from 3, from the last 90 days, without counts", async () => {
    for (let i = 0; i < 3; i += 1) await booking(pro, c, "entspannungsmassage", { startDays: -2 - i, createdDays: 5 + i, ...duesseldorf });
    await booking(pro, c, "sportmassage", { startDays: -6, createdDays: 9, ...duesseldorf });
    // not counted: cancelled, and made before the 90-day window
    await booking(pro, c, "aromaoelmassage", { status: "cancelled", startDays: -7, createdDays: 9, ...duesseldorf });
    await booking(pro, c, "aromaoelmassage", { startDays: -95, createdDays: 100, ...duesseldorf });
    expect(await popular()).toBeNull();
    // the floors hold in the database, whatever the caller asks for
    const raw = await withAnon((tx) => tx`select * from public.explore_popular_services('duesseldorf', 90, 1, 1, 12)`);
    expect(raw).toHaveLength(0);

    await booking(pro, c, "aromaoelmassage", { startDays: -8, createdDays: 11, ...duesseldorf }); // 5th counted booking
    const five = await popular();
    expect(five?.cards.map((x) => x.title)).toEqual(["Entspannungsmassage (klassisch)"]);
    expect(five?.cards[0]).toMatchObject({ price: { cents: 8700, from: true }, href: "/suche?kategorie=massage&leistung=entspannungsmassage" });
    expect(Object.keys(five?.cards[0] ?? {})).not.toContain("bookingCount");
    const rawFive = await withAnon((tx) => tx<{ bookingCount: number }[]>`select * from public.explore_popular_services('duesseldorf', 90, 1, 1, 12)`);
    expect(rawFive.map((r) => r.bookingCount)).toEqual([3]);

    await booking(pro, c, "sportmassage", { startDays: -9, createdDays: 12, ...duesseldorf });
    await booking(pro, c, "sportmassage", { status: "confirmed", startDays: 3, createdDays: 1, ...duesseldorf });
    const more = await popular();
    expect(new Set(more?.cards.map((x) => x.title))).toEqual(new Set(["Entspannungsmassage (klassisch)", "Sportmassage"]));
  });
});
