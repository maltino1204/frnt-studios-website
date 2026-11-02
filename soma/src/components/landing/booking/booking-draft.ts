/**
 * Landing booking draft (Conversion & Integration, docs/landing/INTEGRATION.md § 2.4, C3).
 *
 * One in-memory store per tab: the hero entry, the booking bar (≥ 1024) and the booking sheet (< 1024) read and write
 * it, so a PLZ typed in one appears in the others. Nothing is persisted (no new storage; the remembered PLZ stays
 * `localStorage["soma:last-plz"]`, written by `BookingEntry`). Safe to import from client components only.
 */
import { useSyncExternalStore } from "react";
import type { BookingDraft } from "@/components/site/booking-entry";
import type { EntryCategory } from "@/components/site/discovery-copy";

export type DraftSource = "hero" | "bar" | "sheet";
export type DraftState = { draft: Partial<BookingDraft>; source: DraftSource | null; version: number };

const EMPTY: DraftState = { draft: {}, source: null, version: 0 };
let state: DraftState = EMPTY;
const listeners = new Set<() => void>();

/** The catalogue the hero entry received, so the bar and sheet need no second copy in the page payload. */
let entryData: { catalog: EntryCategory[]; postalExample: string } | null = null;

export function setBookingDraft(source: DraftSource, draft: Partial<BookingDraft>): void {
  state = { draft, source, version: state.version + 1 };
  for (const l of listeners) l();
}

export function getBookingDraft(): DraftState {
  return state;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** React binding; the server snapshot is always empty, so hydration never mismatches. */
export function useBookingDraft(): DraftState {
  return useSyncExternalStore(subscribe, getBookingDraft, () => EMPTY);
}

const entryListeners = new Set<() => void>();

export function registerEntryData(data: { catalog: EntryCategory[]; postalExample: string }): void {
  entryData = data;
  for (const l of entryListeners) l();
}

export function getEntryData(): { catalog: EntryCategory[]; postalExample: string } | null {
  return entryData;
}

function subscribeEntryData(listener: () => void): () => void {
  entryListeners.add(listener);
  return () => entryListeners.delete(listener);
}

/**
 * The hero entry's catalogue for the bar and sheet. It hydrates after the page's shell (chapters/01-hero.tsx), so a
 * surface opened before that renders its entry as soon as the data registers.
 */
export function useEntryData(): { catalog: EntryCategory[]; postalExample: string } | null {
  return useSyncExternalStore(subscribeEntryData, getEntryData, () => null);
}

/** A valid 5-digit PLZ from the draft, else the remembered one; null when neither exists. */
export function knownPlz(): string | null {
  const p = state.draft.plz;
  if (p && /^\d{5}$/.test(p)) return p;
  try {
    const v = window.localStorage.getItem("soma:last-plz");
    return v && /^\d{5}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

/** Test helper: back to the initial state. */
export function resetBookingDraft(): void {
  state = EMPTY;
  entryData = null;
  for (const l of listeners) l();
}
