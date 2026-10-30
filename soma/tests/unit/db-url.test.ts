import { describe, expect, it } from "vitest";
import { normalizeDatabaseUrl } from "@/server/db/url";

describe("normalizeDatabaseUrl (hosted Postgres)", () => {
  it("drops channel_binding from a Neon connection string and keeps sslmode", () => {
    const url = normalizeDatabaseUrl("postgresql://neondb_owner:abc123@ep-x-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
    expect(url).toBe("postgresql://neondb_owner:abc123@ep-x-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require");
  });

  it("leaves other URLs untouched", () => {
    expect(normalizeDatabaseUrl("postgres://soma:soma@localhost:5432/soma")).toBe("postgres://soma:soma@localhost:5432/soma");
    expect(normalizeDatabaseUrl("not a url")).toBe("not a url");
  });
});
