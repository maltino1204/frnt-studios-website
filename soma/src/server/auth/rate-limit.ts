import "server-only";

import type { Tx } from "../db/client";
import { ServiceError } from "../errors";
import { UNKNOWN_IP } from "./client-ip";

/**
 * DB-backed login rate limit (sliding 15-minute window):
 *   - per e-mail: exponential back-off from the 2nd failure (2 s, 4 s, 8 s …),
 *     hard lock after 5 failures;
 *   - per client IP (trusted hop only, see client-ip.ts): lock after 20 failures;
 *     skipped when the IP is "unknown" (no trusted hop configured).
 */
export const LOGIN_WINDOW_MINUTES = 15;
export const MAX_FAILURES_PER_EMAIL = 5;
export const MAX_FAILURES_PER_IP = 20;
const MAX_BACKOFF_SECONDS = 60;

/** Seconds to wait after `failures` consecutive failures: 0, 0, 2, 4, 8, 16 … (capped at 60). */
export function loginBackoffSeconds(failures: number): number {
  if (failures < 2) return 0;
  return Math.min(MAX_BACKOFF_SECONDS, 2 ** (failures - 1));
}

export async function assertLoginAllowed(tx: Tx, email: string, ipRaw: string | null, now: Date = new Date()): Promise<void> {
  // "unknown" (no trusted hop) is not used as an IP bucket: one shared bucket would let a single
  // client lock everybody out. The per-e-mail back-off and lock still apply.
  const ip = ipRaw && ipRaw !== UNKNOWN_IP ? ipRaw : null;
  const [row] = await tx<{ byEmail: number; byIp: number; lastEmailFailure: Date | null }[]>`
    select
      count(*) filter (where email = ${email})::int as by_email,
      count(*) filter (where ${ip}::text is not null and ip = ${ip})::int as by_ip,
      max(created_at) filter (where email = ${email}) as last_email_failure
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
  const wait = loginBackoffSeconds(row.byEmail);
  if (wait > 0 && row.lastEmailFailure) {
    const remaining = Math.ceil(wait - (now.getTime() - row.lastEmailFailure.getTime()) / 1000);
    if (remaining > 0) {
      throw new ServiceError(
        "rate_limited",
        `Bitte warten Sie ${remaining} ${remaining === 1 ? "Sekunde" : "Sekunden"}, bevor Sie es erneut versuchen.`,
      );
    }
  }
}

export async function recordLoginAttempt(tx: Tx, email: string, ip: string | null, success: boolean): Promise<void> {
  await tx`insert into app_private.login_attempts (email, ip, success) values (${email}, ${ip}, ${success})`;
  if (success) {
    // A successful login clears the e-mail's failure streak.
    await tx`delete from app_private.login_attempts where email = ${email} and not success`;
  }
}
