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
