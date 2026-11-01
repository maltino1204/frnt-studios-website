# SOMA: Logo usage

*Identity Designer · phase B1 · 1 Nov 2026 · v1.0*
*Masters: `brand/assets/logo/final/*.svg` (authoritative). Raster exports: `brand/assets/logo/final/png/`. Build: `node brand/tools/build-logo.mjs`.*

The SOMA logo system has four parts: the **wordmark** (primary), the **symbol** (the S), the **secondary lockups** and the **app icon**. Every shape is a hand-built path. No font was used as raw material for the letterforms (§ 1.4).

---

## 1. Exploration and selection

### 1.1 Three directions

All three are uppercase, so the comparison is about character, not case. Each concept was drawn as its own construction module (`brand/tools/concept-a.mjs`, `-b`, `-c`) and rendered at 16, 20 and 24 px cap height, on light and dark (`brand/assets/logo/concepts/*.png`).

| | A · Architectural | B · Editorial | C · Organic Modernism |
|---|---|---|---|
| Idea | Monolinear geometric capitals on a **datum**: the M's vertex, the A's bar and the S's spine centre sit on one horizontal at 0.6 H. Straight-spined S, circular O. | High-contrast serif capitals with vertical stress: hairline serifs, a Didone M (thin-thick-thin-thick), and lens-shaped beak terminals on the S. | Serif-less high contrast. **The S is built from the two halves of the O**, shifted against each other like shoulder and hip in *contrapposto*: the body in motion, the place at rest. |
| Originality | **5**: close to well-known geometric grotesques; the datum is invisible to non-designers. | **5**: Didone capitals are the default picture of a fashion magazine. | **8**: the S/O relationship is ownable, and a high-contrast sans without serifs is rare in the category. |
| Elegance | **6**: precise but cool, more hotel signage than care. | **8**: refined at display sizes. | **8**: warm curves and crisp diagonals, calm in a line of text. |
| Scalability | **9**: monolinear, holds at 16 px. | **4**: hairlines and serifs break up below 24 px. | **7**: hairlines thin at 16 px; with the micro master **8**. |
| Memorability | **5** | **6** | **8**: the S is the face of the brand. |
| **Total** | **25 / 40** | **23 / 40** | **31 / 40: chosen** |

### 1.2 Why C

- It is the only direction where an idea, not a style, carries the mark. *Sōma* is the body; the S is the O in motion. This gives the symbol, the app icon and the motif one shared source.
- It sits between the brief's three worlds:
  - the precision of hospitality: straight stems, pointed vertex and apex;
  - the warmth of beauty and wellness: curvature and full bowls;
  - the clarity of technology: no serifs, a micro master for screens.
- It avoids the clichés. There is no script, no lotus and no spa softness, so it is neither feminine nor clinical.

### 1.3 Refinement of C into the final wordmark

| Change | Why |
|---|---|
| The S was rebuilt from two-edge ellipse construction with a **cubic waist** (`sEdge` in `lib/s.mjs`) instead of the concept's tangent-line spine | The concept's waist pinched and crossed itself. Now the spine is one smooth diagonal with a single inflection per edge. |
| The S was widened (outer bowl radius 226 → 240) and its upper bowl made smaller (r 170 vs 178) and set 6 units right | The S read light and narrow beside the O. A smaller, slightly offset upper bowl is the classic optical correction against a top-heavy S. |
| The terminals are cut perpendicular to the stroke (θ −30° / 150°) | Vertical cuts produced a sliver at the top and a slab at the bottom; perpendicular cuts end both crescents the same way. |
| Overshoots: the round letters by 12 units (1.7 %); the A's apex and the M's vertex by 17 units (2.4 %) | Pointed forms need more overshoot than round ones to look equally tall. |
| Contrast: stems 100, hairlines 32 (display master) | About 3:1, high enough to feel editorial and low enough to survive the micro master. |
| The M follows the S's logic: thin left stem (46), full left diagonal, thin right diagonal, full right stem; its vertex sits 0.16 V left of centre | This is the same vertical stress as the O. The offset vertex balances the heavier left diagonal. |
| The A has a hairline left leg and a full right leg; its bar sits at 0.615 H with a hairline weight | A low bar opens the counter and lines up optically with the S's lower bowl. |
| Kerning was set by hand: S–O −22, O–M −12, M–A −46 (units at 700 cap height). Tracking is +74 (display) / +112 (micro). | These even out the optical gaps. M–A needs the most because the A's diagonal leans away from the M's vertical stem. |
| **Micro master** (`soma-wordmark-micro.svg`): stems 112, hairlines 52, wider spacing | Use it below 32 px cap height. Hairlines stay above about 0.9 px at 16 px. |

### 1.4 Provenance and licences

- **Letterforms (wordmark, symbol):** constructed geometry only (ellipses, bands, cubic curves, paper.js booleans). No glyph outlines from any font were used. Source: `brand/tools/final.mjs`, `brand/tools/lib/{geo,s,word}.mjs`.
- **Descriptor lockup:** "Beauty & Wellness, wherever you are." is set in **Instrument Sans Medium** (© The Instrument Sans Project Authors, SIL OFL 1.1) and outlined with opentype.js.
- **Tagline lockup:** "Your body. Your place." is set in **Newsreader 72pt Italic** (© The Newsreader Project Authors, Production Type, SIL OFL 1.1) and outlined.
- The OFL explicitly permits embedding outlines in artwork and logos. The licences are in `brand/assets/typography/fonts/OFL-*.txt`.
- **Tools** (devDependencies): `paper` 0.12 (MIT, booleans and curve fitting), `opentype.js` 2.0 (MIT, outlining) and `sharp` (already present, PNG export).

---

## 2. The system

| Asset | Master | Use |
|---|---|---|
| **Primary wordmark** | `soma-wordmark.svg` (+ `-espresso`, `-bone`, `-oxblood`, `-black`, `-white`) | Every brand surface from 32 px cap height (about 128 px wide) upwards. |
| **Micro wordmark** | `soma-wordmark-micro.svg` (+ colourways) | Below 32 px cap height: app header (15–24 px tall), footers, email headers, favicons with a name, small print. |
| **Symbol (the S)** | `soma-symbol.svg` (+ colourways) | App icon, favicon, avatar, social profile, stamps, small spaces where the name is already present or implied. |
| **Lockup: descriptor** | `soma-lockup-descriptor.svg` | Brand introductions: decks, press, gift cards, onboarding covers. The descriptor is set to the wordmark's measure. |
| **Lockup: tagline** | `soma-lockup-tagline.svg` | Campaign end frames, splash, the brand book cover. Never together with the descriptor. |
| **Lockup: stacked** | `soma-lockup-stacked.svg` | Square and portrait formats: social, packaging, the splash screen. |
| **App icon** | `brand/assets/icons/**` | Oxblood tile with a Bone S (iOS, Android adaptive, PWA, favicon). |
| **Construction** | `soma-construction-clearspace.svg` | Reference only. |

Every master has a `currentColor` version (no suffix) for code, plus five fixed colourways. PNGs are in `final/png/` at @1x, @2x and @3x: the wordmark at 320/640/960 px, the micro wordmark at 160/320/480 px, the symbol at 96/192/288 px, the horizontal lockups at 400/800/1200 px and the stacked lockup at 240/480/720 px.

---

## 3. Construction, clear space and minimum sizes

### 3.1 The unit

**x = the main stem of the wordmark = 1/7 of the cap height** (100 units at a cap height of 700). Every rule below is expressed in x, so it scales with the logo.

- **Lines:** cap line, optical centre (350), baseline. O and S overshoot by 12 units; the A's apex and the M's vertex by 17.
- **Proportions:** the wordmark is 2796 × 700 units at cap height, so its width is 4.0 × the cap height. The micro master is 4.16 × the cap height.

### 3.2 Clear space

| Element | Clear space on every side |
|---|---|
| Wordmark (both masters) | **3x** = 0.43 × cap height |
| Symbol | **0.25 × symbol height** |
| Lockups | 3x of the wordmark inside them |
| App icon | Platform masks: the S takes 50 % of the tile height (iOS), 42 % of the 108 dp canvas (Android, inside the 66 dp safe circle) and 44 % of maskable PWA icons (inside the 80 % circle). |

Nothing enters the clear space: no text, edges, UI or busy image detail. Edges of the screen or the page count.

### 3.3 Minimum sizes

| Asset | Digital (CSS px) | Print |
|---|---|---|
| Wordmark, display master | 32 px cap height (≈ 128 px wide) | 30 mm wide |
| Wordmark, micro master | **12 px cap height (≈ 50 px wide)** | **15 mm wide** |
| Symbol | **16 px** tall (favicon cut: `SYMBOL_MICRO`) | 4 mm tall |
| Descriptor lockup | 260 px wide (descriptor cap ≥ 6 px) | 45 mm wide |
| Tagline lockup | 200 px wide | 40 mm wide |
| Stacked lockup | 64 px wide | 18 mm wide |

Header sizes in the product: the micro master at **15 px tall on mobile and 18 px from `lg`**. The header never uses the display master.

---

## 4. Colour versions and when to use each

| Version | Background | When |
|---|---|---|
| **Espresso** `#25211F` | Bone, Paper, Linen, Stone, light photography | Default everywhere. |
| **Bone** `#F3EFE8` | Espresso, Oxblood, dark photography (or a 62 % scrim) | Dark bands, the night scope, the app icon, the splash. |
| **Oxblood** `#542C35` | Bone or Paper only | Print and packaging: tissue, stickers, the gift card back. **Never in the product UI**: there, Oxblood belongs to the primary action. |
| **Black** `#000000` | White | One-colour print, newspaper ads, legal documents, fax. |
| **White** `#FFFFFF` | Black or photography | Embossing, foil, one-colour reversed print. |

**Contrast floor:** the logo is never placed where its colour falls below **4.5:1** against the background directly behind it. Espresso on Stone is 10.4:1, Bone on Oxblood is 10.2:1, and Taupe on Stone (1.8:1) is forbidden.

---

## 5. Placement

- **Product:** the micro wordmark sits top-left in the header, aligned to the content gutter (20/32/48 px) and centred on the header's height. Inside the product, the symbol replaces the wordmark only where the name is redundant: tab icon, avatar and notification badge.
- **Editorial and marketing:**
  - The wordmark sits top-left or centred, never at random positions.
  - On a hero it sits in the top third or on the clear part of the image, at no more than 40 % of the layout width. Bigger reads as decoration.
  - One logo per view. The footer may repeat the micro wordmark.
- **Pairing with the symbol:** use only the stacked lockup. Never place the symbol beside the wordmark in a line: the S would repeat.
- **Co-branding (hotels, partners):** the partner's logo sits to the right of the wordmark, separated by a 1 px Stone rule of cap height. The gap on each side is 3x. Both logos are optically the same height.

---

## 6. Backgrounds and photography

- **Calm zones first.** Place the wordmark on the quietest part of the image: a wall, sky, linen or shadow. If the zone is not calm, move the logo, crop differently, or put a flat **scrim** behind it. The scrim is Espresso-deep at 62 %, never a gradient, and gives Bone text at least 4.5:1 over a white pixel.
- **Light images:** Espresso wordmark. **Dark images:** Bone wordmark. Never Oxblood on photography.
- **The arch motif and the logo** never overlap: the logo sits outside the arch or in its lower straight section.
- **Moving image:** the wordmark appears at the end frame, settles (opacity 0 → 1, 8 px rise, 480 ms, `ease-arrive`) and stays. It is never animated letter by letter, never morphed and never looped.

---

## 7. Incorrect use

The examples are in `brand/assets/logo/misuse/` (SVG) and on `misuse-board.png`.

| File | Never |
|---|---|
| `01-stretched.svg` | Stretch, squash or scale non-proportionally. |
| `02-recoloured.svg` | Use colours outside § 4, gradients, or the retired v2 aura. |
| `03-effects.svg` | Add shadows, outlines, glows, bevels or glass. |
| `04-rotated.svg` | Rotate, slant, set on a path or in perspective. |
| `05-rearranged.svg` | Rearrange: symbol beside the wordmark, letters re-spaced, retyped in a font, lowercase, swapped S. |
| `06-low-contrast.svg` | Place with too little contrast (Taupe on Stone, 1.8:1). |
| `07-outlined.svg` | Use as an outline or keyline. |
| `08-busy-background.svg` | Place on a busy background without a calm zone or scrim. |

Also never:
- recreate the wordmark from a font;
- use the descriptor and tagline lockups together;
- animate the letters individually;
- crop the S or the wordmark at a frame edge (the arch motif crops photographs, not the logo).
