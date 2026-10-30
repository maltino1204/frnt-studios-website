"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, RadioRow, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { formatPriceExact } from "@/lib/format";
import { resolveDisputeAction, updateDisputeStatusAction } from "@/server/actions/admin";
import type { DisputeStatus } from "@/server/dto";
import { ConfirmModal } from "./confirm";
import { centsToInput, parseEuroInput } from "./format";
import { useMutation } from "./use-mutation";

type Outcome = "refund" | "no_action" | "close";

/** Resolution form for one dispute: refund (partial/full), no action, or close; always with a note. */
export function DisputeResolution({
  disputeId,
  reference,
  status,
  refundableCents,
  bookingTotalCents,
}: {
  disputeId: string;
  reference: string;
  status: DisputeStatus;
  refundableCents: number;
  bookingTotalCents: number;
}) {
  const [outcome, setOutcome] = useState<Outcome>(refundableCents > 0 ? "refund" : "no_action");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const investigate = useMutation(updateDisputeStatusAction, { success: "Streitfall ist in Prüfung." });
  const resolve = useMutation(resolveDisputeAction, { success: "Streitfall abgeschlossen. Beide Seiten wurden benachrichtigt.", onSuccess: () => setConfirming(false) });
  const close = useMutation(updateDisputeStatusAction, { success: "Streitfall geschlossen.", onSuccess: () => setConfirming(false) });
  const cents = parseEuroInput(amount);
  const pending = resolve.pending || close.pending;
  const serverError = outcome === "close" ? close.error : resolve.error;
  const fieldErrors = { ...(outcome === "close" ? close.fieldErrors : resolve.fieldErrors), ...errors };

  const validate = () => {
    const next: Record<string, string> = {};
    if (outcome === "refund") {
      if (cents == null || cents < 1) next.refundCents = "Bitte einen Erstattungsbetrag angeben, z. B. 20,00.";
      else if (cents > refundableCents) next.refundCents = `Höchstens ${formatPriceExact(refundableCents)} erstattbar.`;
    }
    if (note.trim().length < 5) next.note = "Bitte die Entscheidung begründen (mind. 5 Zeichen).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (outcome === "close") {
      await close.run({ disputeId, status: "closed", note: note.trim() });
    } else {
      await resolve.run({ disputeId, outcome, note: note.trim(), refundCents: outcome === "refund" ? cents ?? 0 : 0 });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {status === "open" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-sunken px-4 py-3">
          <p className="type-body-s text-ink-muted">Noch nicht in Bearbeitung. Markieren, damit niemand doppelt prüft.</p>
          <Button size="s" variant="secondary" loading={investigate.pending} icon={<Icon icon={Search} size={16} />} onClick={() => investigate.run({ disputeId, status: "investigating" })}>
            In Prüfung nehmen
          </Button>
        </div>
      ) : null}
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          resolve.reset();
          close.reset();
          if (validate()) setConfirming(true);
        }}
      >
        <fieldset className="flex flex-col">
          <legend className="pb-1 type-label-s text-ink">Entscheidung</legend>
          <RadioRow
            name={`outcome-${disputeId}`}
            value="refund"
            checked={outcome === "refund"}
            onChange={() => setOutcome("refund")}
            disabled={refundableCents <= 0}
            label="Erstattung an die Kundschaft"
            description={refundableCents > 0 ? `Teil- oder Vollerstattung, höchstens ${formatPriceExact(refundableCents)}. Provision und Profi-Anteil sinken anteilig.` : "Keine eingezogene Zahlung, die erstattet werden kann."}
          />
          <RadioRow
            name={`outcome-${disputeId}`}
            value="no_action"
            checked={outcome === "no_action"}
            onChange={() => setOutcome("no_action")}
            label="Keine Maßnahme"
            description="Die Beschwerde ist nicht begründet. Die Auszahlung an den Profi wird freigegeben."
          />
          <RadioRow
            name={`outcome-${disputeId}`}
            value="close"
            checked={outcome === "close"}
            onChange={() => setOutcome("close")}
            label="Schließen ohne Entscheidung"
            description="z. B. zurückgezogen oder außerhalb von SOMA geklärt."
          />
        </fieldset>
        {outcome === "refund" ? (
          <div className="flex flex-col gap-2">
            <Input
              dense
              label="Erstattungsbetrag (€)"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={centsToInput(refundableCents)}
              error={fieldErrors.refundCents}
              hint={`Buchung ${formatPriceExact(bookingTotalCents)} · erstattbar ${formatPriceExact(refundableCents)}`}
              className="max-w-60"
            />
            <div className="flex flex-wrap gap-2">
              {[0.25, 0.5, 1].map((f) => (
                <Button key={f} size="s" variant="secondary" onClick={() => setAmount(centsToInput(Math.round(refundableCents * f)))}>
                  {f === 1 ? "Voller Betrag" : `${f * 100} %`}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        <Textarea
          label="Begründung"
          name="note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          error={fieldErrors.note}
          hint="Wird beiden Seiten mitgeteilt und im Protokoll gespeichert."
          maxLength={2000}
        />
        <div>
          <Button type="submit" size="s">
            Entscheidung prüfen
          </Button>
        </div>
      </form>
      {confirming ? (
        <ConfirmModal
          open
          onClose={() => setConfirming(false)}
          title={outcome === "refund" ? `${formatPriceExact(cents ?? 0)} erstatten?` : outcome === "no_action" ? "Ohne Maßnahme abschließen?" : "Streitfall schließen?"}
          confirmLabel={outcome === "refund" ? "Erstatten und abschließen" : outcome === "no_action" ? "Abschließen" : "Schließen"}
          pending={pending}
          error={serverError}
          onConfirm={submit}
        >
          <p>
            Streitfall zu <span className="code-ref text-ink">{reference}</span>.{" "}
            {outcome === "refund"
              ? "Der Betrag geht sofort an das Zahlungsmittel der Kundschaft; beide Seiten werden benachrichtigt."
              : outcome === "no_action"
                ? "Beide Seiten werden benachrichtigt, die Auszahlung an den Profi wird wieder freigegeben."
                : "Der Fall wird ohne Entscheidung geschlossen, die Auszahlung wird freigegeben."}
          </p>
          <p className="border-l border-line-strong pl-3 text-ink">„{note.trim()}“</p>
        </ConfirmModal>
      ) : null}
    </div>
  );
}
