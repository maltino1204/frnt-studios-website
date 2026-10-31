import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge (v3, Tailwind v4 syntax) taught SOMA's token scales, so a
 * later class wins over a conflicting earlier one: cn("inline-flex", "hidden")
 * → "hidden", cn("rounded-full", "rounded-card") → "rounded-card".
 * Important overrides (`h-5!`) are kept alongside the base class and win in CSS.
 * Custom utilities (type-*, glass, pressable, num, …) are passed through untouched.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["xs", "control", "tile", "card", "panel", "sheet"],
      shadow: ["hairline", "raised", "float", "overlay", "modal", "sheet", "bar", "press", "ink", "accent", "aura"],
      "inset-shadow": ["field", "sunken"],
      spacing: ["touch", "control", "control-s", "control-l"],
      container: ["reading", "form", "sheet", "content", "page", "dashboard"],
      text: [
        "display-xl", "display-l", "display-m", "display-s",
        "heading-l", "heading-m", "heading-s",
        "body-l", "body", "body-s", "label", "label-s", "caption", "overline", "stat",
      ],
      font: ["sans", "display", "accent", "mono"],
      "font-weight": ["regular", "label", "strong"],
      blur: ["glass"],
      ease: ["standard", "enter", "exit", "calm", "ambient", "spring", "settle"],
      animate: [
        "skeleton", "spin", "fade-in", "sheet-in", "dialog-in", "toast-in", "pop", "settle", "rise", "draw",
        "aura-drift", "aura-drift-2", "aura-breathe", "float", "float-in",
      ],
    },
    classGroups: {
      duration: [{ duration: ["instant", "fast", "base", "slow", "spring", "calm"] }],
      // bg-aura / bg-aura-soft are gradients (background-image), not colours.
      "bg-image": [{ bg: ["aura", "aura-soft"] }],
    },
  },
});

/** Compose class names; conflicting Tailwind classes resolve to the last one. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
