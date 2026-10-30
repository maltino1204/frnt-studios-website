import { DocumentsManager } from "@/components/pro/documents-manager";
import { PROVIDER_STATUS_LABEL, PROVIDER_STATUS_TONE } from "@/components/pro/labels";
import { ProHeader, ProPage } from "@/components/pro/page";
import { buildRequirements } from "@/components/pro/requirements";
import { Notice, Status } from "@/components/ui/feedback";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { listCategories } from "@/server/services/catalog";
import { getOnboardingState, listDocuments, listProServices } from "@/server/services/pro";
import { getProviderTerms } from "@/server/services/pro-ext";

export const metadata = { title: "Verifizierung" };

export default async function ProVerificationPage() {
  const session = await requireRole("provider", "/pro/verifizierung");
  const [onboarding, documents, services, categories, terms] = await Promise.all([
    getOnboardingState(session),
    listDocuments(session),
    listProServices(session),
    listCategories(),
    getProviderTerms(),
  ]);
  const requirements = buildRequirements(terms.baseRequiredDocuments, categories, services, onboarding.missingDocuments);
  return (
    <ProPage width="narrow">
      <ProHeader
        back={{ href: routes.pro.profile(), label: "Profil" }}
        title="Verifizierung"
        description="Jedes Profil auf SOMA ist geprüft. Das schützt dich und deine Kundschaft – und ist der Grund, warum Kundschaft dir die Tür öffnet."
        actions={<Status tone={PROVIDER_STATUS_TONE[onboarding.status]}>{PROVIDER_STATUS_LABEL[onboarding.status]}</Status>}
      />
      {onboarding.lastDecisionNote && onboarding.status !== "approved" ? (
        <Notice kind="warning" title="Hinweis aus der letzten Prüfung">
          {onboarding.lastDecisionNote}
        </Notice>
      ) : null}
      <DocumentsManager requirements={requirements} documents={documents} />
    </ProPage>
  );
}
