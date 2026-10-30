/** Discreet marker that the environment runs on fictional demo data (architecture §8). */
export function DemoRibbon() {
  return (
    <div role="region" aria-label="Hinweis zur Demo-Umgebung" className="border-b border-line bg-warning-soft px-(--space-gutter) py-1.5 text-center type-caption text-warning">
      Demo-Umgebung · Beispieldaten und Testzahlungen – es werden keine echten Termine gebucht.
    </div>
  );
}
