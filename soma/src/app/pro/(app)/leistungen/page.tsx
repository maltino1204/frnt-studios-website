import { ProHeader, ProPage } from "@/components/pro/page";
import { ServicesEditor } from "@/components/pro/services-editor";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { listCatalog } from "@/server/services/catalog";
import { listProServices } from "@/server/services/pro";
import { getProviderTerms } from "@/server/services/pro-ext";

export const metadata = { title: "Leistungen & Preise" };

export default async function ProServicesPage() {
  const session = await requireRole("provider", "/pro/leistungen");
  const [services, catalog, terms] = await Promise.all([listProServices(session), listCatalog(), getProviderTerms()]);
  return (
    <ProPage width="narrow">
      <ProHeader
        back={{ href: routes.pro.profile(), label: "Profil" }}
        title="Leistungen & Preise"
        description="Du legst Dauer und Preis selbst fest. Die Richtwerte zeigen, wo Preise auf SOMA üblicherweise beginnen."
      />
      <ServicesEditor services={services} catalog={catalog} rates={terms.commission} />
    </ProPage>
  );
}
