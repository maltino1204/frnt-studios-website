"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { quoteBookingAction, rebookOptionsAction } from "@/server/actions/booking";
import type { OfferingDTO, RebookOptionsDTO } from "@/server/dto";
import { SlotPicker, useSlotPicker } from "./slot-picker";
import { ProviderRow } from "./provider-row";
import { dayLabel } from "./checkout-format";

function checkoutHref(o: RebookOptionsDTO, slot: string) {
  const base = routes.checkout({ angebot: o.providerServiceId, start: slot, plz: o.postalCode, adresse: o.addressId ?? undefined });
  return `${base}&von=${o.bookingId}`;
}

function RebookPicker({ options, travelFeeCents }: { options: RebookOptionsDTO; travelFeeCents: number | null }) {
  const offering: OfferingDTO = {
    providerServiceId: options.providerServiceId,
    serviceId: "",
    serviceSlug: "",
    serviceName: options.serviceName,
    categoryId: "",
    categorySlug: "",
    categoryName: "",
    durationMinutes: options.durationMinutes,
    priceCents: options.priceCents,
  };
  const picker = useSlotPicker({
    providerId: options.provider.providerId,
    offerings: [offering],
    initialOfferingId: options.providerServiceId,
    initialDays: options.slots,
  });
  return (
    <div className="flex flex-col gap-6">
      <SlotPicker state={picker} travelFeeCents={travelFeeCents} idPrefix="rebook" inSheet />
      {picker.slot ? (
        <ButtonLink href={checkoutHref(options, picker.slot)} size="l" block iconRight={<Icon icon={ArrowRight} />} className="num">
          {`Weiter · ${dayLabel(picker.slot)}, ${formatTime(picker.slot)}`}
        </ButtonLink>
      ) : (
        <Button size="l" block disabled>
          Uhrzeit wählen
        </Button>
      )}
      <p className="type-caption text-ink-muted">Gleicher Profi, gleiche Leistung{options.addressId ? ", gleiche Adresse" : ""}. Den Endpreis siehst du vor der Buchung.</p>
    </div>
  );
}

/**
 * One-tap rebooking (product-spec J3): same provider, service and address.
 * Without a slot in the next 7 days it shows similar providers instead.
 */
export function RebookButton({
  bookingId,
  label = "Erneut buchen",
  variant = "secondary",
  size = "m",
  className,
}: {
  bookingId: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "s" | "m" | "l";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<RebookOptionsDTO | null>(null);
  const [travel, setTravel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const load = () => {
    setError(null);
    start(async () => {
      const res = await rebookOptionsAction(bookingId);
      if (!res.ok) {
        setError(res.error);
        setOpen(true);
        return;
      }
      setOptions(res.data);
      const first = res.data.slots.flatMap((d) => d.slots)[0];
      if (first) {
        const q = await quoteBookingAction({
          providerServiceId: res.data.providerServiceId,
          startsAt: first,
          ...(res.data.addressId ? { addressId: res.data.addressId } : { postalCode: res.data.postalCode }),
        });
        setTravel(q.ok && q.data.withinServiceArea ? q.data.price.travelFeeCents : null);
      }
      setOpen(true);
    });
  };

  const hasSlots = !!options?.slots.some((d) => d.slots.length);
  return (
    <>
      <Button variant={variant} size={size} onClick={load} loading={pending} icon={<Icon icon={RotateCcw} />} className={className}>
        {label}
      </Button>
      {open ? (
        <Sheet open onClose={() => setOpen(false)} title={options ? `Wieder bei ${options.provider.displayName}` : "Erneut buchen"}>
          {error ? (
            <Notice kind="warning">{error}</Notice>
          ) : options && hasSlots ? (
            <RebookPicker options={options} travelFeeCents={travel} />
          ) : options ? (
            <div className="flex flex-col gap-4">
              <p className="type-body-s text-ink-muted">
                {`${options.provider.displayName} hat in den nächsten 7 Tagen keinen freien Termin für ${options.serviceName}.`}
                {options.alternatives.length ? " Diese Profis in deiner Nähe haben Zeit:" : ""}
              </p>
              {options.alternatives.length ? (
                <div className="flex flex-col">
                  {options.alternatives.map((r) => (
                    <ProviderRow key={r.providerId} result={r} postalCode={options.postalCode} date={null} canFavorite headingLevel="h3" />
                  ))}
                </div>
              ) : (
                <ButtonLink href={routes.search({ plz: options.postalCode })} variant="secondary">
                  Profis in deiner Nähe finden
                </ButtonLink>
              )}
            </div>
          ) : null}
        </Sheet>
      ) : null}
    </>
  );
}
