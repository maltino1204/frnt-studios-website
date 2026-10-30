import type { Metadata } from "next";
import { CatalogBoard } from "@/components/admin/catalog-board";
import { AdminPageHeader } from "@/components/admin/page";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { listCategoriesAdmin } from "@/server/services/admin";

export const metadata: Metadata = { title: "Kategorien & Leistungen" };

export default async function CategoriesPage() {
  const session = await requireRole("admin", routes.admin.categories());
  const categories = await listCategoriesAdmin(session);
  const services = categories.reduce((a, c) => a + c.services.length, 0);
  const inactive = categories.filter((c) => !c.isActive).length;
  return (
    <>
      <AdminPageHeader
        group="Marktplatz"
        title="Kategorien & Leistungen"
        description={`${categories.length} Kategorien${inactive ? ` (${inactive} inaktiv)` : ""} · ${services} Leistungen · sortiert nach Reihenfolge auf der Website`}
      />
      <CatalogBoard categories={categories} />
    </>
  );
}
