/**
 * SOMA aura: deterministic generative gradients (design-guideline v2 §9).
 * A seed (slug, name, id) always yields the same artwork, on the server and
 * on the client, so fallbacks never flicker or mismatch during hydration.
 */

export type AuraPalette = {
  /** base wash (light) */
  wash: string;
  /** three glow hues, layered as radial gradients */
  glows: [string, string, string];
  /** deep hue for marks and monograms on this palette */
  ink: string;
  /** dark artwork (night) */
  dark?: boolean;
};

/** Category palettes, keyed by category slug (mirrors --color-tone-* in tokens.css). */
export const CATEGORY_AURA: Record<string, AuraPalette> = {
  massage: { wash: "#fbf1ea", glows: ["#ffb99a", "#f59e86", "#b5a6ff"], ink: "#c76a4f" },
  manikuere: { wash: "#fbeff0", glows: ["#ffb3b8", "#ffcfa8", "#a9b4ff"], ink: "#c25a6c" },
  pedikuere: { wash: "#faf3e8", glows: ["#ffd19a", "#ffb08f", "#9fb0ff"], ink: "#b7791f" },
  kosmetik: { wash: "#eef5f2", glows: ["#a8dccb", "#a9bdff", "#ffd4be"], ink: "#2f8a72" },
  "make-up": { wash: "#f4f0fb", glows: ["#c3aeff", "#ffadc0", "#ffcba6"], ink: "#7c5ce0" },
  "haare-styling": { wash: "#faf2e6", glows: ["#ffc98a", "#f7a98e", "#b9b0ff"], ink: "#b26a1e" },
  "brows-lashes": { wash: "#eef0ff", glows: ["#6f7dff", "#a88cff", "#ffb7a0"], ink: "#3d4ff0" },
  nacht: { wash: "#151418", glows: ["#3d4ff0", "#7b5cf0", "#ff9e80"], ink: "#9aa6ff", dark: true },
};

/** Person palettes (avatars, portraits): blends of the brand aura. */
const PERSON_AURA: AuraPalette[] = [
  { wash: "#f1f2ff", glows: ["#8d99ff", "#c2b2ff", "#ffc4ae"], ink: "#3d4ff0" },
  { wash: "#fdf2ec", glows: ["#ffb79c", "#ffd8b8", "#b9abff"], ink: "#c76a4f" },
  { wash: "#f6f1fd", glows: ["#c6b3ff", "#ffb8c6", "#ffd6bb"], ink: "#7c5ce0" },
  { wash: "#eef6f3", glows: ["#a9dccc", "#a7b9ff", "#ffd7c0"], ink: "#2f8a72" },
  { wash: "#fbf4e9", glows: ["#ffcf94", "#ffae95", "#b7b1ff"], ink: "#b26a1e" },
  { wash: "#f0f4ff", glows: ["#93a6ff", "#9fdccb", "#ffc0a8"], ink: "#3d4ff0" },
];

/** FNV-1a 32-bit hash. */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG: deterministic, tiny. */
export function seededRandom(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function auraPalette(tone?: string | null, seed = ""): AuraPalette {
  if (tone && CATEGORY_AURA[tone]) return CATEGORY_AURA[tone];
  return PERSON_AURA[hashSeed(seed || tone || "soma") % PERSON_AURA.length];
}

function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${a.toFixed(2)})`;
}

const r2 = (n: number) => Math.round(n * 10) / 10;

export type AuraBlob = { x: number; y: number; w: number; h: number; color: string; opacity: number; rotate: number };

/**
 * Three glow blobs + one highlight, positioned by the seed. Positions keep
 * the glows spread across the frame (one per third) so every artwork has
 * depth, never a single muddy centre.
 */
export function auraBlobs(seed: string, palette: AuraPalette): AuraBlob[] {
  const rand = seededRandom(hashSeed(seed));
  const third = (i: number) => (i * 100) / 3;
  // Fisher–Yates with the seeded PRNG (a random sort comparator would differ between JS engines).
  const order = [0, 1, 2];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const blobs: AuraBlob[] = order.map((slot, i) => ({
    x: r2(third(slot) + 8 + rand() * 18),
    y: r2(10 + rand() * 80),
    w: r2(62 + rand() * 34),
    h: r2(58 + rand() * 34),
    color: palette.glows[i],
    opacity: palette.dark ? 0.55 + rand() * 0.2 : 0.72 + rand() * 0.22,
    rotate: Math.round(rand() * 360),
  }));
  blobs.push({
    x: r2(20 + rand() * 60),
    y: r2(rand() * 30),
    w: r2(50 + rand() * 30),
    h: r2(40 + rand() * 20),
    color: palette.dark ? "#ffffff" : "#ffffff",
    opacity: palette.dark ? 0.06 : 0.75,
    rotate: 0,
  });
  return blobs;
}

/** A single CSS background (layered radial gradients) for static artwork. */
export function auraBackground(seed: string, tone?: string | null): { backgroundColor: string; backgroundImage: string; base: string } {
  const palette = auraPalette(tone, seed);
  const blobs = auraBlobs(seed, palette);
  const rand = seededRandom(hashSeed(`${seed}:angle`));
  const angle = Math.round(rand() * 360);
  const layers = blobs
    .slice()
    .reverse()
    .map((b) => `radial-gradient(${b.w}% ${b.h}% at ${b.x}% ${b.y}%, ${alpha(b.color, b.opacity)} 0%, ${alpha(b.color, b.opacity * 0.35)} 38%, transparent 72%)`);
  const base = palette.dark
    ? `linear-gradient(${angle}deg, ${palette.wash}, #1d1b26)`
    : `linear-gradient(${angle}deg, ${palette.wash}, #ffffff)`;
  return { backgroundColor: palette.wash, backgroundImage: [...layers, base].join(", "), base };
}

/** CSS colour with alpha from a palette hex (for blob elements). */
export function auraColor(hex: string, a: number): string {
  return alpha(hex, a);
}
