"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { CheckLine } from "@/components/ui/summary";
import { formatPriceExact, formatTime } from "@/lib/format";
import { cancelBookingAction } from "@/server/actions/booking";
import type { BookingStatus, PolicyScheduleEntryDTO } from "@/server/dto";

function tierIndex(schedule: PolicyScheduleEntryDTO[], now: number): number {
  return schedule.findIndex((e) => (!e.from || Date.parse(e.from) <= now) && (!e.until || now < Date.parse(e.until)));
}

/**
 * "Termin stornieren" with a live fee preview. The preview comes from the server
 * (ifCancelledNow); when a tier boundary has passed since the page rendered, the
 * page is refreshed before the customer can confirm.
 */
export function CancelBooking({
  bookingId,
  status,
  preview,
  schedule,
  renderedAt,
  providerName,
  graceUntil = null,
  graceMinutes = 0,
}: {
  bookingId: string;
  status: BookingStatus;
  preview: { feeCents: number; refundCents: number; tierLabel: string };
  schedule: PolicyScheduleEntryDTO[];
  renderedAt: number;
  providerName: string;
  /** end of the Bedenkzeit (booking time + graceMinutes), null when the booking's policy has none */
  graceUntil?: string | null;
  graceMinutes?: number;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const free = preview.feeCents === 0;
  const isRequest = status === "requested" || status === "pending_payment";

  const graceEnd = graceUntil ? Date.parse(graceUntil) : null;
  const [now, setNow] = useState(renderedAt);
  const inGrace = status === "confirmed" && graceEnd !== null && now < graceEnd;

  const openModal = () => {
    setError(null);
    setOpen(true);
    const t = Date.now();
    setNow(t);
    const graceEnded = graceEnd !== null && renderedAt < graceEnd && t >= graceEnd;
    if (status === "confirmed" && (graceEnded || tierIndex(schedule, t) !== tierIndex(schedule, renderedAt))) {
      startRefresh(() => router.refresh());
    }
  };

  const confirm = () => {
    setError(null);
    start(async () => {
      const res = await cancelBookingAction({ bookingId, reason: reason.trim() || undefined });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      toast.show(
        res.data.feeCents > 0
          ? `Storniert. Stornogebühr ${formatPriceExact(res.data.feeCents)}, Erstattung ${formatPriceExact(res.data.refundCents)}.`
          : isRequest
            ? "Ihre Anfrage wurde zurückgezogen. Es wurde nichts belastet."
            : "Ihr Termin wurde kostenlos storniert.",
      );
      router.refresh();
    });
  };

  return (
    <>
      <Button variant="secondary" onClick={openModal} block className="sm:w-auto">
        {isRequest ? "Anfrage zurückziehen" : "Termin stornieren"}
      </Button>
      {open ? (
        <Modal
          open
          onClose={() => setOpen(false)}
          title={isRequest ? "Anfrage zurückziehen?" : "Termin stornieren?"}
          actions={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {isRequest ? "Anfrage behalten" : "Termin behalten"}
              </Button>
              <Button variant="destructive" onClick={confirm} loading={pending || refreshing} className="num">
                {isRequest ? "Zurückziehen" : free ? "Kostenlos stornieren" : `Stornieren · ${formatPriceExact(preview.feeCents)} Gebühr`}
              </Button>
            </>
          }
        >
          <div aria-live="polite" className="flex flex-col gap-4">
            {isRequest ? (
              <p>{`${providerName} hat noch nicht zugesagt. Die reservierte Testzahlung wird freigegeben – es wird nichts belastet.`}</p>
            ) : inGrace && graceEnd !== null ? (
              <>
                <CheckLine>{`In den ersten ${graceMinutes} Minuten nach der Buchung immer kostenlos stornierbar – noch bis ${formatTime(new Date(graceEnd))} Uhr.`}</CheckLine>
                <p>{`Sie erhalten ${formatPriceExact(preview.refundCents)} zurück.`}</p>
              </>
            ) : free ? (
              <p>{`Die Stornierung ist jetzt noch kostenlos. Sie erhalten ${formatPriceExact(preview.refundCents)} zurück.`}</p>
            ) : (
              <p className="num">
                {`Es fällt eine Stornogebühr von ${formatPriceExact(preview.feeCents)} an (${preview.tierLabel}). Sie erhalten ${formatPriceExact(preview.refundCents)} zurück.`}
              </p>
            )}
            <Textarea label="Grund" optional rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Hilft der Fachkraft bei der Planung" />
            {error ? <Notice kind="danger">{error}</Notice> : null}
          </div>
        </Modal>
      ) : null}
    </>
  );
}
