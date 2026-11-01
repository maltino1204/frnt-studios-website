"use client";

import { useState } from "react";
import { Download, Lock, LockOpen, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { formatPriceExact } from "@/lib/format";
import { adjustCreditsAction, anonymizeUserAction, exportUserDataAction, setUserBlockedAction } from "@/server/actions/admin";
import { ConfirmButton, ConfirmModal } from "./confirm";
import { parseEuroInput } from "./format";
import { useMutation } from "./use-mutation";

/** Block / unblock an account with a reason (blocking also ends all sessions). */
export function UserBlockButton({ userId, name, blocked, role }: { userId: string; name: string; blocked: boolean; role: string }) {
  const [reason, setReason] = useState("");
  const m = useMutation(setUserBlockedAction, { success: blocked ? `${name} ist wieder entsperrt.` : `${name} ist gesperrt.` });
  const formId = `block-${userId}`;
  return (
    <ConfirmButton
      label={blocked ? "Entsperren" : "Sperren"}
      variant="ghost"
      icon={<Icon icon={blocked ? LockOpen : Lock} size={16} />}
      title={blocked ? `${name} entsperren?` : `${name} sperren?`}
      confirmLabel={blocked ? "Entsperren" : "Sperren"}
      confirmVariant={blocked ? "primary" : "destructive"}
      formId={formId}
      pending={m.pending}
      error={m.error && !m.fieldErrors.reason ? m.error : null}
      onOpen={() => {
        setReason("");
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
            if (reason.trim().length < 3) {
              m.setFieldErrors({ reason: "Bitte einen Grund angeben (mind. 3 Zeichen)." });
              return;
            }
            const res = await m.run({ userId, blocked: !blocked, reason: reason.trim() });
            if (res.ok) close();
          }}
        >
          <p>
            {blocked
              ? "Das Konto kann sich wieder anmelden."
              : `Das Konto (${role}) wird sofort abgemeldet und kann sich nicht mehr anmelden. Bestehende Buchungen bleiben bestehen und müssen gesondert geklärt werden.`}
          </p>
          <Textarea label="Grund" name="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} error={m.fieldErrors.reason} hint="Nur intern, im Protokoll sichtbar." maxLength={500} />
        </form>
      )}
    </ConfirmButton>
  );
}

/** Saves a JSON string as a file download in the browser. */
function downloadJson(fileName: string, json: string) {
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** DSGVO "Daten exportieren": JSON download of everything stored about the account (audited). */
export function UserExportButton({ userId }: { userId: string }) {
  const m = useMutation(exportUserDataAction, { onSuccess: (r) => downloadJson(r.fileName, r.json) });
  return (
    <div className="flex flex-col items-start gap-1">
      <Button size="s" variant="secondary" loading={m.pending} icon={<Icon icon={Download} size={16} />} onClick={() => m.run({ userId })}>
        Daten exportieren
      </Button>
      {m.error ? <p className="type-caption text-danger">{m.error}</p> : null}
    </div>
  );
}

/** "Konto anonymisieren": irreversible; disabled with the reasons while blockers exist. */
export function UserAnonymizeButton({ userId, name, blockers }: { userId: string; name: string; blockers: string[] }) {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const m = useMutation(anonymizeUserAction, { success: "Konto anonymisiert." });
  const formId = `anonymize-${userId}`;
  if (blockers.length > 0) {
    return (
      <Button size="s" variant="secondary" disabled aria-describedby="anonymize-blockers" icon={<Icon icon={UserX} size={16} />}>
        Konto anonymisieren
      </Button>
    );
  }
  return (
    <ConfirmButton
      label="Konto anonymisieren"
      variant="secondary"
      icon={<Icon icon={UserX} size={16} />}
      title={`${name} anonymisieren?`}
      confirmLabel="Endgültig anonymisieren"
      confirmVariant="destructive"
      formId={formId}
      pending={m.pending}
      error={m.error && !m.fieldErrors.reason ? m.error : null}
      onOpen={() => {
        setReason("");
        setConfirmText("");
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
            const errors: Record<string, string> = {};
            if (reason.trim().length < 5) errors.reason = "Bitte den Anlass angeben (mind. 5 Zeichen).";
            if (confirmText.trim().toUpperCase() !== "ANONYMISIEREN") errors.confirm = "Bitte „ANONYMISIEREN“ eingeben.";
            if (Object.keys(errors).length) {
              m.setFieldErrors(errors);
              return;
            }
            const res = await m.run({ userId, reason: reason.trim() });
            if (res.ok) close();
          }}
        >
          <p>Name, Telefonnummer, Profilbild, Adressen, Login und alle Sitzungen werden gelöscht. Buchungen und Zahlungen bleiben für die Buchhaltung erhalten, die Adresse darin wird entfernt. Das lässt sich nicht rückgängig machen.</p>
          <Textarea label="Anlass" name="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} error={m.fieldErrors.reason} hint="z. B. „Löschantrag per E-Mail vom 30.10.“ – im Protokoll sichtbar." maxLength={500} />
          <Input dense label="Zur Bestätigung ANONYMISIEREN eingeben" name="confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} error={m.fieldErrors.confirm} autoComplete="off" />
        </form>
      )}
    </ConfirmButton>
  );
}

/** Credit adjustment (±, reason, audited) on the user detail page. */
export function CreditAdjustForm({ userId, balanceCents }: { userId: string; balanceCents: number }) {
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<"goodwill" | "admin_adjustment">("goodwill");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingCents, setPendingCents] = useState<number | null>(null);
  const m = useMutation(adjustCreditsAction, {
    success: "Guthaben gebucht.",
    onSuccess: () => {
      setPendingCents(null);
      setAmount("");
      setNote("");
    },
  });
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        m.reset();
        const next: Record<string, string> = {};
        const cents = parseEuroInput(amount);
        if (cents == null || cents <= 0 || cents > 50_000) next.amount = "Bitte einen Betrag zwischen 0,01 € und 500 € angeben.";
        else if (direction === "debit" && cents > balanceCents) next.amount = `Höchstens ${formatPriceExact(balanceCents)} (aktuelles Guthaben).`;
        if (note.trim().length < 3) next.note = "Bitte einen Grund angeben (mind. 3 Zeichen).";
        setErrors(next);
        if (Object.keys(next).length || cents == null) return;
        setPendingCents(direction === "debit" ? -cents : cents);
      }}
    >
      <div className="flex flex-wrap items-start gap-3">
        <Select dense label="Buchung" value={direction} onChange={(e) => setDirection(e.target.value as "credit" | "debit")} className="w-40">
          <option value="credit">Gutschrift (+)</option>
          <option value="debit">Abzug (−)</option>
        </Select>
        <Input dense label="Betrag in €" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount ?? m.fieldErrors.amountCents} placeholder="z. B. 10" className="w-36" />
        <Select dense label="Art" value={reason} onChange={(e) => setReason(e.target.value as "goodwill" | "admin_adjustment")} className="w-48">
          <option value="goodwill">Kulanzgutschrift</option>
          <option value="admin_adjustment">Korrektur</option>
        </Select>
      </div>
      <Textarea label="Grund" name="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} error={errors.note ?? m.fieldErrors.note} hint="Wird der Kundschaft im Guthabenverlauf angezeigt und protokolliert." maxLength={300} />
      {m.error && pendingCents == null ? <Notice kind="danger">{m.error}</Notice> : null}
      <div>
        <Button type="submit" size="s" variant="secondary">
          Buchen
        </Button>
      </div>
      {pendingCents != null ? (
        <ConfirmModal
          open
          onClose={() => setPendingCents(null)}
          title={pendingCents > 0 ? "Guthaben gutschreiben?" : "Guthaben abziehen?"}
          confirmLabel="Buchen"
          pending={m.pending}
          error={m.error}
          onConfirm={() => m.run({ userId, amountCents: pendingCents, note: note.trim(), reason })}
        >
          <p className="num">
            {formatPriceExact(balanceCents)} → <span className="font-[520] text-ink">{formatPriceExact(balanceCents + pendingCents)}</span>
          </p>
          <p>{note.trim()}</p>
        </ConfirmModal>
      ) : null}
    </form>
  );
}

