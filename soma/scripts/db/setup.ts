/**
 * npm run db:setup [-- --reset]
 *
 * Applies the local Supabase shim (AUTH_PROVIDER=local only), all migrations
 * (tracked in soma_meta.schema_migrations) and the base seed.
 * --reset drops the SOMA schemas first and is refused for Supabase setups.
 */
import postgres from "postgres";
import { normalizeDatabaseUrl, usePreparedStatements } from "../../src/server/db/url";
import { applyBaseSeed } from "./lib/base-seed";
import { applySchema } from "./lib/migrate";

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const reset = args.has("--reset");
  const url = process.env.DATABASE_URL ?? "postgres://soma:soma@localhost:5432/soma";
  const authProvider = process.env.AUTH_PROVIDER ?? "local";

  if (reset && authProvider !== "local" && !args.has("--force")) {
    throw new Error("--reset ist nur für lokale Datenbanken erlaubt (AUTH_PROVIDER=local).");
  }
  // --reset drops whole schemas: never against a hosted database (Neon, Supabase) by accident.
  const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
  if (reset && !["localhost", "127.0.0.1", "::1", "[::1]"].includes(host) && !args.has("--force")) {
    throw new Error(`--reset ist nur für lokale Datenbanken erlaubt (Host: ${host || "unbekannt"}).`);
  }

  const sql = postgres(normalizeDatabaseUrl(url), { max: 1, prepare: usePreparedStatements(), onnotice: () => undefined });
  const log = (m: string) => console.log(`[db:setup] ${m}`);
  try {
    const applied = await applySchema(sql, { reset, applyShim: authProvider === "local", log });
    log(applied.length ? `Applied migrations: ${applied.join(", ")}` : "Schema up to date.");
    await applyBaseSeed(sql, log);
  } finally {
    await sql.end();
  }
}

main().catch((err: unknown) => {
  console.error("[db:setup] failed:", err);
  process.exit(1);
});
