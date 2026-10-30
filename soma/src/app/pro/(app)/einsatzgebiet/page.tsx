import { AreaForm } from "@/components/pro/area-form";
import { ProHeader, ProPage } from "@/components/pro/page";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { lookupPostalCode } from "@/server/services/catalog";
import { getProProfile } from "@/server/services/pro";

export const metadata = { title: "Einsatzgebiet" };

export default async function ProAreaPage() {
  const session = await requireRole("provider", "/pro/einsatzgebiet");
  const profile = await getProProfile(session);
  const pc = profile.basePostalCode ? await lookupPostalCode(profile.basePostalCode) : null;
  return (
    <ProPage width="narrow">
      <ProHeader
        back={{ href: routes.pro.profile(), label: "Profil" }}
        title="Einsatzgebiet"
        description="Du erscheinst nur in Suchen innerhalb deines Radius. Die Entfernung rechnen wir von Postleitzahl zu Postleitzahl."
      />
      <AreaForm profile={profile} cityLabel={pc?.cityName ?? null} />
    </ProPage>
  );
}
