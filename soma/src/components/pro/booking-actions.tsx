"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Modal } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { berlinDateKey, formatDayShort, formatPrice, formatTime } from "@/lib/format";
import {
  cancelBookingAsProviderAction,
  completeBookingAction,
  markNoShowAction,
  respondToRequestAction,
  startBookingAction,
} from "@/server/actions/pro";
import type { ProviderBookingDTO } from "@/server/dto";
import { proError } from "./labels";

const DECLINE_REASONS = [
  "Zu diesem Zeitpunkt bin ich leider nicht verfügbar.",
  "Die Anfahrt ist mir zu diesem Termin zu weit.",
  "Diese Leistung kann ich so nicht anbieten.",
];

/** Annehmen / Ablehnen for open requests. Large buttons, decline needs a reason (sheet). */
export function RequestActions({
  bookingId,
  canRespond,
  withNote = false,
  className,
}: {
  bookingId: string;
  canRespond: boolean;
  withNote?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const noteId = useId();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"accept" | "decline" | null>(null);
  const [note, setNote] = useState("");
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const respond = (decision: "accept" | "decline") => {
    setMode(decision);
    setError(null);
    setReasonError(null);
    start(async () => {
      const res = await respondToRequestAction({
        bookingId,
        decision,
        note: decision === "decline" ? reason.trim() : note.trim() || undefined,
      });
      if (!res.ok) {
        if (decision === "decline") setReasonError(res.fieldErrors?.note ?? proError(res.error));
        else setError(proError(res.error));
        return;
      }
      setDeclineOpen(false);
      toast.show(decision === "accept" ? "Termin bestätigt. Die Kundschaft wird benachrichtigt." : "Anfrage abgelehnt. Die Kundschaft wird nicht belastet.");
      router.refresh();
    });
  };

  if (!canRespond) {
    return <p className="type-body-s text-ink-muted">Diese Anfrage kann nicht mehr beantwortet werden.</p>;
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {withNote ? (
        <Textarea
          id={noteId}
          label="Nachricht zur Zusage"
          optional
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z. B. Ich bringe die Liege mit und klingle kurz vorher."
        />
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button size="l" block loading={pending && mode === "accept"} disabled={pending} onClick={() => respond("accept")} icon={<Icon icon={Check} />}>
          Annehmen
        </Button>
        <Button
          size="l"
          variant="secondary"
          block
          disabled={pending}
          onClick={() => {
            setReasonError(null);
            setDeclineOpen(true);
          }}
          icon={<Icon icon={X} />}
        >
          Ablehnen
        </Button>
      </div>
      <div aria-live="polite">{error ? <Notice kind="danger">{error}</Notice> : null}</div>

      <Sheet
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Anfrage ablehnen"
        footer={
          <div className="flex flex-col gap-2 md:flex-row-reverse">
            <Button size="l" block loading={pending && mode === "decline"} onClick={() => respond("decline")}>
              Anfrage ablehnen
            </Button>
            <Button size="l" variant="ghost" block onClick={() => setDeclineOpen(false)} disabled={pending}>
              Abbrechen
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <p className="type-body-s text-ink-muted">
            Die Kundschaft wird nicht belastet und bekommt passende Alternativen angezeigt. Bitte nenne kurz einen Grund – die Kundschaft sieht ihn.
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Häufige Gründe">
            {DECLINE_REASONS.map((r) => (
              <Chip key={r} selected={reason === r} onClick={() => setReason(r)} className="h-auto! min-h-9 py-2 text-left whitespace-normal!">
                {r}
              </Chip>
            ))}
          </div>
          <Textarea
            label="Grund"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={reasonError}
            placeholder="z. B. Ich bin an diesem Tag auf einer Fortbildung."
          />
        </div>
      </Sheet>
    </div>
  );
}

/**
 * "Termin starten": requires the customer's 4-digit Start-Code. The button exists only
 * from startsAt − 30 min (server flag `canStart`); before that a calm note says when.
 */
export function StartBookingButton({
  booking,
}: {
  booking: Pick<ProviderBookingDTO, "id" | "startsAt" | "actions" | "customer"> & Partial<Pick<ProviderBookingDTO, "canStart" | "startAvailableAt">>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [pending, start] = useTransition();
  const canStart = booking.canStart ?? booking.actions.canStart;
  const earliest = booking.startAvailableAt ? new Date(booking.startAvailableAt) : new Date(Date.parse(booking.startsAt) - 30 * 60_000);
  const earliestMs = earliest.getTime();

  // Refresh once the start window opens, so the button appears without a manual reload.
  useEffect(() => {
    if (canStart) return;
    const wait = earliestMs - Date.now();
    if (wait <= 0 || wait > 12 * 3_600_000) return;
    const t = window.setTimeout(() => router.refresh(), wait + 1_000);
    return () => window.clearTimeout(t);
  }, [canStart, earliestMs, router]);

  const submit = () => {
    setError(null);
    if (!/^\d{4}$/.test(code)) {
      setError("Der Start-Code hat vier Ziffern.");
      return;
    }
    start(async () => {
      const res = await startBookingAction({ bookingId: booking.id, code });
      if (!res.ok) {
        setError(res.fieldErrors?.code && res.error === "Bitte überprüfen Sie Ihre Eingaben." ? res.fieldErrors.code : proError(res.error));
        if (/zu oft|Support/.test(res.error)) setLocked(true);
        setCode("");
        return;
      }
      setOpen(false);
      toast.show("Termin gestartet. Viel Freude bei der Behandlung.");
      router.refresh();
    });
  };

  if (!canStart) {
    return (
      <div className="flex flex-col gap-1 border-y border-line py-3">
        <p className="flex items-center gap-2 type-label text-ink" suppressHydrationWarning>
          <Icon icon={KeyRound} size={16} className="shrink-0 text-ink-muted" />
          {`Start ab ${berlinDateKey(earliest) === berlinDateKey() ? "" : `${formatDayShort(earliest)}, `}${formatTime(earliest)} Uhr möglich`}
        </p>
        <p className="type-caption text-ink-muted">„Termin starten“ erscheint hier 30 Minuten vor Beginn.</p>
      </div>
    );
  }

  return (
    <>
      <Button size="l" block onClick={() => setOpen(true)} icon={<Icon icon={KeyRound} />}>
        Termin starten
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Start-Code eingeben"
        footer={
          <Button size="l" block loading={pending} disabled={locked} onClick={submit}>
            Termin starten
          </Button>
        }
      >
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p className="type-body-s text-ink-muted">
            Bitte {booking.customer.firstName ?? "die Kundschaft"} um den vierstelligen Start-Code aus der Buchungsbestätigung. So ist belegt, dass du vor Ort bist.
          </p>
          <Input
            label="Start-Code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{4}"
            maxLength={4}
            autoFocus
            value={code}
            disabled={locked}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            error={error}
            className="[&_input]:h-16 [&_input]:text-center [&_input]:font-display [&_input]:text-[32px] [&_input]:tracking-[0.5em] [&_input]:num"
            placeholder="····"
          />
          <p className="type-caption text-ink-muted">Nach fünf falschen Eingaben wird der Start gesperrt. Dann hilft dir der SOMA-Support.</p>
        </form>
      </Sheet>
    </>
  );
}

export function CompleteBookingButton({ bookingId, payoutCents, canComplete = true, startsAt }: { bookingId: string; payoutCents: number; canComplete?: boolean; startsAt?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const startsAtMs = startsAt ? Date.parse(startsAt) : NaN;

  // Refresh once the scheduled start has passed, so "Termin abschließen" unlocks without a manual reload.
  useEffect(() => {
    if (canComplete || Number.isNaN(startsAtMs)) return;
    const wait = startsAtMs - Date.now();
    if (wait <= 0 || wait > 12 * 3_600_000) return;
    const t = window.setTimeout(() => router.refresh(), wait + 1_000);
    return () => window.clearTimeout(t);
  }, [canComplete, startsAtMs, router]);

  const run = () =>
    start(async () => {
      setError(null);
      const res = await completeBookingAction(bookingId);
      if (!res.ok) return setError(proError(res.error));
      setOpen(false);
      toast.show("Termin abgeschlossen. Danke für deine Arbeit.");
      router.refresh();
    });
  if (!canComplete) {
    return (
      <div className="flex flex-col gap-2">
        <Button size="l" block disabled icon={<Icon icon={Check} />}>
          Termin abschließen
        </Button>
        {startsAt ? <p className="type-caption text-ink-muted">Abschließen ab {formatTime(startsAt)} Uhr (geplanter Beginn).</p> : null}
      </div>
    );
  }
  return (
    <>
      <Button size="l" block onClick={() => setOpen(true)} icon={<Icon icon={Check} />}>
        Termin abschließen
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Termin abschließen?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Zurück
            </Button>
            <Button loading={pending} onClick={run}>
              Abschließen
            </Button>
          </>
        }
      >
        <p>
          Die Zahlung wird jetzt eingezogen. Deine Auszahlung von <span className="font-semibold text-ink num">{formatPrice(payoutCents)}</span> ist 48 Stunden nach dem Termin verfügbar, sofern kein Einspruch eingeht.
        </p>
        {error ? <Notice kind="danger" className="mt-4">{error}</Notice> : null}
      </Modal>
    </>
  );
}

export function NoShowButton({ bookingId, firstName }: { bookingId: string; firstName: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      setError(null);
      const res = await markNoShowAction(bookingId);
      if (!res.ok) return setError(proError(res.error));
      setOpen(false);
      toast.show(`Als nicht angetroffen gemeldet. Ausfallgebühr: ${formatPrice(res.data.feeCents)}.`);
      router.refresh();
    });
  return (
    <>
      <Button size="l" variant="secondary" block onClick={() => setOpen(true)}>
        Nicht angetroffen
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Kundschaft nicht angetroffen?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Zurück
            </Button>
            <Button variant="destructive" loading={pending} onClick={run}>
              Nicht angetroffen melden
            </Button>
          </>
        }
      >
        <p>
          Melde das bitte nur, wenn du {firstName ?? "die Kundschaft"} trotz zwei Kontaktversuchen nicht erreicht hast. Es wird die volle Ausfallgebühr berechnet. Die Kundschaft kann innerhalb von 48 Stunden widersprechen – bis dahin hält SOMA deine Auszahlung zurück.
        </p>
        {error ? <Notice kind="danger" className="mt-4">{error}</Notice> : null}
      </Modal>
    </>
  );
}

export function CancelBookingButton({ bookingId, startsAt }: { bookingId: string; startsAt: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const within24h = Date.parse(startsAt) - Date.now() < 24 * 3_600_000;
  const run = () =>
    start(async () => {
      setError(null);
      setFieldError(null);
      const res = await cancelBookingAsProviderAction({ bookingId, reason: reason.trim() });
      if (!res.ok) {
        if (res.fieldErrors?.reason) setFieldError(res.fieldErrors.reason);
        else setError(proError(res.error));
        return;
      }
      setOpen(false);
      toast.show(res.message ?? "Termin storniert.");
      router.refresh();
    });
  return (
    <>
      <Button variant="ghost" block onClick={() => setOpen(true)} className="text-danger! hover:bg-danger-soft!">
        Termin stornieren
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Termin stornieren?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Termin behalten
            </Button>
            <Button variant="destructive" loading={pending} onClick={run}>
              Stornieren
            </Button>
          </>
        }
      >
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>Die Kundschaft erhält den vollen Betrag zurück. Du erhältst für diesen Termin nichts.</li>
          {within24h ? <li>Der Termin ist in weniger als 24 Stunden. Kurzfristige Absagen treffen die Kundschaft besonders – bitte nur, wenn es nicht anders geht.</li> : null}
          <li>Stornierungen senken deine Zuverlässigkeit im Ranking. Ab der dritten Stornierung in 90 Tagen prüfen wir dein Profil.</li>
        </ul>
        <Textarea
          label="Grund für die Stornierung"
          className="mt-5 text-ink"
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={fieldError}
          placeholder="z. B. Ich bin leider krank."
        />
        {error ? <Notice kind="danger" className="mt-4">{error}</Notice> : null}
      </Modal>
    </>
  );
}
