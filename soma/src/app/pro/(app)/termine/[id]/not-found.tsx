import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { routes } from "@/lib/routes";

export default function BookingNotFound() {
  return (
    <div className="mx-auto w-full max-w-[72rem] px-(--space-gutter) pt-10">
      <EmptyState title="Termin nicht gefunden." action={<ButtonLink href={routes.pro.bookings()} variant="secondary">Zu den Terminen</ButtonLink>}>
        Vielleicht wurde der Link falsch kopiert, oder der Termin gehört zu einem anderen Konto.
      </EmptyState>
    </div>
  );
}
