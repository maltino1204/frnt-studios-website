/**
 * Category tones (brand/BRAND_GUIDELINES.md § 3.7 and § 5.4): flat warm washes that replace the v2 aura palettes.
 * They differ in temperature, not in hue; the ink is always Espresso (Bone on "nacht"). The values live in
 * tokens.css (--color-tone-*); this module only picks the key, deterministically, so server and client agree.
 */

export const TONE_KEYS = ["massage", "manikuere", "pedikuere", "kosmetik", "make-up", "haare-styling", "brows-lashes"] as const;
export type ToneKey = (typeof TONE_KEYS)[number] | "nacht";

const KNOWN = new Set<string>([...TONE_KEYS, "nacht"]);

/** FNV-1a 32-bit hash: the same seed always yields the same tone (no hydration mismatch). */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A category slug as-is; anything else (a person, a city) gets a seeded wash from the seven categories. */
export function toneKey(tone?: string | null, seed = ""): ToneKey {
  if (tone && KNOWN.has(tone)) return tone as ToneKey;
  return TONE_KEYS[hashSeed(seed || tone || "soma") % TONE_KEYS.length];
}

/** Inline style for a tone fill: the wash as background, its ink as text colour. */
export function toneStyle(key: ToneKey): { backgroundColor: string; color: string } {
  return { backgroundColor: `var(--color-tone-${key})`, color: `var(--color-tone-${key}-ink)` };
}
