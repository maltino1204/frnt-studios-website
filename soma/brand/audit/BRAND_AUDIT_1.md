# SOMA brand identity: Independent Brand Audit 1

*Independent Brand Auditor · phase B3 · 1 Nov 2026 · audits the state after B1 (strategy, identity) and B2 (photography, applications, app migration).*
*Evidence folder: `brand/audit/brand-audit-1/` (renders, live screenshots, crops). Paths below are relative to `soma/`.*
*Method: read every brand document; rendered the SVG masters with `sharp` at 12–32 px and large on light and dark; inspected all application artwork; drove the production build on :3100 with Playwright at 390×844 (dsf 2) and 1440×900 as a guest, as `testkunde@`, `testkunde-b2b@` and `testadmin@`. For accessibility I computed contrast for every visible text node on 15 live screens (about 1,000 nodes), checked focus, sizes, targets and state semantics, and recomputed the key contrast claims myself. Server status: :3100 was up for the whole audit, with no console errors on the public pages.*

---

## 1. Executive summary

SOMA now has a coherent, well-crafted and well-documented foundation:
- a warm, accessible colour system that is applied with real restraint;
- a strong type system that stays within its font budget;
- clean SVG masters that the product uses byte for byte;
- a truthful *du* voice;
- a customer checkout that is among the best parts of the system.

The B2 migration is complete in the product, and the customer, Pro and Admin experiences share one visual language.

**The identity does not yet meet the brief's bar of 8/10 in every category.** It scores **6 to 9**, with four dimensions below 8. In brief:
- **Originality (6), memorability (7) and long-term relevance (7) are limited by the same cause.** The visible identity follows the dominant 2023–26 "quiet luxury" look: bone and espresso neutrals, high-contrast serif-less capitals, a serif headline with an italic accent clause, and arch-cropped photos. The ownable idea (the S built from the two halves of the O, *contrapposto*) is not visible in the artwork: the symbol reads as a well-drawn letter S.
- **Cross-platform consistency (7) has concrete gaps:**
  - the brand book shows the retired v1 photos with spa clichés and fake lettering;
  - the custom icons and the arch-check glyph exist in the applications but not in the product;
  - the e-mail preview shows brand fonts that recipients will never see.
- **There is one truth and compliance issue that blocks any external use.** AI-generated faces appear in the product next to names, star ratings and the *Verifiziert* badge, with no "Foto KI-generiert" label. The brand's own photography rules forbid exactly this.

**Verdict: not approved yet.** Fix the P0 and P1 items in § 8, then run Audit 2. Most fixes are small and targeted. Originality is the one dimension that needs design work rather than fixes.

---

## 2. Scores

| # | Dimension | Score | Target | One-line reason |
|---|---|---:|---:|---|
| 1 | Originality | **6** | 8 | Well executed, but the visible language is the current premium-wellness default. The S/O idea is not perceivable, and the symbol is a plain letter S |
| 2 | Visual sophistication | **8** | 8 | Refined product UI, applications and gift card. The brand book's photos, the 9:16 ad compositions and SaaS residue on the home page hold it back |
| 3 | Brand memorability | **7** | 8 | The Ortszeile and the offset arch pair stick; the wordmark and the S do not, at a glance |
| 4 | Typography | **8** | 8 | Excellent system and budget, kept in production. The one-serif rule is broken often, text drops below the 12 px floor, and a third family appears on a customer page |
| 5 | Logo scalability | **8** | 8 | The micro master and the favicon cut hold at 12–16 px. On dark tab bars the favicon tile disappears; the stacked lockup repeats the S |
| 6 | Colour coherence | **9** | 8 | Verified ratios, and exactly one Oxblood element on every live screen measured. Functional colours are harmonised and distinct from Oxblood |
| 7 | Digital usability | **8** | 8 | Clear search → profile → checkout, a helpful error state, the Start-Code. KPI sparklines, count-up numbers and card layouts weaken it |
| 8 | Accessibility | **8** | 8 | No real contrast failure across about 1,000 measured text nodes; visible focus; status as a word plus an icon. Sub-12 px text, chips without the specified check, an untagged PDF |
| 9 | Cross-platform consistency | **7** | 8 | Product, Pro and Admin are consistent. The brand book, icons, confirmation glyph, e-mail and AI labelling diverge between the product and the applications |
| 10 | Long-term relevance | **7** | 8 | The strategy, voice and token system will last. The visual surface leans on trend markers, and SaaS residue (cursor glow, count-ups, feature grids) remains |

**Average 7.6. Gate (≥ 8 in all ten): not met.** No score is 10: none is backed by evidence strong enough for it.

---

## 3. Per-dimension findings

### 3.1 Originality: 6

**Evidence**
- **Wordmark** (`brand/assets/logo/final/soma-wordmark.svg`, render `logo-wordmark-large.png`):
  - Elegant, high-contrast serif-less capitals, with an M that has an offset vertex and thin diagonals.
  - Well drawn, but this genre of high-contrast capitals without serifs is a common fashion and beauty look. Nothing in the letters is unexpected.
- **Symbol** (`soma-symbol.svg`, `logo-symbol-large.png`):
  - The S/O *contrapposto* construction is documented, but it cannot be seen. At any size the mark reads as a letter S.
  - I compared the silhouette with the S of four serif typefaces (`originality-s-vs-generic-didone.png`). The SOMA S overlaps 0.37–0.52 (IoU) with Bodoni Moda, Newsreader and Gloock. Those typefaces overlap each other 0.52–0.56.
  - So the S is its own drawing, roughly as different as one typeface is from another. But it has no feature that is not a letter feature, and nothing signals "brand mark" rather than "font".
  - In the app-icon board (`applications/app-icons/app-icons-board.png`), a single letter on a coloured tile is the most generic app-icon device there is.
- **Exploration** (`assets/logo/concepts/concepts-overview.png`):
  - Directions B and C are close siblings: both are high-contrast capitals, and B adds serifs.
  - A is a familiar geometric sans. The brief asked for three *distinct* directions; the exploration is narrower than the scoring table suggests.
  - The more ownable symbol studies were discarded: "Siegel: S im O" and "Verschobenes O" (`symbol-studies.png`).
- **Motif:**
  - Arch-cropped imagery is a widespread wellness and interior trend. SOMA's derivation from the O is a good rationale, but the viewer cannot see it.
  - The *offset pair* (home hero, `live-home-1440.png`) is more distinctive than the single arch.
- **Palette:** client-given, and close to the current "quiet luxury" neutrals.
- **Ownable and strong:**
  - the **Ortszeile** (*Altbau, 3. OG · Berlin-Prenzlauer Berg · 19:30*): a verbal and visual signature that no competitor has;
  - the Start-Code as a brand moment (`live-buchung-detail-390-full.png`, story 03);
  - "Du bleibst. Dein Profi kommt.";
  - truth used as design material (total price, a dated deadline).

**Remediation (required, the score is below 8)**

| # | Task | File(s) | Expected result | Verify |
|---|---|---|---|---|
| O1 | Make the construction visible in the symbol. Develop 3 refined options from the S/O idea, for example the S with a visible "shift" at the spine where the two O-halves meet, the S inside the O-oval (the discarded "Siegel"), or a negative-space S cut from the O. Keep the current S as the control | `brand/tools/final.mjs`, `lib/s.mjs` → `brand/assets/logo/concepts/symbol-studies-2.png` | One option that a viewer describes as "the SOMA mark", not "an S" | (a) IoU of the new symbol against Bodoni Moda / Newsreader S < 0.35 *and* at least one non-letter feature; (b) 5-second test with ≥ 8 people: ≥ 6 recall a feature beyond "an S"; (c) still legible at 16 px (render as in `favicon-light-x6.png`) |
| O2 | Promote the **offset pair + Ortszeile** to a fixed signature unit with its own rules (offset 18 %, Ortszeile under the left arch, tabular time). Use it in every campaign format, including all 15 ads, which currently contain no arch at all | `brand/BRAND_GUIDELINES.md` § 5.1, `brand/applications/_src/ads.mjs` | A new "Signature" sub-section; every 1080 ad format carries the pair or a single arch with an Ortszeile | Visual check of `applications/ads/*/board.png`: arch or pair present in 1080×1080, 1080×1920 and 1200×628 |
| O3 | Re-document the exploration honestly: either add a fourth, genuinely different direction (for example a lowercase or a monolinear humanist mark), or state in `LOGO_USAGE.md` § 1.1 that B and C share a genre and why that was acceptable | `brand/LOGO_USAGE.md`, `concepts/` | A comparison that a client can trust | Read-through: the three directions differ in genre, not only in serifs |

**From 6 to 9 (after the above):** give the M or A one ownable detail that survives at 18 px (for example the M's offset vertex, made deliberate and repeated in the A's apex), so that the wordmark is recognisable without its S.

### 3.2 Visual sophistication: 8

**Evidence for the 8**
- Product screens are calm, precise and premium:
  - home hero with the offset arch pair (`live-home-1440.png`);
  - profile (`live-profil-390.png`);
  - checkout (`live-buchen-1440.png`) and booking detail (`live-buchung-detail-390-full.png`);
  - Pro calendar (`live-pro-kalender-1440.png`).
- The social grid (`applications/social/instagram-grid-preview.png`), the gift card (`giftcard/board.png`) and the onboarding PDF (`onboarding-p1-4.png`, `-p5-7.png`) are editorial work of a high standard.
- The v2 photography grade sits inside the palette.

**What holds it at 8**
- The brand book shows the retired v1 photos (§ 3.9).
- In the 9:16 ads, the bottom 20–25 % is empty Bone (`ads/b-zimmer-614/b-zimmer-614-1080x1920.png`, and the same in A and C). The headline sits about 30 px under the photo edge. The layout reads unfinished.
- In 9:16 ad B, the wordmark straddles the window frame and the curtain: a busy background, the case `LOGO_USAGE.md` § 6 forbids.
- On the home page, the "Vertrauen" section is a four-card feature-icon grid with large empty card bottoms (`home-trust-feature-grid-1440.png`). That is the SaaS pattern the strategy bans (§ 10.7). The page will be rebuilt, so this goes into the landing spec as a no-go.
- The right half of the `/fuer-profis` hero is sparse: three floating mock cards on empty Bone (`fuer-profis-hero-live-mock-1440.png`).

**From 8 to 9:**
- Fix the brand book images (P0-2).
- Recompose the 9:16 ads: headline and CTA inside the bottom safe zone, and no empty third.
- Place the wordmark on calm zones only.
- Write the feature-grid ban into `docs/landing/LANDING_DESIGN_SPEC.md`.

### 3.3 Brand memorability: 7

**Evidence**
- Memorable:
  - the Ortszeile under every key image;
  - the offset arch pair;
  - the Oxblood band with the S and the tagline (`/kit/marke` § 6, social post 05);
  - the four-digit Start-Code moment.
- Not memorable at a glance: the wordmark and the symbol (§ 3.1). Small renders (`logo-wordmark-micro-light-small-x4.png`) show a clean but generic set of capitals.
- The brand's most distinctive small devices are missing from the product:
  - the arch-check glyph (comps and e-mail only, `email-light-680.png`; the product shows a generic green check circle, `live-buchung-detail-390-full.png`);
  - the custom place and category icons (§ 3.9).
- Repeated brand moments are the main driver of memorability, so these gaps cost points.

**Remediation (required)**

| # | Task | File(s) | Expected result | Verify |
|---|---|---|---|---|
| M1 | Ship the **arch-check glyph** wherever something is confirmed: booking confirmed, request accepted (Pro), Profi approved | `src/app/(checkout)/buchung/[id]/page.tsx` (replace the `SuccessCheck` circle), Pro request acceptance; asset `brand/applications/email/assets/arch-check-*` → a React component in `src/components/brand/` | The same glyph in the product, the comp (`booking-confirmation/board.png`) and the e-mail | Screenshot of `/buchung/<id>` at 390 matches the comp; grep shows no `SuccessCheck` on the confirmation screen |
| M2 | Ship the **10 custom icons** in the product | New `src/components/brand/icons.tsx` from `brand/assets/iconography/custom/*.svg`; replace Lucide `House`, `Hotel`, `Building2` in `src/app/(site)/page.tsx:238–240`, `src/components/site/checkout-form.tsx`, `account-addresses.tsx`; category icons in service cards and filters | Places and categories use the arch-door and fingertip icons everywhere | `grep -nE "\b(House|Hotel|Building2)\b" src/app/(site)/page.tsx src/components/site/checkout-form.tsx src/components/site/account-addresses.tsx` returns nothing; screenshots |
| M3 | After O1: use the new symbol in the app icon, avatar and splash, and add the "S draws on" brand animation (`MOTION.md` § 4) to the PWA splash or first load | `brand/assets/icons/**`, `src/app/manifest.ts` | The mark is seen in motion once per session | Screen recording at 390; reduced motion shows the final frame |

**From 7 to 9:** O1 + M1 + M2, and the Ortszeile in every product editorial slot (it is already on the home page and in `/anmelden`).

### 3.4 Typography: 8

**Evidence for the 8**
- The pairing is harmonious (`assets/typography/pairing-newsreader-instrument-sans.png`):
  - Newsreader Display opsz 72 for display;
  - Instrument Sans with a real width axis;
  - tabular figures and German formatting with non-breaking spaces.
- Fluid `clamp()` scale from 360 to 1440 px, rendered on `/kit/marke` (`kit-marke-typescale-1440.png`).
- **Budget measured live** on `/` and the profile:
  - 2 preloaded files, Instrument Sans latin 56 KB + Newsreader roman 21 KB = 77 KB;
  - 99 KB with the italic;
  - limit: 2 files and 150 KB. Met.
- Licences: OFL files are in `brand/assets/typography/fonts/` and `src/styles/fonts/`.

**What holds it at 8**
- **"One serif statement per view" (guidelines § 4.4) is broken on several screens:**
  - `/konto`: "Guten Abend, Julia." plus "Morgen";
  - `/anmelden`: "Willkommen zurück." plus the serif tagline line;
  - home: the section headline plus three serif testimonial cards in one viewport;
  - search and profile cards set names in the serif while § 4.4 says "app screens are sans only".

  Either the rule or the product is wrong.
- **Text below the 12 px floor (§ 9.4), measured:**
  - bottom-nav labels: 11 px;
  - count badges: 11 px;
  - Pro request chips: 11.5 px;
  - booking references in DM Mono on `/pro/einnahmen`: 10.5 px;
  - the demo password on `/anmelden`: 10.5 px.

  § 9.2 itself specifies 11 px bottom-nav labels, so the documents contradict each other.
- **A third family on a customer page:** DM Mono loads on `/anmelden` (9 KB) for the demo password. The guidelines restrict it to `/pro` and `/admin`.
- **E-mail:** the HTML has no `@font-face`. Recipients see Georgia or Times for the serif title and a system sans. The shipped `email/preview-*.png` were rendered *with* the brand fonts (compare `brand/audit/brand-audit-1/email-light-680.png` with `applications/email/preview-light-680.png`).
- In the Pro calendar, long service names truncate ("Entspannungsmass…") instead of switching to `condensed` first (§ 4.4).

**From 8 to 9:**
- Decide the serif rule (for example "one serif *headline* per view; names in cards may use the serif") and make the product match.
- Raise the 11 px and 10.5 px text to 12 px.
- Set the demo password in Instrument Sans with tabular figures.
- Define an e-mail font stack (`BRAND_GUIDELINES.md` § 10) and re-render the previews without webfonts.
- Apply `condensed` to calendar events.

### 3.5 Logo scalability: 8

**Evidence for the 8**
- **SVG masters:** I checked all 68 SVG masters under `assets/logo`, `icons`, `motif` and `iconography` programmatically:
  - each has a `viewBox` and a `<title>`;
  - none contains `<text>`, `<image>`, base64 or `font-family`;
  - every shape is an outlined path.
- **Small sizes:**
  - **micro wordmark** at 12, 15, 18 and 24 px: holds on light and dark; the hairlines stay visible (`logo-wordmark-micro-*-small-x4.png`);
  - **display master** at 12–16 px: thins as documented, and the rules forbid that use;
  - **favicon cut** at 16, 24 and 32 px, including the shipped `favicon-16.png` and `favicon-32.png`: the S is legible at 16 px (`favicon-light-x6.png`, `favicon-dark-x6.png`).
- **The product uses the masters exactly:**
  - `public/brand/*.svg` are identical to `brand/assets/logo/final`;
  - `src/app/icon.svg` and `favicon.ico` are identical to `assets/icons`;
  - the paths in `src/components/brand/logo.tsx` match the masters;
  - the header wordmark measures 15 px tall at 390 and 18 px at 1440, as specified.
- App icons for iOS (light, dark, tinted), Android (adaptive, monochrome) and PWA maskable are present and correct (`icons-masters-256.png`).

**What holds it at 8**
- **Favicon on dark tab bars:** the Oxblood tile against `#202124` is **1.37:1**. Only `favicon.svg` adds a dark-mode rim (`#8F5E69`, 3.05:1). The `.ico` and PNGs have none, so the tile shape disappears.
- **The stacked lockup** sets the S above "SOMA", so the S appears twice. `LOGO_USAGE.md` § 5 rejects a repeated S beside the wordmark, but accepts it stacked; the argument is thin.

**From 8 to 9:**
- Add a 1 px lighter rim (≥ 3:1 against `#202124` and `#35363A`) to `favicon.ico`, `favicon-16/32/48.png` and `apple-touch-icon.png` (`brand/tools/build-icons.mjs`). Verify by rendering on `#202124`.
- Test a stacked lockup with the new symbol from O1, so that the two marks are no longer both an "S".

### 3.6 Colour coherence: 9

**Evidence**
- **I recomputed the key ratios; all match `DESIGN_TOKENS/contrast.md`:**

  | Pair | Ratio |
  |---|---|
  | Espresso on Bone | 13.92 |
  | Bone on Oxblood | 10.24 |
  | umber-deep on Stone | 4.73 |
  | taupe-deep on Bone | 3.66 |
  | taupe-deep on Stone | 2.72 (correctly marked fail) |
  | vermilion vs Oxblood | 1.80 (distinct hue and lightness) |
  | Oxblood on Espresso | 1.36 (correctly rejected) |

- **Oxblood restraint, measured on the live DOM:** I counted the elements with an Oxblood background, text or border:

  | Screen | Oxblood elements |
  |---|---|
  | `/` | 1 (the search CTA) |
  | `/profis/…` | 1 ("Termin wählen") |
  | `/buchen` | 1 ("Zahlungspflichtig buchen · 69 €") |
  | `/anmelden` | 1 |
  | `/konto`, `/konto/termine`, `/buchung/[id]`, `/suche`, `/hilfe` | 0 |
  | `/pro` | 2 chart bars (an allowed chart series) |
  | `/admin` | 0 |

  On `/fuer-profis` there is 1 CTA plus 6 demand bars further down (a chart series, in a different viewport).
- **Never an error:** error and destructive states use vermilion `#B3261E` with an icon and a word (`live-anmelden-error-390.png`, `live-suche-empty-390.png`).
- Applications keep one Oxblood moment each: one brand post per grid of nine, the ad CTA, the gift card front, the onboarding safety panel. The e-mail swaps Oxblood for Bone in dark mode (`email-dark-680.png`).
- The photo grade keeps Oxblood out of the photographs.

**Not 10 because**
- On error screens a vermilion error sits directly above the Oxblood CTA (`live-suche-empty-390.png`): two reds adjacent. Icons and words make it compliant, but the signal is weaker than it should be.
- A 4 % Espresso radial "spotlight" glow follows the cursor on `/fuer-profis` and `/pro/profil` (`src/styles/tokens.css` 878–890). It is a gradient effect the identity disowns.
- In SOMA Pro, a weekly earnings drop is shown as a red danger pill ("−59,2 %"), which is alarm styling for a business fluctuation.

### 3.7 Digital usability: 8

**Evidence for the 8**
- The flow search → profile → checkout is clear:
  - filters with `aria-pressed`;
  - slots as named links ("Mi., 4. Nov. 09:00 Uhr bei Hanna B. buchen");
  - a stepper with a "done" state;
  - a sticky mobile CTA with the legal wording;
  - total price and dated free cancellation next to the CTA;
  - the zero-tolerance note in the massage checkout (`live-buchen-*.png`).
- Error copy explains and guides ("Die Postleitzahl 99999 kennen wir nicht. Bitte prüf die Eingabe.").
- Booking detail: the Start-Code, the timeline and the cancellation tiers as words.
- SOMA Pro: requests with deadlines, Annehmen/Ablehnen, commission and travel stated per request.

**What holds it at 8**
- **Numbers count up** (`CountUp`) for money, ratings and counts:
  - `src/components/site/discovery-proof.tsx` (home 4,7 ★ / 27 / 6);
  - `src/components/pro/stats.tsx` (earnings);
  - `src/app/konto/guthaben/page.tsx`;
  - `src/app/admin/page.tsx` and `src/app/admin/zahlungen/page.tsx`.

  `MOTION.md` and guidelines § 8 say "numbers never count up" and "prices appear final".
- **Pro and Admin KPI cards** carry sparklines with no axis or legend; for example "Bevorstehend 6" has a wave whose meaning is unclear (`live-pro-390.png`).
- The profile's sticky bar shows "89 € zzgl. Anfahrt" before a postcode is known. It is truthful, but softer than the brand promise "Endpreis inkl. Anfahrt". An inline postcode prompt in the bar would keep the promise.
- Equal-height cards leave large empty areas (home trust cards, `/fuer-profis` step cards).

**From 8 to 9:**
- Remove `CountUp` from money and ratings (keep it, if at all, in Admin only).
- Give sparklines a label ("letzte 8 Wochen") or remove them.
- Add a postcode field to the profile sticky bar.
- Fix the card heights.

### 3.8 Accessibility: 8

**Evidence for the 8**
- **Computed contrast on real screens:** the script walked every visible text node and computed the foreground against the composited background chain:
  - 15 screens: home, search, profile, `/fuer-profis`, help, sign-in, account, appointments, checkout, Pro (×3) and Admin (×2);
  - **0 genuine failures**. The 7 hits were false positives: text over sliding segment indicators, and collapsed accordions at opacity 0.
- **Focus:** keyboard focus shows a 2 px Oxblood ring with a 2 px offset (`a11y-focus-ring-checkout-390.png`), as specified.
- **Status is never colour alone:**
  - pills are a dot plus a word ("Bestätigt", "Angefragt", "Anfrage");
  - notices have an icon and a word;
  - cancellation tiers are dot plus text;
  - deltas have an arrow and a sign;
  - unavailable dates are struck through.
- **Semantics:** filters use `aria-pressed`, slots have descriptive `aria-label`s, `lang="de"`, and there is a skip link.
- `CountUp` respects `prefers-reduced-motion`; reduced motion is honoured in the tokens CSS and in the specimen.

**What holds it at 8**
- Sub-12 px text (§ 3.4), against the system's own floor.
- **Selected chips have no check icon** ("Ganzer Tag", "Alle Preise" on `/suche`). Guidelines § 9.3 require one, and `/kit/marke` shows it. The fill inversion and `aria-pressed` make this compliant, but it does not meet the spec.
- **The onboarding PDF is untagged** (`pdfinfo`: Tagged no): no reading order or structure for screen readers. Instrument Sans is embedded as Type 3.
- The Instagram AI label is 14 px on a 1080 canvas, about 5 px on a phone.

**From 8 to 9:**
- Fix the 12 px floor.
- Add the chip check (`src/components/ui` chip/segmented).
- Export a tagged PDF (Playwright `page.pdf({ tagged: true, outline: true })` in `brand/applications/_src/onboarding.mjs`). Verify with `pdfinfo` → `Tagged: yes`.
- Raise the social AI label to ≥ 20 px.

### 3.9 Cross-platform consistency: 7

**Evidence for the strengths**
- Product, SOMA Pro and Admin share tokens, the micro wordmark, pills, notices and type.
- `brand/DESIGN_TOKENS/tokens.css` is **identical** to `src/styles/tokens.css`.
- Social, ads, gift card, onboarding and e-mail share the grid, type and the one-Oxblood rule.

**What holds it at 7**
1. **The brand book contradicts the photography rules.** `/kit/marke` loads v1 images by raw path, bypassing `resolveImage()`: `src/app/kit/marke/page.tsx` lines 205, 384, 394, 665, 672, 950. The result:
   - stones on the massage table in the hero (`kit-marke-hero-v1-photo-1440.png`);
   - flowers and a ring mirror in "Logo auf Fotografie" (`kit-marke-logo-on-photo-v1-1440.png`);
   - a bare back and a candle in the service-card demo;
   - candles, rolled towels and an orchid in the motif pair (`kit-marke-motif-v1-photos-1440.png`).

   The board `brand/assets/previews/motif-board.png` is worse: the hotel arch shows the fake lettering "ANΓIΘA" that `AUDIT.md` lists as *never use*, plus orchids, stones and a candle in "Details".
2. **Custom icons exist only in the brand assets and the applications.** The product uses the Lucide icons that `ICONOGRAPHY.md` § 4 rejected (M2).
3. **The arch-check glyph** is in the comp and the e-mail, not in the product (M1). The comp's caption claims "Der echte Ablauf von /buchung/[id]".
4. **E-mail fonts:** the preview shows Newsreader and Instrument Sans; real clients show Georgia and a system sans (§ 3.4).
5. **AI labelling differs by surface:**
   - ads, social, gift card and onboarding: labelled;
   - showcase boards (`showcase/customer-app.png`, `pro-dashboard.png`) and the app-icon board's wallpapers: **not labelled**;
   - the product: **not labelled** (§ 5).
6. **Ads use no motif;** social and print do.
7. **Mobile search control:** the spec (§ 9.3) says a full-width **Espresso** button; the product uses Oxblood. The product is arguably right; the documents must match.

**Remediation (required)**

| # | Task | File(s) | Expected result | Verify |
|---|---|---|---|---|
| C1 | Replace every raw v1 image in the brand book with v2 (via `resolveImage()` or `-v2` paths); rebuild the motif board | `src/app/kit/marke/page.tsx` (205, 384, 394, 665, 672, 950); `brand/tools/build-boards.mjs` / `build-graphics.mjs motif` → `assets/previews/motif-board.png`, `assets/previews/kit-marke-*.png` | No spa props, nudity or fake text anywhere in the brand book | `grep -nE '/images/(hero/home|editorial/(arrival|setup|after|hotel|office|details)|categories/[a-z-]+)\.jpg' src/app/kit/marke/page.tsx` returns nothing; screenshots at 1440 and 390 |
| C2 | Arch-check and custom icons in the product | see M1, M2 | — | see M1, M2 |
| C3 | E-mail: add a hosted `@font-face` (works in Apple Mail and iOS Mail) with an explicit fallback (`Georgia` for the title, `Helvetica, Arial` for text); document it in guidelines § 10; re-render the previews **without** installed brand fonts, plus one "with webfonts" variant | `brand/applications/_src/email.mjs`, `email/template/*.html` | The previews show what recipients actually see | Open `email/buchung-bestaetigt.html` in Chromium without the fonts installed and compare with `preview-light-680.png` |
| C4 | Label the AI imagery on every board | `brand/applications/_src/showcase.mjs`, `app-icons.mjs` | A „Bilder KI-generiert · Demo-Daten" caption on `customer-app.png`, `pro-dashboard.png` and every home-screen mockup | Visual check; `grep -c KI-generiert` > 0 in both sources |
| C5 | Align the specification with the build: mobile search button colour (§ 9.3), bottom-nav 11 px vs the 12 px floor, the serif rule (§ 3.4) | `brand/BRAND_GUIDELINES.md` | Documents and product agree | Read-through plus screenshot |
| C6 | Remove stale statements: "die App-Komponenten werden in Phase B2 umgestellt" (`src/app/kit/marke/page.tsx:781`); "floating on the aura" (`src/app/fuer-profis/page.tsx:453`) | — | — | grep |

**From 7 to 9:** C1–C6 plus O2 (the motif in ads).

### 3.10 Long-term relevance: 7

**Evidence**
- **Durable:**
  - the strategy (place, verified Profis, "Vorher klar");
  - the *du* voice and the truth rules;
  - the token architecture (W3C DTCG source; I checked 211 tokens and 82 aliases, 0 unresolved);
  - SVG masters generated from code;
  - a 2-font budget;
  - neutral functional colours.
- **Trend-bound:**
  - the combination of oatmeal neutrals, high-contrast serif-less capitals, a serif headline with an italic clause in nearly every headline ("Du bleibst. *Dein Profi kommt.*", "Gesucht wird *schon.*", "Wer bei dir *klingelt.*", "Antworten, *bevor du fragst.*"), and arch photo frames is the 2023–26 premium-DTC idiom;
  - the italic-clause device is used so often on the product that it has become a tic.
- **SaaS residue that will date the product, and contradicts the brief's "not a conventional SaaS product":**
  - the cursor spotlight glow;
  - count-ups;
  - floating UI cards with a "Live" pill on a mock (`/fuer-profis`);
  - the home stats strip and the feature-icon grid;
  - KPI sparkline cards;
  - 51 references to retired aura components across about 20 files, flattened through the tokens but still in the code (`grep -rn "bg-aura|AuraArt|AuraBackground|aura-border|gradient-sheen" src`).

**Remediation (required)**

| # | Task | File(s) | Expected result | Verify |
|---|---|---|---|---|
| L1 | Ration the italic clause: at most one per page (the hero) and none in app screens | Guidelines § 4.4; headlines in `src/app/(site)/**`, `src/app/fuer-profis/page.tsx`, `src/app/(site)/hilfe` | The device becomes a signature again, not a habit | Count the `<em>` inside `h1`/`h2` per route: ≤ 1 |
| L2 | Remove the SaaS residue: `Spotlight` (`src/components/ui/motion.tsx` 359 ff., `tokens.css` 878–890, the uses in `src/app/fuer-profis/page.tsx:457` and `src/app/pro/(app)/profil/page.tsx:106`); `CountUp` on money and ratings; the aura components (`src/components/ui/aura.tsx` and its call sites) | as listed | No cursor-reactive gradients, no counting numbers, no aura code | `grep -rn "<Spotlight\|spotlight-fill" src` and `grep -rn "CountUp" src/components/site src/components/pro src/app/konto` return nothing; the aura grep returns nothing |
| L3 | Add a written **trend guardrail** to the guidelines: what is core and fixed (Ortszeile, offset pair, Start-Code, Oxblood restraint, tokens) and what may evolve (photo style, italic usage, card styling), with a yearly review | `brand/BRAND_GUIDELINES.md` new § 12 | A governance rule for evolving the system without breaking it | Read-through |
| L4 | Trademark clearance for "SOMA" (DE/EU, classes 35/44/9/42). This is already a known production blocker | Lead / lawyer | Cleared, or a rename decision | `PLAN.md` decisions log entry |

**From 7 to 9:** L1–L4 plus O1. A visible proprietary construction outlasts a style.

---

## 4. Specific checks

| Check | Result | Evidence |
|---|---|---|
| **No-go: spa clichés** | **Pass in the product and applications; FAIL in the brand book.** v2 imagery is clean (no candles, orchids, stones, petals or robes). `/kit/marke` and `assets/previews/motif-board.png` still show v1 images with stones, candles, orchids, a ring mirror, bare backs and the fake lettering "ANΓIΘA" | `kit-marke-*-v1-*.png`, `assets/previews/motif-board.png` |
| **No-go: nail salon** | Pass. No pink, glitter, rose gold or script; the category washes differ in temperature, not hue | `colour-system.png`, live screens |
| **No-go: clinic** | Pass. Warm neutrals; the info slate is used only for notices; no crosses or sterile rooms | live screens, v2 photos |
| **No-go: conventional SaaS** | **Partial.** The customer flows pass. Residue: the home stats strip and feature-icon grid; the floating mock cards with "Live"; the cursor spotlight; count-ups; KPI sparkline cards in Pro. Admin is a neutral console by design (acceptable) | `home-proof-band-1440.png`, `home-trust-feature-grid-1440.png`, `fuer-profis-hero-live-mock-1440.png`, `live-pro-*.png` |
| **No-go: excessive gradients** | Pass, apart from the 4 % cursor spotlight. Scrims are flat (62 %); no gradient scrims in the applications | `tokens.css` 878–890; `_src/social.mjs` line 17 |
| **Oxblood ≤ 1 per screen** | Pass on every measured live screen (§ 3.6). Applications pass. The type pairing specimen has 2 (Ortszeile plus button; minor, specimen only) | probe results § 3.6 |
| **Oxblood never an error** | Pass. Danger is vermilion `#B3261E` (6.54:1 with white) with an icon and a word; destructive buttons are vermilion. Adjacency note in § 3.6 | `live-anmelden-error-390.png`, `live-suche-empty-390.png` |
| **du voice** | **Pass.** `grep -w "Sie\|Ihnen\|Ihre…" src` finds only the statutory withdrawal texts. No exclamation marks on any probed page. Natural and consistent ("Prüf deine Angaben.", "Antworten, bevor du fragst.", "Nenn ihn deinem Profi an der Tür."). Minor: seeded bio „Bei mir darfst du loslassen“ (massage) is ambiguous next to the zero-tolerance rule; run it through `content-lint` | `src/**`, `live-profil-*.png` |
| **Truthful claims** | **Mostly pass:** <ul><li>the home stats and quotes come from the database and have a `reviewCount > 0` guard; demo mode is labelled by the global ribbon „Beispieldaten“</li><li>the gift card is marked as a future concept</li><li>store icons are marked "not built"</li></ul> **Flags:** <ul><li>the "Live" pill on an illustrative request card on `/fuer-profis` (`src/app/fuer-profis/page.tsx:464`)</li><li>onboarding p. 6 promises payout "in der Regel in 1–3 Werktagen" (an ops target, not checked)</li><li>the booking comp claims "der echte Ablauf" but differs from the product</li><li>launch gate: purge the seeded reviews and Profis before any non-demo deploy</li></ul> | screenshots; source lines |
| **AI images labelled** | **FAIL in the product.** <ul><li>No "KI-generiert" text on any product screen (`grep -rn "KI-generiert" src` finds only the `/kit/marke` footer)</li><li>AI faces appear next to names, ★ ratings, *Verifiziert*, "33 Termine über SOMA" and "Sofort bestätigt" on home, search, profile, checkout, account and Pro</li><li>this violates `PHOTOGRAPHY.md` § 0 ("AI people never appear next to a name, a rating or the Verifiziert badge"), guidelines § 10.1 (the label "must be visible next to the image") and voice checklist #9</li><li>the global demo ribbon says "Beispieldaten", not that the faces are synthetic</li><li>legal exposure under the EU AI Act transparency duties (Art. 50, applicable since 2 Aug 2026): to confirm with the lawyer</li></ul> Applications: labelled, except the showcase and app-icon boards | `home-profi-cards-ai-unlabelled-1440.png`, `live-profil-*.png`, `live-suche-*.png` |
| **Logo at 16 px** | **Pass.** The favicon cut is legible at 16 px on light and dark; the micro wordmark holds at 12 px cap height. Caveat: the ICO/PNG tile vanishes on dark tab bars (1.37:1) | `favicon-*-x6.png`, `logo-wordmark-micro-*-small-x4.png` |
| **Motif used purposefully** | **Mostly pass.** In the product: image frames, the offset pair in the hero, profile portrait, empty state ("Heute ist frei" in Pro), the "today" date mark. In applications: social, gift card, onboarding, e-mail glyph. Missing in ads and the product confirmation. Watch the density: about 15 arches on the home page (hero 2, categories 7, Profis about 6), allowed as "lists" but close to pattern use | live screenshots |
| **Type pairing and font budget** | **Pass.** Harmonious; 77 KB preloaded / 99 KB with italic, measured. Deviation: DM Mono on `/anmelden` | § 3.4 |
| **Legal cleanliness** | **Pass with open items.** <ul><li>fonts: OFL, licences shipped in `assets/typography/fonts/` and `src/styles/fonts/`</li><li>the wordmark is constructed geometry; the descriptor and tagline outlines come from OFL fonts (permitted)</li><li>no competitor assets; competitors not named in marketing</li></ul> **Open:** <ul><li>trademark clearance (blocker)</li><li>the AI disclosure in the product (above)</li><li>the Lucide ISC licence is not recorded in the brand documents, although custom icons and application artwork use Lucide geometry: add the notice to `ICONOGRAPHY.md`</li><li>the AGB placeholders flagged ⚖</li></ul> | files listed |
| **Production readiness** | **Good foundation, with gaps.** <ul><li>SVG masters: authoritative and clean (68/68), used byte for byte by the product</li><li>tokens: `tokens.css` is identical to the app's; `tokens.json` resolves (211 tokens / 82 aliases)</li></ul> **Gaps:** <ul><li>fluid font sizes are `clamp()` strings, which are not DTCG dimension values; Tokens Studio and Figma cannot import them. Add 360 and 1440 endpoints as separate tokens</li><li>the `reveal` duration (900 ms) requested in `MOTION.md` § 2 is missing</li><li>the onboarding PDF is untagged, with Type 3 fonts (print shops may reject it) and an unresolved `{Support-Adresse}` placeholder on p. 7</li><li>stale text in the brand book and code comments</li></ul> | § 3.5, § 3.9 |

---

## 5. Applications review

| Application | Verdict | Strengths | Issues |
|---|---|---|---|
| **App icons** (`applications/app-icons/`, `assets/icons/`) | Good | Complete set (iOS light, dark and tinted; Android adaptive and monochrome; PWA maskable; favicon cut); the S reads at home-screen size | A single letter on a tile is generic (O1); AI wallpapers not labelled (C4); the dark-tab favicon edge (§ 3.5) |
| **Social** (9 posts, 3 stories, LinkedIn, avatar) | Very good | Editorial grid, Ortszeilen, one Oxblood post, arch frames, truthful captions with AI labels (`captions.md`) | Post 01: Bone headline and Ortszeile partly over light linen (about 3.4:1 under "Uhr."; passes 3:1 for large text, fails 4.5:1 for the 16 px Ortszeile); the 14 px AI label is too small |
| **Ads** (3 concepts × 5 sizes) | Adequate | Truthful copy (voice § 7.13), clear CTA, AI labels, demo labels | No motif; the 9:16 formats have an empty bottom third; ad B 9:16 has the wordmark on a busy edge; conventional "image above, text below" layouts |
| **Booking confirmation comp** | Good | The arch-check, the Start-Code as a calm moment, no Oxblood | Differs from the live product (generic check) although it claims to be "der echte Ablauf" |
| **E-mail** „Buchung bestätigt“ | Good | Table layout, inline styles, VML button, preheader, dark mode with a swapped logo and Bone CTA (`email-dark-680.png`), no horizontal scroll at 390 | The fonts are not delivered, so the preview misrepresents what recipients see (C3) |
| **Gift card** (future concept) | Very good | The single most ownable piece: Oxblood front, Bone arch line crossing the edge, the back with the code in tabular figures; clearly marked as not built | None material |
| **SOMA Pro welcome kit** (A4 PDF, 7 pp.) | Very good in content and design | Real verification list, Start-Code, zero-tolerance panel (the one Oxblood moment), a commission table and worked example | Untagged PDF; Type 3 fonts; `{Support-Adresse}` placeholder (p. 7); the "1–3 Werktage" payout claim needs ops confirmation |
| **Showcase boards** | Good | Real live screens, honest "Migration läuft" note | AI faces without a label; the boards show the inconsistencies of § 3.9 |
| **Motion** (`MOTION.md`, `specimen.html`) | Good | Clear principles with tests, tokens, reduced motion, "never" list | The product contradicts "numbers never count up"; the `reveal` token was never added |

---

## 6. Product review per experience

### Customer
**Home** (to be replaced in the landing phase; judged here as a brand application)
- **Strong:** the hero with the offset arch pair and Ortszeilen, the search card with the one Oxblood CTA, and three true trust points.
- **Weak:**
  - the stats strip with counting numbers;
  - testimonial cards plus a serif section headline in one viewport;
  - the feature-icon grid with a `$` receipt icon in a euro product (`Receipt`, `src/app/(site)/page.tsx:284`; use `ReceiptEuro` or a custom icon);
  - AI Profi faces without a label.
- Give these to the Landing Art Director as no-gos.

**Search**
- Clean.
- Total price including travel and real slots.
- Clear "Sofort bestätigt" and "Auf Anfrage".
- The sort note „Profis zahlen nicht für ihre Platzierung“ is a good trust detail.
- Gaps: the selected chips lack the check; the avatars are circles, not the specified O-oval.

**Profile**
- Arch portrait, serif name, true facts (Verifiziert, "33 Termine über SOMA").
- One Oxblood in the sticky bar.
- Missing the AI label; the price reads "zzgl. Anfahrt" until a postcode is entered.

**Checkout** (Hanna B., Sofort bestätigt): **the best screen in the system.**
- Stepper, saved addresses for each place type, the zero-tolerance note.
- Legal consent text, contract partner named, the § 19 UStG note.
- Dated free cancellation, the 15-min Bedenkzeit.
- One Oxblood CTA with the price, sticky on mobile.

**Booking detail**
- Excellent information design: Start-Code, timeline, cancellation tiers in words, preparation note.
- Uses a generic check circle instead of the arch-check.

**Account (`/konto`)**
- Warm, clear and useful: next appointment with the Start-Code, Erneut buchen, Guthaben.
- Two serif statements in one view; 11 px bottom-nav labels.

**Sign-in, Hilfe, `/fuer-profis`**
- On-voice ("Antworten, bevor du fragst.").
- `/fuer-profis` has a transparent commission table and a demand table, but also the "Live" mock pill, a sparse hero and floating cards.

### SOMA Pro
- Clearly the same brand: micro wordmark plus "Pro" in the sans as specified, serif greeting with an italic name, the same pills and cards.
- Request cards show the deadline, commission and travel, which shows respect for the Profi's business.
- Calendar: requests in ochre with the word "Anfrage".
- Weak points:
  - the KPI cards with unlabelled sparklines and counting money read as a conventional SaaS dashboard;
  - a red "−59,2 %" earnings pill is alarm styling;
  - 11.5 px chips;
  - truncated event names (`condensed` unused).

### Admin
- Correctly neutral (strategy § 5: "no brand expression"): S tile, Espresso actions, dense tables, status pills as dot plus word, keyboard search.
- A conventional console, which is acceptable for an internal tool.
- Badge digits and table meta at 11 px.

---

## 7. What is genuinely excellent (keep)
- **The documents:** strategy, voice, guidelines, logo usage and tokens are thorough, honest about what is not built, and traceable to the code.
- **Colour:** the system and its restraint, verified on the live DOM.
- **SVG masters and generation:** masters generated from code, used byte for byte in the product.
- **Copy:** the *du* voice and the truth rules in practice: legal CTA wording, dated deadlines, no exclamation marks, no superlatives.
- **Checkout and booking detail.**
- **Gift card, onboarding kit and social grid.**

---

## 8. Prioritised issues

Severity: **P0** blocks any external use · **P1** must be fixed for Audit 2 · **P2** should be fixed · **P3** polish.

| # | Sev. | Issue | File(s) | Fix | Verify |
|---|---|---|---|---|---|
| 1 | **P0** | AI faces in the product next to names, ratings and *Verifiziert*, unlabelled | Profi card / profile header / search result / checkout summary / account components under `src/components/site/**`, `src/app/(site)/page.tsx`, `src/app/(site)/profis/[slug]`, `/anmelden` editorial image, Pro avatar | In demo mode, show „Demo-Profil · Foto KI-generiert“ next to every Profi photo, and „Bild KI-generiert“ as a caption on editorial photos. Add the label to the alt text too. Before launch: real photos only | Playwright: on `/`, `/suche?plz=10115&kategorie=massage`, `/profis/selin-a-berlin` and `/buchen`, each visible AI photo has a "KI-generiert" text within its card; `grep -rn "KI-generiert" src` lists the component |
| 2 | **P0** | The brand book and motif board show v1 images with spa props, nudity and fake lettering | `src/app/kit/marke/page.tsx` (205, 384, 394, 665, 672, 950); `brand/assets/previews/motif-board.png` (+ `kit-marke-*.png`) | Use v2 paths or `resolveImage()`; rebuild the boards | C1 grep; screenshots show no candles, orchids, stones, bare backs or text artefacts |
| 3 | **P0** | Trademark clearance for "SOMA" (known) | Lead | Clearance or a rename | Decision logged in `PLAN.md` |
| 4 | P1 | The symbol and wordmark are not distinctive (originality 6, memorability 7) | `brand/tools/final.mjs`, `lib/s.mjs`, `assets/logo/**` | O1 symbol refinement; O3 honest exploration record | O1 checks (IoU < 0.35 plus a non-letter feature, 5-second test, 16 px render) |
| 5 | P1 | Custom icons not shipped in the product | `src/app/(site)/page.tsx:238–240`, `checkout-form.tsx`, `account-addresses.tsx`, service cards | M2 | M2 grep plus screenshots |
| 6 | P1 | Arch-check glyph missing on product confirmations | `src/app/(checkout)/buchung/[id]/page.tsx`, Pro acceptance | M1 | Screenshot matches `booking-confirmation/board.png` |
| 7 | P1 | Numbers count up (money, rating, counts), against `MOTION.md` | `discovery-proof.tsx`, `src/components/pro/stats.tsx`, `src/app/konto/guthaben/page.tsx`, `src/app/admin/page.tsx`, `src/app/admin/zahlungen/page.tsx` | Render final values; at most a 160 ms crossfade on change | `grep -rn "CountUp" src/components/site src/components/pro src/app/konto` is empty; the values are final on the first frame (screenshot at t = 100 ms) |
| 8 | P1 | E-mail preview misrepresents the fonts | `brand/applications/_src/email.mjs`, `email/**` | C3 | Fallback render matches the preview |
| 9 | P1 | Showcase and app-icon boards: AI not labelled | `_src/showcase.mjs`, `_src/app-icons.mjs` | C4 | Visual check; grep |
| 10 | P1 | 9:16 ads: empty bottom third, wordmark on a busy edge (B), no motif in any ad | `brand/applications/_src/ads.mjs` | Recompose: headline and CTA inside the 1420–1670 px zone, wordmark on a calm zone or a 62 % scrim, arch or pair (O2) | Measure contrast behind the wordmark bounding box ≥ 4.5:1; no Bone area > 15 % of the height without content |
| 11 | P1 | SaaS residue: cursor spotlight, aura code, floating mocks with "Live" | `tokens.css` 878–890, `motion.tsx` `Spotlight`, `src/app/fuer-profis/page.tsx:457–464`, `src/components/ui/aura.tsx` + 20 call sites | L2; replace "Live" with „Beispiel“ | L2 greps empty; `/fuer-profis` shows no "Live" on illustrative content |
| 12 | P2 | One-serif rule vs practice; italic clause overused | Guidelines § 4.4; `/konto`, `/anmelden`, home, `/fuer-profis`, `/hilfe` | C5 + L1 | ≤ 1 `<em>` per route; rule and product agree |
| 13 | P2 | Text below the 12 px floor (bottom nav 11, badges 11, Pro chips 11.5, references 10.5, demo password 10.5) | `src/components/ui` bottom nav / badge / chip; `src/app/pro/(app)/einnahmen`; `src/app/(auth)/anmelden` | 12 px minimum; update § 9.2 | The a11y probe reports `minSize ≥ 12` on all routes |
| 14 | P2 | DM Mono on a customer page | `/anmelden` demo box | Instrument Sans `num` | The font probe on `/anmelden` lists only `somaSans` and `somaDisplay` |
| 15 | P2 | Selected chips lack the check icon | chip/segmented in `src/components/ui` | Add a 16 px `Check` before the label when `aria-pressed="true"` | Screenshot of `/suche` filters |
| 16 | P2 | Onboarding PDF untagged, Type 3 fonts, `{Support-Adresse}`, unverified payout timing | `brand/applications/_src/onboarding.mjs` | `tagged: true`; static-instance fonts; resolve the placeholder; confirm or remove "1–3 Werktage" | `pdfinfo` → Tagged: yes; `pdffonts` shows no Type 3; `pdftotext … \| grep '{'` is empty |
| 17 | P2 | Favicon ICO/PNG invisible on dark tab bars | `brand/tools/build-icons.mjs` | 1 px rim ≥ 3:1 against `#202124` | Render on `#202124`; measure |
| 18 | P2 | `$` receipt icon for "Endpreis" | `src/app/(site)/page.tsx:284` | `ReceiptEuro` or a custom icon | Screenshot |
| 19 | P2 | Pro KPI sparklines unlabelled; red earnings delta | `src/components/pro/stats.tsx`, `/pro` | Label the period or remove; neutral delta styling (arrow plus sign, Espresso) | Screenshot of `/pro` |
| 20 | P3 | tokens.json `clamp()` strings not DTCG; `reveal` token missing | `brand/tools/tokens-source.mjs` | Add min/max dimension tokens; add `--transition-duration-reveal: 900ms` | Rebuild; validate with Style Dictionary |
| 21 | P3 | Stale text and comments | `src/app/kit/marke/page.tsx:781`, `src/app/fuer-profis/page.tsx:453` | Update | grep |
| 22 | P3 | Lucide ISC notice missing | `brand/assets/iconography/ICONOGRAPHY.md` | Add the licence line | Read-through |
| 23 | P3 | Social AI label 14 px; post 01 Ortszeile over linen | `_src/social.mjs` | Label ≥ 20 px; move the Ortszeile left or add a calm-zone scrim | Contrast ≥ 4.5:1 for the 16 px line |
| 24 | P3 | Pro calendar truncates instead of `condensed` | Pro calendar event component | `font-stretch: 86%` before the ellipsis | Screenshot at 1440 |
| 25 | P3 | Seeded massage bio „Bei mir darfst du loslassen“ | `scripts/db/lib/base-seed-data.ts` | Rephrase; run `content-lint` | Lint passes |

---

## 9. Remediation summary for scores below 8
- **Originality (6):** O1, O2, O3.
- **Memorability (7):** M1, M2, M3.
- **Cross-platform consistency (7):** C1–C6, plus O2.
- **Long-term relevance (7):** L1–L4.

**Lifting the 8s to 9:**

| Dimension | Actions |
|---|---|
| Visual sophistication | Brand book images, 9:16 ads, landing no-gos (§ 3.2) |
| Typography | Serif rule, 12 px floor, e-mail stack, `condensed` (§ 3.4) |
| Logo scalability | Favicon rim, stacked lockup with the new symbol (§ 3.5) |
| Digital usability | No count-up, labelled sparklines, postcode in the profile bar, card heights (§ 3.7) |
| Accessibility | 12 px floor, chip check, tagged PDF, larger social AI label (§ 3.8) |

Colour coherence (9): retire the spotlight, and soften the error-next-to-CTA adjacency, for example by placing form errors inside the form card, above the fields.

---

## 10. Verdict

**Not approved yet: 6 of 10 dimensions meet the target, 4 do not.**

SOMA is a disciplined, truthful and usable system with production-grade foundations: tokens, masters, voice and checkout. Most remaining gaps are implementation drift between the brand assets and the product. They are cheap to fix.

Two things need more than a fix:
- **The AI-face labelling (P0)** must be resolved before anyone outside the team sees the product.
- **The identity needs one visible, proprietary idea.** The S/O construction exists on paper; it must be seen in the mark. Without it, SOMA will look like a very good member of a crowded genre rather than an established international brand of its own.

Fix P0 and P1, then request **Brand Audit 2**. I will re-run the same probes (scripts kept outside the repository; method in this document's header), so that the scores are compared on the same evidence.
