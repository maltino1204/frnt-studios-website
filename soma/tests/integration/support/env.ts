/** Per-test-file environment: point the app pool at the test database. */
import { afterAll } from "vitest";

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://soma:soma@localhost:5432/soma_test";
process.env.AUTH_PROVIDER = "local";
process.env.PAYMENTS_PROVIDER = "dev";
process.env.STORAGE_PROVIDER = "local";
process.env.EMAIL_PROVIDER = "dev";
process.env.DATABASE_POOL_MAX = "8";
process.env.UPLOAD_DIR = ".data/test-uploads";

afterAll(async () => {
  const { closeSql } = await import("@/server/db/client");
  await closeSql();
});
