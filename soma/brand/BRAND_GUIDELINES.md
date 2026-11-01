# SOMA: Brand guidelines

*v1.0 · 1 Nov 2026. Identity sections by the Identity Designer (phase B1). The sections **Photography**, **Motion** and **Applications** belong to the Digital Art Director (phase B2).*
*Live brand book: `/kit/marke` (demo mode, noindex). Binding inputs: `brand/BRIEF.md`, `brand/PLAN.md`, `brand/BRAND_STRATEGY.md`, `brand/BRAND_VOICE.md`.*

| Document or folder | Content |
|---|---|
| `brand/BRAND_STRATEGY.md`, `brand/BRAND_VOICE.md` | Positioning, audiences, messaging, voice (Strategist) |
| `brand/LOGO_USAGE.md` | Logo exploration, selection, construction, clear space, minimum sizes, colours, placement, misuse |
| `brand/DESIGN_TOKENS/` | `tokens.json` (W3C), `tokens.css` (app drop-in), `contrast.md`, `README.md` (old → new mapping, migration steps) |
| `brand/assets/logo/` | `concepts/` (A/B/C, symbol studies), `final/` (masters + PNG), `misuse/` |
| `brand/assets/icons/` | iOS, Android adaptive, PWA, favicon (svg, ico), apple-touch-icon |
| `brand/assets/motif/` | The SOMA arch: master, construction, pair, crops, social frame |
| `brand/assets/iconography/` | `ICONOGRAPHY.md`, grid, custom icons, board |
| `brand/assets/typography/` | Candidate specimens, pairing specimen, scale renders, font files + OFL |
| `brand/assets/colour/`, `brand/assets/previews/` | Colour board, logo system board, motif board, icon checks, brand book screenshots |
| `brand/tools/` | The build scripts that generate every asset above (§ 11) |

---

## 1. Brand overview

**Essence:** *Personal care, on your terms.* **Tagline:** *Your body. Your place.* (always English). **Descriptor:** *Beauty & Wellness, wherever you are.* (EN lockups) and *Beauty & Wellness. Bei dir.* (DE product). **Signature line:** *Du bleibst. Dein Profi kommt.* The strategy, audiences and voice are in `BRAND_STRATEGY.md` and `BRAND_VOICE.md`.

**The visual idea: contrapposto.** *Sōma* is the body. In classical sculpture, *contrapposto* is the shift of shoulders against hips that makes a figure look alive and at ease at the same time. SOMA's identity is built on that one move:

- **The S** is drawn from the two halves of the **O**, shifted against each other. The O is the place, whole and at rest; the S is the body in motion. That is *Your body. Your place.* in two letters, and it never shows a body.
- **The symbol** is that S. **The motif** is the O's upper half: the arch of a door or window, the threshold the Profi crosses. **The layout move** is the shift: two arches offset like the two halves of the S.
- **Colour** comes from a lived-in room: Bone walls, Stone plaster, Taupe linen, Espresso wood. **Oxblood** is the one deep, warm signal.
- **Type:** an editorial serif speaks; a warm grotesk works.

**What it must never look like:**
- a nail salon: no pink, glitter, rose gold or script;
- a clinic: no blue-white, crosses or sterile grids;
- SaaS: no gradients, blobs, glows or feature-icon grids;
- a spa: no lotus, leaves, droplets, stones or mysticism.

---

## 2. Logo system

The complete rules are in **`LOGO_USAGE.md`**. In short:

- **Wordmark:** custom uppercase capitals with high contrast and no serifs.
  - The vertical stress is shared by O, M and A.
  - The S is built from the O's halves.
  - There are two optical masters: **display** (≥ 32 px cap height) and **micro** (< 32 px: heavier hairlines, wider spacing).
- **Symbol:** the S, drawn heavier for small sizes, plus a favicon cut with open hairlines.
- **Secondary lockups:** with the descriptor, with the tagline, and stacked (symbol over wordmark).
- **App icon:** a Bone S on an Oxblood tile. It is the brand's most visible Oxblood moment.
- **Clear space:** 3x, where x is the main stem (1/7 of the cap height). **Minimum sizes:** micro wordmark 12 px cap height (≈ 50 px wide) or 15 mm wide; symbol 16 px or 4 mm.
- **Colours:** Espresso (default), Bone (dark grounds), Oxblood (print only), black, white.

Scores of the three directions:

| Direction | Originality | Elegance | Scalability | Memorability | Total |
|---|---|---|---|---|---|
| A Architectural | 5 | 6 | 9 | 5 | 25 |
| B Editorial | 5 | 8 | 4 | 6 | 23 |
| **C Organic Modernism (chosen)** | **8** | **8** | **7 (8 with micro)** | **8** | **31** |

---

## 3. Colour

### 3.1 The palette: kept, with reasons

The client's five colours are **kept exactly**: Bone `#F3EFE8`, Stone `#D8CFC3`, Taupe `#A69A8D`, Oxblood `#542C35` and Espresso `#25211F`. They already deliver what the brief asks for: Bone against Espresso is 13.9:1, Bone against Oxblood is 10.2:1, and all five are warm, tactile and quiet beside the photography (wood, linen, evening light).

What was **added**, and why:

| Addition | Reason |
|---|---|
| **Paper** `#FBF9F5` (raised surfaces) | Cards on Bone need a lifted surface that is warmer than pure white, which reads cold and screen-like next to Bone. |
| **Linen** `#ECE6DC`, **Oat** `#E3DBCF` (sunken, pressed, hairlines) | Interface states between Bone and Stone. |
| **Taupe-deep** `#857A6E` (controls, 3.7:1) and **Umber** `#6E6359` / **Umber-deep** `#5E554D` (tertiary and secondary text, 5.1:1 and 6.4:1) | **Taupe fails as text on Bone (2.4:1)** and as a control border on Stone. These are the darker versions for text and controls; Taupe stays decorative. |
| **Cocoa** `#3B3531`, **Espresso-deep** `#171412` | Hover and pressed states of Espresso. |
| **Oxblood ramp** 50 to 900 | Rare tints and hover/pressed states. The signature stays the 600 step. |

### 3.2 Tonal scales

| Warm neutral | Hex | on Bone | Role |
|---|---|---|---|
| paper | `#FBF9F5` | n/a | raised |
| **bone** | `#F3EFE8` | n/a | page |
| linen | `#ECE6DC` | n/a | sunken, selected-subtle |
| oat | `#E3DBCF` | n/a | pressed, hairline |
| **stone** | `#D8CFC3` | n/a | secondary background, default border |
| stone-deep | `#C7BCAF` | n/a | borders on Stone, dashed totals |
| **taupe** | `#A69A8D` | 2.4:1 | decorative, disabled text |
| taupe-deep | `#857A6E` | 3.7:1 | control borders |
| umber | `#6E6359` | 5.1:1 | tertiary text, emphasised borders |
| umber-deep | `#5E554D` | 6.4:1 | secondary text |
| cocoa | `#3B3531` | 10.5:1 | hover on Espresso |
| **espresso** | `#25211F` | 13.9:1 | text, strong actions, dark surface |

| Oxblood | 50 | 100 | 200 | 300 | 400 | 500 | **600** | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| Hex | `#F5EDEE` | `#EBDADD` | `#D5B5BC` | `#B98A95` | `#94606C` | `#73414D` | **`#542C35`** | `#45232B` | `#361B21` | `#261216` |

### 3.3 Functional colours (harmonised)

They are muted and warm-leaning so they sit in the palette. Each one keeps ≥ 4.5:1 on Bone, on Paper and on its own soft background. **Status is never shown by colour alone:** every feedback element carries an icon and a word.

| Status | fg | bg | border | Icon · word | fg/bg |
|---|---|---|---|---|---|
| Success (olive-forest) | `#336645` | `#E4ECE2` | `#A9C2AE` | `CircleCheck` · „Bestätigt“ | 5.6:1 |
| Warning (ochre) | `#7D5310` | `#F5EAD3` | `#D8BC86` | `TriangleAlert` · „Achtung“ | 5.6:1 |
| Danger (vermilion) | `#B3261E` | `#F8E4E0` | `#E2A69C` | `CircleAlert` · „Fehler“ | 5.3:1 |
| Info (slate) | `#2F5470` | `#E2E9EF` | `#A8BBCB` | `Info` · „Hinweis“ | 6.5:1 |

**Danger vs Oxblood.**
- Danger is a bright, yellow-leaning vermilion (hue ≈ 3°, high chroma, L 0.42). Oxblood is a dark, blue-leaning wine (hue ≈ 346°, L 0.23).
- A danger state always shows the icon and an explicit word ("Zahlung fehlgeschlagen").
- Oxblood never appears on errors, warnings or destructive buttons. The destructive button is vermilion with white text (6.5:1).

### 3.4 Semantic tokens

| Group | Token → value |
|---|---|
| **Text** | primary → espresso · secondary → umber-deep · tertiary → umber (not on Stone) · inverse → bone · on-accent → bone · disabled → taupe · link → espresso, underlined in taupe-deep, Oxblood on hover |
| **Surface** | page → bone · raised → paper · sunken → linen · pressed → oat · stone → stone · inverse → espresso · accent → oxblood (one brand moment) · overlay → `rgb(23 20 18 / .48)` · scrim → `rgb(23 20 18 / .62)` |
| **Border** | subtle → oat (decorative) · default → stone · strong → umber · **control → taupe-deep (≥ 3:1)** |
| **Interactive** | default → espresso · hover → cocoa · pressed → espresso-deep · disabled → oat fill + taupe label · selected → espresso + check icon · selected-subtle → linen |
| **Accent** | default → oxblood · hover → oxblood-700 · pressed → oxblood-800 · soft → oxblood-100 · tint → oxblood-50 |
| **Focus** | ring → oxblood, 2 px, offset 2 px (≥ 3:1 against Bone, Paper, Linen and Stone; the offset shows the page between ring and component) · glow → `rgb(84 44 53 / .16)` |
| **Feedback** | fg / bg / border per status (§ 3.3) |

Names in code (`--color-surface`, `--color-ink-muted`, `--color-line-strong` …) are kept from v2. The mapping is in `DESIGN_TOKENS/README.md`.

### 3.5 Contrast

All **95** pairs are computed in `DESIGN_TOKENS/contrast.md`. The key results:

| Pair | Ratio |
|---|---|
| Espresso on Bone / Paper / Linen / Stone | 13.9 / 15.2 / 12.9 / 10.4 |
| Secondary text (umber-deep) on Bone / Stone | 6.4 / 4.7 |
| Tertiary text (umber) on Bone / Paper / Linen | 5.1 / 5.6 / 4.7 (on Stone 3.8: **not allowed**) |
| Bone on Oxblood (primary action) | 10.2 |
| Oxblood text on Bone | 10.2 |
| Control border (taupe-deep) on Bone / Paper | 3.7 / 4.0 (on Stone use umber, 3.8) |
| Focus ring (Oxblood) on Bone / Stone | 10.2 / 7.6 |
| Paper text on scrim over a white pixel | 4.9 |
| Night: Bone / secondary `#BFB4A7` / control `#8F8377` on Espresso | 13.9 / 7.8 / 4.3 (3.9 on raised) |
| Taupe as text on Bone | 2.4 (**rejected**, decorative only) |
| Oxblood on Espresso | 1.4 (**rejected**: the night accent is Bone) |

### 3.6 Accent restraint

**At most one Oxblood moment per screen.**

| Oxblood: yes | Oxblood: no |
|---|---|
| The one primary action ("Zahlungspflichtig buchen · 84 €", "Termin wählen" on a profile) | Links, icons, navigation, selected chips, slots, dates, tabs (all Espresso) |
| Brand moments: app icon, splash, one Oxblood band, gift card, the stacked lockup on social | Errors, warnings, destructive actions (vermilion), badges, counts |
| Focus ring and link hover (only when interacting) | Large areas behind body copy, gradients, Oxblood on Espresso, Oxblood type on photographs |

When a screen has a brand band in Oxblood, its primary action is Bone or Espresso.

### 3.7 Scopes, charts, category washes

- **Night** (`[data-theme="night"]`): Espresso surfaces, Bone text, Bone accent and focus, and lighter functional colours (`#93C6A1`, `#E3BC6E`, `#F39A8D`, `#A3C1DA`, all ≥ 4.5:1).
- **Oxblood** (`[data-theme="oxblood"]`): the brand moment. Oxblood surface, Bone text and actions, oxblood-200 secondary text (6.2:1).
- **Charts:** oxblood · taupe-deep · olive `#5E7A45` · ochre `#B07A26` · slate `#4F6B84`, all ≥ 3:1 on Paper. The current or primary series is Oxblood.
- **Category washes** (replace the aura palettes): massage `#E8DED2`, maniküre `#EAE1DA`, pediküre `#E6DED0`, kosmetik `#E2E0D6`, make-up `#E8DFDA`, haare & styling `#E5DBCC`, brows & lashes `#E3DDD6`, nacht `#25211F`.
  - The ink is always Espresso (Bone on nacht), 11.7–12.4:1.
  - The washes differ in temperature, not in hue. There is no pink.

---

## 4. Typography

### 4.1 Comparison

Every candidate is SIL OFL from Google Fonts, licensed for web, app and logo use; nothing was purchased. The specimens are `brand/assets/typography/display-candidates.png` and `ui-candidates.png`: real German copy, umlauts and ß, „84 €“, 14:30 Uhr. Sizes are the latin woff2 from the Google Fonts API.

**Display** (score 1–5: harmony with the wordmark · readability at 24–104 px · performance · German/multilingual · character without trend):

| Candidate | Axes, files | Harmony | Readability | Perf. | Lang. | Character | Verdict |
|---|---|---|---|---|---|---|---|
| **Newsreader** (Production Type) | opsz 6–72, wght 200–800, roman + italic · var 129 KB, **static display cut 22 KB** | 5: vertical stress and contrast close to the wordmark | 5: narrow, holds German compounds | 5 | 4: Latin Ext, Vietnamese | 4: contemporary, refined, editorial | **Chosen** |
| Bodoni Moda | opsz 6–96, wght 400–900 · 45 KB | 3 | 2: hairlines vanish at body and caption sizes | 4 | 4 | 2: the fashion-magazine default | – |
| Fraunces | opsz, wght, SOFT, WONK · 118 KB | 2: soft, wonky details fight the crisp M/A | 4 | 2 | 4 | 2: 2020–23 startup trend | – |
| Gloock | one weight, no italic · 26 KB | 3 | 4 | 5 | 3 | 3: heavy, no `<em>` accent possible | – |
| Instrument Serif | 400 + italic, condensed · 21 KB | 3 | 3 | 5 | 3 | 2: ubiquitous on 2024–25 landing pages | – |
| Noto Serif Display | wdth, wght · 75 KB (latin-ext 318 KB) | 4 | 4 | 2 | 5: Greek, Cyrillic | 3: elegant but neutral, wide | – |

**UI sans** (harmony · readability at 12–16 px · performance · German · tabular figures):

| Candidate | Axes, files | Harmony | Small sizes | Perf. | German (long words) | tnum | Verdict |
|---|---|---|---|---|---|---|---|
| **Instrument Sans** | wdth 75–100, wght 400–700 (+ italic) · **57 KB** | 5: warm grotesk, quiet next to the serif | 5 | 4 | 5: **a real width axis** for chips, tabs and buttons (wdth 86) | ✓ | **Chosen** |
| Inter | opsz 14–32, wght · 71 KB | 4 | 5 | 3 | 3: no width axis | ✓ | Excellent but reads as SaaS, the look the brief excludes |
| Hanken Grotesk | wght · 34 KB | 4 | 4 | 5 | 3 | ✓ | Odd capital ẞ; no width axis |
| Geist | wght · 29 KB | 3 | 4 | 5 | 3 | ✓ | Strong developer-tool association |
| Manrope | wght · 24 KB | 2: geometric, rounded | 4 | 5 | 3 | ✓ | Tech-startup tone |
| Schibsted Grotesk | wght · 46 KB | 3 | 4 | 4 | 3 | ✗ | Tabular figures also widen the punctuation („1 . 284 , 50“) |
| Albert Sans | wght · 31 KB | 3 | 4 | 5 | 3 | ✗ | No tabular figures: excluded |

**The pairing.** **Newsreader Display** speaks and **Instrument Sans** works (see `pairing-newsreader-instrument-sans.png`):
- They share an upright, calm construction and a moderate x-height.
- The serif's vertical stress echoes the wordmark.
- The sans has the warmth of a humanist grotesk without its quirks.
- Continuity: Newsreader Italic was already v2's accent, so the italic file stays.

### 4.2 Performance budget

| File | Size | Loading |
|---|---|---|
| Instrument Sans variable, latin | 57 KB | **preload** |
| Newsreader Display roman (opsz 72, 400), latin | 22 KB | **preload** |
| Newsreader Display italic (opsz 72, 400), latin | 23 KB | on first `<em>` (swap, metric-matched Times fallback) |
| latin-ext subsets (both families) | 19 KB / 13 KB | only when the glyphs appear (*Doğan*) |
| DM Mono | n/a | `/pro`, `/admin` only |

**Home page: 2 preloaded files, 79 KB; 102 KB with the italic** (limit: 2 files, 150 KB). The Newsreader variable font (129 KB) is not used: the brand sets serif type only at ≥ 24 px, where the opsz-72 cut is the right optical size, so a static instance does the job.

### 4.3 Scale: fluid 360 → 1440 px

| Token | Face | Weight | Size (360 → 1440) | `clamp()` | Line height | Tracking | Use |
|---|---|---|---|---|---|---|---|
| `display-xl` | Newsreader Display | 400 | 44 → 104 | `clamp(2.75rem, 1.5rem + 5.5556vw, 6.5rem)` | 0.98 | −0.026em | Home hero, one per page |
| `display-l` | Newsreader Display | 400 | 38 → 80 | `clamp(2.375rem, 1.5rem + 3.8889vw, 5rem)` | 1.00 | −0.022em | Editorial section titles |
| `display-m` | Newsreader Display | 400 | 32 → 60 | `clamp(2rem, 1.4167rem + 2.5926vw, 3.75rem)` | 1.04 | −0.018em | Category, profile name, confirmation |
| `display-s` | Newsreader Display | 400 | 28 → 44 | `clamp(1.75rem, 1.4167rem + 1.4815vw, 2.75rem)` | 1.08 | −0.014em | Quotes, empty states |
| `h1` | Newsreader Display | 400 | 32 → 52 | `clamp(2rem, 1.5833rem + 1.8519vw, 3.25rem)` | 1.06 | −0.016em | Marketing page title |
| `h2` | Newsreader Display | 400 | 26 → 38 | `clamp(1.625rem, 1.375rem + 1.1111vw, 2.375rem)` | 1.10 | −0.012em | Marketing section title |
| `h3` = `heading-l` | Instrument Sans | 600 | 20 → 24 | `clamp(1.25rem, 1.1667rem + 0.3704vw, 1.5rem)` | 1.25 | −0.012em | App screen and dialog titles |
| `h4` = `heading-m` | Instrument Sans | 600 | 17 → 19 | `clamp(1.0625rem, 1.0208rem + 0.1852vw, 1.1875rem)` | 1.30 | −0.008em | Section and list titles |
| `h5` = `heading-s` | Instrument Sans | 600 | 15 → 16 | `clamp(0.9375rem, 0.9167rem + 0.0926vw, 1rem)` | 1.35 | −0.004em | Card titles |
| `h6` | Instrument Sans | 600 | 13 → 14 | `clamp(0.8125rem, 0.7917rem + 0.0926vw, 0.875rem)` | 1.35 | 0 | Minor group titles |
| `lead` (intro) | Instrument Sans | 400 | 18 → 21 | `clamp(1.125rem, 1.0625rem + 0.2778vw, 1.3125rem)` | 1.50 | −0.006em | Intro paragraphs |
| `body-l` | Instrument Sans | 400 | 17 → 18 | `clamp(1.0625rem, 1.0417rem + 0.0926vw, 1.125rem)` | 1.55 | −0.004em | Long reading |
| `body` (M) | Instrument Sans | 400 | 16 | `1rem` | 1.55 | −0.002em | Default |
| `body-s` | Instrument Sans | 400 | 14 | `0.875rem` | 1.50 | 0 | Secondary, tables |
| `small` (= caption) | Instrument Sans | 450 | 12 | `0.75rem` | 1.40 | +0.01em | Captions, timestamps; never below 12 px |
| `eyebrow` (= overline) | Instrument Sans | 600, caps | 12 | `0.75rem` | 1.20 | +0.12em | At most three words; `type-place` for the Ortszeile |
| `button` | Instrument Sans | 560 | 15 → 16 | `clamp(0.9375rem, 0.9167rem + 0.0926vw, 1rem)` | 1.20 | −0.004em | Buttons |
| `label` | Instrument Sans | 540 | 14 → 15 | `clamp(0.875rem, 0.8542rem + 0.0926vw, 0.9375rem)` | 1.20 | −0.002em | Tabs, chips, slots |
| `label-s` | Instrument Sans | 540 | 13 | `0.8125rem` | 1.20 | 0 | Field labels, table headers |
| `control` | Instrument Sans | 400 | 16 | `1rem` | 1.30 | −0.002em | Inputs (no iOS zoom) |
| `numeric` (= stat) | Instrument Sans | 560, tabular | 28 → 40 | `clamp(1.75rem, 1.5rem + 1.1111vw, 2.5rem)` | 1.05 | −0.02em | Prices, KPIs, Start-Code |

**Optical size.**
- Newsreader is loaded as its **opsz 72** display instance. It is used from 24 px upward only. Below that, the serif is not used, except as an italic accent inside sans headings (≥ 18 px).
- Instrument Sans has no opsz axis, so tracking does the optical work: it tightens on larger headings and opens up on small caps and the eyebrow.
- `font-optical-sizing: auto` stays on, for system fallbacks.

### 4.4 Rules

- **One serif statement per view** (strategy). That covers the tagline, a display headline or a quote. App screens, dialogs, forms and tables are sans only.
- **`<em>` accents:**
  - Inside serif headlines (`display-*`, `h1`, `h2`), `<em>` switches to Newsreader **Italic** at the same size and weight: *Du bleibst. <em>Dein Profi kommt.</em>*
  - Inside sans headings (`heading-l`/`-m`), `<em>` is a serif italic clause at 1.08em with no extra leading.
  - Use one accent clause per headline at most, and never in buttons, labels, inputs or tables.
- **The tagline** "Your body. Your place." is always Newsreader Display Italic, `lang="en"`, and never set in the sans.
- **Numbers** use tabular lining figures everywhere they align (`num`, `type-numeric`). German formats with non-breaking spaces: `84 €`, `14:30 Uhr`, `Fr., 14. Nov.`, `1.284,50 €`.
- **German line breaks:**
  - Headlines use `text-wrap: balance`; insert `&shy;` into compounds of more than 14 characters.
  - Body copy uses `hyphens: auto`.
  - In chips, tabs and buttons, long words switch to `condensed` (wdth 86, about 12 % narrower) before they ever truncate (*Wimpernverlängerung*).
- **Middle dots:** Instrument Sans sets "·" tight. In UI strings, use a no-break space on both sides (`Massage · 60 Min.`).

---

## 5. Graphic language

### 5.1 The motif: the SOMA arch (*der Bogen*)

**Construction.**
- The arch is the **upper half of the wordmark's O**: the same ellipse (ry = 1.09 rx) with the same handle tensions (0.57 / 0.585), on straight vertical flanks. Its width is the image width.
- Masters are in `brand/assets/motif/`:
  - `soma-arch.svg` (master 4:5);
  - `soma-arch-construction.svg`;
  - `soma-arch-outline.svg` (hairline);
  - `soma-arch-pair.svg` (contrapposto offset);
  - `soma-arch-crops.svg` (4:5, 3:4, 2:3, O-portrait);
  - `soma-arch-social-1080x1350.svg`.
- In CSS: `.arch` / `--radius-arch` with `--arch-aspect` (width / height: 0.8 for 4:5, 0.75 for 3:4, 0.667 for 2:3, 1.333 for 4:3).

**Meaning.** A door, a window, a threshold: every image answers "where are we?" (strategy § 10.5). It is the place, not the body, and it carries no spa symbolism.

**Rules for use:**

| | Rule |
|---|---|
| **Use** | Crop editorial and hero photography; service-card and category images; empty image slots; social posts; gift card and onboarding covers. |
| **Count** | One arch or one **pair** per view on marketing pages. In lists, every card image can be an arch, because a repeated arch is a rhythm, not a decoration. |
| **The pair (contrapposto)** | Two arches side by side: the left one higher, the right one lower by 18 % of its width, like the S's two halves. Use it for two places ("Zuhause · Hotel"), before/after, or Profi and client. |
| **Scale** | The arch never falls below 120 px wide; below that, use a rounded tile (radius 12). In the UI, the arch is always an image frame or an outline, never a filled decorative shape. |
| **Crop** | Keep the subject's head or hands below the arch's springline (the point where curve meets flank): nothing important sits in the top 20 %. Keep 4:5 as the default. Avatars and portraits use the full **O-oval** (332 : 362). |
| **Colour** | Photography inside; Stone or the category wash as the empty fill; Espresso 1.5 px or `line-mid` 1 px as an outline. Oxblood fill only as the single brand moment (splash, gift card). Never a gradient, never a shadow on the arch itself; the card carries elevation. |
| **Never** | Rotate it; stretch it off its O ratio; use it as a pattern or texture; nest arches; put the logo inside the curve. |

**Motion.**
- **Arrival:** the arch rises 16 px and fades in (640 ms, `ease-arrive`). The photograph inside settles from scale 1.04 to 1 (900 ms). The movement stops: no loop and no parallax.
- **Reduced motion:** the image simply appears.
- **Brand animation:** the arch's outline draws in (stroke-dashoffset, 640 ms) and the S appears inside it. Details belong to the Art Director (§ 8).

**Social.**
- Format 4:5 (1080 × 1350): arch 800 px wide, centred, 150 px from the top, with the micro wordmark centred below.
- Two-image posts use the pair.
- Story covers (9:16) use one arch at 76 % of the width.

### 5.2 Editorial grid principles

- **Columns:** 4 / 8 / 12 (from 0 / 768 / 1024 px). Gutters 20 / 32 / 48 px; gaps 12 / 20 / 24 px. Page container 1376 px, content 1152, reading 608.
- **Asymmetry with a reason:** editorial sections place text on 5 columns and the image on 6, with one empty column between them (desktop). On mobile, the image comes first, then the text.
- **The shift:** in two-part layouts the second element drops by 8–18 % of its width (the pair). This is the only "dynamic" device; nothing is tilted or rotated.
- **Baseline:** vertical rhythm on the 4 px grid. Section padding 72 / 96 / 112–128 px.
- **The Ortszeile** (*Ort · Stadtteil · Uhrzeit*, `type-place`) sits under every key image. It is left-aligned to the image edge, with tabular figures.

### 5.3 Image crop rules

- **Discreet crops** (strategy): hands, shoulders, backs, turned-away or closed-eyed faces. Never crop to sexualise; nothing may read as an erotic massage.
- **Leave the room in:** at least 30 % of the frame shows the place: wall, window, furniture, light.
- **Formats:** 4:5 arch (hero, cards), 3:4 (profile header), 4:3 tile with radius 12 (lists, dense UI), 1:1 O-oval (avatars), 16:9 only for full-bleed bands.
- **Text on images:** only on calm zones, or on a flat scrim (62 %). Never use a gradient scrim.

### 5.4 Empty image slots and avatars (replacing the v2 aura)

- **Empty image slot:**
  - Fill: the category wash (§ 3.7).
  - A 1.5 px arch outline in `line-mid`, inset 12 % at the top and 14 % at the sides.
  - The category word in Newsreader Italic, bottom left, 24–36 px.
  - It is static: no drift, no grain, no gradients. It reads as a "placed" frame waiting for a photo.
- **Avatar** (≤ 48 px): initials in Newsreader Display 400 at 42 % of the diameter, Espresso on the person's category wash (seeded by id), with a 1 px `rgb(37 33 31 / .1)` ring. The photo fades in over it (640 ms).
- **Portrait** (≥ 96 px): the O-oval with the wash. Initials are optional.
- **Skeleton:** Linen with a slow, quiet shimmer (1.8 s). Shapes match the final ones: an arch for arch images, pills for text.

---

## 6. Iconography

The spec is in **`brand/assets/iconography/ICONOGRAPHY.md`**, the board in `iconography-board.png`.
- **Lucide, tuned:** 24 px grid, 2 px padding, **1.5 px absolute stroke** at 16/20/24, round caps and joins, `currentColor`. The existing `Icon` wrapper already does this.
- **Ten custom icons** (`custom/*.svg`): *zuhause*, *hotel*, *buero*, *massage*, *manikuere*, *pedikuere*, *kosmetik*, *make-up*, *haare-styling*, *brows-lashes*. Doors and fingertips carry the arch.
- Icons accompany words. Status always pairs an icon with a word; standalone icons need an accessible name.

---

## 7. Photography

> **Owned by the Digital Art Director (phase B2).** Direction, shot list, grading, development-asset labelling and replacement requirements go here (`brand/photography/**`).
> Identity constraints already fixed: the arch and O-oval crops (§ 5.1, 5.3), the 62 % flat scrim, the Ortszeile under key images, and no Oxblood on photographs.

## 8. Motion

> **Owned by the Digital Art Director (phase B2).** Principles for page transitions, overlays, navigation, loading, interactive elements and brand animations go here.
> The identity's motion tokens are already in `DESIGN_TOKENS`:
> - **Durations:** instant 100, fast 160, base 220, slow 320, arrive 480, calm 640 ms.
> - **Easings:** standard `(0.2, 0, 0, 1)`, arrive `(0.16, 1, 0.3, 1)`, settle `(0.22, 1, 0.36, 1)`, exit `(0.4, 0, 1, 1)`. There is no overshoot, no bounce and no ambient loop.
> - The arch arrival (§ 5.1).
> - Reduced motion is honoured globally.

---

## 9. UI design system

### 9.1 Principles

1. **Quiet surfaces, clear actions.**
   - Bone page, Paper cards with a hairline shadow, Espresso type.
   - Colour appears only where it means something: Oxblood for the one primary action, and the functional colours with an icon and a word.
2. **Editorial where it speaks, functional where it works.** The serif appears once per view; every control, number and form is the sans.
3. **The truth is the design material** (strategy): *Endpreis inkl. Anfahrt*, the dated cancellation deadline and the Start-Code are shown plainly. Never fake ratings or badges.
4. **Arrive and rest.** Interactions answer within 100–220 ms. Elements settle and stop.
5. **Built for German, thumbs and screen readers.**
   - Compounds fit.
   - Targets are ≥ 44 px.
   - Every status is a word.
   - Focus is always visible (2 px Oxblood, 2 px offset).

### 9.2 Foundations

| | Value |
|---|---|
| Spacing | 4 px base: 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 160 |
| Breakpoints | xs 360 (new), sm 640, md 768, lg 1024, xl 1280, 2xl 1440 (layout targets 360 / 390 / 768 / 1024 / 1440) |
| Grid | 4 / 8 / 12 columns; gutters 20 / 32 / 48; gaps 12 / 20 / 24 |
| Radii | control 8 · tile 12 · card 16 · panel / sheet 24 · pill (buttons, chips, badges, avatars) · arch (motif) |
| Elevation | `raised` (cards: ring 7 % + 1/2 + 4/10 px), `float` (hover, popovers, toasts), `overlay` (dialogs, sheets). All tinted with Espresso, at most 22 % opacity. No coloured glows. |
| Touch | minimum 44 × 44 px; controls 48 (default), 52 (booking CTA), 36 dense (with a 44 px hit area) |
| Z-index | header 30 · bottom nav 30 · sticky CTA 35 · overlay 40 · sheet 50 · modal 60 · toast 70 |

### 9.3 Components and states

The rendered references are on `/kit/marke` § 6. API names refer to `src/components/ui/*`.

| Component | Spec | States |
|---|---|---|
| **Button** (`Button`, `ButtonLink`) | Pill. S 36 (44 hit area) · M 48 · L 52. `type-button` 15–16 / 560. Variants: **accent** (Oxblood, one per screen) · **primary** (Espresso; Bone label) · **secondary** (transparent, 1 px `line-control` ring) · **ghost** · **link** (underline 1 px `line-strong`, 4 px offset) · **destructive** (vermilion, white). Icon 20 px with an 8 px gap. | **hover:** accent → oxblood-700, primary → cocoa, secondary/ghost → linen fill. **pressed:** scale 0.98 for 100 ms, accent → oxblood-800. **focus:** 2 px Oxblood ring, 2 px offset (Bone in night/oxblood scopes). **disabled:** oat fill, taupe label, no shadow, `aria-disabled`. **loading:** spinner replaces the leading icon, label "Wird gebucht …", same width, `aria-busy`. |
| **Input, Select, Textarea** (`Field`) | 48 px, radius 8, Paper fill, 1 px `line-control` border (3.7:1), `inset-shadow-field`. Label `label-s` above; helper `small` below; control text 16 px. | **focus:** border Oxblood + 3 px `focus-glow`. **error:** border danger, message below with `CircleAlert` + text, `aria-invalid`, `aria-describedby`. **success:** `CircleCheck` + text in success colour. **disabled:** linen fill, oat border, taupe text. **filled / placeholder:** the placeholder is umber (5.1:1), never the only label. |
| **Search control** | Mobile: a stacked card (Behandlung / Ort / Wann, 1 px oat dividers) with a full-width Espresso button. From 768 px: one pill (radius full, `shadow-float`) with three segments and the button inside. | **Segment focus:** linen fill + focus ring on the segment. **Filled:** value in `body`, label in `small` 600. **Empty:** placeholder umber. **Loading results:** button spinner. |
| **Chips, segmented** | 36 px pill, `line-mid` ring, `label` 540; long words in `condensed`. | **selected:** Espresso fill, Bone label, a check icon (never colour alone). **hover:** linen. **focus:** ring. **disabled:** taupe. |
| **Navigation** | Header 60 / 68 px, glass Paper 92 %, micro wordmark left (15 / 18 px), actions right. Tabs: 44 px, active = Espresso text + 2 px Espresso bar. Bottom nav (mobile, `/konto`, `/pro`): 4 items, 22 px icons, 11 px labels. | **active:** Espresso, icon stroke 1.9, linen pill behind, `aria-current="page"`. **inactive:** umber-deep. **focus:** ring. On scroll the header gains a hairline. |
| **Service card** | Paper, radius 16, `shadow-raised`. Image: an arch 4:3 inside a 12 px inset (or the wash fallback). Eyebrow = category; title in Newsreader 26; meta row (`Clock` duration, the custom category icon + what the Profi brings); a price row above a hairline: "Endpreis inkl. Anfahrt · **ab 84 €**" (tabular). | **hover** (pointer): lift 2 px → `shadow-float`. **pressed:** scale 0.99. **focus:** ring on the card link. **loading:** skeleton with the same shapes. **unavailable:** label "Gerade nicht buchbar" + muted image, never hidden silently. |
| **Profile card** | O-oval portrait 96 px (wash + initials fallback); name in Newsreader 26; categories; "Profil geprüft" (`ShieldCheck`) only if true; location pills (Zuhause / Hotel / Büro, custom icons) for the places this Profi serves; "Nächster freier Termin · Fr., 14. Nov., 14:30". **No star rating until there are real reviews.** | hover / focus as the service card. Offline or unavailable: "Zurzeit keine Termine" in muted text. |
| **Date strip, time slots** (`DateStrip`, `TimeSlots`) | Dates: 5–7 tiles, radius 12, day `small` + number 18 / 600 tabular. Slots: a 4-column grid, 44 px, radius 12, `label` tabular. Radiogroup semantics, arrow keys. | **selected:** Espresso fill, Bone text, a check icon in the slot. **today:** a small arch mark (14 × 7) under the number. **unavailable:** sunken fill, taupe, struck through, `aria-disabled` + „ausgebucht“. **focus:** ring. |
| **Booking summary** (`PriceBreakdown`) | Lines `body-s`: label umber-deep left, amount right, tabular. Date and time line. A dashed `stone-deep` rule, then the **Endpreis** in `numeric` 28. The accent CTA "Zahlungspflichtig buchen · 84 €" (legal wording, fixed). The cancellation deadline below it in `small`, centred. | sticky on mobile (`shadow-bar`), static from `lg`. **Price changes:** the amount crossfades (160 ms). **Error:** a danger notice above the CTA. |
| **Modal, dialog** (`Modal`) | Centred, ≤ 380–480 px, Paper, radius 16, `shadow-overlay`, backdrop 48 %. Title in Newsreader 24 (the view's one serif), body `body-s`, actions stacked on mobile; the safe action first. | Opens: rises 8 px, 320 ms `ease-arrive`; exit fade 220 ms. Focus goes to the first action; Esc closes; focus returns to the trigger. |
| **Sheet, drawer** (`Sheet`) | Mobile bottom sheet: radius 24 at the top, grabber 36 × 4 Stone-deep, header `heading-m` + close `X`. From `md`: centred dialog, or a right drawer of 400 px (`variant="drawer"`). | Enter: slide up 480 ms `ease-arrive` (no spring). Drag down to dismiss. Reduced motion: fade. |
| **Notifications** (`Toast`, `Notice`, `Status`) | **Toast:** Espresso, Bone text, radius 12, `shadow-float`, icon + message + optional text action; 5 s (8 s with an action), paused on hover and focus. **Notice:** soft bg + 1 px border + icon in the status colour + a bold word, then the explanation in Espresso. **Status pill:** soft bg + 6 px dot + word. | Live regions: `status` (polite), `alert` for danger. Never colour without the word. |
| **Form feedback** | Inline under the field: icon 16 + one sentence that says what to do ("Bitte gib eine fünfstellige Postleitzahl ein."). On submit, an error summary notice at the top with links to the fields. | Error appears on blur or submit, never while typing; success only where it helps (address in the service area). |
| **Loading** | Skeletons (Linen, 1.8 s shimmer) in the final shapes; the spinner (2 px, 0.9 s) only inside buttons and inline status: "Freie Termine werden geladen …". | Reduced motion: shimmer 3 s and spinner slower (they keep turning because they are essential feedback). |
| **Empty state** (`EmptyState`) | A 72 px arch outline in `stone-deep`, title in Newsreader 26 (the view's serif), one or two lines in `small`, one secondary action. | Dense contexts: the text line only. |

### 9.4 Responsive and accessible patterns

- **Mobile first, 360 px minimum.** No horizontal scroll at 320 px: every grid child gets `min-w-0`, and long words switch to `condensed` and then soft hyphens.
- **Thumb zone:** primary actions sit at the bottom on mobile (sticky booking bar with `env(safe-area-inset-bottom)`). Sheets replace popovers below 768 px.
- **Focus:** always visible, 2 px Oxblood with a 2 px offset (Bone on dark). Focus order follows the visual order. Dialogs trap focus and restore it.
- **Contrast:** text ≥ 4.5:1, UI ≥ 3:1 (§ 3.5). The disabled state is the only exemption.
- **Not colour alone:** status pairs a word and an icon; selection pairs a fill with a check; links are underlined.
- **Motion:** `prefers-reduced-motion` reduces every animation to opacity or nothing. No information is carried by motion alone.
- **Language:** `lang="de"` for the page, `lang="en"` on the tagline. Prices and times use non-breaking spaces. Numbers use tabular figures.
- **Targets and text:** ≥ 44 × 44 px targets; text never below 12 px; form controls at 16 px.

---

## 10. Applications

> **Owned by the Digital Art Director (phase B2).** Landing page, mobile app, professional dashboard, app icon mock-ups, social, ads, booking confirmation, transactional email, gift card and onboarding kit go here (`brand/applications/**`).
> Identity inputs ready for them: the lockups (`assets/logo/final`), the app icons (`assets/icons`), the arch social frame (`assets/motif/soma-arch-social-1080x1350.svg`), the tokens, and `/kit/marke` as the component reference.

---

## 11. Asset production

Every asset is generated from code. To change one, edit the source and rebuild; never hand-edit the outputs.

| Script | Builds |
|---|---|
| `brand/tools/concept-{a,b,c}.mjs`, `brand/tools/final.mjs` | Letterform construction (parameters, kerning, masters) |
| `node brand/tools/build-logo.mjs [concepts\|final]` | `assets/logo/concepts/**`, `assets/logo/final/**` (SVG + PNG @1x/2x/3x) |
| `node brand/tools/build-icons.mjs` | `assets/icons/**` (iOS, Android, PWA, favicon.svg/.ico, apple-touch) + `previews/icons-check.png` |
| `node brand/tools/build-graphics.mjs [motif\|icons\|misuse]` | `assets/motif/**`, `assets/iconography/**`, `assets/logo/misuse/**` |
| `node brand/tools/build-tokens.mjs` | `DESIGN_TOKENS/tokens.json`, `tokens.css`, `contrast.*` |
| `node brand/tools/build-boards.mjs` | Logo system, construction, symbol studies, colour, type-scale boards |
| `node brand/tools/type-specimens.mjs` (after `fetch-fonts.mjs`) | `assets/typography/*.png` |
| `node brand/tools/build-kit-data.mjs` | `src/app/kit/marke/data.generated.ts` (artwork and tokens for the brand book) |

- **devDependencies added:**
  - `paper` 0.12: booleans and curve fitting for the outlines (MIT).
  - `opentype.js` 2.0: outlining the descriptor and tagline (MIT).
- **Font files used by the scripts:** latin subsets from the Google Fonts API, cached in `/tmp/soma-fonts`, re-fetched by `fetch-fonts.mjs`. The shipped font files are in `assets/typography/fonts/`.
- **SVG hygiene:** every master has an explicit `viewBox`, outlined paths, named groups (`wordmark`, `wordmark-s` …, `symbol`, `descriptor`), a `<title>`, no raster, and no live text.
