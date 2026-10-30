import { describe, expect, it } from "vitest";
import { clientIpFrom, isIpAddress, UNKNOWN_IP } from "@/server/auth/client-ip";
import { loginBackoffSeconds } from "@/server/auth/rate-limit";
import { safeRelativePath } from "@/server/auth/redirect";

const APP = "https://soma.example";
const safe = (next: unknown) => safeRelativePath(next, APP);

describe("safeRelativePath (audit-1 R2)", () => {
  it("accepts same-origin relative paths and keeps query and hash", () => {
    expect(safe("/konto")).toBe("/konto");
    expect(safe("/konto/buchungen?tab=vergangen#b1")).toBe("/konto/buchungen?tab=vergangen#b1");
    expect(safe("/buchen/anna-k?leistung=1&datum=2026-11-10")).toBe("/buchen/anna-k?leistung=1&datum=2026-11-10");
    expect(safe("/")).toBe("/");
  });

  it("normalises dot segments without leaving the origin", () => {
    expect(safe("/konto/../pro")).toBe("/pro");
    expect(safe("/../../etc")).toBe("/etc");
  });

  it("rejects protocol-relative and backslash variants", () => {
    for (const v of ["//evil.example", "//evil.example/konto", "/\\evil.example", "/\\/evil.example", "\\\\evil.example", "/konto\\..\\x"]) {
      expect(safe(v), v).toBeNull();
    }
  });

  it("rejects control characters, raw and percent-encoded (%09 %0A %0D)", () => {
    for (const v of ["/\t/evil.example", "/\n/evil.example", "/\r/evil.example", "/%09/evil.example", "/%0A/evil.example", "/%0d/evil.example", "/%5C/evil.example", "/konto\u0000", "/x\u007f"]) {
      expect(safe(v), JSON.stringify(v)).toBeNull();
    }
  });

  it("rejects absolute URLs and scheme tricks", () => {
    for (const v of ["https://evil.example", "https:evil.example", "http://soma.example/konto", "javascript:alert(1)", "JavaScript:alert(1)", "data:text/html,x", "konto", " /konto", ""]) {
      expect(safe(v), v).toBeNull();
    }
  });

  it("rejects non-strings and oversized values", () => {
    expect(safe(undefined)).toBeNull();
    expect(safe(null)).toBeNull();
    expect(safe(42)).toBeNull();
    expect(safe(["/konto"])).toBeNull();
    expect(safe(`/${"a".repeat(2100)}`)).toBeNull();
  });
});

describe("clientIpFrom (audit-1 R6)", () => {
  const headers = (h: Record<string, string>) => (name: string) => h[name] ?? null;

  it("ignores X-Forwarded-For with 0 trusted hops and uses x-real-ip", () => {
    expect(clientIpFrom(headers({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "203.0.113.7" }), 0)).toBe("203.0.113.7");
    expect(clientIpFrom(headers({ "x-forwarded-for": "6.6.6.6" }), 0)).toBe(UNKNOWN_IP);
    expect(clientIpFrom(headers({}), 0)).toBe(UNKNOWN_IP);
    expect(clientIpFrom(headers({ "x-real-ip": "not-an-ip" }), 0)).toBe(UNKNOWN_IP);
  });

  it("takes the N-th entry from the right with N trusted hops (spoofed left entries are ignored)", () => {
    const xff = { "x-forwarded-for": "6.6.6.6, 198.51.100.4, 10.0.0.2" };
    expect(clientIpFrom(headers(xff), 1)).toBe("10.0.0.2");
    expect(clientIpFrom(headers(xff), 2)).toBe("198.51.100.4");
    expect(clientIpFrom(headers(xff), 3)).toBe("6.6.6.6");
    expect(clientIpFrom(headers(xff), 4)).toBe(UNKNOWN_IP);
    expect(clientIpFrom(headers({ "x-forwarded-for": "evil, 2001:db8::1" }), 1)).toBe("2001:db8::1");
    expect(clientIpFrom(headers({ "x-forwarded-for": "evil, 2001:db8::1" }), 2)).toBe(UNKNOWN_IP);
  });

  it("validates addresses", () => {
    expect(isIpAddress("192.168.0.1")).toBe(true);
    expect(isIpAddress("256.1.1.1")).toBe(false);
    expect(isIpAddress("::1")).toBe(true);
    expect(isIpAddress("unknown")).toBe(false);
  });
});

describe("loginBackoffSeconds (audit-1 R6)", () => {
  it("lets the first retry through and then doubles up to 60 s", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(loginBackoffSeconds)).toEqual([0, 0, 2, 4, 8, 16, 32, 60, 60]);
  });
});
