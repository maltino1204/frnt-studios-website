# SOMA design tokens v3

*Identity Designer · phase B1 · 1 Nov 2026*

| File | What it is |
|---|---|
| `tokens.json` | **Source format for tools**: W3C design tokens (DTCG: `$type`, `$value`, `{alias}`). It covers colour primitives and semantics, feedback, night, tones, charts, font families and weights, typography (fluid `clamp()` 360 → 1440 px), spacing (4 pt), radii, breakpoints, grid, containers, shadows, motion and z-index. |
| `tokens.css` | **Drop-in replacement for `src/styles/tokens.css`** (Tailwind v4, `@theme static`). It keeps every semantic name the app uses and adds new ones. It compiles with Tailwind v4: checked with `@tailwindcss/node` against 21 utilities, including `xs:`. |
| `contrast.json`, `contrast.md` | Every text/background and UI pair: 95 pairs, WCAG 2.2, computed. |

The single source is `brand/tools/tokens-source.mjs`. Regenerate with `node brand/tools/build-tokens.mjs`, which writes all four files, then `node brand/tools/build-kit-data.mjs` (brand book). Never hand-edit the generated files.

---

## 1. What the migration engineer does (phase B2)

1. **Swap the tokens.** Copy `brand/DESIGN_TOKENS/tokens.css` over `src/styles/tokens.css`; the import order in `globals.css` is unchanged.
2. **Fonts** in `src/app/layout.tsx`. The budget is 2 preloaded files, 79 KB; 102 KB with the italic, against a limit of 150 KB.
   - Replace Inter with `localFont({ src: "<path>/instrument-sans-variable-latin.woff2", weight: "400 700", declarations: [{ prop: "font-stretch", value: "75% 100%" }], variable: "--font-sans-src" })`.
     - Preload it: 57 KB.
     - Add the `latin-ext` file (19 KB) as a second `src` entry with a `unicode-range`, or keep `next/font/google` `Instrument_Sans({ axes: ["wdth"] })`, which subsets automatically.
   - Add **Newsreader Display roman**: `newsreader-display-roman-latin.woff2`, opsz 72, 400, 22 KB, `variable: "--font-display-src"`, preloaded.
   - Keep the existing **Newsreader Display italic** (`src/styles/fonts/newsreader-display-italic.woff2`, identical cut) as `--font-accent-src`, not preloaded.
   - Keep DM Mono as it is.
   - The files and OFL licences are in `brand/assets/typography/fonts/`. Copy them to `src/styles/fonts/`.
   - Remove Inter's `ss03` from `html` (already done in the new `tokens.css`).
3. **Logo.**
   - In `src/components/brand/logo.tsx`, set the `--wordmark` mask in `tokens.css` to the outlines of `brand/assets/logo/final/soma-wordmark-micro.svg`. Header sizes: `h-[15px] lg:h-[18px]`, micro master.
   - Replace `Mark` (σ, retired by the strategy) with the S from `soma-symbol.svg`.
   - Remove `RoofLine` or reduce it to a neutral 20 × 1.5 px Espresso rule.
4. **Icons and manifest.**
   - From `brand/assets/icons/`: `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` and `pwa/icon-*.png`, copied to `public/brand/` and `src/app/`.
   - In `manifest.ts`: `theme_color` and `background_color` `#F3EFE8`, the icons `pwa/icon-192/512` (`any`) and `pwa/icon-maskable-192/512` (`maskable`).
   - `viewport.themeColor` becomes `#F3EFE8`.
5. **Accent audit: the most important step.** In v2, `accent` was used 134 times, mostly as "colour of interaction". In v3, `accent` is **Oxblood, at most once per screen**.

   | v2 usage | v3 replacement |
   |---|---|
   | `text-accent` on links, icons, active nav (89×) | `text-ink` + underline (`decoration-line-strong`), hover `text-link-hover`; active nav `text-ink` with a weight or stroke change |
   | `bg-accent` on buttons (30×) | Keep **only** on the one primary action of the view (`Button variant="accent"`). Everything else: `variant="primary"` (Espresso). |
   | `bg-accent-soft` / `bg-accent-tint` (34×): info notices, selected rows, *Verifiziert* pill | `bg-info-soft` (notices), `bg-surface-tint` (selection), `bg-surface-sunken` (pills) |
   | `ring-accent/*`, `shadow-accent` | `focus-ring` utility / `shadow-ink` |
   | `bg-aura`, `aura-border`, `AuraArt`, `AuraBackground`, `--color-aura-*` | Removed from the brand. The tokens now render as flat neutrals so nothing breaks. Replace them with the tone wash + arch line (`brand/BRAND_GUIDELINES.md` § 5.4). |
6. **Fallbacks.**
   - `TonePanel` and `Portrait`: the category wash (`--color-tone-*`), a 1.5 px arch line in `line-mid` and the word in the serif italic.
   - `Avatar`: Newsreader initials in Espresso on the wash, with a 1 px hairline ring.
   - No gradients, no film grain on fallbacks.
7. **Motion.** `--ease-spring` and `--ease-settle` are now overshoot-free (`cubic-bezier(0.22, 1, 0.36, 1)`), and the ambient aura animations are `none`.
   - Check the components that relied on overshoot (checkbox tick, toast) for a "pop": they now settle instead.
   - The press scale is 0.98 (was 0.97).
8. **Type.**
   - `type-display-*` is now **Newsreader 400**, which wraps differently from Inter 600. Re-check hero line breaks and soft hyphens.
   - `<em>` inside display headlines is the italic of the same face at the same size (no longer 1.06em).
   - `type-stat` stays sans, with tabular figures.
   - `condensed` uses the real width axis (`font-stretch: 86%`).
9. **Tests.** The E2E suite keys on text, not on colour, so the swap itself does not change test texts. Update the visual snapshots after the swap.

---

## 2. Mapping: v2 → v3

### 2.1 Colour (semantic names kept)

| Token | v2 value | v3 value | Primitive | Note |
|---|---|---|---|---|
| `--color-surface` | `#FAF9F7` Kalk | `#F3EFE8` | bone | page |
| `--color-surface-raised` | `#FFFFFF` | `#FBF9F5` | paper | warm white; cards always carry a hairline shadow |
| `--color-surface-sunken` | `#F3F1ED` | `#ECE6DC` | linen | |
| `--color-surface-pressed` | `#EBE8E2` | `#E3DBCF` | oat | |
| `--color-surface-tint` | `#F6F7FF` ultramarine wash | `#ECE6DC` | linen | selection is neutral now |
| `--color-surface-inverse` | `#1C1B19` | `#25211F` | espresso | |
| `--color-ink` | `#1C1B19` | `#25211F` | espresso | 13.9:1 on Bone |
| `--color-ink-hover` | `#34322E` | `#3B3531` | cocoa | |
| `--color-ink-muted` | `#6B665E` | `#5E554D` | umber-deep | 6.4:1 on Bone, 4.7:1 on Stone |
| `--color-ink-disabled` | `#B3AEA6` | `#A69A8D` | taupe | disabled only |
| `--color-ink-inverse` | `#FFFFFF` | `#F3EFE8` | bone | |
| `--color-line` | `#E8E4DE` | `#E3DBCF` | oat | decorative hairline |
| `--color-line-mid` | `#D7D2CA` | `#D8CFC3` | stone | |
| `--color-line-strong` | `#8E887E` | `#857A6E` | taupe-deep | control border, 3.7:1 on Bone |
| `--color-accent` | `#3D4FF0` ultramarine | `#542C35` | oxblood | **once per screen** |
| `--color-accent-hover` | `#2F40DA` | `#45232B` | oxblood-700 | |
| `--color-accent-soft` | `#EEF0FF` | `#EBDADD` | oxblood-100 | rare |
| `--color-accent-tint` | `#F6F7FF` | `#F5EDEE` | oxblood-50 | rare |
| `--color-on-accent` | `#FFFFFF` | `#F3EFE8` | bone | 10.2:1 |
| `--color-aura-1…4` | ultramarine, violet, peach, apricot | stone, taupe, oat, linen | | retired |
| `--color-success` / `-soft` | `#157347` / `#EAF6F0` | `#336645` / `#E4ECE2` | | |
| `--color-warning` / `-soft` | `#875800` / `#FDF4E2` | `#7D5310` / `#F5EAD3` | | |
| `--color-danger` / `-soft` | `#BE3127` / `#FDEDEB` | `#B3261E` / `#F8E4E0` | | vermilion, never Oxblood |
| `--color-on-danger` | `#FFFFFF` | `#FFFFFF` | | 6.5:1 |
| `--color-focus` | ultramarine | `#542C35` | oxblood | 2 px ring, 2 px offset |
| `--color-focus-glow` | `rgb(61 79 240 / .2)` | `rgb(84 44 53 / .16)` | | |
| `--color-scrim` | `rgb(21 20 24 / .62)` | `rgb(23 20 18 / .62)` | | warm |
| `--color-backdrop` | `rgb(23 22 31 / .28)` | `rgb(23 20 18 / .48)` | | no blur needed |
| `--color-night*` | `#151418` … | espresso / espresso-raised / bone / `#BFB4A7` | | |
| `--color-chart-1…5` | ultramarine, violet, peach, teal, pewter | oxblood, taupe-deep, olive `#5E7A45`, ochre `#B07A26`, slate `#4F6B84` | | all ≥ 3:1 on Paper |
| `--color-tone-*` / `-ink` | pastel washes, coloured inks | warm neutral washes, Espresso ink (night: Espresso / Bone) | | 11.7–12.4:1 |

**New colour tokens:**
- surfaces: `surface-stone`, `surface-accent`, `surface-overlay`;
- text and links: `ink-subtle` (tertiary text, not on Stone), `link`, `link-hover`;
- borders: `line-control`, `line-emphasis`;
- interaction: `interactive`, `interactive-hover`, `interactive-pressed`, `interactive-disabled`, `selected`, `selected-subtle`, `accent-pressed`;
- feedback: `success-line`, `warning-line`, `danger-line`, `danger-hover`, `info`, `info-soft`, `info-line`.

**New scope:** `[data-theme="oxblood"]`, the brand moment, alongside `[data-theme="night"]`. Inside the night scope the accent is **Bone**, because Oxblood on Espresso is 1.4:1.

### 2.2 Typography

| Token | v2 | v3 |
|---|---|---|
| `--font-sans` | Inter | **Instrument Sans** (`--font-sans-src`) |
| `--font-display` | Inter | **Newsreader Display** (`--font-display-src`), new variable |
| `--font-accent` | Newsreader Italic | Newsreader Display Italic (falls back to the roman) |
| `--text-display-xl` | 40 → 80, 600, −0.04em | **44 → 104**, 400, lh 0.98, −0.026em |
| `--text-display-l` | 32 → 56 | **38 → 80**, 400, lh 1.00, −0.022em |
| `--text-display-m` | 28 → 40 | **32 → 60**, 400, lh 1.04, −0.018em |
| `--text-display-s` | 22 → 28 | **28 → 44**, 400, lh 1.08, −0.014em |
| `--text-heading-l` / `-m` / `-s` | 20→24 / 17→18 / 15 (600) | = h3 20 → 24 / h4 17 → 19 / h5 15 → 16, Instrument Sans 600 |
| `--text-body-l` | 17 → 19 | 17 → 18 |
| `--text-body`, `--text-body-s` | 16 / 14 | 16 / 14 |
| `--text-label`, `--text-label-s` | 15 / 13, 520 | 14 → 15 / 13, 540 |
| `--text-caption` | 12, 460 | 12, 450 |
| `--text-overline` | 12, 600, 0.08em | 12, 600, **0.12em** |
| `--text-stat` | 28 → 36, Inter 600 | 28 → 40, Instrument Sans 560, tabular |
| **new** | | `--text-h1` 32 → 52 and `--text-h2` 26 → 38 (serif); `--text-h6` 13 → 14; `--text-lead` 18 → 21; `--text-button` 15 → 16 / 560; `--text-control` 16 |

The fluid range is now 360 → 1440 px (was 360 → 1280). **New utilities:** `type-h1` … `type-h6`, `type-lead`, `type-button`, `type-control`, `type-small`, `type-eyebrow`, `type-numeric` and `type-place` (the Ortszeile).

### 2.3 Shape, depth, motion

| Token | v2 | v3 |
|---|---|---|
| `--radius-control` | 10 | **8** |
| `--radius-tile` | 14 | **12** |
| `--radius-card` | 20 | **16** |
| `--radius-panel`, `--radius-sheet` | 28 | **24** |
| `--radius-arch` | n/a | **new**: the top half of the O, `calc(54.5% × --arch-aspect)` (utility `arch`) |
| `--shadow-raised` / `-float` / `-overlay` | violet-tinted, up to 28 % | Espresso-tinted, 4–22 %, quieter |
| `--shadow-ink`, `--shadow-accent` | inset highlight + coloured drop | flat 1–2 px drop, **no glow** |
| `--shadow-aura` | ultramarine/peach glow | = `--shadow-float` (retired) |
| `--ease-spring`, `--ease-settle` | `linear()` with 7 % / 3 % overshoot | `cubic-bezier(0.22, 1, 0.36, 1)`: arrive and stop |
| `--ease-arrive` | n/a | new: `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--transition-duration-slow` | 280 ms | 320 ms |
| `--transition-duration-spring` | 420 ms | 480 ms (= `--transition-duration-arrive`) |
| `--animate-aura-*`, `--animate-float` | ambient drift | `none` |
| `--animate-arch-in` | n/a | new: an image rises 16 px into its arch and stops (640 ms) |
| `--breakpoint-xs` | n/a | new: 22.5rem (360 px) |
| `--z-*`, containers, `--spacing-*` | | unchanged |

Spacing stays on Tailwind's 4 px base. The documented steps (`tokens.json` → `dimension.space`) are 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128 and 160 px.
