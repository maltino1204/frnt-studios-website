"use client";

import { useState } from "react";
import { CircleSlash, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { formatPriceExact } from "@/lib/format";
import { adminCancelBookingAction, refundPaymentAction } from "@/server/actions/admin";
import { ConfirmButton } from "./confirm";
import { centsToInput, formatPercent, parseEuroInput } from "./format";
import { useMutation } from "./use-mutation";

export type BookingActionContext = {
  bookingId: string;
  reference: string;
  statusLabel: string;
  status: string;
  totalCents: number;
  commissionRate: number;
  commissionCents: number;
  providerPayoutCents: number;
  adminCancellable: boolean;
  refundableCents: number;
  paymentCaptured: boolean;
  inPayout: boolean;
  customerCancelNow: { feeCents: number; refundCents: number; feePercent: number; tierLabel: string } | null;
};

/** Admin cancellation with an explicit fee; explains what the booking's policy would charge. */
export function AdminCancelButton({ ctx }: { ctx: BookingActionContext }) {
  const [fee, setFee] = useState("0,00");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const m = useMutation(adminCancelBookingAction, { success: (r) => `Buchung ${ctx.reference} storniert${r.feeCents ? `, Gebühr ${formatPriceExact(r.feeCents)}` : ", volle Erstattung"}.` });
  const feeCents = parseEuroInput(fee);
  const valid = feeCents != null && feeCents >= 0 && feeCents <= ctx.totalCents;
  const formId = `cancel-${ctx.bookingId}`;
  const isAuthorizedOnly = !ctx.paymentCaptured;

  if (!ctx.adminCancellable) return null;
  return (
    <ConfirmButton
      label="Stornieren"
      icon={<Icon icon={CircleSlash} size={16} />}
      title={`Buchung ${ctx.reference} stornieren?`}
      confirmLabel="Stornieren"
      confirmVariant="destructive"
      formId={formId}
      pending={m.pending}
      error={m.error && !Object.keys(m.fieldErrors).length ? m.error : null}
      onOpen={() => {
        setFee("0,00");
        setReason("");
        setErrors({});
        m.reset();
      }}
    >
      {({ close }) => (
        <form
          id={formId}
          noValidate
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const next: Record<string, string> = {};
            if (!valid) next.feeCents = `Bitte einen Betrag zwischen 0,00 € und ${formatPriceExact(ctx.totalCents)} angeben.`;
            if (reason.trim().length < 3) next.reason = "Bitte einen Grund angeben (mind. 3 Zeichen).";
            setErrors(next);
            if (Object.keys(next).length) return;
            const res = await m.run({ bookingId: ctx.bookingId, reason: reason.trim(), feeCents: feeCents ?? 0 });
            if (res.ok) close();
          }}
        >
          <p>
            Status jetzt: {ctx.statusLabel}. Beide Seiten werden benachrichtigt. Standard bei Stornierung durch SOMA ist die volle Erstattung.
          </p>
          <div className="flex flex-col gap-1 rounded-tile bg-surface-sunken px-4 py-3 type-body-s text-ink">
            <p className="type-label-s text-ink-muted">Laut gebuchten Stornobedingungen</p>
            {ctx.customerCancelNow ? (
              <p>
                Würde die Kundschaft jetzt stornieren: <span className="font-[520]">{ctx.customerCancelNow.tierLabel}</span>
                {ctx.customerCancelNow.feeCents > 0 ? (
                  <>
                    {" "}· Gebühr <span className="num">{formatPriceExact(ctx.customerCancelNow.feeCents)}</span>
                  </>
                ) : null}
                .
              </p>
            ) : (
              <p>Für diesen Status gibt es keine Kundenstornierung; die Gebühr legt SOMA fest.</p>
            )}
            {ctx.customerCancelNow && ctx.customerCancelNow.feeCents > 0 ? (
              <button type="button" className="w-fit rounded-full type-label-s text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current focus-ring" onClick={() => setFee(centsToInput(ctx.customerCancelNow!.feeCents))}>
                Gebühr laut Bedingungen übernehmen
              </button>
            ) : null}
          </div>
          <Input
            dense
            label="Einbehaltene Gebühr (€)"
            inputMode="decimal"
            value={fee}
            onChange={(e) => {
              setFee(e.target.value);
              setErrors((x) => ({ ...x, feeCents: "" }));
            }}
            error={errors.feeCents || m.fieldErrors.feeCents}
            hint={`0,00 € = volle Erstattung · höchstens ${formatPriceExact(ctx.totalCents)}`}
          />
          {valid ? (
            <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5 rounded-tile bg-surface-raised/70 px-4 py-3 type-body-s ring-1 ring-line ring-inset">
              <dt className="text-ink-muted">Erstattung an Kundschaft</dt>
              <dd className="text-right num text-ink">{formatPriceExact(ctx.totalCents - (feeCents ?? 0))}</dd>
              <dt className="text-ink-muted">Davon an Profi (Gebührenanteil)</dt>
              <dd className="text-right num text-ink">{formatPriceExact((feeCents ?? 0) - Math.round((feeCents ?? 0) * ctx.commissionRate))}</dd>
              <dt className="text-ink-muted">Provision SOMA ({formatPercent(ctx.commissionRate)})</dt>
              <dd className="text-right num text-ink">{formatPriceExact(Math.round((feeCents ?? 0) * ctx.commissionRate))}</dd>
            </dl>
          ) : null}
          {isAuthorizedOnly ? <p className="type-caption">Die Karte ist nur reserviert: Ohne Gebühr wird die Reservierung freigegeben, mit Gebühr wird nur die Gebühr eingezogen.</p> : null}
          <Textarea label="Grund" name="reason" rows={3} value={reason} onChange={(e) => {
            setReason(e.target.value);
            setErrors((x) => ({ ...x, reason: "" }));
          }} error={errors.reason || m.fieldErrors.reason} hint="Wird im Buchungsverlauf und Protokoll gespeichert." maxLength={500} />
        </form>
      )}
    </ConfirmButton>
  );
}

/** Partial or full refund of a captured payment. */
export function RefundButton({ ctx }: { ctx: BookingActionContext }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const m = useMutation(refundPaymentAction, { success: `Erstattung für ${ctx.reference} ausgelöst.`, haptic: true });
  const cents = parseEuroInput(amount);
  const formId = `refund-${ctx.bookingId}`;
  if (ctx.refundableCents <= 0) return null;
  const base = ctx.commissionCents + ctx.providerPayoutCents;
  const somaShare = cents && base > 0 ? Math.round((cents * ctx.commissionCents) / base) : 0;

  return (
    <ConfirmButton
      label="Erstatten"
      icon={<Icon icon={Undo2} size={16} />}
      title={`Erstattung für ${ctx.reference}`}
      confirmLabel="Erstattung auslösen"
      formId={formId}
      pending={m.pending}
      error={m.error && !Object.keys(m.fieldErrors).length ? m.error : null}
      onOpen={() => {
        setAmount("");
        setReason("");
        setErrors({});
        m.reset();
      }}
    >
      {({ close }) => (
        <form
          id={formId}
          noValidate
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const next: Record<string, string> = {};
            if (cents == null || cents < 1) next.amountCents = "Bitte einen Betrag größer als 0 angeben, z. B. 15,00.";
            else if (cents > ctx.refundableCents) next.amountCents = `Es können höchstens ${formatPriceExact(ctx.refundableCents)} erstattet werden.`;
            if (reason.trim().length < 3) next.reason = "Bitte einen Grund angeben (mind. 3 Zeichen).";
            setErrors(next);
            if (Object.keys(next).length) return;
            const res = await m.run({ bookingId: ctx.bookingId, amountCents: cents!, reason: reason.trim() });
            if (res.ok) close();
          }}
        >
          <p>Der Betrag geht an das Zahlungsmittel der Kundschaft. Provision und Profi-Anteil verringern sich anteilig.</p>
          <div className="flex items-end gap-2">
            <Input
              dense
              label="Betrag (€)"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors((x) => ({ ...x, amountCents: "" }));
              }}
              placeholder={centsToInput(ctx.refundableCents)}
              error={errors.amountCents || m.fieldErrors.amountCents}
              hint={`Erstattbar: ${formatPriceExact(ctx.refundableCents)}`}
              className="flex-1"
            />
          </div>
          <Button size="s" variant="ghost" className="-mt-2 w-fit" onClick={() => setAmount(centsToInput(ctx.refundableCents))}>
            Gesamten Restbetrag eintragen
          </Button>
          {cents && cents > 0 && cents <= ctx.refundableCents ? (
            <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5 rounded-tile bg-surface-raised/70 px-4 py-3 type-body-s ring-1 ring-line ring-inset">
              <dt className="text-ink-muted">Trägt SOMA (Provision)</dt>
              <dd className="text-right num text-ink">{formatPriceExact(somaShare)}</dd>
              <dt className="text-ink-muted">Trägt Profi</dt>
              <dd className="text-right num text-ink">{formatPriceExact(cents - somaShare)}</dd>
              <dt className="text-ink-muted">Danach noch erstattbar</dt>
              <dd className="text-right num text-ink">{formatPriceExact(ctx.refundableCents - cents)}</dd>
            </dl>
          ) : null}
          {ctx.inPayout ? (
            <Notice kind="warning">Diese Buchung ist bereits in einem Auszahlungslauf. Der Profi-Anteil der Erstattung muss mit der nächsten Auszahlung verrechnet werden.</Notice>
          ) : null}
          <Textarea label="Grund" name="reason" rows={3} value={reason} onChange={(e) => {
            setReason(e.target.value);
            setErrors((x) => ({ ...x, reason: "" }));
          }} error={errors.reason || m.fieldErrors.reason} placeholder="z. B. Behandlung 15 Minuten kürzer als gebucht" maxLength={500} />
        </form>
      )}
    </ConfirmButton>
  );
}
