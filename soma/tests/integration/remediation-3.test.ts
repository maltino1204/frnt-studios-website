import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEMO_ACTION_DISABLED } from "@/server/auth/demo-accounts";
import { changeLocalPassword, createLocalUser, requestLocalPasswordReset, verifyLocalPassword } from "@/server/auth/local";
import { verifyPasswordWithLimit } from "@/server/auth/reauth";
import { loadSession } from "@/server/auth/session-store";
import { resetConfigCache } from "@/server/config";
import { withUser } from "@/server/db/client";
import { decideProvider, reviewDocument, setUserBlocked } from "@/server/services/admin";
import { getDemandByPostalRegion, getOpsQueues } from "@/server/services/admin-ext";
import { getMarketplaceKpis, getTimeSeries } from "@/server/services/analytics";
import { cancelBooking, completeBooking, confirmDevPayment, createBooking, listRebookSuggestions } from "@/server/services/bookings";
import { anonymizeOwnAccount, anonymizeUser } from "@/server/services/privacy";
import { listProServices, upsertProService } from "@/server/services/pro";
import { getProviderAvailability, getProviderProfile } from "@/server/services/providers";
import { createAdmin, createCustomer, createProvider, NEW_ADDRESS, PASSWORD, sessionFor, slotAtLeast, sql, timeTravel } from "./support/fixtures";

const HOUR = 3_600_000;

async function approvedDoc(providerId: string, kind: string, categoryId: string | null = null) {
  const [row] = await sql()<{ id: string }[]>`
    insert into public.provider_documents (provider_id, kind, category_id, storage_path, file_name, mime_type, size_bytes, status, reviewed_at)
    values (${providerId}, ${kind}, ${categoryId}, ${`documents/${providerId}/${crypto.randomUUID()}.pdf`}, ${`${kind}.pdf`}, 'application/pdf', 100, 'approved', now())
    returning id`;
  return row.id;
}
const categoryId = async (slug: string) => (await sql()<{ id: string }[]>`select id from public.categories where slug = ${slug}`)[0].id;
const serviceId = async (slug: string) => (await sql()<{ id: string }[]>`select id from public.services where slug = ${slug}`)[0].id;

describe("category qualification gate (audit-3 F2)", () => {
  it("stores a new offering without the category document as 'wartet auf Nachweis' and activates it on approval", async () => {
    const admin = await createAdmin();
    const pro = await createProvider();
    for (const kind of ["id_document", "business_registration", "insurance"]) await approvedDoc(pro.providerId, kind);
    await approvedDoc(pro.providerId, "qualification", await categoryId("massage"));

    const saved = await upsertProService(pro.session, { serviceId: await serviceId("damenhaarschnitt"), durationMinutes: 60, priceCents: 6900 });
    expect(saved).toMatchObject({ isActive: false, awaitingDocuments: true, missingDocuments: ["Meisterbrief oder Eintragung in die Handwerksrolle"] });
    const [slug] = await sql()<{ slug: string }[]>`select slug from public.providers where id = ${pro.providerId}`;
    const profile = await getProviderProfile(slug.slug);
    expect(profile?.offerings.map((o) => o.serviceSlug)).not.toContain("damenhaarschnitt");
    expect(profile?.verifiedQualifications.map((q) => q.categorySlug)).toEqual(["massage"]);
    const today = new Date().toISOString().slice(0, 10);
    await expect(getProviderAvailability(pro.providerId, saved.providerServiceId, today, 3)).rejects.toMatchObject({ code: "not_found" });
    expect((await getOpsQueues(admin, { limit: 50 })).documentAlerts.find((a) => a.providerId === pro.providerId)).toMatchObject({ status: "awaiting" });

    // the Data API path cannot switch it on either (DB trigger)
    await withUser(pro.providerId, (tx) => tx`update public.provider_services set is_active = true where id = ${saved.providerServiceId}`);
    const [still] = await sql()<{ isActive: boolean; awaitingDocuments: boolean }[]>`select is_active, awaiting_documents from public.provider_services where id = ${saved.providerServiceId}`;
    expect(still).toEqual({ isActive: false, awaitingDocuments: true });

    const [doc] = await sql()<{ id: string }[]>`
      insert into public.provider_documents (provider_id, kind, category_id, storage_path, file_name, mime_type, size_bytes)
      values (${pro.providerId}, 'qualification', ${await categoryId("haare-styling")}, ${`documents/${pro.providerId}/${crypto.randomUUID()}.pdf`}, 'meisterbrief.pdf', 'application/pdf', 100)
      returning id`;
    expect(await reviewDocument(admin, doc.id, "approved")).toEqual({ providerSuspended: false, offeringsActivated: 1 });
    const after = (await listProServices(pro.session)).find((o) => o.providerServiceId === saved.providerServiceId);
    expect(after).toMatchObject({ isActive: true, awaitingDocuments: false, missingDocuments: [] });
    expect((await getProviderProfile(slug.slug))?.verifiedQualifications.map((q) => q.categorySlug).sort()).toEqual(["haare-styling", "massage"]);
  });

  it("a provider switching the offering off clears the waiting state", async () => {
    const pro = await createProvider();
    const sid = await serviceId("wimpernlifting");
    expect((await upsertProService(pro.session, { serviceId: sid, durationMinutes: 60, priceCents: 5900 })).awaitingDocuments).toBe(true);
    expect(await upsertProService(pro.session, { serviceId: sid, durationMinutes: 60, priceCents: 5900, isActive: false })).toMatchObject({ isActive: false, awaitingDocuments: false });
  });
});

describe("category qualification gate, audit-4 follow-ups", () => {
  it("an approved qualification without a category unlocks no category (A4-3)", async () => {
    const pro = await createProvider();
    for (const kind of ["id_document", "business_registration", "insurance"]) await approvedDoc(pro.providerId, kind);
    await approvedDoc(pro.providerId, "qualification", null);
    const saved = await upsertProService(pro.session, { serviceId: await serviceId("herrenhaarschnitt"), durationMinutes: 30, priceCents: 4500 });
    expect(saved).toMatchObject({ isActive: false, awaitingDocuments: true, missingDocuments: ["Meisterbrief oder Eintragung in die Handwerksrolle"] });
    const [slug] = await sql()<{ slug: string }[]>`select slug from public.providers where id = ${pro.providerId}`;
    expect((await getProviderProfile(slug.slug))?.verifiedQualifications.map((q) => q.categorySlug)).not.toContain("haare-styling");
  });

  it("an API session cannot opt into seed mode to skip the gate (A4-1)", async () => {
    const pro = await createProvider();
    const saved = await upsertProService(pro.session, { serviceId: await serviceId("wimpernlifting"), durationMinutes: 60, priceCents: 5900 });
    expect(saved.awaitingDocuments).toBe(true);
    await withUser(pro.providerId, async (tx) => {
      await tx`select set_config('soma.seed_mode', 'on', true)`;
      await tx`update public.provider_services set is_active = true where id = ${saved.providerServiceId}`;
    }).catch(() => undefined);
    const [row] = await sql()<{ isActive: boolean }[]>`select is_active from public.provider_services where id = ${saved.providerServiceId}`;
    expect(row.isActive).toBe(false);
  });

  it("'Leistung hinzufügen' refuses an offering that already exists instead of overwriting its price (A4-2)", async () => {
    const pro = await createProvider();
    const [existing] = await sql()<{ serviceId: string; durationMinutes: number; priceCents: number }[]>`
      select service_id, duration_minutes, price_cents from public.provider_services where id = ${pro.offerings.entspannungsmassage}`;
    await expect(
      upsertProService(pro.session, { serviceId: existing.serviceId, durationMinutes: existing.durationMinutes, priceCents: existing.priceCents + 1000, createOnly: true }),
    ).rejects.toMatchObject({ code: "conflict" });
    const [after] = await sql()<{ priceCents: number }[]>`select price_cents from public.provider_services where id = ${pro.offerings.entspannungsmassage}`;
    expect(after.priceCents).toBe(existing.priceCents);
  });
});

describe("rebook suggestions (audit-3 F11)", () => {
  it("returns the last completed booking per provider even when newer bookings were cancelled", async () => {
    const proA = await createProvider();
    const proB = await createProvider();
    const c = await createCustomer();
    const slot = await slotAtLeast(proA.providerId, proA.offerings.entspannungsmassage, 3);
    const done = await createBooking(c, { providerServiceId: proA.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await confirmDevPayment(c, done.bookingId);
    await timeTravel(done.bookingId, new Date(Date.now() - 30 * HOUR));
    await completeBooking(proA.session, done.bookingId);
    for (const h of [30, 33, 36]) {
      const s = await slotAtLeast(proB.providerId, proB.offerings.entspannungsmassage, h);
      const b = await createBooking(c, { providerServiceId: proB.offerings.entspannungsmassage, startsAt: s, address: NEW_ADDRESS });
      await confirmDevPayment(c, b.bookingId);
      await cancelBooking(c, b.bookingId);
    }
    const r = await listRebookSuggestions(c);
    expect(r.map((x) => x.id)).toEqual([done.bookingId]);
    expect(r[0]).toMatchObject({ status: "completed" });
  });
});

describe("one counting rule for searches (audit-3 F8)", () => {
  it("overview KPI, daily chart and regions count the same searches of the last 30 × 24 h", async () => {
    const admin = await createAdmin();
    const DAY = 24 * HOUR;
    // just inside and just outside the window, plus one on today's date
    for (const ms of [30 * DAY - HOUR, 30 * DAY + HOUR, 29 * DAY + 2 * HOUR, 5 * 60_000]) {
      await sql()`insert into public.search_events (postal_code, city_slug, results_count, created_at) values ('10435', 'berlin', 2, ${new Date(Date.now() - ms)})`;
    }
    const now = new Date();
    const [kpi, series, regions] = await Promise.all([
      getMarketplaceKpis(admin, { from: new Date(now.getTime() - 30 * DAY).toISOString(), to: now.toISOString() }),
      getTimeSeries(admin, { days: 30 }),
      getDemandByPostalRegion(admin, { days: 30 }),
    ]);
    const chart = series.reduce((a, p) => a + p.searches, 0);
    expect(chart).toBe(kpi.searches);
    expect(regions.reduce((a, r) => a + r.searches, 0)).toBe(kpi.searches);
  });
});

describe("password re-check rate limit (audit-3 F16)", () => {
  it("allows 5 failures per 15 minutes, then refuses even the right password", async () => {
    const c = await createCustomer();
    for (let i = 0; i < 5; i += 1) expect(await verifyPasswordWithLimit(c.userId, "falsch-falsch-falsch", verifyLocalPassword)).toBe(false);
    await expect(verifyPasswordWithLimit(c.userId, PASSWORD, verifyLocalPassword)).rejects.toMatchObject({ code: "rate_limited" });
    await sql()`update app_private.reauth_attempts set created_at = created_at - interval '16 minutes' where user_id = ${c.userId}`;
    expect(await verifyPasswordWithLimit(c.userId, PASSWORD, verifyLocalPassword)).toBe(true);
  });
});

describe("protected demo accounts (audit-3 F7)", () => {
  const previous = process.env.DEMO_MODE;
  let customerId = "";
  let providerId = "";
  beforeAll(async () => {
    process.env.DEMO_MODE = "true";
    resetConfigCache();
    customerId = await createLocalUser({ email: "testkunde@soma.test", password: PASSWORD, firstName: "Julia", lastName: "Hartmann", role: "customer" });
    providerId = await createLocalUser({ email: "hanna@profis.soma.test", password: PASSWORD, firstName: "Hanna", lastName: "Berger", role: "provider" });
    await sql()`update public.providers set status = 'approved' where id = ${providerId}`;
  });
  afterAll(() => {
    if (previous === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = previous;
    resetConfigCache();
  });

  it("marks demo sessions and refuses password change, reset and self-deletion with the neutral notice", async () => {
    const session = await sessionFor(customerId);
    expect(session.isDemoAccount).toBe(true);
    expect((await createCustomer()).isDemoAccount).toBe(false);
    await expect(changeLocalPassword(customerId, PASSWORD, "ganz-neues-passwort")).rejects.toMatchObject({ code: "forbidden", message: DEMO_ACTION_DISABLED });
    expect(await verifyLocalPassword(customerId, PASSWORD)).toBe(true);
    expect(await requestLocalPasswordReset("testkunde@soma.test")).toBeNull();
    await expect(anonymizeOwnAccount(session)).rejects.toMatchObject({ message: DEMO_ACTION_DISABLED });
  });

  it("refuses admin block, anonymise, suspend and document rejection for demo accounts", async () => {
    const admin = await createAdmin();
    await expect(setUserBlocked(admin, customerId, true, "Test-Sperre")).rejects.toMatchObject({ message: DEMO_ACTION_DISABLED });
    await expect(anonymizeUser(admin, customerId, "Löschantrag Test")).rejects.toMatchObject({ message: DEMO_ACTION_DISABLED });
    await expect(decideProvider(admin, providerId, "suspend", "Test-Sperre")).rejects.toMatchObject({ message: DEMO_ACTION_DISABLED });
    const doc = await approvedDoc(providerId, "insurance");
    await expect(reviewDocument(admin, doc, "rejected", "Abgelaufen")).rejects.toMatchObject({ message: DEMO_ACTION_DISABLED });
    const [p] = await sql()<{ blockedAt: Date | null }[]>`select blocked_at from public.profiles where id = ${customerId}`;
    expect(p.blockedAt).toBeNull();
    expect((await loadSession(providerId))?.isDemoAccount).toBe(true);
    // ordinary accounts are unaffected
    const other = await createCustomer();
    await expect(setUserBlocked(admin, other.userId, true, "Test-Sperre")).resolves.toBeUndefined();
  });
});
