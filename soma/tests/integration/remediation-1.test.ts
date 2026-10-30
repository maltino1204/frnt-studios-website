import { describe, expect, it } from "vitest";
import { createLocalSession, resolveLocalSession, verifyLocalCredentials, verifyLocalPassword } from "@/server/auth/local";
import { CONTACT_LINT_MESSAGES } from "@/server/domain/content-lint";
import { adjustCredits, moderateReview } from "@/server/services/admin";
import { getUserForAdmin, listReviewsAdmin } from "@/server/services/admin-ext";
import { completeBooking, confirmDevPayment, createBooking, getBookingForProvider, quoteBooking } from "@/server/services/bookings";
import { updateProProfile } from "@/server/services/pro";
import { getProviderAvailability } from "@/server/services/providers";
import { anonymizeOwnAccount, anonymizeUser, exportMyData, exportUserData } from "@/server/services/privacy";
import { createReview, replyToReview } from "@/server/services/reviews";
import { createAdmin, createCustomer, createProvider, NEW_ADDRESS, PASSWORD, slotAtLeast, sql, timeTravel } from "./support/fixtures";

const HOUR = 3_600_000;

async function completedBooking(opts: { firstName?: string } = {}) {
  const pro = await createProvider();
  const c = await createCustomer({ firstName: opts.firstName });
  const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
  const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS, notes: "Bitte zweimal klingeln." });
  await confirmDevPayment(c, b.bookingId);
  await timeTravel(b.bookingId, new Date(Date.now() - 2 * HOUR));
  await completeBooking(pro.session, b.bookingId);
  return { pro, c, b };
}

describe("contact lint on free texts (audit-1 R7)", () => {
  it("rejects contact details in the provider profile with the du-message", async () => {
    const pro = await createProvider({ status: "draft" });
    const base = { displayName: "Mira K.", languages: ["de"] };
    for (const bio of ["Ruf mich gern an: 0170 123 45 67", "Termine auch direkt: +49 (0)30-1234567", "Schreib mir: mira@example.de", "Mehr auf Insta @mira.nails", "Alle Infos auf www.mira-nails.de", "Am schnellsten per WhatsApp"]) {
      await expect(updateProProfile(pro.session, { ...base, bio }), bio).rejects.toMatchObject({
        code: "validation",
        message: CONTACT_LINT_MESSAGES.providerProfile,
        fieldErrors: { bio: CONTACT_LINT_MESSAGES.providerProfile },
      });
    }
    await expect(updateProProfile(pro.session, { ...base, headline: "Nails · Insta mira", bio: "Seit 2016 Nageldesign." })).rejects.toMatchObject({ fieldErrors: { headline: CONTACT_LINT_MESSAGES.providerProfile } });
    const ok = await updateProProfile(pro.session, { ...base, headline: "Gel & Pflege seit 2016", bio: "Ich arbeite ruhig und präzise, 45–60 Minuten pro Termin, 2 Jahre Haltbarkeit der Pflege-Routine." });
    expect(ok.bio).toContain("45–60 Minuten");
  });

  it("rejects contact details in booking notes (Sie) and keeps the phone hidden until confirmation", async () => {
    const pro = await createProvider({ bookingMode: "request" });
    const c = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 30);
    await expect(createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS, notes: "Bitte vorher anrufen: 0151 2345 6789" })).rejects.toMatchObject({
      code: "validation",
      message: CONTACT_LINT_MESSAGES.customerNotes,
      fieldErrors: { notes: CONTACT_LINT_MESSAGES.customerNotes },
    });
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS, notes: "Parkplatz im Hof." });
    await confirmDevPayment(c, b.bookingId);
    const asPro = await getBookingForProvider(pro.session, b.bookingId);
    expect(asPro?.status).toBe("requested");
    expect(asPro?.customer.phone).toBeNull();
    expect(asPro?.notes).toBe("Parkplatz im Hof.");
  });

  it("rejects contact details in reviews (Sie) and replies (du)", async () => {
    const { pro, c, b } = await completedBooking();
    await expect(createReview(c, b.bookingId, 5, "Super, buche sie direkt über anna@example.com")).rejects.toMatchObject({ message: CONTACT_LINT_MESSAGES.customerReview, fieldErrors: { comment: CONTACT_LINT_MESSAGES.customerReview } });
    const { reviewId } = await createReview(c, b.bookingId, 5, "Sehr entspannend, gerne wieder.");
    await expect(replyToReview(pro.session, reviewId, "Danke! Nächstes Mal gern per WhatsApp 0176-1234567")).rejects.toMatchObject({ message: CONTACT_LINT_MESSAGES.providerReply, fieldErrors: { reply: CONTACT_LINT_MESSAGES.providerReply } });
    await replyToReview(pro.session, reviewId, "Danke dir, bis bald.");
  });
});

describe("request-mode response window (audit-1 R9)", () => {
  it("does not offer or accept request slots that leave the provider less than 30 minutes to answer", async () => {
    const pro = await createProvider({ bookingMode: "request", leadTimeMinutes: 0 });
    const c = await createCustomer();
    const today = new Date().toISOString().slice(0, 10);
    const days = await getProviderAvailability(pro.providerId, pro.offerings.entspannungsmassage, today, 2);
    const first = days.flatMap((d) => d.slots).map(Date.parse).sort((a, b) => a - b)[0];
    // earliest possible start = now + 30 business minutes + 2 h ≥ now + 2.5 h
    expect(first).toBeGreaterThanOrEqual(Date.now() + 2.5 * HOUR - 60_000);

    const tooSoon = new Date(Math.ceil((Date.now() + 75 * 60_000) / (30 * 60_000)) * 30 * 60_000).toISOString();
    expect((await quoteBooking({ providerServiceId: pro.offerings.entspannungsmassage, startsAt: tooSoon, postalCode: NEW_ADDRESS.postalCode }, c)).slotAvailable).toBe(false);
    await expect(createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: tooSoon, address: NEW_ADDRESS })).rejects.toMatchObject({
      code: "unavailable",
      message: "Für diesen Termin bliebe zu wenig Zeit für die Antwort des Profis. Bitte wählen Sie einen späteren Termin.",
    });
  });
});

describe("time-based provider actions (audit-1 R18)", () => {
  it("exposes canStart / canComplete / canNoShow and startAvailableAt", async () => {
    const pro = await createProvider({ leadTimeMinutes: 0 });
    const c = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await confirmDevPayment(c, b.bookingId);
    const before = await getBookingForProvider(pro.session, b.bookingId);
    expect(before).toMatchObject({ canStart: false, canComplete: false, canNoShow: false });
    expect(before?.startAvailableAt).toBe(new Date(Date.parse(slot) - 30 * 60_000).toISOString());
    expect(before?.noShowAvailableAt).toBe(new Date(Date.parse(slot) + 15 * 60_000).toISOString());

    await timeTravel(b.bookingId, new Date(Date.now() + 20 * 60_000));
    expect(await getBookingForProvider(pro.session, b.bookingId)).toMatchObject({ canStart: true, canComplete: false, canNoShow: false });
    await timeTravel(b.bookingId, new Date(Date.now() - 20 * 60_000));
    expect(await getBookingForProvider(pro.session, b.bookingId)).toMatchObject({ canStart: true, canComplete: true, canNoShow: true, actions: { canMarkNoShow: true } });
  });
});

describe("admin moderation, credits and privacy (audit-1 R20)", () => {
  it("lists, filters and hides/unhides reviews (audited, aggregate follows)", async () => {
    const admin = await createAdmin();
    const { pro, c, b } = await completedBooking({ firstName: "Rosa" });
    const { reviewId } = await createReview(c, b.bookingId, 1, "Leider zu spät gekommen.");
    const critical = await listReviewsAdmin(admin, { rating: "critical", providerId: pro.providerId });
    expect(critical.items.map((r) => r.id)).toEqual([reviewId]);
    expect(critical.items[0]).toMatchObject({ customerName: "Rosa T.", isPublished: true, bookingReference: expect.stringMatching(/^SM-/) });

    await moderateReview(admin, reviewId, false, "Beleidigend");
    expect((await listReviewsAdmin(admin, { visibility: "hidden", providerId: pro.providerId })).total).toBe(1);
    expect((await listReviewsAdmin(admin, { visibility: "published", providerId: pro.providerId })).total).toBe(0);
    const [agg] = await sql()<{ ratingCount: number }[]>`select rating_count from public.providers where id = ${pro.providerId}`;
    expect(agg.ratingCount).toBe(0);
    await moderateReview(admin, reviewId, true);
    const actions = await sql()<{ action: string }[]>`select action from public.audit_log where entity = 'review' and entity_id = ${reviewId} order by created_at`;
    expect(actions.map((a) => a.action)).toEqual(["review.unpublish", "review.publish"]);
    await expect(listReviewsAdmin(c, {})).rejects.toMatchObject({ code: "forbidden" });
  });

  it("shows a user's credits and bookings; credit adjustments are audited", async () => {
    const admin = await createAdmin();
    const { c } = await completedBooking();
    await adjustCredits(admin, c.userId, 2500, "Kulanz nach Verspätung", "goodwill");
    await adjustCredits(admin, c.userId, -500, "Korrektur");
    const detail = await getUserForAdmin(admin, c.userId);
    expect(detail?.credits.balanceCents).toBe(2000);
    expect(detail?.credits.entries[0]).toMatchObject({ amountCents: -500, reason: "admin_adjustment", createdByName: "Ada Admin" });
    expect(detail?.bookings).toHaveLength(1);
    expect(detail?.bookings[0]).toMatchObject({ asRole: "customer", status: "completed" });
    expect(detail?.anonymizeBlockers).toEqual([]);
    const [{ n }] = await sql()<{ n: number }[]>`select count(*)::int as n from public.audit_log where action = 'credits.adjust' and entity_id = ${c.userId}`;
    expect(n).toBe(2);
  });

  it("exports all data of an account as JSON (self and admin, audited)", async () => {
    const admin = await createAdmin();
    const { c, b } = await completedBooking();
    await createReview(c, b.bookingId, 5, "Wunderbar.");
    const mine = await exportMyData(c);
    expect(mine.format).toBe("soma-user-export/v1");
    expect(mine.profile).toMatchObject({ userId: c.userId, firstName: "Clara", lastName: "Test" });
    expect(mine.bookings).toHaveLength(1);
    expect(mine.bookings[0]).toMatchObject({ notes: "Bitte zweimal klingeln.", address: { line: "Torstraße 12", postalCode: "10119" }, payment: { status: "captured" } });
    expect(mine.reviews[0]).toMatchObject({ rating: 5, comment: "Wunderbar." });
    expect(mine.notifications.length).toBeGreaterThan(0);
    expect(JSON.stringify(mine)).not.toMatch(/encrypted_password|scrypt\$/);
    const byAdmin = await exportUserData(admin, c.userId);
    expect(byAdmin.profile.email).toBe(mine.profile.email);
    const audits = await sql()<{ action: string; actorId: string }[]>`select action, actor_id from public.audit_log where action = 'user.export' and entity_id = ${c.userId} order by created_at`;
    expect(audits.map((a) => a.actorId)).toEqual([c.userId, admin.userId]);
  });

  it("anonymises an account: PII, login, sessions and addresses go, bookings stay scrubbed", async () => {
    const admin = await createAdmin();
    const { pro, c, b } = await completedBooking();
    const [{ email }] = await sql()<{ email: string }[]>`select email from auth.users where id = ${c.userId}`;
    await sql()`insert into public.addresses (user_id, street, house_number, postal_code, city) values (${c.userId}, 'Torstraße', '12', '10119', 'Berlin')`;
    const token = await createLocalSession(c.userId, { ip: null, userAgent: null });
    expect(await verifyLocalPassword(c.userId, "falsch-falsch-falsch")).toBe(false);
    expect(await verifyLocalPassword(c.userId, PASSWORD)).toBe(true);

    // Blockers: providers, self, open bookings
    expect((await getUserForAdmin(admin, pro.providerId))?.anonymizeBlockers.join(" ")).toMatch(/Profi-Konten/);
    await expect(anonymizeUser(admin, admin.userId, "Test der Sperre")).rejects.toMatchObject({ code: "invalid_state" });
    const busy = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 30);
    const open = await createBooking(busy, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await confirmDevPayment(busy, open.bookingId);
    await expect(anonymizeOwnAccount(busy)).rejects.toThrow(/offene Termine/);

    const r = await anonymizeUser(admin, c.userId, "Löschantrag per E-Mail vom 30.10.");
    expect(r).toMatchObject({ userId: c.userId, bookingsScrubbed: 1, addressesDeleted: 1 });

    const [p] = await sql()<{ firstName: string | null; lastName: string | null; phone: string | null; anonymizedAt: Date | null; blockedAt: Date | null }[]>`
      select first_name, last_name, phone, anonymized_at, blocked_at from public.profiles where id = ${c.userId}`;
    expect(p).toMatchObject({ firstName: null, lastName: null, phone: null });
    expect(p.anonymizedAt).not.toBeNull();
    const [u] = await sql()<{ email: string; encryptedPassword: string | null }[]>`select email, encrypted_password from auth.users where id = ${c.userId}`;
    expect(u).toEqual({ email: `deleted+${c.userId}@anonymized.soma.invalid`, encryptedPassword: null });
    expect(await resolveLocalSession(token)).toBeNull();
    await expect(verifyLocalCredentials(email, PASSWORD, { ip: null, userAgent: null })).rejects.toThrow();
    const [bk] = await sql()<{ addressLine: string; customerNotes: string | null; lat: number | null; totalCents: number; status: string }[]>`
      select address_line, customer_notes, lat, total_cents, status from public.bookings where id = ${b.bookingId}`;
    expect(bk).toMatchObject({ addressLine: "Anonymisiert", customerNotes: null, lat: null, status: "completed", totalCents: b.totalCents });
    const [{ n }] = await sql()<{ n: number }[]>`select count(*)::int as n from public.payments where booking_id = ${b.bookingId}`;
    expect(n).toBe(1);
    const [audit] = await sql()<{ data: Record<string, unknown> }[]>`select data from public.audit_log where action = 'user.anonymize' and entity_id = ${c.userId}`;
    expect(audit.data).toMatchObject({ by: "admin", bookingsScrubbed: 1 });
    expect(JSON.stringify(audit.data)).not.toContain(email);
    await expect(anonymizeUser(admin, c.userId, "Nochmal bitte")).rejects.toThrow(/bereits anonymisiert/);
  });
});
