import "server-only";

import postgres from "postgres";
import { ServiceError } from "../errors";

/**
 * Maps database errors (constraint violations, SOMA_* trigger codes, privilege
 * errors) to German, user-facing ServiceErrors. Customer-facing wording (Sie).
 */
const TRIGGER_MESSAGES: Record<string, [ServiceError["code"], string]> = {
  SOMA_OUTSIDE_HOURS: ["unavailable", "Dieser Termin liegt außerhalb der Arbeitszeiten des Profis."],
  SOMA_TIME_OFF: ["unavailable", "Der Profi ist zu diesem Zeitpunkt nicht verfügbar."],
  SOMA_LEAD_TIME: ["unavailable", "Dieser Termin ist zu kurzfristig. Bitte wählen Sie einen späteren Zeitpunkt."],
  SOMA_TOO_FAR_AHEAD: ["unavailable", "Dieser Termin liegt zu weit in der Zukunft."],
  SOMA_PROVIDER_NOT_BOOKABLE: ["unavailable", "Dieser Profi ist derzeit nicht buchbar."],
  SOMA_OFFERING_INVALID: ["unavailable", "Diese Leistung ist nicht mehr verfügbar."],
  SOMA_CUSTOMER_INVALID: ["forbidden", "Mit diesem Konto sind keine Buchungen möglich."],
  SOMA_INVALID_RANGE: ["validation", "Der Zeitraum ist ungültig."],
  SOMA_INVALID_TRANSITION: ["invalid_state", "Diese Aktion ist für den aktuellen Buchungsstatus nicht möglich."],
  SOMA_TOO_EARLY: ["invalid_state", "Diese Aktion ist zu diesem Zeitpunkt noch nicht möglich."],
  SOMA_BOOKING_IMMUTABLE: ["invalid_state", "Die Buchungsdaten können nicht mehr geändert werden."],
  SOMA_REVIEW_NOT_ALLOWED: ["invalid_state", "Bewertungen sind nur für abgeschlossene Termine möglich."],
  SOMA_REPLY_EXISTS: ["conflict", "Du hast auf diese Bewertung bereits geantwortet."],
  SOMA_CREDIT_INSUFFICIENT: ["conflict", "Ihr Guthaben reicht dafür nicht aus."],
};

export const SLOT_TAKEN_MESSAGE = "Dieser Termin wurde gerade vergeben. Bitte wählen Sie eine andere Uhrzeit.";

export function isPostgresError(e: unknown): e is postgres.PostgresError {
  return e instanceof postgres.PostgresError;
}

/** Trigger code (e.g. "SOMA_LEAD_TIME") of a database error, if any. */
export function dbErrorCode(e: unknown): string | null {
  if (!isPostgresError(e)) return null;
  if (e.code === "P0001" && e.message.startsWith("SOMA_")) return e.message.split(/\s/)[0];
  return e.code;
}

export function mapDbError(e: unknown): ServiceError | null {
  if (!isPostgresError(e)) return null;
  if (e.code === "P0001") {
    const known = TRIGGER_MESSAGES[e.message.split(/\s/)[0]];
    if (known) return new ServiceError(known[0], known[1]);
    return null;
  }
  switch (e.code) {
    case "23P01":
      if (e.constraint_name === "bookings_no_overlap") return new ServiceError("slot_taken", SLOT_TAKEN_MESSAGE);
      return new ServiceError("conflict", "Dieser Zeitraum überschneidet sich mit einem bestehenden Eintrag.");
    case "23505":
      return new ServiceError("conflict", "Dieser Eintrag existiert bereits.");
    case "23503":
      return new ServiceError("validation", "Ein verknüpfter Eintrag wurde nicht gefunden.");
    case "23514":
    case "22P02":
    case "22007":
    case "22008":
      return new ServiceError("validation", "Die Eingaben sind ungültig.");
    case "42501":
      return new ServiceError("forbidden", "Dafür fehlt die Berechtigung.");
    default:
      return null;
  }
}

/** Re-throws database errors as ServiceErrors where they are known. */
export function rethrowDb(e: unknown): never {
  const mapped = mapDbError(e);
  throw mapped ?? e;
}
