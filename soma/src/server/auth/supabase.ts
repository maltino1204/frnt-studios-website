import "server-only";

import { createServerClient, type CookieOptions as SupabaseCookieOptions } from "@supabase/ssr";
import { getConfig, resolveAppUrl } from "../config";
import { ServiceError } from "../errors";
import { assertPasswordPolicy } from "./local";
import { normalizeEmail, type AuthAdapter, type CookieJar, type CookieOptions } from "./adapter";

/**
 * Supabase Auth adapter (production). Implemented against @supabase/ssr.
 *
 * NOT COVERED BY AUTOMATED TESTS: it needs a Supabase project
 * (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY). Profiles are
 * created by the same handle_new_user trigger as locally; the user metadata
 * passed to signUp carries role / names / referral and invite codes.
 * Login rate limiting is provided by Supabase Auth itself in this mode.
 */

function toJarOptions(o: SupabaseCookieOptions | undefined): CookieOptions {
  if (!o) return {};
  const sameSite = typeof o.sameSite === "string" ? (o.sameSite.toLowerCase() as CookieOptions["sameSite"]) : undefined;
  return { httpOnly: o.httpOnly, secure: o.secure, sameSite, path: o.path, maxAge: o.maxAge, expires: o.expires, domain: o.domain };
}

export function createSupabaseClient(cookies: CookieJar) {
  const cfg = getConfig();
  if (!cfg.NEXT_PUBLIC_SUPABASE_URL || !cfg.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("AUTH_PROVIDER=supabase benötigt NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return createServerClient(cfg.NEXT_PUBLIC_SUPABASE_URL, cfg.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (list) => {
        try {
          for (const c of list) cookies.set(c.name, c.value, toJarOptions(c.options));
        } catch {
          // Called from a Server Component render: cookies are read-only there.
          // The session is refreshed on the next Server Action / Route Handler.
        }
      },
    },
  });
}

const INVALID_LOGIN = "E-Mail-Adresse oder Passwort ist falsch.";

export function createSupabaseAuthAdapter(cookies: CookieJar): AuthAdapter {
  const client = () => createSupabaseClient(cookies);
  return {
    id: "supabase",
    async signUp(input) {
      assertPasswordPolicy(input.password);
      const { data, error } = await client().auth.signUp({
        email: normalizeEmail(input.email),
        password: input.password,
        options: {
          emailRedirectTo: `${await resolveAppUrl()}/anmelden`,
          data: {
            role: input.role,
            first_name: input.firstName,
            last_name: input.lastName,
            referral_code: input.referralCode ?? null,
            provider_invite_code: input.providerInviteCode ?? null,
            marketing_opt_in: input.marketingOptIn ?? false,
          },
        },
      });
      if (error || !data.user) {
        if (error?.status === 422 || /already/i.test(error?.message ?? "")) {
          throw new ServiceError("conflict", "Für diese E-Mail-Adresse besteht bereits ein Konto.", { email: "Diese E-Mail-Adresse ist bereits registriert." });
        }
        throw new ServiceError("internal", "Die Registrierung ist fehlgeschlagen. Bitte versuchen Sie es erneut.");
      }
      return { userId: data.user.id };
    },
    async signIn(email, password) {
      const { data, error } = await client().auth.signInWithPassword({ email: normalizeEmail(email), password });
      if (error?.status === 429) throw new ServiceError("rate_limited", "Zu viele Anmeldeversuche. Bitte warten Sie einige Minuten.");
      if (error || !data.user) throw new ServiceError("unauthenticated", INVALID_LOGIN);
      return { userId: data.user.id };
    },
    async signOut() {
      await client().auth.signOut();
    },
    async getUserId() {
      // getUser() validates the JWT with Supabase Auth (never trust getSession() on the server).
      const { data } = await client().auth.getUser();
      return data.user?.id ?? null;
    },
    async requestPasswordReset(email) {
      await client().auth.resetPasswordForEmail(normalizeEmail(email), { redirectTo: `${await resolveAppUrl()}/passwort-vergessen` });
    },
    async resetPassword(code, newPassword) {
      assertPasswordPolicy(newPassword);
      const sb = client();
      const { error: exErr } = await sb.auth.exchangeCodeForSession(code);
      if (exErr) throw new ServiceError("validation", "Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.");
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if (error) throw new ServiceError("internal", "Das Passwort konnte nicht geändert werden.");
    },
    async verifyPassword(_userId, password) {
      const sb = client();
      const { data } = await sb.auth.getUser();
      if (!data.user?.email || !password) return false;
      const check = await sb.auth.signInWithPassword({ email: data.user.email, password });
      return !check.error;
    },
    async changePassword(_userId, current, next) {
      assertPasswordPolicy(next);
      const sb = client();
      const { data } = await sb.auth.getUser();
      if (!data.user?.email) throw new ServiceError("unauthenticated", "Bitte melden Sie sich erneut an.");
      const check = await sb.auth.signInWithPassword({ email: data.user.email, password: current });
      if (check.error) throw new ServiceError("validation", "Das aktuelle Passwort ist falsch.", { currentPassword: "Das aktuelle Passwort ist falsch." });
      const { error } = await sb.auth.updateUser({ password: next });
      if (error) throw new ServiceError("internal", "Das Passwort konnte nicht geändert werden.");
    },
  };
}
