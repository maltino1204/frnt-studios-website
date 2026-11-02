"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { routes } from "@/lib/routes";
import { setPersonalizedSuggestionsAction } from "@/server/actions/explore";
import { FOR_YOU_WHY_HREF } from "./explore-copy";

/** „Persönliche Vorschläge“ (/entdecken „Für dich“): saves on change, optimistic, reverted on error. */
export function PersonalizationSwitch({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const toast = useToast();
  const change = (next: boolean) => {
    const prev = on;
    setOn(next);
    start(async () => {
      const r = await setPersonalizedSuggestionsAction(next);
      if (!r.ok) {
        setOn(prev);
        toast.show(r.error, { kind: "error" });
      } else toast.show(r.message ?? "Gespeichert.");
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-tile bg-surface-sunken px-4">
        <Switch
          label="Persönliche Vorschläge"
          description={on ? "An: „Für dich“ auf Entdecken nutzt deine Buchungen, Favoriten und deine Standardadresse." : "Aus: Wir berechnen keine Vorschläge für dich und zeigen nur die allgemeine Auswahl."}
          checked={on}
          disabled={pending}
          onChange={(e) => change(e.target.checked)}
          className="py-3"
        />
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 type-caption text-ink-muted">
        <Link href={FOR_YOU_WHY_HREF} className="inline-flex min-h-touch items-center text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
          Wie Vorschläge entstehen
        </Link>
        <Link href={routes.explore()} className="inline-flex min-h-touch items-center text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
          Zu Entdecken
        </Link>
      </p>
    </div>
  );
}
