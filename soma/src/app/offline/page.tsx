import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/logo";
import { Container } from "@/components/ui/layout";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="flex flex-1 items-center py-24">
      <Container width="reading" className="flex flex-col gap-6">
        <Wordmark />
        <span aria-hidden className="block h-0.5 w-6 bg-ink" />
        <h1 className="type-display-m">Gerade keine Verbindung.</h1>
        <p className="type-body-l text-ink-muted">
          Ihre Termine und Buchungen sind sicher gespeichert. Sobald Sie wieder online sind, geht es genau hier weiter.
        </p>
      </Container>
    </main>
  );
}
