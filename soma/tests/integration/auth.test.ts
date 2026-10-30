import { describe, expect, it } from "vitest";
import {
  changeLocalPassword,
  createLocalSession,
  createLocalUser,
  requestLocalPasswordReset,
  resetLocalPassword,
  resolveLocalSession,
  revokeLocalSession,
  verifyLocalCredentials,
} from "@/server/auth/local";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { loadSession } from "@/server/auth/session-store";
import { PASSWORD, sql, uniqueEmail } from "./support/fixtures";

const meta = { ip: "203.0.113.7", userAgent: "vitest" };

describe("local auth adapter", () => {
  it("hashes with scrypt and verifies", async () => {
    const h = await hashPassword("ein-sicheres-passwort");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("ein-sicheres-passwort", h)).toBe(true);
    expect(await verifyPassword("falsch-falsch", h)).toBe(false);
  });

  it("signs up (handle_new_user creates profile, preferences, provider shell) and logs in", async () => {
    const email = uniqueEmail("neu");
    const id = await createLocalUser({ email, password: PASSWORD, firstName: "Zoë", lastName: "Müller", role: "provider" });
    const [p] = await sql()<{ role: string; referralCode: string }[]>`select role, referral_code from public.profiles where id = ${id}`;
    expect(p.role).toBe("provider");
    expect(p.referralCode).toMatch(/^[A-Z0-9]{6,16}$/);
    const [pr] = await sql()<{ status: string; slug: string; displayName: string; inviteCode: string }[]>`select status, slug, display_name, invite_code from public.providers where id = ${id}`;
    expect(pr).toMatchObject({ status: "draft", displayName: "Zoë M." });
    expect(pr.slug).toMatch(/^zoe-m-[a-z0-9]{4}$/);
    const [{ n }] = await sql()<{ n: number }[]>`select count(*)::int as n from public.notification_preferences where user_id = ${id}`;
    expect(n).toBe(1);
    expect(await verifyLocalCredentials(email.toUpperCase(), PASSWORD, meta)).toBe(id);
    expect((await loadSession(id))?.providerStatus).toBe("draft");
  });

  it("never lets sign-up metadata grant the admin role", async () => {
    const id = await createLocalUser({ email: uniqueEmail("evil"), password: PASSWORD, firstName: "Eve", lastName: "X", role: "admin" as unknown as "customer" });
    const [p] = await sql()<{ role: string }[]>`select role from public.profiles where id = ${id}`;
    expect(p.role).toBe("customer");
  });

  it("enforces the password policy and unique e-mails", async () => {
    await expect(createLocalUser({ email: uniqueEmail("kurz"), password: "kurz", firstName: "A", lastName: "B", role: "customer" })).rejects.toThrow(/mindestens 10 Zeichen/);
    const email = uniqueEmail("doppelt");
    await createLocalUser({ email, password: PASSWORD, firstName: "A", lastName: "B", role: "customer" });
    await expect(createLocalUser({ email: email.toUpperCase(), password: PASSWORD, firstName: "A", lastName: "B", role: "customer" })).rejects.toThrow(/bereits ein Konto/);
  });

  // Moves the recorded failures back in time so the exponential back-off has elapsed.
  const ageFailures = (email: string, seconds = 90) =>
    sql()`update app_private.login_attempts set created_at = created_at - make_interval(secs => ${seconds}) where email = ${email}`;

  it("rate-limits failed logins per e-mail (hard lock after 5 within 15 min)", async () => {
    const email = uniqueEmail("rl");
    await createLocalUser({ email, password: PASSWORD, firstName: "R", lastName: "L", role: "customer" });
    for (let i = 0; i < 5; i += 1) {
      await expect(verifyLocalCredentials(email, "falsches-passwort", { ip: null, userAgent: null })).rejects.toThrow(/falsch/);
      await ageFailures(email);
    }
    await expect(verifyLocalCredentials(email, PASSWORD, { ip: null, userAgent: null })).rejects.toThrow(/Zu viele/);
  });

  it("backs off exponentially per e-mail from the second failure (audit-1 R6)", async () => {
    const email = uniqueEmail("backoff");
    const id = await createLocalUser({ email, password: PASSWORD, firstName: "B", lastName: "O", role: "customer" });
    await expect(verifyLocalCredentials(email, "falsches-passwort", meta)).rejects.toThrow(/falsch/);
    // one typo: the immediate retry is allowed
    await expect(verifyLocalCredentials(email, "falsches-passwort", meta)).rejects.toThrow(/falsch/);
    // second failure → 2 s back-off, even with the right password
    await expect(verifyLocalCredentials(email, PASSWORD, meta)).rejects.toMatchObject({ code: "rate_limited", message: expect.stringMatching(/Bitte warten Sie \d Sekunden?/) });
    await ageFailures(email, 3);
    expect(await verifyLocalCredentials(email, PASSWORD, meta)).toBe(id);
    // success clears the streak
    const [{ n }] = await sql()<{ n: number }[]>`select count(*)::int as n from app_private.login_attempts where email = ${email} and not success`;
    expect(n).toBe(0);
  });

  it("locks an IP after 20 failures across e-mails, but never pools unknown IPs", async () => {
    const ip = `198.51.100.${Math.floor(Math.random() * 200) + 20}`;
    await sql()`
      insert into app_private.login_attempts (email, ip, success)
      select 'spray-' || g || '@soma.test', ${ip}, false from generate_series(1, 20) g`;
    const email = uniqueEmail("ipvictim");
    await createLocalUser({ email, password: PASSWORD, firstName: "I", lastName: "P", role: "customer" });
    await expect(verifyLocalCredentials(email, PASSWORD, { ip, userAgent: null })).rejects.toThrow(/Zu viele/);
    await sql()`
      insert into app_private.login_attempts (email, ip, success)
      select 'spray-u' || g || '@soma.test', 'unknown', false from generate_series(1, 25) g`;
    expect(await verifyLocalCredentials(email, PASSWORD, { ip: "unknown", userAgent: null })).toBeTruthy();
    await sql()`delete from app_private.login_attempts where email like 'spray-%@soma.test'`;
  });

  it("slows every login down once more than 200 failures happened across all accounts (audit-2 N2)", async () => {
    const email = uniqueEmail("budget");
    const id = await createLocalUser({ email, password: PASSWORD, firstName: "G", lastName: "B", role: "customer" });
    try {
      await sql()`
        insert into app_private.login_attempts (email, ip, success)
        select 'stuffing-' || g || '@soma.test', null, false from generate_series(1, 205) g`;
      const t0 = Date.now();
      expect(await verifyLocalCredentials(email, PASSWORD, { ip: null, userAgent: null })).toBe(id);
      expect(Date.now() - t0).toBeGreaterThanOrEqual(950);
      // wrong password: same neutral message, also delayed
      const t1 = Date.now();
      await expect(verifyLocalCredentials(email, "falsches-passwort", { ip: null, userAgent: null })).rejects.toThrow("E-Mail-Adresse oder Passwort ist falsch.");
      expect(Date.now() - t1).toBeGreaterThanOrEqual(950);
    } finally {
      await sql()`delete from app_private.login_attempts where email like 'stuffing-%@soma.test' or email = ${email}`;
    }
    const t2 = Date.now();
    expect(await verifyLocalCredentials(email, PASSWORD, { ip: null, userAgent: null })).toBe(id);
    expect(Date.now() - t2).toBeLessThan(900);
  });

  it("throttles password-reset / claim e-mails: 3 per address and 20 per trusted IP per hour (audit-2 N8)", async () => {
    const email = uniqueEmail("throttle");
    await createLocalUser({ email, password: PASSWORD, firstName: "T", lastName: "H", role: "customer" });
    const tokens: Array<string | null> = [];
    for (let i = 0; i < 6; i += 1) tokens.push(await requestLocalPasswordReset(email, { ip: null }));
    expect(tokens.filter(Boolean)).toHaveLength(3);
    const [{ queued }] = await sql()<{ queued: number }[]>`
      select count(*)::int as queued from public.email_outbox o join auth.users u on u.id = o.to_user_id
      where lower(u.email) = ${email} and o.template = 'auth.password_reset'`;
    expect(queued).toBe(3);
    const [{ suppressed }] = await sql()<{ suppressed: number }[]>`
      select count(*)::int as suppressed from app_private.auth_email_requests where email = ${email} and not sent`;
    expect(suppressed).toBe(3);

    // per IP: 20 sent e-mails (different addresses) from one trusted IP, then silence; other IPs are unaffected
    const ip = `203.0.113.${Math.floor(Math.random() * 200) + 20}`;
    await sql()`
      insert into app_private.auth_email_requests (email, ip, kind, sent)
      select 'spray-' || g || '@soma.test', ${ip}, 'account_claim', true from generate_series(1, 20) g`;
    const other = uniqueEmail("throttle-ip");
    await createLocalUser({ email: other, password: PASSWORD, firstName: "T", lastName: "I", role: "customer" });
    expect(await requestLocalPasswordReset(other, { ip })).toBeNull();
    expect(await requestLocalPasswordReset(other, { ip: "198.51.100.77", kind: "account_claim" })).toBeTruthy();
    // unknown IPs are not pooled
    expect(await requestLocalPasswordReset(other, { ip: "unknown" })).toBeTruthy();
    await sql()`delete from app_private.auth_email_requests where email like 'spray-%@soma.test'`;
  });

  it("issues opaque session tokens stored only as hashes; revocation works", async () => {
    const id = await createLocalUser({ email: uniqueEmail("sess"), password: PASSWORD, firstName: "S", lastName: "T", role: "customer" });
    const token = await createLocalSession(id, meta);
    expect(token.length).toBeGreaterThanOrEqual(40);
    const [{ n }] = await sql()<{ n: number }[]>`select count(*)::int as n from app_private.local_sessions where token_hash = ${token}`;
    expect(n).toBe(0);
    expect(await resolveLocalSession(token)).toBe(id);
    expect(await resolveLocalSession("x".repeat(43))).toBeNull();
    await revokeLocalSession(token);
    expect(await resolveLocalSession(token)).toBeNull();
  });

  it("blocked users cannot log in and get no session", async () => {
    const email = uniqueEmail("blocked");
    const id = await createLocalUser({ email, password: PASSWORD, firstName: "B", lastName: "L", role: "customer" });
    await sql()`update public.profiles set blocked_at = now() where id = ${id}`;
    await expect(verifyLocalCredentials(email, PASSWORD, meta)).rejects.toThrow(/gesperrt/);
    expect(await loadSession(id)).toBeNull();
  });

  it("password reset and change", async () => {
    const email = uniqueEmail("reset");
    const id = await createLocalUser({ email, password: PASSWORD, firstName: "R", lastName: "S", role: "customer" });
    expect(await requestLocalPasswordReset(uniqueEmail("unbekannt"))).toBeNull();
    const token = await requestLocalPasswordReset(email);
    expect(token).toBeTruthy();
    await resetLocalPassword(token as string, "ganz-neues-passwort");
    await expect(resetLocalPassword(token as string, "nochmal-neues-pw")).rejects.toThrow(/ungültig oder abgelaufen/);
    expect(await verifyLocalCredentials(email, "ganz-neues-passwort", meta)).toBe(id);
    await expect(changeLocalPassword(id, "falsch-falsch", "noch-ein-passwort")).rejects.toThrow(/aktuelle Passwort/);
    await changeLocalPassword(id, "ganz-neues-passwort", "noch-ein-passwort");
    expect(await verifyLocalCredentials(email, "noch-ein-passwort", meta)).toBe(id);
  });
});
