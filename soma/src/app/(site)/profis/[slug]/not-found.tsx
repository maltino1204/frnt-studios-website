import { ButtonLink } from "@/components/ui/button";
import { NotFoundState } from "@/components/site/not-found-state";
import { Container } from "@/components/ui/layout";
import { routes } from "@/lib/routes";

export default function ProfilNotFound() {
  return (
    <div>
      <Container width="content" className="py-16 lg:py-24">
        <NotFoundState
          title="Dieses Profil ist nicht verfügbar."
          action={<ButtonLink href={routes.search()}>Andere Profis finden</ButtonLink>}
        >
          Dieses Profil ist auf SOMA gerade nicht buchbar oder der Link ist nicht mehr gültig.
        </NotFoundState>
      </Container>
    </div>
  );
}
