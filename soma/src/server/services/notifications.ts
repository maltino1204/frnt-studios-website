import "server-only";

import { z } from "zod";
import { resolveAppUrl } from "../config";
import { withService, withUser, type Tx } from "../db/client";
import type { NotificationDTO, Session } from "../dto";
import { getEmailAdapter } from "../email/adapter";
import { parse, requireRoleIn } from "./_shared";
import { formatEuro, formatWhen } from "./format";

/**
 * notify(tx, event, ctx) writes in-app notifications and queues e-mails in
 * email_outbox (respecting notification_preferences). Must run inside a
 * service transaction (it writes rows for other users).
 * Voice: customers "Sie", providers "du", admins neutral.
 */

export type NotifyEvent =
  | "booking.requested"
  | "booking.confirmed"
  | "booking.declined"
  | "booking.expired"
  | "booking.cancelled"
  | "booking.reminder_24h"
  | "booking.completed"
  | "booking.no_show"
  | "review.received"
  | "provider.approved"
  | "provider.rejected"
  | "payout.paid"
  | "dispute.opened"
  | "dispute.resolved"
  | "referral.rewarded";

export interface NotifyContext {
  bookingId?: string;
  providerId?: string;
  userId?: string;
  payoutId?: string;
  disputeId?: string;
  note?: string | null;
  amountCents?: number;
  rating?: number;
}

type Topic = "bookings" | "reminders" | "account";

interface Message {
  userId: string;
  type: NotifyEvent;
  title: string;
  body: string;
  href: string;
  topic: Topic;
  data?: Record<string, unknown>;
}

interface BookingInfo {
  id: string;
  reference: string;
  status: string;
  serviceName: string;
  startsAt: Date;
  respondBy: Date | null;
  customerId: string;
  providerId: string;
  providerName: string;
  customerFirstName: string | null;
  postalCode: string;
  city: string;
  cancelledBy: string | null;
  cancellationFeeCents: number;
  providerPayoutCents: number;
  totalCents: number;
  holdExpired: boolean;
}

async function loadBooking(tx: Tx, id: string): Promise<BookingInfo | null> {
  const rows = await tx<BookingInfo[]>`
    select b.id, b.reference, b.status, b.service_name, b.starts_at, b.respond_by, b.customer_id, b.provider_id,
           pr.display_name as provider_name, cp.first_name as customer_first_name, b.postal_code, b.city,
           b.cancelled_by, b.cancellation_fee_cents, b.provider_payout_cents, b.total_cents,
           (b.confirmed_at is null and b.respond_by is null) as hold_expired
    from public.bookings b
    join public.providers pr on pr.id = b.provider_id
    join public.profiles cp on cp.id = b.customer_id
    where b.id = ${id}`;
  return rows[0] ?? null;
}

async function adminIds(tx: Tx): Promise<string[]> {
  const rows = await tx<{ id: string }[]>`select id from public.profiles where role = 'admin' and blocked_at is null`;
  return rows.map((r) => r.id);
}

async function buildMessages(tx: Tx, event: NotifyEvent, ctx: NotifyContext): Promise<Message[]> {
  const out: Message[] = [];
  if (event.startsWith("booking.") && ctx.bookingId) {
    const b = await loadBooking(tx, ctx.bookingId);
    if (!b) return out;
    const when = formatWhen(b.startsAt);
    const cHref = `/buchung/${b.id}`;
    const pHref = `/pro/termine/${b.id}`;
    const data = { bookingId: b.id, reference: b.reference };
    const c = (title: string, body: string, topic: Topic = "bookings") => out.push({ userId: b.customerId, type: event, title, body, href: cHref, topic, data });
    const p = (title: string, body: string, topic: Topic = "bookings") => out.push({ userId: b.providerId, type: event, title, body, href: pHref, topic, data });
    switch (event) {
      case "booking.requested":
        c(`Ihre Anfrage ist bei ${b.providerName}`,
          `${b.serviceName} am ${when}. ${b.providerName} antwortet bis spätestens ${b.respondBy ? formatWhen(b.respondBy) : "kurz vor dem Termin"} – Ihre Zahlung ist bis dahin nur reserviert.`);
        p(`Neue Anfrage: ${b.serviceName}`,
          `${when} in ${b.postalCode} ${b.city}. Du hast Zeit bis ${b.respondBy ? formatWhen(b.respondBy) : "kurz vor dem Termin"}, um zu antworten.`);
        break;
      case "booking.confirmed":
        c("Ihr Termin ist bestätigt", `${b.serviceName} mit ${b.providerName} am ${when}. Ihren Start-Code finden Sie in der Buchungsübersicht.`);
        p(`Termin bestätigt: ${b.serviceName}`, `${when} bei ${b.customerFirstName ?? "deiner Kundin bzw. deinem Kunden"} in ${b.city}. Die Adresse findest du jetzt im Termin.`);
        break;
      case "booking.declined":
        c(`${b.providerName} kann den Termin leider nicht wahrnehmen`, `Ihre Anfrage für ${b.serviceName} am ${when} wurde abgelehnt. Die Reservierung auf Ihrer Karte wurde aufgehoben – wir zeigen Ihnen gern andere Profis.`);
        break;
      case "booking.expired":
        if (b.holdExpired) {
          c("Ihre Reservierung ist abgelaufen", `Die Zahlung für ${b.serviceName} am ${when} wurde nicht rechtzeitig abgeschlossen. Der Termin ist wieder frei.`);
        } else {
          c("Ihre Anfrage ist abgelaufen", `${b.providerName} hat nicht rechtzeitig geantwortet. Die Reservierung auf Ihrer Karte wurde aufgehoben.`);
          p("Anfrage abgelaufen", `Die Anfrage für ${b.serviceName} am ${when} ist abgelaufen, weil du nicht rechtzeitig geantwortet hast.`);
        }
        break;
      case "booking.cancelled": {
        const byProvider = b.cancelledBy === "provider";
        const fee = b.cancellationFeeCents > 0 ? ` Es fällt eine Stornogebühr von ${formatEuro(b.cancellationFeeCents)} an.` : " Es fallen keine Kosten an.";
        c(byProvider ? `${b.providerName} hat Ihren Termin storniert` : "Ihr Termin wurde storniert",
          byProvider ? `${b.serviceName} am ${when} findet leider nicht statt. Sie erhalten den vollen Betrag zurück.` : `${b.serviceName} am ${when}.${fee}`);
        if (!byProvider) p(`Termin storniert: ${b.serviceName}`, `Der Termin am ${when} wurde storniert.${b.cancellationFeeCents > 0 ? ` Dir steht ein Anteil der Stornogebühr zu.` : ""}`);
        break;
      }
      case "booking.reminder_24h":
        c("Morgen ist es so weit", `${b.serviceName} mit ${b.providerName} am ${when}.`, "reminders");
        p(`Erinnerung: ${b.serviceName}`, `Dein Termin am ${when} in ${b.city}.`, "reminders");
        break;
      case "booking.completed":
        c(`Wie war Ihr Termin mit ${b.providerName}?`, "Wir freuen uns über Ihre Bewertung – sie hilft anderen bei der Wahl.");
        p("Termin abgeschlossen", `${b.serviceName} am ${when}. Deine Einnahmen: ${formatEuro(b.providerPayoutCents)}.`);
        break;
      case "booking.no_show":
        c("Termin nicht wahrgenommen", `${b.providerName} hat Sie am ${when} nicht angetroffen. Gemäß Stornobedingungen fällt eine Gebühr von ${formatEuro(b.cancellationFeeCents)} an.`);
        for (const a of await adminIds(tx)) out.push({ userId: a, type: event, title: `No-Show ${b.reference}`, body: `${b.serviceName}, ${when}`, href: `/admin/buchungen/${b.id}`, topic: "account" });
        break;
      default:
        break;
    }
    return out;
  }

  switch (event) {
    case "review.received":
      if (ctx.providerId) out.push({ userId: ctx.providerId, type: event, title: `Neue Bewertung: ${ctx.rating ?? "?"} von 5 Sternen`, body: "Schau sie dir an und antworte, wenn du magst.", href: "/pro/bewertungen", topic: "bookings" });
      if (ctx.rating != null && ctx.rating <= 2) {
        for (const a of await adminIds(tx)) out.push({ userId: a, type: event, title: `Kritische Bewertung (${ctx.rating}★)`, body: "Bitte prüfen.", href: "/admin/buchungen", topic: "account" });
      }
      break;
    case "provider.approved":
      if (ctx.providerId) out.push({ userId: ctx.providerId, type: event, title: "Du bist freigeschaltet", body: "Dein Profil ist jetzt sichtbar und buchbar. Viel Erfolg mit deinen ersten Terminen.", href: "/pro", topic: "account" });
      break;
    case "provider.rejected":
      if (ctx.providerId) out.push({ userId: ctx.providerId, type: event, title: "Deine Verifizierung braucht noch etwas", body: ctx.note ? `Hinweis vom SOMA-Team: ${ctx.note}` : "Bitte prüfe deine Unterlagen in der Verifizierung.", href: "/pro/verifizierung", topic: "account" });
      break;
    case "payout.paid":
      if (ctx.providerId) out.push({ userId: ctx.providerId, type: event, title: `Auszahlung unterwegs: ${formatEuro(ctx.amountCents ?? 0)}`, body: "Das Geld ist in 1–3 Werktagen auf deinem Konto.", href: "/pro/einnahmen", topic: "account" });
      break;
    case "dispute.opened":
    case "dispute.resolved": {
      if (!ctx.disputeId) break;
      const [d] = await tx<{ bookingId: string; customerId: string; providerId: string; reference: string; status: string }[]>`
        select d.booking_id, b.customer_id, b.provider_id, b.reference, d.status
        from public.disputes d join public.bookings b on b.id = d.booking_id where d.id = ${ctx.disputeId}`;
      if (!d) break;
      if (event === "dispute.opened") {
        out.push({ userId: d.customerId, type: event, title: "Wir kümmern uns um Ihr Anliegen", body: `Ihre Meldung zu ${d.reference} ist eingegangen. Wir melden uns innerhalb von 72 Stunden.`, href: `/buchung/${d.bookingId}`, topic: "bookings" });
        out.push({ userId: d.providerId, type: event, title: "Zu einem Termin wurde ein Problem gemeldet", body: `Buchung ${d.reference}: Das SOMA-Team prüft den Fall. Die Auszahlung für diesen Termin ist bis dahin pausiert.`, href: `/pro/termine/${d.bookingId}`, topic: "bookings" });
        for (const a of await adminIds(tx)) out.push({ userId: a, type: event, title: `Neuer Streitfall ${d.reference}`, body: "Bitte innerhalb von 4 Stunden reagieren.", href: "/admin/streitfaelle", topic: "account" });
      } else {
        out.push({ userId: d.customerId, type: event, title: "Ihr Anliegen wurde geklärt", body: ctx.note ?? `Zu ${d.reference} gibt es eine Entscheidung.`, href: `/buchung/${d.bookingId}`, topic: "bookings" });
        out.push({ userId: d.providerId, type: event, title: "Streitfall abgeschlossen", body: `Buchung ${d.reference} wurde geklärt.`, href: `/pro/termine/${d.bookingId}`, topic: "bookings" });
      }
      break;
    }
    case "referral.rewarded":
      if (ctx.userId) out.push({ userId: ctx.userId, type: event, title: "Ihre Empfehlung hat sich gelohnt", body: `Wir haben Ihnen ${formatEuro(ctx.amountCents ?? 0)} SOMA-Guthaben gutgeschrieben.`, href: "/konto/guthaben", topic: "account" });
      break;
    default:
      break;
  }
  return out;
}

const PREF_COLUMN: Record<Topic, "email_bookings" | "email_reminders" | null> = {
  bookings: "email_bookings",
  reminders: "email_reminders",
  account: null,
};

export async function notify(tx: Tx, event: NotifyEvent, ctx: NotifyContext): Promise<number> {
  const messages = await buildMessages(tx, event, ctx);
  const appUrl = await resolveAppUrl();
  for (const m of messages) {
    await tx`
      insert into public.notifications (user_id, type, title, body, href, data)
      values (${m.userId}, ${m.type}, ${m.title}, ${m.body}, ${m.href}, ${tx.json(JSON.parse(JSON.stringify(m.data ?? {})))})`;
    const col = PREF_COLUMN[m.topic];
    const [pref] = await tx<{ emailBookings: boolean; emailReminders: boolean }[]>`
      select email_bookings, email_reminders from public.notification_preferences where user_id = ${m.userId}`;
    const wantsEmail = col === null || !pref || (col === "email_bookings" ? pref.emailBookings : pref.emailReminders);
    if (wantsEmail) {
      await tx`
        insert into public.email_outbox (to_user_id, template, subject, payload)
        values (${m.userId}, ${m.type}, ${m.title},
                ${tx.json({ title: m.title, body: m.body, url: `${appUrl}${m.href}` })})`;
    }
  }
  return messages.length;
}

/** Transactional e-mails that ignore preferences (password reset etc.). */
export async function enqueueSystemEmail(tx: Tx, e: { toUserId: string; template: string; subject: string; payload: Record<string, unknown> }): Promise<void> {
  await tx`
    insert into public.email_outbox (to_user_id, template, subject, payload)
    values (${e.toUserId}, ${e.template}, ${e.subject}, ${tx.json(JSON.parse(JSON.stringify(e.payload)))})`;
}

/** Sends queued e-mails via the configured adapter (dev: console). Returns the number sent. */
export async function deliverQueuedEmails(limit = 50): Promise<number> {
  const adapter = getEmailAdapter();
  // withService: reads recipients' e-mail addresses from auth.users (system job).
  return withService(async (tx) => {
    const rows = await tx<{ id: string; email: string | null; template: string; subject: string; payload: Record<string, unknown> }[]>`
      select o.id, u.email, o.template, o.subject, o.payload
      from public.email_outbox o left join auth.users u on u.id = o.to_user_id
      where o.status = 'queued'
      order by o.created_at
      limit ${limit}
      for update of o skip locked`;
    let sent = 0;
    for (const r of rows) {
      if (!r.email) {
        await tx`update public.email_outbox set status = 'failed', error = 'Empfänger unbekannt' where id = ${r.id}`;
        continue;
      }
      try {
        const body = [r.payload.title, r.payload.body, r.payload.url].filter((x) => typeof x === "string").join("\n\n");
        await adapter.send({ to: r.email, subject: `SOMA · ${r.subject}`, text: body, template: r.template });
        await tx`update public.email_outbox set status = 'sent', sent_at = now(), error = null where id = ${r.id}`;
        sent += 1;
      } catch (e) {
        await tx`update public.email_outbox set status = 'failed', error = ${e instanceof Error ? e.message.slice(0, 300) : "unbekannt"} where id = ${r.id}`;
      }
    }
    return sent;
  });
}

// ---------------------------------------------------------------------------
// Inbox (any signed-in role)
// ---------------------------------------------------------------------------
export async function listNotifications(session: Session, opts: { unreadOnly?: boolean; limit?: number } = {}): Promise<NotificationDTO[]> {
  const s = requireRoleIn(session, "customer", "provider", "admin");
  const limit = Math.min(100, Math.max(1, opts.limit ?? 30));
  return withUser(s.userId, async (tx) => {
    const rows = await tx<{ id: string; type: string; title: string; body: string | null; href: string | null; readAt: Date | null; createdAt: Date }[]>`
      select id, type, title, body, href, read_at, created_at from public.notifications
      where user_id = ${s.userId} ${opts.unreadOnly ? tx`and read_at is null` : tx``}
      order by created_at desc limit ${limit}`;
    return rows.map((r) => ({ ...r, readAt: r.readAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString() }));
  });
}

export async function countUnreadNotifications(session: Session): Promise<number> {
  const s = requireRoleIn(session, "customer", "provider", "admin");
  return withUser(s.userId, async (tx) => {
    const [r] = await tx<{ n: number }[]>`select count(*)::int as n from public.notifications where user_id = ${s.userId} and read_at is null`;
    return r.n;
  });
}

/** Marks the given notifications (or all with `"all"`) as read. Returns the count. */
export async function markNotificationsRead(session: Session, ids: string[] | "all"): Promise<number> {
  const s = requireRoleIn(session, "customer", "provider", "admin");
  const list = ids === "all" ? null : parse(z.array(z.guid()).max(200), ids);
  return withUser(s.userId, async (tx) => {
    const rows = await tx`
      update public.notifications set read_at = now()
      where user_id = ${s.userId} and read_at is null ${list ? tx`and id = any(${list}::uuid[])` : tx``}
      returning id`;
    return rows.length;
  });
}
