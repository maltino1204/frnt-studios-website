import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";

describe("cn (tailwind-merge with SOMA tokens)", () => {
  it("lets a later display class override a component's display", () => {
    expect(cn("inline-flex items-center", "hidden")).toBe("items-center hidden");
    expect(cn("inline-flex size-touch", "hidden sm:inline-flex")).toBe("size-touch hidden sm:inline-flex");
  });

  it("resolves SOMA radius, shadow, spacing and container scales", () => {
    expect(cn("rounded-full", "rounded-card")).toBe("rounded-card");
    expect(cn("rounded-control", "rounded-tile")).toBe("rounded-tile");
    expect(cn("shadow-raised", "shadow-float")).toBe("shadow-float");
    expect(cn("shadow-ink", "shadow-[0_1px_2px_red]")).toBe("shadow-[0_1px_2px_red]");
    expect(cn("h-control", "h-12")).toBe("h-12");
    expect(cn("size-touch", "size-8")).toBe("size-8");
    expect(cn("max-w-reading", "max-w-form")).toBe("max-w-form");
    expect(cn("duration-fast", "duration-spring")).toBe("duration-spring");
  });

  it("keeps text colour and SOMA font sizes apart", () => {
    expect(cn("text-ink", "text-body-s")).toBe("text-ink text-body-s");
    expect(cn("text-ink", "text-ink-muted")).toBe("text-ink-muted");
    expect(cn("text-ink", "text-[15px]")).toBe("text-ink text-[15px]");
  });

  it("treats the aura gradient as a background image, not a colour", () => {
    expect(cn("bg-surface-raised", "bg-aura")).toBe("bg-surface-raised bg-aura");
    expect(cn("bg-surface", "bg-surface-sunken")).toBe("bg-surface-sunken");
  });

  it("keeps important overrides next to the base class", () => {
    expect(cn("h-6 px-2.5 type-label-s", "h-5! px-2! type-caption!")).toBe("h-6 px-2.5 type-label-s h-5! px-2! type-caption!");
    expect(cn("w-5", "h-[18px]! w-auto")).toBe("h-[18px]! w-auto");
  });

  it("passes custom utilities through untouched", () => {
    expect(cn("type-heading-m glass glass-edge pressable focus-ring num")).toBe("type-heading-m glass glass-edge pressable focus-ring num");
  });
});
