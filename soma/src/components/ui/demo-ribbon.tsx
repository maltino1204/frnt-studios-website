/** Discreet marker that the environment runs on fictional demo data (architecture §8). Light strip, warning pill. */
export function DemoRibbon() {
  return (
    <div
      role="region"
      aria-label="Hinweis zur Demo-Umgebung"
      data-demo-ribbon=""
      className="relative flex items-center justify-center gap-2 border-b border-line bg-surface-raised/80 px-(--space-gutter) py-1.5 text-center type-caption text-ink-muted"
    >
      <span className="hidden h-5 shrink-0 items-center gap-1.5 rounded-full bg-warning-soft px-2 text-[12px] leading-none font-[600] text-warning sm:inline-flex" aria-hidden>
        <span className="size-1.5 rounded-full bg-warning" />
        Demo
      </span>
      <span>Demo-Umgebung · Beispieldaten und Testzahlungen – es werden keine echten Termine gebucht.</span>
    </div>
  );
}
