import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Container } from "@/components/ui/layout";
import { routes } from "@/lib/routes";

export default function ProfilNotFound() {
  return (
    <div>
      <Container width="content" className="py-16 lg:py-24">
        <EmptyState
          title="Dieses Profil ist nicht verfügbar."
          action={<ButtonLink href={routes.search()}>Andere Profis finden</ButtonLink>}
        >
          Die Fachkraft ist auf SOMA gerade nicht buchbar oder der Link ist nicht mehr gültig.
        </EmptyState>
      </Container>
    </div>
  );
}
