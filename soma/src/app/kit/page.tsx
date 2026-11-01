import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, Overline } from "@/components/ui/layout";
import { DEMO_MODE } from "@/lib/brand";

export const metadata: Metadata = { title: "UI-Kit", robots: { index: false, follow: false } };
// Evaluated at request time so DEMO_MODE=false in production always yields 404 (QA R19).
export const dynamic = "force-dynamic";

/**
 * The Design v2 component preview retired with the brand migration. The brand book at /kit/marke
 * shows the real artwork (logos, colours, type, motif, components); this route only points there.
 */
export default function KitPage() {
  if (!DEMO_MODE) notFound();
  return (
    <main className="flex flex-1 items-center py-24">
      <Container width="reading" className="flex flex-col gap-6">
        <Wordmark />
        <Overline>Intern</Overline>
        <h1 className="type-display-m">Das UI-Kit ist jetzt das Markenbuch.</h1>
        <p className="type-body-l text-ink-muted">
          Logos, Farben, Schrift, Motiv und Komponenten der neuen Marke stehen im Markenbuch – mit den echten Master-Dateien.
        </p>
        <ButtonLink href="/kit/marke" size="l" className="self-start" iconRight={<Icon icon={ArrowRight} />}>
          Zum Markenbuch
        </ButtonLink>
      </Container>
    </main>
  );
}
