# SOMA brand identity: Independent Brand Audit 3

*Independent Brand Auditor · 1 Nov 2026 · re-audit after the Brand Audit 2 remediation (commits `763466f` … `3ffc971`).*
*Evidence: `brand/audit/brand-audit-3/`. Probes: `brand/audit/scripts/audit-3/` (all scripts used here, including the new `s-in-o-compare3.cjs`, `seg-shot3.cjs` and the v1.1 reference masters). Paths are relative to `soma/`.*

**Method: the same probes as Audits 1 and 2**, pointed at the dev server on :3000:
- the brand probe: Oxblood count, fonts, AI labels, `Sie`, exclamation marks, at 390×844 (dsf 2) and 1440×900;
- computed contrast for every visible text node on 14 routes, plus the text floor, focus ring, chip semantics and font loading;
- segment clipping at 360 / 390 / 1440 px;
- italic and serif-headline counts per route;
- SVG hygiene;
- byte comparison of masters against the product.

**New in this audit: an independent genre-overlap test** of the v1.2 symbol, run two ways:
- the Audit 2 method (trim, then resize 240 × 262 "fill");
- an aspect-preserving variant (scale to height, centre, best of ±12 px shifts), because the Versatz widens the bounding box.

The test runs against:
- ring monograms;
- the SOMA plain O with a typed S;
- the Versatz ring with a typed S;
- for the seal, the right reference: **solid ovals with a white serif S**.

**Scope:** product pages only. `/` is excluded (the landing page is in progress), and :3100 was not used.

---

## 1. Executive summary

Every product task from Audit 2 is fixed and probe-verified:

| Task | Verified result |
|---|---|
| N1 | The segmented control no longer clips: 0 clipped segments on `/buchen`, `/admin` and `/fuer-profis` at 360 / 390 / 1440 |
| N3 | ≤ 1 italic clause outside the footer on every route checked |
| N4 | The Pro mobile header shows initials |
| N5 | The iOS 20 / 29 px icons use the seal |
| N6 | `/pro` has one serif headline |
| Seed bio | Reworded |

Contrast still shows 0 genuine failures; the text floor is 12 px on all 14 routes; Oxblood is unchanged at ≤ 1 per screen.

**The v1.2 symbol, "S im O" with the Versatz, is the right design answer to O5.**
- The O is cut at the waist and its halves are offset by one hairline. That is the contrapposto made visible in the place itself: a detail a typed "S in an oval" cannot have.
- I reproduced the designer's figures for the line cut within 0.01:
  - against generic S-in-oval monograms: **0.24–0.31** (aspect-preserving 0.27–0.34; target < 0.35);
  - against the SOMA plain O with a typed S: **0.40–0.45** (target ≤ 0.65).

**Two qualifications:**
1. **The seal was compared with the wrong genre.** The designer's "0.24 vs generic S-in-oval" compares a *filled* seal with *rings*.
   - Against filled ovals with a white serif S (the badge genre the seal actually belongs to), the seal overlaps **0.71–0.75**. Two generic badges overlap each other at 0.92, and the v1.1 seal scored 0.85–0.88.
   - The Versatz moves the seal away from the genre, but not out of it. At 16–32 px (favicon, tabs, Admin tile, small iOS icons) SOMA is still "a white S on a dark oval, with two notches".
2. **The applications were not rebuilt.** Social avatar, brand post 05, the grid preview, the app-icon board with its four home-screen mock-ups, and the motion specimen and storyboards still show the **v1.1 symbol without the Versatz** (`stale-applications-v11-symbol.png`). This is a new cross-platform inconsistency (N8).

**Scores:**
- **Average 8.2** (A1 7.6, A2 8.1).
- Nine dimensions at ≥ 8; Typography rises to 9.
- **Originality stays at 7.**

The design side of originality is done. What remains is perceptual and cannot be measured by a script:
- Do people recall the mark beyond "an S" (O1b)?
- Can they pick it out of the genre (O4)?
- Does the step read as intended, or as a misprinted O or a sync arrow? Those are the two failure modes the team's own studies used to reject earlier variants.

**Gate: not met. On the available evidence Originality cannot reach 8.** It will reach 8 without further design work if the human tests pass (§ 4.1).

---

## 2. Scores and trend

| # | Dimension | A1 | A2 | **A3** | Trend A2→A3 | Reason (A3) |
|---|---|---:|---:|---:|:---:|---|
| 1 | Originality | 6 | 7 | **7** | = | The Versatz is an ownable detail (line cut 0.24–0.34 vs genre); the seal stays in the badge genre (0.71–0.75); recall and line-up tests unrun |
| 2 | Visual sophistication | 8 | 8 | **8** | = | N1 fixed. The applications show a superseded mark, and the signature formula is still unvaried across concepts |
| 3 | Brand memorability | 7 | 8 | **8** | = | Unchanged evidence; the Versatz may help, but that is unverified; the draw-on only in the landing page (not auditable yet) |
| 4 | Typography | 8 | 8 | **9** | ▲ | Every Audit 2 item met: one italic outside the footer per route, one serif headline on `/pro`, condensed segment labels, the footer rule written down; floor 12 px; budget 77 KB |
| 5 | Logo scalability | 8 | 9 | **9** | = | The seal from 16 px (incl. iOS 20 / 29), rim on dark tabs; masters clean (66 SVG) and byte-identical in the product. The line-cut step is about 1.4 px at 40 px |
| 6 | Colour coherence | 9 | 9 | **9** | = | ≤ 1 Oxblood element per screen (chart series excepted); no change |
| 7 | Digital usability | 8 | 8 | **8** | = | N1 fixed; the profile's mobile sticky bar still has no postcode prompt (an Audit 2 "to 9" item) |
| 8 | Accessibility | 8 | 8 | **8** | = | 0 genuine contrast failures, no clipping, floor 12 px, Pro avatar fixed. The E2E guard against segment clipping (an Audit 2 "to 9" item) is missing |
| 9 | Cross-platform consistency | 7 | 8 | **8** | = | Product, brand book and masters are aligned (byte-checked). **New:** five application sets still carry the v1.1 symbol (N8) |
| 10 | Long-term relevance | 7 | 8 | **8** | = | Trademark (L4) and the figurative-mark search (O6) are not logged; no yearly review scheduled in `PLAN.md` |

**Average 8.2. Gate (≥ 8 in all ten): not met** (Originality 7). No 10 is given.

---

## 3. Verification of the Audit 2 tasks

Legend: ✅ fixed (verified) · ◐ partial · ✖ open · ⊘ not verifiable in this environment

| Task | Status | Evidence (Audit 3) |
|---|:---:|---|
| **O1b** 5-second recall | ⊘ ✖ | Not run (needs people). The protocol is in `LOGO_USAGE.md` § 2.1 |
| **O4** Genre line-up | ⊘ ✖ | Not run. Protocol present; see N9 for the gaps |
| **O5** Ownable detail in the line cut | ✅ | v1.2 Versatz. Independent re-measure (`originality-v12-vs-genre.png`, `scripts/audit-3/genre-iou-a3.json`): <ul><li>vs even ring + Bodoni / Gloock / Newsreader S: 0.28 / 0.31 / 0.24 (fill), 0.32 / 0.34 / 0.27 (aspect)</li><li>vs Ⓢ: 0.22</li><li>vs SOMA plain O + Bodoni / Newsreader S: 0.44 / 0.41</li></ul>All pass. Meaning intact (contrapposto) |
| **O5** (seal, same criterion) | ◐ | Passes against rings (0.21–0.26), but that is the wrong genre for a solid. Against a solid oval with a white Bodoni / Gloock S: **0.71 / 0.73** (aspect 0.72 / 0.75); v1.1 seal 0.85 / 0.88; generic against generic 0.92 (N10) |
| **O6** Figurative mark in the trademark search | ✖ | Not in `PLAN.md` |
| **N1** Segment clipping | ✅ | `seg-more` / `seg-admin` probes: 0 clipped at 360 / 390 / 1440. Measured (content / segment): Zuhause 89 / 89 at 360; "30 Tage" 84 / 84; „Stammkundschaft“ no longer overflows (`fixed-checkout-place-switch-360.png`, `fixed-fuer-profis-segmented-360.png`, `fixed-admin-range-switch-1440.png`). The check replaces the place icon when selected; labels are condensed |
| **N2** Draw-on in the product | ◐ ⊘ | Hooks exist in `src/components/landing/seal/closing-lockup.tsx` (`data-seal-part="o-trace"…`, current `SYMBOL_PATHS`); the motion layer is in progress and `/` is excluded. **`SPLASH.md` § 2 still specifies a PWA cold-start intro that is not built**, so the documents and the product differ |
| **N3** One italic per page; footer rule | ✅ | `italics` probe: `/fuer-profis`, `/hilfe`, `/staedte/berlin` and `/behandlungen/massage` have 1 each outside `<footer>`; `/suche` and `/profis` 0. Rule in guidelines § 4.4 (footer tagline = lockup) and `LOGO_USAGE.md` § 2 |
| **N4** Pro mobile avatar | ✅ | Initials "SA" in the header at 390 (`live-pro-390.png`) |
| **N5** Seal for iOS 20 / 29 px | ✅ | `icons-ios-small-x3.png` |
| **N6** One serif headline on `/pro` | ✅ | `em-count`: `/pro` → ["Guten Abend, Selin."] |
| **#25** Seeded bio „loslassen“ | ✅ | `grep -rni "loslassen" scripts/db src` is empty; the live bio is reworded |
| **L4** Trademark clearance | ✖ | Unchanged |
| **Audit 2 "to 9" items** | ◐ | Done: <ul><li>typography: all of its items</li><li>accessibility: N1, N4</li><li>usability: N1</li></ul>Open: <ul><li>CI guard for segment clipping (no `scrollWidth` test on segments in `tests/e2e`)</li><li>postcode prompt in the profile's mobile sticky bar</li><li>varied signature in ads</li><li>yearly review in `PLAN.md`</li></ul> |

**Tally of the 13 Audit 2 tasks (O1b–L4):**
- 8 fixed;
- 2 partial (O5 seal, N2);
- 3 open, of which 2 (O1b, O4) cannot be done here.

**Also checked:** the masters are clean (66 SVG: no text, raster or fonts; each has a `viewBox` and title). In the product, all of these are byte-identical to the masters:
- `logo.tsx` paths;
- `public/brand/*.svg` / `*.png`;
- `src/app/icon.svg`, `favicon.ico`, `apple-icon.png`;
- the PWA icons;
- the splash images;
- `tokens.css`.

---

## 4. Per-dimension notes

### 4.1 Originality: 7 (=), and what it takes to reach 8

**What the evidence supports:**
- The Versatz is a real, ownable, meaningful detail. It is the brand idea (contrapposto) applied to the place, and it is consistent with the S and the arch pair.
- At display sizes it is clearly intentional (`logo-symbol-line-large.png`).
- The line cut now sits outside the enclosed-monogram genre by the agreed metric, reproduced independently.
- The system around it is ownable too: the signature pair with the Ortszeile, the Start-Code and Oxblood restraint.

**What it does not support (yet):**
1. **Small sizes.** Below 32 px the seal is used (favicon, tabs, Admin tile, iOS 20 / 29). Its silhouette remains 0.71–0.75 similar to a generic serif-S badge (`logo-symbol-seal-*-small-x4.png`, `favicon-*-x6.png`).
2. **Perception.** The step is 40 units, so 1.4 px on a 40 px icon and about 1.8 px on a 32 px icon. At those sizes it can read as a misregistered O, which was the "glitch" objection that killed the *Fuge* study. On the 16 px seal, the two opposed notches plus the S's rotation can read as a refresh / sync glyph, which killed the v1.1 *Versatz* study.
3. **Neither point can be measured by a script.** Both need people.

**Can it reach 8 on the available evidence?** **No.**
- The machine evidence is now necessary *and* met for the line cut, so I give the design work full credit.
- But in Audit 2 I stated that the remaining question is empirical, and nothing empirical has been added.
- **If O1b and O4 pass (with N9's amendments), I will score Originality 8 without further design work.**
- If they fail, `LOGO_USAGE.md` § 2.1 already names the next step: Versatz 60.

**Remediation (required, below 8)**

| # | Task | File(s) | Expected result | Verify |
|---|---|---|---|---|
| O1b | Run the 5-second recall test (≥ 8 people outside the team), per `LOGO_USAGE.md` § 2.1 | `brand/audit/symbol-tests.md` (raw answers, drawings photographed, participant profile without personal data) | ≥ 6 / 8 recall a feature beyond "an S" (oval or O, the step, "SO") | Raw answers |
| O4 | Run the genre line-up, **amended per N9**: a second line-up for the seal at 32 px against five solid "white serif S on an oval" badges | same file; generate the tiles with `brand/tools/lib/genre-iou.mjs` shapes | ≥ 6 / 8 pick SOMA in each line-up | Raw results |
| O7 | Add a **negative-association question** to both tests: "Does anything look wrong or remind you of something?" | `LOGO_USAGE.md` § 2.1 protocol | ≤ 2 / 8 answer "broken / misprinted O" or "refresh / sync / arrows" | Raw answers |
| O6 | Figurative-mark clearance (Vienna 27.5 letters, 26.1 / 26.3 ovals) together with the word mark | Lead / lawyer → `PLAN.md` | Logged decision | `PLAN.md` |

*Practical note:* O1b, O4 and O7 can be run in one 10-minute unmoderated session per person, with colleagues or friends outside the project. No paid panel is needed; a paid one would need client approval.

### 4.2 Visual sophistication: 8 (=)
- N1 is fixed; the product and brand book are refined (`kit-marke-symbol-section-1440.png`).
- **To 9:**
  - rebuild the applications with v1.2 (N8);
  - vary the signature's scale and crop across the three ad concepts (Audit 2 item, open).

  Note: the square shoulders are a deliberate architectural note inside a calligraphic mark. They are convincing at display size, and their small-size reading is covered by O7.

### 4.3 Brand memorability: 8 (=)
- No new evidence. The draw-on in the landing's closing lockup will be judged in the landing audit.
- **To 9:** a passed O1b, and the draw-on live in the product (landing band or PWA start, with `SPLASH.md` updated to match, N2).

### 4.4 Typography: 9 (▲1)
- **Evidence:**
  - `italics` / `em-count` probes: ≤ 1 italic clause outside the footer on every public route; 0 in app screens; one serif headline on `/konto`, `/buchung`, `/pro` and its sub-pages;
  - condensed labels in segments (N1 screenshots);
  - floor 12 px on all 14 routes;
  - `/anmelden` loads 2 families;
  - budget 77 KB preloaded;
  - the footer tagline rule written down (guidelines § 4.4).
- **Not 10:** `/behandlungen` sets seven category names in the serif in one grid. § 4.4 exempts *Profi* names only; either extend the exemption to category tiles or use the sans. The DM Mono references in Pro and Admin are allowed but add a third family.

### 4.5 Logo scalability: 9 (=)
- **Evidence:**
  - seal at 16 / 24 px on light, dark and Oxblood;
  - the favicon rim follows the Versatz and is visible on `#202124` / `#35363A` (`favicon-dark*-x6.png`);
  - iOS 20 / 29 use the seal;
  - the stacked lockup holds at 64 px (`lockup-stacked-min-64w-x4.png`).
- **Watch:** the line-cut step at 32–40 px (≈ 1.4–1.8 px) is at the edge of rendering. O7 will show whether it reads as intended.

### 4.6 Colour coherence: 9 (=)
- Oxblood elements per screen:

  | Screen | Oxblood elements |
  |---|---|
  | `/profis` (390), `/buchen`, `/anmelden` | 1 each |
  | `/suche`, `/hilfe`, `/konto*`, `/buchung`, Admin | 0 |
  | `/pro` | 2 chart bars |
  | `/fuer-profis` | 1 CTA, plus a chart further down |

- Unchanged from Audit 2; error states as before.

### 4.7 Digital usability: 8 (=)
- N1 fixed on the money path.
- **To 9:** a postcode prompt in the profile's mobile sticky bar. It still reads „89 € zzgl. Anfahrt“ (`live-profil-390.png`); open since Audit 1's "to 9".

### 4.8 Accessibility: 8 (=)
- 0 genuine contrast failures. The 4 remaining hits are text inside the collapsed "Stornobedingungen im Detail" accordion at opacity 0: false positives.
- Focus ring unchanged and correct; no clipping; floor 12 px; AI labels on all Profi photos, with initials in the Pro header.
- **To 9:** an E2E test that fails when any `SegmentedControl` label's `scrollWidth` exceeds its segment at 360 px on `/buchen`, `/admin` and `/fuer-profis` (`tests/e2e/`). The regression in Audit 2 showed the risk is real.

### 4.9 Cross-platform consistency: 8 (=)
- **Product, brand book, masters, icons and splash** are aligned and byte-checked.
- **New:** the applications still show v1.1 (N8). They are generated from the masters, so a rebuild fixes them.
- **To 9:** N8 + N2.

### 4.10 Long-term relevance: 8 (=)
- **To 9:**
  - L4 + O6 logged;
  - the first yearly review (guidelines § 12) put on the calendar in `PLAN.md`.

---

## 5. New issues (Audit 3)

| # | Sev. | Issue | File(s) | Fix | Verify |
|---|---|---|---|---|---|
| **N8** | **P1** | Applications not rebuilt after v1.2: they show the v1.1 symbol (no Versatz). Affected: <ul><li>`social/avatar-1080.png`</li><li>`social/instagram/post-05-brand.png`</li><li>`social/instagram-grid-preview.png`</li><li>`app-icons/app-icons-board.png` and the four home-screen mock-ups</li><li>`motion/specimen.html` and `storyboard-1…3.png` (`motion.mjs` inlines `soma-symbol.svg` at build)</li></ul>Thumbs and `overview.jpg` follow | `brand/applications/_src/build-all.mjs` | Rebuild all applications | Every file under `brand/applications/` that shows the symbol is newer than `763466f`; visual check that the shoulders are present (`stale-applications-v11-symbol.png` shows the current state) |
| N9 | P2 | The O4 protocol tests only against *ring* monograms and has no negative-association question | `LOGO_USAGE.md` § 2.1 | Add the seal line-up against solid S-badges, and O7 | Read-through |
| N10 | P2 | The documented seal metric ("0.24 vs generic S-in-oval") compares a solid with rings and overstates its distinctiveness | `LOGO_USAGE.md` § 2.1 table, guidelines § 2, `concepts/symbol-studies-3.*`, `brand/tools/lib/genre-iou.mjs` | Add "solid oval + white serif S" references and report the seal against them (0.71–0.75; v1.1 0.85–0.88; generic baseline 0.92) | Rebuilt studies table |
| N11 | P3 | `SPLASH.md` § 2 specifies a PWA cold-start intro that is not built; the draw-on now lives in the landing band | `brand/assets/splash/SPLASH.md` | Update the "Where it runs" table to the landing band, or build the PWA intro | Read-through, or a Playwright standalone check |
| N12 | P3 | Category tiles on `/behandlungen` set seven names in the serif in one view | `src/app/(site)/behandlungen/(uebersicht)/page.tsx` or guidelines § 4.4 | Sans titles, or extend the "names" exemption to category tiles explicitly | `em-count` / serif probe |

Carried forward (P2/P3):
- the E2E guard for segments (§ 4.8);
- the postcode prompt in the mobile sticky bar (§ 4.7);
- varied signature crops (§ 4.2);
- the yearly review date (§ 4.10).

---

## 6. What remains unverifiable here
- **O1b / O4 / O7:** human perception of the mark (recall, genre separation, unintended associations). This is the only thing between Originality and 8.
- **N2:** the draw-on in the landing band, because `/` is excluded. Judge it in the landing audit.
- **Production build:** fonts were measured on dev (a 28 KB `geist-latin.woff2` request comes from the Next.js dev overlay, not the app). Re-measure on :3100 after the next build.
- **Trademark:** legal clearance of the word and figurative marks (L4, O6).

---

## 7. Verdict

**Not approved yet: 9 of 10 dimensions at ≥ 8; average 8.2; Originality at 7.**

The team has now fixed every product, document and accessibility finding from Audits 1 and 2, and I can reproduce the results. The v1.2 symbol solves the design problem I set in Audit 2.

The originality gate is now an evidence problem, not a design problem:
- **Run O1b, O4 and O7 with people.** If they pass, Originality becomes 8 and the brand gate is met.
- **Before that, rebuild the applications (N8),** so that the mark people are tested against is the mark the brand actually shows everywhere.
- Correct the seal's genre figure (N10).

Trademark clearance of the word *and* figurative mark remains the launch blocker outside the brand gate.
