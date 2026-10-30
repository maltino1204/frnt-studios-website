import { describe, expect, it } from "vitest";
import { withAnon, withUser } from "@/server/db/client";
import { createAddress } from "@/server/services/account";
import { confirmDevPayment, createBooking, providerRespond } from "@/server/services/bookings";
import { createCustomer, createProvider, NEW_ADDRESS, slotAtLeast, sql } from "./support/fixtures";

const PERMISSION_DENIED = { code: "42501" };

describe("row-level security & column grants", () => {
  it("a customer cannot read another customer's bookings or addresses", async () => {
    const pro = await createProvider();
    const [alice, bob] = [await createCustomer({ firstName: "Alice" }), await createCustomer({ firstName: "Bob" })];
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
    const booking = await createBooking(alice, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    const addr = await createAddress(alice, { street: "Kastanienallee", houseNumber: "3", postalCode: "10435", city: "Berlin" });

    expect(await withUser(alice.userId, (tx) => tx`select id from public.bookings where id = ${booking.bookingId}`)).toHaveLength(1);
    expect(await withUser(bob.userId, (tx) => tx`select id from public.bookings where id = ${booking.bookingId}`)).toHaveLength(0);
    expect(await withUser(bob.userId, (tx) => tx`select id from public.addresses where id = ${addr.id}`)).toHaveLength(0);
    expect(await withUser(bob.userId, (tx) => tx`select id from public.payments where booking_id = ${booking.bookingId}`)).toHaveLength(0);
    expect(await withUser(bob.userId, (tx) => tx`select id from public.profiles where id = ${alice.userId}`)).toHaveLength(0);
    // writing into someone else's address book is rejected by the policy
    await expect(withUser(bob.userId, (tx) => tx`
      insert into public.addresses (user_id, street, house_number, postal_code, city) values (${alice.userId}, 'X', '1', '10115', 'Berlin')`)).rejects.toMatchObject(PERMISSION_DENIED);
    const updated = await withUser(bob.userId, (tx) => tx`update public.addresses set street = 'Hack' where id = ${addr.id} returning id`);
    expect(updated).toHaveLength(0);
  });

  it("customers cannot write bookings, payments or credits directly, nor read commission internals", async () => {
    const c = await createCustomer();
    await expect(withUser(c.userId, (tx) => tx`update public.bookings set total_cents = 1`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(withUser(c.userId, (tx) => tx`insert into public.credit_ledger (user_id, amount_cents, reason) values (${c.userId}, 100000, 'goodwill')`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(withUser(c.userId, (tx) => tx`update public.payments set status = 'captured'`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(withUser(c.userId, (tx) => tx`select commission_cents from public.bookings`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(withUser(c.userId, (tx) => tx`update public.profiles set role = 'admin' where id = ${c.userId}`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(withUser(c.userId, (tx) => tx`select * from public.waitlist_signups`)).resolves.toHaveLength(0);
  });

  it("a provider cannot update their own status, rating aggregates or commission override", async () => {
    const pro = await createProvider();
    const as = <T>(q: (tx: Parameters<Parameters<typeof withUser>[1]>[0]) => Promise<T>) => withUser(pro.providerId, q);
    await expect(as((tx) => tx`update public.providers set status = 'approved' where id = ${pro.providerId}`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(as((tx) => tx`update public.providers set rating_avg = 5, rating_count = 999 where id = ${pro.providerId}`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(as((tx) => tx`update public.providers set commission_rate_override = 0 where id = ${pro.providerId}`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(as((tx) => tx`update public.providers set stripe_account_id = 'acct_x' where id = ${pro.providerId}`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(as((tx) => tx`select commission_rate_override from public.providers where id = ${pro.providerId}`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(as((tx) => tx`select invite_code from public.providers where id = ${pro.providerId}`)).rejects.toMatchObject(PERMISSION_DENIED);
    // allowed columns work and coordinates are derived from the PLZ, never from input
    const rows = await as((tx) => tx`update public.providers set headline = 'Neu', base_postal_code = '20095' where id = ${pro.providerId} returning base_lat`);
    expect(rows).toHaveLength(1);
    const [p] = await sql()<{ headline: string; baseLat: number }[]>`select headline, base_lat from public.providers where id = ${pro.providerId}`;
    expect(p.headline).toBe("Neu");
    expect(p.baseLat).toBeGreaterThan(53);
    // another provider's row is untouched
    const other = await createProvider();
    expect(await as((tx) => tx`update public.providers set headline = 'Hack' where id = ${other.providerId} returning id`)).toHaveLength(0);
    // offerings of others are not writable
    expect(await as((tx) => tx`update public.provider_services set price_cents = 500 where provider_id = ${other.providerId} returning id`)).toHaveLength(0);
  });

  it("anon sees approved providers only", async () => {
    const draft = await createProvider({ status: "draft" });
    const live = await createProvider();
    expect(await withAnon((tx) => tx`select id from public.providers where id = ${draft.providerId}`)).toHaveLength(0);
    expect(await withAnon((tx) => tx`select id from public.providers where id = ${live.providerId}`)).toHaveLength(1);
    expect(await withAnon((tx) => tx`select id from public.provider_services where provider_id = ${draft.providerId}`)).toHaveLength(0);
    expect(await withAnon((tx) => tx`select id from public.provider_services where provider_id = ${live.providerId}`)).toHaveLength(1);
    await expect(withAnon((tx) => tx`select id from public.bookings`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(withAnon((tx) => tx`select id from public.profiles`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(withAnon((tx) => tx`select * from public.provider_time_off`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(withAnon((tx) => tx`insert into public.search_events (postal_code) values ('10115')`)).rejects.toMatchObject(PERMISSION_DENIED);
    // the busy-range function exposes time ranges of approved providers only
    const busy = await withAnon((tx) => tx`select * from public.provider_busy_ranges(${[draft.providerId]}::uuid[], now(), now() + interval '7 days')`);
    expect(busy).toHaveLength(0);
  });

  it("a provider sees the customer's address, last name and phone only after confirmation — never the e-mail or Start-Code", async () => {
    const pro = await createProvider({ bookingMode: "request" });
    const c = await createCustomer({ firstName: "Mila" });
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    const view = () => withUser(pro.providerId, (tx) => tx<Record<string, unknown>[]>`select * from public.provider_bookings where id = ${b.bookingId}`);

    expect(await view()).toHaveLength(0); // holds (pending_payment) are invisible to providers
    await confirmDevPayment(c, b.bookingId);
    const [requested] = await view();
    expect(requested.customerFirstName).toBe("Mila");
    expect(requested.addressLine).toBeNull();
    expect(requested.customerLastName).toBeNull();
    expect(requested.customerPhone).toBeNull();
    expect(requested.postalCode).toBe("10119");
    expect(Object.keys(requested)).not.toContain("startCode");
    expect(Object.keys(requested).some((k) => /mail/i.test(k))).toBe(false);

    await providerRespond(pro.session, b.bookingId, "accept");
    const [confirmed] = await view();
    expect(confirmed.addressLine).toBe("Torstraße 12");
    expect(confirmed.customerLastName).toBe("Test");
    expect(confirmed.customerPhone).toBe("+49 170 1234567");

    // the base table stays closed to providers
    expect(await withUser(pro.providerId, (tx) => tx`select id from public.bookings where id = ${b.bookingId}`)).toHaveLength(0);
  });

  it("reviews can only be written by the booking's customer for completed bookings", async () => {
    const pro = await createProvider();
    const [c, other] = [await createCustomer(), await createCustomer()];
    const slot = await slotAtLeast(pro.providerId, pro.offerings.entspannungsmassage, 3);
    const b = await createBooking(c, { providerServiceId: pro.offerings.entspannungsmassage, startsAt: slot, address: NEW_ADDRESS });
    await expect(withUser(c.userId, (tx) => tx`insert into public.reviews (booking_id, rating) values (${b.bookingId}, 5)`)).rejects.toThrow(/SOMA_REVIEW_NOT_ALLOWED/);
    await expect(withUser(other.userId, (tx) => tx`insert into public.reviews (booking_id, rating) values (${b.bookingId}, 1)`)).rejects.toThrow(/SOMA_REVIEW_NOT_ALLOWED|row-level security/);
    await expect(withUser(c.userId, (tx) => tx`update public.providers set rating_avg = 5`)).rejects.toMatchObject(PERMISSION_DENIED);
  });
});
