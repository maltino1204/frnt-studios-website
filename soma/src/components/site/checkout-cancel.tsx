"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { CheckLine } from "@/components/ui/summary";
import { cn } from "@/lib/cn";
import { formatPriceExact, formatTime } from "@/lib/format";
import { haptic } from "@/lib/haptic";
import { cancelBookingAction } from "@/server/actions/booking";
import type { BookingStatus, PolicyScheduleEntryDTO } from "@/server/dto";

/** One amount of the fee preview; cross-fades when the server preview changes. */
function Amount({ label, cents, tone }: { label: string; cents: number; tone?: "success" | "danger" }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-tile bg-surface-raised/80 p-3.5 shadow-raised">
      <p className="type-caption text-ink-muted">{label}</p>
      <p key={cents} className={cn("animate-fade-in type-heading-l num", tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-ink")}>
        {formatPriceExact(cents)}
      </p>
    </div>
  );
}

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
  tierFreeUntil = null,
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
  /** end of the regular free tier (24 h before), without the Bedenkzeit */
  tierFreeUntil?: string | null;
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
  // N10: the Bedenkzeit line only matters while the tier alone would already charge a fee.
  const tierFreeEnd = tierFreeUntil ? Date.parse(tierFreeUntil) : null;
  const tierWouldCharge = tierFreeEnd === null || now >= tierFreeEnd;
  const inGrace = status === "confirmed" && graceEnd !== null && now < graceEnd && tierWouldCharge;

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

  // Live preview: while the dialog is open, re-check every 15 s whether a tier boundary
  // (or the end of the Bedenkzeit) has passed; the server then recomputes the fee.
  useEffect(() => {
    if (!open || status !== "confirmed") return;
    let seen = Date.now();
    const t = window.setInterval(() => {
      const n = Date.now();
      setNow(n);
      const graceEnded = graceEnd !== null && seen < graceEnd && n >= graceEnd;
      if (graceEnded || tierIndex(schedule, n) !== tierIndex(schedule, seen)) startRefresh(() => router.refresh());
      seen = n;
    }, 15_000);
    return () => window.clearInterval(t);
  }, [open, status, graceEnd, schedule, router]);

  // Destructive dialog: start on the safe choice, not on the reason field (no keyboard pop-up on phones).
  const keepRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => keepRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const confirm = () => {
    setError(null);
    start(async () => {
      const res = await cancelBookingAction({ bookingId, reason: reason.trim() || undefined });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      haptic("warning");
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
      <Button variant="secondary" onClick={openModal} block>
        {isRequest ? "Anfrage zurückziehen" : "Termin stornieren"}
      </Button>
      {open ? (
        <Modal
          open
          onClose={() => setOpen(false)}
          title={isRequest ? "Anfrage zurückziehen?" : "Termin stornieren?"}
          actions={
            <>
              <Button ref={keepRef} variant="ghost" onClick={() => setOpen(false)}>
                {isRequest ? "Anfrage behalten" : "Termin behalten"}
              </Button>
              <Button variant="destructive" onClick={confirm} loading={pending || refreshing} className="num">
                {isRequest ? "Zurückziehen" : free ? "Kostenlos stornieren" : `Stornieren · ${formatPriceExact(preview.feeCents)} Gebühr`}
              </Button>
            </>
          }
        >
          <div aria-live="polite" className="flex flex-col gap-4">
            {isRequest ? null : (
              <div aria-busy={refreshing || undefined} className={cn("grid grid-cols-2 gap-2 transition-[opacity,filter] duration-base", refreshing && "opacity-50 blur-[1px]")}>
                <Amount label="Stornogebühr" cents={preview.feeCents} tone={preview.feeCents > 0 ? "danger" : undefined} />
                <Amount label="Erstattung" cents={preview.refundCents} tone="success" />
              </div>
            )}
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
