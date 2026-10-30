import { describe, expect, it } from "vitest";
import { clientIpFrom, ipTrustConfigured, isIpAddress, UNKNOWN_IP } from "@/server/auth/client-ip";
import { GLOBAL_FAILURE_BUDGET, globalLoginDelayMs, loginBackoffSeconds } from "@/server/auth/rate-limit";
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

  it("rejects dot segments that collapse into a protocol-relative path (audit-3 F1)", () => {
    for (const v of ["/.//evil.example", "/.//evil.example/phish", "/a/..//evil.example", "/%2E//evil.example", "/%2e%2e//evil.example", "/./%2Fevil.example", "/x/../%2fevil"]) {
      expect(safe(v), v).toBeNull();
    }
    expect(safe("/./konto")).toBe("/konto");
    expect(safe("/a/../konto?tab=1")).toBe("/konto?tab=1");
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

describe("clientIpFrom (audit-1 R6, audit-2 N2)", () => {
  const headers = (h: Record<string, string>) => (name: string) => h[name] ?? null;

  it("uses no client-supplied header at all when neither a trusted header nor hops are configured", () => {
    const spoofed = { "x-forwarded-for": "6.6.6.6", "x-real-ip": "203.0.113.7", "cf-connecting-ip": "198.51.100.9", "x-vercel-forwarded-for": "198.51.100.10" };
    expect(clientIpFrom(headers(spoofed), {})).toBe(UNKNOWN_IP);
    expect(clientIpFrom(headers(spoofed), { hops: 0, header: null })).toBe(UNKNOWN_IP);
    expect(clientIpFrom(headers(spoofed), { header: "" })).toBe(UNKNOWN_IP);
    expect(ipTrustConfigured({})).toBe(false);
    expect(ipTrustConfigured({ hops: 0, header: "" })).toBe(false);
  });

  it("rotating X-Real-IP values never create separate buckets without explicit trust", () => {
    const ips = ["198.51.100.1", "198.51.100.2", "198.51.100.3"].map((ip) => clientIpFrom(headers({ "x-real-ip": ip }), { hops: 0 }));
    expect(new Set(ips)).toEqual(new Set([UNKNOWN_IP]));
  });

  it("reads only the configured platform header (first entry, ports stripped)", () => {
    const h = { "x-vercel-forwarded-for": "203.0.113.7", "x-real-ip": "6.6.6.6", "x-forwarded-for": "6.6.6.6" };
    expect(clientIpFrom(headers(h), { header: "x-vercel-forwarded-for" })).toBe("203.0.113.7");
    expect(clientIpFrom(headers(h), { header: "X-Vercel-Forwarded-For", hops: 2 })).toBe("203.0.113.7");
    expect(clientIpFrom(headers({ "cf-connecting-ip": "2001:db8::7" }), { header: "cf-connecting-ip" })).toBe("2001:db8::7");
    expect(clientIpFrom(headers({ "x-real-ip": "203.0.113.8:4711" }), { header: "x-real-ip" })).toBe("203.0.113.8");
    expect(clientIpFrom(headers({ "x-real-ip": "[2001:db8::1]:443" }), { header: "x-real-ip" })).toBe("2001:db8::1");
    expect(clientIpFrom(headers({ "x-real-ip": "203.0.113.9, 10.0.0.1" }), { header: "x-real-ip" })).toBe("203.0.113.9");
    expect(clientIpFrom(headers({}), { header: "cf-connecting-ip" })).toBe(UNKNOWN_IP);
    expect(clientIpFrom(headers({ "cf-connecting-ip": "not-an-ip" }), { header: "cf-connecting-ip" })).toBe(UNKNOWN_IP);
    expect(clientIpFrom(headers(h), { header: "bad header!" })).toBe(UNKNOWN_IP);
    expect(ipTrustConfigured({ header: "cf-connecting-ip" })).toBe(true);
  });

  it("takes the N-th X-Forwarded-For entry from the right with N trusted hops (spoofed left entries are ignored)", () => {
    const xff = { "x-forwarded-for": "6.6.6.6, 198.51.100.4, 10.0.0.2", "x-real-ip": "6.6.6.6" };
    expect(clientIpFrom(headers(xff), { hops: 1 })).toBe("10.0.0.2");
    expect(clientIpFrom(headers(xff), { hops: 2 })).toBe("198.51.100.4");
    expect(clientIpFrom(headers(xff), { hops: 3 })).toBe("6.6.6.6");
    expect(clientIpFrom(headers(xff), { hops: 4 })).toBe(UNKNOWN_IP);
    expect(clientIpFrom(headers({ "x-forwarded-for": "evil, 2001:db8::1" }), { hops: 1 })).toBe("2001:db8::1");
    expect(clientIpFrom(headers({ "x-forwarded-for": "evil, 2001:db8::1" }), { hops: 2 })).toBe(UNKNOWN_IP);
    expect(ipTrustConfigured({ hops: 1 })).toBe(true);
  });

  it("validates addresses", () => {
    expect(isIpAddress("192.168.0.1")).toBe(true);
    expect(isIpAddress("256.1.1.1")).toBe(false);
    expect(isIpAddress("::1")).toBe(true);
    expect(isIpAddress("unknown")).toBe(false);
  });
});

describe("global login failure budget (audit-2 N2)", () => {
  it("adds no delay up to 200 failures, then 1–3 s progressively", () => {
    expect(globalLoginDelayMs(0)).toBe(0);
    expect(globalLoginDelayMs(GLOBAL_FAILURE_BUDGET)).toBe(0);
    expect(globalLoginDelayMs(201)).toBe(1000);
    expect(globalLoginDelayMs(300)).toBe(1000);
    expect(globalLoginDelayMs(301)).toBe(2000);
    expect(globalLoginDelayMs(401)).toBe(3000);
    expect(globalLoginDelayMs(50_000)).toBe(3000);
  });
});

describe("loginBackoffSeconds (audit-1 R6)", () => {
  it("lets the first retry through and then doubles up to 60 s", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(loginBackoffSeconds)).toEqual([0, 0, 2, 4, 8, 16, 32, 60, 60]);
  });
});
