import { describe, expect, it } from "vitest";
import { computeRespondBy } from "@/server/domain/booking-state";
import { CONTACT_LINT_MESSAGES } from "@/server/domain/content-lint";
import { createAddress, openDispute } from "@/server/services/account";
import { decideProvider, getProviderForAdmin, reviewDocument } from "@/server/services/admin";
import { getOpsQueues } from "@/server/services/admin-ext";
import { runBookingMaintenance } from "@/server/services/booking-maintenance";
import { cancelBooking, completeBooking, confirmDevPayment, createBooking, providerRespond, quoteBooking } from "@/server/services/bookings";
import { getProviderProfile } from "@/server/services/providers";
import { createReview } from "@/server/services/reviews";
import { createAdmin, createCustomer, createProvider, NEW_ADDRESS, slotAtLeast, sql, timeTravel } from "./support/fixtures";

const HOUR = 3_600_000;
const PHONE_TEXT = "Ruf mich direkt an: 0170 1234567, dann machen wir das ohne SOMA";

async function requestBooking() {
  const pro = await createProvider({ bookingMode: "request" });
  const c = await createCustomer();
  const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 30);
  const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
  await confirmDevPayment(c, b.bookingId);
  return { pro, c, b, slot };
}

/** Approved provider whose base documents are all approved (insurance with an expiry). */
async function verifiedProvider(admin: Awaited<ReturnType<typeof createAdmin>>) {
  const pro = await createProvider();
  const docs: Record<string, string> = {};
  for (const kind of ["id_document", "business_registration", "insurance"] as const) {
    const [row] = await sql()<{ id: string }[]>`
      insert into public.provider_documents (provider_id, kind, storage_path, file_name, mime_type, size_bytes, status, reviewed_at)
      values (${pro.providerId}, ${kind}, ${`documents/${pro.providerId}/${crypto.randomUUID()}.pdf`}, ${`${kind}.pdf`}, 'application/pdf', 100, 'approved', now())
      returning id`;
    docs[kind] = row.id;
  }
  const [massage] = await sql()<{ id: string }[]>`select id from public.categories where slug = 'massage'`;
  await sql()`
    insert into public.provider_documents (provider_id, kind, category_id, storage_path, file_name, mime_type, size_bytes, status, reviewed_at)
    values (${pro.providerId}, 'qualification', ${massage.id}, ${`documents/${pro.providerId}/${crypto.randomUUID()}.pdf`}, 'zert.pdf', 'application/pdf', 100, 'approved', now())`;
  expect((await getProviderForAdmin(admin, pro.providerId))?.missingDocuments).toEqual([]);
  return { pro, docs };
}

const providerStatus = async (id: string) => (await sql()<{ status: string }[]>`select status from public.providers where id = ${id}`)[0].status;
const slugOf = async (id: string) => (await sql()<{ slug: string }[]>`select slug from public.providers where id = ${id}`)[0].slug;

describe("contact lint on notes, reasons and disputes (audit-2 N3)", () => {
  it("refuses contact details in the decline and acceptance notes (du)", async () => {
    const { pro, b } = await requestBooking();
    await expect(providerRespond(pro.session, b.bookingId, "decline", PHONE_TEXT)).rejects.toMatchObject({
      code: "validation",
      message: CONTACT_LINT_MESSAGES.providerMessage,
      fieldErrors: { note: CONTACT_LINT_MESSAGES.providerMessage },
    });
    await expect(providerRespond(pro.session, b.bookingId, "accept", "Gern, schreib mir auf Insta")).rejects.toMatchObject({ fieldErrors: { note: CONTACT_LINT_MESSAGES.providerMessage } });
    expect((await providerRespond(pro.session, b.bookingId, "accept", "Gern, bis Donnerstag um 18:00.")).status).toBe("confirmed");
  });

  it("refuses contact details in cancellation reasons (customer and provider messages, both du)", async () => {
    const one = await requestBooking();
    await providerRespond(one.pro.session, one.b.bookingId, "accept");
    await expect(cancelBooking(one.c, one.b.bookingId, "Bitte melden unter linh (at) gmail (punkt) com")).rejects.toMatchObject({
      message: CONTACT_LINT_MESSAGES.customerMessage,
      fieldErrors: { reason: CONTACT_LINT_MESSAGES.customerMessage },
    });
    await expect(cancelBooking(one.pro.session, one.b.bookingId, `Krank. ${PHONE_TEXT}`)).rejects.toMatchObject({ fieldErrors: { reason: CONTACT_LINT_MESSAGES.providerMessage } });
    expect((await cancelBooking(one.pro.session, one.b.bookingId, "Leider krank, seit 01.03.2019 das erste Mal.")).status).toBe("cancelled");
  });

  it("refuses contact details in dispute descriptions", async () => {
    const pro = await createProvider();
    const c = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await confirmDevPayment(c, b.bookingId);
    await timeTravel(b.bookingId, new Date(Date.now() - 2 * HOUR));
    await completeBooking(pro.session, b.bookingId);
    await expect(openDispute(c, b.bookingId, "quality", "Sie war unfreundlich, ruft mich unter O17O 1234567 zurück")).rejects.toMatchObject({
      fieldErrors: { description: CONTACT_LINT_MESSAGES.customerDispute },
    });
    await expect(openDispute(pro.session, b.bookingId, "customer_no_show", "Kundin hat auf WhatsApp abgesagt, bitte prüfen")).rejects.toMatchObject({
      fieldErrors: { description: CONTACT_LINT_MESSAGES.providerDispute },
    });
    expect((await openDispute(c, b.bookingId, "quality", "Die Massage war deutlich kürzer als die gebuchten 60 Minuten.")).disputeId).toBeTruthy();
  });
});

describe("verification follows the documents (audit-2 N4)", () => {
  it("rejecting a required document of an approved provider suspends them; reinstating needs all documents again", async () => {
    const admin = await createAdmin();
    const { pro, docs } = await verifiedProvider(admin);
    const slug = await slugOf(pro.providerId);
    expect(await getProviderProfile(slug)).not.toBeNull();

    const r = await reviewDocument(admin, docs.insurance, "rejected", "Police abgelaufen");
    expect(r.providerSuspended).toBe(true);
    expect(await providerStatus(pro.providerId)).toBe("suspended");
    expect(await getProviderProfile(slug)).toBeNull();
    const [evt] = await sql()<{ toStatus: string; note: string; actorId: string | null }[]>`
      select to_status, note, actor_id from public.provider_status_events where provider_id = ${pro.providerId} order by created_at desc limit 1`;
    expect(evt).toMatchObject({ toStatus: "suspended", actorId: null });
    expect(evt.note).toMatch(/^Automatisch pausiert: Berufshaftpflicht abgelehnt/);
    const [note] = await sql()<{ title: string; body: string }[]>`
      select title, body from public.notifications where user_id = ${pro.providerId} and type = 'provider.suspended_documents'`;
    expect(note.title).toBe("Dein Profil ist pausiert");
    expect(note.body).toContain("Bitte lade das fehlende Dokument hoch");
    const ops = await getOpsQueues(admin, { limit: 50 });
    expect(ops.documentAlerts.find((a) => a.providerId === pro.providerId)).toMatchObject({ status: "suspended" });

    await expect(decideProvider(admin, pro.providerId, "reinstate")).rejects.toMatchObject({ code: "invalid_state" });
    const [fresh] = await sql()<{ id: string }[]>`
      insert into public.provider_documents (provider_id, kind, storage_path, file_name, mime_type, size_bytes)
      values (${pro.providerId}, 'insurance', ${`documents/${pro.providerId}/${crypto.randomUUID()}.pdf`}, 'neu.pdf', 'application/pdf', 100) returning id`;
    const nextYear = `${new Date().getFullYear() + 1}-12-31`;
    expect(await reviewDocument(admin, fresh.id, "approved", undefined, nextYear)).toEqual({ providerSuspended: false, offeringsActivated: 0 });
    expect((await decideProvider(admin, pro.providerId, "reinstate")).status).toBe("approved");
    const [exp] = await sql()<{ expiresAt: Date }[]>`select expires_at from public.provider_documents where id = ${fresh.id}`;
    expect(exp.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("rejecting a non-required document does not suspend", async () => {
    const admin = await createAdmin();
    const { pro } = await verifiedProvider(admin);
    const [other] = await sql()<{ id: string }[]>`
      insert into public.provider_documents (provider_id, kind, storage_path, file_name, mime_type, size_bytes)
      values (${pro.providerId}, 'other', ${`documents/${pro.providerId}/${crypto.randomUUID()}.pdf`}, 'x.pdf', 'application/pdf', 100) returning id`;
    expect(await reviewDocument(admin, other.id, "rejected", "Nicht lesbar")).toEqual({ providerSuspended: false, offeringsActivated: 0 });
    expect(await providerStatus(pro.providerId)).toBe("approved");
  });

  it("booking maintenance expires documents past expires_at and suspends the provider", async () => {
    const admin = await createAdmin();
    const { pro, docs } = await verifiedProvider(admin);
    await sql()`update public.provider_documents set expires_at = now() + interval '1 hour' where id = ${docs.insurance}`;
    expect((await getOpsQueues(admin, { limit: 50 })).documentAlerts.find((a) => a.providerId === pro.providerId)).toMatchObject({ status: "approved", note: "Berufshaftpflicht läuft ab" });
    const r = await runBookingMaintenance(new Date(Date.now() + 2 * HOUR));
    expect(r.expiredDocuments).toBeGreaterThanOrEqual(1);
    expect(r.suspendedProviders).toBeGreaterThanOrEqual(1);
    expect(await providerStatus(pro.providerId)).toBe("suspended");
    const [doc] = await sql()<{ status: string; reviewNote: string }[]>`select status, review_note from public.provider_documents where id = ${docs.insurance}`;
    expect(doc.status).toBe("rejected");
    expect(doc.reviewNote).toMatch(/^Abgelaufen am \d{2}\.\d{2}\.\d{4} – bitte lade ein aktuelles Dokument hoch\.$/);
    const [evt] = await sql()<{ note: string }[]>`select note from public.provider_status_events where provider_id = ${pro.providerId} order by created_at desc limit 1`;
    expect(evt.note).toMatch(/Berufshaftpflicht abgelaufen/);
  });
});

describe("form validation details (audit-2 N5)", () => {
  it("validates the PLZ of saved addresses with a field error", async () => {
    const c = await createCustomer();
    await expect(createAddress(c, { street: "Torstraße", houseNumber: "12", postalCode: "00000", city: "Berlin" })).rejects.toMatchObject({
      code: "validation",
      fieldErrors: { postalCode: "Diese Postleitzahl kennen wir nicht." },
    });
    expect((await createAddress(c, { street: "Torstraße", houseNumber: "12", postalCode: "10119", city: "Berlin" })).postalCode).toBe("10119");
  });

  it("maps foreign-key violations to friendly German messages", async () => {
    const { foreignKeyError } = await import("@/server/db/errors");
    const err = await sql()`insert into public.addresses (user_id, street, house_number, postal_code, city) values (${crypto.randomUUID()}, 'Torstraße', '1', '10119', 'Berlin')`.catch((e: unknown) => e);
    expect(foreignKeyError(err as never)).toMatchObject({ code: "validation", message: "Dieses Konto wurde nicht gefunden." });
    const c = await createCustomer();
    const plz = await sql()`insert into public.addresses (user_id, street, house_number, postal_code, city) values (${c.userId}, 'Torstraße', '1', '00000', 'Berlin')`.catch((e: unknown) => e);
    expect(foreignKeyError(plz as never)).toMatchObject({ fieldErrors: { postalCode: "Diese Postleitzahl kennen wir nicht." } });
  });

  it("returns a clear rating field error", async () => {
    const c = await createCustomer();
    for (const rating of [Number.NaN, 0, 6, 2.5]) {
      await expect(createReview(c, crypto.randomUUID(), rating, "Schön")).rejects.toMatchObject({ fieldErrors: { rating: "Bitte vergib 1 bis 5 Sterne." } });
    }
  });
});

describe("response window default and preview (audit-2 N6)", () => {
  it("defaults to 4 business hours and previews the deadline in the quote", async () => {
    const [setting] = await sql()<{ value: number }[]>`select value from public.platform_settings where key = 'request_response_hours'`;
    expect(Number(setting.value)).toBe(4);
    const pro = await createProvider({ bookingMode: "request" });
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 30);
    const before = Date.now();
    const q = await quoteBooking({ providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, postalCode: "10119" });
    expect(q.requestResponseHours).toBe(4);
    expect(q.respondByPreview).not.toBeNull();
    const expected = computeRespondBy(new Date(before), new Date(slot), 4).getTime();
    expect(Math.abs(Date.parse(q.respondByPreview!) - expected)).toBeLessThan(60_000);

    const instant = await createProvider();
    const slot2 = await slotAtLeast(instant.providerId, instant.offerings.entspannungsmassage, 3);
    expect((await quoteBooking({ providerServiceId: instant.offerings.entspannungsmassage, startsAt: slot2, postalCode: "10119" })).respondByPreview).toBeNull();
  });
});
