import { describe, expect, it } from "vitest";
import {
  createAddress,
  deleteAddress,
  getProfile,
  listAddresses,
  listFavorites,
  toggleFavorite,
  updateNotificationPreferences,
  updateProfile,
} from "@/server/services/account";
import { confirmDevPayment, createBooking, getBookingForProvider, listCustomerBookings } from "@/server/services/bookings";
import { getCityCategoryCoverage, listCatalog, lookupPostalCode } from "@/server/services/catalog";
import { readMedia } from "@/server/services/media";
import { listNotifications, markNotificationsRead } from "@/server/services/notifications";
import { uploadDocument, uploadPortfolioImage } from "@/server/services/pro";
import { createAdmin, createCustomer, createProvider, NEW_ADDRESS, slotAtLeast } from "./support/fixtures";

describe("account services", () => {
  it("manages profile, addresses (one default), favourites and preferences", async () => {
    const c = await createCustomer();
    const pro = await createProvider();
    expect((await getProfile(c)).email).toBe(c.email);
    await expect(updateProfile(c, { firstName: "", lastName: "X" })).rejects.toMatchObject({ code: "validation", fieldErrors: { firstName: expect.any(String) } });
    expect((await updateProfile(c, { firstName: "Clara", lastName: "Neu", phone: "+49 30 1234567" })).lastName).toBe("Neu");

    const a1 = await createAddress(c, { street: "Torstraße", houseNumber: "1", postalCode: "10119", city: "Berlin" });
    const a2 = await createAddress(c, { label: "Büro", kind: "office", street: "Friedrichstraße", houseNumber: "100", postalCode: "10117", city: "Berlin", isDefault: true });
    expect(a1.isDefault).toBe(true);
    const list = await listAddresses(c);
    expect(list.filter((a) => a.isDefault).map((a) => a.id)).toEqual([a2.id]);
    await expect(createAddress(c, { street: "X", houseNumber: "1", postalCode: "99999", city: "Nirgendwo" })).rejects.toBeTruthy();
    await deleteAddress(c, a2.id);
    expect((await listAddresses(c)).find((a) => a.id === a1.id)?.isDefault).toBe(true);

    expect(await toggleFavorite(c, pro.providerId)).toEqual({ favorite: true });
    expect((await listFavorites(c)).map((f) => f.providerId)).toEqual([pro.providerId]);
    expect(await toggleFavorite(c, pro.providerId)).toEqual({ favorite: false });

    const prefs = { emailBookings: true, emailReminders: false, emailMarketing: false, smsReminders: true, pushBookings: true };
    expect(await updateNotificationPreferences(c, prefs)).toEqual(prefs);
  });

  it("customer and provider inboxes, booking lists and role separation", async () => {
    const pro = await createProvider({ bookingMode: "request" });
    const c = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 4);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await confirmDevPayment(c, b.bookingId);
    const proInbox = await listNotifications(pro.session);
    expect(proInbox[0]).toMatchObject({ type: "booking.requested", href: `/pro/termine/${b.bookingId}` });
    expect(proInbox[0].title).toMatch(/Neue Anfrage/);
    expect(proInbox[0].body).toMatch(/Du hast Zeit bis/);
    const custInbox = await listNotifications(c);
    expect(custInbox[0].title).toMatch(/Deine Anfrage ist bei/);
    expect(await markNotificationsRead(c, "all")).toBeGreaterThanOrEqual(1);
    expect(await listNotifications(c, { unreadOnly: true })).toHaveLength(0);
    expect((await listCustomerBookings(c, "upcoming")).items.map((x) => x.id)).toContain(b.bookingId);
    await expect(getBookingForProvider(c, b.bookingId)).rejects.toMatchObject({ code: "forbidden" });
    await expect(listCustomerBookings(pro.session, "upcoming")).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("catalogue", () => {
  it("serves the data-driven taxonomy and PLZ lookup", async () => {
    const cat = await listCatalog();
    expect(cat.map((c) => c.slug)).toEqual(["massage", "manikuere", "pedikuere", "kosmetik", "make-up", "haare-styling", "brows-lashes"]);
    expect(cat.every((c) => c.services.length >= 4 && c.services.length <= 6)).toBe(true);
    expect(cat.find((c) => c.slug === "haare-styling")?.requiredDocuments[0].label).toBe("Meisterbrief oder Eintragung in die Handwerksrolle");
    expect(await lookupPostalCode("80331")).toMatchObject({ citySlug: "muenchen", cityName: "München", isLaunchCity: true });
    expect(await lookupPostalCode("01067")).toMatchObject({ citySlug: null, isLaunchCity: false });
    expect(await lookupPostalCode("00000")).toBeNull();
    expect((await getCityCategoryCoverage("duesseldorf", "pedikuere")).indexable).toBe(false);
  });
});

describe("media access", () => {
  const PDF = new TextEncoder().encode("%PDF-1.4\n%test\n");
  const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70]);

  it("documents are private to the provider and admins; portfolio images are public", async () => {
    const pro = await createProvider();
    const other = await createProvider();
    const customer = await createCustomer();
    const admin = await createAdmin();
    const doc = await uploadDocument(pro.session, "insurance", { fileName: "police.pdf", contentType: "application/pdf", bytes: PDF });
    const key = doc.url.replace("/api/media/", "");
    expect((await readMedia(pro.session, key)).contentType).toBe("application/pdf");
    expect((await readMedia(admin, key)).isPublic).toBe(false);
    await expect(readMedia(other.session, key)).rejects.toMatchObject({ code: "forbidden" });
    await expect(readMedia(customer, key)).rejects.toMatchObject({ code: "forbidden" });
    await expect(readMedia(null, key)).rejects.toMatchObject({ code: "unauthenticated" });
    await expect(readMedia(admin, "documents/../../etc/passwd")).rejects.toMatchObject({ code: "not_found" });

    const img = await uploadPortfolioImage(pro.session, { fileName: "nails.jpg", contentType: "image/jpeg", bytes: JPG }, { caption: "Frühlingslook" });
    const pub = await readMedia(null, img.url.replace("/api/media/", ""));
    expect(pub).toMatchObject({ isPublic: true, contentType: "image/jpeg" });
  });
});
