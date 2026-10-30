import type { ReactNode } from "react";
import { Notice } from "@/components/ui/feedback";
import { Container, Overline } from "@/components/ui/layout";
import { cn } from "@/lib/cn";
import { Breadcrumbs } from "./discovery-breadcrumbs";
import { breadcrumbLd, JsonLd } from "./discovery-json-ld";

/**
 * Editorial layout for help, policy and legal pages: header, optional legal
 * placeholder notice, a sticky table of contents from lg, reading-width body.
 */
export function ContentPage({
  overline,
  title,
  lead,
  path,
  crumb,
  sections,
  placeholder,
  children,
}: {
  overline: string;
  title: ReactNode;
  lead?: ReactNode;
  path: string;
  crumb: string;
  sections: Array<{ id: string; title: string }>;
  /** shows "Platzhalter – rechtliche Prüfung erforderlich" */
  placeholder?: boolean;
  children: ReactNode;
}) {
  const crumbs = [
    { name: "Start", path: "/" },
    { name: crumb, path },
  ];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <Container className="pt-6 pb-(--space-section) md:pt-8">
        <Breadcrumbs items={crumbs} />
        <header className="flex max-w-[44rem] flex-col gap-5 pt-8 pb-10 md:pt-12 md:pb-14">
          <Overline>{overline}</Overline>
          <h1 className="type-display-l">{title}</h1>
          {lead ? <p className="max-w-[36rem] type-body-l text-ink-muted">{lead}</p> : null}
          {placeholder ? (
            <Notice kind="warning" title="Platzhalter – rechtliche Prüfung erforderlich" className="mt-2 max-w-[36rem]">
              Dieser Text beschreibt Aufbau und Inhalte, ist aber noch nicht anwaltlich geprüft. Angaben in eckigen Klammern sind vor dem Start zu ergänzen.
            </Notice>
          ) : null}
        </header>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          {sections.length > 2 ? (
            <nav aria-label="Inhalt" className="hidden lg:col-span-3 lg:block">
              <ol className="sticky top-[calc(var(--header-height)+2rem)] flex flex-col border-t border-line">
                {sections.map((s) => (
                  <li key={s.id} className="border-b border-line">
                    <a href={`#${s.id}`} className="flex min-h-11 items-center py-2 type-body-s text-ink-muted transition-colors duration-fast hover:text-ink">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <div className={cn("flex min-w-0 flex-col gap-14 md:gap-16", sections.length > 2 ? "lg:col-span-8 lg:col-start-5" : "lg:col-span-8")}>
            {children}
          </div>
        </div>
      </Container>
    </>
  );
}

/** One section of a content page: heading + prose with SOMA type styles. */
export function ContentSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titel`} className="scroll-mt-24">
      <h2 id={`${id}-titel`} className="type-heading-l text-ink">
        {title}
      </h2>
      <div className="mt-5 flex max-w-reading flex-col gap-4 type-body text-ink-muted [&_a]:text-accent [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-[0.2em] [&_a:hover]:text-accent-hover [&_h3]:pt-2 [&_h3]:type-heading-m [&_h3]:text-ink [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
