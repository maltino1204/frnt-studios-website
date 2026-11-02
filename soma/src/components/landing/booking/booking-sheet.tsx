"use client";

/**
 * Mobile and tablet booking sheet (< 1024; LANDING_DESIGN_SPEC.md § 5.5, § 5.6). Owner: Conversion & Integration.
 * Mount once on the landing (layout or page): `<BookingSheet />`. The dock's „Termin finden“ calls
 * `openBooking({ source: "dock" })` (or renders `<BookingLink source="dock">`).
 *
 * Lazy mounting is supported (audit-1 PT-1; Frontend `nav/lazy-surfaces.tsx`): mount it once, whenever. It registers on
 * mount, and a request made before that is queued by `booking-access.ts` and opens it on registration; register the
 * loader with `setBookingSurfaceLoader(mountSurfaces)` so a bare `openBooking()` also triggers the mount. Below 1024 the
 * entry renders, closed, in an idle period after the mount (audit-2 N-4), so an open only seeds it through `syncDraft`
 * and calls showModal() (no render of the entry inside the tap).
 *
 * The kit `Sheet` (bottom sheet, drag to dismiss; centred dialog from 768) holds the stacked entry (`id="termin-sheet"`).
 * Was? and Wann? expand inline (no second sheet). Focus: the PLZ when none is known, else the close button (no
 * keyboard covering the sheet). The page does not scroll behind it. `html[data-booking-open="sheet"]` while open.
 */
import { usePathname } from "next/navigation";
import { flushSync } from "react-dom";
import { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookingEntry, type BookingDraft } from "@/components/site/booking-entry";
import type { EntryCategory } from "@/components/site/discovery-copy";
import { RebookRow } from "@/components/site/discovery-rebook";
import { Sheet } from "@/components/ui/sheet";
import { DESKTOP_QUERY, registerBookingSurface, setBookingOpenFlag, SHEET_ENTRY_ID, type BookingOpenDetail } from "./booking-access";
import { seedFor } from "./booking-bar";
import { getBookingDraft, knownPlz, setBookingDraft, useEntryData } from "./booking-draft";

/**
 * One open = one session (`n` ≥ 1). `n: 0` is the closed pre-render. The entry stays mounted: an open only seeds the
 * draft through `syncDraft` and calls showModal(), no remount. `first` seeds the entry's initial state.
 */
type Session = { n: number; first: Partial<BookingDraft>; seed: Partial<BookingDraft>; focusPlz: boolean };

/** Memoised here, so an open that changes nothing in the draft does not re-render the entry inside the tap. */
const SheetEntry = memo(BookingEntry);
const SheetRebook = memo(RebookRow);

const sameWhen = (a?: BookingDraft["when"], b?: BookingDraft["when"]) => a === b || (!!a && !!b && a.mode === b.mode && a.date === b.date && a.window === b.window);
/** True when seeding `next` would change nothing in an entry that shows `cur`. */
function sameDraft(cur: Partial<BookingDraft>, next: Partial<BookingDraft>): boolean {
  return (
    (next.plz === undefined || next.plz === (cur.plz ?? "")) &&
    (next.categorySlug === undefined || next.categorySlug === (cur.categorySlug ?? null)) &&
    (next.serviceId === undefined || next.serviceId === (cur.serviceId ?? null)) &&
    (next.when === undefined || sameWhen(cur.when, next.when))
  );
}

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void };

/*
 * While the sheet is open, the page parts that lie entirely outside the viewport are not rendered
 * (`content-visibility: hidden` at their current content size, so nothing moves). showModal() makes the rest of the
 * document inert, which restyles every rendered element synchronously inside the call: ≈ 145 ms of a 4× CPU phone for
 * the hero, the chapters near the viewport and the footer (audit-2 N-4). Hidden, only what is in view is restyled. The
 * chapter overlay does the same for the whole page (it is opaque); the sheet leaves the page above it in view.
 * Restored when the dialog closes (after its exit animation).
 */
const PAGE_PARTS = "#inhalt > section, .lp-footer-wrap";
let hiddenParts: HTMLElement[] = [];

function hideOffscreenParts(): void {
  showParts();
  const vh = window.innerHeight;
  const parts = Array.from(document.querySelectorAll<HTMLElement>(PAGE_PARTS));
  // Read everything first (one layout), then write.
  const sizes = parts.map((el) => {
    const r = el.getBoundingClientRect();
    if (r.height <= 0 || (r.bottom > 0 && r.top < vh)) return null;
    const cs = getComputedStyle(el);
    const px = (v: string) => parseFloat(v) || 0;
    // contain-intrinsic-size is the content box: without padding and borders.
    const w = r.width - px(cs.paddingLeft) - px(cs.paddingRight) - px(cs.borderLeftWidth) - px(cs.borderRightWidth);
    const h = r.height - px(cs.paddingTop) - px(cs.paddingBottom) - px(cs.borderTopWidth) - px(cs.borderBottomWidth);
    return { w: Math.max(0, w), h: Math.max(0, h) };
  });
  parts.forEach((el, i) => {
    const s = sizes[i];
    if (!s) return;
    el.style.containIntrinsicSize = `${s.w}px ${s.h}px`;
    el.style.contentVisibility = "hidden";
    hiddenParts.push(el);
  });
}

function showParts(): void {
  for (const el of hiddenParts) {
    el.style.contentVisibility = "";
    el.style.containIntrinsicSize = "";
  }
  hiddenParts = [];
}

export function BookingSheet({ catalog, postalExample }: { catalog?: EntryCategory[]; postalExample?: string }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const pathname = usePathname();
  const surface = useRef<HTMLDivElement>(null);
  /** What the entry shows (its own reports): an open that would seed the same values passes the same `syncDraft`. */
  const shown = useRef<Partial<BookingDraft>>({});
  const sync = useRef<{ draft: Partial<BookingDraft>; version: number } | null>(null);
  /** The closed pre-render does not speak for the visitor: only a sheet that has opened writes the shared draft. */
  const opened = useRef(false);

  useEffect(() => {
    // Render, commit and showModal() in the request's own task (as the chapter overlay does), not in a task React
    // schedules later, which can queue behind other work and a frame (audit-2 N-4).
    const openSheet = (detail: BookingOpenDetail) => {
      hideOffscreenParts();
      opened.current = true;
      flushSync(() => {
        setSession((s) => {
          const seed = seedFor(detail);
          return { n: (s?.n ?? 0) + 1, first: s?.first ?? seed, seed, focusPlz: !knownPlz() };
        });
        setOpen(true);
      });
      // Safety net: if the dialog did not open (an error while rendering), the page must not stay hidden.
      window.setTimeout(() => {
        if (!surface.current?.closest("dialog")?.open) showParts();
      }, 2000);
    };
    // A request queued before the mount opens during this registration, i.e. inside this effect, where React cannot
    // flush: open it right after.
    let registering = true;
    const unregister = registerBookingSurface("sheet", (detail) => {
      if (registering) queueMicrotask(() => openSheet(detail));
      else openSheet(detail);
    });
    registering = false;
    return unregister;
  }, []);

  // The closed pre-render (phones and tablets only: the sheet never opens from 1024 px), in an idle period after the
  // mount and as a transition, so it never blocks a tap. An open before that renders the entry at once.
  useEffect(() => {
    if (window.matchMedia(DESKTOP_QUERY).matches) return;
    const win = window as IdleWindow;
    const prerender = () => startTransition(() => setSession((s) => s ?? { n: 0, first: seedFor({ source: "prerender" }), seed: {}, focusPlz: false }));
    if (!win.requestIdleCallback) {
      const t = window.setTimeout(prerender, 500);
      return () => window.clearTimeout(t);
    }
    const h = win.requestIdleCallback(prerender, { timeout: 3000 });
    return () => win.cancelIdleCallback?.(h);
  }, []);

  // The page parts come back once the dialog has closed (the native `close` event, after the exit animation).
  useEffect(() => {
    const onClose = (e: Event) => {
      const d = e.target as Element | null;
      if (d instanceof HTMLDialogElement && surface.current && d.contains(surface.current)) showParts();
    };
    document.addEventListener("close", onClose, true);
    return () => {
      document.removeEventListener("close", onClose, true);
      showParts();
    };
  }, []);

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

  const registered = useEntryData();
  const data = catalog ? { catalog, postalExample: postalExample ?? "10115" } : registered;
  const n = session?.n ?? 0;
  const syncDraft = useMemo(() => {
    if (!session || n === 0 || sameDraft(shown.current, session.seed)) return sync.current;
    sync.current = { draft: session.seed, version: n };
    return sync.current;
    // a new session (an open) is the only input; the refs are read, not watched
  }, [n]);
  const onDraftChange = useCallback((d: BookingDraft) => {
    shown.current = d;
    // A report that changes nothing in the shared draft (the entry's first report after a cold open, which repeats its
    // seed) is dropped: it would re-render the hero entry before the sheet's first frame.
    if (opened.current && !sameDraft(getBookingDraft().draft, d)) setBookingDraft("sheet", d);
  }, []);

  return (
    <Sheet open={open} onClose={close} title="Termin finden" initialFocus={session?.focusPlz ? 'input[name="plz"]' : "auto"}>
      {session && data ? (
        <div ref={surface} data-booking-surface="sheet" className="flex flex-col gap-5 pb-safe">
          <SheetEntry
            catalog={data.catalog}
            postalExample={data.postalExample}
            variant="compact"
            id={SHEET_ENTRY_ID}
            pickerLayout="inline"
            statusLayout="flow"
            initialDraft={session.first}
            syncDraft={syncDraft}
            onDraftChange={onDraftChange}
            ctaId="sheet-search-submit"
            className="scroll-mt-0"
          />
          <SheetRebook />
        </div>
      ) : null}
    </Sheet>
  );
}
