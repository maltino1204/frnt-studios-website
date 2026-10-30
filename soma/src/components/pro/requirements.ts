import type { CategoryDTO, MissingDocumentDTO, ProServiceDTO, RequiredDocumentDTO } from "@/server/dto";
import type { Requirement } from "./documents-manager";

/** Builds the per-document checklist: platform-wide requirements + each offered category's requirements. */
export function buildRequirements(
  base: RequiredDocumentDTO[],
  categories: CategoryDTO[],
  services: ProServiceDTO[],
  missing: MissingDocumentDTO[],
): Requirement[] {
  const offered = categories.filter((c) => services.some((s) => s.isActive && s.categoryId === c.id));
  const out: Requirement[] = base.map((d) => ({
    key: `base-${d.kind}`,
    kind: d.kind,
    label: d.label,
    scope: "Für alle Profis",
    categoryId: null,
    missing: missing.some((m) => m.categorySlug === null && m.kind === d.kind),
  }));
  for (const c of offered) {
    for (const d of c.requiredDocuments) {
      out.push({
        key: `${c.slug}-${d.kind}`,
        kind: d.kind,
        label: d.label,
        scope: `Für ${c.name}`,
        categoryId: c.id,
        missing: missing.some((m) => m.categorySlug === c.slug && m.kind === d.kind),
      });
    }
  }
  return out;
}
