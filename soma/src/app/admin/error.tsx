"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";

/** Error boundary for every admin route (below the shell, so navigation stays usable). */
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : "";
  return (
    <EmptyState
      title="Diese Ansicht konnte nicht geladen werden."
      action={
        <Button size="s" onClick={() => retry()}>
          Erneut laden
        </Button>
      }
    >
      <p>Die Daten sind gerade nicht erreichbar. Bitte erneut versuchen; bleibt der Fehler, hilft die Kennung beim Nachsehen im Server-Log.</p>
      {digest ? <p className="mt-2 code-ref">{digest}</p> : null}
    </EmptyState>
  );
}
