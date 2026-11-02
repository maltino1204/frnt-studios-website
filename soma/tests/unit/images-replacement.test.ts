import { describe, expect, it } from "vitest";
import { currentImagePath, resolveImage } from "@/lib/images";

describe("image replacement chain", () => {
  it("follows v1 → v2 → v3 → v4 for Selin's portrait", () => {
    expect(currentImagePath("/images/pros/pro-01.jpg")).toBe("/images/pros/pro-01-v4.jpg");
    expect(resolveImage("/images/pros/pro-01.jpg")).toBe("/images/pros/pro-01-v4.jpg");
  });

  it("leaves unknown and remote paths alone", () => {
    expect(currentImagePath("/images/does-not-exist.jpg")).toBe("/images/does-not-exist.jpg");
    expect(resolveImage("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
  });
});

describe("avatar crop lookup", () => {
  it("follows a chain longer than three hops and then uses the avatar crop", async () => {
    const { avatarPathIn } = await import("@/lib/images");
    const reg = new Map<string, { replacedBy?: string; avatar?: string }>([
      ["/a1.jpg", { replacedBy: "/a2.jpg" }],
      ["/a2.jpg", { replacedBy: "/a3.jpg" }],
      ["/a3.jpg", { replacedBy: "/a4.jpg" }],
      ["/a4.jpg", { replacedBy: "/a5.jpg" }],
      ["/a5.jpg", { avatar: "/a5-face.jpg" }],
    ]);
    expect(avatarPathIn(reg, "/a1.jpg")).toBe("/a5-face.jpg");
  });

  it("never loops on a cycle", async () => {
    const { avatarPathIn } = await import("@/lib/images");
    const reg = new Map([["/x.jpg", { replacedBy: "/y.jpg" }], ["/y.jpg", { replacedBy: "/x.jpg" }]]);
    expect(["/x.jpg", "/y.jpg"]).toContain(avatarPathIn(reg, "/x.jpg"));
  });
});
