"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { routes } from "@/lib/routes";

/** Shared calm error state for the booking journey's error.tsx boundaries. */
export function JourneyError({
  error,
  reset,
  title = "Das hat gerade nicht geklappt.",
  note,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  note?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto w-full max-w-content px-(--space-gutter) py-16 lg:py-24">
      <EmptyState
        title={title}
        action={
          <div className="flex flex-wrap gap-3">
            <Button onClick={reset}>Erneut versuchen</Button>
            <ButtonLink href={routes.home()} variant="ghost">
              Zur Startseite
            </ButtonLink>
          </div>
        }
      >
        {`Bitte versuch es in einem Moment noch einmal.${note ? ` ${note}` : ""}`}
        {error.digest ? <span className="mt-2 block type-caption">{`Fehlercode ${error.digest}`}</span> : null}
      </EmptyState>
    </div>
  );
}
