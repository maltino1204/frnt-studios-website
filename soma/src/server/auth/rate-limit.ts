import "server-only";

import type { Tx } from "../db/client";
import { ServiceError } from "../errors";

/** DB-backed login rate limit (per e-mail and per IP, sliding 15-minute window). */
export const LOGIN_WINDOW_MINUTES = 15;
export const MAX_FAILURES_PER_EMAIL = 5;
export const MAX_FAILURES_PER_IP = 20;

export async function assertLoginAllowed(tx: Tx, email: string, ip: string | null): Promise<void> {
  const [row] = await tx<{ byEmail: number; byIp: number }[]>`
    select
      count(*) filter (where email = ${email})::int as by_email,
      count(*) filter (where ${ip}::text is not null and ip = ${ip})::int as by_ip
    from app_private.login_attempts
    where not success
      and created_at > now() - make_interval(mins => ${LOGIN_WINDOW_MINUTES})
      and (email = ${email} or (${ip}::text is not null and ip = ${ip}))`;
  if (row.byEmail >= MAX_FAILURES_PER_EMAIL || row.byIp >= MAX_FAILURES_PER_IP) {
    throw new ServiceError(
      "rate_limited",
      `Zu viele fehlgeschlagene Anmeldeversuche. Bitte warten Sie ${LOGIN_WINDOW_MINUTES} Minuten und versuchen Sie es erneut.`,
    );
  }
}

export async function recordLoginAttempt(tx: Tx, email: string, ip: string | null, success: boolean): Promise<void> {
  await tx`insert into app_private.login_attempts (email, ip, success) values (${email}, ${ip}, ${success})`;
  if (success) {
    // A successful login clears the e-mail's failure streak.
    await tx`delete from app_private.login_attempts where email = ${email} and not success`;
  }
}
