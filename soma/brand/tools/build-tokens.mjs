// Writes brand/DESIGN_TOKENS/tokens.json (W3C design tokens), tokens.css (Tailwind v4 drop-in for
// src/styles/tokens.css) and contrast.json + contrast.md (every text/background and UI pair).
import fs from "node:fs";
import path from "node:path";
import * as T from "./tokens-source.mjs";
import { contrast, over, hex2rgb } from "./lib/contrast.mjs";

const OUT = new URL("../DESIGN_TOKENS/", import.meta.url).pathname;
const P = T.P;
const col = (v) => (P[v] ? P[v] : v);
const ref = (v) => (P[v] ? `{color.primitive.${v}}` : v);
const rem = (px) => `${+(px / 16).toFixed(4)}rem`;
/** Fluid size between 360 and 1440 px viewport. */
export function fluid(min, max) {
  if (min === max) return rem(min);
  const slope = (max - min) / (1440 - 360);
  const b = min - slope * 360;
  return `clamp(${rem(min)}, ${+(b / 16).toFixed(4)}rem + ${+(slope * 100).toFixed(4)}vw, ${rem(max)})`;
}

/* ------------------------------------------------------------------ tokens.json (DTCG) */
function json() {
  const t = { $description: "SOMA design tokens v3 (brand identity 2026). Source: brand/tools/tokens-source.mjs", color: { primitive: {}, semantic: {}, feedback: {}, night: {}, tone: {}, chart: {} } };
  for (const [k, v] of Object.entries(T.primitives)) t.color.primitive[k] = { $type: "color", $value: v.value, ...(v.note ? { $description: v.note } : {}) };
  for (const [group, entries] of Object.entries(T.semantic)) {
    t.color.semantic[group] = {};
    for (const [k, [v, d]] of Object.entries(entries)) t.color.semantic[group][k] = { $type: "color", $value: ref(v), ...(d ? { $description: d } : {}) };
  }
  for (const [k, f] of Object.entries(T.feedback)) t.color.feedback[k] = { fg: { $type: "color", $value: ref(f.fg) }, bg: { $type: "color", $value: ref(f.bg) }, border: { $type: "color", $value: ref(f.border) }, $description: `Always with the ${f.icon} icon and a word (e.g. „${f.word}“)` };
  for (const [k, v] of Object.entries(T.night)) t.color.night[k] = { $type: "color", $value: ref(v) };
  for (const [k, [wash, ink]] of Object.entries(T.tones)) t.color.tone[k] = { wash: { $type: "color", $value: wash }, ink: { $type: "color", $value: ref(ink) } };
  T.chart.forEach((c, i) => (t.color.chart[String(i + 1)] = { $type: "color", $value: ref(c) }));
  t.font = { family: {}, weight: { regular: { $type: "fontWeight", $value: 400 }, label: { $type: "fontWeight", $value: 540 }, button: { $type: "fontWeight", $value: 560 }, strong: { $type: "fontWeight", $value: 600 } } };
  for (const [k, f] of Object.entries(T.fonts)) t.font.family[k] = { $type: "fontFamily", $value: f.stack, $description: `${f.files} · ${f.licence}` };
  t.typography = {};
  for (const [k, [min, max, lh, tr, w, fam, note]] of Object.entries(T.type)) {
    t.typography[k] = {
      $type: "typography",
      $value: { fontFamily: `{font.family.${fam}}`, fontSize: fluid(min, max), fontWeight: w, lineHeight: lh, letterSpacing: `${tr}em` },
      $description: `${min}→${max} px (360→1440 viewport). ${note}`,
    };
  }
  // DTCG tools (Tokens Studio, Style Dictionary) cannot read clamp(): the endpoints as plain dimensions
  t.dimension = { space: {}, radius: {}, breakpoint: {}, container: {}, fontSize: {} };
  for (const [k, [min, max]] of Object.entries(T.type)) t.dimension.fontSize[k] = { min: { $type: "dimension", $value: `${min}px`, $description: "at 360 px viewport" }, max: { $type: "dimension", $value: `${max}px`, $description: "at 1440 px viewport" } };
  for (const [k, v] of Object.entries(T.space)) t.dimension.space[k] = { $type: "dimension", $value: `${v}px` };
  for (const [k, v] of Object.entries(T.radii)) t.dimension.radius[k] = { $type: typeof v === "number" ? "dimension" : "string", $value: typeof v === "number" ? `${v}px` : v };
  for (const [k, v] of Object.entries(T.breakpoints)) t.dimension.breakpoint[k] = { $type: "dimension", $value: `${v}px` };
  for (const [k, v] of Object.entries(T.grid.container)) t.dimension.container[k] = { $type: "dimension", $value: `${v}px` };
  t.grid = {};
  for (const k of ["mobile", "tablet", "desktop"]) t.grid[k] = { $type: "object", $value: T.grid[k] };
  t.shadow = {};
  for (const k of ["hairline", "raised", "float", "overlay"]) t.shadow[k] = { $type: "shadow", $value: T.shadow[k] };
  t.motion = { duration: {}, easing: {} };
  for (const [k, v] of Object.entries(T.motion.duration)) t.motion.duration[k] = { $type: "duration", $value: `${v}ms` };
  for (const [k, v] of Object.entries(T.motion.easing)) t.motion.easing[k] = { $type: "cubicBezier", $value: v.match(/[\d.]+/g).map(Number) };
  t.zIndex = {};
  for (const [k, v] of Object.entries(T.z)) t.zIndex[k] = { $type: "number", $value: v };
  return t;
}

/* ------------------------------------------------------------------ contrast table */
function pairs() {
  const S = T.semantic;
  const bg = { "surface.page (Bone)": P.bone, "surface.raised (Paper)": P.paper, "surface.sunken (Linen)": P.linen, "surface.stone (Stone)": P.stone };
  const rows = [];
  const add = (group, fgName, fg, bgName, b, need, note = "") => {
    const r = contrast(fg, b);
    rows.push({ group, fg: fgName, fgHex: fg, bg: bgName, bgHex: b, ratio: +r.toFixed(2), need, pass: r >= need, note });
  };
  for (const [n, b] of Object.entries(bg)) {
    add("Text", "text.primary", col(S.text.primary[0]), n, b, 4.5);
    add("Text", "text.secondary", col(S.text.secondary[0]), n, b, 4.5);
    add("Text", "text.tertiary", col(S.text.tertiary[0]), n, b, 4.5, n.includes("Stone") ? "not on Stone: use text.secondary" : "");
    add("Text", "Taupe as text (rejected)", P.taupe, n, b, 4.5, "decorative only");
    add("Text", "accent (Oxblood) text", P.oxblood, n, b, 4.5);
  }
  add("Text", "text.inverse (Bone)", P.bone, "surface.inverse (Espresso)", P.espresso, 4.5);
  add("Text", "text.on-accent (Bone)", P.bone, "accent (Oxblood)", P.oxblood, 4.5);
  add("Text", "text.inverse", P.bone, "interactive.hover (Cocoa)", P.cocoa, 4.5);
  add("Text", "white on danger button", "#FFFFFF", "danger", P.danger, 4.5);
  add("Text", "Paper text on scrim over a photo", P.paper, "scrim 62 % over #FFFFFF", over("#171412", 0.62, "#FFFFFF"), 4.5, "worst case: white pixel");
  for (const [k, f] of Object.entries(T.feedback)) {
    add("Feedback", `${k}.fg`, P[f.fg], `${k}.bg`, P[f.bg], 4.5);
    add("Feedback", `${k}.fg`, P[f.fg], "surface.page (Bone)", P.bone, 4.5);
    add("Feedback", `${k}.fg`, P[f.fg], "surface.raised (Paper)", P.paper, 4.5);
  }
  // non-text UI (WCAG 1.4.11: 3:1)
  for (const [n, b] of Object.entries(bg)) {
    add("UI", "border.control", P["taupe-deep"], n, b, 3, n.includes("Stone") ? "on Stone use border.strong (Umber)" : "");
    add("UI", "border.strong", P.umber, n, b, 3);
    add("UI", "focus.ring (Oxblood)", P.oxblood, n, b, 3);
    add("UI", "interactive.default (Espresso fill)", P.espresso, n, b, 3);
    add("UI", "accent fill (Oxblood)", P.oxblood, n, b, 3);
  }
  add("UI", "focus.ring vs Espresso button (offset 2 px on Bone)", P.oxblood, "surface.page (Bone)", P.bone, 3, "the 2 px offset shows the page between ring and button");
  add("UI", "border.subtle (decorative)", P.oat, "surface.page (Bone)", P.bone, 1, "decorative hairline: exempt, never the only boundary of a control");
  add("UI", "danger vs accent (distinguishability)", P.danger, "accent (Oxblood)", P.oxblood, 1, "hue 3° vs 346°, plus icon and word");
  // night
  const N = T.night;
  for (const [n, b] of Object.entries({ "night surface (Espresso)": P.espresso, "night raised": P["espresso-raised"] })) {
    add("Night", "text.primary (Bone)", P.bone, n, b, 4.5);
    add("Night", "text.secondary", N["text-secondary"], n, b, 4.5);
    add("Night", "text.tertiary", N["text-tertiary"], n, b, 4.5);
    add("Night", "border.control", N["border-control"], n, b, 3);
    add("Night", "focus (Bone)", P.bone, n, b, 3);
    add("Night", "success-night", P["success-night"], n, b, 4.5);
    add("Night", "warning-night", P["warning-night"], n, b, 4.5);
    add("Night", "danger-night", P["danger-night"], n, b, 4.5);
    add("Night", "info-night", P["info-night"], n, b, 4.5);
  }
  add("Night", "Oxblood on Espresso (rejected as accent)", P.oxblood, "night surface (Espresso)", P.espresso, 3, "why the night accent is Bone");
  // oxblood band
  add("Oxblood band", "Bone text", P.bone, "surface.accent (Oxblood)", P.oxblood, 4.5);
  add("Oxblood band", "oxblood-200 secondary text", P["oxblood-200"], "surface.accent (Oxblood)", P.oxblood, 4.5);
  add("Oxblood band", "focus (Bone)", P.bone, "surface.accent (Oxblood)", P.oxblood, 3);
  // charts vs paper
  T.chart.forEach((c, i) => add("Chart", `chart-${i + 1}`, col(c), "surface.raised (Paper)", P.paper, 3));
  // category washes with their ink
  for (const [k, [w, ink]] of Object.entries(T.tones)) add("Tone", `tone-${k} ink`, col(ink), `tone-${k} wash`, w, 4.5);
  return rows;
}

/* ------------------------------------------------------------------ tokens.css */
function css() {
  const S = T.semantic;
  const ty = (k) => {
    const [min, max, lh, tr, w] = T.type[k];
    return { size: fluid(min, max), lh, tr: `${tr}em`, w };
  };
  const typeBlock = (name, k, comment) => {
    const v = ty(k);
    return `  --text-${name}: ${v.size};${comment ? ` /* ${comment} */` : ""}
  --text-${name}--line-height: ${v.lh};
  --text-${name}--letter-spacing: ${v.tr};
  --text-${name}--font-weight: ${v.w};
`;
  };
  const r = T.radii;
  const tones = Object.entries(T.tones).map(([k, [w, ink]]) => `  --color-tone-${k}: ${w};\n  --color-tone-${k}-ink: ${col(ink)};`).join("\n");
  const prim = Object.entries(T.primitives).map(([k, v]) => `  --soma-${k}: ${v.value};${v.note ? ` /* ${v.note} */` : ""}`).join("\n");
  return `/* ==========================================================================
   SOMA Design Tokens v3 — brand identity 2026 (Tailwind CSS v4)
   GENERATED by brand/tools/build-tokens.mjs from brand/tools/tokens-source.mjs.
   v1.1: the retired v2 aura, grain, ambient and spotlight utilities are gone
   (Brand Audit 1, L2), and the reveal duration is added (MOTION.md § 2).
   Drop-in replacement for src/styles/tokens.css: every semantic name the app
   uses is kept (see brand/DESIGN_TOKENS/README.md, old -> new), new roles are
   added. Rationale and contrast table: brand/BRAND_GUIDELINES.md.

   Palette: Bone #F3EFE8 and Espresso #25211F carry the interface; Oxblood
   #542C35 is the signature, at most ONE oxblood moment per screen (the primary
   action or the brand moment). Danger is vermilion, never Oxblood.

   Fonts (wire up in src/app/layout.tsx, see README):
   - Instrument Sans variable (wdth 75-100, wght 400-700), latin 57 KB, preload
   - Newsreader Display roman (opsz 72, 400), latin 22 KB, preload
   - Newsreader Display italic (opsz 72, 400), latin 23 KB, on demand
   Budget on /: 2 preloaded files = 79 KB, 102 KB with the italic (<= 150 KB).
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Brand primitives. Components use the semantic tokens in @theme, never these.
   -------------------------------------------------------------------------- */
:root {
${prim}

  /* Shadow tint: Espresso, so depth reads warm, never grey or blue */
  --soma-shadow: ${T.shadow.rgb};

  /* Glass (kept for the sticky header and sheets): warm paper, not white */
  --glass-bg: rgb(251 249 245 / 0.78);
  --glass-bg-strong: rgb(251 249 245 / 0.92);
  --glass-blur: 18px;
  --glass-saturate: 1.2;
  --glass-edge: rgb(255 255 255 / 0.55);
  --glass-hairline: rgb(37 33 31 / 0.08);

  /* Layout rhythm */
  --space-gutter: 1.25rem;         /* 20 px  < 768   */
  --space-section: 4.5rem;         /* 72 px  < 768   */
  --space-stack: 1.5rem;
  --header-height: 3.75rem;        /* 60 px mobile   */
  --bottom-nav-height: 4rem;

  /* Layering */
${Object.entries(T.z).filter(([k]) => !["base", "raised"].includes(k)).map(([k, v]) => `  --z-${k}: ${v};`).join("\n")}
}

@media (width >= 48rem) {
  :root {
    --space-gutter: 2rem;
    --space-section: 6rem;
    --space-stack: 2rem;
    --header-height: 4.25rem;
  }
}
@media (width >= 64rem) {
  :root {
    --space-gutter: 3rem;
    --space-section: 8rem;
  }
}

/* --------------------------------------------------------------------------
   2. Theme ("static": every token is emitted as a CSS variable).
   -------------------------------------------------------------------------- */
@theme static {
  --color-*: initial;
  --text-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;

  /* Surfaces (v2 names kept) */
  --color-surface: var(--soma-bone);
  --color-surface-raised: var(--soma-paper);
  --color-surface-sunken: var(--soma-linen);
  --color-surface-pressed: var(--soma-oat);
  --color-surface-tint: var(--soma-linen);              /* selected rows, list hover (neutral, not accent) */
  --color-surface-inverse: var(--soma-espresso);
  --color-surface-stone: var(--soma-stone);             /* new: secondary background band */
  --color-surface-accent: var(--soma-oxblood);          /* new: the one brand moment */
  --color-surface-overlay: ${S.surface.overlay[0]};      /* new */

  /* Text (v2 "ink" names kept) */
  --color-ink: var(--soma-espresso);
  --color-ink-hover: var(--soma-cocoa);
  --color-ink-muted: var(--soma-umber-deep);            /* text.secondary, 6.4:1 on Bone */
  --color-ink-subtle: var(--soma-umber);                /* new: text.tertiary, 5.1:1 on Bone (not on Stone) */
  --color-ink-disabled: var(--soma-taupe);              /* inactive UI only (WCAG-exempt) */
  --color-ink-inverse: var(--soma-bone);
  --color-link: var(--soma-espresso);                   /* new: underline in line-strong */
  --color-link-hover: var(--soma-oxblood);              /* new */

  /* Borders (v2 names kept) */
  --color-line: var(--soma-oat);                        /* border.subtle: hairlines, dividers */
  --color-line-mid: var(--soma-stone);                  /* border.default: chips, cards, tables */
  --color-line-strong: var(--soma-taupe-deep);          /* border.control: >= 3:1 on Bone and Paper */
  --color-line-control: var(--soma-taupe-deep);         /* new alias */
  --color-line-emphasis: var(--soma-umber);             /* new: border.strong, controls on Stone */

  /* Interactive (new) */
  --color-interactive: var(--soma-espresso);
  --color-interactive-hover: var(--soma-cocoa);
  --color-interactive-pressed: var(--soma-espresso-deep);
  --color-interactive-disabled: var(--soma-oat);
  --color-selected: var(--soma-espresso);
  --color-selected-subtle: var(--soma-linen);

  /* The signature accent: ONE oxblood moment per screen (v2 names kept) */
  --color-accent: var(--soma-oxblood);
  --color-accent-hover: var(--soma-oxblood-700);
  --color-accent-pressed: var(--soma-oxblood-800);      /* new */
  --color-accent-soft: var(--soma-oxblood-100);
  --color-accent-tint: var(--soma-oxblood-50);
  --color-on-accent: var(--soma-bone);

  /* Feedback: fg (>= 4.5:1), soft bg, border. Always icon + word, never colour alone. */
  --color-success: var(--soma-success);
  --color-success-soft: var(--soma-success-soft);
  --color-success-line: var(--soma-success-line);
  --color-warning: var(--soma-warning);
  --color-warning-soft: var(--soma-warning-soft);
  --color-warning-line: var(--soma-warning-line);
  --color-danger: var(--soma-danger);
  --color-danger-hover: var(--soma-danger-hover);
  --color-danger-soft: var(--soma-danger-soft);
  --color-danger-line: var(--soma-danger-line);
  --color-on-danger: #ffffff;
  --color-info: var(--soma-info);
  --color-info-soft: var(--soma-info-soft);
  --color-info-line: var(--soma-info-line);

  /* Focus: 2 px Oxblood ring + 2 px offset (>= 3:1 on every light surface) */
  --color-focus: var(--soma-oxblood);
  --color-focus-glow: ${S.focus.glow[0]};
  --color-scrim: ${S.surface.scrim[0]};      /* under text on photos */
  --color-backdrop: ${S.surface.overlay[0]};   /* behind sheets and modals */

  /* Fixed night colours, for use outside a [data-theme="night"] scope */
  --color-night: var(--soma-espresso);
  --color-night-raised: var(--soma-espresso-raised);
  --color-night-ink: var(--soma-bone);
  --color-night-muted: ${T.night["text-secondary"]};

  /* Charts (>= 3:1 against Paper; order = series order) */
${T.chart.map((c, i) => `  --color-chart-${i + 1}: ${col(c)};`).join("\n")}
  --color-chart-grid: var(--soma-oat);

  --color-white: #ffffff;
  --color-black: #000000;

  /* Category washes: warm neutrals, Espresso ink */
${tones}

  /* Typography: families */
  --font-sans: var(--font-sans-src), ${T.fonts.sans.stack};
  --font-display: var(--font-display-src), ${T.fonts.display.stack};
  --font-accent: var(--font-accent-src), var(--font-display-src), ${T.fonts.display.stack};
  --font-mono: var(--font-mono-src), ${T.fonts.mono.stack};

  /* Typography: weights (Instrument Sans 400-700; Newsreader Display 400) */
  --font-weight-regular: 400;
  --font-weight-label: 540;
  --font-weight-button: 560;
  --font-weight-strong: 600;

  /* Typography: fluid scale 360 -> 1440 px (v2 names kept; new names added) */
${typeBlock("display-xl", "display-xl", "44 -> 104, Newsreader")}${typeBlock("display-l", "display-l", "38 -> 80")}${typeBlock("display-m", "display-m", "32 -> 60")}${typeBlock("display-s", "display-s", "28 -> 44")}${typeBlock("h1", "h1", "32 -> 52, Newsreader")}${typeBlock("h2", "h2", "26 -> 38, Newsreader")}${typeBlock("heading-l", "h3", "= h3, 20 -> 24, Instrument Sans")}${typeBlock("heading-m", "h4", "= h4, 17 -> 19")}${typeBlock("heading-s", "h5", "= h5, 15 -> 16")}${typeBlock("h6", "h6", "13 -> 14")}${typeBlock("lead", "lead", "18 -> 21")}${typeBlock("body-l", "body-l", "17 -> 18")}${typeBlock("body", "body", "16")}${typeBlock("body-s", "body-s", "14")}${typeBlock("button", "button", "15 -> 16")}${typeBlock("label", "label", "14 -> 15")}${typeBlock("label-s", "label-s", "13")}${typeBlock("control", "control", "16, no iOS zoom")}${typeBlock("caption", "small", "12, never smaller")}${typeBlock("overline", "eyebrow", "12, uppercase")}${typeBlock("stat", "numeric", "28 -> 40, tabular")}
  /* Shape: calmer than v2; pills stay for buttons, chips, badges, avatars */
  --radius: ${r.control / 16}rem;
  --radius-xs: ${r.control / 16}rem;        /* legacy v1 name */
  --radius-control: ${r.control / 16}rem;   /* ${r.control}: inputs, selects, menu items */
  --radius-tile: ${r.tile / 16}rem;      /* ${r.tile}: slots, date cells, notices, toasts, thumbs */
  --radius-card: ${r.card / 16}rem;         /* ${r.card}: cards, panels, tables, dialogs */
  --radius-panel: ${r.panel / 16}rem;      /* ${r.panel}: hero panels, large media */
  --radius-sheet: ${r.sheet / 16}rem;      /* ${r.sheet}: top corners of bottom sheets */
  --radius-arch: ${r.arch};   /* the SOMA arch (motif): top of the O */

  /* Elevation: warm and quiet; each level carries its own hairline */
  --shadow-hairline: ${T.shadow.hairline};
  --shadow-raised: ${T.shadow.raised};
  --shadow-float: ${T.shadow.float};
  --shadow-overlay: ${T.shadow.overlay};
  --shadow-modal: var(--shadow-overlay);
  --shadow-sheet: 0 0 0 1px rgb(37 33 31 / 0.06), 0 -8px 24px -10px rgb(37 33 31 / 0.10), 0 -24px 56px -20px rgb(37 33 31 / 0.18);
  --shadow-bar: 0 -1px 0 rgb(37 33 31 / 0.07), 0 -12px 28px -18px rgb(37 33 31 / 0.16);
  --shadow-press: 0 0 0 1px rgb(37 33 31 / 0.09), 0 1px 1px rgb(37 33 31 / 0.04);
  --shadow-ink: 0 1px 2px rgb(37 33 31 / 0.18);           /* Espresso buttons: no glow */
  --shadow-accent: 0 1px 2px rgb(54 27 33 / 0.24);        /* Oxblood button: no glow */

  --inset-shadow-field: inset 0 1px 2px rgb(37 33 31 / 0.05);
  --inset-shadow-sunken: inset 0 1px 3px rgb(37 33 31 / 0.06);

  --blur-glass: var(--glass-blur);

  /* Layout */
  --container-reading: 38rem;
  --container-form: 30rem;
  --container-sheet: 35rem;
  --container-content: 72rem;
  --container-page: 86rem;
  --container-dashboard: 90rem;
  --breakpoint-xs: 22.5rem;      /* new: 360 px */

  --spacing-touch: 2.75rem;      /* 44 px minimum touch target */
  --spacing-control-s: 2.25rem;
  --spacing-control: 2.75rem;
  --spacing-control-l: 3.25rem;

  /* Motion: "arrival". Elements settle and stop: ease-out, no overshoot, no loops. */
  --ease-standard: ${T.motion.easing.standard};
  --ease-enter: ${T.motion.easing.arrive};
  --ease-arrive: ${T.motion.easing.arrive};
  --ease-exit: ${T.motion.easing.exit};
  --ease-calm: ${T.motion.easing.calm};
  --ease-spring: ${T.motion.easing.settle};   /* v2 name kept: now overshoot-free */
  --ease-settle: ${T.motion.easing.settle};

  --transition-duration-instant: ${T.motion.duration.instant}ms;
  --transition-duration-fast: ${T.motion.duration.fast}ms;
  --transition-duration-base: ${T.motion.duration.base}ms;
  --transition-duration-slow: ${T.motion.duration.slow}ms;
  --transition-duration-spring: ${T.motion.duration.arrive}ms;
  --transition-duration-arrive: ${T.motion.duration.arrive}ms;
  --transition-duration-calm: ${T.motion.duration.calm}ms;
  --transition-duration-reveal: ${T.motion.duration.reveal}ms;  /* brand animation only: photo settle in the arch */

  --default-transition-duration: ${T.motion.duration.fast}ms;
  --default-transition-timing-function: ${T.motion.easing.standard};

  --animate-skeleton: soma-shimmer 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  --animate-spin: spin 0.9s linear infinite;
  --animate-fade-in: soma-fade-in var(--transition-duration-base) var(--ease-standard) both;
  --animate-sheet-in: soma-sheet-in var(--transition-duration-arrive) var(--ease-arrive) both;
  --animate-dialog-in: soma-dialog-in var(--transition-duration-slow) var(--ease-arrive) both;
  --animate-toast-in: soma-toast-in var(--transition-duration-arrive) var(--ease-arrive) both;
  --animate-pop: soma-pop var(--transition-duration-arrive) var(--ease-settle) both;
  --animate-settle: soma-settle var(--transition-duration-arrive) var(--ease-settle);
  --animate-rise: soma-rise var(--transition-duration-calm) var(--ease-arrive) both;
  --animate-draw: soma-draw var(--transition-duration-calm) var(--ease-arrive) both;
  --animate-arch-in: soma-arch-in var(--transition-duration-calm) var(--ease-arrive) both;

  @keyframes soma-shimmer {
    from { transform: translateX(-100%); }
    to { transform: translateX(100%); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes soma-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes soma-sheet-in {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  @keyframes soma-dialog-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes soma-toast-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes soma-pop {
    from { opacity: 0; transform: scale(0.86); }
    to { opacity: 1; transform: none; }
  }
  @keyframes soma-settle {
    0% { scale: 0.96; }
    100% { scale: 1; }
  }
  @keyframes soma-rise {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes soma-draw {
    from { stroke-dashoffset: 1; }
    to { stroke-dashoffset: 0; }
  }
  /* The arch reveal: an image rises into its arch and comes to rest */
  @keyframes soma-arch-in {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: none; }
  }
}

/* --------------------------------------------------------------------------
   3. Composite type utilities: family + size + leading + tracking + weight + wrapping.
   -------------------------------------------------------------------------- */
${["display-xl", "display-l", "display-m", "display-s", "h1", "h2"].map((n) => `@utility type-${n} {
  font-family: var(--font-display);
  font-size: var(--text-${n});
  line-height: var(--text-${n}--line-height);
  letter-spacing: var(--text-${n}--letter-spacing);
  font-weight: var(--text-${n}--font-weight);
  font-synthesis: none;
  text-wrap-style: balance;
  hyphens: manual;
  overflow-wrap: break-word;
}`).join("\n")}
${["heading-l", "heading-m", "heading-s", "h6"].map((n) => `@utility type-${n} {
  font-family: var(--font-sans);
  font-size: var(--text-${n});
  line-height: var(--text-${n}--line-height);
  letter-spacing: var(--text-${n}--letter-spacing);
  font-weight: var(--text-${n}--font-weight);
  text-wrap-style: balance;
  hyphens: manual;
  overflow-wrap: break-word;
}`).join("\n")}
${[["h3", "heading-l"], ["h4", "heading-m"], ["h5", "heading-s"]].map(([a, n]) => `@utility type-${a} {
  font-family: var(--font-sans);
  font-size: var(--text-${n});
  line-height: var(--text-${n}--line-height);
  letter-spacing: var(--text-${n}--letter-spacing);
  font-weight: var(--text-${n}--font-weight);
  text-wrap-style: balance;
  overflow-wrap: break-word;
}`).join("\n")}
${["lead", "body-l", "body", "body-s"].map((n) => `@utility type-${n} {
  font-family: var(--font-sans);
  font-size: var(--text-${n});
  line-height: var(--text-${n}--line-height);
  letter-spacing: var(--text-${n}--letter-spacing);
  font-weight: 400;
  text-wrap-style: pretty;
  hyphens: auto;
  hyphenate-limit-chars: 10 4 4;
}`).join("\n")}
${["button", "label", "label-s", "control"].map((n) => `@utility type-${n} {
  font-family: var(--font-sans);
  font-size: var(--text-${n});
  line-height: var(--text-${n}--line-height);
  letter-spacing: var(--text-${n}--letter-spacing);
  font-weight: var(--text-${n}--font-weight);
  hyphens: none;
}`).join("\n")}
@utility type-caption {
  font-family: var(--font-sans);
  font-size: var(--text-caption);
  line-height: var(--text-caption--line-height);
  letter-spacing: var(--text-caption--letter-spacing);
  font-weight: var(--text-caption--font-weight);
}
@utility type-small {
  font-family: var(--font-sans);
  font-size: var(--text-caption);
  line-height: var(--text-caption--line-height);
  letter-spacing: var(--text-caption--letter-spacing);
  font-weight: var(--text-caption--font-weight);
}
@utility type-overline {
  font-family: var(--font-sans);
  font-size: var(--text-overline);
  line-height: var(--text-overline--line-height);
  letter-spacing: var(--text-overline--letter-spacing);
  font-weight: var(--text-overline--font-weight);
  text-transform: uppercase;
}
@utility type-eyebrow {
  font-family: var(--font-sans);
  font-size: var(--text-overline);
  line-height: var(--text-overline--line-height);
  letter-spacing: var(--text-overline--letter-spacing);
  font-weight: var(--text-overline--font-weight);
  text-transform: uppercase;
}
/* Numeric display: sans, tabular lining figures (prices, KPIs, the Start-Code) */
@utility type-stat {
  font-family: var(--font-sans);
  font-size: var(--text-stat);
  line-height: var(--text-stat--line-height);
  letter-spacing: var(--text-stat--letter-spacing);
  font-weight: var(--text-stat--font-weight);
  font-variant-numeric: tabular-nums lining-nums;
}
@utility type-numeric {
  font-family: var(--font-sans);
  font-size: var(--text-stat);
  line-height: var(--text-stat--line-height);
  letter-spacing: var(--text-stat--letter-spacing);
  font-weight: var(--text-stat--font-weight);
  font-variant-numeric: tabular-nums lining-nums;
}
/* The serif italic as an accent: the tagline, one clause, a quote. */
@utility type-accent {
  font-family: var(--font-accent);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.01em;
  font-synthesis: none;
}
/* The place line (Ortszeile): Ort · Stadtteil · Uhrzeit */
@utility type-place {
  font-family: var(--font-sans);
  font-size: var(--text-overline);
  line-height: 1.3;
  letter-spacing: 0.1em;
  font-weight: 600;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}
@utility num {
  font-variant-numeric: tabular-nums lining-nums;
}
/* Long German labels in tight UI: Instrument Sans has a real width axis. */
@utility condensed {
  font-stretch: 86%;
  letter-spacing: -0.004em;
}
@utility code-ref {
  font-family: var(--font-mono);
  font-size: max(0.75rem, 0.875em); /* never below the 12 px floor */
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums slashed-zero;
}

/* --------------------------------------------------------------------------
   4. Surface utilities
   -------------------------------------------------------------------------- */
@utility glass {
  background-color: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    background-color: rgb(251 249 245 / 0.97);
  }
}
@utility glass-strong {
  background-color: var(--glass-bg-strong);
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) + 4px)) saturate(var(--glass-saturate));
  backdrop-filter: blur(calc(var(--glass-blur) + 4px)) saturate(var(--glass-saturate));
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    background-color: rgb(251 249 245 / 0.98);
  }
}
@utility glass-edge {
  --tw-inset-shadow: inset 0 1px 0 var(--glass-edge);
  --tw-ring-shadow: 0 0 0 1px var(--glass-hairline);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow, 0 0 #0000), var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
/* The SOMA arch (motif): image crop from the top half of the wordmark's O */
@utility arch {
  border-radius: var(--radius-arch);
  overflow: hidden;
}
@utility cv-auto {
  content-visibility: auto;
  contain-intrinsic-size: auto var(--cv-size, 800px);
  :root[data-automation] & {
    content-visibility: visible;
  }
}
/* --------------------------------------------------------------------------
   5. Haptics (unchanged behaviour; curves are now overshoot-free)
   -------------------------------------------------------------------------- */
@utility pressable {
  transition-property: color, background-color, border-color, box-shadow, opacity, scale, translate;
  transition-duration: var(--transition-duration-fast), var(--transition-duration-fast), var(--transition-duration-fast), var(--transition-duration-base), var(--transition-duration-fast), var(--transition-duration-base), var(--transition-duration-base);
  transition-timing-function: var(--ease-standard), var(--ease-standard), var(--ease-standard), var(--ease-standard), var(--ease-standard), var(--ease-settle), var(--ease-settle);
  -webkit-tap-highlight-color: transparent;
  &:active:not(:disabled, [aria-disabled="true"], [aria-busy="true"]) {
    scale: 0.98;
    transition-duration: var(--transition-duration-instant);
    transition-timing-function: var(--ease-standard);
  }
}
@utility lift {
  transition-property: box-shadow, translate, scale, background-color, border-color;
  transition-duration: var(--transition-duration-base), var(--transition-duration-base), var(--transition-duration-base), var(--transition-duration-fast), var(--transition-duration-fast);
  transition-timing-function: var(--ease-standard), var(--ease-settle), var(--ease-settle), var(--ease-standard), var(--ease-standard);
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      translate: 0 -2px;
      box-shadow: var(--shadow-float);
    }
  }
  &:active {
    scale: 0.99;
    translate: 0 0;
  }
}
@utility focus-ring {
  &:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
    --tw-ring-shadow: 0 0 0 6px var(--color-focus-glow);
    box-shadow: var(--tw-inset-shadow, 0 0 #0000), var(--tw-inset-ring-shadow, 0 0 #0000), var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
  }
}
/* --------------------------------------------------------------------------
   6. Scopes: night (one deliberate dark band) and oxblood (the brand moment).
   -------------------------------------------------------------------------- */
[data-theme="night"] {
  --color-surface: var(--soma-espresso);
  --color-surface-raised: var(--soma-espresso-raised);
  --color-surface-sunken: var(--soma-espresso-sunken);
  --color-surface-pressed: var(--soma-cocoa);
  --color-surface-tint: var(--soma-espresso-raised);
  --color-surface-inverse: var(--soma-bone);
  --color-ink: var(--soma-bone);
  --color-ink-hover: #ffffff;
  --color-ink-muted: ${T.night["text-secondary"]};
  --color-ink-subtle: ${T.night["text-tertiary"]};
  --color-ink-disabled: var(--soma-umber);
  --color-ink-inverse: var(--soma-espresso);
  --color-link: var(--soma-bone);
  --color-link-hover: var(--soma-oxblood-200);
  --color-line: var(--soma-cocoa);
  --color-line-mid: ${T.night["border-default"]};
  --color-line-strong: ${T.night["border-control"]};
  --color-line-control: ${T.night["border-control"]};
  --color-interactive: var(--soma-bone);
  --color-interactive-hover: #ffffff;
  --color-selected: var(--soma-bone);
  /* Oxblood sinks on Espresso (1.4:1): the night accent is Bone */
  --color-accent: var(--soma-bone);
  --color-accent-hover: #ffffff;
  --color-accent-soft: var(--soma-cocoa);
  --color-accent-tint: var(--soma-espresso-raised);
  --color-on-accent: var(--soma-espresso);
  --color-success: var(--soma-success-night);
  --color-warning: var(--soma-warning-night);
  --color-danger: var(--soma-danger-night);
  --color-info: var(--soma-info-night);
  --color-focus: var(--soma-bone);
  --color-focus-glow: rgb(243 239 232 / 0.2);
  --glass-bg: rgb(46 41 38 / 0.7);
  --glass-bg-strong: rgb(46 41 38 / 0.88);
  --glass-edge: rgb(255 255 255 / 0.06);
  --glass-hairline: rgb(255 255 255 / 0.08);
  --soma-shadow: 0 0 0;
}
[data-theme="oxblood"] {
  --color-surface: var(--soma-oxblood);
  --color-surface-raised: var(--soma-oxblood-700);
  --color-surface-sunken: var(--soma-oxblood-800);
  --color-ink: var(--soma-bone);
  --color-ink-muted: var(--soma-oxblood-200);
  --color-ink-subtle: var(--soma-oxblood-200);
  --color-ink-inverse: var(--soma-oxblood);
  --color-line: rgb(243 239 232 / 0.16);
  --color-line-mid: rgb(243 239 232 / 0.24);
  --color-line-strong: var(--soma-oxblood-200);
  --color-interactive: var(--soma-bone);
  --color-accent: var(--soma-bone);
  --color-accent-hover: #ffffff;
  --color-on-accent: var(--soma-oxblood);
  --color-focus: var(--soma-bone);
  --color-focus-glow: rgb(243 239 232 / 0.22);
}

/* --------------------------------------------------------------------------
   7. Base application of tokens
   -------------------------------------------------------------------------- */
@layer base {
  html {
    color-scheme: light;
    background-color: var(--color-surface);
    color: var(--color-ink);
    font-family: var(--font-sans);
    font-size: 100%;
    font-optical-sizing: auto;
    font-kerning: normal;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }
  body {
    font-size: var(--text-body);
    line-height: var(--text-body--line-height);
    letter-spacing: var(--text-body--letter-spacing);
    overflow-wrap: break-word;
  }
  [data-theme="night"],
  [data-theme="oxblood"] {
    background-color: var(--color-surface);
    color: var(--color-ink);
  }
  [data-theme="night"] {
    color-scheme: dark;
  }
  /* <em> in a serif headline: the italic of the same face, same size */
  :where(.type-display-xl, .type-display-l, .type-display-m, .type-display-s, .type-h1, .type-h2) :where(em, i) {
    font-family: var(--font-accent);
    font-style: italic;
    font-weight: 400;
    letter-spacing: -0.008em;
    font-synthesis: none;
  }
  /* <em> in a sans heading: a serif italic clause, optically matched (1.08em) */
  :where(.type-heading-l, .type-heading-m) :where(em, i) {
    font-family: var(--font-accent);
    font-style: italic;
    font-weight: 400;
    font-size: 1.08em;
    line-height: 0;
    letter-spacing: -0.01em;
    font-synthesis: none;
  }
  ::selection {
    background-color: rgb(84 44 53 / 0.16);
    color: inherit;
  }
  :focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 1ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 1ms !important;
      scroll-behavior: auto !important;
    }
  }
}
:where(.type-display-xl, .type-display-l, .type-display-m, .type-display-s, .type-h1, .type-h2, .font-display).italic {
  font-family: var(--font-accent);
  font-weight: 400;
  letter-spacing: -0.008em;
  font-synthesis: none;
}
`;
}

function md(rows) {
  let s = "| Group | Foreground | Background | Ratio | Needs | Result | Note |\n|---|---|---|---:|---:|---|---|\n";
  for (const r of rows) s += `| ${r.group} | ${r.fg} \`${r.fgHex}\` | ${r.bg} \`${r.bgHex}\` | ${r.ratio.toFixed(2)} | ${r.need === 1 ? "—" : r.need.toFixed(1)} | ${r.need === 1 ? "info" : r.pass ? "pass" : "**fail**"} | ${r.note} |\n`;
  return s;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "tokens.json"), JSON.stringify(json(), null, 2) + "\n");
  fs.writeFileSync(path.join(OUT, "tokens.css"), css());
  const rows = pairs();
  fs.writeFileSync(path.join(OUT, "contrast.json"), JSON.stringify(rows, null, 2) + "\n");
  fs.writeFileSync(path.join(OUT, "contrast.md"), "# SOMA contrast table (WCAG 2.2, computed)\n\nGenerated by `brand/tools/build-tokens.mjs`. Text needs 4.5:1 (AA, body sizes), UI components and focus indicators need 3:1 (1.4.11). Rows marked *info* are documentation, not requirements.\n\n" + md(rows));
  const fails = rows.filter((r) => r.need > 1 && !r.pass);
  console.log(`tokens written; ${rows.length} pairs, ${fails.length} below target:`);
  for (const f of fails) console.log("  ", f.group, f.fg, "on", f.bg, f.ratio, f.note);
}
export { json, css, pairs };
