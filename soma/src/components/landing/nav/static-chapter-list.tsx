import type { ReactNode } from "react";
import { CHAPTERS } from "./chapters";
import { PAGE_LINKS } from "./pages";

/** The id the no-JS „Kapitel“ / „Menü“ links point to. */
export const STATIC_CHAPTERS_ID = "kapitel";

/**
 * Without JavaScript the chapter overlay never mounts, so „Kapitel“ and „Menü“ are plain links to this list (audit-2
 * N-10): the seven chapters, styled like the overlay's rows, and the overlay's „Seiten“ (Entdecken first: below 1280
 * the header shows no page links), on the footer's Linen above the footer. Inside `<noscript>`, so with JavaScript it
 * is neither in the DOM nor in the payload's markup tree.
 */
export function StaticChapterList() {
  return (
    <noscript>
      <nav id={STATIC_CHAPTERS_ID} aria-label="Kapitel und Seiten" className="bg-surface-sunken pt-16 text-ink md:pt-24">
        <div className="lp-container">
          <h2 className="type-eyebrow text-ink-muted">Kapitel</h2>
          <ol className="mt-3 max-w-[40rem] border-t border-line">
            {CHAPTERS.map((c) => (
              <li key={c.id} className="border-b border-line">
                <a href={`#${c.id}`} className="flex min-h-[52px] items-center gap-4 rounded-control px-1 text-ink focus-ring hover:bg-surface-pressed lg:min-h-14 lg:px-2">
                  <span className="w-7 shrink-0 type-label text-ink-muted num">{c.nn}</span>
                  <span className="type-heading-l">{c.name}</span>
                </a>
              </li>
            ))}
          </ol>
          <h2 className="mt-10 type-eyebrow text-ink-muted">Seiten</h2>
          <ul className="mt-3 flex flex-wrap gap-x-6">
            {PAGE_LINKS.map((p) => (
              <li key={p.href}>
                <a href={p.href} className="inline-flex min-h-touch items-center rounded-control type-heading-m text-ink focus-ring hover:text-link-hover">
                  {p.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </noscript>
  );
}

/** A no-JS stand-in for a trigger that opens the chapter overlay: the same look, a link to the static list. */
export function NoScriptChapterLink({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <noscript>
      <a href={`#${STATIC_CHAPTERS_ID}`} className={className}>
        {children}
      </a>
    </noscript>
  );
}
