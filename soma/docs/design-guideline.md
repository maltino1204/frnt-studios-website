# SOMA Design Guideline v2

Version 2.0, October 2026. It applies to the customer web app/PWA (`/`, *Sie*), the provider tool (`/pro`, *du*) and the admin console (`/admin`). It replaces v1 and follows the binding brief `docs/design-v2-brief.md`.

| File | Purpose |
|---|---|
| `src/styles/tokens.css` | Machine-readable tokens and utilities (Tailwind v4). If this guideline and the tokens disagree, the tokens win. |
| `src/app/globals.css` | Global polish: scrollbars, reveal, segmented thumb, overlay exits, view transitions, reduced motion. |
| `src/components/ui/*` | The UI kit. Build every surface from it. |
| `src/lib/aura.ts`, `src/lib/haptic.ts` | The generative aura palettes and the `haptic()` helper. |
| `/kit` (demo mode only) | A live reference for every component, including a product-led hero composition you can copy. |
| `docs/art-direction.md` | Photography. §5 (fallbacks) is superseded by §9 of this document. |

**What changed from v1, in one paragraph.** v1 read like a printed editorial: beige surfaces, 2 px corners, flat panels and dark blocks. v2 keeps the warm family and the German voice, but executes like a premium product. Surfaces are near-white and layered. Cards float on soft multi-layer shadows, and overlays are glass. Corners are soft. One signature, the **SOMA aura** (ultramarine → violet → peach), appears sparingly. Display type is an engineered grotesk, with a serif italic as the emotional accent. Every interaction answers tactilely, and ambient motion is slow and quiet (*Bewegung und Ruhe*).

---

## 1. Brand concept (unchanged)

*Soma* is Greek σῶμα, **the body**. The idea is ***Schon da.*** (*Already there.*): you don't go anywhere. The professional arrives at the Altbau living room, the hotel suite or the meeting room. Three consequences carry into v2:

1. **Home, not spa.** The colours are named after a lived-in apartment: Kalk, Leinen, Naht, Zinn, Graphit, Tinte. No stones, water, leaves or lotus.
2. **Precise place and time.** The *Ortszeile* (place line) names a real situation: *Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10*.
3. **One point of colour.** Ultramarine is the "you are here" dot from maps. In v2 it is lighter and brighter, and it carries the aura.

Never write copy about bliss, escape or "switching off". The voice is grounded, bodily and precise.

## 2. Logo

The assets, construction and renaming procedure are unchanged (`public/brand/*`, `src/components/brand/logo.tsx`).

- **Wordmark:** use Tinte on light surfaces and white on night or photo with scrim. It is never ultramarine, never an aura gradient, never outlined and never animated.
- **σ mark:** at small sizes in product chrome, place it on an ink tile with a 9 px radius (`MarkTile` in the admin shell). The favicon uses the same tile with an 8 px radius.
- **"Pro" marker:** next to the wordmark in `/pro`, a small ink pill with an aura dot. Do not build a lockup in any other way.
- **Roof line (Dachlinie):** in v2 it is a 20 × 2 px **aura line** with round caps (`<AuraLine />`, or `bg-aura h-0.5 w-5 rounded-full`). It still means "where you are": overlines, the active mobile menu item, *Heute* in the date strip, the current step, and copyright. It is never a divider.

## 3. Voice and tone for visual copy (unchanged)

- **Address:** customer UI uses *Sie*, `/pro` uses *du*, and `/admin` is neutral.
- **Tone:** no exclamation marks, no emoji, no spa clichés.
- **Headlines:** short declaratives ending in a full stop, with an optional second clause in `<em>`: *Massage. <em>Bei Ihnen zu Hause.</em>* In v2 the `<em>` automatically switches to the accent serif (§5).
- **Block hierarchy:** Overline → Display → Body (at most two sentences) → Action (verb + object).
- **Formats:**
  - German formats with non-breaking spaces: `89,00 €`, `19:30`, `Fr., 14. Nov.`, `18:00–19:30`, `4,9`, `60 Min.`
  - The final checkout button is fixed by law: **Zahlungspflichtig buchen · 84 €**.
- **Rule for every agent:** keep visible texts and accessible names, because the E2E suite depends on them. Change copy only when the change is a real improvement, and update the test in the same change.

---

## 4. Colour

### 4.1 Palette

The values are lighter than v1. The token **names** are the same as in v1, so existing utilities keep working. Use the semantic utility in components and never a primitive.

| Role | Primitive | Hex | Utility | Use |
|---|---|---|---|---|
| Page | Kalk | `#FAF9F7` | `bg-surface` | Page background, near-white with a whisper of warmth |
| Raised | Weiß | `#FFFFFF` | `bg-surface-raised` | Cards, inputs, sheets, tables |
| Sunken | Leinen | `#F3F1ED` | `bg-surface-sunken` | Hover fills, skeletons, segmented track, level 0 |
| Pressed | Sand | `#EBE8E2` | `bg-surface-pressed` | Pressed ghost controls, switch track (off) |
| Tint | Hauch | `#F6F7FF` | `bg-surface-tint` = `bg-accent-tint` | Row hover in tables, info notices, selected list rows |
| Hairline | Naht | `#E8E4DE` | `border-line`, `bg-line` | Decorative dividers only (1.27:1) |
| Mid line | Naht mittel | `#D7D2CA` | `border-line-mid` | Chip, slot and secondary button borders (the text identifies the control) |
| Control border | Zinn | `#8E887E` | `border-line-strong` | Inputs, checkboxes, radios, switch ring: **3:1 boundary** |
| Secondary text | Graphit | `#6B665E` | `text-ink-muted` | Meta, hints, placeholders, inactive nav |
| Ink | Tinte | `#1C1B19` | `text-ink`, `bg-ink` | Text, primary buttons, selected states |
| Ink hover | | `#34322E` | `bg-ink-hover` | Primary hover |
| Disabled | | `#B3AEA6` | `text-ink-disabled` | Inactive controls only (WCAG-exempt) |
| Accent | Ultramarin | `#3D4FF0` | `text-accent`, `bg-accent`, `focus` | Links, focus, verified, live, count badges, chart series 1 |
| Accent hover | Ultramarin tief | `#2F40DA` | `text-accent-hover` | Link hover |
| Accent soft | Ultramarin hell | `#EEF0FF` | `bg-accent-soft` | Verified pill, accent badge, selection |
| Success | | `#157347` / soft `#EAF6F0` | `text-success`, `bg-success-soft` | Confirmed, paid, positive delta |
| Warning | | `#875800` / soft `#FDF4E2` | `text-warning`, `bg-warning-soft` | Requested, expiring, demo |
| Danger | | `#BE3127` / soft `#FDEDEB` | `text-danger`, `bg-danger-soft`, `bg-danger` | Errors, cancellations, destructive |
| Scrim | | Nacht at 62 % | `bg-scrim` | Under any text on a photo |
| Backdrop | | `rgb(23 22 31 / 0.28)` + 6 px blur | `dialog::backdrop` | Behind sheets and modals (automatic) |

**Night scope.** `<section data-theme="night">` remaps every token, so components need no dark variants. The night values are: surface `#151418`, raised `#201F24`, ink `#F7F6F3`, muted `#AAA7B0`, accent `#9AA6FF`, line-strong `#7D7A84`, success `#6FD0A0`, warning `#EBBD5E`, danger `#FF8F80`. **v2 rule:** use at most **one** deliberate night band per customer page (for example *Für Profis* or *Abends im Hotel*). The footer, the mobile menu and toasts are light now. Never use night in `/admin`.

### 4.2 The SOMA aura (signature)

| Token | Hex | Utility |
|---|---|---|
| `--color-aura-1` Blau | `#5466FF` | `bg-aura-1` |
| `--color-aura-2` Violett | `#9F8BFF` | `bg-aura-2` |
| `--color-aura-3` Pfirsich | `#FFA894` | `bg-aura-3` |
| `--color-aura-4` Aprikose | `#FFD3B8` | `bg-aura-4` |
| `--gradient-aura` | linear 118°: 1 → 2 (42 %) → 3 (78 %) → 4 | `bg-aura` |
| `--gradient-aura-soft` | three radial washes | `bg-aura-soft` |

**Where the aura goes.** It is a signature, not a fill. Use it in these places only:

- **The hero:** `AuraBackground` or a `FloatingStage`.
- **Highlight lines:** the roof line, the current step, the *Neu auf SOMA* dot.
- **One key badge per view:** `Badge tone="aura"`, `aura-border`.
- **The focus glow and chart fills.**
- **Empty-state and fallback art:** `AuraArt`, `EmptyArt`.

**Never:**

- a full-bleed aura button, or an aura section background on every section;
- gradient text;
- the aura on `/admin` surfaces beyond charts, the σ tile and the aura line;
- pink-dominant washes or rose-gold.

**Text on aura.** Ink is always safe: it measures ≥ 11:1 even on the strongest hero peak. Muted text is AA on the `section` and `subtle` intensities (≥ 4.53:1). It is **not** AA on the `hero` intensity peaks (3.68–4.74:1). So on a hero, keep muted text away from the glow (use `placement="right"` with the text on the left), or set it on a surface or card.

### 4.3 Proportions and rules

- **Roughly 75 % near-white surfaces, 20 % ink, 5 % accent and aura.**
- **Primary actions are ink pills.** Use `variant="accent"` only for a single key action on a screen that has no other primary. Ultramarine stays a pointer.
- **Selected states are ink fills** (chips, slots, dates, segmented, switch, checkbox, radio). Colour never carries meaning alone: status always comes with a word.

### 4.4 Charts

Series follow this order: `chart-1` ultramarine `#3D4FF0`, `chart-2` violet `#8B5CF6`, `chart-3` ember `#D9704A`, `chart-4` teal `#0F9D8A`, `chart-5` pewter `#8E887E` (comparison or previous period, dashed).

- Gridlines are `chart-grid`, 1 px, dashed `2 4`.
- Area fills are a vertical gradient from the series colour at 22 % to transparent.
- Use at most four series.
- Status series use the semantic colours.
- The last point is marked with a white dot, a 2 px ring and a 6 px halo.

### 4.5 Contrast (WCAG 2.2, computed)

All ratios were computed with the WCAG relative-luminance formula (script values, two decimals). Body text needs ≥ 4.5:1. UI boundaries and graphics need ≥ 3:1.

| Pair | Colours | Ratio | Level |
|---|---|---|---|
| Ink on surface / raised / sunken / pressed / tint | `#1C1B19` on `#FAF9F7` / `#FFF` / `#F3F1ED` / `#EBE8E2` / `#F6F7FF` | 16.36 / 17.21 / 15.26 / 14.07 / 16.12 | AAA |
| Muted on surface / raised / sunken / tint | `#6B665E` | 5.41 / 5.70 / 5.05 / 5.33 | AA |
| Muted on accent-, success-, warning-, danger-soft | | 5.03 / 5.14 / 5.21 / 5.01 | AA |
| Ink on accent-, success-, warning-, danger-soft | | 15.20 / 15.52 / 15.75 / 15.15 | AAA |
| Accent on surface / raised / sunken / accent-soft / tint | `#3D4FF0` | 5.58 / 5.87 / 5.21 / 5.19 / 5.50 | AA |
| Accent hover on surface / raised / accent-soft | `#2F40DA` | 6.96 / 7.33 / 6.47 | AA (AAA on raised) |
| White on ink / ink-hover (primary button) | | 17.21 / 12.79 | AAA |
| White on accent / accent-hover (accent button, count pill) | | 5.87 / 7.33 | AA / AAA |
| Success on surface / raised / sunken / success-soft | `#157347` | 5.58 / 5.87 / 5.21 / 5.30 | AA |
| Warning on surface / raised / sunken / warning-soft | `#875800` | 5.83 / 6.13 / 5.43 / 5.61 | AA |
| Danger on surface / raised / sunken / danger-soft | `#BE3127` | 5.46 / 5.74 / 5.09 / 5.05 | AA |
| White on danger (destructive button) | | 5.74 | AA |
| Night ink on night / night-raised | `#F7F6F3` | 16.97 / 15.15 | AAA |
| Night muted on night / night-raised | `#AAA7B0` | 7.74 / 6.91 | AAA / AA |
| Night accent on night / night-raised | `#9AA6FF` | 8.10 / 7.23 | AAA |
| Night success / warning / danger on night | | 9.79 / 10.46 / 8.29 | AAA |
| Ink on night accent (night on-accent) | | 7.60 | AAA |
| Ink on `glass-strong` (90 %), worst case over black | → `#E6E6E6` | 13.79 | AAA |
| Muted on `glass-strong` (90 %), worst case over black | | 4.56 | AA |
| Ink on `glass` (72 %), worst case over black | → `#B8B8B8` | 8.68 | AAA (**ink only** on `glass`) |
| Muted on a glass sheet over the dimmed backdrop | → `#F4F4F4` | 5.18 | AA |
| White on photo + 62 % scrim, worst case (white pixel) | → `#6E6D70` | 5.14 | AA |
| Ink on the hero aura peak: blue / violet / peach / apricot | | 11.11 / 12.78 / 12.90 / 14.33 | AAA |
| Muted on the hero aura peak: blue / violet / peach / apricot | | 3.68 / 4.23 / 4.27 / 4.74 | **Not for text** (see §4.2) |
| Muted on the section aura peak: blue / violet / peach / apricot | | 4.53 / 4.70 / 4.59 / 4.87 | AA |
| Muted on the subtle aura peak: blue / violet / peach / apricot | | 4.77 / 4.89 / 4.78 / 5.01 | AA |
| *Non-text:* line-strong vs surface / raised / sunken | `#8E887E` | 3.34 / 3.52 / 3.12 | Pass |
| *Non-text:* focus outline (accent) vs surface / raised / sunken | | 5.58 / 5.87 / 5.21 | Pass |
| *Non-text:* ink selected fill vs surface / raised / sunken | | 16.36 / 17.21 / 15.26 | Pass |
| *Non-text:* night line-strong vs night / night-raised | `#7D7A84` | 4.36 / 3.89 | Pass |
| *Non-text:* chart 1–5 vs raised / surface | | 5.87·5.58 / 4.23·4.02 / 3.30·3.13 / 3.38·3.21 / 3.52·3.34 | Pass |

- **Decorative lines.** `line` (1.27:1) and `line-mid` (1.50:1) are decorative. They are allowed as borders only where the label text identifies the control: chips, slots, secondary buttons and cards. Inputs, checkboxes, radios and the switch use `line-strong`.
- **Exempt.** `ink-disabled` is for inactive controls, which WCAG exempts. Placeholders use full `ink-muted` (5.70:1), never a lighter tint.

---

## 5. Typography

### 5.1 Families and budget

| Role | Family | Loading | Why |
|---|---|---|---|
| UI and display | **Inter** (variable `wght` 100–900 + `opsz` 14–32) | `next/font/google`, latin, **preloaded** (~73 KB) | An engineered grotesk with real optical sizes: from 32 px the display cut tightens spacing and details automatically (`font-optical-sizing: auto`). It has first-class tabular figures, `ss01` open digits and `ss03` round quotes for „…“. |
| Emotional accent | **Newsreader Italic**, display cut (opsz 72, wght 400) | `next/font/local`, `src/styles/fonts/newsreader-display-italic.woff2`, latin, **preloaded** (23 KB), SIL OFL | v1's serif, kept as the warm counterpoint. It is self-hosted as the static display instance: the variable version with its `opsz` axis costs 147 KB. |
| References | **DM Mono** 400/500 | `next/font/google`, **not preloaded** | Booking references and IDs in `/pro` and `/admin` only (`code-ref`). |

The budget on `/` is 2 preloaded files and about **96 KB** in total (the brief allows 2 files and 150 KB). The Inter latin-ext file loads only when such glyphs appear (*Doğan*).

The CSS variables are `--font-sans-src` (Inter), `--font-accent-src` (Newsreader) and `--font-mono-src`. The theme exposes `font-sans`, `font-display` (Inter as well), `font-accent` and `font-mono`.

### 5.2 Scale

Use the composite `type-*` utilities. They set family, size, leading, tracking, weight and wrapping. Display sizes are fluid between 360 and 1280 px.

| Utility | Face / weight | Mobile → desktop | Leading | Tracking | Use |
|---|---|---|---|---|---|
| `type-display-xl` | Inter 600 | 40 → 80 | 1.02 | −0.040em | Home hero only, one per page |
| `type-display-l` | Inter 600 | 32 → 56 | 1.06 | −0.036em | Marketing section titles |
| `type-display-m` | Inter 600 | 28 → 40 | 1.10 | −0.030em | Provider name, category pages, confirmation |
| `type-display-s` | Inter 600 | 22 → 28 | 1.18 | −0.022em | Page titles in the account and `/pro`, empty states, quotes |
| `type-heading-l` | Inter 600 | 20 → 24 | 1.25 | −0.020em | App screen titles, dashboard titles, dialogs |
| `type-heading-m` | Inter 600 | 17 → 18 | 1.30 | −0.014em | Section and list titles |
| `type-heading-s` | Inter 600 | 15 | 1.35 | −0.009em | Group titles, card titles |
| `type-body-l` | Inter 400 | 17 → 19 | 1.60 | −0.011em | Lead paragraphs |
| `type-body` | Inter 400 | 16 | 1.55 | −0.008em | Default |
| `type-body-s` | Inter 400 | 14 | 1.50 | −0.004em | Secondary info, tables |
| `type-label` | Inter 520 | 15 | 1.20 | −0.008em | Buttons, tabs, slots |
| `type-label-s` | Inter 520 | 13 | 1.20 | −0.002em | Field labels, small buttons, table headers, pills |
| `type-caption` | Inter 460 | 12 | 1.40 | 0.002em | Timestamps, helper text, nav labels |
| `type-overline` | Inter 600, uppercase | 12 | 1.20 | 0.08em | Eyebrows (at most three words) |
| `type-stat` | Inter 600, tabular, `ss01` | 28 → 36 | 1.05 | −0.032em | KPI values |
| `type-accent` | Newsreader Italic 400 | inherits | inherits | −0.012em | Tagline, quotes, decorative words |

### 5.3 Rules

- **The accent is automatic.** An `<em>` or `<i>` inside any `type-display-*` or `type-heading-l` renders in Newsreader Italic at 1.06em with no extra leading. `type-display-* italic` and `font-display italic` do the same. Use one accent clause per headline at most, and never in UI labels, buttons, inputs or tables.
- **Wrapping is built in.** Headlines use `text-wrap: balance`; paragraphs and list items use `pretty`. German hyphenation is unchanged from v1: insert `&shy;` into headline compounds of more than 14 characters. Body text uses `hyphens: auto` with `hyphenate-limit-chars: 10 4 4`.
- **Numbers use `num`.** Apply `num` (tabular, lining) to prices, times, dates, counts and table columns. `type-stat` includes it.
- **`condensed`** tightens tracking by 0.02em for long labels in chips, tabs and table headers. Inter has no width axis.
- **Sizes.** Text is never smaller than 12 px, and form fields are 16 px (no iOS zoom).

---

## 6. Space, grid and layout

These are unchanged from v1, except that the header is now 60/68 px and sections are 72/96/128 px.

- **Spacing:** use the 4 px base and only the steps 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 160.
- **Gutters:** `--space-gutter` is 20/32/48 px. Use `px-(--space-gutter)`.
- **Containers:** `max-w-page` 1376, `max-w-content` 1152, `max-w-reading` 608, `max-w-form` 480, `max-w-sheet` 560 and `max-w-dashboard` 1440. Use them through `<Container width="…">`.
- **Grid:** 4 columns below 768 px, 8 at 768–1023 px and 12 from 1024 px. Gaps are 12/20/24 px.
- **Layering:** `z-(--z-header)` 30, bottom nav 30, sticky CTA 35, overlay 40, sheet 50, modal 60, toast 70.
- **Fixed bottoms:** fixed bottom elements add `env(safe-area-inset-bottom)`, and page content reserves `--bottom-nav-height`.
- **No horizontal scroll at 320 px.** Every grid child that may hold wide content gets `min-w-0`. Decorative layers stay inside an `overflow-clip` parent.

---

## 7. Shape, elevation and glass

### 7.1 Radii: soft geometry, one family per component type

| Utility | Value | Component types |
|---|---|---|
| `rounded-control` (and the legacy `rounded-xs`, bare `rounded`) | 10 px | Inputs, selects, textareas, menu items, inline hover areas, sidebar items |
| `rounded-tile` | 14 px | Time slots, date cells, notices, toasts, popovers, list thumbnails and portraits ≤ 120 px |
| `rounded-card` | 20 px | Cards, panels (`Panel`), tables, stat tiles, dialogs, desktop sheets |
| `rounded-panel` | 28 px | Hero panels, feature cards, large media, the night band |
| `rounded-sheet` | 28 px | Top corners of bottom sheets |
| `rounded-full` | pill / circle | **Buttons**, chips, segmented, badges, status pills, avatars, switches, count pills |

- **Nested radii:** an inner element uses the outer radius minus the padding (a 20 px card with 6 px padding → 14 px inner).
- **No 2 px corners anywhere.** `rounded-xs` now *is* 10 px.

### 7.2 Elevation: three levels, each with its own hairline

| Level | Utility | Recipe (shadow colour `rgb(23 22 31)`, ink with a breath of violet) | Use |
|---|---|---|---|
| 0 | `bg-surface-sunken` | none | In the page: segmented track, level-0 groups, skeletons |
| 1 | `shadow-raised` | 1 px ring at 6 % + 1/2 px at 4 % + 3/8 px at 5 % | Resting cards, tables, stat tiles, panels, sidebar active item |
| 2 | `shadow-float` | ring 5 % + 2/4 + 8/16 + 20/40 px layers | Hover lift, popovers, floating hero cards, toasts, empty-state art |
| 3 | `shadow-overlay` (= `shadow-modal`) | ring 6 % + 4/8 + 16/32 + 40/80 px | Dialogs, desktop sheets |
| | `shadow-sheet` | upward | Bottom sheets |
| | `shadow-bar` | upward hairline + soft lift | Sticky bottom CTAs |
| | `shadow-ink` / `shadow-accent` | inset highlight + coloured drop | Primary ink and accent buttons, selected chips, slots and dates |
| | `shadow-aura` | ultramarine + peach glow | One hero card per view |
| | `inset-shadow-field` / `inset-shadow-sunken` | 1 px inner | Inputs; sunken tracks |

- **Hairlines are built in.** Every level includes its hairline, so a raised surface never needs a `border`.
- **No double borders.** Never draw a bordered panel inside a bordered panel. Group content with space, not boxes.

### 7.3 Glass

| Utility | Recipe | Use | Text |
|---|---|---|---|
| `glass` | white 72 %, `blur(20px) saturate(1.8)` | Floating cards on aura, decorative layers | **Ink only** |
| `glass-strong` | white 90 %, `blur(24px) saturate(1.8)` | Sticky header (on scroll), checkout header, account header, `/pro` and `/admin` top bars, bottom nav, sticky CTA, sheets, toasts, modals | Ink and muted |
| `glass-edge` | inner top highlight + 1 px outer hairline, composed with any `shadow-*` | Add to every glass layer | |

- **Fallback:** without `backdrop-filter`, glass becomes white at 96–97 %.
- **Night:** in a night scope, glass remaps to `rgb(32 31 36 / 0.66–0.82)`.

---

## 8. Components (UI kit)

Every interactive element is at least 44 × 44 px (`size-touch`, or a pseudo-element hit area). Use `focus-ring` (a 2 px accent outline plus a 6 px glow) on anything focusable that you build yourself; kit components already have it.

### 8.1 Controls

| Component | Import | v2 spec |
|---|---|---|
| `Button`, `ButtonLink`, `buttonClasses()` | `@/components/ui/button` | Pill. Sizes are S 36, M 44 and L 52. Variants: `primary` (ink + `shadow-ink`), `secondary` (white + mid ring), `ghost`, `accent`, `link`, `destructive`. Hover lifts filled variants by 1 px; the press scales to 0.97 on a spring; `focus-ring`. **Loading** blurs and fades the label out while the spinner springs in, at the same width, with `aria-busy`. |
| `IconButton` | same | 44 px circle, ghost. Always pass `label`. |
| `Input`, `Textarea`, `Select` | `@/components/ui/field` | 48 px (`dense` 36), `rounded-control`, `border-line-strong`, `inset-shadow-field`. Focus: accent border plus a 4 px glow. Errors fade in with `CircleAlert`, `aria-invalid` and `aria-describedby`. The select chevron rotates while focused. |
| `Checkbox` | same | 20 px with a 6 px radius. The tick **draws in** (`stroke-dashoffset`) and the box settles on a spring. |
| `Switch` | same | 42 × 24. The knob springs across and stretches while pressed. Off: pressed fill with a line-strong ring. On: ink. |
| `RadioRow` | same | The dot springs in (border 1 → 6 px). |
| `Chip`, `ChipLink`, `ChipRow` | `@/components/ui/chip` | 36 px pill (44 px hit area). Rest: white with a `line-mid` border. Selected: ink + `shadow-ink`, **settles** (`animate-settle`); the check pops. |
| `SegmentedControl` | `@/components/ui/segmented` | Pill track on sunken. An ink thumb **slides** to the checked option (CSS `:has()`, up to 6 options, works without JS). |
| `TabLinks` | `@/components/ui/tabs` | 44 px with a hover pill. The active 2 px ink bar **glides** to the new tab on navigation (shared view transition). |

### 8.2 Overlays

| Component | Import | v2 spec |
|---|---|---|
| `Sheet` | `@/components/ui/sheet` | Mobile: `glass-strong` bottom sheet, 28 px top radius, spring entry, **drag the header down to dismiss** (rubber band upwards, dismiss at 110 px or a fast flick), and an exit animation before close. From `md` it becomes a centred white dialog (`rounded-card shadow-overlay`). `variant="drawer"` is a right-hand 400 px drawer. Built on `<dialog>`: focus trap, Esc and focus restore. |
| `Modal` | `@/components/ui/dialog` | Glass, `rounded-card`. Rises in and fades out. Only for consequential confirmations. On open, focus goes to the **first action** (the safe one, e.g. *Behalten*), never into a text field, so the mobile keyboard stays down. `initialFocus` takes `"actions"` (default), `"auto"` (platform default), a ref or a selector. |
| `useDialogMotion(open, onClose, initialFocus?)` | `@/components/ui/sheet` | Use it for any custom `<dialog>`: showModal, focus per `initialFocus`, exit animation, then close. `Sheet` accepts `initialFocus` too (default `"auto"`, the close button). |
| `ToastProvider`, `useToast()` | `@/components/ui/toast` | Glass tile that **springs in** and fades out. Success icons draw their check. `toast.show(msg, { kind, action, haptic: true })` (`haptic` for key confirmations). Shown for 5 s (8 s with an action) and paused on hover or focus. |

### 8.3 Content and status

| Component | Import | v2 spec |
|---|---|---|
| `Notice` | `@/components/ui/feedback` | `rounded-tile`, soft tone with a 1 px inner tone ring and a tone icon. The info kind is accent-tinted. |
| `Status` | same | **Pill:** soft tone background, tone text and a 6 px dot. The `accent` tone (live) has a slow ping. `variant="dot"` is the plain dot plus ink word for very dense rows. |
| `Badge`, `Kbd` | `@/components/ui/badge` | Badge tones: `neutral`, `accent`, `success`, `warning`, `danger`, `ink` and `aura` (one key badge per view). Sizes `s` and `m`, plus an optional `dot` or `icon`. `Kbd` is a keyboard hint, always paired with text. |
| `CountPill` | `@/components/ui/feedback` | 18 px, tabular. The accent variant has a soft glow. |
| `EmptyState`, `EmptyArt` | same | Seeded aura art (a tile with two floating glass cards), `type-display-s` title, one or two muted lines and one action. `art={false}` keeps only the aura line (dense contexts). `seed` and `tone` control the art; `align="center"` is for full-page empties. |
| `Skeleton`, `SkeletonText` | same | Sunken fill with a transform-only light **shimmer**. The default radius is 10 px; pass a `rounded-*` class to match the final shape. Text bars are pills. |
| `VerifiedBadge`, `Rating`, `Stars` | `@/components/ui/trust` | `withLabel` renders an accent-soft pill reading *Verifiziert*. The rating star stays ink (never yellow). *Neu auf SOMA* gets an aura dot. |
| `PriceBreakdown`, `CheckLine`, `StepIndicator` | `@/components/ui/summary` | The total is `type-heading-l num` above a dashed mid line. `CheckLine` uses a success disc. The step indicator has 4 px pill segments: done is ink, current is aura, and the fill animates. |
| `SuccessCheck` | `@/components/ui/success` | The confirmation moment: the ring pops, then the check draws in. The halo is a bounded radial gradient, `glowSize` px beyond the ring (default ≈ 22 % of `size`), isolated beneath the ring, so it never spills onto neighbours. `glow={false}` or `glowSize={0}` removes it. |

### 8.4 Data

| Component | Import | v2 spec |
|---|---|---|
| `StatGrid`, `StatTile` | `@/components/ui/data` | Floating level-1 cards with a 12/16 px gap. **When you stack two grids, wrap them in `flex flex-col gap-3`.** The tile holds an optional `icon`, a `type-stat` value, a delta **pill** (success or danger soft) and an optional `spark={number[]}` (built-in gradient sparkline) or a custom `sparkline`. For a count-up: `value={<CountUp value={38} />}`. |
| `Sparkline` | same | Smooth monotone line in `currentColor` (accent by default) with a gradient fill and a last-point dot. Decorative. |
| `Table` | same | Level-1 card. 40 px muted header, rows 52 px (`dense` 40 px), hairlines, tinted row hover. `stickyHeader` gives a blurred glass header. |
| `AreaChart` | `@/components/ui/chart` | SVG with a gradient fill, monotone curve, a dashed `compare` series, round ticks in a right gutter and a marked last point. `role="img"` with the **required** `summary` text. |
| `DateStrip`, `TimeSlots` | `@/components/ui/booking` | Cells and slots are white tiles (`rounded-tile`). The selection settles into ink. *Heute* has an aura line. Radiogroup semantics and arrow keys are unchanged. |

### 8.5 Media

| Component | Import | v2 spec |
|---|---|---|
| `Avatar` | `@/components/ui/avatar` | Circle ≤ 48 px. Monogram in the palette's deep hue on a **seeded aura tile** with a white inner ring and a hairline. The photo fades in over it. |
| `Portrait` | same | 1:1 or 4:5, `rounded-tile` by default (pass `rounded-card` or `rounded-panel` for large ones). The fallback is the person's seeded `AuraArt` plus a monogram. From 10 rem wide, the monogram sits on a glass disc. |
| `Photo`, `TonePanel` | `@/components/ui/photo` | Same API as v1. `tone` is the category slug or `nacht`; `word` is set in the accent italic over the category's generative art. The optional `seed` defaults to tone + word. The photo fades in over the panel (640 ms). `wordSize="l"` adds slow ambient drift; use it for one hero-sized panel only. |

### 8.6 Layout and shells

| Component | Import | v2 spec |
|---|---|---|
| `Container`, `Section`, `SectionHeader`, `PageHeader`, `FactList` | `@/components/ui/layout` | Unchanged API. |
| `Overline` | same | Aura line followed by the label (inline). |
| `Panel` | same | Level-1 card, `rounded-card` (override with any `rounded-*`). |
| `BottomNav` | `@/components/ui/nav` | Glass mobile bottom nav. The active item sits in a soft pill that glides between items (shared view transition). Used by `/pro` and `/konto`. |
| `Spinner` | `@/components/ui/spinner` | A 2 px conic ring. It keeps turning under reduced motion (slower), because it is essential feedback. |
| `DemoRibbon` | `@/components/ui/demo-ribbon` | Light strip with a warning *Demo* pill. Same accessible name. |

---

## 9. Imagery, aura art and product-led visuals

### 9.1 Photography

Photography follows `docs/art-direction.md` §1–4.

- **Corners:** images inside cards inherit the card radius minus the padding. Standalone media uses `rounded-panel` (large) or `rounded-tile` (thumbnails).
- **Shadows:** media never has its own shadow; the surrounding card carries it.
- **Text on photos:** always add `bg-scrim` (62 %).

### 9.2 Generative aura art (replaces the v1 tone panels)

A missing image must look intentional. `AuraArt` renders three seeded glows in the category's hues, a soft white highlight, a tinted base and fine film grain (`grain`). The seed (slug, name or id) makes it deterministic: server and client agree, so there is no flicker and no hydration mismatch. Palettes live in `src/lib/aura.ts` (`CATEGORY_AURA`, plus six person palettes).

| Slug | Wash | Glows | Deep hue (monogram) |
|---|---|---|---|
| `massage` | `#FBF1EA` | peach `#FFB99A`, terracotta rosé `#F59E86`, violet `#B5A6FF` | `#C76A4F` |
| `manikuere` | `#FBEFF0` | rosé `#FFB3B8`, apricot `#FFCFA8`, blue `#A9B4FF` | `#C25A6C` |
| `pedikuere` | `#FAF3E8` | honey `#FFD19A`, peach `#FFB08F`, blue `#9FB0FF` | `#B7791F` |
| `kosmetik` | `#EEF5F2` | mint `#A8DCCB`, blue `#A9BDFF`, apricot `#FFD4BE` | `#2F8A72` |
| `make-up` | `#F4F0FB` | lilac `#C3AEFF`, rose `#FFADC0`, peach `#FFCBA6` | `#7C5CE0` |
| `haare-styling` | `#FAF2E6` | amber `#FFC98A`, coral `#F7A98E`, lavender `#B9B0FF` | `#B26A1E` |
| `brows-lashes` | `#EEF0FF` | ultramarine `#6F7DFF`, violet `#A88CFF`, peach `#FFB7A0` | `#3D4FF0` |
| `nacht` | `#151418` | ultramarine, violet, ember (dark art) | `#9AA6FF` |

Artwork is decorative (`aria-hidden`); the real label is always rendered as text elsewhere.

### 9.3 Product-led visuals

The hero and the marketing sections show **the product itself**: real SOMA components as floating, layered cards on an aura. Copy the reference composition from `/kit` (the top section):

- a provider result card with slot chips;
- a *Bestätigt* glass card with `SuccessCheck`;
- the Start-Code card with staggered digits;
- a travel-fee line.

Photos, where they exist, are an extra layer and never the only content. Rules:

- **Decorative:** the stage is `aria-hidden` and `inert`. Never put real links or forms in it. Repeat the real action next to it.
- **Fixed height:** give the stage a fixed height (`h-[26rem] lg:h-[34rem]`) so nothing shifts.
- **Card count:** use three to four cards, with at most two `float` and one `glass`. Depths are 8–28 px and tilts ±1–3°.
- **Mobile:** keep two or three cards and hide the rest with `hidden sm:block`.

### 9.4 Icons

The icon set is lucide. Use `<Icon icon={X} />` (1.5 px absolute stroke), sizes 16/18/20/24, and `currentColor`. Active navigation icons use a stroke of 1.9–2 and may take the accent colour in sidebars. Banned icons: `Sparkles`, `Leaf`, `Flower`, `Droplet(s)`, `Gem`, `Crown`, `Wand` and any spa imagery. Only `Star` is filled.

---

## 10. Motion and haptics: *Bewegung und Ruhe*

Interactions answer instantly (100–280 ms). Ambient motion is slow and quiet (20–40 s). Nothing is frantic: no bouncing loops, and no motion that delays content or shifts layout. Everything is CSS-first; JS only decides **when**.

### 10.1 Tokens

| Token | Value | Use |
|---|---|---|
| `duration-instant` | 100 ms | Press feedback |
| `duration-fast` | 160 ms | Hover, focus, colour (default) |
| `duration-base` | 220 ms | Menus, toasts, tabs, fades |
| `duration-slow` | 280 ms | Sheets, dialogs, drawers |
| `duration-spring` | 420 ms | Anything on a spring curve (the tail settles) |
| `duration-calm` | 640 ms | Image fade, reveals, check draw |
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | State changes (default) |
| `ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Arrivals (expo out) |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Departures, about ⅔ of the entry duration |
| `ease-calm` | `cubic-bezier(0.4, 0, 0.2, 1)` | Fades |
| `ease-ambient` | `cubic-bezier(0.45, 0, 0.55, 1)` | Drift and breathe |
| `ease-spring` | `linear(…)`, damped oscillator ζ 0.65, ≈ 7 % overshoot | Knobs, checks, toasts, press release |
| `ease-settle` | `linear(…)`, ζ 0.75, ≈ 3 % overshoot | Chips, slots, dates, sheets, segmented thumb, lift |

The animation utilities are `animate-fade-in`, `animate-sheet-in`, `animate-dialog-in`, `animate-toast-in`, `animate-pop`, `animate-settle`, `animate-rise`, `animate-draw` (SVG paths with `pathLength={1} strokeDasharray={1}`), `animate-float-in` (transform only), `animate-float`, `animate-aura-drift`, `animate-aura-drift-2`, `animate-aura-breathe`, `animate-skeleton` (shimmer) and `animate-spin`. The class `stagger-rise` staggers direct children by 50 ms.

### 10.2 Tactile utilities

| Utility | What it does | Put it on |
|---|---|---|
| `pressable` | Scales to 0.97 while held (100 ms), springs back (420 ms `ease-spring`). Transitions colour, shadow, scale and translate. Uses the individual `scale` property, so it composes with `lift`. | Buttons, chips, slots, nav items, icon buttons (built in) |
| `lift` | On pointer devices, hover rises 2 px and moves to `shadow-float` with `ease-settle`; press scales to 0.985. | Whole-card links (`<Surface interactive>`) |
| `focus-ring` | 2 px accent outline at 2 px offset plus a 6 px `focus-glow` halo, composed with existing shadows | Anything focusable you build yourself |
| `spotlight` | The pointer-following light layer (use `<Spotlight>`) | Large cards, hero panels |
| `ambient` | Pauses its animation offscreen (`data-ambient="off"`) and in hidden tabs | Any looping decoration |

### 10.3 Motion primitives

**`Reveal`** (`@/components/ui/motion`). Content fades up by 10 px once, when it scrolls into view. Content on screen at mount is never hidden, so there is no flash and no LCP cost. It is off with reduced motion and without JS.

```tsx
<Reveal as="section" className="…">…</Reveal>
<Reveal stagger className="grid gap-4 md:grid-cols-3">{cards}</Reveal>   {/* children 60 ms apart */}
<Reveal delay={120}>…</Reveal>
```

**`CountUp`**. Use it for stats. It runs for 900 ms with expo-out.
- **Hydration-safe:** the first client render always equals the server value, also inside streamed `loading.tsx` boundaries (it tells hydration from a fresh client mount per component with `useSyncExternalStore`).
- **On first load:** values already on screen stay final (no flash). Below the fold, the value counts up when scrolled to.
- **After a client navigation:** it counts up on mount.
- **When `value` changes,** it glides from the number currently shown; re-renders with the same value do nothing.
- Screen readers always get the final value. Reduced motion shows the final value.

```tsx
<StatTile label="Umsatz (Woche)" value={<CountUp value={4820} suffix=" €" />} delta={12} spark={weeks} />
<CountUp value={4.9} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
```

**`Spotlight`**. A soft ultramarine-to-peach light follows the pointer. The light is an overlay **above** the content (`pointer-events: none`), so it shows on opaque cards: `variant="fill"` (default) tints the surface with a multiply blend (text stays AA), `"border"` lights a 1 px rim, `"both"` does both. It only appears on `pointer: fine` devices, costs one rAF per move and is off with reduced motion. Give the wrapper the same radius as the card.

```tsx
<Spotlight className="rounded-panel" variant="both"><Surface radius="panel" interactive as={Link} href="…">…</Surface></Spotlight>
```

**`Parallax`** (`@/components/ui/floating`). Scroll-linked depth in pure CSS (`animation-timeline: view()`). Use 8–24 px. It is off with reduced motion and where unsupported.

```tsx
<Parallax depth={16}><Surface className="p-4">…</Surface></Parallax>
```

**`RouteTransition`** (`@/components/ui/motion`). The page cross-fade on client navigation. With the View Transitions API, the old page fades out in 140 ms and the new one rises in 6 px; without it, the new page cross-fades in. Only pathname changes animate, not search params, refreshes or server actions. It is already wired into the site, checkout, account, `/pro` and `/admin` shells, so do not add it to pages. For your own shared-element morphs, use React's `<ViewTransition name="…" share="soma-morph" default="none">` (as in `TabLinks` and `BottomNav`). Full page loads use `@view-transition { navigation: auto }`.

**Automation.** Under `navigator.webdriver` (E2E, QA screenshots), `Reveal` and `CountUp` render their final state immediately. Full-page captures do not scroll, so nothing may wait for a scroll.

**`Ambient`** (`@/components/ui/motion`). The gate for slow loops: a `div` whose `ambient` descendants run only while it is near the viewport. Its `data-ambient` attribute is React state (`"off"` on the server and on the first client render, switched after mount), so it is **hydration-safe anywhere**, including streamed Suspense boundaries. `AuraArt animate`, `AuraBackground` and `FloatingCard float` use it, so the drift can stay on everywhere.

**`MotionRoot`**. It is mounted once in `app/layout.tsx`. It never touches React-rendered attributes. It:

- pauses ambient motion in hidden tabs (`html[data-hidden]`);
- adds smooth scrolling to same-page anchor links (`#inhalt`, `#preis`) and moves focus to the target;
- leaves programmatic scrolls instant, because a global `scroll-behavior: smooth` makes the router, focus and tests racy.

**`haptic()`** (`@/lib/haptic`). Real device feedback through `navigator.vibrate`, feature-detected. It is silent on iOS and desktop, and off with reduced motion.

```ts
haptic("success"); // booking confirmed, request accepted, treatment started (Start-Code)
haptic("warning"); // destructive confirmation (cancel)
haptic("select");  // rare: date picked in a long flow
```

Call it only on **key confirmations**, after the action resolves, never on every tap. `toast.show(msg, { haptic: true })` does it for you.

**`SuccessCheck`**. Use it on *Bestätigt.*, *Gespeichert*, *Angenommen*: `<SuccessCheck size={56} />` next to the word, plus `haptic("success")` on the client.

### 10.4 Ambient calm

- **Aura drift:** aura blobs drift and breathe in 24–38 s loops (transform and opacity only).
- **Floating cards:** at most two per stage use a 9 s, 6 px float.
- **Pausing:** both pause offscreen and in hidden tabs.
- **Placement:** never put ambient motion behind body text in a way that pulls attention.
- **Count:** use at most one animated `AuraBackground` per viewport.

### 10.5 Reduced motion

`prefers-reduced-motion: reduce` sets every duration to 1 ms. Under it:

- reveals show in place, the aura is static, view transitions are instant and `haptic()` is a no-op;
- the spinner keeps turning, but slower;
- skeleton shimmer stops.

Never convey state through motion alone.

---

## 11. Shells and navigation

| Shell | File | v2 |
|---|---|---|
| Site header | `components/site/site-header.tsx` | Sticky. Transparent at the top, `glass-strong` with a hairline and soft drop once scrolled 8 px. Nav links are pills: hover is ink at 4 %, active ink at 6 %. A divider, then *Anmelden* (ghost) and *Termin buchen* (primary). |
| Mobile menu | `components/site/mobile-menu.tsx` | Full-screen light surface with a subtle aura from below. Links are `type-display-s` rows with arrow glyphs that rise in with `stagger-rise`. The aura line marks the active link. CTA buttons and the tagline in the accent italic sit at the bottom. |
| Footer | `components/site/site-footer.tsx` | Light, with a faint static aura and the tagline in the accent italic. Columns use `type-label-s` headings, muted links and the copyright with the aura line. |
| Checkout header | `components/site/checkout-header.tsx` | Sticky `glass-strong`: a back pill, the centred wordmark and a *Sichere Buchung* success pill. |
| Account | `components/site/account-nav.tsx` | Glass header with pill nav, a glass `BottomNav` and a rail where the active item is a raised card. |
| Pro | `components/pro/shell.tsx` | Desktop: a 240 px sidebar on `bg-surface` with a hairline. The active item is raised (`shadow-raised`) with an accent icon. The profile sits in a level-1 card at the bottom. Mobile: a glass top bar and a glass `BottomNav` with counts. |
| Admin | `components/admin/shell.tsx` | Linear-grade. A 248 px (64 px rail) sidebar on `bg-surface` with a σ `MarkTile`, small uppercase group labels, 36 px items and a raised active item with an accent icon. **`[` toggles the rail** (`aria-keyshortcuts`, `Kbd` hint). The user card holds an aura `Avatar` and the demo badge. Mobile: a glass top bar and a sheet menu. `AdminPageHeader` uses the aura line, and `PanelCard` is a level-1 card. |

---

## 12. Dashboard language (`/pro`, `/admin`)

The brand is the same, at higher density.

- **`/pro` is mobile-first.**
  - Keep 44 px controls, the bottom nav and sheets.
  - Use `type-display-s` for the greeting (*Guten Abend, Lena.*) and `type-stat` for values.
  - Agenda rows are cards or hairline rows, 64 px, with the time in `type-label num` and status as a pill.
  - The live appointment gets `Status tone="accent"` (with the ping) and a 2 px accent bar.
- **`/admin` is desktop-first and dense.**
  - Use 36 px controls (`dense`, `size="s"`), 14 px text, 40 px table rows and 16/24 px panel padding.
  - Page titles are `type-heading-l`.
  - Show KPI tiles with `spark`, and `AreaChart` for trends.
- **Shared:**
  - Panels and tables are level-1 cards on the Kalk page.
  - Toolbars sit above tables: search input, chips and a segmented range.
  - Numbers use `num`, and empty values show *—*.
  - Destructive actions are confirmed in a `Modal`.
  - Every async view has `loading.tsx` skeletons that match the final geometry, plus an `EmptyState`.

---

## 13. Accessibility (WCAG 2.2 AA)

- **Contrast:** use only the pairs in §4.5. Aura and generative art are decorative (`aria-hidden`).
- **Focus:** `:focus-visible` shows a 2 px accent outline at 2 px offset, and kit components add the glow. Inputs show an accent border plus a 4 px glow. In forced-colors mode the outline falls back to `CanvasText`.
- **Targets:** at least 44 × 44 px with 8 px spacing. Small visuals (chips, S buttons) extend their hit area.
- **Structure:** `lang="de"`, one `h1`, landmarks, and the skip link *Zum Inhalt springen*.
- **Forms:** labels, errors with `aria-describedby`, `autocomplete` and `inputmode`.
- **Motion:** see §10.5. Overlays are `<dialog>`, which gives the focus trap and Esc for free.
- **Decorative compositions:** `FloatingStage` is `aria-hidden` and `inert`.
- **Charts:** `AreaChart` is `role="img"` with a text `summary`; always show the key figure as real text.

---

## 14. Do and don't

| Do | Don't |
|---|---|
| Ink pill for the primary action; ultramarine as a pointer | Blue or aura buttons everywhere; blue sections |
| Near-white page, level-1 cards, space between groups | Bordered boxes inside bordered boxes; 2 px corners |
| One radius family per component type (§7.1) | Mixing 10 and 20 px on the same kind of thing |
| Glass for sticky bars, sheets, toasts and floating hero cards | Glass for ordinary content cards, or muted text on `glass` |
| The aura as a signature: hero, highlight line, one key badge, focus, charts | Aura section backgrounds on every section; gradient text |
| Product-led hero: real components floating on the aura | Stock photos as the only content; illustrations of people |
| Inter display with tight tracking; one accent clause in Newsreader Italic | Serif in UI labels, buttons or tables; several italic clauses |
| `num` on prices, times and stats | Proportional digits that jump in tables or count-ups |
| Spring press, hover lift, settle on selection | Bouncing loops, parallax on text, motion above the fold that delays content |
| `Reveal` below the fold, once | Hiding hero content until JS runs |
| `haptic("success")` on booking, accept or start | Vibrating on every tap |
| Generative aura art for missing images | Flat beige boxes with big initials; grey image icons |
| Status as a pill with a word | Colour alone |

---

## 15. Implementation notes and recipes

- **Imports.** `globals.css` imports `tailwindcss` first, then `../styles/tokens.css`. The tokens reset Tailwind's default colours, type sizes, radii, shadows and inset shadows.
- **Wrapping utilities.** Use `text-wrap-style` (the longhand) in custom CSS. The `text-wrap` shorthand resets `text-wrap-mode` and silently breaks `truncate` and `whitespace-nowrap`.
- **`cn()` merges.** It is `clsx` + `tailwind-merge` v3, taught SOMA's scales (radius, shadow, inset shadow, spacing, containers, `text-*` sizes, fonts, ease, durations, animations; `bg-aura` counts as a background image). A later conflicting class wins, so `className` overrides component defaults: `<Badge className="hidden sm:inline-flex">`, `<IconButton className="rounded-control">`. Important overrides (`h-5!`) are kept next to the base class and win in CSS. Custom utilities (`type-*`, `glass`, `pressable`, `num` …) pass through untouched. Tests: `tests/unit/cn.test.ts`.
- **After editing `globals.css` or `tokens.css` in dev:** check that the change is actually in the served CSS (`curl` the CSS chunk and `grep`). Turbopack occasionally keeps a stale transform. If it does, make a real content edit or restart the dev server **by PID**. Never put `url(` with a bare argument in a CSS comment.
- **Hero recipe:**

```tsx
<section className="relative isolate overflow-clip pt-10 pb-16 lg:pt-16 lg:pb-24">
  <AuraBackground placement="right" />                       {/* muted text stays left, away from the glow */}
  <Container className="grid items-center gap-12 lg:grid-cols-12">
    <div className="flex flex-col gap-6 lg:col-span-5">
      <Overline>Zu Hause · Hotel · Büro</Overline>
      <h1 className="type-display-xl">Wellness, die zu Ihnen kommt. <em>Schon da.</em></h1>
      …
    </div>
    <FloatingStage className="h-[26rem] lg:col-span-7 lg:h-[34rem]">
      <FloatingCard className="top-[4%] left-[2%] w-[min(19rem,78%)]" depth={10} tilt={-1.5} enter={0} cardClassName="p-4">…</FloatingCard>
      <FloatingCard className="top-[40%] right-0 w-[min(17rem,70%)]" depth={22} glass float enter={1} cardClassName="p-3.5">…</FloatingCard>
    </FloatingStage>
  </Container>
</section>
```

- **Surface recipes:**

```tsx
<Surface className="p-5">…</Surface>                                    // level-1 card
<Surface as={Link} href={href} interactive className="p-4">…</Surface>   // whole-card link with lift
<GlassPanel className="p-4">…</GlassPanel>                               // level-2 glass
<section className="relative isolate overflow-clip rounded-panel p-8">  // aura panel (section intensity is AA for muted text)
  <AuraBackground variant="section" placement="full" fade="none" />
</section>
```

- **`AuraBackground` props:**
  - `variant`: `hero` | `section` | `subtle` | `night`.
  - `placement`: `right` | `left` | `top` | `bottom` | `center` | `full`.
  - `fade`: `bottom` | `top` | `both` | `radial` | `none`.
  - `animate` (default true) and `grain` (default true).
  - Place it in a `relative isolate overflow-clip` parent; it sits at `-z-10`.
- **`AuraArt`:** `seed` (required), `tone?`, `animate?`, `grain?`. It fills a positioned parent.
- **Empty state:** `<EmptyState title="Noch keine Termine." seed="konto-termine" action={<ButtonLink href="/">Behandlung finden</ButtonLink>}>Sobald Sie buchen, finden Sie Ihre Termine hier.</EmptyState>`
- **Brand assets:**
  - The favicon and app icon are an ink tile with a Kalk σ (favicon radius 8).
  - Manifest `theme_color` and `background_color` are `#FAF9F7`, and so is the viewport `themeColor`.
  - The PNG app icons are unchanged.
