import { describe, expect, it } from "vitest";
import { withUser } from "@/server/db/client";
import { ServiceError } from "@/server/errors";
import { getReferralInfo, getCreditSummary } from "@/server/services/account";
import {
  completeBooking,
  confirmDevPayment,
  createBooking,
  getBookingForCustomer,
  getBookingForProvider,
  providerRespond,
  quoteBooking,
  startBooking,
} from "@/server/services/bookings";
import { getProviderProfile } from "@/server/services/providers";
import { createReview, replyToReview } from "@/server/services/reviews";
import { searchProviders } from "@/server/services/search";
import { createCustomer, createProvider, NEW_ADDRESS, slotAtLeast, sql, timeTravel } from "./support/fixtures";

// The lifecycle test works in its own area (Leipzig) so other test files' providers don't crowd the search.
const LEIPZIG = { kind: "home" as const, street: "Grimmaische Straße", houseNumber: "2", postalCode: "04109", city: "Leipzig", details: "3. OG" };

describe("full booking lifecycle", () => {
  it("search → quote → create → dev pay → accept → start → complete → review → rating → referral reward", async () => {
    const referrer = await createCustomer({ firstName: "Rita" });
    const [refProfile] = await sql()<{ referralCode: string }[]>`select referral_code from public.profiles where id = ${referrer.userId}`;
    const customer = await createCustomer({ firstName: "Carla", referralCode: refProfile.referralCode });
    const pro = await createProvider({ bookingMode: "request", basePostalCode: "04109", services: [{ slug: "entspannungsmassage", priceCents: 8900 }] });
    const psId = pro.offerings.entspannungsmassage;
    const [svc] = await sql()<{ id: string }[]>`select id from public.services where slug = 'entspannungsmassage'`;

    // Welcome credit from the referral
    expect((await getCreditSummary(customer)).balanceCents).toBe(1500);

    // Search (customer PLZ 04109 Leipzig-Zentrum)
    const search = await searchProviders({ postalCode: "04109", serviceId: svc.id }, customer);
    const hit = search.results.find((r) => r.providerId === pro.providerId);
    expect(hit).toBeDefined();
    expect(hit?.nextSlots.length).toBeGreaterThan(0);
    expect(search.demandLogged).toBe(true);
    expect(hit?.totalPriceCents).toBe(8900 + (hit?.travelFeeCents ?? 0));

    // Quote
    const slot = await slotAtLeast(pro.providerId, psId, 4);
    const quote = await quoteBooking({ providerServiceId: psId, startsAt: slot, postalCode: "04109", useCredits: true }, customer);
    expect(quote.slotAvailable).toBe(true);
    expect(quote.withinServiceArea).toBe(true);
    expect(quote.price.discountCents).toBe(1500);
    expect(quote.price.totalCents).toBe(8900 + quote.price.travelFeeCents - 1500);
    expect(quote.cancellation.schedule).toHaveLength(3);

    // Create (hold) with credits
    const created = await createBooking(customer, { providerServiceId: psId, startsAt: slot, address: LEIPZIG, useCredits: true, notes: "Bitte zweimal klingeln" });
    expect(created.status).toBe("pending_payment");
    expect(created.totalCents).toBe(quote.price.totalCents);
    expect((await getCreditSummary(customer)).balanceCents).toBe(0);
    const [b0] = await sql()<{ commissionTier: string; commissionRate: string; startCode: string }[]>`
      select commission_tier, commission_rate::text as commission_rate, start_code from public.bookings where id = ${created.bookingId}`;
    expect(b0.commissionTier).toBe("base");
    expect(Number(b0.commissionRate)).toBeCloseTo(0.2);

    // Dev payment → requested (request mode)
    expect((await confirmDevPayment(customer, created.bookingId)).status).toBe("requested");
    const asProviderBefore = await getBookingForProvider(pro.session, created.bookingId);
    expect(asProviderBefore?.status).toBe("requested");
    expect(asProviderBefore?.location.addressLine).toBeNull();
    expect(asProviderBefore?.customer.phone).toBeNull();
    expect(asProviderBefore?.customer.firstName).toBe("Carla");
    expect(asProviderBefore?.respondBy).not.toBeNull();
    expect(JSON.stringify(asProviderBefore)).not.toContain(b0.startCode);

    // Provider accepts → confirmed
    expect((await providerRespond(pro.session, created.bookingId, "accept")).status).toBe("confirmed");
    const asProvider = await getBookingForProvider(pro.session, created.bookingId);
    expect(asProvider?.location.addressLine).toBe("Grimmaische Straße 2");
    expect(asProvider?.customer.phone).toBe("+49 170 1234567");
    expect(JSON.stringify(asProvider)).not.toMatch(/@test\.soma/);

    const asCustomer = await getBookingForCustomer(customer, created.bookingId);
    expect(asCustomer?.startCode).toBe(b0.startCode);
    expect(asCustomer?.payment?.status).toBe("authorized");

    // Appointment begins (simulated by moving it into the past)
    await timeTravel(created.bookingId, new Date(Date.now() - 20 * 60_000));
    const wrong = b0.startCode === "0000" ? "1111" : "0000";
    await expect(startBooking(pro.session, created.bookingId, wrong)).rejects.toThrow(/Start-Code ist falsch/);
    expect((await startBooking(pro.session, created.bookingId, b0.startCode)).status).toBe("in_progress");

    // Complete → capture + referral reward
    expect((await completeBooking(pro.session, created.bookingId)).status).toBe("completed");
    const [pay] = await sql()<{ status: string; capturedCents: number }[]>`select status, captured_cents from public.payments where booking_id = ${created.bookingId}`;
    expect(pay).toEqual({ status: "captured", capturedCents: created.totalCents });
    const refInfo = await getReferralInfo(referrer);
    expect(refInfo.rewardedCount).toBe(1);
    expect(refInfo.earnedCents).toBe(1500);
    expect((await getCreditSummary(referrer)).balanceCents).toBe(1500);

    // Review → aggregate
    await createReview(customer, created.bookingId, 4, "Sehr entspannend, gerne wieder.", ["Pünktlich"]);
    await expect(createReview(customer, created.bookingId, 5, "Nochmal")).rejects.toThrow(/bereits bewertet/);
    const [agg] = await sql()<{ ratingAvg: string; ratingCount: number; completedCount: number }[]>`
      select rating_avg::text as rating_avg, rating_count, completed_count from public.providers where id = ${pro.providerId}`;
    expect(Number(agg.ratingAvg)).toBe(4);
    expect(agg.ratingCount).toBe(1);
    expect(agg.completedCount).toBe(1);

    const [rev] = await sql()<{ id: string }[]>`select id from public.reviews where booking_id = ${created.bookingId}`;
    await replyToReview(pro.session, rev.id, "Danke dir, bis bald!");
    await expect(replyToReview(pro.session, rev.id, "Zweite Antwort")).rejects.toBeInstanceOf(ServiceError);
    const profile = await getProviderProfile((await sql()<{ slug: string }[]>`select slug from public.providers where id = ${pro.providerId}`)[0].slug);
    expect(profile?.reviews.items[0]).toMatchObject({ rating: 4, authorName: "Carla T.", providerReply: "Danke dir, bis bald!" });

    // Booking events trail
    const events = await sql()<{ toStatus: string }[]>`select to_status from public.booking_events where booking_id = ${created.bookingId} order by created_at`;
    expect(events.map((e) => e.toStatus)).toEqual(["pending_payment", "requested", "confirmed", "in_progress", "completed"]);

    // Second booking with the same provider → repeat tier (12 %)
    const slot2 = await slotAtLeast(pro.providerId, psId, 30);
    const second = await createBooking(customer, { providerServiceId: psId, startsAt: slot2, address: LEIPZIG });
    const [b2] = await sql()<{ commissionTier: string; commissionRate: string }[]>`select commission_tier, commission_rate::text as commission_rate from public.bookings where id = ${second.bookingId}`;
    expect(b2.commissionTier).toBe("repeat");
    expect(Number(b2.commissionRate)).toBeCloseTo(0.12);
  });

  it("instant booking: dev pay confirms immediately", async () => {
    const pro = await createProvider({ bookingMode: "instant" });
    const c = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    expect((await confirmDevPayment(c, b.bookingId)).status).toBe("confirmed");
  });

  it("own-client tier (5 %) for customers who registered via the provider's invite link", async () => {
    const pro = await createProvider();
    const c = await createCustomer({ providerInviteCode: pro.inviteCode });
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    const [row] = await sql()<{ commissionTier: string; commissionRate: string; commissionCents: number; providerPayoutCents: number; travelFeeCents: number }[]>`
      select commission_tier, commission_rate::text as commission_rate, commission_cents, provider_payout_cents, travel_fee_cents from public.bookings where id = ${b.bookingId}`;
    expect(row.commissionTier).toBe("own_client");
    expect(Number(row.commissionRate)).toBeCloseTo(0.05);
    expect(row.commissionCents).toBe(400); // 5 % of 80 €, travel fee commission-free
    expect(row.providerPayoutCents).toBe(8000 - 400 + row.travelFeeCents);
  });

  it("own-client tier also via an invite code passed at booking time", async () => {
    const pro = await createProvider();
    const c = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS, inviteCode: pro.inviteCode.toLowerCase() });
    const [row] = await sql()<{ commissionTier: string }[]>`select commission_tier from public.bookings where id = ${b.bookingId}`;
    expect(row.commissionTier).toBe("own_client");
  });

  it("rejects addresses outside the service area and slots that do not exist", async () => {
    const pro = await createProvider({ radiusKm: 5 });
    const c = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
    await expect(createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: { ...NEW_ADDRESS, postalCode: "80331", city: "München" } }))
      .rejects.toThrow(/außerhalb des Einsatzgebiets/);
    const odd = new Date(Date.parse(slot) + 7 * 60_000).toISOString();
    await expect(createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: odd, address: NEW_ADDRESS })).rejects.toThrow(/nicht mehr verfügbar/);
  });

  it("start code: at most 5 wrong attempts", async () => {
    const pro = await createProvider();
    const c = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await confirmDevPayment(c, b.bookingId);
    await timeTravel(b.bookingId, new Date(Date.now() - 5 * 60_000));
    const [{ startCode }] = await sql()<{ startCode: string }[]>`select start_code from public.bookings where id = ${b.bookingId}`;
    const wrong = startCode === "9999" ? "8888" : "9999";
    for (let i = 0; i < 5; i += 1) await expect(startBooking(pro.session, b.bookingId, wrong)).rejects.toThrow(/Start-Code ist falsch/);
    await expect(startBooking(pro.session, b.bookingId, startCode)).rejects.toThrow(/zu oft falsch/);
  });

  it("a provider cannot act on another provider's booking; customers cannot use provider actions", async () => {
    const pro = await createProvider({ bookingMode: "request" });
    const other = await createProvider();
    const c = await createCustomer();
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await confirmDevPayment(c, b.bookingId);
    await expect(providerRespond(other.session, b.bookingId, "accept")).rejects.toThrow(/nicht gefunden/);
    await expect(providerRespond(c, b.bookingId, "accept")).rejects.toMatchObject({ code: "forbidden" });
    expect(await withUser(other.providerId, (tx) => tx`select id from public.provider_bookings where id = ${b.bookingId}`)).toHaveLength(0);
  });
});
