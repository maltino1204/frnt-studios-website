"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import { formatDistance, formatDuration, formatPrice, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { quoteBookingAction } from "@/server/actions/booking";
import type { CancellationPolicyDTO, OfferingDTO, SlotsByDayDTO } from "@/server/dto";
import { SlotPicker, useSlotPicker, type SlotPickerState } from "@/components/site/slot-picker";
import { dayLabel, NBSP } from "@/components/site/checkout-format";

export type TravelInfo = { postalCode: string; feeCents: number; within: boolean; distanceKm: number };

type Ctx = {
  picker: SlotPickerState;
  travel: TravelInfo | null;
  providerName: string;
  providerSlug: string;
  policy: CancellationPolicyDTO;
  inviteCode?: string;
  openSheet: () => void;
  setTravel: (t: TravelInfo | null) => void;
};
const BookingCtx = createContext<Ctx | null>(null);
function useBooking() {
  const c = useContext(BookingCtx);
  if (!c) throw new Error("ProfileBookingProvider missing");
  return c;
}

function checkoutHref(offeringId: string, slot: string, plz: string | null, invite?: string) {
  const base = routes.checkout({ angebot: offeringId, start: slot, plz: plz ?? undefined });
  return invite ? `${base}&einladung=${encodeURIComponent(invite)}` : base;
}

function priceParts(o: OfferingDTO, travel: TravelInfo | null): [string, string] {
  if (travel && travel.within) return [formatPrice(o.priceCents + travel.feeCents), `inkl.${NBSP}Anfahrt`];
  return [formatPrice(o.priceCents), `zzgl.${NBSP}Anfahrt`];
}

function totalLabel(o: OfferingDTO, travel: TravelInfo | null) {
  if (travel && travel.within) return `${formatPrice(o.priceCents + travel.feeCents)} inkl.${NBSP}Anfahrt`;
  return `${formatPrice(o.priceCents)} zzgl.${NBSP}Anfahrt`;
}

/**
 * Shared booking state for the profile: the inline picker (desktop), the sticky bar
 * and the bottom sheet (mobile) and the offering list all drive one slot picker.
 */
export function ProfileBookingProvider({
  providerId,
  providerName,
  providerSlug,
  offerings,
  initialOfferingId,
  initialDays,
  initialDate,
  policy,
  initialTravel,
  inviteCode,
  children,
}: {
  providerId: string;
  providerName: string;
  providerSlug: string;
  offerings: OfferingDTO[];
  initialOfferingId: string;
  initialDays: SlotsByDayDTO[];
  initialDate: string | null;
  policy: CancellationPolicyDTO;
  initialTravel: TravelInfo | null;
  inviteCode?: string;
  children: ReactNode;
}) {
  const picker = useSlotPicker({ providerId, offerings, initialOfferingId, initialDays, initialDate });
  const [travel, setTravel] = useState<TravelInfo | null>(initialTravel);
  const [sheet, setSheet] = useState(false);
  const ctx: Ctx = { picker, travel, setTravel, providerName, providerSlug, policy, inviteCode, openSheet: () => setSheet(true) };
  return (
    <BookingCtx.Provider value={ctx}>
      {children}
      <StickyBar />
        {sheet ? (
          <Sheet
            open
            onClose={() => setSheet(false)}
            title="Termin wählen"
            footer={<BookingCta block />}
          >
            <div className="flex flex-col gap-6">
              <PlzField idPrefix="sheet" />
              <SlotPicker state={picker} travelFeeCents={travel?.within ? travel.feeCents : null} policy={policy} idPrefix="sheet" inSheet />
            </div>
          </Sheet>
        ) : null}
    </BookingCtx.Provider>
  );
}

/** PLZ entry so the total includes the real travel fee (quoted by the server). */
function PlzField({ idPrefix }: { idPrefix: string }) {
  const { travel, setTravel, picker, providerName } = useBooking();
  const [value, setValue] = useState(travel?.postalCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(!travel);
  const [pending, start] = useTransition();

  const quote = (plz: string) => {
    setError(null);
    start(async () => {
      const startsAt = picker.slot ?? picker.days?.flatMap((d) => d.slots)[0] ?? new Date(Date.now() + 86_400_000).toISOString();
      const res = await quoteBookingAction({ providerServiceId: picker.offeringId, startsAt, postalCode: plz });
      if (!res.ok) {
        setError(res.fieldErrors?.postalCode ?? res.error);
        return;
      }
      setTravel({ postalCode: plz, feeCents: res.data.price.travelFeeCents, within: res.data.withinServiceArea, distanceKm: res.data.distanceKm });
      setEditing(false);
    });
  };

  if (travel && !editing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 rounded-tile bg-surface-sunken/70 py-1 pr-1.5 pl-4">
          <p className="type-body-s">
            <span className="text-ink-muted">Ihre Postleitzahl </span>
            <span className="font-semibold num">{travel.postalCode}</span>
            {travel.within ? (
              <span className="text-ink-muted">{` · ${formatDistance(travel.distanceKm)} · Anfahrt ${formatPrice(travel.feeCents)}`}</span>
            ) : null}
          </p>
          <Button variant="link" className="type-label-s" onClick={() => setEditing(true)}>
            Ändern
          </Button>
        </div>
        {!travel.within ? (
          <Notice kind="warning" title="Außerhalb des Einsatzgebiets">
            {`${providerName} fährt leider nicht bis ${travel.postalCode}. `}
            <Link href={routes.search({ plz: travel.postalCode, kategorie: picker.offering.categorySlug, leistung: picker.offering.serviceSlug })}>
              Profis in Ihrer Nähe anzeigen
            </Link>
          </Notice>
        ) : null}
      </div>
    );
  }
  return (
    <form
      className="flex items-start gap-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\d{5}$/.test(value)) return setError("Bitte geben Sie eine fünfstellige Postleitzahl ein.");
        quote(value);
      }}
    >
      <Input
        id={`${idPrefix}-plz`}
        label="Ihre Postleitzahl"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={5}
        placeholder="z. B. 10115"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 5))}
        error={error}
        hint={error ? undefined : "Für den Endpreis inklusive Anfahrt."}
        className="flex-1"
      />
      <Button type="submit" variant="secondary" className="mt-6 shrink-0" loading={pending}>
        Berechnen
      </Button>
    </form>
  );
}

/** Primary CTA: straight to checkout with the chosen slot. */
function BookingCta({ block }: { block?: boolean }) {
  const { picker, travel, inviteCode } = useBooking();
  const blocked = travel !== null && !travel.within;
  if (!picker.slot || blocked) {
    return (
      <div className="flex flex-col gap-1.5">
        <Button size="l" block={block} disabled>
          {blocked ? "Außerhalb des Einsatzgebiets" : "Uhrzeit wählen"}
        </Button>
        {!blocked ? <p className="type-caption text-ink-muted">Wählen Sie oben Tag und Uhrzeit.</p> : null}
      </div>
    );
  }
  return (
    <ButtonLink
      href={checkoutHref(picker.offeringId, picker.slot, travel?.postalCode ?? null, inviteCode)}
      variant="accent"
      size="l"
      block={block}
      iconRight={<Icon icon={ArrowRight} />}
      className="num"
    >
      {`Weiter · ${dayLabel(picker.slot)}, ${formatTime(picker.slot)}`}
    </ButtonLink>
  );
}

/** Mobile sticky bar: live total of the selected service + "Termin wählen". */
function StickyBar() {
  const { picker, travel, openSheet } = useBooking();
  const o = picker.offering;
  return (
    <div className="fixed inset-x-0 bottom-0 z-(--z-sticky-cta) glass-strong px-(--space-gutter) pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-bar animate-sheet-in lg:hidden">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4">
        <p className="min-w-0">
          <span className="block type-label font-semibold num">{totalLabel(o, travel)}</span>
          <span className="block truncate type-caption text-ink-muted">{`${o.serviceName} · ${formatDuration(o.durationMinutes)}`}</span>
        </p>
        <Button
          variant="accent"
          size="l"
          onClick={openSheet}
          className="shrink-0"
        >
          Termin wählen
        </Button>
      </div>
    </div>
  );
}

/** Services & prices; choosing one updates the picker (and opens the sheet on mobile). */
export function OfferingList() {
  const { picker, travel, openSheet } = useBooking();
  const groups = new Map<string, OfferingDTO[]>();
  for (const o of picker.offerings) groups.set(o.categoryName, [...(groups.get(o.categoryName) ?? []), o]);
  const multi = groups.size > 1;
  const choose = (id: string) => {
    picker.selectOffering(id);
    if (window.matchMedia("(min-width: 1024px)").matches) {
      document.getElementById("termin")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      openSheet();
    }
  };
  return (
    <div className="flex flex-col gap-6">
      {[...groups.entries()].map(([cat, list]) => (
        <div key={cat} className="flex flex-col gap-2.5">
          {multi ? <p className="type-overline text-ink-muted">{cat}</p> : null}
          <ul className="flex flex-col gap-2.5">
            {list.map((o) => {
              const selected = o.providerServiceId === picker.offeringId;
              const [price, suffix] = priceParts(o, travel);
              return (
                <li key={o.providerServiceId}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choose(o.providerServiceId)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-card bg-surface-raised px-4 py-3.5 text-left shadow-raised pressable focus-ring md:px-5 md:py-4",
                      selected ? "ring-2 ring-ink" : "[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-float",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className={cn("block type-body text-ink hyphens-none", selected && "font-semibold")}>{o.serviceName}</span>
                      <span className="block type-caption text-ink-muted num">{formatDuration(o.durationMinutes)}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block type-label text-ink num">{price}</span>
                      <span className="block type-caption whitespace-nowrap text-ink-muted">{suffix}</span>
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "inline-flex size-6 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color] duration-fast",
                        selected ? "border-ink bg-ink text-ink-inverse" : "border-line-strong bg-surface-raised",
                      )}
                    >
                      {selected ? <Icon icon={Check} size={14} strokeWidth={2.5} className="animate-pop" /> : null}
                    </span>
                    <span className="sr-only">{selected ? " – gewählt" : " – wählen"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Desktop: the slot picker inline in the content column. */
export function InlineBooking() {
  const { picker, travel, policy } = useBooking();
  return (
    <div className="flex flex-col gap-6">
      <PlzField idPrefix="inline" />
      <SlotPicker state={picker} travelFeeCents={travel?.within ? travel.feeCents : null} policy={policy} idPrefix="inline" />
      {/* Pinned to the bottom of the (scrollable) sticky card, so the next step is always in reach. */}
      <div className="sticky bottom-0 z-[2] -mx-5 -mb-5 mt-auto rounded-b-card border-t border-line bg-surface-raised px-5 pt-4 pb-5 xl:-mx-6 xl:-mb-6 xl:px-6 xl:pb-6 [&_a]:w-full [&_button]:w-full">
        <BookingCta />
      </div>
    </div>
  );
}
