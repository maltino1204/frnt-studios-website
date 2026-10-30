"use client";

import { useState } from "react";
import { Ban, Check, RotateCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { decideProviderAction, reviewDocumentAction, setProviderCommissionOverrideAction } from "@/server/actions/admin";
import type { DocumentStatus, ProviderDecision, ProviderStatus } from "@/server/dto";
import { ConfirmButton } from "./confirm";
import { parsePercentInput, ratioToInput } from "./format";
import { useMutation } from "./use-mutation";

type DecisionSpec = {
  decision: ProviderDecision;
  label: string;
  title: string;
  confirm: string;
  body: string;
  noteRequired: boolean;
  variant: "primary" | "secondary" | "ghost";
  confirmVariant: "primary" | "destructive";
  icon: typeof Check;
};

const SPECS: Record<ProviderDecision, DecisionSpec> = {
  start_review: { decision: "start_review", label: "Prüfung starten", title: "Prüfung starten?", confirm: "Prüfung starten", body: "Der Status wechselt auf „In Prüfung“. Der Profi sieht, dass die Unterlagen bearbeitet werden.", noteRequired: false, variant: "secondary", confirmVariant: "primary", icon: Search },
  approve: { decision: "approve", label: "Freigeben", title: "Profi freigeben?", confirm: "Freigeben", body: "Das Profil wird sofort öffentlich und buchbar. Der Profi wird benachrichtigt.", noteRequired: false, variant: "primary", confirmVariant: "primary", icon: Check },
  reject: { decision: "reject", label: "Ablehnen", title: "Bewerbung ablehnen?", confirm: "Ablehnen", body: "Der Profi erhält die Begründung und kann Unterlagen nachreichen und erneut einreichen.", noteRequired: true, variant: "secondary", confirmVariant: "destructive", icon: X },
  suspend: { decision: "suspend", label: "Sperren", title: "Profi sperren?", confirm: "Sperren", body: "Das Profil verschwindet aus Suche und Profilseite, neue Buchungen sind nicht mehr möglich. Bestehende Termine bleiben bestehen und müssen gesondert geklärt werden. Die Begründung wird dem Profi mitgeteilt (P2B-Verordnung).", noteRequired: true, variant: "secondary", confirmVariant: "destructive", icon: Ban },
  reinstate: { decision: "reinstate", label: "Reaktivieren", title: "Profi reaktivieren?", confirm: "Reaktivieren", body: "Das Profil wird wieder öffentlich und buchbar.", noteRequired: false, variant: "primary", confirmVariant: "primary", icon: RotateCcw },
};

const AVAILABLE: Record<ProviderStatus, ProviderDecision[]> = {
  draft: ["approve"],
  submitted: ["start_review", "reject", "approve"],
  in_review: ["reject", "approve"],
  approved: ["suspend"],
  rejected: ["approve"],
  suspended: ["reinstate"],
};

/** Verification decisions for one provider; consequential ones go through a modal with a note. */
export function ProviderDecisions({ providerId, status, missing }: { providerId: string; status: ProviderStatus; missing: string[] }) {
  return (
    <>
      {AVAILABLE[status].map((d) => (
        <DecisionButton key={d} providerId={providerId} spec={SPECS[d]} missing={missing} />
      ))}
    </>
  );
}

function DecisionButton({ providerId, spec, missing }: { providerId: string; spec: DecisionSpec; missing: string[] }) {
  const [note, setNote] = useState("");
  const toast = useToast();
  const m = useMutation(decideProviderAction, {
    success: (r) => (r.warnings.length ? `Gespeichert, mit ${r.warnings.length} Hinweis${r.warnings.length === 1 ? "" : "en"}.` : `Gespeichert: ${spec.label}.`),
    onSuccess: (r) => {
      if (r.warnings.length) toast.show(r.warnings.join(" · "), { kind: "info" });
    },
  });
  const formId = `decision-${spec.decision}`;
  const showMissing = (spec.decision === "approve" || spec.decision === "reinstate") && missing.length > 0;
  return (
    <ConfirmButton
      label={spec.label}
      icon={<Icon icon={spec.icon} size={16} />}
      variant={spec.variant}
      title={spec.title}
      confirmLabel={spec.confirm}
      confirmVariant={spec.confirmVariant}
      pending={m.pending}
      error={m.error && !m.fieldErrors.note ? m.error : null}
      formId={formId}
      onOpen={() => {
        setNote("");
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
          if (spec.noteRequired && note.trim().length < 5) {
            m.setFieldErrors({ note: "Bitte die Entscheidung begründen (mind. 5 Zeichen)." });
            return;
          }
          const res = await m.run({ providerId, decision: spec.decision, note: note.trim() || undefined });
          if (res.ok) close();
        }}
      >
        <p>{spec.body}</p>
        {showMissing ? (
          <Notice kind="warning" title={missing.length === 1 ? "1 Pflichtdokument fehlt oder ist ungeprüft" : `${missing.length} Pflichtdokumente fehlen oder sind ungeprüft`}>
            <ul className="list-disc pl-4">
              {missing.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="mt-1">Die Freigabe ist trotzdem möglich und wird mit diesen Hinweisen protokolliert.</p>
          </Notice>
        ) : null}
        <Textarea
          label={spec.noteRequired ? "Begründung für den Profi" : "Notiz"}
          optional={!spec.noteRequired}
          name="note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          error={m.fieldErrors.note}
          hint={spec.noteRequired ? "Wird dem Profi angezeigt und im Protokoll gespeichert." : "Nur intern, im Protokoll sichtbar."}
          maxLength={1000}
        />
      </form>
      )}
    </ConfirmButton>
  );
}

/** Approve / reject one uploaded document. */
export function DocumentReview({ documentId, status, label }: { documentId: string; status: DocumentStatus; label: string }) {
  const [note, setNote] = useState("");
  const approve = useMutation(reviewDocumentAction, { success: `${label}: als geprüft markiert.` });
  const reject = useMutation(reviewDocumentAction, { success: `${label}: abgelehnt.` });
  const formId = `doc-reject-${documentId}`;
  return (
    <div className="flex items-center justify-end gap-1">
      {status !== "approved" ? (
        <Button size="s" variant="ghost" loading={approve.pending} onClick={() => approve.run({ documentId, status: "approved" })} icon={<Icon icon={Check} size={16} />}>
          Geprüft
        </Button>
      ) : null}
      {status !== "rejected" ? (
        <ConfirmButton
          label="Ablehnen"
          variant="ghost"
          icon={<Icon icon={X} size={16} />}
          title="Dokument ablehnen?"
          confirmLabel="Ablehnen"
          confirmVariant="destructive"
          pending={reject.pending}
          error={reject.error && !reject.fieldErrors.note ? reject.error : null}
          formId={formId}
          onOpen={() => {
            setNote("");
            reject.reset();
          }}
        >
          {({ close }) => (
          <form
            id={formId}
            noValidate
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (note.trim().length < 3) {
                reject.setFieldErrors({ note: "Bitte einen Hinweis für den Profi angeben." });
                return;
              }
              const res = await reject.run({ documentId, status: "rejected", note: note.trim() });
              if (res.ok) close();
            }}
          >
            <p>„{label}“ wird abgelehnt. Der Profi sieht den Hinweis und kann ein neues Dokument hochladen.</p>
            <Textarea label="Hinweis für den Profi" name="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} error={reject.fieldErrors.note} placeholder="z. B. Ablaufdatum nicht lesbar" maxLength={500} />
          </form>
          )}
        </ConfirmButton>
      ) : null}
      {approve.error ? <span className="type-caption text-danger">{approve.error}</span> : null}
    </div>
  );
}

/** Provider-specific commission rate override (null = rules apply). */
export function CommissionOverrideForm({ providerId, rate }: { providerId: string; rate: number | null }) {
  const [value, setValue] = useState(rate != null ? ratioToInput(rate) : "");
  const m = useMutation(setProviderCommissionOverrideAction, { success: "Provisionssatz gespeichert." });
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) {
          setError(null);
          m.run({ providerId, rate: null });
          return;
        }
        const r = parsePercentInput(value);
        if (r == null || r < 0 || r > 0.5) {
          setError("Bitte einen Satz zwischen 0 und 50 % angeben.");
          return;
        }
        setError(null);
        m.run({ providerId, rate: r });
      }}
    >
      <Input
        dense
        label="Fester Satz für alle Buchungen"
        optional
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="z. B. 15"
        hint="In Prozent. Leer lassen, damit die Provisionsregeln gelten."
        error={error ?? m.fieldErrors.rate ?? m.error}
      />
      <div className="flex gap-2">
        <Button size="s" type="submit" variant="secondary" loading={m.pending}>
          Speichern
        </Button>
        {rate != null ? (
          <Button
            size="s"
            variant="ghost"
            onClick={() => {
              setValue("");
              m.run({ providerId, rate: null });
            }}
          >
            Zurücksetzen
          </Button>
        ) : null}
      </div>
    </form>
  );
}
