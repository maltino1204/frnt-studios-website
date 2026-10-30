import "server-only";

import type { Tx } from "../db/client";
import { UNKNOWN_IP } from "./client-ip";

/**
 * Throttle for auth e-mails (audit-2 N8): password reset and the guest checkout's
 * "Passwort festlegen" claim e-mail share one budget —
 *   at most 3 sent per address per hour, at most 20 sent per trusted client IP per hour.
 * Every request is recorded (also suppressed ones, `sent = false`). Callers answer
 * with the same neutral success either way, so the limit reveals nothing.
 */
export const AUTH_EMAIL_WINDOW_MINUTES = 60;
export const MAX_AUTH_EMAILS_PER_ADDRESS = 3;
export const MAX_AUTH_EMAILS_PER_IP = 20;

export type AuthEmailKind = "password_reset" | "account_claim";

/** Records the request and returns whether an e-mail may be sent. `email` must be normalised. */
export async function allowAuthEmail(tx: Tx, req: { email: string; ip: string | null | undefined; kind: AuthEmailKind }): Promise<boolean> {
  const ip = req.ip && req.ip !== UNKNOWN_IP ? req.ip : null;
  await tx`select pg_advisory_xact_lock(hashtext(${`auth-email:${req.email}`}))`;
  const [row] = await tx<{ byEmail: number; byIp: number }[]>`
    select
      count(*) filter (where email = ${req.email})::int as by_email,
      count(*) filter (where ${ip}::text is not null and ip = ${ip})::int as by_ip
    from app_private.auth_email_requests
    where sent and created_at > now() - make_interval(mins => ${AUTH_EMAIL_WINDOW_MINUTES})
      and (email = ${req.email} or (${ip}::text is not null and ip = ${ip}))`;
  const allowed = row.byEmail < MAX_AUTH_EMAILS_PER_ADDRESS && (ip === null || row.byIp < MAX_AUTH_EMAILS_PER_IP);
  await tx`insert into app_private.auth_email_requests (email, ip, kind, sent) values (${req.email}, ${ip}, ${req.kind}, ${allowed})`;
  return allowed;
}
