import "server-only";

import postgres from "postgres";
import { getConfig } from "../config";

/**
 * Database access (docs/architecture.md §3.1).
 *
 * One pooled connection as the database owner. Request-scoped work runs inside
 * a transaction that drops privileges exactly like Supabase/PostgREST does:
 *
 *   withUser(userId, fn)  SET LOCAL ROLE authenticated + request.jwt.claims.sub
 *   withAnon(fn)          SET LOCAL ROLE anon
 *   withService(fn)       owner privileges (bypasses RLS) — only for the system
 *                         use cases listed in the architecture; every call site
 *                         carries a comment explaining why.
 *
 * Column names are converted snake_case → camelCase in results.
 */

export type Sql = postgres.Sql;
export type Tx = postgres.TransactionSql;
/** Anything that can run tagged-template queries (pool or transaction). */
export type Queryable = postgres.Sql | postgres.TransactionSql;
/** A composable SQL fragment (tx`…` used inside another query). */
export type Fragment = postgres.PendingQuery<postgres.Row[]>;

declare global {
  var __somaSql: postgres.Sql | undefined;
}

function createPool(): postgres.Sql {
  const cfg = getConfig();
  return postgres(process.env.DATABASE_URL ?? cfg.DATABASE_URL, {
    max: cfg.DATABASE_POOL_MAX,
    idle_timeout: 20,
    connect_timeout: 10,
    // Supabase's transaction pooler (port 6543) does not support prepared statements.
    prepare: cfg.DATABASE_PREPARE,
    onnotice: () => undefined,
    // Column names only: JSON values (e.g. cancellation_policy) keep their snake_case keys.
    transform: { column: { from: postgres.toCamel, to: postgres.fromCamel }, undefined: null },
    connection: { application_name: "soma-web" },
  });
}

/** Singleton pool, reused across Next.js dev hot reloads. */
export function getSql(): postgres.Sql {
  if (!globalThis.__somaSql) globalThis.__somaSql = createPool();
  return globalThis.__somaSql;
}

/** Closes the pool (scripts/tests). */
export async function closeSql(): Promise<void> {
  const s = globalThis.__somaSql;
  globalThis.__somaSql = undefined;
  if (s) await s.end({ timeout: 5 });
}

async function inTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return (await getSql().begin((tx) => fn(tx))) as T;
}

export async function withUser<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return inTransaction(async (tx) => {
    const claims = JSON.stringify({ sub: userId, role: "authenticated" });
    await tx`select set_config('request.jwt.claims', ${claims}, true), set_config('role', 'authenticated', true)`;
    return fn(tx);
  });
}

export async function withAnon<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return inTransaction(async (tx) => {
    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ role: "anon" })}, true), set_config('role', 'anon', true)`;
    return fn(tx);
  });
}

/** Runs as the reader: `withUser` when a user id is given, otherwise `withAnon`. */
export async function withViewer<T>(userId: string | null | undefined, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return userId ? withUser(userId, fn) : withAnon(fn);
}

export async function withService<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return inTransaction(fn);
}

export interface ActorContext {
  actorId: string | null;
  actorRole: "customer" | "provider" | "admin" | "system";
  note?: string | null;
}

/** Sets transaction-local actor info picked up by booking/provider event triggers. */
export async function setActor(tx: Tx, actor: ActorContext): Promise<void> {
  await tx`
    select set_config('soma.actor_id', ${actor.actorId ?? ""}, true),
           set_config('soma.actor_role', ${actor.actorRole}, true),
           set_config('soma.event_note', ${actor.note ?? ""}, true)`;
}
