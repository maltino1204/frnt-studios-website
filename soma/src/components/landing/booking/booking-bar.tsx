"use client";

/**
 * Desktop booking bar (≥ 1024; LANDING_DESIGN_SPEC.md § 5.5). Owner: Conversion & Integration.
 * Mount once on the landing (layout or page): `<BookingBar />`. It reads the catalogue registered by
 * <HeroBookingEntry/>; pass `catalog` / `postalExample` only if the page has no hero entry.
 *
 * Opens on `openBooking()` / `soma:booking:open` when the hero entry is < 25 % in view: a modal dialog under the header
 * (full content width, Paper, `shadow-overlay`, radius 0 0 24 24, backdrop 48 %) holding the pill entry
 * (`id="termin-leiste"`), `RebookRow` and a close button. Focus goes to the PLZ; Esc or a backdrop click closes and
 * focus returns to the trigger. Hooks for Motion: `[data-booking-surface="bar"]`, `[data-closing]` during the exit.
 */
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BookingEntry, type BookingDraft } from "@/components/site/booking-entry";
import type { EntryCategory } from "@/components/site/discovery-copy";
import { RebookRow } from "@/components/site/discovery-rebook";
import { IconButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/layout";
import { useDialogMotion } from "@/components/ui/sheet";
import { BAR_ENTRY_ID, DESKTOP_QUERY, registerBookingSurface, setBookingOpenFlag, type BookingOpenDetail } from "./booking-access";
import { getBookingDraft, getEntryData, setBookingDraft } from "./booking-draft";

type Session = { n: number; seed: Partial<BookingDraft>; top: number };

/** The draft to seed a new bar or sheet with; a requested category replaces the service. */
export function seedFor(detail: BookingOpenDetail): Partial<BookingDraft> {
  const draft = { ...getBookingDraft().draft };
  if (detail.categorySlug) return { ...draft, categorySlug: detail.categorySlug, serviceId: null };
  return draft;
}

export function BookingBar({ catalog, postalExample }: { catalog?: EntryCategory[]; postalExample?: string }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDialogMotion(open, close, 'input[name="plz"]');
  const pathname = usePathname();

  useEffect(
    () =>
      registerBookingSurface("bar", (detail) => {
        const header = document.querySelector("header");
        const top = Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
        setSession((s) => ({ n: (s?.n ?? 0) + 1, seed: seedFor(detail), top }));
        setOpen(true);
      }),
    [],
  );

  useEffect(() => {
    setBookingOpenFlag(open ? "bar" : null);
    return () => setBookingOpenFlag(null);
  }, [open]);

  // A submit navigates: close. Also close when the window narrows below the desktop breakpoint.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const on = () => {
      if (!mq.matches) setOpen(false);
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const data = catalog ? { catalog, postalExample: postalExample ?? "10115" } : getEntryData();

  return (
    <dialog
      ref={ref}
      aria-label="Termin finden"
      data-booking-surface="bar"
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      style={{ top: session?.top ?? 0 }}
      className="fixed inset-x-0 bottom-auto m-0 h-auto max-h-none w-full max-w-none overflow-visible rounded-b-[24px] bg-surface-raised p-0 text-ink shadow-overlay backdrop:bg-[rgb(37_33_31/0.48)] open:animate-rise"
    >
      {session && data ? (
        <Container className="flex flex-col gap-4 py-6">
          <div className="flex items-center gap-4">
            <BookingEntry
              key={session.n}
              catalog={data.catalog}
              postalExample={data.postalExample}
              variant="hero"
              id={BAR_ENTRY_ID}
              popoverPlacement="below"
              initialDraft={session.seed}
              onDraftChange={(d) => setBookingDraft("bar", d)}
              ctaId="bar-search-submit"
              className="min-w-0 flex-1 lg:w-full"
            />
            <IconButton label="Schließen" onClick={close} className="shrink-0">
              <Icon icon={X} size={22} />
            </IconButton>
          </div>
          <RebookRow />
        </Container>
      ) : null}
    </dialog>
  );
}
