import { ButtonLink } from "@/components/ui/button";
import { NotFoundState } from "@/components/site/not-found-state";
import { Container } from "@/components/ui/layout";
import { routes } from "@/lib/routes";

export default function BuchungNotFound() {
  return (
    <main id="inhalt" className="flex-1">
      <Container width="content" className="py-16 lg:py-24">
        <NotFoundState title="Diese Buchung finden wir nicht." action={<ButtonLink href={routes.account.bookings()}>Meine Termine</ButtonLink>}>
          Vielleicht gehört sie zu einem anderen Konto, oder der Link ist unvollständig.
        </NotFoundState>
      </Container>
    </main>
  );
}
