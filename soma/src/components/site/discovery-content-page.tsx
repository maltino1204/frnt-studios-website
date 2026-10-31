import type { ReactNode } from "react";
import { AuraBackground } from "@/components/ui/aura";
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
      <div className="relative isolate overflow-clip">
        <AuraBackground variant="subtle" placement="right" fade="both" animate={false} />
        <Container className="pt-5 md:pt-7">
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
        </Container>
      </div>
      <Container className="pb-(--space-section)">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          {sections.length > 2 ? (
            <nav aria-label="Inhalt" className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-[calc(var(--header-height)+2rem)] flex flex-col gap-2">
                <p className="px-3 type-overline text-ink-muted">Inhalt</p>
                <ol className="flex flex-col gap-0.5 rounded-card bg-surface-raised p-1.5 shadow-raised">
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="group flex min-h-11 items-center gap-3 rounded-control px-3 py-2 type-body-s text-ink-muted transition-colors duration-fast focus-ring hover:bg-surface-sunken hover:text-ink"
                      >
                        {/^\d/.test(s.title) ? null : (
                          <span aria-hidden className="w-5 shrink-0 type-caption text-ink-muted/80 num group-hover:text-ink">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        )}
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
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
    <section id={id} aria-labelledby={`${id}-titel`} className="scroll-mt-24 border-t border-line pt-8 first:border-t-0 first:pt-0">
      <h2 id={`${id}-titel`} className="flex items-center gap-3 type-heading-l text-ink">
        <span aria-hidden className="block h-0.5 w-5 shrink-0 rounded-full bg-aura" />
        {title}
      </h2>
      <div className="mt-5 flex max-w-reading flex-col gap-4 type-body text-ink-muted [&_a]:text-accent [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-[0.2em] [&_a:hover]:text-accent-hover [&_h3]:pt-2 [&_h3]:type-heading-m [&_h3]:text-ink [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
