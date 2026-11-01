"use client";

import { useEffect, useId, useRef, useState, useTransition, type ClipboardEvent, type KeyboardEvent, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { CalendarX2, Check, KeyRound, ShieldAlert, TrendingDown, Undo2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Modal } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/feedback";
import { Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { SuccessCheck } from "@/components/ui/success";
import { useToast } from "@/components/ui/toast";
import { haptic } from "@/lib/haptic";
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

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** A short spring (≈ ease-spring) for WAAPI; CSS does the rest. */
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

function animate(el: Element | null | undefined, frames: Keyframe[], opts: KeyframeAnimationOptions) {
  if (!el || reduced() || typeof (el as HTMLElement).animate !== "function") return;
  (el as HTMLElement).animate(frames, opts);
}

/** Confirmation moment over the surrounding card: the ring pops, the check draws in. */
function SuccessOverlay({ title, body }: { title: string; body?: string }) {
  return (
    <div role="status" className="absolute inset-0 z-10 flex animate-fade-in flex-col items-center justify-center gap-3 bg-surface-raised/92 px-6 text-center backdrop-blur-sm">
      <SuccessCheck size={56} />
      <p className="type-heading-m">{title}</p>
      {body ? <p className="max-w-[18rem] type-body-s text-ink-muted">{body}</p> : null}
    </div>
  );
}

/** Annehmen / Ablehnen for open requests. Large buttons, decline needs a reason (sheet), accept ends in a SuccessCheck. */
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
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!accepted) return;
    const t = window.setTimeout(() => router.refresh(), 1300);
    return () => window.clearTimeout(t);
  }, [accepted, router]);

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
      if (decision === "accept") {
        haptic("success");
        setAccepted(true);
        toast.show("Termin bestätigt. Die Kundschaft wird benachrichtigt.");
        return;
      }
      setDeclineOpen(false);
      toast.show("Anfrage abgelehnt. Die Kundschaft wird nicht belastet.");
      router.refresh();
    });
  };

  if (!canRespond) {
    return <p className="type-body-s text-ink-muted">Diese Anfrage kann nicht mehr beantwortet werden.</p>;
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {accepted ? <SuccessOverlay title="Angenommen." body="Die Kundschaft wird benachrichtigt. Du findest den Termin in deinem Kalender." /> : null}
      {withNote ? (
        <Textarea
          id={noteId}
          label="Nachricht zur Zusage"
          optional
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z. B. Ich bringe die Liege mit und klingle kurz vorher."
        />
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button size="l" block loading={pending && mode === "accept"} disabled={pending || accepted} onClick={() => respond("accept")} icon={<Icon icon={Check} />} className="px-4!">
          Annehmen
        </Button>
        <Button
          size="l"
          variant="secondary"
          block
          disabled={pending || accepted}
          onClick={() => {
            setReasonError(null);
            setDeclineOpen(true);
          }}
          icon={<Icon icon={X} />}
          className="px-4!"
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
          <div className="flex flex-col gap-2" role="group" aria-label="Häufige Gründe">
            {DECLINE_REASONS.map((r) => (
              <Chip key={r} selected={reason === r} onClick={() => setReason(r)} className="h-auto! min-h-11 justify-start! rounded-tile! px-4! py-2.5 text-left whitespace-normal!">
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
            placeholder="z. B. Ich bin an diesem Tag auf einer Fortbildung."
          />
        </div>
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Start-Code (OTP)                                                          */
/* ------------------------------------------------------------------------ */

const CODE_LENGTH = 4;

/**
 * Four digit boxes: typing advances, Backspace steps back, paste and
 * one-time-code autofill spread across the boxes. Each digit lands with a
 * small spring; a wrong code shakes the row once.
 */
function CodeInput({
  digits,
  setDigits,
  disabled,
  state,
  describedBy,
  onEnter,
  inputs,
}: {
  digits: string[];
  setDigits: (d: string[]) => void;
  disabled: boolean;
  state: "idle" | "error" | "success";
  describedBy?: string;
  onEnter: () => void;
  inputs: RefObject<Array<HTMLInputElement | null>>;
}) {
  const focus = (i: number) => {
    const el = inputs.current?.[Math.max(0, Math.min(CODE_LENGTH - 1, i))];
    el?.focus();
    el?.select();
  };
  const spring = (i: number) => animate(inputs.current?.[i], [{ transform: "scale(0.88)" }, { transform: "scale(1)" }], { duration: 380, easing: SPRING });

  const fill = (from: number, value: string) => {
    const chars = value.replace(/\D/g, "").slice(0, CODE_LENGTH - from).split("");
    if (!chars.length) return;
    const next = [...digits];
    chars.forEach((c, k) => {
      next[from + k] = c;
      window.setTimeout(() => spring(from + k), k * 50);
    });
    setDigits(next);
    focus(Math.min(CODE_LENGTH - 1, from + chars.length));
  };

  const onChange = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "");
    if (v.length >= 3) return fill(i, v); // autofill / IME into one box
    const c = v.slice(-1);
    const next = [...digits];
    next[i] = c;
    setDigits(next);
    if (c) {
      spring(i);
      if (i < CODE_LENGTH - 1) focus(i + 1);
    }
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
      focus(i - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    }
  };

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!/\d/.test(text)) return;
    e.preventDefault();
    fill(i, text);
  };

  return (
    <div className="flex justify-center gap-2.5 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            if (inputs.current) inputs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Ziffer ${i + 1} von ${CODE_LENGTH}`}
          aria-invalid={state === "error" ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          value={d}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => onPaste(i, e)}
          className={cn(
            "h-16 w-14 rounded-tile border bg-surface-raised text-center text-[28px] leading-none font-[620] tracking-[-0.02em] text-ink num inset-shadow-field outline-none",
            "transition-[border-color,background-color,box-shadow,color] duration-fast ease-standard caret-ink sm:h-[4.5rem] sm:w-16",
            "focus:border-focus focus:shadow-[0_0_0_3px_var(--color-focus-glow)] disabled:opacity-60",
            state === "success"
              ? "border-success bg-success-soft text-success"
              : state === "error"
                ? "border-danger bg-danger-soft/50"
                : d
                  ? "border-ink"
                  : "border-line-strong",
          )}
        />
      ))}
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
  const errorId = useId();
  const [open, setOpen] = useState(false);
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [verified, setVerified] = useState(false);
  const [pending, start] = useTransition();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const row = useRef<HTMLDivElement>(null);
  const canStart = booking.canStart ?? booking.actions.canStart;
  const earliest = booking.startAvailableAt ? new Date(booking.startAvailableAt) : new Date(Date.parse(booking.startsAt) - 30 * 60_000);
  const earliestMs = earliest.getTime();
  const code = digits.join("");

  // Refresh once the start window opens, so the button appears without a manual reload.
  useEffect(() => {
    if (canStart) return;
    const wait = earliestMs - Date.now();
    if (wait <= 0 || wait > 12 * 3_600_000) return;
    const t = window.setTimeout(() => router.refresh(), wait + 1_000);
    return () => window.clearTimeout(t);
  }, [canStart, earliestMs, router]);

  // After the success moment: close, confirm, refresh.
  useEffect(() => {
    if (!verified) return;
    const t = window.setTimeout(() => {
      setOpen(false);
      toast.show("Termin gestartet. Viel Freude bei der Behandlung.");
      router.refresh();
    }, 1200);
    return () => window.clearTimeout(t);
  }, [verified, toast, router]);

  const openSheet = () => {
    setError(null);
    setVerified(false);
    setDigits(Array(CODE_LENGTH).fill(""));
    setOpen(true);
    window.setTimeout(() => inputs.current[0]?.focus(), 320);
  };

  const submit = () => {
    if (pending || verified || locked) return;
    setError(null);
    if (!/^\d{4}$/.test(code)) {
      setError("Der Start-Code hat vier Ziffern.");
      inputs.current[digits.findIndex((d) => !d)]?.focus();
      return;
    }
    start(async () => {
      const res = await startBookingAction({ bookingId: booking.id, code });
      if (!res.ok) {
        const m = res.error.match(/Noch (\d+) Versuch/);
        if (m) {
          setAttemptsLeft(Number(m[1]));
          setError("Der Start-Code ist falsch. Bitte frag noch einmal nach.");
        } else {
          setError(res.fieldErrors?.code && res.error === "Bitte prüf deine Eingaben." ? res.fieldErrors.code : proError(res.error));
        }
        if (/zu oft|Support/.test(res.error)) {
          setLocked(true);
          setAttemptsLeft(0);
        }
        animate(row.current, [0, -8, 7, -5, 3, 0].map((x) => ({ transform: `translateX(${x}px)` })), { duration: 420, easing: "ease-out" });
        haptic("warning");
        setDigits(Array(CODE_LENGTH).fill(""));
        window.setTimeout(() => inputs.current[0]?.focus(), 60);
        return;
      }
      setVerified(true);
      haptic("success");
      inputs.current.forEach((el, i) => window.setTimeout(() => animate(el, [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 420, easing: SPRING }), i * 60));
    });
  };

  if (!canStart) {
    return (
      <div className="flex items-start gap-3 rounded-tile bg-surface-sunken px-4 py-3.5 inset-shadow-sunken">
        <Icon icon={KeyRound} size={18} className="mt-0.5 shrink-0 text-ink-muted" />
        <div className="flex flex-col gap-0.5">
          <p className="type-label text-ink" suppressHydrationWarning>
            {`Start ab ${berlinDateKey(earliest) === berlinDateKey() ? "" : `${formatDayShort(earliest)}, `}${formatTime(earliest)} Uhr möglich`}
          </p>
          <p className="type-caption text-ink-muted">„Termin starten“ erscheint hier 30 Minuten vor Beginn.</p>
        </div>
      </div>
    );
  }

  const state = verified ? "success" : error ? "error" : "idle";

  return (
    <>
      <Button size="l" block onClick={openSheet} icon={<Icon icon={KeyRound} />}>
        Termin starten
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Start-Code eingeben"
        footer={
          <Button size="l" block loading={pending} disabled={locked || verified} onClick={submit}>
            Termin starten
          </Button>
        }
      >
        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p className="type-body-s text-ink-muted">
            Bitte {booking.customer.firstName ?? "die Kundschaft"} um den vierstelligen Start-Code aus der Buchungsbestätigung. So ist belegt, dass du vor Ort bist.
          </p>
          <fieldset className="flex flex-col items-center gap-4 rounded-card bg-surface-sunken/70 px-3 py-6 inset-shadow-sunken">
            <legend className="sr-only">Start-Code</legend>
            <div ref={row}>
              <CodeInput digits={digits} setDigits={(d) => { setDigits(d); if (error && !locked) setError(null); }} disabled={locked || verified || pending} state={state} describedBy={error ? errorId : undefined} onEnter={submit} inputs={inputs} />
            </div>
            <div id={errorId} aria-live="polite" className="flex min-h-12 flex-col items-center justify-center gap-1.5 text-center">
              {verified ? (
                <p className="flex animate-fade-in items-center gap-2.5 type-label text-success">
                  <SuccessCheck size={28} glow={false} />
                  Code bestätigt. Der Termin läuft.
                </p>
              ) : error ? (
                <>
                  <p className="animate-fade-in type-body-s font-[520] text-danger">{error}</p>
                  {attemptsLeft != null ? (
                    <Badge tone={attemptsLeft <= 1 ? "danger" : "warning"} size="s" dot>
                      {locked ? "Start gesperrt" : `Noch ${attemptsLeft} ${attemptsLeft === 1 ? "Versuch" : "Versuche"}`}
                    </Badge>
                  ) : null}
                </>
              ) : (
                <p className="type-caption text-ink-muted">Die Ziffern stehen in der Buchungsbestätigung der Kundschaft.</p>
              )}
            </div>
          </fieldset>
          <p className="flex items-start gap-2 type-caption text-ink-muted">
            <Icon icon={ShieldAlert} size={16} className="mt-px shrink-0" />
            Nach fünf falschen Eingaben wird der Start gesperrt. Dann hilft dir der SOMA-Support.
          </p>
        </form>
      </Sheet>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Complete, no-show, cancel                                                 */
/* ------------------------------------------------------------------------ */

export function CompleteBookingButton({ bookingId, payoutCents, canComplete = true, startsAt }: { bookingId: string; payoutCents: number; canComplete?: boolean; startsAt?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
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

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => {
      setOpen(false);
      toast.show("Termin abgeschlossen. Danke für deine Arbeit.");
      router.refresh();
    }, 1300);
    return () => window.clearTimeout(t);
  }, [done, toast, router]);

  const run = () =>
    start(async () => {
      setError(null);
      const res = await completeBookingAction(bookingId);
      if (!res.ok) return setError(proError(res.error));
      haptic("success");
      setDone(true);
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
        onClose={() => (done ? undefined : setOpen(false))}
        title={done ? "Abgeschlossen." : "Termin abschließen?"}
        actions={
          done ? null : (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
                Zurück
              </Button>
              <Button loading={pending} onClick={run} icon={<Icon icon={Check} />}>
                Abschließen
              </Button>
            </>
          )
        }
      >
        {done ? (
          <div className="flex animate-fade-in items-center gap-4 pt-2">
            <SuccessCheck size={52} />
            <p>
              Deine Auszahlung von <span className="font-semibold text-ink num">{formatPrice(payoutCents)}</span> ist in 48 Stunden verfügbar.
            </p>
          </div>
        ) : (
          <>
            <p>Die Zahlung wird jetzt eingezogen.</p>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-tile bg-surface-raised/80 px-4 py-3 shadow-raised">
              <span className="type-body-s text-ink-muted">Deine Auszahlung</span>
              <span className="type-heading-m text-ink num">{formatPrice(payoutCents)}</span>
            </div>
            <p className="mt-3 type-caption">Verfügbar 48 Stunden nach dem Termin, sofern kein Einspruch eingeht.</p>
            {error ? <Notice kind="danger" className="mt-4">{error}</Notice> : null}
          </>
        )}
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
      haptic("warning");
      toast.show(`Als nicht angetroffen gemeldet. Ausfallgebühr: ${formatPrice(res.data.feeCents)}.`);
      router.refresh();
    });
  return (
    <>
      <Button size="l" variant="secondary" block onClick={() => setOpen(true)} icon={<Icon icon={CalendarX2} />}>
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
          Melde das bitte nur, wenn du {firstName ?? "die Kundschaft"} trotz zwei Kontaktversuchen nicht erreicht hast. Es wird die volle Ausfallgebühr berechnet. Die Kundschaft kann innerhalb von 48 Stunden widersprechen – bis dahin hält SOMA deine Auszahlung zurück.
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
  const [within24h, setWithin24h] = useState(false);
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
      haptic("warning");
      toast.show(res.message ?? "Termin storniert.");
      router.refresh();
    });
  const consequences = [
    { icon: Undo2, text: "Die Kundschaft erhält den vollen Betrag zurück. Du erhältst für diesen Termin nichts." },
    ...(within24h ? [{ icon: CalendarX2, text: "Der Termin ist in weniger als 24 Stunden. Kurzfristige Absagen treffen die Kundschaft besonders – bitte nur, wenn es nicht anders geht." }] : []),
    { icon: TrendingDown, text: "Stornierungen senken deine Zuverlässigkeit im Ranking. Ab der dritten Stornierung in 90 Tagen prüfen wir dein Profil." },
  ];
  return (
    <>
      <Button
        variant="ghost"
        block
        onClick={() => {
          setWithin24h(Date.parse(startsAt) - Date.now() < 24 * 3_600_000);
          setOpen(true);
        }}
        className="text-danger! hover:bg-danger-soft!"
      >
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
        <ul className="flex flex-col gap-3">
          {consequences.map((c) => (
            <li key={c.text} className="flex items-start gap-3">
              <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                <c.icon size={15} strokeWidth={1.7} absoluteStrokeWidth />
              </span>
              <span className="pt-0.5">{c.text}</span>
            </li>
          ))}
        </ul>
        <Textarea
          label="Grund für die Stornierung"
          className="mt-5 text-ink"
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={fieldError}
          placeholder="z. B. Ich bin leider krank."
        />
        {error ? <Notice kind="danger" className="mt-4">{error}</Notice> : null}
      </Modal>
    </>
  );
}
