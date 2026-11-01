"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { DateStrip, TimeSlots } from "@/components/ui/booking";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { CheckLine } from "@/components/ui/summary";
import { cn } from "@/lib/cn";
import { berlinDateKey, formatDuration, formatPrice, formatTime } from "@/lib/format";
import { loadAvailabilityAction } from "@/server/actions/booking";
import type { CancellationPolicyDTO, OfferingDTO, SlotsByDayDTO } from "@/server/dto";
import { dayLabel, deadlineText, freeUntilFor, localNoon, NBSP } from "./checkout-format";

const DAYS = 14;

function firstDateWithSlots(days: SlotsByDayDTO[] | undefined, preferred?: string | null): string | null {
  if (!days?.length) return null;
  if (preferred && days.some((d) => d.date === preferred && d.slots.length)) return preferred;
  return days.find((d) => d.slots.length)?.date ?? null;
}

function nextDayKey(key: string): string {
  return berlinDateKey(new Date(localNoon(key).getTime() + 86_400_000));
}

export type SlotPickerConfig = {
  providerId: string;
  offerings: OfferingDTO[];
  initialOfferingId: string;
  /** server-loaded availability of the initial offering (today + N days) */
  initialDays: SlotsByDayDTO[];
  initialDate?: string | null;
};

/**
 * State for one slot picker. Slots always come from the server
 * (loadAvailabilityAction); the UI never computes availability.
 */
export function useSlotPicker(cfg: SlotPickerConfig) {
  const [offeringId, setOfferingId] = useState(cfg.initialOfferingId);
  const [cache, setCache] = useState<Record<string, SlotsByDayDTO[]>>({ [cfg.initialOfferingId]: cfg.initialDays });
  const [date, setDateState] = useState<string | null>(firstDateWithSlots(cfg.initialDays, cfg.initialDate));
  const [slot, setSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offering = cfg.offerings.find((o) => o.providerServiceId === offeringId) ?? cfg.offerings[0];
  const days = cache[offeringId];

  const fetchDays = useCallback(
    async (providerServiceId: string, from: string, count: number) => {
      const res = await loadAvailabilityAction({ providerId: cfg.providerId, providerServiceId, from, days: count });
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    [cfg.providerId],
  );

  const selectOffering = useCallback(
    async (id: string) => {
      setOfferingId(id);
      setSlot(null);
      setError(null);
      const cached = cache[id];
      if (cached) {
        setDateState((d) => firstDateWithSlots(cached, d));
        return;
      }
      setLoading(true);
      try {
        const loaded = await fetchDays(id, berlinDateKey(), DAYS);
        setCache((c) => ({ ...c, [id]: loaded }));
        setDateState((d) => firstDateWithSlots(loaded, d));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Die Termine konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    },
    [cache, fetchDays],
  );

  const loadMore = useCallback(async () => {
    const current = cache[offeringId] ?? [];
    const last = current[current.length - 1]?.date ?? berlinDateKey();
    setLoading(true);
    setError(null);
    try {
      const more = await fetchDays(offeringId, nextDayKey(last), DAYS);
      const merged = [...current, ...more.filter((d) => !current.some((c) => c.date === d.date))];
      setCache((c) => ({ ...c, [offeringId]: merged }));
      setDateState((d) => (d && merged.some((x) => x.date === d && x.slots.length) ? d : firstDateWithSlots(more)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Die Termine konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [cache, offeringId, fetchDays]);

  const setDate = useCallback((d: string) => {
    setDateState(d);
    setSlot(null);
  }, []);

  const pick = useCallback((d: string, s: string) => {
    setDateState(d);
    setSlot(s);
  }, []);

  return { offerings: cfg.offerings, offering, offeringId, selectOffering, days, date, setDate, slot, setSlot, pick, loading, error, loadMore };
}

export type SlotPickerState = ReturnType<typeof useSlotPicker>;

/**
 * Slot picker: service/duration select + DateStrip + TimeSlots (design-guideline §8).
 * Controlled by `useSlotPicker` so the same state can render inline and inside a sheet.
 */
export function SlotPicker({
  state,
  travelFeeCents,
  policy,
  locationPhrase = "bei Ihnen vor Ort",
  className,
  idPrefix = "sp",
  inSheet,
}: {
  state: SlotPickerState;
  /** known travel fee for the customer's PLZ (null = unknown) */
  travelFeeCents: number | null;
  policy?: CancellationPolicyDTO;
  locationPhrase?: string;
  className?: string;
  idPrefix?: string;
  inSheet?: boolean;
}) {
  const { offerings, offering, days, date, slot, loading, error } = state;
  const now = useMemo(() => new Date(), []);
  const cells = (days ?? []).map((d) => ({ key: d.date, date: localNoon(d.date), available: d.slots.length > 0 }));
  const daySlots = days?.find((d) => d.date === date)?.slots ?? [];
  const anySlot = (days ?? []).some((d) => d.slots.length > 0);
  const nextFree = (() => {
    if (!days) return null;
    for (const d of days) if (d.date > (date ?? "") && d.slots.length) return { date: d.date, slot: d.slots[0] };
    return null;
  })();
  const priceOf = (o: OfferingDTO) =>
    travelFeeCents == null ? `${formatPrice(o.priceCents)} zzgl. Anfahrt` : `${formatPrice(o.priceCents + travelFeeCents)} inkl. Anfahrt`;
  const end = slot ? new Date(new Date(slot).getTime() + offering.durationMinutes * 60_000).toISOString() : null;
  const freeUntil = slot && policy ? freeUntilFor(policy, slot) : null;
  // Inside a sheet the content padding is 20px at every width, so the strip bleeds by exactly that much.
  const style = inSheet ? ({ "--space-gutter": "1.25rem" } as CSSProperties) : undefined;

  return (
    <div className={cn("flex flex-col gap-6 [&_[role=radiogroup]]:scroll-px-(--space-gutter) lg:[&_[role=radiogroup]]:scroll-px-0", className)} style={style}>
      {offerings.length > 1 ? (
        <Select
          id={`${idPrefix}-service`}
          label="Leistung"
          value={state.offeringId}
          onChange={(e) => state.selectOffering(e.target.value)}
          hint={travelFeeCents != null ? "Endpreise inklusive Anfahrt." : undefined}
          // A5-8: one line could not hold "Entspannungsmassage (klassisch) · 60 Min. · 85 €" in the booking panel.
          // The closed control shows the service (it may wrap) over duration and price; the list keeps all three.
          display={
            <>
              <span className="type-body text-ink">{offering.serviceName}</span>
              <span className="type-caption text-ink-muted num">{`${formatDuration(offering.durationMinutes)} · ${priceOf(offering)}`}</span>
            </>
          }
        >
          {offerings.map((o) => (
            <option key={o.providerServiceId} value={o.providerServiceId}>
              {`${o.serviceName} · ${formatDuration(o.durationMinutes)} · ${priceOf(o)}`}
            </option>
          ))}
        </Select>
      ) : (
        <p className="type-body-s text-ink-muted">
          <span className="font-semibold text-ink">{offering.serviceName}</span>
          {` · ${formatDuration(offering.durationMinutes)} · ${priceOf(offering)}`}
        </p>
      )}

      <div aria-live="polite" aria-busy={loading || undefined} className="flex flex-col gap-6">
        {loading && !days ? (
          <div role="status" className="flex flex-col gap-6" aria-label="Termine werden geladen">
            <div className="flex gap-1 pt-5">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-[72px] w-14 shrink-0 rounded-tile" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-touch rounded-tile" />
              ))}
            </div>
          </div>
        ) : error ? (
          <p role="alert" className="type-body-s text-danger">
            {error}
          </p>
        ) : days && !anySlot ? (
          <div className="flex flex-col items-start gap-3">
            <p className="type-body-s text-ink">
              In den nächsten {days.length}
              {NBSP}Tagen ist für diese Leistung kein Termin frei.
            </p>
            <Button variant="secondary" onClick={state.loadMore} loading={loading}>
              Spätere Termine anzeigen
            </Button>
          </div>
        ) : days ? (
          <>
            <DateStrip days={cells} selected={date} onSelect={state.setDate} label="Tag wählen" />
            <TimeSlots
              slots={daySlots.map((s) => ({ start: s }))}
              selected={slot}
              // The chip settles into ink; device haptics stay reserved for key confirmations (A5-14).
              onSelect={state.setSlot}
              empty={
                <div className="flex flex-col items-start gap-3">
                  <p className="type-body-s text-ink-muted">Keine freien Termine an diesem Tag.</p>
                  {nextFree ? (
                    <Button variant="secondary" onClick={() => state.pick(nextFree.date, nextFree.slot)}>
                      {`Nächster freier Termin: ${dayLabel(nextFree.slot, now)}, ${formatTime(nextFree.slot)}`}
                    </Button>
                  ) : null}
                </div>
              }
            />
            <div className="flex items-center justify-between gap-4">
              <Button variant="link" onClick={state.loadMore} loading={loading} className="type-label-s">
                Spätere Tage laden
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {slot && end ? (
        <div key={slot} className="flex flex-col gap-1.5 rounded-tile bg-surface-tint px-4 py-3 shadow-[inset_0_0_0_1px_var(--color-line-mid)] animate-rise">
          <p className="type-label num">
            {`${dayLabel(slot, now)} · ${formatTime(slot)}–${formatTime(end)} · ${formatDuration(offering.durationMinutes)} · ${locationPhrase}`}
          </p>
          {freeUntil && new Date(freeUntil).getTime() > now.getTime() ? (
            <CheckLine>{`Kostenlos stornierbar bis ${deadlineText(freeUntil)}.`}</CheckLine>
          ) : policy ? (
            <p className="type-caption text-ink-muted">Für diesen kurzfristigen Termin gelten bereits Stornogebühren.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
