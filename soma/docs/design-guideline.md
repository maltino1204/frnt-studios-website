# SOMA Design Guideline

Version 1.0, October 2026. Applies to the customer web app/PWA, the provider tool (`/pro`) and the admin console (`/admin`).

Companion files:

| File | Purpose |
|---|---|
| `src/styles/tokens.css` | Machine-readable tokens (Tailwind v4). If this guideline and the tokens disagree, the tokens win. |
| `docs/art-direction.md` | Photography language, shot list with generation prompts, fallback placeholders |
| `public/brand/*` | Wordmark, mark, app icons, favicon |

---

## 1. Brand concept

### The name

*Soma* is Greek σῶμα: **the body**. It is the root of "somatic": the body as lived and felt, not the body as an object. The word has two open syllables, is pronounced the same in German and English, and holds up in lowercase.

### The idea: *Schon da.* (Already there.)

Most wellness brands sell an escape: the spa, the retreat, somewhere else. SOMA does the opposite. You don't go anywhere. The place is wherever your body already is: the Altbau living room on a Tuesday evening, the hotel suite after a long flight, the meeting room at 13:00. The professional is the one who arrives. You are already there.

The concept has three consequences for design:

1. **Home materials instead of spa materials.** The palette is named and tuned after a lived-in German apartment: Kalk (lime-washed wall), Leinen (linen), Naht (seam), Zinn (pewter), Tinte (ink). No stones, no water, no leaves.
2. **Precise place and time.** Editorial captions name a real situation, such as *Altbau, 3. OG · Köln-Ehrenfeld · 19:30*. This "place line" (Ortszeile) is our editorial signature, and it replaces mood words.
3. **One point of colour.** Ultramarine is a deepened version of the blue "you are here" dot that everyone knows from maps. It points: the focused field, the link you can follow, the verified profile, the appointment happening now. Position (where you are in navigation and time) is marked by the ink roof line (see §2).

**Avoid these associations.** In *Brave New World*, Huxley's "soma" is a sedative, and in the Vedas it is a ritual drink. Never write copy about bliss, escape, intoxication or "switching off". The brand voice is grounded, bodily and precise.

---

## 2. Logo

### Assets

| File | Content | Use |
|---|---|---|
| `soma-wordmark.svg` | "soma", drawn as outlines, `fill="currentColor"`, viewBox 442.52 × 104 (baseline at y = 102) | Headers, footer, documents, social |
| `soma-mark.svg` | σ mark, `currentColor`, 136 × 100 | Avatars, social profiles, loading states, small brand stamps |
| `app-icon.svg`, `app-icon-512.png`, `app-icon-192.png` | Kalk σ on Tinte, 512 × 512 | PWA manifest `purpose: "any"` |
| `app-icon-maskable.svg`, `app-icon-maskable-512.png` | Same, mark inside the central 80 % safe circle | Manifest `purpose: "maskable"` |
| `apple-touch-icon.png` | 180 × 180, opaque | `app/apple-icon.png` |
| `favicon.svg` | 32 × 32 tile, heavier optical cut of σ | `app/icon.svg` |

### Concept

The **wordmark** is a contemporary contrast grotesk drawn for SOMA. Stems are confident and verticals carry the weight. Horizontals are about a third lighter. Bowls are slightly squared superellipses (exponent 2.35). Terminals are cut flat, parallel to the baseline, and the stems end in crisp spurs. The result sits between the editorial serif (Newsreader) and the UI sans (Instrument Sans), so it belongs to both. Joins in the *m* and *a* are thinned so the word stays even at 16 px.

The **mark** is a lowercase Greek sigma **σ**, the first letter of σῶμα. It is built from the wordmark's *o* plus one horizontal stroke, flush with the top of the bowl and reaching past it. Read abstractly, it shows a body under a roof: someone at home, sheltered, arrived. It needs no explanation to work. It is simply a round form and a line, and it stays sharp at 16 px.

**The roof line (Dachlinie)** is the system's only graphic device and is derived from that stroke. It is a short 2 px ink bar that marks "where you are": the active bottom-nav item, today in the date strip, the current checkout step, and the rule above an overline. It never becomes decoration such as dividers or frames.

### Usage rules

- **Colour:** use Tinte on light surfaces and Kalk on Nacht or on photography with a scrim. The logo is never ultramarine, never a gradient and never outlined.
- **Clear space:** the wordmark needs space equal to half its height on all sides. The mark needs 25 % of its height.
- **Minimum size:** wordmark 72 px wide (≈ 17 px tall) on screen and 20 mm in print. Mark 16 px. Below 32 px, always use the `favicon.svg` cut.
- **Header size:** 20 px tall on mobile and 24 px from `lg`.
- **Placement:** left-aligned in all product chrome. Centred placement is allowed only on the confirmation screen and in brand moments.
- **No lockup in v1.** The σ is drawn heavier than the wordmark for icon use, so never set the two side by side. If a lockup is needed later, redraw σ at wordmark weight (stem 16, horizontal 10.5 units).
- **Never:** stretch, rotate, re-space, add effects, place on busy image areas, set "soma" in a font as a stand-in, or animate the letters.
- **In running text,** the name is written **SOMA** in capitals.

### Renaming (trademark contingency)

The name lives in a few places only, by design:

1. `public/brand/soma-wordmark.svg`: redraw the letters with the same parameters (stem 16, horizontal 10.5, superellipse 2.35, flat terminals).
2. `soma-mark.svg`, the app icons and the favicon: σ comes from the name. A new name needs a new initial drawn with the same bowl and stroke logic. Re-render the PNGs from the SVGs with `sharp`, flattened onto Tinte.
3. `<title>`/`aria-label` inside the SVGs, the `metadata` and manifest `name`/`short_name`, and one `BRAND_NAME` constant in code. Never hard-code the name in components.
4. Section 1 of this document and the tagline.
5. Optional and cosmetic: the `--soma-*` primitive prefix in `tokens.css`.

Colour, type, components, motion and photography do not depend on the name.

---

## 3. Voice and tone for visual copy

- **Address** follows `docs/product-spec.md` §15. Customer-facing UI uses **Sie**: formal, never stiff. `/pro` uses **du**. `/admin` is neutral. The visual rules below apply to all three.
- **Tone:** warm, precise and adult. No exclamation marks, no emoji, no spa clichés (*Auszeit, Oase, Seele baumeln lassen, Me-Time*).
- **Headlines** are short declaratives that end with a full stop, at most about six words: *Massage. Bei Ihnen zu Hause.* If the headline has a second clause, it may be set in italic. Questions belong in body copy, not in display type.
- **Hierarchy for every block:** Overline (what/where) → Display (the promise) → Body (how, at most two sentences) → Action (verb + object).

| Level | Example |
|---|---|
| Overline | MASSAGE · BERLIN |
| Display | Wellness, die zu Ihnen kommt. *Zu Hause, im Hotel, im Büro.* |
| Body | Verifizierte Profis bringen alles mit. Sie wählen Zeit und Ort. |
| Action | Verfügbare Profis anzeigen |
| Ortszeile (place line) | Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10 |

- **Buttons** start with a verb and use two words where possible: *Termin wählen, Adresse speichern, Anfrage annehmen*. The final checkout button is fixed by law (§312j BGB): **Zahlungspflichtig buchen · 84 €** (or *anfragen*).
- **Formats** follow German conventions, with a non-breaking space between number and unit: `89,00 €`. Search, profile and checkout show the total price including travel (*94 € inkl. Anfahrt*, PAngV); *ab 69 €* appears only on category and SEO pages. Other formats: `19:30` (*Uhr* only inside sentences), `Fr., 14. Nov.`, ranges with an en dash `18:00–19:30`, `4,9`, `2,4 km`, `60 Min.`
- **Gender-neutral nouns:** *Profis, Fachkraft, Kundschaft*. Avoid gender colons in UI labels.
- **Tagline:** "Your wellness. Your place." is the brand signature (footer, social, decks) and is kept in English. In the German UI, the headline claim is *Wellness, die zu Ihnen kommt.*

---

## 4. Colour

### Palette

| Name | Hex | Token (utility) | Role |
|---|---|---|---|
| Kalk | `#F5F2EC` | `surface` | Page background |
| Weiß | `#FFFFFF` | `surface-raised` | Inputs, sheets, panels, tables |
| Leinen | `#ECE7DE` | `surface-sunken` | Hover fills, skeletons, sidebar, placeholders |
| Naht | `#DDD6CA` | `line` | Hairline dividers (decorative) |
| Zinn | `#857E73` | `line-strong` | Control borders (≥ 3:1) |
| Graphit | `#6A645B` | `ink-muted` | Secondary text, placeholders |
| Tinte | `#1A1916` | `ink`, `surface-inverse` | Text, primary buttons, selected states |
| Tinte hover | `#33302B` | `ink-hover` | Hover of ink fills |
| Ultramarin | `#2B3BD1` | `accent`, `focus` | Links, focus ring, verified badge, live appointment, count badges |
| Ultramarin tief | `#2230B0` | `accent-hover` | Link hover |
| Ultramarin hell | `#E6E8FA` | `accent-soft` | Selected table row, text selection, info banner |
| Success | `#1E6B43` / soft `#E3EFE7` | `success`, `success-soft` | Confirmed, paid, available |
| Warning | `#8A5A00` / soft `#F6EBD3` | `warning`, `warning-soft` | Pending, expiring, attention |
| Danger | `#B3261E` / soft `#F8E4E1` | `danger`, `danger-soft` | Errors, cancellations, destructive actions |
| Scrim | Nacht at 64 % | `scrim` | Flat overlay for text on photos |
| Backdrop | Nacht at 48 % | `backdrop` | Behind sheets and modals |

**Night variant (immersive sections).** Use `<section data-theme="night">`. Inside it, every semantic token is remapped, so components need no dark variants (for example, `bg-ink text-ink-inverse` becomes a Kalk button with ink text).

| Role | Night value |
|---|---|
| surface / raised / sunken | `#161513` / `#22201D` / `#1D1B18` |
| ink / muted | `#F5F2EC` / `#A8A196` |
| line / line-strong | `#34312C` / `#7A7468` |
| accent / focus | `#8F9BFF` |
| success / warning / danger | `#6FC59A` / `#E6B556` / `#FF8A7A` |

Use night for the footer, the "Für Profis" band, editorial hotel/evening sections, the full-screen mobile menu and toasts. Never use it in `/admin`. There is no system dark mode in v1; the night scope makes it a small step later.

### Proportions and rules

- Roughly **70 % Kalk/Weiß, 25 % ink (text and lines), at most 5 % ultramarine.** Photography provides the warmth.
- **Primary actions are ink, never blue.** Ultramarine is a pointer, not a fill. It is never used for section backgrounds, large buttons or illustrations.
- Semantic colours always come with an icon or a word. Colour alone never carries meaning.
- No gradients anywhere. The scrim is a flat colour. Pink, blush and rose-gold are excluded from photography, too.

### Contrast (WCAG 2.2, computed)

| Pair | Colours | Ratio | Level |
|---|---|---|---|
| Ink on Surface | `#1A1916` / `#F5F2EC` | 15.73:1 | AAA |
| Ink on Raised | `#1A1916` / `#FFFFFF` | 17.58:1 | AAA |
| Ink on Sunken | `#1A1916` / `#ECE7DE` | 14.27:1 | AAA |
| Muted on Surface / Raised / Sunken | `#6A645B` | 5.24 / 5.85 / 4.75:1 | AA |
| Accent on Surface / Raised / Sunken | `#2B3BD1` | 7.09 / 7.93 / 6.44:1 | AAA / AAA / AA |
| Accent hover on Surface | `#2230B0` | 8.87:1 | AAA |
| Ink / Accent on Accent-soft | `#E6E8FA` | 14.47 / 6.53:1 | AAA / AA |
| Kalk on Ink (primary button) | `#F5F2EC` / `#1A1916` | 15.73:1 | AAA |
| Kalk on Ink-hover | `#33302B` | 11.76:1 | AAA |
| White on Accent | `#FFFFFF` / `#2B3BD1` | 7.93:1 | AAA |
| Success on Surface / Raised / Soft | `#1E6B43` | 5.80 / 6.48 / 5.48:1 | AA |
| Warning on Surface / Raised / Soft | `#8A5A00` | 5.30 / 5.93 / 5.01:1 | AA |
| Danger on Surface / Raised / Soft | `#B3261E` | 5.85 / 6.54 / 5.35:1 | AA |
| White on Danger (destructive button) | `#FFFFFF` / `#B3261E` | 6.54:1 | AA |
| Ink on Success-, Warning-, Danger-soft | — | 14.87 / 14.85 / 14.38:1 | AAA |
| Night ink on Night / Night-raised | `#F5F2EC` | 16.33 / 14.54:1 | AAA |
| Night muted on Night / Night-raised | `#A8A196` | 7.13 / 6.35:1 | AAA / AA |
| Night accent on Night / Night-raised | `#8F9BFF` | 7.21 / 6.42:1 | AAA / AA |
| Night success / warning / danger on Night | — | 8.80 / 9.65 / 7.97:1 | AAA |
| Kalk on photo + 64 % scrim (worst case: white pixel becomes `#6A6968`) | — | 4.90:1 | AA |
| *Non-text (3:1):* Line-strong vs Surface / Raised / Sunken | `#857E73` | 3.59 / 4.02 / 3.26:1 | Pass |
| Night line-strong vs Night / Night-raised | `#7A7468` | 3.93 / 3.50:1 | Pass |
| Focus ring vs Surface / Raised; Night focus vs Night | — | 7.09 / 7.93; 7.21:1 | Pass |

`line` (`#DDD6CA`, 1.29:1) is decorative only. It must never be the only boundary that identifies a control. `ink-disabled` (`#ABA69E`) is reserved for inactive controls, which WCAG exempts.

### Charts

Series 1 Tinte, series 2 Ultramarin (the current or focused series), series 3 Zinn, series 4 Graphit dashed. Use at most four series. Gridlines are `line` at 1 px. Status series use the semantic colours. No area gradients: an area fill, if used, is a flat 8 % ink.

---

## 5. Typography

### Families

| Role | Google family (exact) | Axes / weights | Why |
|---|---|---|---|
| Display | **Newsreader** | `opsz` 6–72, `wght` 200–800, normal + italic | An editorial text face from Production Type with a real optical-size axis. At display sizes it is fine and contemporary, and its italic is expressive. It is far less overused than Playfair, Cormorant or Instrument Serif. |
| UI | **Instrument Sans** | `wght` 400–700, `wdth` 75–100 | A crisp, slightly narrow grotesk that keeps long German compounds compact. The width axis lets tight UI condense to `wdth 88` without switching font. It has `tnum` and `case` features. |
| Mono (optional) | **DM Mono** | 400, 500 | Booking references and IDs in `/pro` and `/admin` only. Not preloaded. |

```ts
import { Newsreader, Instrument_Sans, DM_Mono } from "next/font/google";
const display = Newsreader({ subsets: ["latin", "latin-ext"], style: ["normal", "italic"], axes: ["opsz"], display: "swap", variable: "--font-display-src" });
const sans = Instrument_Sans({ subsets: ["latin", "latin-ext"], axes: ["wdth"], display: "swap", variable: "--font-sans-src" });
const mono = DM_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], display: "swap", preload: false, variable: "--font-mono-src" });
```

Set `<html lang="de">`. Hyphenation depends on it.

### Scale

Display and heading sizes are fluid between a 360 px and a 1280 px viewport. UI text sizes are fixed. Use the composite `type-*` utilities, which set family, size, leading, tracking, weight and wrapping together.

| Utility | Face / weight | Mobile → Desktop | Line height | Tracking | Use |
|---|---|---|---|---|---|
| `type-display-xl` | Newsreader 360 | 36 → 80 px | 1.02 | −0.022em | Home hero only, one per page |
| `type-display-l` | Newsreader 360 | 32 → 56 | 1.06 | −0.018em | Marketing section titles |
| `type-display-m` | Newsreader 380 | 28 → 40 | 1.10 | −0.012em | Provider name, confirmation, category pages |
| `type-display-s` | Newsreader 400 | 22 → 28 | 1.20 | −0.006em | Editorial quotes, empty states, dialogs at brand moments |
| `type-heading-l` | Instrument 600 | 20 → 24 | 1.25 | −0.012em | App screen titles, dashboard page titles |
| `type-heading-m` | Instrument 600 | 17 → 18 | 1.30 | −0.008em | Section titles in app, list names |
| `type-heading-s` | Instrument 600 | 15 | 1.35 | −0.004em | Group titles, sheet titles on dense screens |
| `type-body-l` | Instrument 400 | 17 → 19 | 1.55 | −0.003em | Marketing lead paragraphs |
| `type-body` | Instrument 400 | 16 | 1.50 | 0 | Default text, inputs |
| `type-body-s` | Instrument 400 | 14 | 1.45 | 0.002em | Secondary info, tables, meta |
| `type-label` | Instrument 520 | 15 | 1.20 | 0 | Buttons, tabs, slots |
| `type-label-s` | Instrument 520 | 13 | 1.20 | 0.005em | Field labels, small buttons, table headers |
| `type-caption` | Instrument 450 | 12 | 1.35 | 0.01em | Timestamps, helper text, nav labels |
| `type-overline` | Instrument 560, uppercase | 12 | 1.20 | 0.09em | Eyebrows (at most three words) |
| `type-stat` | Newsreader 380, tabular | 32 → 40 | 1.00 | −0.02em | Dashboard key figures |

### Rules

- Newsreader is only for content at 22 px and above. It is never used for labels, buttons, inputs or tables.
- Use italic only in Newsreader, for the second clause of a headline or for a place line, and at most once per headline. UI emphasis uses weight 600, never italic.
- Use sentence case everywhere. Uppercase is only for overlines.
- Apply `num` (tabular, lining figures) to prices, times, dates, durations, counts and table columns.
- Body text is never smaller than 14 px, except captions at 12 px. Text inside inputs is always 16 px, which prevents iOS zoom.

### German wrapping and hyphenation

German compounds are long. Measured at 375 px with 20 px gutters (335 px measure), *Terminverfügbarkeit* in `type-display-xl` (36.7 px) is 318 px wide and fits, while *Wimpernverlängerung* (≈ 345 px) does not.

1. **Display and headings:** `hyphens: manual` plus `text-wrap: balance`, both built into the utilities. Editors insert `&shy;` at compound joints in any headline word longer than 14 characters (*Wimpern&shy;verlängerung*). `overflow-wrap: break-word` is the last-resort guard: the page must never scroll horizontally.
2. **Body text:** `hyphens: auto` with `hyphenate-limit-chars: 10 4 4` (only words of 10 or more characters, at least 4 characters on each side), plus `text-wrap: pretty`.
3. **UI labels:** never hyphenate. Keep labels short. In chips, tabs and table headers that overflow, apply `condensed` (`wdth 88`), which recovers about 16 % of the width (*Gesichtsbehandlung* at 14 px goes from 136 to 113 px). If it still doesn't fit, wrap to a second line. Do not truncate.
4. **Truncation** (`…`) is only for user content such as names, addresses and notes, always with the full text available. Never truncate prices, times or dates.
5. Use non-breaking spaces in `14. Nov.`, `60 Min.`, `89 €` and `Fr., 14. Nov.`

---

## 6. Space, grid and layout

**Spacing** is on a 4 px base (Tailwind `--spacing: 0.25rem`). Use only these steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 160.

| Context | Value |
|---|---|
| Inside controls | 12–20 px horizontal |
| Related items (label to field, title to meta) | 4–8 |
| Items in a group | 16 |
| Groups | 24–32 (`--space-stack`) |
| Sections | 64 / 96 / 128 (`--space-section`, responsive) |

**Grid and breakpoints.** The defaults are Tailwind's: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.

| Range | Columns | Outer margin (`--space-gutter`) | Gap |
|---|---|---|---|
| < 768 | 4 | 20 px | 12 |
| 768–1023 | 8 | 32 px | 20 |
| ≥ 1024 | 12 | 48 px | 24 |
| ≥ 1280 | 12, content capped at 1280 | auto (min 48) | 24 |

**Containers:** `max-w-page` 1376 (1280 plus margins), `max-w-content` 1152 (booking, profile), `max-w-reading` 608, `max-w-form` 480, `max-w-sheet` 560, `max-w-dashboard` 1440.

**How mobile-first layouts expand**

- **Hero:** headline, then the search card, then the image (4:5, full-bleed). From `lg`: text and search in 6 columns, with the image in 6 columns running to the viewport edge.
- **Category entry:** a horizontal snap carousel showing 2.3 tiles. From `lg`: a 4-column row. Tiles are images with labels below, never bordered cards.
- **Results:** a single-column list of rows. From `lg`: the list in 7 columns plus a sticky filter/summary column of 4 columns. It stays a list and never becomes a card grid.
- **Profile:** stacked, with a sticky bottom CTA. From `lg`: portrait in 5 columns (sticky), content in 7, and at `xl` a sticky booking panel.
- **Checkout:** full-screen steps with a sticky bottom bar. From `lg`: a 7-column form plus a 5-column sticky summary.
- **Bottom sheets** become centred dialogs (`max-w-sheet`). Filter sheets become a right-hand drawer 400 px wide.
- **Bottom nav:** for customers it becomes header items at `lg`. In `/pro` it becomes a 240 px sidebar.
- Fixed bottom elements add `env(safe-area-inset-bottom)`. Use `dvh` units for full-height layers.

---

## 7. Shape, lines and elevation

### Radius policy: crisp by default

| Token | Value | Applies to |
|---|---|---|
| `rounded-none` | 0 | **Default.** Images, panels, sections, tables, tiles, banners, skeletons for images and text |
| `rounded-xs` (= `rounded`) | 2 px | Interactive controls: buttons, inputs, selects, search bar, time slots, date cells, checkboxes, menus, toasts, modals |
| `rounded-sheet` | 8 px | Top corners of bottom sheets only, as a touch affordance |
| `rounded-full` | circle/pill | People and points only: avatars ≤ 48 px, status dots, radios, switches, count badges, plus filter chips (the pill signals "toggle") |

Tailwind's other radii are removed in the tokens. Portraits larger than 48 px are always rectangular.

### Lines

- All lines are 1 px. `line` is for dividers and list separators. `line-strong` is for borders that define a control.
- Separate sections with space, not rules. Group content with hairlines and alignment, not boxes.
- Never draw double borders (a bordered panel inside a bordered panel).

### Elevation

Use hairlines first and shadows only for layers that float above content.

| Level | Token | Use |
|---|---|---|
| 0 | none | Everything in the page flow: cards, buttons and images never have shadows |
| Float | `shadow-float` | Menus, popovers, toasts |
| Sheet | `shadow-sheet` | Bottom sheets |
| Modal | `shadow-modal` | Dialogs |
| Bar | `shadow-bar` | Sticky bottom bars (an upward hairline) |

No glassmorphism and no background blur.

---

## 8. Components

These are visual specs. Measurements are in CSS px, and every interactive element has a hit area of at least 44 × 44.

### Buttons

| Size | Height | Pad x | Text | Icon | Use |
|---|---|---|---|---|---|
| S | 36 `h-control-s` | 12 | `type-label-s` | 16 | `/admin` and dense desktop toolbars; hit area extended to 44 |
| M | 44 | 20 | `type-label` | 20 | Default |
| L | 52 `h-control-l` | 24 | `type-label` | 20 | Booking actions; full width on mobile |

| Variant | Rest | Hover / pressed |
|---|---|---|
| Primary | `bg-ink text-ink-inverse` | `bg-ink-hover` / opacity 0.92 |
| Secondary | 1 px `border-ink`, `text-ink` | `bg-surface-sunken` |
| Ghost | `text-ink` | `bg-surface-sunken` |
| Link | `text-accent`, 1 px underline at 0.2em offset | `text-accent-hover` |
| Destructive | `bg-danger text-on-danger` | Darken 8 %; only inside confirm dialogs |

- Radius is 2 px. A leading icon sits 8 px from the label. Use `ArrowRight` only for "go forward".
- **Loading:** keep the width, set the label to opacity 0, show a centred 16/20 px spinner and `aria-busy`. Show it for at least 400 ms.
- **Disabled:** `bg-surface-sunken text-ink-disabled`. Prefer an enabled button with validation, or pair a disabled one with helper text.
- **Icon-only:** a 44 px ghost button with an `aria-label`.
- **Night:** the same classes render a Kalk button with ink text.

### Inputs and selects

- **Field:** 48 px tall (36 in `/admin`), `bg-surface-raised`, 1 px `border-line-strong`, 2 px radius, 14 px padding x, 16 px text (which prevents iOS zoom).
- **Label and helper:** the label sits above in `type-label-s` with a 6 px gap. *(optional)* is muted. Helper text goes below in `type-caption`, muted. Placeholders are examples only (*z. B. 10115*).
- **States:**
  - Hover: `border-ink-muted`.
  - Focus: `border-ink` plus the focus outline at 1 px offset.
  - Error: `border-danger`, a danger message with `CircleAlert` 16, and `aria-invalid`/`aria-describedby`.
  - Disabled: `bg-surface-sunken`, `border-line`.
- **Select:**
  - On touch devices, use a native `<select>`.
  - On desktop, use a listbox popover: `shadow-float`, 40 px options, the selected option marked with `Check`.
  - The chevron is `ChevronDown` 20.
- **Checkbox, radio, switch:** checkboxes are 20 px with a 2 px radius and an ink fill when checked. Radios are 20 px circles. Switches are 40 × 24 pills, ink when on.

### Search bar (hero booking entry)

Fields and rules follow `product-spec.md` J1:

- **Wo?** "PLZ oder Adresse", with `autocomplete="postal-code"` and an icon button *Standort verwenden* (`LocateFixed`). It resolves to *10115 · Berlin-Mitte*.
- **Was?** A sheet showing the 7 category tiles, then a service list.
- **Wann?** Chips *So bald wie möglich · Heute · Morgen · Datum wählen*, then window chips *Morgens · Nachmittags · Abends*.
- **CTA:** **Verfügbare Profis anzeigen**.

- **Mobile:** one raised panel with a 1 px `line-strong` border and 2 px radius. It holds three 64 px rows, each a caption label (muted: *Wo?*, *Was?*, *Wann?*) above a 16 px value, separated by hairlines, plus a full-width L primary button 8 px inside the bottom edge. *Was?* and *Wann?* open bottom sheets.
- **Desktop (`lg`):**
  - A single bar 72 px tall and at most 880 px wide.
  - Segments are 1fr / 1.3fr / 1fr, separated by vertical hairlines inset 20 px.
  - The L button sits 10 px from the right edge.
  - Pickers are popovers anchored under each segment.
- **`/suche`:** the fields become editable header chips (PLZ · Leistung · Datum).
- **Unserved PLZ:** a calm inline note in ink: *In Ihrer Gegend sind wir noch nicht.* Then the waitlist email field. No error colour.
- **Returning users:** a rebook row above the bar: *Erneut buchen: Shellac bei Anna K. – nächster Termin Do 18:30*.

### Chips, segmented control

- **Chips:**
  - 36 px tall visually (44 px hit area), pill shape, 14 px padding x, 14 px text at weight 520.
  - Rest: a 1 px `line-strong` border. Selected: `bg-ink text-ink-inverse` with an optional `Check` 16. Filter menus add a trailing `ChevronDown` 16 and a count (*Preis · 2*).
  - On mobile, chips sit in one horizontal scroll row that bleeds to the screen edge and never wraps. Long labels use `condensed`.
- **Segmented control:**
  - For two to four short options (*Zuhause · Hotel · Büro*).
  - The container is 44 px (36 dense) with a 1 px `line-strong` border, 2 px radius and 3 px padding. The selected segment is ink-filled and the others are muted.
  - Anything longer becomes tabs or a select.

### Date strip and time slots

- **Date strip:**
  - A horizontal snap scroll of 14 days (60 in `/pro`). Cells are 56 × 72 with a 4 px gap: the weekday (*Mo*, caption, muted) above the day (`type-heading-m num`). A month label sits over the first day of each month.
  - Today reads *Heute* and shows a 12 × 2 px roof line above the number.
  - Selected is ink-filled with a 2 px radius. Booked-out days are `ink-disabled`, not selectable, with `aria-label` "… ausgebucht".
  - Desktop adds arrow buttons at both ends. Use radiogroup semantics with arrow keys.
- **Time slots:**
  - Grouped under overlines *Morgens*, *Nachmittags* and *Abends*. The grid has 3 columns on mobile, 4 at `sm` and 6 at `lg`, with an 8 px gap.
  - A slot is 44 px tall, raised, with a 1 px `line` border, 2 px radius and `type-label num` text. Hover → `border-ink`. Selected → ink fill.
  - Unavailable times are not rendered. An empty day shows *Keine freien Termine an diesem Tag.* plus the next free slot as a button.
  - A summary line follows: *19:30–20:30 · 60 Min. · bei Ihnen zu Hause*.

### Provider list row and profile header

- **List row** (`/suche` result): a full-width row, never a card. It has 16 px vertical padding and a hairline below.
  - Left: a 72 px square portrait, linked to the profile.
  - Middle:
    - The display name (*Anna K.*) in `type-heading-m`, also linked to the profile, with the verified icon.
    - A meta line: ★ *4,9 (87)* · mode (*Sofort bestätigt* with `CalendarCheck` 14, or *Auf Anfrage* with `Clock` 14, both in caption) · one truncated muted line of specialty.
  - Right: **94 €** (`type-label num`, 600) above *inkl. Anfahrt* (caption, muted).
  - Below, full width: 3–5 slot chips for the requested window (36 px visual, 44 px hit area, raised, 1 px `line` border, `type-label-s num`; hover → ink border). Then a *Weitere Zeiten* link. A slot chip goes straight to `/buchen`.
  - The favourite toggle (`Heart`, 44 px ghost) sits top-right.
  - Interactive elements are never nested: the name and portrait link, and the slot chips are separate buttons.
- **Profile, mobile:**
  - A full-bleed 4:5 portrait with no text on it.
  - Below the portrait:
    - Overline (*MASSAGE · BERLIN-MITTE*)
    - Name in `type-display-m`
    - Verified badge with label
    - Rating
    - Three-line bio with *Mehr lesen*
    - Facts (*Sprachen, Erfahrung, Bringt Liege mit*)
  - A sticky bottom bar (`shadow-bar`) shows the selected service total (*84 € inkl. Anfahrt · 60 Min.*) and the L button *Termin wählen*.
- **Profile, desktop:** the portrait takes 5 columns and is sticky, with content in 7. The work gallery is a strip of 1:1 thumbnails with no gaps between them.

### Verified badge, rating, price breakdown

- **Verified:**
  - `BadgeCheck` (16 px in lists, 20 px on profiles) in `text-accent`, labelled *Verifiziert* on profiles. The accessible name is *Verifiziertes Profil*.
  - Tapping it opens a sheet listing the checks (identity, qualification, trade registration, insurance).
  - No green ticks, seals or rosettes.
- **Rating:**
  - A filled ink `Star` (14/16 px), then **4,9** (600, `num`) and *(128)* in muted.
  - Five-star rows appear only in the review composer and on review detail.
  - Fewer than three reviews show *Neu auf SOMA*. Never use yellow stars.
- **Price breakdown** (*Preis & Bedingungen* on `/buchen`):
  - 36 px rows: label in muted `type-body-s`, amount right-aligned in `num`.
  - Order: *Behandlung* (*Entspannungsmassage · 60 Min.*), *Anfahrt*, *Guthaben* (*−10,00 €* in success). There is no service fee.
  - A hairline, then **Gesamtpreis** in `type-heading-m num`.
  - Below it, as captions: the VAT line (*inkl. 19 % MwSt.*) or the §19 UStG note, then the cancellation line with `Check` 16 in ink (*Kostenlos stornierbar bis Mittwoch, 18:30 Uhr.*), then *SOMA vermittelt; Vertragspartner ist Anna K.* in muted.
  - No box.

### Step indicator (checkout and onboarding)

The same component serves two flows:

- **`/buchen`** is one scrolling page. The indicator tracks its sections (*Übersicht · Ort · Kontakt · Zahlung*) and fills as each becomes valid. On desktop it is sticky at the top of the form column, and tapping a label scrolls to that section.
- **`/pro/onboarding`** uses it as a real multi-step wizard.

Visual spec:

- **Mobile:** *Schritt 2 von 4* (caption, muted) and the step name (`type-heading-s`) above a row of segments. Segments are flex-1, 2 px tall, with a 4 px gap; done and current are ink, upcoming is `line`.
- **Desktop:** labels sit under the segments. Completed labels link back.
- **Sticky checkout CTA:** a full-width L button reading **Zahlungspflichtig buchen · 84 €**, inside a raised bar with `shadow-bar` and the safe area. The total in the label updates live with `num`.

### Bottom sheet, modal, toast

- **Sheet:**
  - `bg-surface-raised`, 8 px top radius, `shadow-sheet`, over `bg-backdrop`.
  - Grabber 36 × 4 (pill, `line-strong`). A 56 px header with the title (`type-heading-m`) and a 44 px close button.
  - Content padding is 20 px. A sticky action footer has a hairline and safe-area padding. Maximum height is 92 dvh.
  - Drag or Esc dismisses it. Focus is trapped while open and restored on close.
  - Enters from `translateY(100%)` in 360 ms `ease-enter` and exits in 240 ms `ease-exit`.
  - At `md`, it becomes a centred dialog (`max-w-sheet`). Filters become a right-hand drawer 400 px wide.
- **Modal:**
  - Only for consequential confirmations (*Termin stornieren?*).
  - Centred, `max-w-form`, 2 px radius, `shadow-modal`, padding 24 (32 at `md`). Title in `type-heading-l`.
  - Actions are right-aligned on desktop. On mobile they stack full width with primary on top.
  - Enters with opacity plus scale 0.98 → 1 (240 ms).
- **Toast:**
  - Rendered inside `data-theme="night"`, so it is a Nacht surface with Kalk text.
  - 2 px radius, `shadow-float`, 14 × 16 padding, `type-body-s`, at most 420 px wide. An optional `Check` or `CircleAlert` 20 uses the night semantic colours.
  - Position: bottom-centre 16 px above the bottom nav or sticky bar on mobile; bottom-right 24 px on desktop.
  - Duration is 5 s (8 s with an action), paused on hover or focus.
  - `role="status"`, or `role="alert"` for errors.

### Tabs

- 44 px tall with 24 px between tabs, in `type-label`. Inactive tabs are muted. The active tab is ink with a 2 px ink bar under the label that slides in 240 ms.
- A full-width `line` runs below the row.
- Counts use an 18 px ink pill in `type-caption num`. Tabs scroll horizontally on mobile.

### Dashboard tables and stat tiles

- **Tables:**
  - On a raised panel with a 1 px `line` border and no radius.
  - Header row 40 px in `type-label-s`, muted, sentence case, with a `line-strong` bottom border. Sortable columns show `ArrowUpDown` 14.
  - Rows are 52 px (comfortable) or 40 px (dense) in `type-body-s`, with `line` separators. No zebra stripes, no vertical rules.
  - Numbers are right-aligned with `num`. IDs use `code-ref`. Status is an 8 px dot plus a word.
  - Hover `bg-surface-sunken`. Selected `bg-accent-soft` with a 2 px accent bar on the left.
  - The header is sticky. Pagination reads *1–25 von 312*.
  - Below `md`, `/pro` tables become stacked lists. `/admin` scrolls horizontally with the first column fixed.
- **Stat tiles:**
  - Two to four tiles separated by 1 px `line` gaps (`gap-px` on `bg-line`), each raised with 20/24 px padding.
  - Each shows a label (`type-label-s`, muted), the value in `type-stat`, then a delta: `ArrowUpRight` 14 and *+12 %* in success or danger, followed by *ggü. Vorwoche* in muted.
  - An optional sparkline is 24 px: a 1.5 px ink line with no fill. Tiles form a 2 × 2 grid on mobile.

### Empty states and skeletons

- **Empty states:**
  - Left-aligned: a 24 × 2 roof line, a headline in `type-display-s`, one or two muted lines in `type-body-s`, and one action. No illustration, no icon-in-a-circle.
  - Examples: *Noch keine Termine.* / *Sobald Sie buchen, finden Sie Ihre Termine hier.* / [Behandlung finden]. In `/pro` (du): *Heute ist frei.* On search: *Am Freitag ist in 10115 alles ausgebucht.* (then offer the next dates as slot buttons).
- **Skeletons:**
  - They copy the final geometry exactly, in `bg-surface-sunken`, with radius 0 for images and text. Text bars are 0.7 × the line height at widths of 100 %, 92 % and 64 %.
  - `animate-skeleton` is an opacity pulse with no shimmer, and is static under reduced motion. Show skeletons only after 200 ms.

### Navigation and footer

- **Marketing header:**
  - Height is `--header-height` (56/72 px), sticky, `bg-surface`. A hairline appears after 8 px of scroll, with no shadow.
  - Wordmark on the left (20/24 px tall).
  - Desktop, on the right:
    - Links in `type-label` (hover: 1 px underline at 6 px offset)
    - *Anmelden* as a ghost button
    - *Termin buchen* as a primary M button
  - Mobile: a `Menu` icon button opens a full-screen night menu with links in `type-display-m`.
- **Bottom navigation** (customer account and `/pro`):
  - 64 px plus the safe area, raised, with a top hairline. Four or five equal items: a 24 px icon over a `type-caption` label.
  - Inactive is muted. Active is ink, with a 16 × 2 roof line at the item's top edge and the icon stroke at 1.75. Counts use an accent pill.
  - Customer items: *Entdecken, Termine, Favoriten, Konto*. `/pro` items: *Heute, Termine, Kalender, Einnahmen, Profil*.
- **Admin sidebar:**
  - 248 px (collapsible to a 64 px rail), `bg-surface-sunken`, right hairline. The top shows a 24 px σ and *Admin*.
  - Groups use overlines (*Betrieb, Marktplatz, Finanzen, System*). Items are 36 px tall with a 20 px icon and 14 px text.
  - The active item is raised and ink with a 2 px ink bar on the left. The footer shows the user and an environment badge on `warning-soft`.
- **Footer:**
  - In the night scope: the Kalk wordmark (24 px), then *Your wellness. Your place.* in `type-display-s` italic.
  - Link columns: *Behandlungen, Städte, Für Profis, Hilfe, Rechtliches* (*Impressum, Datenschutz, AGB, Cookie-Einstellungen*), in muted `type-body-s`.
  - *© 2026 SOMA* in caption. Vertical padding is 64/96 px.

---

## 9. Imagery, iconography and illustration

**Photography** follows `docs/art-direction.md`.

- **Ratios:** 4:5 for portraits and categories, 1:1 for list thumbnails, 3:2 for editorial, 16:9 for the desktop hero, 1.91:1 for OG images.
- Images have square corners, no borders and no shadows. Set `object-position` from each file's focal point.
- **Loading:** start on a flat `bg-surface-sunken` and fade in over 640 ms with `ease-calm`. No blur-up.
- Never place text on a photo without a `bg-scrim` overlay (a flat 64 %). Prefer layouts where text sits next to the image.

**Icons:** lucide-react.

- Sizes are 16, 20 and 24 px on a 24 px grid. Use `strokeWidth={1.5}` with `absoluteStrokeWidth`, so every size draws 1.5 px.
- Colour is `currentColor`. The gap to a label is 8 px (6 px at 16 px).
- Navigation and actions always pair icons with labels. The exceptions are `X`, `ChevronLeft` (back), `Menu` and `Search`, which still need an `aria-label`.
- Only `Star` is filled.
- **Banned icons:** `Sparkles`, `Leaf`, `Flower`, `Droplet(s)`, `Gem`, `Crown`, `Wand`, and any lotus or spa imagery. Categories are typographic and have no icons.

**Illustration:** none. No 3D renders, blobs, emoji or stock vector people. When content is missing, the brand speaks through type, colour fields and the roof line.

---

## 10. Motion

Motion is calm and functional. Things settle; they do not bounce.

| Token | Value | Use |
|---|---|---|
| `duration-instant` | 90 ms | Press feedback, checkbox tick |
| `duration-fast` | 160 ms | Hover, focus, chips, colour changes (default) |
| `duration-base` | 240 ms | Menus, toasts, tab indicator, accordions |
| `duration-slow` | 360 ms | Sheet and modal entry, side panels |
| `duration-calm` | 640 ms | Image fade-in, confirmation roof line |
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default for state changes |
| `ease-enter` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | Elements arriving |
| `ease-exit` | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Elements leaving (about 2/3 of the entry duration) |
| `ease-calm` | `cubic-bezier(0.4, 0, 0.2, 1)` | Fades, skeleton pulse |

- **What animates:** opacity, colour, `transform` on layers that enter or leave (sheets, toasts, menus), the tab indicator, and the accordion chevron.
- **The one brand moment:** on `/buchung/[id]`, a roof line draws from 0 to 24 px (640 ms calm) above the status headline *Bestätigt.*
- **Never animated:** the logo, prices and totals (no count-up), list reflow, page-to-page slides, parallax, Ken Burns, hover zoom on photos, auto-advancing carousels, confetti, springs or overshoot, and shimmer gradients.
- **`prefers-reduced-motion: reduce`:** the tokens reduce all durations to 1 ms. Layers appear in place, skeletons are static and smooth scrolling is off. Never convey state through motion alone.

---

## 11. Dashboard language (`/pro`, `/admin`)

The brand is the same, at higher density.

- **`/pro` is mobile-first:** the provider is on the move between appointments. Keep 44 px controls, bottom nav and sheets. The only Newsreader moments are the greeting on *Heute* (*Guten Abend, Lena.* in `type-display-s`) and the stat values. Day agenda rows are 64 px, with the time in `type-label num` on the left, the client and treatment in the middle and status on the right. The live appointment gets a 2 px accent bar on its left.
- **`/admin` is desktop-first and dense:** 36 px controls, 14 px base text, 40 px table rows, 16/24 px panel padding and a 248 px sidebar. Page titles use `type-heading-l`, and there is no display type except stat tiles. Night scope is not used.
- **Shared rules:**
  - Panels are `bg-surface-raised` with a 1 px `line` border and 0 radius, sitting on a Kalk page.
  - Status is always a dot plus a word. Destructive actions are confirmed in a modal.
  - Numbers use German formats with `num`, and empty values show *—*.
  - Filters sit in a toolbar row above tables: search input, filter chips and a segmented date range.
  - Charts follow §4. Times follow the user's time zone, shown as *MEZ/MESZ* in tooltips.

---

## 12. Accessibility

The target is WCAG 2.2 AA in all three surfaces.

- **Contrast:** use only the pairs listed in §4. Placeholder tones in fallback imagery are decorative (`aria-hidden`), with the real label rendered as text.
- **Focus:** `:focus-visible` shows a 2 px `focus` outline at 2 px offset (1 px offset on inputs). It is never removed or replaced by colour alone. Inside the night scope, the focus colour switches automatically.
- **Touch targets:** at least 44 × 44 px (`min-h-touch min-w-touch`), with at least 8 px between adjacent targets. Small visuals such as chips and S buttons extend their hit area.
- **Language and structure:** `lang="de"`, one `h1` per page, landmarks, and a skip link (*Zum Inhalt springen*) as the first focusable element.
- **Forms:** visible labels, errors described in text and linked with `aria-describedby`, the correct `autocomplete` and `inputmode` attributes, and no time limits in checkout.
- **Zoom:** layouts reflow at 320 px and at 200 % zoom without horizontal scrolling. Type is set in rem.
- **Motion:** see §10. **Media:** portraits get alt text in the form *Porträt von Lena, Massage*. Decorative images get `alt=""`.
- **Do not rely on colour:** selected states use an ink fill, and status uses words.

---

## 13. Do and don't

| Do | Don't |
|---|---|
| Use ink for primary actions and ultramarine for pointers | Use blue CTA buttons or blue sections |
| Lay out Kalk pages with hairlines and generous space | Build grids of shadowed, rounded cards |
| Use square corners for images and panels, 2 px for controls | Round everything 12–24 px |
| Write one confident headline with a full stop | Use exclamation marks, emoji, question headlines or spa clichés |
| Use the Ortszeile: *Hotelsuite · Frankfurt · 21:10* | Use mood words like *Wellness-Oase* |
| Show real skin, real apartments and hands at work | Use lotus, stones, orchids, bamboo, water drops, candles or rose-gold |
| Use Newsreader for big moments and Instrument Sans for work | Use Newsreader in buttons, tables or labels |
| Put `&shy;` in long headline compounds | Let long German words overflow or truncate prices |
| Mark "where you are" with the roof line | Use the roof line as decoration or as a divider |
| Use flat colour fields when imagery is missing | Use gradients, blobs, 3D or stock illustrations |
| Keep motion short and calm | Use parallax, bounce, count-ups or carousels |
| Pair status colours with words | Rely on colour alone |

---

## 14. Implementation notes

- **Import order:** in `globals.css`, `@import "tailwindcss";` must come first, then `@import "../styles/tokens.css";`. The tokens reset Tailwind's default colours, font sizes, radii and shadows, so only SOMA values exist.
- **Utility reference:** `bg-surface`, `bg-surface-raised`, `bg-surface-sunken`, `text-ink`, `text-ink-muted`, `border-line`, `border-line-strong`, `text-accent`, `bg-accent-soft`, `font-display`, `font-sans`, `font-mono`, `type-*`, `num`, `condensed`, `code-ref`, `rounded-xs`, `rounded-sheet`, `shadow-float`, `ease-standard`, `duration-base`, `max-w-content`, `h-touch`, `px-(--space-gutter)`, `z-(--z-sheet)`, `animate-skeleton`, `bg-tone-massage` and so on.
- **Icons in Next.js:** copy `public/brand/favicon.svg` to `src/app/icon.svg` and `apple-touch-icon.png` to `src/app/apple-icon.png`, then remove the default `favicon.ico`.
- **Manifest:** `theme_color: "#1A1916"`, `background_color: "#F5F2EC"`, with icons 192 and 512 (`any`) and maskable 512. Set the `viewport` `themeColor` to `#F5F2EC`.
- **Brand name:** keep it in one `BRAND_NAME` constant (see §2, Renaming).
- **Placeholder tones** are keyed by category slug (`massage`, `manikuere`, `pedikuere`, `kosmetik`, `make-up`, `haare-styling`, `brows-lashes`), so `bg-tone-${slug}` works directly.
