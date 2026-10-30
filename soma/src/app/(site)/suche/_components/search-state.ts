/** Serializable /suche state shared by the server page and the client controls. */
export type SearchState = {
  plz: string | null;
  cityName: string | null;
  kategorie: string | null;
  /** service slug */
  leistung: string | null;
  dauer: number | null;
  datum: string | null;
  zeit: string | null;
  sort: string;
  sofort: boolean;
  bewertung: boolean;
  sprache: string | null;
};

export type CatalogLite = Array<{
  slug: string;
  name: string;
  services: Array<{ id: string; slug: string; name: string; durations: number[]; defaultDuration: number }>;
}>;

/** Builds a /suche URL. Parameter names are fixed in src/lib/routes.ts; filters use German keys. */
export function searchHref(s: Partial<SearchState>, extra: Record<string, string | number | undefined> = {}): string {
  const sp = new URLSearchParams();
  const set = (k: string, v: string | number | null | undefined | boolean) => {
    if (v === null || v === undefined || v === "" || v === false) return;
    sp.set(k, v === true ? "1" : String(v));
  };
  set("plz", s.plz);
  set("kategorie", s.kategorie);
  set("leistung", s.leistung);
  set("dauer", s.dauer);
  set("datum", s.datum);
  set("zeit", s.zeit);
  if (s.sort && s.sort !== "empfohlen") set("sort", s.sort);
  set("sofort", s.sofort);
  if (s.bewertung) sp.set("bewertung", "4.5");
  set("sprache", s.sprache);
  for (const [k, v] of Object.entries(extra)) set(k, v);
  const q = sp.toString();
  return `/suche${q ? `?${q}` : ""}`;
}

export function activeFilterCount(s: SearchState): number {
  return (s.sort !== "empfohlen" ? 1 : 0) + (s.sofort ? 1 : 0) + (s.bewertung ? 1 : 0) + (s.sprache ? 1 : 0);
}
