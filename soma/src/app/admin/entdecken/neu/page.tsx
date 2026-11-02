import type { Metadata } from "next";
import { ExploreEditor } from "@/components/admin/explore-editor";
import { exploreCoverOptions } from "@/components/admin/explore-images";
import { AdminPageHeader } from "@/components/admin/page";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { getExploreEditorOptions } from "@/server/services/explore-admin";

export const metadata: Metadata = { title: "Sammlung anlegen" };

export default async function NeueSammlungPage() {
  const session = await requireRole("admin", routes.admin.exploreNew());
  const options = await getExploreEditorOptions(session);
  return (
    <>
      <AdminPageHeader back={{ href: routes.admin.explore(), label: "Entdecken" }} title="Sammlung anlegen" description="Neue Sammlungen sind Entwürfe, bis du sie aktivierst." />
      <ExploreEditor initial={null} options={options} covers={exploreCoverOptions()} />
    </>
  );
}
