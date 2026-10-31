"use client";

import { Banknote, Check } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { formatPriceExact } from "@/lib/format";
import { createPayoutBatchAction, markPayoutPaidAction } from "@/server/actions/admin";
import { ConfirmButton } from "./confirm";
import { useMutation } from "./use-mutation";

/** Creates one payout per provider for everything payable now (48 h rule, no open dispute). */
export function CreatePayoutBatchButton({ eligibleCents, eligibleCount, providers, holdHours }: { eligibleCents: number; eligibleCount: number; providers: number; holdHours: number }) {
  const m = useMutation(createPayoutBatchAction, {
    success: (r) => (r.payouts.length ? `${r.payouts.length} Auszahlung${r.payouts.length === 1 ? "" : "en"} über ${formatPriceExact(r.totalCents)} angelegt (${r.bookingCount} Buchungen).` : "Keine auszahlbaren Buchungen gefunden."),
    haptic: true,
  });
  return (
    <ConfirmButton
      label="Auszahlungslauf erstellen"
      variant="primary"
      icon={<Icon icon={Banknote} size={16} />}
      title="Auszahlungslauf erstellen?"
      confirmLabel="Lauf erstellen"
      disabled={eligibleCount === 0}
      pending={m.pending}
      error={m.error}
      onOpen={m.reset}
      onConfirm={async () => (await m.run()).ok}
    >
      <p>
        Für <span className="font-[520] text-ink num">{providers}</span> Profi{providers === 1 ? "" : "s"} wird je eine offene Auszahlung angelegt:{" "}
        <span className="font-[520] text-ink num">{formatPriceExact(eligibleCents)}</span> aus <span className="num">{eligibleCount}</span> Buchungen.
      </p>
      <p>Berücksichtigt werden nur Buchungen, die vor mehr als {holdHours} Stunden abgeschlossen wurden und keinen offenen Streitfall haben. Die Auszahlungen werden danach einzeln als bezahlt markiert.</p>
    </ConfirmButton>
  );
}

export function MarkPayoutPaidButton({ payoutId, providerName, amountCents }: { payoutId: string; providerName: string; amountCents: number }) {
  const m = useMutation(markPayoutPaidAction, { success: `Auszahlung an ${providerName} als bezahlt markiert.`, haptic: true });
  return (
    <ConfirmButton
      label="Als bezahlt markieren"
      variant="ghost"
      icon={<Icon icon={Check} size={16} />}
      title="Auszahlung als bezahlt markieren?"
      confirmLabel="Als bezahlt markieren"
      pending={m.pending}
      error={m.error}
      onOpen={m.reset}
      onConfirm={async () => (await m.run(payoutId)).ok}
    >
      <p>
        {formatPriceExact(amountCents)} an {providerName}. Nur markieren, wenn die Überweisung ausgeführt wurde. Der Profi wird benachrichtigt.
      </p>
    </ConfirmButton>
  );
}
