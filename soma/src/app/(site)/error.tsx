"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyArt } from "@/components/ui/feedback";
import { Container } from "@/components/ui/layout";
import { SUPPORT_EMAIL } from "@/lib/brand";

/** Error boundary for public pages: calm, on-brand, with a retry. Header and footer stay. */
export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: string }).digest ?? "") : "";
  return (
    <Container className="py-(--space-section)">
      <div role="alert" className="flex max-w-[36rem] flex-col gap-6">
        <EmptyArt seed="fehler" tone="massage" />
        <h1 className="type-display-l">
          Das hat nicht geklappt.
        </h1>
        <p className="type-body-l text-ink-muted">
          Beim Laden dieser Seite ist ein Fehler aufgetreten. Versuchen Sie es bitte noch einmal. Bleibt der Fehler, schreiben Sie uns an{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button size="l" onClick={() => retry()}>
            Erneut versuchen
          </Button>
          <ButtonLink href="/" variant="secondary" size="l">
            Zur Startseite
          </ButtonLink>
        </div>
        {digest ? <p className="type-caption text-ink-muted">Fehlercode: <span className="code-ref">{digest}</span></p> : null}
      </div>
    </Container>
  );
}
