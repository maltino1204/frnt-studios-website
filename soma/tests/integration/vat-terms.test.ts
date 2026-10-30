import { describe, expect, it } from "vitest";
import { withAnon, withUser } from "@/server/db/client";
import { includedVatCents, vatNote } from "@/server/domain/pricing";
import { createBooking, getBookingForCustomer, quoteBooking } from "@/server/services/bookings";
import { getProSettings, updateProSettings } from "@/server/services/pro";
import { createCustomer, createProvider, NEW_ADDRESS, slotAtLeast, sql } from "./support/fixtures";
import { rawInsertBooking } from "./support/raw";

const PERMISSION_DENIED = { code: "42501" };

async function setVat(providerId: string, mode: "regular" | "small_business") {
  // through the provider's own column grant (not the owner connection)
  await withUser(providerId, (tx) => tx`update public.providers set vat_mode = ${mode} where id = ${providerId}`);
}

describe("VAT mode (PAngV / § 19 UStG)", () => {
  it("quotes with the provider's VAT note and snapshots the mode on the booking", async () => {
    const pro = await createProvider({ services: [{ slug: "entspannungsmassage", priceCents: 8900 }] });
    const c = await createCustomer();
    const psId = pro.offerings.entspannungsmassage;
    expect((await getProSettings(pro.session)).vatMode).toBe("small_business");

    await setVat(pro.providerId, "regular");
    const slot = await slotAtLeast(pro.providerId, psId, 4);
    const quote = await quoteBooking({ providerServiceId: psId, startsAt: slot, postalCode: "10119" }, c);
    expect(quote.vatMode).toBe("regular");
    expect(quote.vatNote).toBe(vatNote("regular", quote.price.totalCents));
    expect(quote.vatNote).toMatch(/^inkl\. 19 % MwSt\. \(enthalten: \d+,\d{2} €\)$/);
    expect(includedVatCents(quote.price.totalCents)).toBe(Math.round(quote.price.totalCents - quote.price.totalCents / 1.19));

    const b = await createBooking(c, { providerServiceId: psId, startsAt: slot, address: NEW_ADDRESS });
    const [row] = await sql()<{ vatMode: string; totalCents: number }[]>`select vat_mode, total_cents from public.bookings where id = ${b.bookingId}`;
    expect(row.vatMode).toBe("regular");

    // the provider switches to Kleinunternehmer: new quotes change, the booking keeps its snapshot
    const s = await getProSettings(pro.session);
    const updated = await updateProSettings(pro.session, {
      bookingMode: s.bookingMode, leadTimeMinutes: 60, travelBufferMinutes: 30, maxAdvanceDays: s.maxAdvanceDays, vatMode: "small_business",
    });
    expect(updated.vatMode).toBe("small_business");
    const slot2 = await slotAtLeast(pro.providerId, psId, 30);
    const quote2 = await quoteBooking({ providerServiceId: psId, startsAt: slot2, postalCode: "10119" });
    expect(quote2.vatNote).toBe("Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.");
    const detail = await getBookingForCustomer(c, b.bookingId);
    expect(detail?.vatMode).toBe("regular");
    expect(detail?.vatNote).toBe(vatNote("regular", row.totalCents));

    // omitting vatMode leaves it unchanged
    expect((await updateProSettings(pro.session, { bookingMode: s.bookingMode, leadTimeMinutes: 60, travelBufferMinutes: 30, maxAdvanceDays: s.maxAdvanceDays })).vatMode).toBe("small_business");
  });

  it("the snapshot is set by the database from the provider and is immutable", async () => {
    const pro = await createProvider();
    const c = await createCustomer();
    await setVat(pro.providerId, "regular");
    // raw owner insert without vat_mode (column default small_business) → trigger takes the provider's mode
    const id = await rawInsertBooking(pro, c, new Date(Date.now() + 30 * 3_600_000));
    const [row] = await sql()<{ vatMode: string }[]>`select vat_mode from public.bookings where id = ${id}`;
    expect(row.vatMode).toBe("regular");
    await expect(sql()`update public.bookings set vat_mode = 'small_business' where id = ${id}`).rejects.toThrow(/SOMA_BOOKING_IMMUTABLE/);
    await expect(sql()`insert into public.bookings (vat_mode) select 'gross'`).rejects.toBeTruthy();
    // customers can read their snapshot
    expect(await withUser(c.userId, (tx) => tx<{ vatMode: string }[]>`select vat_mode from public.bookings where id = ${id}`)).toEqual([{ vatMode: "regular" }]);
  });

  it("providers may change vat_mode but never terms_accepted_at; anon can read vat_mode of approved providers", async () => {
    const pro = await createProvider();
    await expect(withUser(pro.providerId, (tx) => tx`update public.providers set terms_accepted_at = now() where id = ${pro.providerId}`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(withUser(pro.providerId, (tx) => tx`update public.providers set vat_mode = 'gross' where id = ${pro.providerId}`)).rejects.toMatchObject({ code: "23514" });
    await setVat(pro.providerId, "regular");
    const [p] = await withAnon((tx) => tx<{ vatMode: string }[]>`select vat_mode from public.providers where id = ${pro.providerId}`);
    expect(p.vatMode).toBe("regular");
    await expect(withAnon((tx) => tx`select terms_accepted_at from public.providers where id = ${pro.providerId}`)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(updateProSettings(pro.session, { bookingMode: "instant", leadTimeMinutes: 60, travelBufferMinutes: 30, maxAdvanceDays: 60, vatMode: "netto" as "regular" })).rejects.toMatchObject({ code: "validation" });
  });
});
