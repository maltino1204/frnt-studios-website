# SOMA brand identity: Independent Brand Audit 2

*Independent Brand Auditor · 1 Nov 2026 · re-audit after the Brand Audit 1 remediation (commits `1a8c4b9` … `754d7d7`).*
*Evidence: `brand/audit/brand-audit-2/` (100 files). Paths are relative to `soma/`.*

**Method: the same probes as Audit 1** (`brand/audit/scripts/`, copied and pointed at :3000), plus four new ones:
- `s-in-o-compare`: the symbol against generic enclosed-S monograms;
- `seg-*`: clipping of segmented controls;
- `em-count` / `italics`: italic accents per route;
- a token validator.

**Probe results:**
- Brand probe: Oxblood count, fonts, AI labels and `Sie`, at 390×844 (dsf 2) and 1440×900.
- Computed contrast for every visible text node on 14 routes.
- Text floor, focus ring and chip semantics.
- Font loading, SVG hygiene and the masters-vs-product comparison.

**Scope:**
- Product pages on the **dev server :3000**: `/suche`, `/profis/selin-a-berlin`, `/buchen` (Hanna B., Sofort bestätigt), `/buchung/[id]`, `/konto`, `/konto/termine`, `/pro` (×5), `/admin` (×3), `/anmelden`, `/fuer-profis`, `/hilfe`, `/kit/marke`.
- **`/` is excluded** (the landing page is being rebuilt) and gets its own audit.
- :3100 was not used.

---

## 1. Executive summary

The remediation is substantial and mostly real:

| Area | Verified result |
|---|---|
| P0 issues fixed | Both: AI faces now carry „Demo-Profil · Foto KI-generiert“ on every customer surface; the brand book shows only v2 photos, labelled |
| Product matches the applications | Custom place/category icons, the arch-check glyph, truthful e-mail previews, labelled boards |
| Removed | Count-ups, cursor spotlight, aura code, the "Live" pill |
| Typography and tags | 12 px floor holds on all 14 routes; selected chips carry a check; the onboarding PDF is tagged |
| Tokens and masters | Tokens synced and DTCG-clean; the new masters are clean and used byte for byte |

**The new symbol, "S im O", is a real step forward:**
- It makes the construction visible.
- It tells *Your body. Your place.* in one sign.
- It gives the brand a mark that differs from its wordmark.

**But my own Audit 1 criterion was too weak, and I correct it here.** "IoU < 0.35 against a bare serif S" is passed by *any* enclosure:
- Against generic **enclosed-S monograms** (a serif S set in an even oval ring), the SOMA mark overlaps **0.49–0.52**, above the 0.35 threshold (`originality-s-im-o-vs-generic-monograms.png`).
- "Initial in an oval" is the classic hotel and heritage monogram. The seal cut (a white letter on a filled oval) is a common app-icon device.
- The 5-second recall test has **not been run**.
- **Originality therefore rises from 6 to 7, not to 8.**

**There is one new regression.** Adding the check icon to `SegmentedControl` makes selected labels overflow their pill:
- in the checkout place switch at 360 px, "Zuhause": content 118 px, segment 91 px;
- in the Admin range switch at every width, "30 Tage": 93 / 78 px.

The overflowing letters render Bone on Linen (≈ 1.1:1), so they are invisible. It is quick to fix, but it sits on the booking form.

**Scores:**
- Nine of ten dimensions now reach **≥ 8**; Originality is at **7**.
- Average **8.1**, up from 7.6.
- Gate: **not yet met.**

Trademark clearance remains the launch blocker outside the brand gate.

---

## 2. Scores and trend

| # | Dimension | Audit 1 | **Audit 2** | Trend | One-line reason |
|---|---|---:|---:|:---:|---|
| 1 | Originality | 6 | **7** | ▲ | The S im O makes the idea visible, but sits in the enclosed-monogram genre (IoU 0.49–0.52 vs generic S-in-oval); recall test unrun |
| 2 | Visual sophistication | 8 | **8** | = | Brand book, ads and social much improved; the segmented-control regression and the dense arch formula hold it at 8 |
| 3 | Brand memorability | 7 | **8** | ▲ | Distinct mark, a signature (offset pair + Ortszeile) in every campaign format, the arch-check and custom icons in the product |
| 4 | Typography | 8 | **8** | = | Floor met everywhere, DM Mono off customer pages, an e-mail stack. Italic and serif rules broken on `/fuer-profis` and `/pro`; `condensed` not used in segments |
| 5 | Logo scalability | 8 | **9** | ▲ | Seal cut for < 32 px, a favicon rim in SVG, ICO and PNG, legible at 16 px on light and dark |
| 6 | Colour coherence | 9 | **9** | = | ≤ 1 Oxblood element per live screen (charts excepted), the spotlight gone, the Pro delta neutral |
| 7 | Digital usability | 8 | **8** | = | No count-ups, labelled sparklines, PLZ field on the desktop profile; the selected place label is clipped in checkout at 360 px |
| 8 | Accessibility | 8 | **8** | = | 0 real contrast failures, 12 px floor, chip checks, tagged PDF. New: clipped selected labels (≈ 1.1:1 overflow) |
| 9 | Cross-platform consistency | 7 | **8** | ▲ | Product = applications for icons, the glyph, AI labels, tokens and masters; the draw-on intro exists only in the brand book |
| 10 | Long-term relevance | 7 | **8** | ▲ | Trend guardrail § 12, SaaS residue removed, italic rationed in the app; trademark still open |

**Average 8.1 (Audit 1: 7.6). Gate (≥ 8 in all ten): not met.** Originality is the only gap, and it needs evidence (people) plus one design decision, not more fixes. No 10 is given; the 9s have the evidence cited in § 4.

---

## 3. Verification of the Audit 1 remediation tasks

Legend: ✅ fixed (verified) · ◐ partial · ✖ open · n/a (out of scope)

### 3.1 Tasks per dimension

| Task | Status | Evidence (Audit 2) |
|---|:---:|---|
| **O1** Make the S/O construction visible in the symbol | ◐ | **(a)** Passed as written: max IoU 0.24 against five bare serif S (`concepts/symbol-studies-2.png`; I re-ran it: 0.23 vs Newsreader). But against an enclosed S, the IoU is **0.49–0.52** for an even oval ring with a Bodoni or Gloock S, and **0.71–0.83** for the SOMA O with a Newsreader or Bodoni S (`originality-s-im-o-vs-generic-monograms.png`). The originality sits in the enclosure, which is a genre device. **(b)** 5-second test **not run**; unverified. **(c)** Passed with the seal cut at 16 px (`logo-symbol-seal-*-small-x4.png`, `favicon-*-x6.png`); the line cut is fine from 24–32 px (`logo-symbol-line-*-small-x4.png`) |
| **O2** Signature pair + Ortszeile in every campaign format | ✅ | All 15 ad formats: pair in 1080×1080 / 1080×1920 / 1200×628; single arch + short Ortszeile in 300×250; cropped pair in 728×90 (`applications/ads/*/board.png`). The social grid has 2 pair posts. Rules in guidelines § 10.2 |
| **O3** An honest exploration record | ✅ | `LOGO_USAGE.md` § 1.1a; the `/kit/marke` box „Ehrlich eingeordnet“ |
| **M1** Arch-check on confirmations | ✅ | `/buchung/[id]` (`live-buchung-detail-390.png`); `src/components/pro/booking-actions.tsx`, `pro/(app)/termine/[id]`, `pro/registrieren`. Secondary successes (review sent, dispute filed, waitlist) keep `SuccessCheck`, which is acceptable |
| **M2** Custom icons in the product | ✅ | `src/components/brand/icons.tsx` has all 10; used in 9 files. Checkout place switch (house with arched door, hotel, büro) and the search category chip (`live-buchen-1440.png`, `live-suche-1440.png`) |
| **M3** The new symbol in icon, avatar and splash, plus the draw-on | ◐ | Icons (iOS, Android, PWA), favicon, social avatar and iOS startup images are wired in `layout.tsx`. **The draw-on runs only on `/kit/marke`** (`src/app/kit/marke/draw-on.tsx`). There is no `BrandIntro` in the product, although `SPLASH.md` § 2–3 specifies it |
| **C1** Brand book on v2 photos | ✅ | The C1 grep is empty. All 8 images on `/kit/marke` are `-v2` or `landing/*`, with 8 labels. The motif board is rebuilt with v2 and labels (`kit-marke-hero-1440.png`, `assets/previews/motif-board.png`) |
| **C2** = M1 + M2 | ✅ | see above |
| **C3** E-mail fonts and truthful previews | ✅ | `@font-face` for both families, an MSO conditional (Georgia/Arial), guidelines § 10.3; `email/preview-board.png` shows the webfont and fallback renders |
| **C4** AI labels on boards | ✅ | `showcase/customer-app.png` („Bilder KI-generiert · Demo-Daten“), `app-icons/app-icons-board.png` („Hintergrundbilder KI-generiert“) |
| **C5** Specification = build | ✅ | Guidelines v1.1: search button Oxblood, 12 px floor, the serif rule made precise. Small deviations remain (§ 5, N3/N6) |
| **C6** Stale text | ✅ | Both greps are empty |
| **L1** At most one italic clause per page | ◐ | App screens have 0 italic accents (konto, buchung, pro: probe). `/hilfe` has 1. **`/fuer-profis` has 2**: „Deine Zeiten.“ and „Weitere Städte folgen.“ (`src/app/fuer-profis/page.tsx:420`). Every public page also has the italic tagline in the footer; § 4.4 does not say whether that counts |
| **L2** Remove SaaS residue | ✅ | No `<Spotlight` or `spotlight-*`; `CountUp` appears nowhere in `src`; `aura.tsx` is deleted and the aura grep is empty. The remaining gradients are functional (spinner mask, range-track fill, calendar hatch) |
| **L3** Trend guardrail | ✅ | Guidelines § 12 (core / free to evolve / watch list / yearly review) |
| **L4** Trademark clearance | ✖ | No entry in `PLAN.md` beyond "production blocker" |

### 3.2 Audit 1 issue list (§ 8)

| # | Issue (Audit 1) | Status | Evidence |
|---|---|:---:|---|
| 1 | AI faces unlabelled | ✅ | „Demo-Profil · Foto KI-generiert“ on search (2/2), profile, checkout (2), `/konto` (4) and the Pro sidebar (1440). Residual: the Pro **mobile** header avatar has no label (N4) |
| 2 | Brand book v1 photos | ✅ | see C1 |
| 3 | Trademark | ✖ | open |
| 4 | Symbol not distinctive | ◐ | see O1 |
| 5–6 | Icons, arch-check | ✅ | see M1, M2 |
| 7 | Count-ups | ✅ | `grep -rn CountUp src` is empty; values are final on the first frame |
| 8–9 | E-mail fonts, board labels | ✅ | see C3, C4 |
| 10 | 9:16 ads | ✅ | Wordmark on calm Bone; pair; empty margins 13 % at the top and 12.5 % at the bottom (≤ 15 %) (`ads/b-zimmer-614/b-zimmer-614-1080x1920.png`) |
| 11 | SaaS residue | ✅ | see L2; `/fuer-profis` hero is now one arch photo with its Ortszeile and label |
| 12 | Serif and italic overuse | ◐ | see L1; `/pro` shows two serif headlines (N6) |
| 13 | Text < 12 px | ✅ | The probe's minimum font size is 12 px on all 14 routes (Audit 1: 10.5–11) |
| 14 | DM Mono on a customer page | ✅ | `/anmelden` loads only `somaSans` and `somaDisplay`. Pro and Admin may use DM Mono |
| 15 | Chip check | ✅ (regression) | `aria-pressed` chips on `/suche` show a check (`hasSvg: true`). **The same change in `SegmentedControl` causes N1** |
| 16 | Onboarding PDF | ✅ | `pdfinfo`: Tagged **yes**; `pdffonts`: all CID TrueType (no Type 3); `{Support-Adresse}` resolved; "1–3 Werktage" replaced by „hängt von deiner Bank ab“ |
| 17 | Favicon on dark tab bars | ✅ | SVG rim; the ICO frames 16/32/48 carry the Bone rim (pixel check); renders on `#202124` and `#35363A` (`favicon-dark*-x6.png`) |
| 18 | `$` receipt icon | n/a | The old home page is removed; check in the landing audit |
| 19 | Pro sparklines, red delta | ✅ | "Verlauf · letzte 8 Wochen" and similar labels; the delta is a neutral pill with an arrow (`live-pro-390.png`) |
| 20 | DTCG and `reveal` | ✅ | 254 tokens, 82 aliases, 0 unresolved; `dimension.fontSize.*.min/max`; `--transition-duration-reveal: 900ms`; `tokens.css` identical in brand and app |
| 21–22 | Stale text, Lucide licence | ✅ | `ICONOGRAPHY.md` § 7 |
| 23 | Social label size, post 01 contrast | ✅ | Label 22 px; a flat scrim under the headline (measured background L ≈ 0.047, so Bone text ≈ 9:1) |
| 24 | Calendar truncation | ✅ | `condensed` on event titles (`pro/calendar.tsx:217`); more characters fit |
| 25 | Seeded bio „Bei mir darfst du loslassen“ | ✖ | Still in `scripts/db/lib/demo-data.ts:62`, and visible on `/profis/selin-a-berlin` |

**Tally:** 32 tracked items (the 16 tasks O1–L4 plus the 16 issue-list rows that are not duplicates of a task; #18 n/a): **26 fixed, 4 partial (O1, M3, L1, #12), 2 open (L4/#3, #25)**, and 1 regression introduced (N1).

---

## 4. Per-dimension notes (changes since Audit 1)

### 4.1 Originality: 7 (▲1)
**For**
- The S im O is meaningful: the wordmark's own S, the body, inside its own O, the place. It reads "SO", the first two letters.
- It is drawn from the masters, so it is coherent with the wordmark.
- The *system* is now more ownable than any single mark:
  - Ortszeile + offset pair + Start-Code + Oxblood restraint;
  - truth as design material.

**Against**
- An initial inside an oval ring is one of the oldest monogram devices: hotel crests, heritage seals, the circled-letter convention.
- My overlay test:
  - against a serif S in an even ring: IoU 0.49 (Bodoni) / 0.52 (Gloock);
  - two generic constructions against each other: 0.81.

  So SOMA's mark is more distinct than generic monograms are from each other, but above the 0.35 line.
- At 16 px the seal reads as "white S on a dark dot", a crowded app-icon idiom.
- The wordmark is unchanged and still in its genre (acknowledged in `LOGO_USAGE.md` § 1.1a).
- **Unverified:** the 5-second recall (O1 b). Without people, I cannot score above 7.

**Remediation (required, below 8)**

| # | Task | File(s) | Expected result | Verify |
|---|---|---|---|---|
| O1b | Run the 5-second recall test as specified in `LOGO_USAGE.md` § 2.1 (≥ 8 people unfamiliar with the brand: app icon for 5 s, then describe or draw it) | Results in `brand/audit/symbol-recall-test.md` (raw answers, drawings photographed) | ≥ 6 / 8 recall a feature beyond "an S" | Read the raw answers |
| O4 | **Line-up test against the genre:** show the SOMA icon among 5 generic "serif S in an oval" icons in the same Oxblood tile, for 5 s; one minute later ask people to pick SOMA | Same file; generate the line-up with `brand/tools/build-symbol-studies.mjs` | ≥ 6 / 8 pick SOMA | Raw results |
| O5 | If O1b or O4 fails: give the line cut (≥ 32 px only, so the seal keeps 16 px legibility) **one ownable detail that a typed "S in an oval" cannot have**. Options: the S's terminals touching the O's inner contour at the stress points (the body *held* by the place); or the S shifted against the O's axis by the contrapposto offset (18 % of the stem rule). Keep the current mark as control | `brand/tools/final.mjs` `symbolMark()`, `assets/logo/concepts/symbol-studies-3.png` | IoU vs "SOMA O + Newsreader S" ≤ 0.65 and vs "even ring + serif S" < 0.35, with the meaning intact | Re-run `s-in-o-compare` (method in the evidence file's caption); recall test as O1b |
| O6 | Include the **figurative** mark in the trademark clearance (Vienna codes 27.5 letters, 26.1/26.3 circles and ovals), not only the word mark | Lead / lawyer, `PLAN.md` | No conflicting S-in-oval marks in classes 35/44/9/42 | Decision logged |

### 4.2 Visual sophistication: 8 (=)
- **Improvements:**
  - the brand book is clean (`kit-marke-hero-1440.png`, `kit-marke-symbol-section-1440.png`);
  - the 9:16 ads are recomposed with the pair;
  - post 01 has a scrim;
  - `/fuer-profis` has a calm arch hero.
- **Held back by:**
  - the clipped segment labels (N1; visible at 360 px in checkout and in Admin);
  - the formula: pair + Ortszeile + italic clause + Oxblood pill now appears in all 15 ads and most posts, which risks sameness across a campaign.
- **To 9:** fix N1; vary the signature's scale and crop across concepts (§ 12 allows "fewer arches").

### 4.3 Brand memorability: 8 (▲1)
- The mark now differs from the wordmark: the stacked lockup no longer repeats a bare S (`lockup-soma-lockup-stacked.png`).
- The signature runs in every format; the arch-check and custom icons appear in the product.
- **To 9:** M3 (the draw-on at PWA first start, once per session); a passed O1b.

### 4.4 Typography: 8 (=)
- **Fixed:**
  - the 12 px minimum on all routes;
  - DM Mono off customer pages;
  - the e-mail font stack and fallback previews;
  - `condensed` in the calendar;
  - font budget unchanged (2 preloads, 77 KB).

  On dev, a 28 KB `geist-latin.woff2` request comes from the Next.js dev overlay, not from the app. Re-check on a production build.
- **Remaining:**
  - `/fuer-profis` has 2 italic clauses (N3);
  - `/pro` shows two serif headlines, the greeting plus the empty state „Heute ist frei.“, against § 4.4 v1.1 (N6);
  - segment labels overflow instead of switching to `condensed`, as § 4.4 requires (N1, also „Stammkundschaft“ on `/fuer-profis` at 360/390: 119 px in a 91/101 px segment).
- **To 9:** N1, N3 and N6, and state in § 4.4 that the footer tagline is exempt (or remove it from the footer).

### 4.5 Logo scalability: 9 (▲1)
- **Evidence:**
  - 66 masters under `logo`, `icons`, `motif` and `splash`, plus 11 iconography SVGs: no text, raster or fonts; each has a `viewBox` and title (icons decorative by design);
  - the product's `logo.tsx` paths, `public/brand/*.svg`, `src/app/icon.svg` and `favicon.ico` are identical to the masters;
  - the seal is legible at 16 px on white, `#DEE1E6`, `#202124` and `#35363A`;
  - the stacked lockup holds at its 64 px minimum (`lockup-stacked-min-64w-x4.png`);
  - the Admin tile uses the seal (`admin-seal-tile-x4.png`).
- **Not 10:** `ios/AppIcon-20.png` and `-29.png` use the **line cut** below its own 32 px minimum; at 20 px the S hairlines blur (`icons-ios-small-x3.png`). Use the seal for these sizes (N5).

### 4.6 Colour coherence: 9 (=)
- **Oxblood count on the live DOM:**

  | Screen | Oxblood elements |
  |---|---|
  | `/profis` (390), `/buchen`, `/anmelden` | 1 each |
  | `/suche`, `/hilfe`, `/konto*`, `/buchung`, Admin | 0 |
  | `/pro` | 2 bars of the rating distribution (a chart series) |
  | `/fuer-profis` | 1 CTA, plus 6 bars in the demand chart further down |

- The cursor spotlight is gone; the Pro earnings delta is neutral.
- Admin keeps red and green deltas: acceptable in an internal console.
- **Not 10:** the vermilion error still sits directly above the Oxblood CTA on the unknown-postcode screen (`live-suche-empty-390.png`).

### 4.7 Digital usability: 8 (=)
- **Fixed:** count-ups, sparkline labels, a postcode field on the profile booking card (1440).
- **New problem:** in the checkout at 360 px the selected place reads "✓ ⌂ Zuhau" and the rest is invisible (`regression-checkout-place-switch-360.png`). This is on the money path.
- **Still open from Audit 1's list to 9:** the mobile sticky bar on the profile shows „89 € zzgl. Anfahrt“ with no postcode prompt (`live-profil-390.png`).
- **To 9:** N1; a postcode prompt in the mobile sticky bar.

### 4.8 Accessibility: 8 (=)
- **The contrast probe found 0 genuine failures** on 14 routes. The 7 hits are the same false positives as in Audit 1: the sliding segment indicator, and collapsed accordions at opacity 0.
- The focus ring is unchanged and correct (`a11y-focus-ring-checkout-390.png`).
- Chips carry a check; the PDF is tagged; the social AI label is 22 px.
- **New:** N1 clips the selected label. The cut-off part renders Bone on Linen (1.08:1), so content is lost (WCAG 1.4.4 / 1.4.10 at 360 px). In Admin it happens at every width.
- **To 9:**
  - fix N1, and add a probe to CI that fails when a segment's `scrollWidth` exceeds its label width at 360 px;
  - label the Pro mobile header avatar (N4).

### 4.9 Cross-platform consistency: 8 (▲1)
- **Consistent now:**
  - product, applications, brand book and e-mail share the mark, icons, glyph, AI labelling and tokens;
  - `brand/DESIGN_TOKENS/tokens.css` is identical to `src/styles/tokens.css`;
  - the masters are byte-identical.
- **Remaining:**
  - M3: the draw-on exists on `/kit/marke` only;
  - N4: the Pro mobile avatar has no AI label, while the desktop sidebar has one.
- **To 9:** M3, N4.

### 4.10 Long-term relevance: 8 (▲1)
- **Done:** the guardrail (§ 12), the SaaS residue removed, no italic accents in the app, DTCG-compatible tokens.
- **Remaining:**
  - L4 trademark (with O6);
  - KPI sparkline cards stay in Pro and Admin. They are labelled and functional, but on the watch list; justify them in the yearly review.
- **To 9:** L4 + O6 decided; the first yearly review scheduled in `PLAN.md`.

---

## 5. New issues (Audit 2)

| # | Sev. | Issue | File(s) | Fix | Verify |
|---|---|---|---|---|---|
| **N1** | **P1** | `SegmentedControl` now prepends a check to the selected option without making room. The selected label overflows its pill and the overflow is invisible (Bone on Linen 1.08:1). Measured content vs segment width: <ul><li>checkout place switch at 360 px: Zuhause 118/91, Hotel 99/91, Büro 95/91</li><li>Admin range "30 Tage" 93/78 at 390 and 1440</li><li>`/fuer-profis` „Stammkundschaft“ 119/91 (360) and 119/101 (390)</li></ul> | `src/components/ui/segmented.tsx` (and callers: `checkout-form.tsx`, `admin/range-switch.tsx`, `fuer-profis` calculator) | When an option already has a leading icon, **replace** it with the check on selection instead of adding one. Apply `condensed` (wdth 86) to labels; let segments size to content (`flex-auto` / `min-w-fit`) and allow a two-row fallback below 360 px | Probe (`input.peer` → `nextElementSibling.scrollWidth ≤ label width`) reports no clipping at 360/390/1440 on `/buchen`, `/admin`, `/fuer-profis`; screenshots |
| N2 | P2 | The draw-on intro is not in the product (M3) | New `src/components/brand/intro.tsx` per `SPLASH.md` § 3, mounted in `layout.tsx` | Plays once per session in standalone mode only; `pointer-events: none`; skipped with reduced motion | Playwright with `display-mode: standalone` emulation: the overlay shows for ≤ 1.2 s once and not on reload; with reduced motion it does not show |
| N3 | P2 | Two italic accent clauses on `/fuer-profis`; § 4.4 silent on the footer tagline | `src/app/fuer-profis/page.tsx:420`; guidelines § 4.4 | Make „Weitere Städte folgen.“ roman; state in § 4.4 that the footer sign-off tagline is exempt (or drop it from the footer) | `italics` probe: ≤ 1 italic outside the footer on every route |
| N4 | P3 | Pro mobile header avatar (AI photo) without a label | Pro mobile header component (`src/app/pro/(app)/layout.tsx` or its header) | Use initials in the 32 px header avatar in demo mode, or add the label in the profile sheet it opens | Probe on `/pro` at 390: no unlabelled AI photo |
| N5 | P3 | iOS 20/29 px (and any ≤ 31 px) app icons use the line cut | `brand/tools/build-icons.mjs` | Use the seal cut below 32 px, as `LOGO_USAGE.md` § 3.3 says | `icons-ios-small-x3.png` re-render |
| N6 | P3 | Two serif headlines on `/pro` (greeting + empty state) | `src/app/pro/(app)/page.tsx`, the empty-state usage | Empty-state title in the sans when the view already has a serif greeting, or make § 4.4 explicit that empty states inside cards are sans | `em-count` probe: 1 serif headline on `/pro` |
| N7 | P3 | The O1 criterion (mine) admitted any enclosure | this audit | Replaced by O1b + O4 (people) and the genre IoU in O5 | — |

---

## 6. Experiences (delta only)
- **Customer:**
  - search, profile, checkout, booking detail and account now carry honest AI labels;
  - the arch-check makes "Bestätigt." unmistakably SOMA;
  - the checkout gained the arched-door place icons;
  - the only flaw found is N1 at 360 px.
- **SOMA Pro:**
  - labelled sparklines;
  - a neutral earnings delta;
  - 12 px chips;
  - `condensed` calendar events;
  - the label in the desktop sidebar (N4 on mobile).
- **Admin:**
  - the seal tile;
  - neutral as intended;
  - N1 on the range switch.

---

## 7. Verdict

**Not approved yet, but close: 9 of 10 dimensions at ≥ 8; Originality at 7.**

The team fixed every P0 and nearly every P1 from Audit 1, and verified most of it with evidence that I could reproduce.

Two things stand between SOMA and the gate:
1. **N1**, a one-component regression on the booking form. Fix it before anything else.
2. **Proof of originality with people (O1b, O4).** If the S im O fails the genre line-up, add one ownable detail to the line cut (O5).

The S im O is a good idea well executed. Whether it is *ownable* is an empirical question that no script can answer. Trademark clearance (L4, now including the figurative mark, O6) remains the launch blocker.

**For Audit 3:** rerun the scripts in `brand/audit/scripts/` plus the new probes. They are in `/tmp/audit2/` and will not survive a container restart, so the Lead should copy them to `brand/audit/scripts/audit-2/`:
- `render-logos2.cjs`
- `s-in-o-compare.cjs`
- `seg-more.cjs`
- `seg-admin.cjs`
- `em-count.cjs`
- `italics.cjs`
