/**
 * Connection settings shared by the app (db/client.ts) and the db scripts.
 *
 * Hosted poolers (Neon, Supabase) reject startup parameters they don't know. postgres.js sends
 * unknown URL query parameters as startup parameters, so `channel_binding` (part of Neon's
 * default connection string) is dropped here; `sslmode` is understood by postgres.js itself.
 */
export function normalizeDatabaseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.searchParams.delete("channel_binding");
    return url.toString();
  } catch {
    return raw;
  }
}

/** DATABASE_PREPARE=false for transaction-mode poolers without prepared-statement support. */
export const usePreparedStatements = (): boolean => process.env.DATABASE_PREPARE !== "false";
