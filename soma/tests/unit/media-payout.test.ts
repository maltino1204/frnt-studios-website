import { describe, expect, it } from "vitest";
import { sniffFileType, validateUpload } from "@/server/services/media";
import { payoutStateOf } from "@/server/services/pro";

const bytes = (...b: number[]) => new Uint8Array(b);

describe("upload validation (magic bytes, not the declared MIME type)", () => {
  it("recognises jpeg, png, webp and pdf", () => {
    expect(sniffFileType(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext).toBe("jpg");
    expect(sniffFileType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.ext).toBe("png");
    expect(sniffFileType(new TextEncoder().encode("RIFF1234WEBPVP8 "))?.ext).toBe("webp");
    expect(sniffFileType(new TextEncoder().encode("%PDF-1.7"))?.ext).toBe("pdf");
    expect(sniffFileType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });
  it("enforces kind and size limits", () => {
    const pdf = { fileName: "a.pdf", contentType: "image/jpeg", bytes: new TextEncoder().encode("%PDF-1.4 x") };
    expect(validateUpload(pdf, "document").mime).toBe("application/pdf");
    expect(() => validateUpload(pdf, "image")).toThrow(/JPG, PNG oder WebP/);
    const huge = { fileName: "b.jpg", contentType: "image/jpeg", bytes: new Uint8Array(8 * 1024 * 1024 + 1) };
    huge.bytes.set([0xff, 0xd8, 0xff]);
    expect(() => validateUpload(huge, "image")).toThrow(/maximal 8 MB/);
    expect(() => validateUpload({ ...pdf, bytes: new Uint8Array() }, "document")).toThrow(/leer/);
  });
});

describe("payout state (48 h hold, disputes, paid out)", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  const done = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3_600_000);
  it("is pending for 48 h after completion, then available", () => {
    expect(payoutStateOf({ status: "completed", completedAt: done(47), cancelledAt: null, payoutId: null }, false, 48, now).state).toBe("pending");
    expect(payoutStateOf({ status: "completed", completedAt: done(48), cancelledAt: null, payoutId: null }, false, 48, now)).toEqual({ state: "available", availableAt: done(0).toISOString() });
  });
  it("stays pending while disputed and becomes paid_out once in a payout", () => {
    expect(payoutStateOf({ status: "completed", completedAt: done(100), cancelledAt: null, payoutId: null }, true, 48, now).state).toBe("pending");
    expect(payoutStateOf({ status: "completed", completedAt: done(100), cancelledAt: null, payoutId: "po" }, true, 48, now).state).toBe("paid_out");
  });
  it("uses the cancellation time for retained fees", () => {
    expect(payoutStateOf({ status: "cancelled", completedAt: null, cancelledAt: done(72), payoutId: null }, false, 48, now).state).toBe("available");
  });
});
