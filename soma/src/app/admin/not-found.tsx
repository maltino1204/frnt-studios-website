import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { routes } from "@/lib/routes";

export default function AdminNotFound() {
  return (
    <EmptyState
      headingLevel="h1"
      title="Eintrag nicht gefunden."
      action={
        <ButtonLink href={routes.admin.root()} size="s" variant="secondary">
          Zur Übersicht
        </ButtonLink>
      }
    >
      Der Datensatz existiert nicht oder wurde entfernt.
    </EmptyState>
  );
}
