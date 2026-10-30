/**
 * Schema runner shared by `npm run db:setup` and the integration-test global setup.
 *
 * 1. optional reset (drops the SOMA schemas; local databases only)
 * 2. the local Supabase shim (AUTH_PROVIDER=local only)
 * 3. supabase/migrations/*.sql in lexical order, tracked in soma_meta.schema_migrations
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type postgres from "postgres";

export const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const SHIM = path.join(ROOT, "supabase", "local", "000_supabase_shim.sql");
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");

export interface ApplySchemaOptions {
  reset?: boolean;
  applyShim: boolean;
  log?: (msg: string) => void;
}

function checksum(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export async function resetDatabase(sql: postgres.Sql): Promise<void> {
  await sql
    .unsafe(
      `drop schema if exists public cascade;
       drop schema if exists soma_meta cascade;
       drop schema if exists app_private cascade;
       drop schema if exists auth cascade;
       drop schema if exists extensions cascade;
       create schema public;
       grant usage on schema public to public;`,
    )
    .simple();
}

export async function applySchema(sql: postgres.Sql, opts: ApplySchemaOptions): Promise<string[]> {
  const log = opts.log ?? (() => undefined);
  if (opts.reset) {
    log("Reset: dropping SOMA schemas …");
    await resetDatabase(sql);
  }

  if (opts.applyShim) {
    log("Applying local Supabase shim …");
    await sql.unsafe(await readFile(SHIM, "utf8")).simple();
  }

  await sql
    .unsafe(
      `create schema if not exists soma_meta;
       create table if not exists soma_meta.schema_migrations (
         version text primary key,
         checksum text not null,
         applied_at timestamptz not null default now()
       );`,
    )
    .simple();

  const applied = new Map<string, string>(
    (await sql<{ version: string; checksum: string }[]>`select version, checksum from soma_meta.schema_migrations`).map(
      (r) => [r.version, r.checksum],
    ),
  );

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
  const newlyApplied: string[] = [];
  for (const file of files) {
    const content = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    const sum = checksum(content);
    const prev = applied.get(file);
    if (prev) {
      if (prev !== sum) log(`WARNUNG: ${file} wurde nach dem Anwenden geändert (Checksumme weicht ab).`);
      continue;
    }
    log(`Applying ${file} …`);
    await sql.begin(async (tx) => {
      await tx.unsafe(content).simple();
      await tx`insert into soma_meta.schema_migrations (version, checksum) values (${file}, ${sum})`;
    });
    newlyApplied.push(file);
  }
  return newlyApplied;
}
