"use client";

/**
 * Mobile and tablet booking sheet (< 1024; LANDING_DESIGN_SPEC.md § 5.5, § 5.6). Owner: Conversion & Integration.
 * Mount once on the landing (layout or page): `<BookingSheet />`. The dock's „Termin finden“ calls
 * `openBooking({ source: "dock" })` (or renders `<BookingLink source="dock">`).
 *
 * The kit `Sheet` (bottom sheet, drag to dismiss; centred dialog from 768) holds the stacked entry (`id="termin-sheet"`).
 * Was? and Wann? expand inline (no second sheet). Focus: the PLZ when none is known, else the close button (no
 * keyboard covering the sheet). The page does not scroll behind it. `html[data-booking-open="sheet"]` while open.
 */
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BookingEntry, type BookingDraft } from "@/components/site/booking-entry";
import type { EntryCategory } from "@/components/site/discovery-copy";
import { RebookRow } from "@/components/site/discovery-rebook";
import { Sheet } from "@/components/ui/sheet";
import { DESKTOP_QUERY, registerBookingSurface, setBookingOpenFlag, SHEET_ENTRY_ID } from "./booking-access";
import { seedFor } from "./booking-bar";
import { getEntryData, knownPlz, setBookingDraft } from "./booking-draft";

type Session = { n: number; seed: Partial<BookingDraft>; focusPlz: boolean };

export function BookingSheet({ catalog, postalExample }: { catalog?: EntryCategory[]; postalExample?: string }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const pathname = usePathname();

  useEffect(
    () =>
      registerBookingSurface("sheet", (detail) => {
        setSession((s) => ({ n: (s?.n ?? 0) + 1, seed: seedFor(detail), focusPlz: !knownPlz() }));
        setOpen(true);
      }),
    [],
  );

  useEffect(() => {
    setBookingOpenFlag(open ? "sheet" : null);
    const root = document.documentElement;
    root.style.overflow = open ? "hidden" : "";
    return () => {
      setBookingOpenFlag(null);
      root.style.overflow = "";
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const on = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const data = catalog ? { catalog, postalExample: postalExample ?? "10115" } : getEntryData();

  return (
    <Sheet open={open} onClose={close} title="Termin finden" initialFocus={session?.focusPlz ? 'input[name="plz"]' : "auto"}>
      {session && data ? (
        <div data-booking-surface="sheet" className="flex flex-col gap-5 pb-safe">
          <BookingEntry
            key={session.n}
            catalog={data.catalog}
            postalExample={data.postalExample}
            variant="compact"
            id={SHEET_ENTRY_ID}
            pickerLayout="inline"
            statusLayout="flow"
            initialDraft={session.seed}
            onDraftChange={(d) => setBookingDraft("sheet", d)}
            ctaId="sheet-search-submit"
            className="scroll-mt-0"
          />
          <RebookRow />
        </div>
      ) : null}
    </Sheet>
  );
}
