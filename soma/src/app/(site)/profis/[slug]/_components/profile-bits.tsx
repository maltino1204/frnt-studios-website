"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Icon } from "@/components/ui/icon";
import { VerifiedBadge } from "@/components/ui/trust";
import { cn } from "@/lib/cn";

/** Verified badge with label; tapping opens a sheet listing the checks. */
export function VerifiedSheetButton({ name, qualification }: { name: string; qualification: string | null }) {
  const [open, setOpen] = useState(false);
  const checks = [
    { title: "Identität", body: "Ausweisdokument geprüft." },
    { title: "Gewerbeanmeldung", body: `${name} arbeitet selbstständig mit angemeldetem Gewerbe.` },
    { title: "Berufshaftpflicht", body: "Versicherungsnachweis für Einsätze bei Kundschaft vor Ort." },
    ...(qualification ? [{ title: "Qualifikation", body: qualification }] : []),
  ];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="-mx-2 inline-flex h-touch items-center rounded-xs px-2 hover:bg-surface-sunken"
      >
        <VerifiedBadge withLabel size={20} />
        <span className="sr-only">: Was wir geprüft haben</span>
      </button>
      {open ? (
        <Sheet open onClose={() => setOpen(false)} title="Verifiziertes Profil">
          <div className="flex flex-col gap-5">
            <p className="type-body-s text-ink-muted">
              {`Bevor ${name} auf SOMA buchbar wurde, haben wir diese Unterlagen geprüft. Laufende Nachweise wie die Versicherung fordern wir regelmäßig neu an.`}
            </p>
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {checks.map((c) => (
                <li key={c.title} className="flex gap-3 py-3.5">
                  <Icon icon={Check} className="mt-0.5 shrink-0 text-ink" />
                  <div className="flex flex-col gap-0.5">
                    <p className="type-heading-s">{c.title}</p>
                    <p className="type-body-s text-ink-muted">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="type-caption text-ink-muted">Bewertungen stammen ausschließlich von Kundschaft mit abgeschlossener Buchung über SOMA.</p>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}

/** Three-line bio with "Mehr lesen". */
export function Bio({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 180;
  return (
    <div className="flex flex-col items-start gap-1">
      <p id="bio" className={cn("type-body text-ink whitespace-pre-line", !open && long && "line-clamp-3")}>
        {text}
      </p>
      {long ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls="bio"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-touch items-center type-label-s text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover"
        >
          {open ? "Weniger anzeigen" : "Mehr lesen"}
        </button>
      ) : null}
    </div>
  );
}
