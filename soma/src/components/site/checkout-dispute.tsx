"use client";

import { LifeBuoy, ShieldCheck } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SuccessCheck } from "@/components/ui/success";
import { Select, Textarea } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { keepValuesOnSubmit } from "./keep-values";
import { Sheet } from "@/components/ui/sheet";
import { openDisputeAction } from "@/server/actions/booking";
import { initialActionState } from "@/server/actions/types";

const REASONS: Array<[string, string]> = [
  ["quality", "Die Behandlung entsprach nicht der Buchung"],
  ["provider_no_show", "Die Fachkraft ist nicht erschienen"],
  ["damage", "Es ist ein Schaden entstanden"],
  ["payment", "Problem mit der Zahlung"],
  ["safety", "Ich habe mich nicht sicher gefühlt"],
  ["other", "Etwas anderes"],
];

/** "Problem melden" (dispute) within the dispute window. Holds the provider payout. */
export function ReportProblem({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(openDisputeAction, initialActionState);
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} icon={<Icon icon={LifeBuoy} />} className="-ml-4">
        Problem melden
      </Button>
      {open ? (
        <Sheet open onClose={() => setOpen(false)} title="Problem melden">
          {state?.ok ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <SuccessCheck size={44} glow={false} />
                <div className="min-w-0 flex-1">
                  <FormMessage state={state} />
                </div>
              </div>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Schließen
              </Button>
            </div>
          ) : (
            <form action={action} onSubmit={keepValuesOnSubmit(action)} className="flex flex-col gap-5" noValidate>
              <input type="hidden" name="bookingId" value={bookingId} />
              <div className="flex gap-3 rounded-tile bg-surface-sunken p-3.5">
                <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-success shadow-raised">
                  <Icon icon={ShieldCheck} size={18} />
                </span>
                <p className="type-body-s text-ink-muted">
                  Wir melden uns innerhalb von 72 Stunden. Bis zur Klärung zahlen wir den Betrag nicht an die Fachkraft aus.
                </p>
              </div>
              <Select label="Worum geht es?" name="reason" defaultValue="quality" error={state && !state.ok ? state.fieldErrors?.reason : null}>
                {REASONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
              <Textarea
                label="Was ist passiert?"
                name="description"
                rows={5}
                minLength={10}
                maxLength={4000}
                required
                hint="Mindestens 10 Zeichen."
                error={state && !state.ok ? (state.fieldErrors?.description ?? null) : null}
              />
              {state && !state.ok && !state.fieldErrors ? <FormMessage state={state} /> : null}
              <SubmitButton size="l" block loading={pending}>
                Problem senden
              </SubmitButton>
            </form>
          )}
        </Sheet>
      ) : null}
    </>
  );
}
