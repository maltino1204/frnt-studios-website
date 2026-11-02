import "server-only";

import sources from "../../../scripts/images/sources.json";

/**
 * Cover options for /admin/entdecken from the image registry (scripts/images/sources.json, the same list
 * src/lib/images.ts serves): explore covers, category, editorial, landing and hero images that are not retired.
 * Portraits and portfolio images are left out (they belong to Profis). Any other /images/… path can be typed in.
 */
const GROUPS: Array<{ dir: string; label: string }> = [
  { dir: "explore", label: "Entdecken" },
  { dir: "categories", label: "Kategorien" },
  { dir: "editorial", label: "Redaktion" },
  { dir: "landing", label: "Startseite" },
  { dir: "hero", label: "Hero" },
];

export type CoverOption = { group: string; path: string };

export function exploreCoverOptions(): CoverOption[] {
  const list = sources as Array<{ path?: string; replacedBy?: string }>;
  return GROUPS.flatMap((g) =>
    list
      .filter((e) => e.path && !e.replacedBy && e.path.startsWith(`/images/${g.dir}/`))
      .map((e) => ({ group: g.label, path: e.path as string }))
      .sort((a, b) => a.path.localeCompare(b.path)),
  );
}
