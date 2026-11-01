// SOMA design tokens: single source. build-tokens.mjs writes DESIGN_TOKENS/tokens.json (W3C format),
// tokens.css (Tailwind v4, drop-in for src/styles/tokens.css) and the contrast tables.

/* ---------------------------------------------------------------- colour primitives */
export const primitives = {
  // warm neutral ramp, anchored on the client's Bone, Stone, Taupe and Espresso
  paper: { value: "#FBF9F5", note: "raised surfaces (cards, inputs, sheets)" },
  bone: { value: "#F3EFE8", note: "brand: page background", brand: true },
  linen: { value: "#ECE6DC", note: "sunken surfaces, hover fills" },
  oat: { value: "#E3DBCF", note: "pressed fills, hairlines" },
  stone: { value: "#D8CFC3", note: "brand: secondary background, decorative borders", brand: true },
  "stone-deep": { value: "#C7BCAF", note: "chip and card borders on stone" },
  taupe: { value: "#A69A8D", note: "brand: decorative only (2.4:1 on Bone, never text)", brand: true },
  "taupe-deep": { value: "#857A6E", note: "control borders, 3.7:1 on Bone" },
  umber: { value: "#6E6359", note: "tertiary text, 5.1:1 on Bone" },
  "umber-deep": { value: "#5E554D", note: "secondary text, 6.4:1 on Bone" },
  cocoa: { value: "#3B3531", note: "hover on Espresso" },
  espresso: { value: "#25211F", note: "brand: primary text and dark surface", brand: true },
  "espresso-deep": { value: "#171412", note: "pressed on Espresso" },
  "espresso-raised": { value: "#2E2926", note: "raised surface in the night scope" },
  "espresso-sunken": { value: "#1E1B19", note: "sunken surface in the night scope" },
  // the signature
  "oxblood-50": { value: "#F5EDEE" },
  "oxblood-100": { value: "#EBDADD" },
  "oxblood-200": { value: "#D5B5BC" },
  "oxblood-300": { value: "#B98A95" },
  "oxblood-400": { value: "#94606C" },
  "oxblood-500": { value: "#73414D" },
  oxblood: { value: "#542C35", note: "brand: the signature accent (oxblood-600)", brand: true },
  "oxblood-700": { value: "#45232B" },
  "oxblood-800": { value: "#361B21" },
  "oxblood-900": { value: "#261216" },
  // functional: muted, warm-leaning, every fg >= 4.5:1 on Bone, Paper and its own soft background
  success: { value: "#336645", note: "olive-forest" },
  "success-soft": { value: "#E4ECE2" },
  "success-line": { value: "#A9C2AE" },
  "success-night": { value: "#93C6A1" },
  warning: { value: "#7D5310", note: "ochre" },
  "warning-soft": { value: "#F5EAD3" },
  "warning-line": { value: "#D8BC86" },
  "warning-night": { value: "#E3BC6E" },
  danger: { value: "#B3261E", note: "vermilion: brighter and yellower than Oxblood, so an error never reads as the brand" },
  "danger-soft": { value: "#F8E4E0" },
  "danger-line": { value: "#E2A69C" },
  "danger-night": { value: "#F39A8D" },
  "danger-hover": { value: "#951F18" },
  info: { value: "#2F5470", note: "slate ink" },
  "info-soft": { value: "#E2E9EF" },
  "info-line": { value: "#A8BBCB" },
  "info-night": { value: "#A3C1DA" },
};
const P = Object.fromEntries(Object.entries(primitives).map(([k, v]) => [k, v.value]));
export { P };

/* ---------------------------------------------------------------- semantic colours (light) */
// [token, primitive or literal, role]
export const semantic = {
  text: {
    primary: ["espresso", "Body copy, headlines, icons"],
    secondary: ["umber-deep", "Meta, supporting copy (AA on Bone, Paper, Linen, Stone)"],
    tertiary: ["umber", "Timestamps, helper text on Bone/Paper/Linen only"],
    inverse: ["bone", "Text on Espresso"],
    "on-accent": ["bone", "Text on Oxblood"],
    disabled: ["taupe", "Inactive UI only (WCAG-exempt)"],
    link: ["espresso", "Inline links: underlined in line-strong, Oxblood on hover"],
  },
  surface: {
    page: ["bone", "Page background"],
    raised: ["paper", "Cards, inputs, sheets (always with a hairline shadow)"],
    sunken: ["linen", "Wells, tracks, skeletons, hover fills"],
    pressed: ["oat", "Pressed fills"],
    stone: ["stone", "Secondary background band"],
    inverse: ["espresso", "Dark band, tooltips, snackbars"],
    accent: ["oxblood", "One brand moment per view (hero band, gift card, splash)"],
    overlay: ["rgb(23 20 18 / 0.48)", "Backdrop behind sheets and modals"],
    scrim: ["rgb(23 20 18 / 0.62)", "Under text on photos (Paper text >= 4.5:1 over a white pixel)"],
  },
  border: {
    subtle: ["oat", "Hairlines, dividers (decorative)"],
    default: ["stone", "Card, chip and table borders (text identifies)"],
    strong: ["umber", "Emphasised dividers, selected outlines"],
    control: ["taupe-deep", "Input, checkbox, radio and outline-button borders (>= 3:1)"],
  },
  interactive: {
    default: ["espresso", "Filled strong button, selected chip/slot/date"],
    hover: ["cocoa", ""],
    pressed: ["espresso-deep", ""],
    disabled: ["oat", "Disabled fill (label in text.disabled)"],
    selected: ["espresso", "Selected state fill (label text.inverse + check icon)"],
    "selected-subtle": ["linen", "Selected row/list item"],
  },
  accent: {
    default: ["oxblood", "THE primary action of a view, brand moments"],
    hover: ["oxblood-700", ""],
    pressed: ["oxblood-800", ""],
    soft: ["oxblood-100", "Rare: brand badge background"],
    tint: ["oxblood-50", "Rare: brand note background"],
  },
  focus: {
    ring: ["oxblood", "2 px ring, 2 px offset; >= 3:1 against Bone, Paper, Linen, Stone"],
    glow: ["rgb(84 44 53 / 0.16)", "Optional 6 px halo"],
  },
};
export const feedback = {
  success: { fg: "success", bg: "success-soft", border: "success-line", icon: "CircleCheck", word: "Bestätigt" },
  warning: { fg: "warning", bg: "warning-soft", border: "warning-line", icon: "TriangleAlert", word: "Achtung" },
  danger: { fg: "danger", bg: "danger-soft", border: "danger-line", icon: "CircleAlert", word: "Fehler" },
  info: { fg: "info", bg: "info-soft", border: "info-line", icon: "Info", word: "Hinweis" },
};
// night scope (one deliberate dark band, or the future dark mode)
export const night = {
  "surface-page": "espresso",
  "surface-raised": "espresso-raised",
  "surface-sunken": "espresso-sunken",
  "surface-pressed": "cocoa",
  "text-primary": "bone",
  "text-secondary": "#BFB4A7",
  "text-tertiary": "#A89C90",
  "border-subtle": "cocoa",
  "border-default": "#4A423C",
  "border-control": "#8F8377",
  accent: "bone",
  "on-accent": "espresso",
  focus: "bone",
};

/* ---------------------------------------------------------------- typography */
export const fonts = {
  display: { family: "Newsreader", stack: '"Newsreader", "Iowan Old Style", Georgia, "Times New Roman", serif', files: "newsreader-display-roman (opsz 72, wght 400, 22 KB, preload) + newsreader-display-italic (opsz 72, 23 KB, on demand)", licence: "SIL OFL 1.1" },
  sans: { family: "Instrument Sans", stack: '"Instrument Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', files: "instrument-sans variable (wdth 75–100, wght 400–700, latin 57 KB, preload)", licence: "SIL OFL 1.1" },
  mono: { family: "DM Mono", stack: '"DM Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', files: "unchanged from v2, /pro and /admin only", licence: "SIL OFL 1.1" },
};
// [min px @360, max px @1440, line-height, tracking em, weight, family, extra]
export const type = {
  "display-xl": [44, 104, 0.98, -0.026, 400, "display", "Home hero only, one per page"],
  "display-l": [38, 80, 1.0, -0.022, 400, "display", "Editorial section titles"],
  "display-m": [32, 60, 1.04, -0.018, 400, "display", "Category, profile name, confirmation"],
  "display-s": [28, 44, 1.08, -0.014, 400, "display", "Quotes, empty states, modal hero"],
  h1: [32, 52, 1.06, -0.016, 400, "display", "Page title (marketing); = one serif statement"],
  h2: [26, 38, 1.1, -0.012, 400, "display", "Section title (marketing)"],
  h3: [20, 24, 1.25, -0.012, 600, "sans", "App screen and dialog titles (= heading-l)"],
  h4: [17, 19, 1.3, -0.008, 600, "sans", "Section and list titles (= heading-m)"],
  h5: [15, 16, 1.35, -0.004, 600, "sans", "Group and card titles (= heading-s)"],
  h6: [13, 14, 1.35, 0.0, 600, "sans", "Minor group titles"],
  lead: [18, 21, 1.5, -0.006, 400, "sans", "Intro paragraphs (= body-l)"],
  "body-l": [17, 18, 1.55, -0.004, 400, "sans", "Long reading"],
  body: [16, 16, 1.55, -0.002, 400, "sans", "Default"],
  "body-s": [14, 14, 1.5, 0.0, 400, "sans", "Secondary info, tables"],
  small: [12, 12, 1.4, 0.01, 450, "sans", "Captions, timestamps (= caption); never below 12 px"],
  eyebrow: [12, 12, 1.2, 0.12, 600, "sans", "Overline, uppercase, max. three words (= overline)"],
  button: [15, 16, 1.2, -0.004, 560, "sans", "Buttons"],
  label: [14, 15, 1.2, -0.002, 540, "sans", "Tabs, slots, chips (= label)"],
  "label-s": [13, 13, 1.2, 0.0, 540, "sans", "Field labels, pills, table headers"],
  control: [16, 16, 1.3, -0.002, 400, "sans", "Inputs: 16 px so iOS never zooms"],
  numeric: [28, 40, 1.05, -0.02, 560, "sans", "Prices, KPIs: tabular lining figures (= stat)"],
};

/* ---------------------------------------------------------------- space, layout, shape, depth, motion */
export const space = { 0: 0, 0.5: 2, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96, 32: 128, 40: 160 };
export const breakpoints = { xs: 360, sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1440 };
export const grid = {
  mobile: { columns: 4, gutter: 20, gap: 12, from: 0 },
  tablet: { columns: 8, gutter: 32, gap: 20, from: 768 },
  desktop: { columns: 12, gutter: 48, gap: 24, from: 1024 },
  container: { page: 1376, content: 1152, reading: 608, form: 480, sheet: 560, dashboard: 1440 },
};
// arch: the top half of the wordmark O (ry = 1.09 rx). Vertical % refers to the height, so it scales with
// --arch-aspect (width / height of the crop): 0.8 for 4:5 (default), 0.75 for 3:4, 0.667 for 2:3.
export const radii = { control: 8, tile: 12, card: 16, panel: 24, sheet: 24, pill: 9999, arch: "50% 50% 0 0 / calc(54.5% * var(--arch-aspect, 0.8)) calc(54.5% * var(--arch-aspect, 0.8)) 0 0" };
export const shadow = {
  rgb: "37 33 31",
  hairline: "0 0 0 1px rgb(37 33 31 / 0.08)",
  raised: "0 0 0 1px rgb(37 33 31 / 0.07), 0 1px 2px rgb(37 33 31 / 0.04), 0 4px 10px -4px rgb(37 33 31 / 0.06)",
  float: "0 0 0 1px rgb(37 33 31 / 0.06), 0 2px 4px -1px rgb(37 33 31 / 0.05), 0 12px 24px -8px rgb(37 33 31 / 0.10)",
  overlay: "0 0 0 1px rgb(37 33 31 / 0.07), 0 8px 16px -6px rgb(37 33 31 / 0.08), 0 32px 64px -20px rgb(37 33 31 / 0.22)",
};
export const motion = {
  duration: { instant: 100, fast: 160, base: 220, slow: 320, arrive: 480, calm: 640 },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    arrive: "cubic-bezier(0.16, 1, 0.3, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    calm: "cubic-bezier(0.4, 0, 0.2, 1)",
    settle: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
};
export const z = { base: 0, raised: 1, header: 30, "bottom-nav": 30, "sticky-cta": 35, overlay: 40, sheet: 50, modal: 60, toast: 70 };

/* ---------------------------------------------------------------- category washes (replace the aura palettes) */
export const tones = {
  massage: ["#E8DED2", "espresso"],
  manikuere: ["#EAE1DA", "espresso"],
  pedikuere: ["#E6DED0", "espresso"],
  kosmetik: ["#E2E0D6", "espresso"],
  "make-up": ["#E8DFDA", "espresso"],
  "haare-styling": ["#E5DBCC", "espresso"],
  "brows-lashes": ["#E3DDD6", "espresso"],
  nacht: ["#25211F", "bone"],
};
export const chart = ["oxblood", "taupe-deep", "#5E7A45", "#B07A26", "#4F6B84"];
