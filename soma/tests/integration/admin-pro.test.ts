import { describe, expect, it } from "vitest";
import type { Session } from "@/server/dto";
import { ServiceError } from "@/server/errors";
import { openDispute } from "@/server/services/account";
import {
  adminCancelBooking,
  createCommissionRule,
  createPayoutBatch,
  decideProvider,
  listUsers,
  listVerificationQueue,
  markPayoutPaid,
  refundPayment,
  resolveDispute,
  reviewDocument,
  upsertContentBlock,
} from "@/server/services/admin";
import { getMarketplaceKpis, getSupplyDemandByCity, getTimeSeries } from "@/server/services/analytics";
import { completeBooking, confirmDevPayment, createBooking } from "@/server/services/bookings";
import { getCityCategoryCoverage } from "@/server/services/catalog";
import {
  getEarnings,
  getOnboardingState,
  setWeeklyHours,
  submitForReview,
  updateProProfile,
  updateServiceArea,
  upsertProService,
  uploadDocument,
} from "@/server/services/pro";
import { joinWaitlist, searchProviders } from "@/server/services/search";
import { createAdmin, createCustomer, createProvider, NEW_ADDRESS, slotAtLeast, sql, timeTravel, uniqueEmail } from "./support/fixtures";

const PDF = new TextEncoder().encode("%PDF-1.4\n% SOMA test document\n");

describe("admin authorisation", () => {
  it("refuses admin services for non-admins (and for forged sessions)", async () => {
    const customer = await createCustomer();
    const pro = await createProvider();
    const forged: Session = { ...customer, role: "admin" };
    for (const s of [customer, pro.session, forged]) {
      await expect(listUsers(s)).rejects.toMatchObject({ code: "forbidden" });
      await expect(decideProvider(s, pro.providerId, "suspend", "Test-Sperre")).rejects.toBeInstanceOf(ServiceError);
      await expect(getMarketplaceKpis(s)).rejects.toMatchObject({ code: "forbidden" });
      await expect(upsertContentBlock(s, "announcement", { active: true, text: "Hack" })).rejects.toMatchObject({ code: "forbidden" });
    }
    const [{ status }] = await sql()<{ status: string }[]>`select status from public.providers where id = ${pro.providerId}`;
    expect(status).toBe("approved");
  });
});

describe("provider onboarding → verification", () => {
  it("lists missing documents per category (Haare & Styling needs Meisterbrief/Handwerksrolle) and warns on approval", async () => {
    const admin = await createAdmin();
    const pro = await createProvider({ status: "draft", services: [{ slug: "damenhaarschnitt" }, { slug: "entspannungsmassage" }] });
    await updateProProfile(pro.session, { displayName: "Kiran S.", headline: "Schnitt & Styling", bio: "Seit zehn Jahren schneide und style ich Haare – mit Ruhe, Präzision und viel Gefühl für Typ und Alltag.", languages: ["de", "en"] });
    await expect(updateProProfile(pro.session, { displayName: "Kiran S.", bio: "Meine Massage lindert Rückenschmerzen.", languages: ["de"] })).rejects.toThrow(/Heilversprechen/);

    let state = await getOnboardingState(pro.session);
    const labels = state.missingDocuments.map((m) => `${m.categorySlug ?? "-"}:${m.label}`);
    expect(labels).toContain("haare-styling:Meisterbrief oder Eintragung in die Handwerksrolle");
    expect(labels).toContain("-:Gewerbeanmeldung");
    expect(state.canSubmit).toBe(false);

    for (const kind of ["id_document", "business_registration", "insurance"] as const) {
      await uploadDocument(pro.session, kind, { fileName: `${kind}.pdf`, contentType: "application/pdf", bytes: PDF });
    }
    const [hair] = await sql()<{ id: string }[]>`select id from public.categories where slug = 'haare-styling'`;
    const [massage] = await sql()<{ id: string }[]>`select id from public.categories where slug = 'massage'`;
    await uploadDocument(pro.session, "qualification", { fileName: "meisterbrief.pdf", contentType: "application/pdf", bytes: PDF }, hair.id);
    state = await getOnboardingState(pro.session);
    expect(state.missingDocuments.map((m) => m.categorySlug)).toEqual(["massage"]);
    await uploadDocument(pro.session, "qualification", { fileName: "massage.pdf", contentType: "application/pdf", bytes: PDF }, massage.id);
    await expect(uploadDocument(pro.session, "other", { fileName: "x.exe", contentType: "application/pdf", bytes: new Uint8Array([0x4d, 0x5a, 1, 2]) })).rejects.toThrow(/PDF, JPG oder PNG/);

    state = await getOnboardingState(pro.session);
    expect(state.missingDocuments).toEqual([]);
    expect(state.canSubmit).toBe(true);
    expect((await submitForReview(pro.session)).status).toBe("submitted");
    expect((await listVerificationQueue(admin)).map((p) => p.providerId)).toContain(pro.providerId);

    // documents are pending → approval warns but is allowed
    const result = await decideProvider(admin, pro.providerId, "approve");
    expect(result.status).toBe("approved");
    expect(result.warnings.some((w) => w.includes("Meisterbrief"))).toBe(true);
    const [evt] = await sql()<{ toStatus: string; actorId: string }[]>`select to_status, actor_id from public.provider_status_events where provider_id = ${pro.providerId} order by created_at desc limit 1`;
    expect(evt).toEqual({ toStatus: "approved", actorId: admin.userId });
    const [audit] = await sql()<{ n: number }[]>`select count(*)::int as n from public.audit_log where entity_id = ${pro.providerId} and action = 'provider.approve'`;
    expect(audit.n).toBe(1);

    const docs = await sql()<{ id: string }[]>`select id from public.provider_documents where provider_id = ${pro.providerId}`;
    for (const d of docs) await reviewDocument(admin, d.id, "approved");
    await decideProvider(admin, pro.providerId, "suspend", "Kurzzeitige Prüfung");
    expect((await decideProvider(admin, pro.providerId, "reinstate")).warnings).toEqual([]);
  });

  it("validates service durations, weekly hours and service area", async () => {
    const pro = await createProvider({ status: "draft" });
    const [svc] = await sql()<{ id: string }[]>`select id from public.services where slug = 'hot-stone-massage'`;
    await expect(upsertProService(pro.session, { serviceId: svc.id, durationMinutes: 30, priceCents: 9000 })).rejects.toThrow(/Dauer/);
    expect((await upsertProService(pro.session, { serviceId: svc.id, durationMinutes: 100, priceCents: 12_000 })).priceCents).toBe(12_000);
    await expect(setWeeklyHours(pro.session, [{ weekday: 1, start: "09:00", end: "12:00" }, { weekday: 1, start: "11:00", end: "14:00" }])).rejects.toThrow(/überschneiden/);
    expect(await setWeeklyHours(pro.session, [{ weekday: 1, start: "09:00", end: "12:00" }, { weekday: 1, start: "15:00", end: "20:00" }])).toHaveLength(2);
    await expect(updateServiceArea(pro.session, { basePostalCode: "00000", serviceRadiusKm: 10, travelFeeBaseCents: 0, travelFeeIncludedKm: 0, travelFeePerKmCents: 0 })).rejects.toThrow(/Postleitzahl/);
  });
});

describe("refunds, disputes and payouts", () => {
  it("payout batches include only bookings completed ≥ 48 h ago without an open dispute", async () => {
    const admin = await createAdmin();
    const pro = await createProvider();
    const c = await createCustomer();
    const ids: string[] = [];
    for (const h of [3, 6, 9]) {
      const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, h);
      const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
      await confirmDevPayment(c, b.bookingId);
      await timeTravel(b.bookingId, new Date(Date.now() - (2 + ids.length) * 3_600_000));
      await completeBooking(pro.session, b.bookingId);
      ids.push(b.bookingId);
    }
    // #0: completed 3 days ago → available; #1: completed 3 days ago but disputed → pending; #2: just now → pending
    await sql()`update public.bookings set completed_at = now() - interval '3 days' where id = any(${[ids[0], ids[1]]}::uuid[])`;
    await sql()`update public.bookings set completed_at = now() - interval '1 hour' where id = ${ids[1]}`;
    const dispute = await openDispute(c, ids[1], "quality", "Die Behandlung war deutlich kürzer als gebucht.");
    await sql()`update public.bookings set completed_at = now() - interval '3 days' where id = ${ids[1]}`;

    const earnings = await getEarnings(pro.session);
    const state = Object.fromEntries(earnings.items.map((i) => [i.bookingId, i.payoutState]));
    expect(state[ids[0]]).toBe("available");
    expect(state[ids[1]]).toBe("pending");
    expect(state[ids[2]]).toBe("pending");
    expect(earnings.items.find((i) => i.bookingId === ids[1])?.disputed).toBe(true);

    const batch = await createPayoutBatch(admin);
    const mine = batch.payouts.find((p) => p.providerId === pro.providerId);
    expect(mine?.bookingCount).toBe(1);
    const [b0] = await sql()<{ providerPayoutCents: number; payoutId: string }[]>`select provider_payout_cents, payout_id from public.bookings where id = ${ids[0]}`;
    expect(mine?.amountCents).toBe(b0.providerPayoutCents);
    await markPayoutPaid(admin, b0.payoutId);
    expect(Object.fromEntries((await getEarnings(pro.session)).items.map((i) => [i.bookingId, i.payoutState]))[ids[0]]).toBe("paid_out");

    // resolve the dispute with a partial refund → afterwards it becomes payable
    await resolveDispute(admin, dispute.disputeId, "refund", "Teilerstattung wegen verkürzter Behandlung", 2000);
    const [pay] = await sql()<{ status: string; refundedCents: number }[]>`select status, refunded_cents from public.payments where booking_id = ${ids[1]}`;
    expect(pay).toEqual({ status: "partially_refunded", refundedCents: 2000 });
    const again = await createPayoutBatch(admin);
    expect(again.payouts.find((p) => p.providerId === pro.providerId)?.bookingCount).toBe(1);
    await expect(refundPayment(admin, ids[2], 999_999, "zu viel")).rejects.toThrow(/höchstens/);
  });

  it("admin cancellation with an explicit fee and versioned commission rules", async () => {
    const admin = await createAdmin();
    const pro = await createProvider();
    const c = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 30);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await confirmDevPayment(c, b.bookingId);
    expect((await adminCancelBooking(admin, b.bookingId, "Kulanz nach Rücksprache", 1000)).feeCents).toBe(1000);

    await createCommissionRule(admin, { scope: "provider", providerId: pro.providerId, rate: 0.15, repeatClientRate: 0.1, ownClientRate: 0.03 });
    await createCommissionRule(admin, { scope: "provider", providerId: pro.providerId, rate: 0.18, repeatClientRate: 0.1, ownClientRate: 0.03 });
    const rules = await sql()<{ rate: string; isActive: boolean }[]>`select rate::text as rate, is_active from public.commission_rules where provider_id = ${pro.providerId} order by created_at`;
    expect(rules.map((r) => [Number(r.rate), r.isActive])).toEqual([[0.15, false], [0.18, true]]);
    const c2 = await createCustomer();
    const slot2 = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 40);
    const b2 = await createBooking(c2, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot2, address: NEW_ADDRESS });
    const [row] = await sql()<{ commissionRate: string }[]>`select commission_rate::text as commission_rate from public.bookings where id = ${b2.bookingId}`;
    expect(Number(row.commissionRate)).toBeCloseTo(0.18);
  });
});

describe("demand capture, coverage and analytics", () => {
  it("logs empty searches, accepts waitlist sign-ups, reports coverage and KPIs", async () => {
    const admin = await createAdmin();
    const res = await searchProviders({ postalCode: "01067", categorySlug: "make-up" });
    expect(res.total).toBe(0);
    expect(res.location.isLaunchCity).toBe(false);
    const email = uniqueEmail("warteliste");
    await joinWaitlist({ email, postalCode: "60311", categorySlug: "make-up" });
    await joinWaitlist({ email: email.toUpperCase(), postalCode: "60311", categorySlug: "make-up" }); // idempotent (citext)
    const [{ n }] = await sql()<{ n: number }[]>`select count(*)::int as n from public.waitlist_signups where email = ${email}`;
    expect(n).toBe(1);

    await createProvider({ basePostalCode: "60311", services: [{ slug: "tages-make-up" }] });
    const one = await getCityCategoryCoverage("frankfurt", "make-up");
    await createProvider({ basePostalCode: "60313", services: [{ slug: "event-make-up" }] });
    const two = await getCityCategoryCoverage("frankfurt", "make-up");
    expect(two.providerCount).toBe(one.providerCount + 1);
    expect(two.indexable).toBe(two.providerCount >= 2);

    const kpis = await getMarketplaceKpis(admin);
    expect(kpis.searches).toBeGreaterThan(0);
    expect(kpis.waitlistSignups).toBeGreaterThanOrEqual(1);
    const supply = await getSupplyDemandByCity(admin);
    const ffm = supply.find((r) => r.citySlug === "frankfurt");
    expect(ffm?.waitlistSignups).toBeGreaterThanOrEqual(1);
    expect(ffm?.byCategory.find((c) => c.categorySlug === "make-up")?.providers).toBeGreaterThanOrEqual(2);
    expect(ffm?.openSlotHours7d).toBeGreaterThan(0);
    expect((await getTimeSeries(admin, { days: 7 })).length).toBe(7);
  });
});
