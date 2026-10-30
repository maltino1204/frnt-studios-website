import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { getConfig, resolveAppUrl } from "../config";
import { withService, type Tx } from "../db/client";
import { isPostgresError } from "../db/errors";
import { ServiceError } from "../errors";
import { enqueueSystemEmail } from "../services/notifications";
import {
  normalizeEmail,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  type AuthAdapter,
  type CookieJar,
  type RequestMeta,
  type SignUpInput,
} from "./adapter";
import { burnPasswordCheck, hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "./password";
import { allowAuthEmail, type AuthEmailKind } from "./email-throttle";
import { currentRequestIp } from "./request-ip";
import { assertLoginAllowed, recordLoginAttempt } from "./rate-limit";

/**
 * Local auth adapter (development, fully working).
 * - accounts in auth.users (shim), scrypt hashes
 * - opaque random session tokens; only sha256(token) is stored in app_private.local_sessions
 * - every function below that touches auth.* / app_private.* uses withService because
 *   those schemas are deliberately not reachable by the API roles.
 */

const INVALID_LOGIN = "E-Mail-Adresse oder Passwort ist falsch.";
const RESET_TTL_MINUTES = 60;

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

export function assertPasswordPolicy(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ServiceError("validation", `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`, {
      password: `Mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`,
    });
  }
  if (password.length > 200) throw new ServiceError("validation", "Das Passwort ist zu lang.", { password: "Höchstens 200 Zeichen." });
}

export async function createLocalUser(input: SignUpInput): Promise<string> {
  assertPasswordPolicy(input.password);
  const email = normalizeEmail(input.email);
  const hash = await hashPassword(input.password);
  const meta = {
    role: input.role,
    first_name: input.firstName,
    last_name: input.lastName,
    referral_code: input.referralCode ?? null,
    provider_invite_code: input.providerInviteCode ?? null,
    marketing_opt_in: input.marketingOptIn ?? false,
  };
  try {
    // withService: auth.users is owned by the auth system and not granted to API roles.
    const [row] = await withService(
      (tx) => tx<{ id: string }[]>`
        insert into auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
        values (${email}, ${hash}, now(), ${tx.json(meta)})
        returning id`,
    );
    return row.id;
  } catch (e) {
    if (isPostgresError(e) && e.code === "23505") {
      throw new ServiceError("conflict", "Für diese E-Mail-Adresse besteht bereits ein Konto.", {
        email: "Diese E-Mail-Adresse ist bereits registriert.",
      });
    }
    throw e;
  }
}

/** Verifies credentials with rate limiting. Returns the user id. */
export async function verifyLocalCredentials(emailRaw: string, password: string, meta: RequestMeta): Promise<string> {
  const email = normalizeEmail(emailRaw);
  // withService: login attempts and password hashes live outside the API roles' reach.
  const { user, delayMs } = await withService(async (tx) => {
    const gate = await assertLoginAllowed(tx, email, meta.ip);
    const [u] = await tx<{ id: string; encryptedPassword: string | null; blockedAt: Date | null }[]>`
      select u.id, u.encrypted_password, p.blocked_at
      from auth.users u left join public.profiles p on p.id = u.id
      where lower(u.email) = ${email}`;
    return { user: u ?? null, delayMs: gate.delayMs };
  });
  // Global failure budget exceeded (credential stuffing): slow every attempt down, outside the transaction.
  if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  const ok = user ? await verifyPassword(password, user.encryptedPassword) : (await burnPasswordCheck(password), false);
  // Recorded in its own transaction so failures are counted even though we throw below.
  // withService: app_private.login_attempts / auth.users.
  await withService(async (tx) => {
    await recordLoginAttempt(tx, email, meta.ip, ok);
    if (ok && user) await tx`update auth.users set last_sign_in_at = now() where id = ${user.id}`;
  });
  if (!ok || !user) throw new ServiceError("unauthenticated", INVALID_LOGIN);
  if (user.blockedAt) throw new ServiceError("forbidden", "Dieses Konto ist gesperrt. Bitte wenden Sie sich an den SOMA-Support.");
  return user.id;
}

/** Persists a new session and returns the opaque token for the cookie. */
export async function createLocalSession(userId: string, meta: RequestMeta, tx?: Tx): Promise<string> {
  const token = newToken();
  const run = async (t: Tx) => {
    await t`
      insert into app_private.local_sessions (token_hash, user_id, expires_at, ip, user_agent)
      values (${sha256(token)}, ${userId}, now() + make_interval(secs => ${SESSION_MAX_AGE_SECONDS}),
              ${meta.ip}, ${meta.userAgent ? meta.userAgent.slice(0, 300) : null})`;
    // housekeeping
    await t`delete from app_private.local_sessions where user_id = ${userId} and expires_at < now()`;
  };
  // withService: app_private.local_sessions is not reachable by API roles.
  if (tx) await run(tx);
  else await withService(run);
  return token;
}

export async function resolveLocalSession(token: string | null | undefined): Promise<string | null> {
  if (!token || token.length < 20 || token.length > 200) return null;
  // withService: session lookup in app_private.
  const rows = await withService(
    (tx) => tx<{ userId: string }[]>`
      update app_private.local_sessions
      set last_seen_at = now()
      where token_hash = ${sha256(token)} and expires_at > now()
      returning user_id`,
  );
  return rows[0]?.userId ?? null;
}

export async function revokeLocalSession(token: string | null | undefined): Promise<void> {
  if (!token) return;
  // withService: session deletion in app_private.
  await withService((tx) => tx`delete from app_private.local_sessions where token_hash = ${sha256(token)}`);
}

export async function revokeAllLocalSessions(userId: string): Promise<void> {
  // withService: session deletion in app_private.
  await withService((tx) => tx`delete from app_private.local_sessions where user_id = ${userId}`);
}

/**
 * Creates a reset token and queues the e-mail. Silent for unknown addresses and when
 * the auth e-mail throttle (3/h per address, 20/h per trusted IP) suppresses it.
 */
export async function requestLocalPasswordReset(emailRaw: string, opts: { ip?: string | null; kind?: AuthEmailKind } = {}): Promise<string | null> {
  const email = normalizeEmail(emailRaw);
  const token = newToken();
  // withService: password reset tokens and the throttle live in app_private; reads auth.users.
  const userId = await withService(async (tx) => {
    if (!(await allowAuthEmail(tx, { email, ip: opts.ip ?? null, kind: opts.kind ?? "password_reset" }))) return null;
    const [user] = await tx<{ id: string }[]>`select id from auth.users where lower(email) = ${email}`;
    if (!user) return null;
    await tx`delete from app_private.password_resets where user_id = ${user.id}`;
    await tx`
      insert into app_private.password_resets (token_hash, user_id, expires_at)
      values (${sha256(token)}, ${user.id}, now() + make_interval(mins => ${RESET_TTL_MINUTES}))`;
    await enqueueSystemEmail(tx, {
      toUserId: user.id,
      template: "auth.password_reset",
      subject: "Passwort zurücksetzen",
      payload: { url: `${await resolveAppUrl()}/passwort-vergessen?token=${token}`, validMinutes: RESET_TTL_MINUTES },
    });
    return user.id;
  });
  return userId ? token : null;
}

export async function resetLocalPassword(token: string, newPassword: string): Promise<string> {
  assertPasswordPolicy(newPassword);
  const hash = await hashPassword(newPassword);
  // withService: consumes a reset token in app_private and updates auth.users.
  return withService(async (tx) => {
    const [row] = await tx<{ userId: string }[]>`
      update app_private.password_resets set used_at = now()
      where token_hash = ${sha256(token)} and used_at is null and expires_at > now()
      returning user_id`;
    if (!row) throw new ServiceError("validation", "Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.");
    await tx`update auth.users set encrypted_password = ${hash}, updated_at = now() where id = ${row.userId}`;
    await tx`delete from app_private.local_sessions where user_id = ${row.userId}`;
    return row.userId;
  });
}

export async function changeLocalPassword(userId: string, current: string, next: string): Promise<void> {
  assertPasswordPolicy(next);
  // withService: password hashes live in auth.users.
  const [user] = await withService((tx) => tx<{ encryptedPassword: string | null }[]>`select encrypted_password from auth.users where id = ${userId}`);
  if (!user || !(await verifyPassword(current, user.encryptedPassword))) {
    throw new ServiceError("validation", "Das aktuelle Passwort ist falsch.", { currentPassword: "Das aktuelle Passwort ist falsch." });
  }
  const hash = await hashPassword(next);
  // withService: see above.
  await withService((tx) => tx`update auth.users set encrypted_password = ${hash}, updated_at = now() where id = ${userId}`);
}

/** Password re-confirmation (no session, no login attempt recorded). */
export async function verifyLocalPassword(userId: string, password: string): Promise<boolean> {
  if (!password) return false;
  // withService: password hashes live in auth.users.
  const [user] = await withService((tx) => tx<{ encryptedPassword: string | null }[]>`select encrypted_password from auth.users where id = ${userId}`);
  return Boolean(user && (await verifyPassword(password, user.encryptedPassword)));
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: getConfig().NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function createLocalAuthAdapter(cookies: CookieJar): AuthAdapter {
  const issue = async (userId: string, meta: RequestMeta) => {
    // Rotation: a login always replaces the presented session.
    await revokeLocalSession(cookies.get(SESSION_COOKIE)?.value);
    const token = await createLocalSession(userId, meta);
    cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  };
  return {
    id: "local",
    async signUp(input, meta) {
      const userId = await createLocalUser(input);
      await issue(userId, meta);
      return { userId };
    },
    async signIn(email, password, meta) {
      const userId = await verifyLocalCredentials(email, password, meta);
      await issue(userId, meta);
      return { userId };
    },
    async signOut() {
      await revokeLocalSession(cookies.get(SESSION_COOKIE)?.value);
      cookies.delete(SESSION_COOKIE);
    },
    async getUserId() {
      return resolveLocalSession(cookies.get(SESSION_COOKIE)?.value);
    },
    async requestPasswordReset(email, opts) {
      await requestLocalPasswordReset(email, { ip: opts?.ip !== undefined ? opts.ip : await currentRequestIp(), kind: opts?.kind });
    },
    async resetPassword(token, newPassword) {
      await resetLocalPassword(token, newPassword);
    },
    async verifyPassword(userId, password) {
      return verifyLocalPassword(userId, password);
    },
    async changePassword(userId, current, next) {
      await changeLocalPassword(userId, current, next);
      await revokeAllLocalSessions(userId);
      const token = await createLocalSession(userId, { ip: null, userAgent: null });
      cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    },
  };
}
