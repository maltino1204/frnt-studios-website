"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { routes } from "@/lib/routes";

export default function ProError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto w-full max-w-[72rem] px-(--space-gutter) pt-10">
      <EmptyState
        title="Das hat gerade nicht geklappt."
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => retry()}>Erneut versuchen</Button>
            <ButtonLink href={routes.pro.root()} variant="ghost">
              Zu „Heute“
            </ButtonLink>
          </div>
        }
      >
        Die Seite konnte nicht geladen werden. Deine Daten sind sicher – versuch es bitte gleich noch einmal.
      </EmptyState>
    </div>
  );
}
