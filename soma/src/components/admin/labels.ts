import type {
  ActorRole,
  AppRole,
  BookingStatus,
  CommissionTier,
  DisputeReason,
  DisputeStatus,
  DocumentKind,
  DocumentStatus,
  PaymentStatus,
  PayoutStatus,
  ProviderStatus,
} from "@/server/dto";
import type { StatusTone } from "@/components/ui/feedback";

/** German admin labels + status tones (neutral voice). Status is always dot + word. */
type Labelled = { label: string; tone: StatusTone };

export const BOOKING_STATUS: Record<BookingStatus, Labelled> = {
  pending_payment: { label: "Zahlung ausstehend", tone: "warning" },
  requested: { label: "Angefragt", tone: "warning" },
  confirmed: { label: "Bestätigt", tone: "success" },
  in_progress: { label: "Läuft", tone: "accent" },
  completed: { label: "Abgeschlossen", tone: "neutral" },
  cancelled: { label: "Storniert", tone: "danger" },
  declined: { label: "Abgelehnt", tone: "danger" },
  expired: { label: "Abgelaufen", tone: "neutral" },
  no_show: { label: "Nicht angetroffen", tone: "danger" },
};
export const BOOKING_STATUS_ORDER: BookingStatus[] = ["requested", "pending_payment", "confirmed", "in_progress", "completed", "cancelled", "declined", "expired", "no_show"];

export const PROVIDER_STATUS: Record<ProviderStatus, Labelled> = {
  draft: { label: "Entwurf", tone: "neutral" },
  submitted: { label: "Eingereicht", tone: "warning" },
  in_review: { label: "In Prüfung", tone: "accent" },
  approved: { label: "Freigegeben", tone: "success" },
  rejected: { label: "Abgelehnt", tone: "danger" },
  suspended: { label: "Gesperrt", tone: "danger" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, Labelled> = {
  requires_payment_method: { label: "Offen", tone: "warning" },
  authorized: { label: "Reserviert", tone: "accent" },
  captured: { label: "Eingezogen", tone: "success" },
  partially_refunded: { label: "Teilerstattet", tone: "warning" },
  refunded: { label: "Erstattet", tone: "neutral" },
  cancelled: { label: "Freigegeben (storniert)", tone: "neutral" },
  failed: { label: "Fehlgeschlagen", tone: "danger" },
};

export const PAYOUT_STATUS: Record<PayoutStatus, Labelled> = {
  pending: { label: "Offen", tone: "warning" },
  in_transit: { label: "Unterwegs", tone: "accent" },
  paid: { label: "Ausgezahlt", tone: "success" },
  failed: { label: "Fehlgeschlagen", tone: "danger" },
};

export const DISPUTE_STATUS: Record<DisputeStatus, Labelled> = {
  open: { label: "Offen", tone: "danger" },
  investigating: { label: "In Prüfung", tone: "warning" },
  resolved_refund: { label: "Erstattet", tone: "success" },
  resolved_no_action: { label: "Ohne Maßnahme", tone: "neutral" },
  closed: { label: "Geschlossen", tone: "neutral" },
};

export const DISPUTE_REASON: Record<DisputeReason, string> = {
  quality: "Qualität der Behandlung",
  provider_no_show: "Profi nicht erschienen",
  customer_no_show: "Kundschaft nicht angetroffen",
  damage: "Schaden",
  payment: "Zahlung",
  safety: "Sicherheit",
  other: "Sonstiges",
};

export const DOCUMENT_STATUS: Record<DocumentStatus, Labelled> = {
  pending: { label: "Ungeprüft", tone: "warning" },
  approved: { label: "Geprüft", tone: "success" },
  rejected: { label: "Abgelehnt", tone: "danger" },
};

export const DOCUMENT_KIND: Record<DocumentKind, string> = {
  id_document: "Ausweisdokument",
  business_registration: "Gewerbeanmeldung",
  qualification: "Qualifikation",
  insurance: "Haftpflichtversicherung",
  other: "Sonstiges",
};

export const ROLE: Record<AppRole, string> = { customer: "Kundschaft", provider: "Profi", admin: "Admin" };

export const ACTOR: Record<ActorRole, string> = { customer: "Kundschaft", provider: "Profi", admin: "Admin", system: "System" };

export const TIER: Record<CommissionTier, string> = { base: "Basis", repeat: "Stammkundschaft", own_client: "Eigene Kundschaft" };

export const LOCATION_KIND: Record<string, string> = { home: "Zuhause", hotel: "Hotel", office: "Büro", other: "Anderer Ort" };
