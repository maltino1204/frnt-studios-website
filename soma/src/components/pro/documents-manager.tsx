"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Trash, Upload } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { Notice, Status } from "@/components/ui/feedback";
import { Select } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { deleteDocumentAction, uploadDocumentAction } from "@/server/actions/pro";
import type { DocumentDTO, DocumentKind } from "@/server/dto";
import { DOCUMENT_KIND_LABEL, DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_TONE, proError } from "./labels";

const DOC_TYPES = "application/pdf,image/jpeg,image/png";
const MAX_DOC_BYTES = 10 * 1024 * 1024;

export type Requirement = {
  key: string;
  kind: DocumentKind;
  label: string;
  scope: string;
  categoryId: string | null;
  categoryName: string | null;
  missing: boolean;
};

/** Upload button that submits as soon as a file is picked (uploadDocumentAction). */
function DocumentUploadButton({ kind, categoryId, label, variant = "secondary" }: { kind: DocumentKind; categoryId: string | null; label: string; variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, action, pending] = useActionState(uploadDocumentAction, null);
  const handled = useRef(state);
  useEffect(() => {
    if (state === handled.current) return;
    handled.current = state;
    if (state?.ok) {
      toast.show(state.message ?? "Dokument hochgeladen.");
      router.refresh();
    }
  }, [state, toast, router]);
  return (
    <form ref={formRef} action={action} className="flex flex-col items-start sm:items-end">
      <input type="hidden" name="kind" value={kind} />
      {categoryId ? <input type="hidden" name="categoryId" value={categoryId} /> : null}
      <label className="inline-flex">
        <span className="sr-only">
          {label}: Datei auswählen
        </span>
        <input
          type="file"
          name="file"
          accept={DOC_TYPES}
          className="peer sr-only"
          disabled={pending}
          onChange={(e) => {
            setLocalError(null);
            const f = e.target.files?.[0];
            if (f && f.size > MAX_DOC_BYTES) {
              setLocalError("Die Datei ist größer als 10 MB.");
              e.target.value = "";
              return;
            }
            if (f) formRef.current?.requestSubmit();
          }}
        />
        <span
          className={cn(
            "inline-flex h-control cursor-pointer items-center gap-2 rounded-xs px-4 type-label whitespace-nowrap transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
            variant === "primary" ? "bg-ink text-ink-inverse hover:bg-ink-hover" : "border border-ink text-ink hover:bg-surface-sunken",
            pending && "opacity-60",
          )}
          aria-hidden
        >
          <Icon icon={Upload} />
          {pending ? "Lädt hoch …" : "Hochladen"}
        </span>
      </label>
      <div aria-live="polite">
        {localError || (state && !state.ok) ? <p className="mt-1.5 max-w-64 type-caption text-danger sm:text-right">{localError ?? (state && !state.ok ? state.fieldErrors?.file ?? proError(state.error) : null)}</p> : null}
      </div>
    </form>
  );
}

/** Required documents (platform-wide + per category) with status per document, plus all uploads. */
export function DocumentsManager({ requirements, documents }: { requirements: Requirement[]; documents: DocumentDTO[] }) {
  const router = useRouter();
  const toast = useToast();
  const [otherKind, setOtherKind] = useState<DocumentKind>("other");
  // A qualification only counts for the category it is filed for (audit-4 A4-3).
  const categoryOptions = [...new Map(requirements.filter((r) => r.categoryId && r.categoryName).map((r) => [r.categoryId!, r.categoryName!])).entries()];
  const [otherCategory, setOtherCategory] = useState<string>(categoryOptions[0]?.[0] ?? "");
  const [deleting, startDelete] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const latestOf = (kind: DocumentKind) => documents.filter((d) => d.kind === kind);

  const remove = (id: string) => {
    setDeletingId(id);
    startDelete(async () => {
      const res = await deleteDocumentAction(id);
      setDeletingId(null);
      if (!res.ok) return toast.show(proError(res.error), { kind: "error" });
      toast.show("Dokument gelöscht.");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3" aria-labelledby="req-title">
        <h2 id="req-title" className="type-heading-m">
          Benötigte Nachweise
        </h2>
        <ul className="border-y border-line">
          {requirements.map((r) => {
            const docs = latestOf(r.kind);
            const approved = docs.some((d) => d.status === "approved");
            const rejected = r.missing ? docs.find((d) => d.status === "rejected") : undefined;
            const status = r.missing ? (rejected ? { tone: "danger" as const, label: "Abgelehnt – bitte neu hochladen" } : { tone: "neutral" as const, label: "Fehlt" }) : approved ? { tone: "success" as const, label: "Geprüft" } : { tone: "warning" as const, label: "In Prüfung" };
            return (
              <li key={r.key} className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="type-body-s font-[520] text-ink">{r.label}</p>
                  <p className="type-caption text-ink-muted">{r.scope}</p>
                  <Status tone={status.tone} className="mt-1">
                    {status.label}
                  </Status>
                  {rejected?.reviewNote ? <p className="type-caption text-ink">Hinweis aus der Prüfung: {rejected.reviewNote}</p> : null}
                </div>
                {r.missing ? <DocumentUploadButton kind={r.kind} categoryId={r.categoryId} label={r.label} variant="primary" /> : null}
              </li>
            );
          })}
        </ul>
        <p className="type-caption text-ink-muted">PDF, JPG oder PNG bis 10 MB. Deine Dokumente sieht nur das SOMA-Prüfteam. Wir prüfen meist innerhalb von 48 Stunden.</p>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="docs-title">
        <h2 id="docs-title" className="type-heading-m">
          Hochgeladene Dokumente
        </h2>
        {documents.length ? (
          <ul className="border-y border-line">
            {documents.map((d) => (
              <li key={d.id} className="flex items-start gap-4 border-b border-line py-4 last:border-b-0">
                <Icon icon={FileText} className="mt-0.5 shrink-0 text-ink-muted" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate type-body-s font-[520] text-ink">{d.fileName}</p>
                  <p className="type-caption text-ink-muted num">
                    {DOCUMENT_KIND_LABEL[d.kind]}
                    {d.categoryName ? ` für ${d.categoryName}` : ""} · hochgeladen am {formatDate(d.createdAt)}
                  </p>
                  <Status tone={DOCUMENT_STATUS_TONE[d.status]} className="mt-1">
                    {DOCUMENT_STATUS_LABEL[d.status]}
                    {d.reviewedAt ? <span className="font-normal text-ink-muted num"> · {formatDate(d.reviewedAt)}</span> : null}
                  </Status>
                  {d.reviewNote ? <p className="type-caption text-ink">Hinweis: {d.reviewNote}</p> : null}
                </div>
                <div className="flex shrink-0 items-center">
                  <a href={d.url} target="_blank" rel="noopener noreferrer" aria-label={`${d.fileName} ansehen`} title="Ansehen" className="inline-flex size-touch items-center justify-center rounded-xs text-ink hover:bg-surface-sunken">
                    <Icon icon={ExternalLink} />
                  </a>
                  {d.status === "pending" ? (
                    <IconButton label={`${d.fileName} löschen`} onClick={() => remove(d.id)} disabled={deleting && deletingId === d.id}>
                      <Icon icon={Trash} />
                    </IconButton>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-y border-line py-4 type-body-s text-ink-muted">Noch keine Dokumente hochgeladen.</p>
        )}
      </section>

      <section className="flex flex-col gap-4 border border-line bg-surface-raised p-5" aria-labelledby="other-title">
        <div className="flex flex-col gap-1">
          <h2 id="other-title" className="type-heading-s">
            Weiteres Dokument
          </h2>
          <p className="type-caption text-ink-muted">Zum Beispiel eine zusätzliche Qualifikation, eine neue Versicherungspolice oder einen Hygieneplan.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Select label="Art des Dokuments" value={otherKind} onChange={(e) => setOtherKind(e.target.value as DocumentKind)} className="flex-1">
            {(Object.keys(DOCUMENT_KIND_LABEL) as DocumentKind[]).map((k) => (
              <option key={k} value={k}>
                {DOCUMENT_KIND_LABEL[k]}
              </option>
            ))}
          </Select>
          {otherKind === "qualification" && categoryOptions.length ? (
            <Select label="Für die Kategorie" value={otherCategory} onChange={(e) => setOtherCategory(e.target.value)} className="flex-1">
              {categoryOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          ) : null}
          <DocumentUploadButton
            key={`${otherKind}-${otherCategory}`}
            kind={otherKind}
            categoryId={otherKind === "qualification" && otherCategory ? otherCategory : null}
            label={DOCUMENT_KIND_LABEL[otherKind]}
          />
        </div>
      </section>
      {requirements.every((r) => !r.missing) ? <Notice kind="success">Alle benötigten Nachweise sind hochgeladen.</Notice> : null}
    </div>
  );
}
