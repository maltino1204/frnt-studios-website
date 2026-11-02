import { describe, expect, it } from "vitest";
import sources from "../../scripts/images/sources.json";
import { avatarImagePath, avatarPathIn, currentImagePath, resolveAvatar, resolveImage } from "@/lib/images";

describe("avatar crops for small portraits (review R7)", () => {
  const registry = new Map([
    ["/images/pros/pro-01.jpg", { replacedBy: "/images/pros/pro-01-v2.jpg" }],
    ["/images/pros/pro-01-v2.jpg", { replacedBy: "/images/pros/pro-01-v4.jpg" }],
    ["/images/pros/pro-01-v4.jpg", { avatar: "/images/pros/pro-01-v4-face.jpg" }],
    ["/images/pros/pro-02-v4.jpg", {}],
  ]);

  it("follows replacedBy, then uses the entry's avatar", () => {
    expect(avatarPathIn(registry, "/images/pros/pro-01.jpg")).toBe("/images/pros/pro-01-v4-face.jpg");
    expect(avatarPathIn(registry, "/images/pros/pro-01-v4.jpg")).toBe("/images/pros/pro-01-v4-face.jpg");
  });
  it("falls back to the image itself while no crop is registered", () => {
    expect(avatarPathIn(registry, "/images/pros/pro-02-v4.jpg")).toBe("/images/pros/pro-02-v4.jpg");
    expect(avatarPathIn(registry, "/images/pros/unknown.jpg")).toBe("/images/pros/unknown.jpg");
  });
  it("passes uploads and remote URLs through, and works on the real registry", () => {
    expect(avatarImagePath(null)).toBeNull();
    expect(avatarImagePath("/api/media/avatars/x/y.jpg")).toBe("/api/media/avatars/x/y.jpg");
    expect(resolveAvatar("https://example.org/p.jpg")).toBe("https://example.org/p.jpg");
    // the real registry: the registered crop of the current portrait, or the current portrait until one exists
    const current = currentImagePath("/images/pros/pro-01.jpg");
    const entry = (sources as Array<{ path: string; avatar?: string }>).find((e) => e.path === current);
    expect(avatarImagePath("/images/pros/pro-01.jpg")).toBe(entry?.avatar || current);
    if (!entry?.avatar) expect(resolveAvatar("/images/pros/pro-01.jpg")).toBe(resolveImage("/images/pros/pro-01.jpg"));
  });
});
