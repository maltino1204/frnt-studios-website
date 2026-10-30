/**
 * Integration tests: rebuild the test database once per run
 * (drop SOMA schemas → local shim → migrations → base seed).
 */
import postgres from "postgres";
import { applyBaseSeed } from "../../../scripts/db/lib/base-seed";
import { applySchema } from "../../../scripts/db/lib/migrate";

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://soma:soma@localhost:5432/soma_test";

export default async function setup(): Promise<void> {
  const dbName = new URL(TEST_DATABASE_URL).pathname.replace(/^\//, "");
  if (!dbName.endsWith("_test")) {
    throw new Error(`Refusing to reset "${dbName}": TEST_DATABASE_URL must point to a database whose name ends with _test.`);
  }
  const sql = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => undefined });
  try {
    await applySchema(sql, { reset: true, applyShim: true });
    await applyBaseSeed(sql);
  } finally {
    await sql.end();
  }
}
