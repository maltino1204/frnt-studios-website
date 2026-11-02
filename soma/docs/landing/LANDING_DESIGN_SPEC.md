# SOMA landing page: design specification (Landing Art Director, phase L1)

*v1.0 · 1 Nov 2026 · Agent 2 (Landing Art Director). This document is binding for Agents 3–5. Change it only through the Lead.*

**Sources (all read in full):**
- `docs/landing/BRIEF.md` (client brief, binding);
- `docs/landing/REFERENCE_ANALYSIS.md` (principles only, never expression);
- `brand/PLAN.md`;
- `brand/BRAND_GUIDELINES.md`, `brand/LOGO_USAGE.md`, `brand/DESIGN_TOKENS/*`, `brand/photography/PHOTOGRAPHY.md`, `brand/applications/motion/MOTION.md`, `brand/applications/LANDING_ART_DIRECTION_INPUT.md`;
- `brand/COPY_DECK_LANDING.md`, `brand/BRAND_VOICE.md`;
- the brand book `/kit/marke`, the app tokens `src/styles/tokens.css` (identical to `brand/DESIGN_TOKENS/tokens.css`), the kit `src/components/ui/*`, `src/components/brand/logo.tsx`, `src/lib/routes.ts`, the current home `src/app/(site)/page.tsx` and `src/components/site/*`.

**Verification behind this spec:**
- I viewed every image named here at full composition.
- I measured Bone-on-image contrast per image region with a max-pooled luminance grid (worst case per 8 × 8 block).
- I rendered every arch crop with the real arch geometry (ry = 1.09 rx, handle tensions 0.57 / 0.585).
- I built an HTML layout mock of the hero with the real fonts and checked it at 1440 × 900, 1280 × 800, 1024 × 768 and 390 × 844.
- The renders are in `docs/landing/spec-assets/`. They are layout mocks, not final art: the wordmark in them is typed text, never ship that.
- **Brand v1.1 alignment.** The guidelines, `LOGO_USAGE.md`, `MOTION.md`, the art-direction input and the tokens were updated during this phase (Brand Audit 1). I re-read them, and this spec follows v1.1:
  - the symbol is the **S im O**;
  - at most **one italic moment per page**, and when the tagline appears, it is that moment;
  - **one serif headline per view**; names may be serif; navigation and list titles are sans;
  - the logo is **never inside an arch**;
  - the **offset pair + Ortszeile** is the brand's signature, used at most once per page;
  - "the mark draws on" traces the O, then the S;
  - the FAQ uses a chevron that rotates 180°.

**Conventions:**
- **Copy:** quote it verbatim from the copy deck, including its non-breaking spaces. `{…}` marks a value from data.
- ✎ marks a new microcopy string that needs the Strategist's sign-off before launch. Each one is listed in § 13.
- ⚠ marks an open point or a decision that needs the Lead.

---

## 0. Decisions at a glance

| # | Decision | Why |
|---|---|---|
| D1 | **The persistent element is *der Bogen*, the SOMA arch, in one geometry with ten states.** It has two manifestations that are always on screen: the chapter's image aperture, and the **index arch** in the navigation, which draws itself with page progress. | Derived from the motif (the O's upper half: door, window, threshold), not from the reference's particle blob. Cheap: CSS `border-radius` / `clip-path` and one SVG stroke. |
| D2 | **Hero H1: copy deck option A.** *Your body. Your place.* and the German sentence form **one `<h1>`**. The tagline is set in Newsreader Display Italic (`lang="en"`), the German line in Instrument Sans 600. | § 4.1. |
| D3 | **Hero interaction: „Ortswechsel“.** A three-way place switch (*Zu Hause · Im Hotel · Im Büro*). The next room rises into the hero arch. The Ortszeile changes, and the booking entry's *Wo?* field adapts to the place. | It is the brand idea (*Your place.*), it helps the PLZ step, and it works by tap, swipe and keyboard. § 4.1.5. |
| D4 | **The booking entry is the threshold („Schwelle“).** On desktop the pill sits at the foot of the text column and overlaps the arch's lower-left flank, like a sill under a doorway. | It is part of the composition, not a widget on top of it. |
| D5 | **Two pinned scenes, desktop "full" tier only:** 04 *Ablauf* (sticky walkthrough) and 05 *Dein Ort* (stepped stage). Everything else scrolls natively. | Brief § 7: no hijacking; at most two pins. |
| D6 | **No GSAP in v1.** We use CSS scroll-driven animations (`animation-timeline`) plus a hand-written motion layer of ≤ 12 KB gz, loaded lazily. GSAP + ScrollTrigger is allowed only as a full-tier fallback, with the Lead's approval (§ 10.4). | No scene needs timeline scrubbing beyond clip-path and colour interpolation; "avoid redundant libraries". |
| D7 | **One night band (05) and one Oxblood band (10).** Oxblood appears at most once per viewport (§ 6.2). | Tokens rule: "night (one deliberate dark band)"; the Oxblood brand moment. |
| D8 | **The landing gets its own route group: `src/app/(landing)/`**, with its own layout: landing header, dock, `SiteFooter`. `src/app/(site)/page.tsx` moves there. ⚠ The Lead must approve the file move (Frontend owns it). | `SiteHeader` is shared by all site pages; the landing needs the chapter header without forking it. |
| D9 | **Motion tiers `full` / `lite` / `none`.** Pinned layouts are applied only after the motion layer has upgraded sections that are still below the fold. | No layout shift, no broken pins when JS fails. § 8. |
| D10 | **The page has no `<em>` accent clauses.** The tagline *Your body. Your place.* is its only italic: it opens the page (hero) and closes it (10). The copy deck's accent clauses stay as words and are set roman. | Guidelines v1.1 § 4.4: "When the tagline appears, it *is* the page's italic moment." ⚠ The tagline appears twice, as a bookend. That is the same moment repeated, with zero `<em>`; the auditor should confirm this reading. |
| D11 | **The signature pair appears once:** 04, step 3 (arrival 19:25 → after 20:10, "one evening in two moments"). **The arch's last state is the O:** in 10 the mark's O traces from the arch half, and the S settles inside. | Guidelines § 10.2; `MOTION.md` § 3.6.2 (v1.1). |

---

## 1. Concept: „Durch den Bogen“ (through the arch)

### 1.1 The idea

SOMA's motif is the upper half of the wordmark's O: the arch of a door or window, *the threshold the Profi crosses* (guidelines § 5.1). The page is one walk through a home, from the first look through the window to the door closing behind you.
- Every chapter answers "where are we?", and the arch is how the answer is framed.
- The arch never decorates. It is always an image frame, an outline, or the progress mark.
- It changes **state**, never shape: the curve always keeps the O ratio (ry = 1.09 rx). Only its width, its flank length, its content and its outline change.

### 1.2 Narrative arc and pacing

The page runs two cycles of **statement → immersion → breathing → hand-off**, so a long page keeps its rhythm.
- Cycle A (01–04) ends in the first booking hand-off.
- Cycle B (05–10) ends in the final brand moment.

| # | Nav name (copy deck § 0.2) | Beat | Surface | Arch state | Motion type | Desktop length | User intention → primary action |
|---|---|---|---|---|---|---|---|
| 01 | Bei dir | **Statement** | Bone | **Fenster** (window): a tall image arch; the place switch changes the room | load: photo settle · interaction: arch wipe | 1 viewport | Understand and search → *Freie Termine finden* (`/suche?…`) |
| 02 | Idee | **Immersion** | Bone | **Schwelle** (doorway): a narrow arch inside the real doorway widens to the full arch | scroll-linked mask | ≈ 1.8 vh | Feel the idea → *Weiter: Behandlungen* |
| 03 | Behandlungen | **Breathing, active** | Bone | **Vorschau** (preview): one arch previews the category under the pointer | hover / focus swaps | ≈ 1.5 vh | Choose a category → `/behandlungen/{slug}` |
| 04 | Ablauf | **Explanation → hand-off A** | Stone | **Linie → Paar**: an outline holds the live UI; at step 3 it becomes the contrapposto pair | **pin 1**: sticky stage | ≈ 3.4 vh | Trust the process → *Freie Termine finden* |
| 05 | Dein Ort | **Immersion** | Espresso (night) | **Bühne** (stage): six places rise into one arch | dusk tone shift · **pin 2**: stepped stage · dawn tone shift | ≈ 5 vh | Desire → *Freie Termine finden* |
| 06 | Profis | **Breathing** | Bone | **O**: for people the arch closes to the full O-oval (guidelines § 5.1: portraits use the O) | oval rise | ≈ 1.2 vh | Meet a Profi → `/profis/{slug}` |
| 07 | Deine Buchung | **Product** | Linen | **Im Produkt**: the arch lives inside the real UI (the arch-check glyph, the "today" mark) | screen tabs | ≈ 1.3 vh | Confidence → *Freie Termine finden* |
| 08 | Für Profis | **Statement, second audience** | photo band, then Bone | **Treppenhaus**: the one full-bleed photo band, no arch (the Profi is on the way) | photo settle | ≈ 1.6 vh | *Profi werden* → `/pro/registrieren` |
| 09 | Fragen | **Breathing, utility** | Bone | only the index arch | accordion | ≈ 1.2 vh | Answers → `/hilfe` |
| 10 | SOMA | **Hand-off B** | Oxblood | **O-Schluss** (closure): an Oxblood arch mask opens to full bleed; the mark's O traces from the arch half, and the S settles inside | arch mask + "the mark draws on" + lockup reveal | 1 vh | Book, or become a Profi |

- **Length:** the desktop page is about 19 viewports (≈ 17,000 px at 900 px height), the mobile page about 24 viewports.
- **Chapter rhythm:** 01–03 are light and fast, 04–05 hold the reader with the two pins, 06–07 release, 08 changes the audience, 09–10 close.

### 1.3 The persistent element, in detail

**A. The chapter arch (content).** One arch per view, built on `LandingArch` (§ 11.2):
- The radius is `border-radius: 50cqw 50cqw 0 0 / 54.5cqw 54.5cqw 0 0` inside an `inline-size` container, so any height keeps the O curve.
- Mask animations use the canonical inset mask in Appendix A.

| Chapter | State | Implementation | Render cost |
|---|---|---|---|
| 01 | Fenster: arch 4:5 (≥ 1280: cols 7–12); the place switch wipes the next room in | 3 stacked `<Image>` layers, `clip-path: inset()` transition | 1 composited layer per transition |
| 02 | Schwelle: mask from 38 % of the box width (inside the real doorway) to the full arch | `clip-path: inset(... round ...)` on a scroll timeline | paint of one 628 × 785 layer |
| 03 | Vorschau: image swap inside a fixed arch | same as 01 | — |
| 04 | Linie: 1.5 px outline (`archPath`, SVG); step 3: the pair (left high, right −18 % of its width) | SVG stroke + 2 arch frames | trivial |
| 05 | Bühne: one 4:5 arch, six images, stepped arch rise | `clip-path: inset(100% 0 0 0) → inset(0)` | 1 layer per step |
| 06 | O: O-oval portraits (332 : 362) | `Portrait shape="oval"` | — |
| 07 | Im Produkt: arch glyphs inside the real screens | none (it is in the screenshot) | — |
| 08 | none (full-bleed 16:9 band) | — | — |
| 09 | none | — | — |
| 10 | O-Schluss: an Oxblood arch mask opens to full bleed. Once the mask is square (no arch visible), the mark (S im O, line cut) draws on: its O contour starts at the left springline and runs over the crown first (the arch half), then closes below. | scroll timeline + SVG `stroke-dashoffset` | trivial |

**B. The index arch (navigation).** A 16 × 20 px arch outline at the left of the chapter index (§ 5.2).
- It has two strokes: the track, and the progress drawn with `pathLength="1"` and `stroke-dashoffset: calc(1 - var(--lp-progress))`.
- It draws from the left flank, over the crown, down to the right flank.
- At the end of the page it is complete. The mark's O in chapter 10 then traces the same arc and closes it into the full O: the place, with the body (the S) inside. This is the payoff of the persistent element: the arch was always the upper half of the O.
- Size precedent: small arch glyphs are already system iconography (the 14 × 7 "today" mark in `DateStrip`, the arch-check glyph, the 72 px empty-state outline).
- The guideline "one arch per view" counts image arches and content outlines. The 16 px index glyph and the 14 × 7 marks are icons and do not count.

**What the arch never does:** rotate, tilt, bounce or loop; nest inside another of our arches; contain the logo or the mark (`MOTION.md` § 5); become a filled decorative shape (the only Oxblood fill is the chapter-10 mask, which is the brand moment); work as a pattern; drop below 120 px width as an image crop.

### 1.4 Alternatives considered and rejected

| Alternative | Why not |
|---|---|
| A fixed full-viewport stage behind all chapters (the reference's structure) | It is the reference's signature layout ("left text + right stage"), and a scroll-linked multi-speed layer breaks `MOTION.md` § 5 (no parallax). |
| O → S morph as the progress device | `LOGO_USAGE.md` § 6 and `MOTION.md` § 3.6: the S is never built from or turned into other letters. |
| Full-bleed hero with Bone type on `hero-wide` | Measured: the left 45 % of `hero-wide` drops to 2.9:1 worst case for Bone text (window panes), and the lead and booking entry would need a 62 % scrim band. The arch on Bone gives 13.9:1 and keeps the motif in the first frame. `hero-wide` stays the OG and social master. |
| WebGL / R3F | Nothing on the page needs depth or particles. The identity is flat and architectural (`MOTION.md` § 5: no 3D). |
| Masked word-rise headlines (the reference's 105 % line mask) | Brand distances are 8–16 px, and nothing travels further than its own height. We use clause arrival (10 px + fade, § 8.3). |
| The S drawn inside a Bone arch outline in 10 (art-direction input v1.0) | Superseded by brand v1.1: the logo is never inside an arch, and the symbol is now the S im O. The arch's O completes instead (D11). |
| The hero as the offset pair (as on today's home) | The pair is the signature, but at 303 px per arch it gives up the hero's immersion. It is used once, where its content fits the signature exactly: 04, step 3. |

---

## 2. Responsive grid and content widths

### 2.1 Breakpoints and columns

| Name | Viewport | Columns | Outer margin (`--space-gutter`) | Gap | Content width (example) | Column width (example) |
|---|---|---|---|---|---|---|
| mobile | 360–767 (reference 390) | 4 | 20 | 12 | 350 @ 390 | 78.5 |
| tablet | 768–1023 (reference 768) | 8 | 32 | 20 | 704 @ 768 | 70.5 |
| desktop | 1024–1279 (reference 1024 / 1280) | 12 | 48 | 24 | 928 @ 1024 · 1184 @ 1280 | 55.3 · 76.7 |
| wide | ≥ 1280; fixed from 1376 (reference 1440) | 12 | 48 inside the 1376 container, so 80 at 1440 | 24 | **1280 max** | **84.7 max** |

- **Container:** `max-width: 1376px` (`--container-page`, 86 rem) with `padding-inline: var(--space-gutter)`. From 1376 px the composition is centred, and only full-bleed elements grow (the 08 band, the 05 and 10 surfaces, the tone spacers).
- **Measures:** reading text ≤ 608 px (`--container-reading`, 38 rem ≈ 64 ch); lead ≤ 40–44 ch; display measures per chapter in § 3.2.
- **The column variable**, defined once on the landing root:
  `--lp-n: 4 | 8 | 12;` and `--lp-col: calc((min(100vw, 1376px) - 2 * var(--space-gutter) - (var(--lp-n) - 1) * var(--gap)) / var(--lp-n));`
  - Element widths that cross a grid track (the booking sill, arch frames) use `calc(k * var(--lp-col) + (k - 1) * var(--gap))`.
  - `--gap` is 12 / 20 / 24.
- **Editorial asymmetry** (guidelines § 5.2): text on 5 columns, the image on 6, one empty column between them. Two-part layouts drop the second element by 8–18 % of its width.
- **Safe areas:**
  - `viewport-fit=cover` is already set.
  - Header: `padding-top: env(safe-area-inset-top)`.
  - Dock: `bottom: max(12px, env(safe-area-inset-bottom))`.
  - In landscape, the container's horizontal padding is `max(var(--space-gutter), env(safe-area-inset-left / right))`.
  - Full-bleed images ignore the safe area; text never does.

### 2.2 Vertical rhythm

- 4 px baseline.
- Chapter padding: `padding-block: var(--space-section)`, i.e. **72 / 96 / 128 px** (mobile / tablet / ≥ 1024).
- Chapter header block: eyebrow → 16 → headline → 24 → supporting text → **40 / 48 / 64** → content.
- `scroll-margin-top: var(--header-height)` on every chapter (60 / 68 px).
- **Demo mode:** the `DemoRibbon` stays in flow above the header (≈ 33 px desktop, ≈ 49 px at 390). It scrolls away; nothing is pinned to it.
- **Short viewports**, `@media (min-width: 1024px) and (max-height: 820px)`:
  - the hero tagline steps down from `display-xl` to `display-l` size;
  - the hero lead may run to 4 lines;
  - pinned stages use `100svh` and shrink their arches (§ 4.4, § 4.5).

### 2.3 Layering (tokens `--z-*`)

| Layer | z |
|---|---|
| Header | 30 |
| Dock (sticky CTA) | 35 |
| Booking bar backdrop and bar | 40 / 50 |
| Chapter overlay (`<dialog>`, top layer) | — |
| Sheets | 50 |
| Toast | 70 |

Inside chapters: the booking sill is z 2 above the hero arch; overlapping cards in 04 are z 1–3. Nothing else overlaps.

---

## 3. Typography for the landing

### 3.1 Rules (brand § 4, applied)

- **Faces:** Newsreader Display (roman and italic) speaks; Instrument Sans works. No other faces. DM Mono is never used on the landing.
- **One serif headline per view** (guidelines v1.1 § 4.4).
  - Every chapter has exactly one serif headline (its `h2`). Every other heading in view is sans (`heading-*`).
  - **Names may be serif:** provider names (06, the 04 vignette), set as identity in `type-title-serif`.
  - **Always sans:** navigation, list titles, forms, buttons, labels and numbers. That covers the 03 category index, the chapter overlay, tabs and cards.
  - **One serif "statement" may accompany the headline** (the guidelines' one-quote-per-view allowance):
    - 02's three lines are one pull statement (`<p>`, not headings);
    - each 05 theme line is a `<figcaption>` statement, and only one is ever visible.
  - The hero tagline *is* the serif headline of view 01, so the German H1 line is set in the sans.
- **Italics (D10):**
  - the tagline is the page's only italic;
  - **no `<em>` anywhere on the landing.** The copy deck's accent clauses are set roman, as the second sentence of their headline;
  - check: `document.querySelectorAll('h1 em, h2 em').length === 0`.
- **The tagline** *Your body. Your place.* is always Newsreader Display Italic and `lang="en"`.
  - It is a styled span (`type-accent`), not `<em>`.
  - It is always two lines, one sentence per line: two `display: block` spans. Never let it break as "Your body. Your / place." (the mock at 1024 proved it would).
- **Wrapping:**
  - headlines `text-wrap: balance` (the tokens already set it);
  - body and lead `text-wrap: pretty; hyphens: auto` (`lang="de"`);
  - compounds longer than 14 characters in display sizes get `&shy;` from `shy()` in `discovery-copy.ts`;
  - chips, tabs and buttons switch to `condensed` (`font-stretch: 86%`) before they ever truncate.
- **Tracking:** the token values only. Display −0.026 to −0.014 em, h2 −0.012, body ≈ 0, eyebrow and Ortszeile +0.10 to +0.12 em. Never track display type positively.
- **Numerals:**
  - tabular lining (`num`) for chapter numbers, prices, times, Ortszeilen and the Start-Code;
  - German formats with NBSP: `54 €`, `18:30 Uhr`, `3. OG`;
  - numbers never count up (the proof-band `CountUp` is not used on the landing).
- **Chapter eyebrow format:** `{NN} · {copy-deck eyebrow}`, for example **02 · Die Idee** (`type-eyebrow`, number in `num`, umber-deep).
  - The hero has no number: its place switch takes the eyebrow position.

### 3.2 Sizes per chapter (tokens; px at 390 → 1440)

| Ch | Element | Token | Size | Colour | Measure / lines |
|---|---|---|---|---|---|
| 01 | Tagline (part of the H1) | `type-display-xl` + `type-accent` | 44 → 104 (`display-l` 38 → 80 in short viewports) | ink | 2 forced lines, `max-inline-size: 6.2em` |
| 01 | German H1 line | `type-heading-l` (600) | 20 → 24 | ink | ≤ 30 ch, 2 lines |
| 01 | Lead | `type-lead` | 18 → 21 | ink-muted | ≤ 40 ch (44 ch in short viewports) |
| 01 | Place switch | `type-eyebrow` | 12 | umber-deep / ink | one line |
| 02 | Headline | `type-display-l` | 38 → 80 | ink | ≤ 20 ch → "Dein Termin richtet sich / nach deinem Leben. / Nicht umgekehrt." (all roman; the second sentence on its own line) |
| 02 | Three lines (the pull statement, `<p>`) | `type-display-m` | 32 → 60 | ink | ≤ 14 ch each, balance |
| 02 | Closing statement | `type-lead` | 18 → 21 | ink | ≤ 36 ch |
| 02 | Origin caption | `type-small` | 12 | ink-muted | one line |
| 03 | Headline | `type-display-m` | 32 → 60 | ink | ≤ 18 ch |
| 03 | Index names (desktop; list titles are sans) | `type-heading-l` (600) | 20 → 24 | ink | one line each |
| 03 | Tile line · price | `type-body-s` · `type-label-s num` | 14 · 13 | ink-muted · ink | ≤ 40 ch |
| 04 | Headline | `type-display-m` | 32 → 60 | ink | ≤ 18 ch |
| 04 | Step number | `type-numeric` | 28 → 40 | ink | "01" |
| 04 | Step title · line · detail | `type-heading-l` · `type-lead` · `type-body` | 20–24 · 18–21 · 16 | ink · ink · ink-muted (umber-deep, 4.7:1 on Stone) | detail ≤ 38 ch |
| 05 | Headline | `type-display-l` | 38 → 80 | Bone | ≤ 16 ch |
| 05 | Theme line (`<figcaption>` statement) | `type-display-s` | 28 → 44 | Bone | ≤ 16 ch |
| 05 | Counter "03 / 06" | `type-label num` | 14–15 | night-muted `#BFB4A7` | — |
| 06 | Headline | `type-display-m` | 32 → 60 | ink | ≤ 18 ch |
| 06 | Provider name | `type-title-serif` | 26 | ink | one line, truncates with ellipsis |
| 07 | Headline | `type-display-m` | 32 → 60 | ink | ≤ 16 ch |
| 07 | Tab title · line | `type-heading-m` · `type-body-s` | 17–19 · 14 | ink · ink-muted | ≤ 40 ch |
| 08 | Headline (on the photo) | `type-display-l` | 38 → 80 | Bone | cols 1–5, never beyond 41 % of the band |
| 08 | Benefit title · line | `type-heading-m` · `type-body-s` | — | ink · ink-muted | ≤ 32 ch |
| 09 | Headline | `type-display-m` | 32 → 60 | ink | ≤ 16 ch |
| 09 | Question · answer | `type-heading-m` · `type-body` | 17–19 · 16 | ink · ink-muted | answer ≤ 64 ch |
| 10 | Tagline (the bookend of the page's one italic) | `type-display-l` + `type-accent` | 38 → 80 | Bone | 2 forced lines, like the hero |
| nav | Chapter overlay names | `type-heading-l` (600) | 20 → 24 | ink | one line each |
| 10 | German line | `type-lead` | 18 → 21 | oxblood-200 (6.2:1) | — |
| all | Ortszeile | `type-place` | 12 | umber-deep / night-muted / Bone-muted on the 08 photo | segments `white-space: nowrap`; wrap only at " · " |

`display-xl` is used **once** on the page (the hero).

---

## 4. Chapters 01–10

Each chapter is a `<section id data-chapter …>` built on the `Chapter` primitive (§ 11.2). The data comes from the existing services listed per chapter. The copy is quoted from `COPY_DECK_LANDING.md`.

### 4.1 · 01 Bei dir (hero) · `#bei-dir`

**Intention:** within seconds the visitor sees that Profis come to them, at home, in a hotel or in the office, and can start a search.

#### 4.1.1 Composition

**1440 × 900** (validated, `spec-assets/hero-layout-mock-1440.jpg`):
```
y   0 ┌ header 68 ─ SOMA  ⌒ 01 Bei dir ·········· Behandlungen  So funktioniert’s  Für Profis  Hilfe   Anmelden  [Termin finden] ┐
y 100 │ ZU HAUSE · IM HOTEL · IM BÜRO                                 ╭────────────────────╮                                      │
      │ ‾⌒‾ (14×7 mark under the active place)                       ╭╯                    ╰╮   arch: cols 7–12, x 732–1360        │
y 160 │ Your body.          display-xl italic 104/0.98               │   hero room          │   628 × ≈760 (fills the hero row)     │
      │ Your place.         (2 forced lines)                          │   (blue hour)        │                                      │
y 396 │ Beauty & Wellness bei dir zu                                  │                      │                                      │
      │ Hause, im Hotel oder im Büro.   heading-l 600                 │                      │                                      │
y 468 │ Geprüfte Profis für … kommen zu dir. Du siehst echte freie    │                      │                                      │
      │ Termine – mit Endpreis inklusive Anfahrt.   lead, 3 lines     │                      │                                      │
y 592 │ So funktioniert’s   (underlined link, 44 px target)           │                      │                                      │
y 670 │ ╭ Wo? PLZ, z. B. 10435  ⊙ │ Was? Alle Behandlungen │ Wann? So bald wie möglich │ [Freie Termine finden] ╮ ← the sill │
      │ ╰───────────────────────────────────────────────────────────────────────────────────────╯  width max(8 cols, 820 px) │
y 758 │ ✓ Verifizierte Profis   ✓ Endpreis inkl. Anfahrt   ✓ Kostenlos stornierbar bis 24 Std. vorher    (cols 1–6)       │
y 860 │                                                               └──────────────────────┘ arch base                      │
y 876 │                                                               ALTBAU, 3. OG · BERLIN-PRENZLAUER BERG · 19:30          │
```

**Grid (≥ 1280):**
- **Head** (place switch and H1): cols 1–5, row 1.
- **Figure** (arch and Ortszeile): cols 7–12, rows 1–3. The arch stretches to the row height.
- **Rest** (lead, link, sill): cols 1–5, rows 2–3, a flex column. The sill has `margin-top: auto`.
- **Hero min-height:** `min(100svh − header, 1.25 × arch width + 72px)`.
- **Arch crown:** 32 px below the header.
- **Sill:** its bottom edge sits **72 px above the arch base**. The trust row sits 16 px under the pill and stays inside cols 1–6, so it is always on Bone.
- **Ortszeile:** 12 px under the arch base, left-aligned to the arch edge.

**1024–1279:**
- head and rest on cols 1–6, figure on cols 8–12;
- the sill is **10 columns** wide (`calc(10 * var(--lp-col) + 9 * var(--gap))`, 769 px at 1024);
- pill segments get 16 px horizontal padding and `condensed` values;
- the trust row stays in cols 1–6 and wraps to 2 lines.

**768–1023 and < 768** (stacked; validated at 390, `hero-layout-mock-390.jpg`):
```
390 × 844
y  60  ZU HAUSE · IM HOTEL · IM BÜRO          (44 px row)
y 136  Your body.                display-xl 44
       Your place.
y 246  Beauty & Wellness bei dir zu
       Hause, im Hotel oder im Büro.   heading-l 20
y 320  ╭──────────────╮
       │   arch 4:5   │  350 × 438, full content width (tablet: cols 2–7, 523 × 654)
       │              │
y 758  └──────────────┘
y 770  ALTBAU, 3. OG · BERLIN-PRENZLAUER BERG · 19:30
y 808  Lead (4 lines) · So funktioniert’s
       ╭ stacked booking card: Wo? / Was? / Wann? (64 px rows) / [Freie Termine finden] 52 ╮
       ✓ trust row (2 lines)
       [dock: ⌒ 01 Bei dir | Termin finden]  ← fixed until the card is ≥ 25 % in view
```
- **DOM order is identical at every width:** place switch → `h1` → figure → lead → link → sill (booking, trust). Desktop places the figure in its own column through the grid, so the focus order is right everywhere.
- **Tablet:** head and rest on cols 1–6, figure on cols 2–7. The booking card sits after the lead on cols 1–6, stacked, with no overlap.

#### 4.1.2 Images

| Place | Source (interim) | Crop in the arch | Ortszeile (copy deck § 01) | Alt (✎) |
|---|---|---|---|---|
| **Zu Hause** (default, LCP) | `/images/landing/hero-mobile.jpg` → target `landing/hero-home-4x5.jpg` (§ 12.2, A1) | `object-position: 50% 45%`. The head sits at ≈ 25 % of the arch height; nothing is cut by the curve. Verified in `crops-hero-places.jpg`. | Altbau, 3. OG · Berlin-Prenzlauer Berg · 19:30 | Ein Profi massiert am Abend den Rücken einer Person auf einer Massageliege, in einem Berliner Altbauzimmer mit hohen Fenstern. |
| **Im Hotel** | `/images/editorial/hotel-v2.jpg` → target `landing/hero-hotel.jpg` (A2) | `72% 50%`: the Profi, the guest under linen and a slice of the skyline. ⚠ The Profi's head is in the top 20 % (the 3:2 source has no vertical slack), acceptable until A2 exists. | Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10 | Ein Profi massiert am späten Abend einen Gast in einer Hotelsuite; hinter dem Fenster die beleuchtete Frankfurter Skyline. |
| **Im Büro** | `/images/editorial/office-v2.jpg` → target `landing/hero-office.jpg` (A3) | `60% 45%`: chair massage, glass walls, the harbour behind. Same ⚠ as above. | Besprechungsraum · Hamburg-HafenCity · 13:00 | Nackenmassage auf einem Massagestuhl in einem Besprechungsraum mit Glaswänden, dahinter der Hamburger Hafen. |

- **Empty slot:** the massage wash `#E8DED2`, without the outline (the hero is never "empty"; the wash is only the load colour).
- **The LCP image is never faded or masked in on load.** It paints at opacity 1. Only the settle runs (`transform: scale(1.04) → 1`, 900 ms `ease-settle`, CSS from first paint).
  - ⚠ The kit's `Photo` fades in over the wash (640 ms). Frontend must use the no-fade path (`data-lcp`) for this image.
- **next/image:**
  - `preload` (the Next 16 replacement for `priority`);
  - `quality` from the `images.qualities` allowlist (default 75);
  - `sizes`: from 1024 `(min-width: 1440px) 628px, (min-width: 1280px) 45vw, (min-width: 1024px) 37vw`. Below 1024 the arch is capped to the first view (`landing.css`, "The arch’s first view below 1024"), so its width depends on the viewport height too: `heroSizes()` in `hero/places.ts` writes that cap into `sizes` with `min()`, `clamp()` and `svh` (demo ribbon included when shown), each entry followed by the uncapped width for the same range (`68vw` at 768–1023, `calc(100vw - 40px)` below), which a browser that cannot evaluate those functions in `sizes` falls back to. The fetched width then matches the arch shown (390 × 844: 640 w, 768 × 1024: 640 w, 820 × 1180: 828 w, 1023 × 768: 384 w; audit-3 M-5).

#### 4.1.3 Copy slots and CTAs

| Slot | Copy | Target |
|---|---|---|
| Place switch | **Zu Hause · Im Hotel · Im Büro** (copy deck toggles); radiogroup label ✎ „Ort“ | — |
| H1 | `<h1><span lang="en">Your body.</span> <span lang="en">Your place.</span> <span>Beauty & Wellness bei dir zu Hause, im Hotel oder im Büro.</span></h1>` | — |
| Lead | Geprüfte Profis für {Massage, Nägel, Kosmetik, Haare und Make-up} kommen zu dir. Du siehst echte freie Termine – mit Endpreis inklusive Anfahrt. (Use the deck's fallback rule if the catalogue list cannot be rendered.) | — |
| Secondary CTA | **So funktioniert’s** (link style) | `#so-funktionierts` |
| Booking entry | *Wo? · Was? · Wann?* with the deck's labels, placeholders, states and errors | submit → `/suche?plz=&kategorie=&leistung=&datum=&zeit=` |
| Primary CTA | **Freie Termine finden** (the entry's submit; replaces the brief's "Jetzt entdecken", deck § 01) | as above |
| Trust row | Verifizierte Profis · Endpreis inkl. Anfahrt · Kostenlos stornierbar bis {24 Std.} vorher (hours from `terms.cancellationPolicy`; drop the third item if there is no free window) | — |
| Ortszeile | per place (§ 4.1.2) | — |

#### 4.1.4 Why H1 option A

1. It is the brief's headline direction and the brand's primary line: the strongest recall in the strongest position.
2. The German sentence makes the service clear in one read and carries the SEO terms (*Beauty & Wellness*, *zu Hause*, *Hotel*, *Büro*). It is part of the same `<h1>`, so the visual and semantic hierarchy agree.
3. The H1's three places are the three positions of the hero interaction: the headline *is* the instruction.
4. It bookends the page. The page opens with the English tagline and closes in chapter 10 with the German signature *Du bleibst. Dein Profi kommt.* (option B is kept for that, deck § 10).
5. Option C is the least distinctive. Option D is massage-only and fits campaign landings, not the home page.
6. The German line is in the sans because the tagline is the view's one serif statement (§ 3.1).

#### 4.1.5 The hero interaction: „Ortswechsel“ (the ONE memorable interaction)

**What it does.**
1. Choosing a place swaps the room inside the arch: the next room **rises into the doorway**.
2. The Ortszeile names the new place and time.
3. The booking entry adapts:
   - the *Wo?* example PLZ becomes a real PLZ of that city (`listCityPostalExamples()`: `berlin`, `frankfurt`, `hamburg`);
   - the placeholder and the screen-reader label name the place: ✎ „PLZ des Hotels, z. B. {60311}“ / ✎ „PLZ des Büros, z. B. {20095}“ / the deck's „PLZ, z. B. {10115}“;
   - the screen-reader suffix becomes ✎ „Postleitzahl des Hotels“ / „… des Büros“.
   - **Fallback if the ✎ strings are not approved:** only the example PLZ changes.
4. Nothing is sent to `/suche`: the search has no place parameter (`routes.search`), and the place is chosen at checkout. The interaction therefore never pretends to filter.

**Controls.**
- Markup: a `role="radiogroup"` with three `role="radio"` buttons, roving `tabindex`, Arrow keys, Home and End. `aria-checked`; `aria-controls` points at the figure.
- Text buttons in `type-eyebrow`, at least 44 px tall (16 px block padding), separated by `·` (`aria-hidden`).
- **States:**
  - unselected: umber-deep, 6.4:1;
  - hover: ink;
  - selected: ink plus the **14 × 7 arch mark** (1.5 px ink outline, centred, 6 px under the cap height). The mark slides to the new label in 220 ms `ease-standard`;
  - focus: 2 px Oxblood ring, 4 px offset.
- **Touch:** a horizontal swipe on the arch changes the place. The rule: horizontal travel > 40 px and angle < 30°; `touch-action: pan-y` on the figure, so vertical scrolling is never captured.
  - Swipe left → next place; swipe right → previous; it wraps around.
- **No auto-rotation, ever** (no ambient loops).

**Choreography (full tier).**

| t (ms) | Element | Motion |
|---|---|---|
| 0 | Radio state, the mark | instant state; the mark slides 220 `ease-standard` |
| 0 | Incoming image layer (on top) | `clip-path: inset(100% 0 0 0) → inset(0)`, 640 `ease-arrive` (the brand's arch rise; the frame stays in place) |
| 0 | Incoming photo | `scale: 1.04 → 1`, 900 `ease-settle` |
| 0 | Outgoing Ortszeile | opacity → 0, 160 `ease-exit` |
| 320 | Incoming Ortszeile | opacity 0 → 1 and rise 8 px, 480 `ease-arrive` |
| 0 | *Wo?* placeholder, sr label | swap instantly (only while the field is empty) |
| 640 | Outgoing layer | unmounted |

- **Rapid changes:** the running transition snaps to its end and the next one starts. Nothing queues.
- **Prefetch:** fetch the two other images on the first `pointerenter` or `focusin` of the radiogroup, or 2 s after `load` via `requestIdleCallback`, using `getImageProps()` with the same `sizes`.
- **Lite:** the wipe takes 480 ms, no settle. **None:** instant swap; the Ortszeile swaps without motion.
- **Markup contract:** the figure holds `[data-place-layer][data-state="current|entering|leaving"]`. The CSS animation is Motion's (§ 11.3). Frontend swaps states on `animationend`, with a 1 s timeout fallback.

#### 4.1.6 The booking entry inside the composition („Schwelle“)

- **Component:** the existing `BookingEntry` (`site/booking-entry.tsx`), wrapped by Conversion in `landing/booking/hero-booking-entry.tsx`. Field order *Wo? · Was? · Wann?* (deck: the PLZ comes first, it decides availability). This replaces the brief's "service · PLZ · date".
- **≥ 1024:** the pill.
  - 72 px tall, `radius: pill`, Paper, `shadow-float`, 1 px `line-mid` ring.
  - Grid `1.2fr 1.1fr 1.25fr auto`. Submit: `Button variant="accent" size="l"` (52 px).
  - Width per § 4.1.1. Rendered at z 2 over the arch flank.
- **< 1024:** the stacked card: 64 px rows, 1 px `line` dividers, full text-column width, submit full width.
- **Required changes (Conversion):**
  1. **No-JS submit:** `action="/suche" method="get"` on the form, so `plz` submits without JS. *Was?* and *Wann?* stay JS-enhanced.
  2. **Popovers flip upward** when the space below the pill is smaller than the popover plus 24 px. At 1440 × 900 the pill ends at y 742, so the popovers open upward.
  3. **Status in the sill:** errors render as one line under the pill. The unserved-PLZ waitlist panel renders as an anchored panel under the *Wo?* segment (absolute, 420 px, Paper, `shadow-overlay`), not in flow, so the hero never reflows. The polite live region stays.
  4. **Place hint:** a `placeHint` prop `{ place, examplePlz }` drives the placeholder and the sr label (§ 4.1.5).
  5. **`RebookRow`** (returning customers) renders under the trust row on desktop, where there is no content below it, and in the booking bar/sheet. Never above the pill (layout shift).
- **`#termin`** stays the entry's id (the deck's persistent CTA target).

#### 4.1.7 Motion, mobile, reduced motion

- **Load:**
  - SSR HTML; no text is hidden at load. The H1, lead, entry and trust row paint final from the first frame;
  - the photo settles (900 ms), the only load motion;
  - the place switch's mark is static.
- **Mobile:** the same interaction, with swipe. The dock is visible until the booking card is ≥ 25 % in view.
- **Reduced motion:** no settle; the place swap is instant.

### 4.2 · 02 Idee · `#idee`

**Intention:** the editorial statement. Care adapts to life.

**Data:** none.

**Composition at 1440:**
```
 02 · DIE IDEE
 Dein Termin richtet sich               display-l, cols 1–10, ≤ 20 ch
 nach deinem Leben.
 Nicht umgekehrt.    (roman: the page's only italic is the tagline)
                                                       ↓ 64
 ╭───────────── image box: cols 1–6, 628 × 785 (4:5) ─────────────╮
 │   mask start: a narrow arch inside the real doorway               │
 │   (x 37 %–75 %, crown at 9 %): only the lamp-lit room is visible  │
 │   mask end: the full 4:5 arch over the whole image: the hallway,  │
 │   the kit bags at the wall and the real arched doorway appear     │   cols 8–12, bottom-aligned to the image base:
 │                                                                   │   Kein Weg durch die Stadt.      display-m
 │                                                                   │   Kein Parkplatz.
 │                                                                   │   Kein Wartebereich.
 │                                                                   │   Du bleibst, wo du bist. Dein Profi kommt – mit
 ╰───────────────────────────────────────────────────────────────────╯   allem, was die Behandlung braucht.   (lead)
 FLUR · BERLIN-SCHÖNEBERG · 18:40                                        Soma ist das altgriechische Wort für Körper. (small)
                                                                          ── Weiter: Behandlungen ↓   (chapter foot)
```

**The story:** the mask opens from the room you stay in to the hallway, where the Profi's kit already stands. That is the closing statement made visible: *Dein Profi kommt – mit allem, was die Behandlung braucht.*

**Image:** `/images/landing/philosophy.jpg` (4:5).
- `object-position: 50% 50%` (the image is exactly 4:5, no crop).
- `sizes="(min-width: 1440px) 628px, (min-width: 1024px) 45vw, (min-width: 768px) 69vw, calc(100vw - 40px)"`.
- Alt ✎: „Blick aus dem Flur durch einen Rundbogen in ein Wohnzimmer mit Stehlampe; an der Wand stehen die Tasche und die zusammengeklappte Liege eines Profis.“
- End state verified in `crops-*` (philosophy end): the real doorway sits inside our arch, as the art-direction input requires.

**Copy:** deck § 02, verbatim. The chapter foot is ✎ „Weiter: Behandlungen“ → `#behandlungen` (the deck's quiet link „Behandlungen ansehen“ points to the same anchor; use the deck string if ✎ is not approved).

**Motion:**
- **Full:** the mask is scroll-linked (Appendix A). Start `--arch-l: 37cqw; --arch-r: 25cqw; --arch-t: 9%`; end `0 / 0 / 0`, k = 1.
  - `animation-timeline: view(); animation-range: entry 30% entry 100%`; linear (scroll-linked).
  - The three lines arrive one by one when the mask progress crosses 0.35 / 0.65 / 0.95: clause arrival, 10 px and opacity, 640 ms `ease-arrive`. Triggered, so a line never stops halfway.
  - Without scroll-timeline support (Firefox today) the motion layer writes `--lp-scene` from a passive rAF-throttled scroll listener. If it is not loaded, the end state shows.
- **Lite:** no widening. The full arch does the arch rise on entry (640 ms, settle 900 ms); the lines arrive with a 90 ms stagger.
- **None:** the end state, all text visible.

**768:** the image on cols 1–6 (523 × 654); lines, statement and caption below on cols 1–7.

**390:**
- order: headline → arch (350 × 438) → Ortszeile → three lines (display-m 32) → statement → caption → chapter foot;
- spacing 24 between the lines, 40 before the statement.

### 4.3 · 03 Behandlungen · `#behandlungen` (service exploration)

**Intention:** the service universe. Every category leads to its discovery route.

**Data:** `listCatalog()` (catalogue order, today: Massage, Maniküre, Pediküre, Kosmetik, Make-up, Haare & Styling, Brows & Lashes) and `getPriceFloors()`.

**Routes:** `routes.category(slug)` → `/behandlungen/{massage|manikuere|pedikuere|kosmetik|make-up|haare-styling|brows-lashes}` (verified: `src/app/(site)/behandlungen/[kategorie]/page.tsx`); „Alle Behandlungen“ → `/behandlungen`.

**Desktop with a fine pointer** (`(min-width: 1024px) and (hover: hover) and (pointer: fine)`): the **editorial index with a preview arch**.
```
 03 · BEHANDLUNGEN
 Sieben Behandlungen. Ein Ort: deiner.                display-m, cols 1–7 (roman)
 Von Profis, die mitbringen, was die Behandlung braucht – von der Liege bis zur Lampe.
                                                                       ↓ 48
 cols 1–6: index (7 rows × 104 px, 1 px line dividers)        cols 8–12: preview arch 519 × 649 (4:5),
 01  Massage                                         ↗                   sticky top: header + 48
     Klassisch, Aromaöl, Hot Stone.          ab 45 €                ╭──────────────╮
 ─────────────────────────────────────────────────────              │  massage-v2  │
 02  Maniküre                                        ↗              │              │
     Von klassisch mit Lack bis Gel.         ab 30 €                ╰──────────────╯
 ─────────────────────────────────────────────────────              Massage                         heading-m
 …                                                                  Entspannungsmassage · Aromaölmassage · Hot Stone  (3 services, body-s)
 07  Brows & Lashes                                  ↗              ab 45 € · zzgl. Anfahrt ✎       (label-s / caption)
 ── Alle Behandlungen →                     Weiter: Ablauf ↓
```

- **Row = one `<a href="/behandlungen/{slug}">`:**
  - number (`type-label num`, umber-deep, 40 px column);
  - name (`type-heading-l`, sans: list titles are sans in v1.1, and the drama comes from the preview arch);
  - tile line (`body-s`, ink-muted) on the second line;
  - price chip `ab {x €}` (`label-s num`, only when a floor exists);
  - `ArrowUpRight` 20 px.
- **Row states:**
  - hover: Linen fill, 160 ms; the arrow moves 2 px up-right, 220 ms `ease-settle`;
  - focus-visible: inset focus ring;
  - pressed: scale 0.99.
- **Preview** (`aria-hidden`, a mirror of the row under pointer or focus):
  - shows the category's v2 image (`categories/{slug}-v2.jpg` via `imagePath`/`images.category()` and `replacedBy`) at its stored `focal`;
  - the caption shows the category name, up to three service names from the catalogue, and the price note;
  - default: the first category.
- **Price note:** ✎ „zzgl. Anfahrt“ after the „ab“ price. ⚠ PAngV: an "ab" price must say that travel is extra. The deck allows "ab" chips here; Conversion confirms the wording.
- **Swap motion:**
  - intent delay 80 ms, so rows crossed by the pointer do not flicker;
  - the new image rises in (inset bottom-up, 480 ms `ease-arrive`) and settles (900 ms);
  - the caption crossfades (160 ms out, 220 ms in).
  - Focus triggers the same swap, so the keyboard has parity with hover.
  - Lite and none: instant swap.

**Touch, tablet, mobile** (all other cases): the existing `Rail` (`site/discovery-rail.tsx`) with `CategoryTile` cards.
- Card width 78 % at 390 (≈ 273 px; 4:5 arch 249 × 311 inside the 12 px inset); `perView` ≈ 2.4 at 768.
- Snap, with a visible peek of the next card. Arrow buttons from `lg`.
- First-row arch rise with a 90 ms stagger (≤ 6 cards), first view only.
- ⚠ Kit drift: `CategoryTile` still sets its title in `type-title-serif`. Guidelines v1.1 § 9.3 want `heading-m` for card titles in lists. The landing passes the sans; the global fix belongs to the app-migration owner.

**Copy:** deck § 03; the number word comes from `numberWord(catalog.length)`.

### 4.4 · 04 Ablauf · `#so-funktionierts` (walkthrough, pin 1)

**Intention:** three steps, understood at a glance, shown with real SOMA components and real data.

**Surface:** Stone (`bg-surface-stone`). Secondary text is umber-deep (4.7:1); never umber (3.8:1).

**Data:**
- `showcaseResult()` (the existing helper in the current home page: one live search in the first launch city);
- `getPublicTerms()`;
- `listCityPostalExamples()`.

**Full tier composition (1440):**
```
 04 · SO FUNKTIONIERT’S
 Drei Schritte. Kein Weg.                             display-m (in flow, above the pin; roman)
 ┌ steps (cols 1–5), each block min-height 80svh ┐  ┌ sticky stage (cols 7–12), top: header + 40, height 100svh − 148 ┐
 │ ▌01                       type-numeric          │  │        ╭──── outline arch 519 × 649, 1.5 px ink ──────╮      │
 │ ▌Entdecken                heading-l             │  │        │   (vignette for the active step,             │      │
 │ ▌Finde deine Behandlung.  lead                  │  │        │    360 px wide, below the springline)        │      │
 │ ▌PLZ, Behandlung, Zeitraum: … Anfahrt.  body    │  │        ╰──────────────────────────────────────────────╯      │
 │                                                 │  │        Vorschau · Demo-Daten   (caption, demo mode)           │
 │  02 Buchen …                                    │  │                                                               │
 │  03 Bleiben …                                   │  │  step 3: the pair replaces the outline                       │
 └─────────────────────────────────────────────────┘  └───────────────────────────────────────────────────────────────┘
 [Freie Termine finden]  (primary, Espresso)                                  Weiter: Dein Ort ↓
```

- **Active step:**
  - the step block crossing the viewport's centre line (one `IntersectionObserver`, `rootMargin: "-50% 0px -50% 0px"`);
  - the active block shows a 2 px ink rule at its left (220 ms `ease-standard`);
  - all steps keep full contrast.
- **The outline:** Espresso, 1.5 px (guidelines § 5.1 allows Espresso 1.5 px or `line-mid` 1 px; `line-mid` would vanish on Stone).
- **Stage vignettes** (`aria-hidden="true"` and `inert`; real kit components, no buttons):
  1. **Entdecken:**
     - a Paper card (radius 16, `shadow-float`) with the entry in its filled state: chips „{10115} {Berlin}“, „Massage ✓“, „Morgen“;
     - one real result card under it: `Portrait` O-oval 56, name (`type-title-serif`), „Sofort bestätigt“ only if `bookingMode === "instant"`, Endpreis „{54 €} inkl. Anfahrt“, two real slot chips („Do. 18:30“);
     - a second result card 16 px lower and to the right, behind it.
  2. **Buchen:**
     - one card: „Wo findet dein Termin statt?“ (the product's checkout heading, `BRAND_VOICE` § 7.4) with a segmented control *Zuhause ✓ · Hotel · Büro*;
     - a 4-slot `TimeSlots` row, one slot selected;
     - an Endpreis line „Endpreis inkl. Anfahrt · {54 €}“ (`type-numeric` 28);
     - „Kostenlos stornierbar bis {Mi., 18:30 Uhr}“, computed from the slot and `terms.cancellationPolicy`.
     - The checkout button is **not** shown: no fake actions.
  3. **Bleiben:** the outline fades, and **the signature appears: the offset pair and its Ortszeile** (guidelines § 10.2, the page's only pair). Its content is "one evening in two moments", exactly the signature's own example.
     - Geometry: two equal 4:5 arches, 303 × 379 at 1440 (stage 628 = 2 × 303 + a gap of 21, i.e. 7 % of the arch width). The right arch drops by 18 % of its width (55 px).
     - Left arch, the earlier moment: `editorial/arrival-v2.jpg` @ `58% 50%`, the Profi at the door with the kit.
     - Right arch: `editorial/after-v2.jpg` @ **`12% 50%`**. The stored focal `35% 50%` cuts the customer's face; verified in `crops-ablauf-pair.jpg`.
     - Ortszeile under the **left** arch, left-aligned to its edge: „Wohnungstür, 4. OG · Berlin-Prenzlauer Berg · 19:25“. The two arches show two different places (door and sofa), so the right arch carries „Sofa, danach · Berlin-Prenzlauer Berg · 20:10“ under its own edge (§ 10.2 allows this).
     - A Start-Code card (240 px) overlaps **the right arch's lower part**, the only overlap the signature allows: „Start-Code“ (caption) and four digit tiles {4827}.
     - Never: offset the left arch lower, change the 18 %, nest or overlap the arches, or put the headline inside the pair.
- **Fallback when `showcaseResult()` returns `null`:** vignettes 1–2 show the entry chips and an Endpreis line without a provider (the pattern of today's `StepBook` fallback).
- **Honesty:** in `DEMO_MODE` the caption „Vorschau · Demo-Daten“ (✎) sits under the stage; in production ✎ „Vorschau“. Demo digits are never presented as real.
- **Stage motion:**
  - outgoing vignette: opacity 160 ms `ease-exit`;
  - incoming: opacity and a 10 px rise, 320 ms `ease-arrive`; its inner cards follow with a 60 ms stagger (≤ 4);
  - step 3: the outline fades out in 220 ms; the pair arches rise (640 ms `ease-arrive`, left first, 90 ms stagger; photos settle in 900 ms); the Ortszeile rises 8 px (480 ms, from 480 ms); the Start-Code card rises 12 px (480 ms, starting at 480 ms); its digits rise with the brand's 90 ms stagger.
  - The stage's outline draws in when the chapter enters (`stroke-dashoffset`, 640 ms).
- **Short viewports (≤ 820 px):** the outline is 0.72 × the stage height wide; the vignette scales to the outline width minus 48, never below 300 px.

**Lite tier (≤ 1023 or coarse pointer) and the 390 composition:**
```
 04 · SO FUNKTIONIERT’S
 Drei Schritte. Kein Weg.
 [01 Entdecken][02 Buchen][03 Bleiben]     ← step buttons, segmented style, 44 px, aria-current="step"
 ┌ horizontal snap row, 3 panels at 100 % width ───────┐
 │ Paper vignette (the same components, 350 wide)       │
 │ 01 · Entdecken (heading-l) · line (lead) · detail    │
 └──────────────────────────────────────────────────────┘
 [Freie Termine finden]
```
- Panels are `<li>` in an `<ol>`. The buttons scroll the row (`scrollTo`, smooth unless reduced) and mirror its position (an `IntersectionObserver` on the panels).
- Panel 3: the pair at 169 × 211 each (gap 12, right arch 30 px lower; both ≥ 120 px wide), the Ortszeile under the left arch, and the Start-Code card overlapping the right arch's lower part.
- **No-JS:** the buttons are anchor links to `#schritt-1…3`; the native snap row still works.

**CTA:** „Freie Termine finden“ → `#termin` (opens booking access, § 5.5).

### 4.5 · 05 Dein Ort · `#dein-ort` (experience sequence, pin 2)

**Intention:** the benefits of being at home, told in pictures. No numbers, no availability promises (deck § 05 truth guard).

**Surface:** night scope (`data-theme="night"`). Bone text 13.9:1, muted text `#BFB4A7` 7.8:1, Bone focus ring. **The page's one night band.**

**Structure, full tier:**
1. **Dusk spacer** („Abend“), 32svh: its `background-color` runs Stone → Espresso, scroll-linked over `entry 0% entry 100%`. The Stone chapter above seems to darken into evening.
2. **Header in flow:** „05 · Bei dir“ and the headline „Nach der Massage: schon zu Hause.“ (`display-l`, roman, Bone, cols 1–8). Padding-bottom 64.
3. **Pinned stage:**
   - wrapper `height: calc(6 * 50svh + 100svh)`; inner `position: sticky; top: 0; height: 100svh`;
   - the header overlays in its dark variant.
```
 1440 × 900 stage
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │                                                 ╭────── arch 519 × 649 ──────╮ │  cols 7–11, crown at y 120
 │  03 / 06          (label, night-muted)          │                            │ │
 │                                                 │   experience image (step)  │ │
 │  Deine Adresse sieht nur dein Profi –           │                            │ │
 │  und erst nach der Bestätigung.  display-s Bone │                            │ │
 │  (cols 1–5, aligned to the arch springline)     ╰────────────────────────────╯ │
 │                                                 ALTBAU, 3. OG · BERLIN-… · 19:30│
 │  [Freie Termine finden]  (primary → Bone fill in the night scope)               │
 └───────────────────────────────────────────────────────────────────────────────┘
```
4. **Dawn spacer** („Morgen“), 32svh, Espresso → Bone, into chapter 06.

**Sequence (deck § 05, verbatim lines and Ortszeilen):**

| Step | Theme | Image | Crop in the 4:5 arch |
|---|---|---|---|
| 1 | Time saved: „Die Stunde gehört der Behandlung. Nicht dem Weg dorthin.“ | `landing/experience-time.jpg` | **78% 50%** (customer and the Profi's hands; at 62 % the Profi is cut) |
| 2 | Comfort: „Dein Sofa. Deine Decke. Dein Licht.“ | `landing/experience-comfort.jpg` | native 4:5, `45% 55%` |
| 3 | Privacy: „Deine Adresse sieht nur dein Profi – und erst nach der Bestätigung.“ | `landing/experience-privacy.jpg` | native |
| 4 | Quality: „Geprüft, bevor es klingelt.“ and the small note | `landing/experience-quality.jpg` | native |
| 5 | Choice: „Du wählst die Person, nicht nur die Uhrzeit.“ | `landing/experience-choice.jpg` | **88% 50%** (the guest and the Profi setting up). ⚠ The Profi is barefoot (retouch, § 12.3). Do not swap in `hotel-v2`: it is the hero's hotel image. |
| 6 | Flexible: „Morgens, nachmittags oder abends – du suchst nach deiner Zeit.“ | `landing/experience-flexible.jpg` | **62% 50%** (both people; the marked laptop lid is cropped out) |

All crops are verified in `crops-experience.jpg`. `sizes="(min-width: 1440px) 519px, (min-width: 1024px) 36vw, 86vw"`.

**Step logic:**
- `step = clamp(1, 6, floor(p * 6) + 1)`, where `p` is the pin progress (0–1), with ±3 % hysteresis.
- Changes are **triggered** transitions, never scrubbed:
  - the new image rises into the arch: `inset(100% 0 0 0) → inset(0)`, 640 ms `ease-arrive`; photo settle 900 ms;
  - the line: out 160 ms `ease-exit`, in with a 10 px rise, 320 ms `ease-arrive` from 160 ms;
  - the counter changes instantly;
  - the Ortszeile crossfades in 220 ms.
- Nothing queues: a newer step replaces a running one.
- **Semantics:** the six steps are one `<ol>`. Each `<li>` holds a `<figure>`: the image with alt text, and a `<figcaption>` with the line (`<p>`, the view's one serif statement) and the Ortszeile. The lines are not headings (§ 3.1).
  - In the pinned layout, inactive items are `opacity: 0; pointer-events: none`, but stay in the accessibility tree in order.
  - Step 1's line arrives only when the stage becomes pinned (`data-scene-state="active"`). Until then the chapter headline above can still be in view, and two serif lines must not share a view.
  - The counter is `aria-hidden`.

**Lite and none (and every width < 1024):**
- no spacers' colour motion (the spacers become 0 px; hard edges);
- the `<ol>` renders as a vertical photo essay on Espresso;
- each item: a 4:5 arch at 86 % width, alternately left- and right-aligned (the contrapposto shift in a vertical stack), the Ortszeile under it, the line in `display-s` (28 px) with ≤ 16 ch, 56 px between items;
- arch rise on entry (lite); static (none).

**End:** the chapter foot „Freie Termine finden“ → `#termin` and ✎ „Weiter: Profis“.

### 4.6 · 06 Profis · `#profis`

**Intention:** the human side, with real data only.

**Data:** `listDiscoveryProviders({ limit: 8 })`: `status = 'approved'` only, ordered by the existing rating formula, with the 3-reviews-first sort kept from today's home.

**Composition at 1440:**
- Header on cols 1–7: „06 · Die Profis“; „Wer bei dir klingelt.“ (`display-m`); the supporting line.
- `Rail` arrows (44 px) at the right of the header.
- Rail: `perView = 4`, each card 3 columns (302 px).

**Card** (`landing/profis/provider-card.tsx`, a link to `/profis/{slug}`):
- O-oval portrait 302 × 329 (`Portrait shape="oval"`, `sizes="(min-width: 1024px) 22vw, 64vw"`);
- name (`type-title-serif`) and `VerifiedBadge` (justified: only approved providers are listed, and approval means the documents were checked);
- categories (≤ 2) · city (`body-s`);
- „Sofort bestätigt“ when true;
- `Rating` **only when `ratingCount ≥ 3`**, otherwise nothing (deck: shown only when reviews exist). The landing does not show „Neu auf SOMA“;
- in `DEMO_MODE` a caption „Demo-Profil · Foto KI-generiert“ under each card's meta (product rule).
- **States:** hover lifts 2 px with `shadow-float` (220 ms, pointer only); pressed 0.99; focus ring on the card.

**Motion:** the ovals rise in on first view (the arch-rise pattern on the oval: inset bottom-up, 640 ms; stagger 90 ms, ≤ 4 visible).

**390:** card width 64 % (≈ 224 px, oval 224 × 244), snap, peek.

**Fallback** (no approved providers; deck § 06):
- no faces;
- `editorial/details-v2.jpg` in a 4:5 arch (cols 1–5, `50% 50%`) with the Ortszeile „Was mitkommt“;
- the deck's fallback body on cols 7–12;
- CTA „Freie Termine finden“.

**Never:** invented names, testimonials, counts or badges.

**Links:** the deck's „Selbst Profi?“ → `#fuer-profis` and ✎ „Weiter: Deine Buchung“.

### 4.7 · 07 Deine Buchung · `#deine-buchung` (app showcase)

**Intention:** the product, shown truthfully. A web app: no store badges, no device brand, no unreleased features (deck § 07 "Do not show").

**Surface:** Linen (`bg-surface-sunken`).

**Composition at 1440:**
```
 07 · DEINE BUCHUNG
 Wer kommt. Wann. Was es kostet.                  ┌ cols 8–11: the floating screen ┐
 Alles an einem Ort.               display-m      │  360 × 760, radius 40,          │
 SOMA läuft im Browser … in deiner Buchung.       │  Paper, 1 px hairline,          │
 ┌ vertical tablist (cols 1–5), 6 rows ┐          │  shadow-overlay;                │
 │ ▌Endpreis                            │          │  real screenshot, translated    │
 │  Inklusive Anfahrt, bevor du buchst. │          │  to the callout's region;       │
 │  Stornofrist                         │          │  1.5 px ink ring (radius 12)    │
 │  Start-Code                          │          │  marks the region                │
 │  Kalender                            │          └──────────────────────────────────┘
 │  Erneut buchen                       │                Live-App · Demo-Daten  (caption)
 │  Favoriten                           │
 └──────────────────────────────────────┘
 [Freie Termine finden]
```

- **The screen is shown without a device frame** ("Bildschirm ohne Gerät"). It is calmer than a phone mockup and avoids imitating any manufacturer's hardware. Screens are straight, never tilted.
- **Callout → screen → region** (the screens are captured from the live demo app, asset A4, § 12.2):

| Tab (deck § 07) | Line | Screen | Region |
|---|---|---|---|
| Endpreis | Inklusive Anfahrt, bevor du buchst. | `screens/suche` | the first result's price |
| Stornofrist | Mit Datum und Uhrzeit, nicht im Kleingedruckten. | `screens/buchung` | the cancellation line |
| Start-Code | Vier Ziffern, mit denen dein Termin beginnt. | `screens/buchung` | the Start-Code block |
| Kalender | Dein Termin mit einem Tipp im Kalender. | `screens/buchung` | „Zum Kalender hinzufügen“ |
| Erneut buchen | Profi und Behandlung sind schon gewählt – du wählst nur die Uhrzeit. | `screens/termine` | the past booking's „Erneut buchen“ |
| Favoriten | Deine Profis, gespeichert für das nächste Mal. | `screens/favoriten` | the list |

- **Tabs:**
  - `role="tablist" aria-orientation="vertical"`; roving `tabindex`; arrows, Home and End; activation on focus.
  - Each tab: title (`heading-m`) and line (`body-s`).
  - Selected: Paper fill, a 2 px ink left bar (220 ms), `shadow-raised`.
  - The tabpanel is the screen figure, `aria-labelledby` the active tab. Its alt text ✎ describes the region, for example „Ausschnitt aus der Buchung: der Start-Code“, never with demo values.
- **Motion:**
  - a new screen file crossfades in 220 ms `ease-standard`;
  - the translate to the region takes 480 ms `ease-arrive`;
  - the region ring fades in over 160 ms, starting at 320 ms.
  - Lite: 320 ms translate. None: instant.
  - No autoplay; the screen is not scrollable by wheel (`overflow: hidden`).
- **Oxblood:** the screenshots contain the product's own Oxblood buttons. That counts as this view's one Oxblood moment, so the chapter CTA is primary (Espresso).
- **390:**
  - screen 280 × 606, centred;
  - the six tabs become a horizontal tablist (snap chips, 44 px) under it;
  - the active line under the chips; CTA.
- **Copy:** deck § 07. The caption ✎ „Live-App · Demo-Daten“ (production: ✎ „Live-App“).

### 4.8 · 08 Für Profis · `#fuer-profis`

**Intention:** win independent Profis, with no income claims.

**Data:**
- `getProviderTerms().commission` (falls back to the defaults used on `/fuer-profis`);
- `getPublicTerms().payoutHoldHours`.

**Desktop band (≥ 1024):**
- full bleed; `height: min(100svh, 56.25vw)` (16:9, so no crop at ≤ 16:9 viewports);
- `editorial/provider-cta-v2.jpg` @ `68% 50%`, `sizes="100vw"`;
- `data-header-theme="dark"`.
```
 ┌ 1440 × 810 band ─────────────────────────────────────────────────────────────┐
 │ 08 · SOMA FÜR PROFIS                                                          │
 │ Dein Können.           display-l Bone, cols 1–5 (≤ 41 % of the band width)    │
 │ Deine Preise.                                                                 │
 │ Deine Zeiten.                   [the Profi climbs the stairs, right 60 %]     │
 │ SOMA macht dich … Stornofristen.   body-l Bone-muted, ≤ 26 ch, cols 1–4 (≤ 35 %) │
 │ [Profi werden]  [Konditionen ansehen]   (night-scope buttons)                 │
 │ TREPPENHAUS, 2. OG · BERLIN-NEUKÖLLN · 17:40                                  │
 └───────────────────────────────────────────────────────────────────────────────┘
```
- **Contrast** (measured, max-pooled): the band's left 31 % gives Bone ≥ 12:1; 31–43 % gives ≥ 4.7:1. Hence: the headline may reach 41 %; body copy, CTAs and the Ortszeile stay within 35 %.
  - At ≥ 1440 the text keeps the container's columns; at 1920 the supporting text ends at about 36 % (worst case 4.7:1).
- The band's text block carries `data-theme="night"`: Bone primary button with Espresso label, Bone secondary ring, Bone focus ring.
- **Under the band, on Bone:**
  - the five benefits (deck § 08 titles and lines) as a 5-column row at ≥ 1280, 3 + 2 at 768–1279, one column on mobile;
  - each benefit: a 1 px `line` top rule, then the title (`heading-m`) and the line (`body-s`). No icons (the brand rules out feature-icon grids);
  - then a hairline and the **commission strip**, data-bound: „Keine Grundgebühr · {20 %} bei neuer Kundschaft über SOMA · {12 %} bei Stammkundschaft · {5 %} mit deinem Einladungslink · 0 % auf die Anfahrt“ (`label-s num`, wraps at " · ");
  - then the **payment line** (`body-s`).
- **Motion:** the band photo settles on entry (1.04 → 1, 900 ms); the headline clauses arrive (640 ms, 90 ms stagger). No mask: the one band with no arch, for variety.
- **< 1024:**
  - `landing/app-pro.jpg` (native 4:5, `50% 50%`) in a full-width arch with the Ortszeile above;
  - the text on Bone in ink;
  - CTAs stacked full width (52 px);
  - then benefits, strip and payment line.
- **CTAs:**
  - **Profi werden** → `/pro/registrieren` (`routes.pro.onboarding()`; the strategist's "Profi" replaces the brief's "Professional werden");
  - **Konditionen ansehen** → `/fuer-profis#provision` (the `id="provision"` exists).
- **Never:** income figures, "verdiene bis zu …", "Wir bringen die Kundschaft".

### 4.9 · 09 Fragen · `#fragen`

**Intention:** practical answers that are true to the product.

**Data:** the copy deck § 09 answers 1–9 (6 core and 3 recommended), each value bound to data (`terms.cancellationPolicy`, `disputeWindowHours`, `baseRequiredDocuments`, `customerServiceFeeCents`, active cities). Conversion builds `faq-data.ts` and the FAQPage JSON-LD from exactly these visible strings.

**Composition at 1440:**
- **Left, cols 1–4,** `position: sticky; top: header + 48`:
  - „09 · Fragen & Antworten“; „Antworten, bevor du fragst.“ (`display-m`, roman);
  - the **trust strip** as four stacked fact rows (Check in a success-soft circle and the fact, `label`; no badges);
  - links „Alle Fragen und Antworten“ → `/hilfe` and „Stornobedingungen“ → `/stornierung`.
- **Right, cols 6–12:** the accordion on Bone, **no card**, 1 px `line` dividers.
  - Native `<details>`/`<summary>`; summary rows ≥ 72 px, the question in `heading-m` inside an `<h3>`.
  - `ChevronDown` 20 px on the right (ink); answer `body` ink-muted, ≤ 64 ch.
  - Multiple items may be open. Find-in-page works because answers stay in the DOM.
- **Motion** (`MOTION.md` § 3.5): height and opacity 320 ms `ease-standard` (via `::details-content`, as in today's `FaqList`); the chevron rotates 180° in 220 ms, the system's only rotation. Today's `FaqList` uses a plus that turns 45°; the landing follows `MOTION.md`. Reduced motion: instant.
- **390:** header, trust strip, accordion (all nine questions; no `mobileLimit`), links.

### 4.10 · 10 SOMA · `#soma` (final brand moment)

**Surface:** `data-theme="oxblood"` (Bone ink and actions, oxblood-200 secondary text at 6.2:1).
- `min-height: 100svh` (desktop), `88svh` (mobile); `data-header-theme="dark"`.

**Composition at 1440 (centred stack; the stacked lockup, then the tagline):**
```
                    ◯           the mark: S im O, line cut, Bone, 112 px tall (≥ 32 px ⇒ line cut)
                   (S)          drawn on: the O traces from the left springline over the crown (the arch half), then closes
                   ↓ 0.43 × cap height of the wordmark (lockup clear space, from soma-lockup-stacked.svg)
                 S O M A        display wordmark (SVG, display master), cap height 40 px; mark + wordmark = the stacked lockup
                   ↓ 24
                  ───           40 px Bone rule (the lockup reveal's rule)
                   ↓ 24
              Your body.        display-l italic, Bone, 2 forced lines (lang="en"): the bookend of the page's one italic
              Your place.
                   ↓ 24
        Du bleibst. Dein Profi kommt.      lead, oxblood-200, roman
                   ↓ 40
   [Freie Termine finden]   [Profi werden]     accent (Bone fill, Oxblood label) · secondary (Bone ring), 52 px
```
- **Logo rules (v1.1):**
  - the mark and the wordmark appear only as the **stacked lockup**: proportions and spacing from `brand/assets/logo/final/soma-lockup-stacked.svg`, never side by side;
  - **nothing sits inside an arch**: by the time the mark draws, the Oxblood mask is square (k = 0), so no arch shape is visible;
  - "one logo per view": while ≥ 30 % of this chapter is in view, the header's micro wordmark fades out (160 ms) and returns when it leaves;
  - the footer may repeat the micro wordmark.
- **Heading:** `<h2>` with the visible lockup (`role="img" aria-label="SOMA"`), followed by the tagline spans (`lang="en"`). Accessible text: "SOMA. Your body. Your place."
- **Transition in (full):** an **Oxblood arch mask** opens from the bottom centre to full bleed.
  - Start: width 24vw, min 200 px; crown at 40 % of the section height.
  - End: k = 0, square, full bleed.
  - `animation-range: entry 0% entry 60%`.
  - Lite and none: a hard edge Bone → Oxblood.
- **The brand sequence**, triggered once when the band is ≥ 40 % visible and the mask is complete. It chains brand animation 2, „the mark draws on (S in O)“ (`MOTION.md` § 3.6.2), with brand animation 3, the wordmark lockup reveal (§ 3.6.3):

| t (ms) | Element | Motion |
|---|---|---|
| 0–640 | O contour of the mark | `stroke-dashoffset 1 → 0`, `ease-arrive`; path start at the left springline, clockwise over the crown |
| 320–960 | S contour | stroke draw inside the O |
| 960–1180 | Ring and S | fill in together (220 ms); contours fade out |
| 1180–1660 | Wordmark | settles as one shape: opacity and 8 px, 480 ms `ease-arrive` |
| 1340–1660 | Rule | grows 0 → 40 px (`scaleX`, origin centre), 320 ms |
| 1500–1980 | Tagline, then the German line | clause arrival (90 ms stagger) |

  - The mark alone is 1.2 s, as the brand defines it. The CTAs are interactive from the first frame and never wait. It plays once per page view and never loops.
  - ⚠ `MOTION.md` § 3.6.2 lists the splash, video end frames and the social avatar intro as uses. The art-direction input assigns the draw-on to this band, which is the page's end frame. If the Lead or the Digital Art Director disagree, drop rows 1–3 (the mark appears with the wordmark settle) and keep animation 3.
  - Lite: the same sequence (it runs once and is cheap). None: the final frame.
- **CTAs:**
  - **Freie Termine finden** → `/suche`, with `?plz={stored PLZ}` when `localStorage["soma:last-plz"]` holds one (deck § 10);
  - **Profi werden** → `/pro/registrieren`.

**390:** the mark 72 px (line cut), wordmark cap height 32 px (the display master's minimum), tagline 38 px, CTAs stacked full width.

**Footer** (the existing `SiteFooter`, Linen; deck footer columns and base line):
- Additions:
  - the base row gets the line „Bilder: KI-generierte Entwicklungsassets“ (art-direction input § 3.7);
  - on mobile, `padding-bottom: calc(56px + 24px + env(safe-area-inset-bottom))`, so the dock never covers the legal row.
- The Oxblood → Linen edge is hard.

---

## 5. Navigation mechanics

### 5.1 Chapters, names, anchors

| N | id | Nav name | `data-tone` | `data-header-theme` |
|---|---|---|---|---|
| 01 | `bei-dir` (entry: `termin`) | Bei dir | bone | light |
| 02 | `idee` | Idee | bone | light |
| 03 | `behandlungen` | Behandlungen | bone | light |
| 04 | `so-funktionierts` | Ablauf | stone | light |
| 05 | `dein-ort` | Dein Ort | night | dark |
| 06 | `profis` | Profis | bone | light |
| 07 | `deine-buchung` | Deine Buchung | linen | light |
| 08 | `fuer-profis` | Für Profis | photo → bone (the band declares dark) | dark / light |
| 09 | `fragen` | Fragen | bone | light |
| 10 | `soma` | SOMA | oxblood | dark |

- **URLs:** `/#{id}`. The hash is never rewritten on passive scroll.
  - On explicit jumps (index, chapter foot, header links) `MotionRoot` already pushes the hash and focuses the target.
  - On the landing, focus goes to the chapter's `<h2>` (`tabIndex={-1}`), not the section.
- **Deep links** such as `/?plz=10435#termin` prefill the entry (existing behaviour).
- **The index source of truth** is `landing/nav/chapters.ts`: `{ n, id, name, tone, headerTheme }[]`.

### 5.2 Desktop header (≥ 1024): `LandingHeader`

- **Height** 68 px; `position: sticky; top: 0`; **it never hides on desktop**, because booking access is persistent.
- **Layout:** [micro wordmark 18 px] · 32 px · [chapter index] ····· [≥ 1280: Behandlungen · So funktioniert’s · Für Profis · Hilfe] · hairline · [Anmelden (ghost)] · [**Termin finden** (primary)].
  - 1024–1279: the four links move into the overlay, and a „Menü“ button appears.
  - „So funktioniert’s“ → `#so-funktionierts`; the others are routes.
- **Chapter index button:**
  - a pill, 40 px tall (44 px hit area), hover Linen;
  - content: `<span class="sr-only">Kapitel</span>`, the index arch (16 × 20), then ten `<span data-chapter-label="NN">NN Name</span>`;
  - CSS shows only `html[data-chapter-active="NN"] [data-chapter-label="NN"]`. Hidden labels are `display: none`, so the accessible name is always "Kapitel 03 Behandlungen" (label in name, WCAG 2.5.3) and no React state is needed;
  - without JS it reads „Kapitel“;
  - it opens the chapter overlay.
- **Themes:**
  - top of page: transparent;
  - after 8 px of scroll: `glass-strong` (Paper 92 %, blur) with a 1 px `line` hairline (the existing pattern);
  - over a section that declares `data-header-theme="dark"`: `rgb(37 33 31 / .78)` with blur 18 px, a hairline `rgb(243 239 232 / .08)`, Bone ink, and a **Bone** CTA with Espresso label;
  - the colour change takes 160 ms `ease-standard`;
  - detection: one `IntersectionObserver` with a strip at the header's height (`rootMargin: "0px 0px calc(-100% + var(--header-height)) 0px"`) writes `html[data-header-theme]`.

### 5.3 Mobile and tablet header (< 1024)

- **Layout:** 60 px (68 from 768); micro wordmark 15 px; a menu button on the right (`IconButton`, 44 px) that opens the same overlay.
- **No booking button here:** the dock carries it.
- **Hide on scroll:** after 400 px of scroll down it slides up (−100 %, 220 ms `ease-exit`); it returns on any upward scroll ≥ 8 px (220 ms `ease-arrive`).
  - It never hides while focus is inside it or an overlay is open.
  - Reduced motion: never hides (`MOTION.md` § 4).

### 5.4 Chapter overlay („Kapitel“): `ChapterOverlay`

- **Element:** `<dialog>` opened with `showModal()`: top layer, focus trap, Esc, focus returns to the trigger, page inert. Solid Bone surface (no glass over a busy page).
```
 desktop                                                     mobile
 SOMA                                       [Schließen ×]    SOMA                         [×]
 KAPITEL (h2, eyebrow)            SEITEN (h2, eyebrow) ✎     KAPITEL
 01  Bei dir                       Behandlungen               01 Bei dir          (heading-l 20, 52 px rows)
 02  Idee                          Städte                     …
 03  Behandlungen  ⌒  ← current    Für Profis                 10 SOMA
 …   (heading-l 24, 56 px rows)    Hilfe                      SEITEN · Behandlungen · Städte · Für Profis · Hilfe
 10  SOMA                          Anmelden / Mein Konto      [Termin finden]  [Anmelden]
                                   [Termin finden]            Your body. Your place.   (accent italic, muted)
                         Your body. Your place.
```
- **Chapter links:**
  - `<nav aria-label="Kapitel">` with an `<ol>` of `<a href="#id">`;
  - names in the sans (`type-heading-l`), because navigation is always sans; numbers `type-label num`;
  - the current one has `aria-current="location"` (read from `html[data-chapter-active]` when the dialog opens) and the 14 × 7 arch mark;
  - activation closes the dialog, jumps, and focuses the chapter `<h2>`.
- **„Termin finden“** here closes the overlay and opens booking access (§ 5.5).
- **Account label:** from `useSiteSession()`; „Anmelden“, „Mein Konto“ or „SOMA Pro“ (existing helpers).
- **Motion:**
  - the dialog fades in 220 ms;
  - rows rise 10 px, 320 ms `ease-arrive`, with a 60 ms stagger for the first 6 rows; rows 7–10 start with row 6;
  - exit: 160 ms fade.
  - Reduced motion: 160 ms fade only.

### 5.5 Booking access, always one action away

| Where | Trigger | Behaviour |
|---|---|---|
| Desktop | Header „Termin finden“ (`<a href="#termin">`, enhanced) | If the hero entry is ≥ 25 % in view: focus its PLZ field (no scroll, no overlay). Otherwise open the **`BookingBar`**: a dialog under the header, full content width, Paper, `shadow-overlay`, radius 0 0 24 24, padding 24 / 48, holding `BookingEntry` (the pill variant, its own id `termin-leiste`), `RebookRow` when present, and a close button. Backdrop 48 %. Entry: rises 8 px with a fade, 320 ms `ease-arrive`. Exit: 220 ms. Focus goes to PLZ. Esc closes and focus returns to the trigger. |
| < 1024 | Dock „Termin finden“ | Opens the **`BookingSheet`** (bottom sheet, radius 24 at the top, 480 ms `ease-arrive`, drag to dismiss). It holds the stacked entry. ⚠ *Was?* and *Wann?* expand **inline inside the sheet** (a disclosure), never as a second sheet on top. |
| In chapters | „Freie Termine finden“ in 04, 05, 06 (fallback), 07 | `href="#termin"`, enhanced to the same `openBooking({ source })` |
| Anywhere | `pickInBookingEntry({ categorySlug })` | Preselects the category in whichever entry is open (existing event) |
| No JS | — | All of these are plain links to `#termin` (the hero entry) |

API (Conversion): `openBooking(detail?: { source: string; categorySlug?: string })`, dispatched as `window` event `soma:booking:open`.

### 5.6 Mobile dock („Schnellzugriff“): `LandingDock`, < 1024 only

- **Geometry:**
  - fixed; `left: 12px; right: 12px; bottom: max(12px, env(safe-area-inset-bottom))`;
  - 56 px tall, pill;
  - `glass-strong`, `shadow-float`; on dark sections the night glass with a Bone CTA.
- **Left half:** a button that opens the chapter overlay. It shows the index arch and the current chapter label (same CSS-label technique, truncating), with a 48 px hit area.
- **Right half:** **Termin finden** (primary, 48 px) → `BookingSheet`.
- **Hidden** (`html[data-dock="hidden"]`) while:
  - the hero booking card is ≥ 25 % in view;
  - chapter 10's CTAs are ≥ 30 % in view;
  - a text input, select or textarea has focus (the virtual keyboard);
  - any dialog or sheet is open.
- **Show / hide:** show is a 24 px rise with a fade, 320 ms `ease-arrive`; hide is 220 ms `ease-exit`. Reduced motion: 160 ms opacity.
- **DOM position:** directly after the header, before `<main>` (`<nav aria-label="Schnellzugriff">`), so keyboard and screen-reader users meet it early. Visually it is fixed at the bottom.

### 5.7 Chapter foot (hand-off)

- **Where:** at the end of chapters 02–07.
- **Layout:** a 1 px `line` rule, then the contextual CTA from the deck on the left (if any) and ✎ „Weiter: {next name}“ with `ArrowDown` 16 px on the right (→ `#next-id`). Type `type-label`, underlined link style, 44 px target.
- **390:** stacked, the "Weiter" link full width.
- **Screen readers:** the link text names the next chapter. No extra live region.

### 5.8 Keyboard and screen-reader summary

**Skip links** (first in the DOM, visible on focus):
- „Zum Inhalt springen“ → `#inhalt` (existing);
- ✎ „Zur Terminsuche springen“ → `#termin`.

**Focus order:** skip links → header → dock (< 1024) → main: hero (radios → link → entry fields → submit) → 02 foot → 03 rows → 04 (step buttons on mobile) → CTAs → 06 cards and arrows → 07 tabs → 08 CTAs → 09 summaries and links → 10 CTAs → footer.

**Pinned scenes** contain no focus traps and no hidden focusables. Space and Page Down move through them natively.

**Live regions:**
- the booking entry's polite status (existing);
- nothing announces passive scrolling;
- chapter jumps move focus to the `<h2>`, which screen readers read.

---

## 6. Buttons, interactive states and the Oxblood plan

### 6.1 States (kit components; no new variants)

| Element | Component | Default | Hover (pointer only) | Pressed | Focus | Disabled / loading |
|---|---|---|---|---|---|---|
| Hero submit, booking bar and sheet submit | `Button variant="accent" size="l"` (52) | Oxblood, Bone label | oxblood-700, 160 ms | oxblood-800, scale 0.98 for 100 ms | 2 px Oxblood ring, 2 px offset | spinner after 300 ms, „Termine werden gesucht …“, `aria-busy` |
| „Termin finden“ (header, dock), chapter CTAs | `primary` (Espresso; Bone inside night/oxblood scopes) | Espresso / Bone label | cocoa (night: white) | espresso-deep, 0.98 | ring (Bone in dark scopes) | — |
| „Konditionen ansehen“, „Profi werden“ in 10 | `secondary` | 1 px control ring | Linen fill (dark scopes: `rgb(243 239 232 / .08)`) | 0.98 | ring | — |
| „Anmelden“ | `ghost` | — | Linen | 0.98 | ring | — |
| Inline links, chapter foot, „So funktioniert’s“ | link style | ink, 1 px `line-strong` underline, 0.2 em offset | Oxblood text and underline | — | ring | — |
| Place switch | text radio | umber-deep | ink | — | ring, 4 px offset | — |
| 03 index row | `<a>` row | — | Linen fill, arrow +2 px | 0.99 | inset ring | — |
| Cards (03 mobile, 06) | `surfaceClasses({ interactive })` | `shadow-raised` | lift 2 px, `shadow-float`, 220 ms | 0.99 | ring | — |
| Rail arrows | `IconButton` secondary, 44 px | — | Linen | 0.98 | ring | disabled at the ends |
| 07 tabs | tab row | — | Linen | — | ring | — |
| FAQ summary | `<summary>` | — | Linen row fill | — | ring | — |

- All targets are ≥ 44 × 44 px. The dock's buttons and the hero submit are 48 and 52 px.

### 6.2 Oxblood across a long page: at most one moment per viewport

| Viewport content | The one Oxblood moment | How the rest is held back |
|---|---|---|
| Hero (all widths) | The entry's submit | Header CTA is Espresso; the dock is hidden while the entry is in view; the place-switch mark is ink |
| 02–04, 06, 08, 09 | None (focus ring and link hover only while interacting) | Chapter CTAs are Espresso; 04's vignettes never show checkout buttons |
| 05 | None (the night scope's accent is Bone) | — |
| 07 | The product's own buttons inside the screenshot | The chapter CTA is Espresso |
| 10 | The band itself | Its CTAs are Bone; the header and dock switch to dark (Bone) variants |
| Booking bar or sheet (its own view; the page is dimmed) | Its submit | — |

- **Never:** Oxblood type on photographs, Oxblood on Espresso, Oxblood on errors.
- The scroll position where the hero entry and chapter 10 could both be visible does not exist (they are about 17 viewports apart).

---

## 7. Section transitions

| Boundary | Transition | Tier |
|---|---|---|
| 01 → 02 | Continuous Bone. The 02 headline clauses arrive. | all (none: static) |
| 02 (inside) | The doorway mask widens (Appendix A). | full; lite: arch rise |
| 02 → 03 | Continuous Bone. The preview arch rises once. | all |
| 03 → 04 | Hard edge Bone → Stone. The stage outline draws (640 ms). | all |
| 04 → 05 | **„Abend“ (dusk):** a 32svh spacer runs Stone → Espresso, scroll-linked. The header switches to dark at the boundary. | full; otherwise a hard edge |
| 05 (inside) | Stepped arch rise per place. | full; lite: rise per item |
| 05 → 06 | **„Morgen“ (dawn):** a 32svh spacer runs Espresso → Bone. | full; otherwise a hard edge |
| 06 → 07 | Hard edge Bone → Linen. | all |
| 07 → 08 | Hard edge Linen → photo band; the band photo settles (900 ms). | all |
| 09 → 10 | **Oxblood arch mask** opens to full bleed; then the mark (S im O) draws on and the lockup reveals. | full; lite: hard edge + the sequence |
| 10 → footer | Hard edge Oxblood → Linen. | all |

**Rules:**
- Animate only `opacity`, `transform`, `clip-path` and (on the spacers only) `background-color`.
- No parallax and no multi-speed layers.
- Nothing scrubbed ever stops halfway on text: text is always triggered.
- No transition delays interaction; nothing locks the scroll.
- **No smooth-scroll library** (no Lenis, no Locomotive): native scrolling only. Anchor jumps use `scrollIntoView({ behavior: "smooth" })` except with reduced motion.

---

## 8. Motion tiers

### 8.1 Tier detection

| Tier | Condition |
|---|---|
| `none` | `prefers-reduced-motion: reduce`, or automation (`navigator.webdriver`) without the QA override |
| `lite` | Not `none`, and any of: `(max-width: 1023px)`, `(pointer: coarse)`, `(hover: none)`, `navigator.connection?.saveData`, `navigator.deviceMemory < 4` |
| `full` | Everything else |

- **Where the tier lives:** `html[data-motion]`, written by `motion/loader.tsx` after hydration.
- **QA override:** `?motion=full|lite|none` (always honoured, also under webdriver, so the auditor can test each tier).
- **Lab tools measure the `none` tier on `/` (audit-2 N-5 / RT-6):** headless Lighthouse and PageSpeed Insights drive the
  browser through automation (`navigator.webdriver`), so a plain `/` gets `none`: no motion runtime, no motion CSS
  states. The tier a visitor gets is measured on `/?motion=lite` (phones, tablets, touch) and `/?motion=full`
  (desktop); quote those for visitor numbers. There is deliberately no measurement-only bypass of the webdriver rule.
- **Upgrade rule:**
  - pinned layouts (04, 05) and the scroll-linked masks apply only under `html[data-motion="full"]`;
  - the loader marks each scene `data-scene-ready` only if the scene's top is **below the viewport** at upgrade time;
  - a scene already in or above the viewport (a deep link, a fast scroller) stays in its lite layout for this page view;
  - so there is no visible layout shift, and no broken pin when JS fails.

### 8.2 What changes per tier

| Feature | full | lite | none |
|---|---|---|---|
| Hero photo settle (1.04 → 1, 900 ms) | ✓ | ✓ | — |
| Hero place swap | arch wipe 640 ms + settle | wipe 480 ms | instant |
| Clause arrival (10 px, 640 ms, 90 ms stagger) | ✓ | 480 ms, stagger ≤ 3 | final |
| Arch rise on images (640 ms + settle 900 ms, Ortszeile 480 ms at 480 ms) | ✓ | 480 ms, no settle | final |
| 02 doorway | scroll-linked mask | arch rise | final |
| 03 | index + preview (fine pointer) | rail | rail / index, instant swap |
| 04 | sticky stage, step transitions | step buttons + snap row | same, no smooth scroll |
| 05 | dusk / dawn + pinned stepped stage | vertical photo essay + rises | vertical, static |
| 07 screen move | 480 ms | 320 ms | instant |
| 08 band | settle + clause arrival | arrival only | final |
| 10 | Oxblood mask + mark draw-on + lockup reveal | hard edge + mark draw-on + lockup reveal | final frame |
| Index arch (progress) | scroll-linked | scroll-linked | scroll-linked, no easing (it is information, not decoration) |
| Header theme | 160 ms | 160 ms | instant |
| Mobile header hide on scroll | n/a | ✓ | off |
| Dock show / hide | 320 / 220 ms | 320 / 220 ms | 160 ms opacity |
| Overlay entrance | fade + rise + stagger | fade + rise | fade 160 ms |
| Smooth anchor scrolling | ✓ | ✓ | off |

**Reveal rules:**
- A reveal never hides an element that is in, or above, the viewport at hydration.
- Hidden states exist only as `[data-reveal-state="pending"]`, set by JS, so without JS everything is visible.
- The global reduced-motion guard (`tokens.css`, `globals.css`) stays. Every scroll-driven rule also lives inside `@media (prefers-reduced-motion: no-preference)`, because the global `animation-duration: 1ms !important` must not touch scroll timelines.

### 8.3 Motion vocabulary (tokens only)

| Name | Definition |
|---|---|
| **Clause arrival** | opacity 0 → 1 and `translate: 0 10px → 0`; 640 ms (`calm`) `ease-arrive`; 90 ms stagger; ≤ 6 units. Units are server-rendered sentences or lines from the copy (a headline's sentences, for example „Drei Schritte.“ / „Kein Weg.“; 02's three lines). Never letters or words. |
| **Arch rise** | `MOTION.md` § 3.6.1: `clip-path: inset(100% 0 0 0) → inset(0)` and `translate: 0 16px → 0`, 640 ms `ease-arrive`; the photo inside settles from scale 1.04 to 1 over 900 ms `ease-settle`; the Ortszeile rises 8 px over 480 ms from 480 ms. Trigger: 15 % visible, once. |
| **Draw** | `stroke-dashoffset 1 → 0`, `pathLength="1"`, 640 ms `ease-arrive`. |
| **Swap** | inner bottom-up inset 480–640 ms `ease-arrive`; text crossfade 160 ms out / 220 ms in. |
| **Durations** | 100 · 160 · 220 · 320 · 480 · 640 · 900. Define 900 as `--lp-reveal: 900ms` locally until the brand adds `--transition-duration-reveal`. |
| **Easings** | `--ease-standard`, `--ease-arrive`, `--ease-settle`, `--ease-exit`, `--ease-calm`; `linear` only for scroll-linked progress. |
| **Never** | bounce, overshoot, springs, parallax, 3D, ambient loops, autoplay, counting numbers, letter-by-letter, typing effects, logo morphs. |

---

## 9. Accessibility behaviour

- **Landmarks:**
  - `header` (banner) with `nav aria-label="Hauptnavigation"`;
  - `nav aria-label="Schnellzugriff"` (dock);
  - `main#inhalt`;
  - every chapter is a `section aria-labelledby="{id}-titel"`;
  - `footer` with `nav aria-label="Fußzeile"`.
- **Headings:**
  - one `h1` (the hero, tagline and German line);
  - one `h2` per chapter 02–10 (the copy-deck headline; in 10 the lockup with "SOMA. Your body. Your place.");
  - `h3` for: 04 step titles, 06 provider names, 08 benefit titles, 09 questions (05's lines are `<figcaption>` statements, 02's lines are `<p>`);
  - no skipped levels.
- **Language:** `lang="de"` on the page; `lang="en"` on every instance of the tagline.
- **Images:**
  - every photo has German alt text describing the scene (✎ texts in § 4 and § 12, written to `PHOTOGRAPHY.md` discretion rules);
  - decorative duplicates are `alt=""` or `aria-hidden`: the 03 preview, the 04 vignettes, the 05 counter;
  - AI labelling: the footer line, the per-portrait demo label, the screen caption.
- **Contrast** (measured or token-computed):

| Pair | Ratio |
|---|---|
| Ink on Bone / Paper / Linen / Stone | 13.9 / 15.2 / 12.9 / 10.4 |
| Umber-deep on Bone / Stone | 6.4 / 4.7 |
| Bone on Espresso | 13.9 |
| Night-muted on Espresso | 7.8 |
| Bone on Oxblood | 10.2 |
| oxblood-200 on Oxblood | 6.2 |
| Bone on the 08 band, left 31 % / 31–43 % | ≥ 12 / ≥ 4.7 (worst block) |

  - **No other text sits on a photograph.** Every Ortszeile except 08's sits under its image on a solid surface.
  - No scrims are needed anywhere. If one ever is: a flat 62 % `--color-scrim`, never a gradient.
- **Focus:** always visible; 2 px Oxblood with 2 px offset (Bone in the night and oxblood scopes). Dialogs trap focus and return it. Chapter jumps focus the `h2`.
- **Targets:** ≥ 44 × 44 px; text never below 12 px; form controls 16 px (no iOS zoom).
- **Reduced motion:** § 8 `none`. No information is carried by motion alone: step changes also change text, selections show the arch mark or a fill plus a check.
- **Booking live region:** the existing polite status, read once, never `describedby`. Unchanged; Conversion owns it.
- **Zoom and reflow:**
  - at 320 px width and at 400 % zoom the layout is the mobile layout;
  - pinned scenes are off (lite);
  - no horizontal page scroll (every grid child gets `min-w-0`).
- **Keyboard parity:** hover previews (03) are also triggered by focus; the swipe (01) has radio buttons; the snap rows (03, 04, 06, 07) have buttons or tabs.

---

## 10. Performance budget

### 10.1 Core Web Vitals targets (Lighthouse mobile, slow 4G; desktop)

| Metric | Mobile | Desktop |
|---|---|---|
| LCP | ≤ 2.5 s (aim 2.0 s) | ≤ 1.2 s |
| CLS | ≤ 0.05 (aim 0.02) | ≤ 0.02 |
| INP | ≤ 200 ms (aim 150 ms) | ≤ 100 ms |
| TBT | ≤ 200 ms | ≤ 100 ms |
| Lighthouse performance score | ≥ 90 | ≥ 95 |

Lighthouse scores for these targets are taken on the visitor tier: `/?motion=lite` (mobile) and `/?motion=full`
(desktop). A plain `/` under Lighthouse or PSI runs the `none` tier (§ 8.1).

### 10.2 LCP element per viewport

- **The hero arch image at every width:** one source, so a single `preload` is correct.
- Neither the text nor the image is hidden at load. The image has no fade or mask; it only settles.
- The H1 is not an LCP risk: no web-font block, `display: swap`, metric-matched fallbacks.
- Target: AVIF ≤ 140 KB at 1280 w, ≤ 110 KB at 1080 w. Achieved by the pre-cropped 4:5 source (A1), which saves about 30 % against serving the full 9:16 `hero-mobile`.

### 10.3 Images (`next/image`, AVIF → WebP via `images.formats`)

| Slot | `sizes` | Max served width | Target weight (AVIF) | Loading |
|---|---|---|---|---|
| 01 hero (zuhause) | § 4.1.2 | 1280 | ≤ 140 KB | `preload` |
| 01 hotel, office | same | 1280 | ≤ 140 KB | prefetch on intent / idle |
| 02 doorway | § 4.2 | 1280 | ≤ 120 KB | lazy |
| 03 preview (desktop) / tiles (mobile) | `519px` / `78vw` | 1080 / 640 | ≤ 90 / ≤ 45 KB | lazy |
| 04 pair | `(min-width: 1024px) 296px, 42vw` | 640 | ≤ 45 KB each | lazy |
| 05 stage × 6 | § 4.5 | 1080 | ≤ 110 KB each | lazy, plus a preload of the next step when a step activates |
| 06 ovals × 8 | `(min-width: 1024px) 22vw, 64vw` | 640 | ≤ 35 KB each | lazy |
| 07 screens × 4 | `(min-width: 1024px) 360px, 280px` | 828 | ≤ 80 KB each | lazy |
| 08 band / app-pro | `100vw` / `calc(100vw - 40px)` | 2048 / 1080 | ≤ 220 / ≤ 90 KB | lazy |

- **Totals:** above the fold ≤ 180 KB of images; a full scroll ≤ 2.4 MB (desktop) and ≤ 1.5 MB (mobile).
- **Quality:** within the `images.qualities` allowlist, which Next 16 requires. If the hero exceeds 140 KB at the default 75, add 60 to the allowlist and use it for the hero only.
- Images load over their category wash. Never a grey box, never a spinner.

### 10.4 JavaScript

- **Route-specific first-load JS** ≤ 90 KB gz, the existing `BookingEntry` included. Server components by default. Client islands: hero place stage, booking wrapper, header, dock, overlay, 03 index, 04 step buttons (lite), 07 tabs, rails.
- **Nav awareness** (active chapter, progress fallback, header theme, dock rules): ≤ 4 KB gz, loaded after hydration in every tier.
- **Motion runtime** (`motion/runtime.ts`: scenes, reveals, pins, tone fallbacks): ≤ 12 KB gz, `import()` after `requestIdleCallback` (timeout 2 s) or the first scroll, in the full and lite tiers only.
- **CSS** for the landing ≤ 18 KB gz. Scroll-driven effects first: `@supports (animation-timeline: view())`.
- **GSAP / ScrollTrigger:** not in v1. The Motion developer may propose it for the full tier only if a scene misses 60 fps or precision on the reference devices. Conditions: dynamic import inside `gsap.matchMedia()`, ≤ 45 KB gz, never in lite or none, and the Lead's approval.
- **`content-visibility: auto`** on chapters 06–09 at every width (`.lp-cv`, the `cv` prop of `Chapter`), and below 1024 also on 02–05 and 10, which have no pins, sticky elements or scroll timelines there (`landing.css`). Never where those run (01–05 and 10 from 1024, and the hero at every width).
  - `contain-intrinsic-size: auto <estimate>`, the estimate being the chapter's measured content height (02–10 at 320–1920 px, fonts loaded; audit-2 RT-1). A chapter that has never rendered is laid out at nearly its real height, so a long jump corrects little when it ends (`lib/scroll-jump.ts`); once rendered, `auto` keeps the real height.

    | Chapter | ≥ 1024 | 768–1023 | < 768 |
    |---|---|---|---|
    | 02 Idee | — | `calc(480px + 114.5vw)` | 1150 |
    | 03 Behandlungen | — | `calc(457px + 50vw)` | 880 |
    | 04 Ablauf | — | `calc(741px + 52.5vw)` | 910 |
    | 05 Dein Ort | — | `calc(1117px + 575vw)` | `calc(1530px + 620vw)` |
    | 06 Profis | 800 | `calc(384px + 45vw)` | 770 |
    | 07 Deine Buchung | 970 | 1125 | 1220 |
    | 08 Für Profis | 1280 | `calc(1098px + 84vw)` | 1920 |
    | 09 Fragen | 660 | 1085 | 1080 |
    | 10 SOMA | — | 900 | 745 |

    Values in px. Sources: the `cv` props in `chapters/06-profis.tsx` … `09-fragen.tsx`, and `landing.css` for 02–05 and 10. A full-page capture (`html[data-capture="full"]`) renders every chapter.

### 10.5 Fonts (already budgeted; brand § 4.2)

- The above-the-fold faces on `/` are **Instrument Sans** and **Newsreader Display Italic**: the hero's first line is italic.
- **Preferred:** preload sans + italic on `/` (2 files, 80 KB) and let the roman load on discovery.
- **Acceptable:** 3 preloaded files, 102 KB, within the 150 KB limit, if per-route preloading is impractical in the root layout.
- ⚠ Frontend picks the mechanism. The Lead approves any root-layout change.

---

## 11. Component inventory and file plan

### 11.1 Routes and ownership (⚠ D8 needs the Lead's approval)

```
src/app/(landing)/layout.tsx      Frontend   skip links · LandingHeader · LandingDock · <RouteTransition as="main" id="inhalt"> · SiteFooter · MotionLoader
src/app/(landing)/page.tsx        Frontend   server data (Promise.all), chapters 01–10; moved from src/app/(site)/page.tsx
src/app/(landing)/landing.css     Frontend   layout utilities (--lp-col, grid spans, sill width)
src/components/landing/
  chapters/                       Frontend   one file per chapter, server components unless noted
    chapter.tsx                   <Chapter n id name tone headerTheme labelledBy className cv?>  → <section data-chapter …>
    01-hero.tsx                   server shell; data in, renders HeroPlaceStage
    02-idee.tsx · 03-behandlungen.tsx · 04-ablauf.tsx · 05-dein-ort.tsx · 06-profis.tsx · 07-deine-buchung.tsx · 08-fuer-profis.tsx · 09-fragen.tsx · 10-soma.tsx
  hero/                           Frontend (client)
    hero-place-stage.tsx          context provider { place, setPlace, places[] }; wraps the hero grid
    place-switch.tsx              radiogroup (§ 4.1.5)
    hero-arch.tsx                 image layers [data-place-layer][data-state] · swipe · prefetch
    places.ts                     { id: "zuhause"|"hotel"|"buero", label, src, focal, alt, place (Ortszeile), citySlug }
  behandlungen/index-list.tsx     Frontend (client)  rows + preview (fine pointer); falls back to Rail + CategoryTile
  ablauf/vignettes.tsx            Frontend (server)  the three vignettes from kit components + data
  ablauf/step-buttons.tsx         Frontend (client)  lite tier controls + snap-row sync
  dein-ort/sequence.tsx           Frontend (server)  the <ol> of six; the stage layout is CSS under [data-motion=full]
  profis/provider-card.tsx        Frontend (server)
  digital/screen-tabs.tsx         Frontend (client)  tablist + floating screen
  digital/screens.ts              Frontend           { id, src, width: 390, height, regions: Record<callout, { y, h }> } (from A4)
  seal/closing-lockup.tsx         Frontend (server)  the stacked lockup as inline SVG: the mark's O and S paths each twice (contour stroke with pathLength=1, and fill),
                                                     the display wordmark, the 40 px rule. Needs the line-cut paths (groups symbol-o, symbol-s) exported from
                                                     brand/logo.tsx, e.g. `export const SYMBOL_PATHS`, plus an outer-O contour path whose start point is the
                                                     left springline (same ellipse as the master) for the trace. The mark is never placed inside an arch.
  primitives/
    landing-arch.tsx              <LandingArch aspect? fill? className>{children}: container + cqw radius
    arch-outline.tsx              SVG from archPath(), pathLength=1, non-scaling stroke
    arch-mark.tsx                 14 × 7 mark
    landing-image.tsx             next/image + tone fallback + focal + data-lcp (no fade)
    ortszeile.tsx                 type-place, segments nowrap
    eyebrow.tsx                   "{NN} · {label}"
    clauses.tsx                   <Clauses parts={[main, em]}> → spans with data-reveal-order
    chapter-foot.tsx              CTA slot + "Weiter: {next}"
    floating-screen.tsx           radius 40 frame, region ring
  nav/                            Frontend (markup, a11y)  ·  Motion (scroll awareness via motion/nav-*.ts)
    chapters.ts                   the 10 chapter definitions (§ 5.1)
    landing-header.tsx · chapter-index.tsx · progress-arch.tsx · chapter-overlay.tsx · landing-dock.tsx
  booking/                        Conversion & Integration
    hero-booking-entry.tsx        BookingEntry wrapper: sill variant, placeHint, popover flip, anchored status
    booking-bar.tsx · booking-sheet.tsx · booking-access.ts (openBooking, soma:booking:open)
    faq-data.ts                   deck § 09 with term bindings
    landing-json-ld.tsx           Organization (slogan), WebSite + SearchAction (/suche?plz=), FAQPage
    metadata.ts                   deck § 0.3 title, description, OG
  motion/                         Motion & Creative Developer
    loader.tsx                    client: tier, overrides, lazy import, data-motion
    tier.ts · nav-observer.ts (active chapter, header theme, dock rules) · progress.ts
    runtime.ts · reveal.ts · scenes/{doorway,walkthrough,stage,tone,seal,band}.ts
    landing-motion.css            every keyframe, transition and scroll timeline of the contract
```

Kit components reused unchanged: `Button`, `ButtonLink`, `IconButton`, `Chip`, `Segmented`, `TimeSlots`, `Portrait`, `Avatar`, `VerifiedBadge`, `Rating`, `Surface`, `Sheet`, `Icon`, `Container`, `Rail`, `CategoryTile`, `BookingEntry`, `RebookRow`, `SiteFooter`, `MotionRoot`, `archPath`, `Wordmark` (micro and display), `Mark`.

### 11.2 Shared primitives: key props

| Primitive | Props | Notes |
|---|---|---|
| `Chapter` | `n: 1…10`, `id`, `name`, `tone: "bone"\|"stone"\|"night"\|"linen"\|"oxblood"`, `headerTheme: "light"\|"dark"`, `labelledBy`, `cv?: { desktop: number; mobile: number }` | Renders `data-chapter`, `data-chapter-name`, `data-tone`, `data-header-theme`, `data-theme` (night/oxblood), padding, `scroll-mt`. |
| `LandingArch` | `aspect?: "4/5"\|"3/4"\|"2/3"\|"fill"`, `mask?: "doorway"\|"seal"`, `children` | `container-type: inline-size`; frame radius `50cqw 50cqw 0 0 / 54.5cqw 54.5cqw 0 0`; `data-arch`. |
| `LandingImage` | `src`, `alt`, `sizes`, `focal?`, `tone`, `lcp?`, `reveal?: "arch"\|"settle"\|false` | Resolves via `resolveImage` / `imageFocal`; `lcp` ⇒ `preload`, no fade, `data-lcp`. |
| `Clauses` | `as`, `className`, `parts: ReactNode[]` (sentences or lines) | Each part is a `<span data-reveal-order={i}>`, roman: no `<em>` on the landing (D10). The heading keeps its full text (no `aria-label` tricks). |
| `ChapterFoot` | `cta?: { label; href; kind }`, `next?: { id; name }` | — |

### 11.3 The motion layer contract (data attributes and custom properties)

**Written by Frontend (static markup):**

| Attribute | On | Values / meaning |
|---|---|---|
| `data-chapter` | `<section>` | `01`…`10` |
| `data-chapter-name` | `<section>` | the nav name |
| `data-tone` | `<section>` | `bone \| stone \| night \| linen \| oxblood` |
| `data-header-theme` | section, or any sub-element (the 08 band) | `light \| dark` |
| `data-scene` | scene root | `hero-place \| doorway \| index-preview \| walkthrough \| stage \| screens \| dusk \| dawn \| band \| seal` |
| `data-stage` | the sticky element of 04 / 05 | — |
| `data-step-trigger` | 04 step blocks | `1…3` |
| `data-step-item` | 04 vignettes, 05 `<li>` | `1…n` |
| `data-reveal` | reveal targets | `clause` (children with `data-reveal-order`) · `arch` · `draw` · `rise` · `fade` · `settle` |
| `data-reveal-order` | reveal units | `0…5` |
| `data-arch` | arch frames | `frame \| outline \| mask` |
| `data-arch-mask` | masked elements | `doorway \| seal` |
| `data-place-layer` | hero image layers | with `data-state="current \| entering \| leaving"` (Frontend sets the state; Motion's CSS animates `entering`) |
| `data-ortszeile` | Ortszeilen | rise with their image |
| `data-progress-arch` | the index glyph's progress path(s) | — |
| `data-chapter-label` | index labels | `01…10` |
| `data-dock-hide` | elements that hide the dock while visible | `0.25` (hero entry) · `0.3` (10 CTAs): the threshold |
| `data-lcp` | the hero image | never animated in |

**Written by Motion (runtime state):**

| Where | State | Meaning |
|---|---|---|
| `html` | `data-motion` | `full \| lite \| none` |
| `html` | `data-chapter-active` | `01…10` |
| `html` | `data-header-theme` | `light \| dark` |
| `html` | `data-header-hidden` | mobile header hidden |
| `html` | `data-dock` | `shown \| hidden` |
| `html` | `--lp-progress` | 0–1; CSS `animation-timeline: scroll(root)` where supported, otherwise rAF-throttled passive scroll |
| scene root | `data-scene-ready` | the upgrade succeeded (§ 8.1) |
| scene root | `data-scene-state` | `idle \| active \| done` |
| scene root | `data-step` | `1…n` |
| scene root | `--lp-scene` | 0–1, the JS fallback for scroll timelines |
| reveal targets | `data-reveal-state` | `pending \| in` (only below-the-fold elements ever get `pending`) |
| mask elements | `--arch-l`, `--arch-r` (`<length>`, cqw), `--arch-t` (`<length-percentage>`), `--arch-k` (`<number>`) | registered with `@property`; Appendix A |

**Events (on `window`):**
- `soma:chapter` `{ n, id, name }`, from Motion, when the active chapter changes;
- `soma:booking:open` `{ source, categorySlug? }`, from anyone, handled by Conversion;
- `soma:booking-entry:set`, the existing `pickInBookingEntry`.

**Separation rule:**
- Frontend never writes the runtime attributes.
- Motion never renders React content and never changes copy.
- Conversion never animates.
- Every CSS rule that animates lives in `motion/landing-motion.css`. Static layout (including the pinned layouts keyed on `[data-motion="full"] [data-scene-ready]`) lives in Frontend's markup and `landing.css`.
- **Note:** `[data-reveal="hidden"|"in"]` and `[data-reveal-stagger]` are already used by `ui/motion.tsx` `Reveal`. The landing never uses `Reveal` and never uses those two values. The global reduced-motion rule `[data-reveal] { opacity: 1 !important; translate: none !important }` also covers our targets, so **never put layout `translate` on an element that carries `data-reveal`**.

### 11.4 Server data for `page.tsx` (one `Promise.all`; every call guarded like today)

`listCatalog()`, `getPriceFloors()`, `listCities()`, `listCityPostalExamples()`, `getPublicTerms()`, `getProviderTerms()`, `listDiscoveryProviders({ limit: 8 })`, `showcaseResult(examplePlz)` (moved from the current page).

- The home FAQ content block (`getHomeFaq`) is replaced by `faq-data.ts`, built from the deck.
- `revalidate = 3600` stays.

---

## 12. Assets

### 12.1 Images per chapter (all AI development assets, labelled; paths canonical under `/images`)

| Ch | Asset | Format | Crop / focal (verified) | Ortszeile |
|---|---|---|---|---|
| 01 | `landing/hero-mobile.jpg` (→ A1) · `editorial/hotel-v2.jpg` (→ A2) · `editorial/office-v2.jpg` (→ A3) | 9:16 · 3:2 · 3:2 | `50% 45%` · `72% 50%` · `60% 45%` | deck § 01 |
| 02 | `landing/philosophy.jpg` | 4:5 | `50% 50%`; mask start l 37 / r 25 / t 9 % | Flur · Berlin-Schöneberg · 18:40 |
| 03 | `categories/{slug}-v2.jpg` × 7 (resolved via `replacedBy`) | 4:5 | stored `focal` | — |
| 04 | `editorial/arrival-v2.jpg` · `editorial/after-v2.jpg` | 3:2 | `58% 50%` · **`12% 50%`** | Wohnungstür, 4. OG · Berlin-Prenzlauer Berg · 19:25 / Sofa, danach · Berlin-Prenzlauer Berg · 20:10 |
| 05 | `landing/experience-{time,comfort,privacy,quality,choice,flexible}.jpg` | 3:2 / 4:5 | § 4.5 | deck § 05 |
| 06 | provider avatars from data (`pros/pro-NN-v2` in demo) · fallback `editorial/details-v2.jpg` | 4:5 / 1:1 | `50% 36%` (`Portrait` default) · `50% 50%` | — / „Was mitkommt“ |
| 07 | `landing/screens/*` (A4) | 390 × n | regions in `screens.ts` | — |
| 08 | `editorial/provider-cta-v2.jpg` (≥ 1024) · `landing/app-pro.jpg` (< 1024) | 16:9 · 4:5 | `68% 50%` · `50% 50%` | Treppenhaus, 2. OG · Berlin-Neukölln · 17:40 |
| 10 | none (vector only: arch outline, S, wordmark) | — | — | — |
| OG | `/brand/og-default.jpg` (existing, used by the root layout) | 1200 × 630 | — | — |

**Not used on the landing in v1:**
- `landing/hero-wide.jpg`: stays the OG and social master;
- `landing/app-home.jpg`: needs a screen composite (A5);
- `landing/app-table.jpg`: the oak flat-lay would make 07 a second dark band;
- `editorial/setup-v2.jpg`, `editorial/office-v2.jpg` (except as the hero's Büro), `og-default-v2.jpg`.

### 12.2 Missing assets and requirements (no placeholder is ever presented as final)

| ID | Asset | Requirement | Priority | Interim |
|---|---|---|---|---|
| A1 | `landing/hero-home-4x5.jpg` | A derived crop of `hero-mobile.jpg`: 1440 × 1800, top offset 13.5 % (`object-position 50% 45%` baked in). Produced by script (`sharp`); same `place`; register in `scripts/images/sources.json`. | P0 (LCP weight) | serve `hero-mobile.jpg` with the focal |
| A2 | `landing/hero-hotel.jpg` | 4:5, ≥ 1600 × 2000. Frankfurt hotel suite at blue hour (21:10): the skyline in the window's **upper half**; a massage below the springline, the Profi's head at ≥ 25 % of the height, linen to the shoulder blades; oak and bouclé; no names or logos; grade against L01 / L03; casting per `PHOTOGRAPHY.md` § 6. Before launch: shot 7 of § 12.2 re-framed 4:5. | P0 for the place switch | `hotel-v2` @ `72% 50%` |
| A3 | `landing/hero-office.jpg` | 4:5, ≥ 1600 × 2000. HafenCity meeting room at 13:00 (overcast): harbour or Elbphilharmonie in the window's upper half; chair massage, heads ≥ 25 % from the top; unbranded laptop or none. Before launch: shot 9 re-framed 4:5. | P0 | `office-v2` @ `60% 45%` |
| A4 | `landing/screens/{suche,buchung,termine,favoriten}.png` | Full-page captures of the live demo app with a Playwright script (Frontend; `scripts/landing/capture-screens.mjs`). Viewport 390 × 844, DPR 2, `reducedMotion: "reduce"`, signed in as `testkunde@soma.test`. The demo ribbon is hidden by an injected style (the caption carries the label). Pages: `/suche?plz={berlin example}`, `/buchung/{a confirmed demo booking}`, `/konto/termine` (past tab), `/konto/favoriten`. The script writes the region offsets (`y`, `h` of the price, cancellation line, Start-Code, calendar button, „Erneut buchen“, the list) to `screens.ts`. Re-run on every UI change. | P0 for 07 | none: 07 waits for A4 |
| A5 | `landing/app-home-composite.jpg` | `app-home.jpg` with the live booking screen composited into the black phone screen (matched perspective). Optional; for social and the mobile 07 later. | P2 | not used |
| A6 | Retouch `landing/experience-choice.jpg` | Shoes on the barefoot Profi (`LANDING_ART_DIRECTION_INPUT.md` § 4). Needed before any paid use. | P1 | used, flagged |
| A7 | Real photography | Every P0 slot above is reshot per `PHOTOGRAPHY.md` § 12.2 (shots 1–3, 6, 7, 9, 10, 11, 12, 13, 22 and the category tiles), with releases. AI assets may remain only in internal decks. | Launch blocker | — |

### 12.3 Labelling

- **Footer:** „Bilder: KI-generierte Entwicklungsassets“.
- **Portraits:** „Demo-Profil · Foto KI-generiert“ (demo mode).
- **04 stage:** „Vorschau · Demo-Daten“ (demo mode).
- **07:** „Live-App · Demo-Daten“.
- **Never:** an AI face next to a real name, a rating or a badge outside demo mode.

---

## 13. New microcopy needing sign-off (✎)

| Where | String |
|---|---|
| Place-switch group label | „Ort“ |
| *Wo?* placeholders | „PLZ des Hotels, z. B. {PLZ}“ · „PLZ des Büros, z. B. {PLZ}“ |
| *Wo?* sr suffix | „Postleitzahl des Hotels“ · „Postleitzahl des Büros“ |
| Chapter foot | „Weiter: {Kapitel}“ |
| Overlay heading | „Seiten“ |
| Skip link | „Zur Terminsuche springen“ |
| Price note in 03 | „zzgl. Anfahrt“ (⚠ PAngV, with Conversion) |
| Captions | „Vorschau · Demo-Daten“ / „Vorschau“ · „Live-App · Demo-Daten“ / „Live-App“ |
| Alt texts | in § 4.1.2, § 4.2 and § 4.7 |

Every other string is from `COPY_DECK_LANDING.md` or the existing product.

---

## 14. Acceptance checks for implementers and the auditor

1. **Hero geometry** at 1440 × 900, 1280 × 800, 1024 × 768 and 390 × 844:
   - it matches `spec-assets/hero-layout-mock-*.jpg`;
   - the tagline is exactly two lines;
   - the sill's bottom is 72 px above the arch base (≥ 1024);
   - the trust row is fully on Bone;
   - no segment value truncates at its default text.
2. **One Oxblood moment** per viewport, checked at every chapter boundary (§ 6.2).
3. **One serif headline** per view, and **zero `<em>`** in `h1`/`h2` (§ 3.1, D10).
4. **Each tier** checked with `?motion=full|lite|none`:
   - no layout shift when the tier upgrades;
   - pins only in full;
   - every scene ends at rest;
   - no animation queues under rapid input.
5. **Lighthouse mobile:** LCP element is the hero image; CLS ≤ 0.05; route JS within § 10.4.
6. **JavaScript disabled:**
   - every chapter is readable;
   - the hero form submits `plz` to `/suche`;
   - every CTA is a working link;
   - FAQ `<details>` work.
7. **Keyboard only:**
   - place switch (arrows), index → overlay → jump focuses the `h2`;
   - 03 rows preview on focus;
   - 07 tabs work;
   - booking bar and sheet trap focus and return it.
8. **Routes:** every link resolves to an existing page (§ 4 tables). No invented URLs.
9. **Truth:**
   - no provider identity, rating, badge or number appears that does not come from data;
   - demo labels are visible in demo mode;
   - no store badges, no unreleased features.

---

## Appendix A: the canonical arch mask (CSS)

```css
@property --arch-l { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --arch-r { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --arch-t { syntax: "<length-percentage>"; inherits: false; initial-value: 0%; }
@property --arch-k { syntax: "<number>"; inherits: false; initial-value: 1; }   /* 1 = O curve, 0 = square (full bleed) */

/* The parent of the masked element is an inline-size container of the same width. */
[data-arch-mask] {
  --rx: calc((100cqw - var(--arch-l) - var(--arch-r)) / 2 * var(--arch-k));
  --ry: calc(var(--rx) * 1.09);                               /* the O ratio, always */
  clip-path: inset(var(--arch-t) var(--arch-r) 0 var(--arch-l)
                   round var(--rx) var(--rx) 0 0 / var(--ry) var(--ry) 0 0);
}

/* 02 doorway (full tier only) */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    html[data-motion="full"] [data-arch-mask="doorway"][data-scene-ready] {
      animation: lp-doorway linear both;
      animation-timeline: view();
      animation-range: entry 30% entry 100%;
    }
  }
}
@keyframes lp-doorway {
  from { --arch-l: 37cqw; --arch-r: 25cqw; --arch-t: 9%; }
  to   { --arch-l: 0px;   --arch-r: 0px;   --arch-t: 0%; }
}
/* 10 seal: from a 24cqw arch at the bottom centre (crown at 40 %) to a square full bleed (k → 0). */
@keyframes lp-seal {
  from { --arch-l: 38cqw; --arch-r: 38cqw; --arch-t: 40%; --arch-k: 1; }
  70%  { --arch-k: 1; }
  to   { --arch-l: 0px;   --arch-r: 0px;   --arch-t: 0%;  --arch-k: 0; }
}
```

- Without scroll-timeline support, the motion layer sets the same four properties from `--lp-scene` (linear interpolation).
- Without the motion layer, no mask is applied, so the end state shows.
- The frame radius for static arches uses the same O ratio: `border-radius: 50cqw 50cqw 0 0 / 54.5cqw 54.5cqw 0 0`.
- Outlines use `archPath(x, y, w, h)` from `src/components/ui/motif.tsx` (the master's handle tensions).

## Appendix B: spec assets (`docs/landing/spec-assets/`)

| File | What it shows |
|---|---|
| `hero-layout-mock-1440.jpg`, `-1280.jpg`, `-1024.jpg`, `-390.jpg` | The hero grid with the real fonts and image (layout mock; the wordmark is typed text and the trust icons are blank: neither is final art) |
| `crops-hero-places.jpg` | Arch crops for Zu Hause / Hotel / Büro, with the 20 % line and the springline drawn in |
| `crops-experience.jpg` | The six 05 crops and the rejected alternatives |
| `crops-ablauf-pair.jpg` | 04 pair: `arrival-v2` @ 58 %, `after-v2` @ 12 % (chosen) and @ 30 % (rejected) |
