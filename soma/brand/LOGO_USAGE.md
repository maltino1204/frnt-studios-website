# SOMA: Logo usage

*Identity Designer · 1 Nov 2026 · v1.2.1 (Brand Audit 1: S im O, honest exploration record, favicon rim. Brand Audit 2: the Versatz, the seal for small iOS sizes. Brand Audit 3: the seal's badge-genre figure corrected, the people-test protocol extended; documentation only)*
*Masters: `brand/assets/logo/final/*.svg` (authoritative). Raster exports: `brand/assets/logo/final/png/`. Build: `node brand/tools/build-logo.mjs`.*

> **Pending client actions** (open after Brand Audit 3). The human tests decide whether Originality reaches 8. The trademark search blocks a public launch.
> 1. **Human tests O1b, O4a/O4b and O7** with at least 8 people outside the team. The protocol and pass/fail rule are in § 2.1, and the results go to `brand/audit/symbol-recall-test.md`. Until they pass, the mark's originality is argued, not proven.
> 2. **Trademark search (O6, with L4)** for the **word mark** "SOMA" *and* the **figurative mark** (the S im O with the Versatz). Use Vienna classes 27.5 (letters) and 26.1 / 26.3 (ovals), and Nice classes 35, 44 and 9/42, in DE and the EU. This is done by the client's lawyer, and the decision is logged in `PLAN.md`. "SOMA" is a working title until then.

The SOMA logo system has four parts: the **wordmark** (primary), the **symbol** (the S im O: the wordmark's S inside its O, whose halves are offset at the waist: the Versatz), the **secondary lockups** and the **app icon**. Every shape is a hand-built path. No font was used as raw material for the letterforms (§ 1.4).

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

### 1.1a An honest reading of the exploration (v1.1)

Brand Audit 1 was right: the three directions are **narrower than their names**.
- **B and C share a genre:** uppercase capitals with high contrast and vertical stress. B differs mainly by its serifs and the Didone S.
- **A** is a familiar geometric sans.
- None of them explores lowercase, a monolinear humanist mark or an ornamental monogram.

That narrowness was a conscious, not an accidental, choice, for three reasons:
1. The genre was effectively set before drawing began. The strategy asks for calm, hospitality-grade restraint ("sophisticated but approachable", no script, nothing overly feminine), and the photography is warm, analog and editorial. Lowercase or monolinear humanist marks read as tech or start-up (the retired v2 "soma"); script and ornament break the strategy.
2. The exploration was therefore a test of *how ownable this genre can become*. Its answer: not through the letters, which stay in a crowded genre, but through a construction that can be seen.
3. That construction became visible only in v1.1, in the **symbol** (§ 2.1), and that is where the identity's originality now lives.

If the client wants a broader comparison, a fourth direction outside the genre (lowercase humanist, monolinear) can be drawn with the same tools (`brand/tools/concept-*.mjs`). We recommend the symbol work instead, because it addresses the audit's finding directly.

### 1.2 Why C

- It is the only direction where an idea, not a style, carries the mark. *Sōma* is the body; the S is the O in motion. This gives the symbol (the S im O), the app icon and the motif (the O's arch) one shared source.
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
| **Symbol (the S im O with Versatz)**, line cut | `soma-symbol.svg` (+ colourways): groups `symbol-o`, `symbol-s` | From 32 px: app icon, avatar, social profile, stamps, splash, the stacked lockup; small spaces where the name is already present or implied. |
| **Symbol, seal cut** | `soma-symbol-solid.svg` (+ colourways) | Below 32 px: favicon, browser tabs, the admin tile, small stamps. The O is filled and the S set into it (knocked out). |
| **Lockup: descriptor** | `soma-lockup-descriptor.svg` | Brand introductions: decks, press, gift cards, onboarding covers. The descriptor is set to the wordmark's measure. |
| **Lockup: tagline** | `soma-lockup-tagline.svg` | Campaign end frames, splash, the brand book cover, the site footer sign-off (wordmark with the tagline beneath; part of the logo, so it does not count as the page's italic clause, guidelines § 4.4). Never together with the descriptor. |
| **Lockup: stacked** | `soma-lockup-stacked.svg` | Square and portrait formats: social, packaging, the splash screen. |
| **App icon** | `brand/assets/icons/**` | Oxblood tile with the Bone S im O (iOS light/dark/tinted, Android adaptive + monochrome, PWA any + maskable); favicon = the seal with a Bone rim. |
| **Launch** | `brand/assets/splash/**` | Launch screen (stacked lockup in Oxblood on Bone), iOS startup images, the animation in which the mark draws itself (`SPLASH.md`). |
| **Construction** | `soma-construction-clearspace.svg` | Reference only. |

Every master has a `currentColor` version (no suffix) for code, plus five fixed colourways. PNGs are in `final/png/` at @1x, @2x and @3x: the wordmark at 320/640/960 px, the micro wordmark at 160/320/480 px, the symbol at 96/192/288 px, the seal at 32/64/96 px, the horizontal lockups at 400/800/1200 px and the stacked lockup at 240/480/720 px.

---

### 2.1 The symbol: the S im O, with the Versatz (v1.2)

**Idea.** The S of the wordmark (the body) sits inside the O of the wordmark (the place): *Your body. Your place.* in one sign, and the first two letters of the name.

**The ownable detail (v1.2, Brand Audit 2, O5): the *Versatz*.**
- The O is cut at its waist, and its two halves slide against each other by **one hairline each**: the upper half to the left, the lower half to the right.
- These are the shoulders against the hips of *contrapposto*, the same gesture as the S the O holds, whose upper bowl leans left and lower bowl right.
- The result is two small shoulders at the waist, one on each side. They are calm, architectural and exact: an S typed into an oval cannot have them.
- In the seal cut, the same Versatz gives the silhouette two notches at the waist. Against its own genre, filled S badges, this moves the seal away from the genre but not out of it (see the correction below). At 16–32 px the seal is still close to "a white S on a dark oval, with two notches".

**Construction** (`brand/tools/final.mjs` → `MARK`, `versatz()`, `symbolMark()`):
- **O:** the wordmark's O, outer contour rx 332, ry 362 (tensions 0.57 / 0.585).
  - In the line cut it is a ring with stems 108 and hairlines 40.
  - **Versatz:** cut at y = 0, the upper half moves −40 and the lower half +40 (40 = the O's hairline). The overlap of the stems at the waist stays at 28 units, so the ring is one continuous shape.
  - The mark measures 744 × 724 units.
- **S:** the wordmark's S at symbol weight (stems 120, hairlines 46), 446 units tall (62 % of the O), at 96 % width, centred.
- **Seal cut** (< 32 px): the O filled and the same Versatz, with the S (stems 156, hairlines 82, 444 tall, 98 % width) knocked out.
- **Favicon:** the seal in Oxblood with a Bone S and a 1 px Bone rim that follows the Versatz outline. The rim gives 14.0:1 against `#202124` and 10.5:1 against `#35363A`, and it vanishes into light tab bars.

**Overlap tests, before and after** (`concepts/symbol-studies-3.png`, `.json`; generator `brand/tools/build-symbol-studies.mjs`):
- *Serif S:* IoU against the S of Bodoni Moda, Newsreader, Gloock, Playfair Display and Libre Bodoni. Silhouettes are normalised to the same height, 512 px, best of five shifts.
- *Generic monograms:* **the auditor's method**, replicated in `brand/tools/lib/genre-iou.mjs` from `brand/audit/scripts/audit-2/s-in-o-compare.cjs`. It renders, trims, resizes to 240 × 262 "fill" and computes IoU against:
  - an even oval ring with a typed Bodoni Moda, Gloock and Newsreader S;
  - the circled-S glyph U+24C8;
  - the SOMA O ring with a typed S.
- The replica reproduces the auditor's figures for v1.1 exactly: 0.49 / 0.52 / 0.83 / 0.71.

| Mark | Serif S (max.) · target < 0.35 | Generic S-in-oval (max.) · target < 0.35 | SOMA O + typed S (max.) · target ≤ 0.65 |
|---|---:|---:|---:|
| Control: the S (v1.0) | 0.52 | 0.26 | 0.32 |
| S im O (v1.1) | 0.24 | **0.52** ✗ | **0.83** ✗ |
| **S im O with Versatz (v1.2), line cut** | **0.19** ✓ | **0.31** ✓ | **0.44** ✓ |
| Seal with Versatz (v1.2), < 32 px | 0.26 ✓ | 0.24 *(against rings: the wrong genre for a solid, see below)* | 0.39 ✓ |

**Correction: the seal against its own genre** (Brand Audit 3, N10). The 0.24 above compares the *filled* seal with *rings*, so it overstates how distinct the seal is. A solid oval is the right comparison: a filled even oval with a white serif S. The auditor measured it in `brand/audit/scripts/audit-3/s-in-o-compare3.cjs`, with the results in `genre-iou-a3.json`; the figures are fill IoU, with the aspect-preserving value in brackets.

| Mark | Filled oval + white Bodoni Moda S | Filled oval + white Gloock S |
|---|---:|---:|
| Seal v1.1 (no Versatz) | 0.85 (0.85) | 0.88 (0.88) |
| **Seal v1.2 (Versatz)** | **0.71** (0.72) | **0.73** (0.75) |
| Line cut v1.2, for comparison | 0.41 (0.38) | 0.39 (0.38) |
| *Baseline: one generic badge against another* | *0.92* | |

- **Both statements hold.** Against rings, the seal is far from the generic monogram (0.21–0.26). Against filled badges, which is how it is seen at 16–32 px (favicon, tabs, Admin tile, iOS 20/29), it sits at **0.71–0.75**: below the badge-to-badge baseline of 0.92, but inside the genre.
- No IoU target is claimed for the seal against badges. Whether its two notches and SOMA's S are enough is a question for people: the badge line-up **O4b** and the association question **O7** below.
- `concepts/symbol-studies-3.png` / `.json` predate this correction and show the ring figure only. This round is documentation only, so they were not rebuilt.

**Rejected in this round:**
- **Vertical Versatz** (the left half up, the right half down; the literal construction of the S): the O falls apart into two brackets, and at 24 px it reads as a swirl.
- **The same with a connecting stem:** it reads as a dollar sign ($).
- **The v1.1 study "Versatz"** (studies 2) was different: two *separate* half-rings forming an S, without an S inside. It read as a sync arrow. The v1.2 Versatz keeps the O whole and moves it by only one hairline.

**Legibility.** I checked the line cut at 32 px and the seal at 16 and 24 px on light, dark and Oxblood (`previews/icons-check.png`, `concepts/symbol-studies-3.png`):
- At 16 px the seal reads as an S in a shouldered oval.
- The shoulders become a 1 px notch: present, never noisy.
- Below 32 px, the line cut is not used; the small iOS sizes (20 and 29 px) use the seal (Brand Audit 2, N5).

**Human tests O1b, O4a, O4b and O7: pending client tests.** No script can run them.

*Setup:*
- **Who:** at least **8 people outside the team.** Nobody from SOMA, the agency or this project, and nobody who has seen the mark. Mix ages 25–55 and genders. Colleagues or friends of the client are fine; a paid panel needs client approval.
- **How:** one unmoderated session of about 10 minutes per person, on a phone, in the order below.
- **Records:** write raw answers, picks and photos of drawings, unedited, to `brand/audit/symbol-recall-test.md`.
- **Tiles:** generate the line-up tiles with the shapes in `brand/tools/lib/genre-iou.mjs` and the auditor's `s-in-o-compare3.cjs` (the filled-badge references), in the same colours and size as the SOMA tile. Show the tiles in random order.

| Test | Procedure | Pass (8 people; with more, the same share) |
|---|---|---|
| **O1b**, 5-second recall | Show the iOS app icon (`icons/ios/AppIcon-1024.png`, displayed at 120 px) for 5 s. Then ask: "Describe or draw what you saw." | **≥ 6 / 8** recall a feature beyond "an S": the oval or O, the step, the shoulders or the shift, or "SO". |
| **O7**, unwanted associations (part 1) | Directly after O1b, before any line-up, ask: "Did anything look wrong, or remind you of something?" Ask no leading follow-up. | **≤ 2 / 8** answer with any of: a *broken, misprinted or misaligned O*; *refresh, sync, reload, arrows or recycling*; a *dollar sign*. Record every other association as well (yin-yang, a coin, a brand name …). |
| **O4a**, line-up against rings (line cut) | Six Oxblood tiles at 120 px: the SOMA app icon and five generic "serif S in an even Bone ring" icons (Bodoni Moda, Gloock, Newsreader, Playfair Display, Libre Bodoni). Show them for 5 s, then give 1 minute of distraction. Show them again in a new order and ask: "Which one did you see first? Which one is SOMA?" | **≥ 6 / 8** pick SOMA. |
| **O4b**, line-up against filled badges (seal) | The same procedure, at the seal's real size: six tiles at **32 px** (and again at 16 px in a mock browser tab, light and dark). The tiles are the SOMA seal (Oxblood with a Bone S) and five **filled even ovals in the same Oxblood with a Bone serif S** (the same five fonts, with the S height matched to the seal's 444 / 724). | **≥ 6 / 8** pick SOMA at 32 px. At 16 px the result is recorded, but it does not gate the test. |
| **O7** (part 2) | After O4b, show the SOMA seal alone at 32 px and ask the O7 question again. | **≤ 2 / 8**, as in part 1. |

*Decision:*
- **Pass:** O1b, O4a, O4b and O7 (both parts) each pass with the same people. The mark is then final; the auditor has committed to Originality 8 on that result (Brand Audit 3).
- **Fail:** if any one test fails, apply the **fallback**:
  1. Increase the Versatz to **1.5 hairlines (60 units per half)**. In `final.mjs`, set `MARK.shift = 60`; keep the S's clearance at ≥ 0.3 stem. The generic ring IoU then drops to about 0.29.
  2. Rebuild everything: `build-logo.mjs final`, `build-icons.mjs`, `build-splash.mjs`, `build-symbol-studies.mjs`, `build-kit-data.mjs`. Sync `logo.tsx`, `public/brand`, `src/app` and `public/splash`.
  3. Re-run the failed tests with **8 new people**.
- **Exception:** if O7 fails mainly on *sync, refresh or arrows*, a larger offset would make that worse. Do not apply the fallback; return the raw answers to the Identity Designer instead.

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
| App icon | Platform masks: the mark (744 × 724 units with the Versatz) takes 62 % of the tile height (iOS from 40 px, apple-touch, Play Store), 50 % of the 108 dp canvas (Android adaptive; the 55.5 × 54 dp mark, 56.7 dp at its widest diagonal, sits inside the 66 dp safe circle) and 56 % of maskable PWA icons (59 % diameter, inside the 80 % circle). The PWA "any" icon is 64 % on a tile with a 112/512 radius. The iOS 20 and 29 px icons use the seal at 70 % (§ 3.3). |

Nothing enters the clear space: no text, edges, UI or busy image detail. Edges of the screen or the page count.

### 3.3 Minimum sizes

| Asset | Digital (CSS px) | Print |
|---|---|---|
| Wordmark, display master | 32 px cap height (≈ 128 px wide) | 30 mm wide |
| Wordmark, micro master | **12 px cap height (≈ 50 px wide)** | **15 mm wide** |
| Symbol, line cut | **32 px** tall | 8 mm tall |
| Symbol, seal cut | **16 px** tall (favicon, iOS 20 and 29 px icons, everything under 32 px) | 4 mm tall |
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
- **Pairing with the symbol:** use only the stacked lockup (the S im O over the wordmark). Never place the symbol beside the wordmark in a line: "SO" would repeat the first two letters.
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
| `05-rearranged.svg` | Rearrange: symbol beside the wordmark in a line, letters re-spaced, retyped in a font, lowercase, swapped S; the S taken out of the O, or the O used as a frame for other letters. |
| `06-low-contrast.svg` | Place with too little contrast (Taupe on Stone, 1.8:1). |
| `07-outlined.svg` | Use as an outline or keyline. |
| `08-busy-background.svg` | Place on a busy background without a calm zone or scrim. |

Also never:
- recreate the wordmark from a font;
- use the descriptor and tagline lockups together;
- animate the letters individually;
- crop the S or the wordmark at a frame edge (the arch motif crops photographs, not the logo).
- remove, exaggerate or reverse the Versatz: the upper half always sits left, the lower half right, by one hairline (40 units). Never redraw the mark as an even ring, never use a vertical split.
