# SOMA landing page: independent quality audit 5

*Independent Landing Auditor · 2 Nov 2026 · production build on `http://localhost:3100`, build `gDkeDgY0_5OV0X9PV7SEO`, written 17:09:37 UTC; server started 17:09:43 (PID 30774), `DEMO_MODE=true`. The Lead reports that `.next/server/route-cache` and `.next/cache/images` were cleared before the start.*

*The build predates its last code commit, `9737d2c` (17:18), so I checked what it serves:*
- the hero `sizes` in the served HTML is the width-only string in `hero/places.ts`;
- the HTML is 416 KB raw, the commit's own number;
- the index, the hero arch and the other islands carry their error boundaries.

*`327ccce` (17:27) is docs only. This is the state the Lead says is already on the client's Netlify.*

*Evidence: `docs/landing/audit-5/` (screenshots and photo sheets, raw JSON in `data/`, every log in `data/logs/`, every probe in `scripts/`). Every number was measured on this build in this audit.*
- I changed nothing in `src/`, tests, configs or other docs.
- I did not restart or rebuild `:3100` and did not run `demo:refresh`.
- The engineers' and the Photo Art Director's claims (commit messages `d4dce99` / `9737d2c`, `AUDIT-v4.md` "Post-audit-4 fixes", spec § 4.1.2) are treated as claims and re-measured (§ 4, § 5).

---

## 1. Summary and verdict

**Every audit-4 blocker is fixed and independently verified:**

| Audit-4 item | A4 | A5 |
|---|---|---|
| **N4-1 (P0)** 02 index crash in the lite/none tiers | 8/8 lite/none cases blank the page | **0/8.** 7 chapters, 0 errors in every case, including wheel-scrolling with the pointer at x = 300. The preview still follows hover and focus in all three tiers (`data/index-preview.json`). |
| **N4-3 (P1)** stale optimiser variants of rejected photos | 4 of 368 responses differ from the file | **0 of 368** (`stale-images.py`). `fresh-check.mjs`: 181 served paths, 0 reused names, 0 older remotes, 0 not approved. |
| **N4-2 (P2)** two hero fetches at 390 / 768 / 820 | 2 requests, console warnings | **1 request at every width.** Console 0 at 8 widths and in 10 walks. |
| **N4-4 (P2)** 05 jump hides its heading below 1024 | h2 at 739 / 1000 / 1048 px | h2 at 24–37 % of the view, clear of the dock at 360, 390, 412, 768, 820, 1023 |
| **N4-5 (P2)** hotel hero discretion | back bare to mid-back | `hotel-v6b`: linen to the shoulder blades, at hero scale (1440, 768, 390) |
| **N4-6 (P3)** pair continuity, barefoot Profi | two clients; barefoot | the same client at the door and on the sofa; the pedicure Profi wears slip-ons |
| **M-7** lead under the dock | lead 782 vs dock 776 (390) | lead 838, below the dock's bottom edge (832); same at 412 / 430 |

- **The engineer's R4-3 claim holds** (§ 5).
  - With any height in `sizes` (`svh`, `vh` or `max-height` media), Chromium's preload scanner and the `<img>` pick different widths in at least one realistic set-up.
  - Both of audit 4's options would have failed: dropping the preload below 1024 still fetches twice, because the scanner's speculative `<img>` fetch is what diverges; height media conditions fetch twice on a DPR-3 phone with browser UI.
  - Width-only `sizes` is the only variant with one fetch in all five set-ups. Its cost is that audit 3's over-fetch below 1024 is back (§ 10, N5-1).
- **E2E landing suites:** 85 passed, 19 skipped, 0 failed. This includes the new N4-1 / N4-2 / N4-4 / R4-1 tests in the projects they target.
- **Lighthouse mobile `?motion=lite`:** median 91 over 9 runs, interleaved with the control route `/hilfe`. The stall hit 1 of 9 runs on each route, so audit 4's N4-7 (landing stalls more than the control) does not reproduce.

**Verdict: passing. 11 of 11 dimensions ≥ 8** (A4: 8 of 11). No follow-up push is needed for the gate. The open items in § 13 are P3 polish: hero over-fetch below 1024, two interactions at the 200 ms line on a 4× phone, and M-8.

## 2. Scores

| # | Dimension | A3 | A4 | **A5** | One-line basis |
|---|---|---|---|---|---|
| 1 | Overall visual experience | 8 | 8 | **8** | Calm seven-chapter page; the daylight set reads cohesive and every hero place is an approved frame. 05 below 1024 now opens on its headline. Held back by the small first-view arch at 768–1023 (243 / 265 px). |
| 2 | Brand fidelity | 9 | 8 | **9** | Only approved photos are served; discretion holds at hero and tile scale; the signature pair tells one story; light uniforms and shoes; Ortszeilen match the light; AI labels on portraits, in the picker („Bilder KI-generiert“) and in the footer. Not 10: AI interim imagery (I-16); portraits a little stock-like. |
| 3 | Typography and composition | 8 | 8 | **8** | M-7 fixed (the lead clears the dock). Band title ≥ 8.9:1, lead ≥ 5.5:1. Still open: M-8 (hard-coded head heights, `landing.css:362, :395`). |
| 4 | Interaction design | 8 | 7 | **8** | No crash in any tier; the index preview follows hover and focus in full, lite and none; jumps land at 7 widths, 05 included; sheet median 127 ms at 4×. Minor: overlay open and place switch at the 200 ms line (medians 192 / 197, 4/9 runs > 200). |
| 5 | Animation quality | 8 | 8 | **8** | Tiers correct for every setting; lite and none swap directly, full animates; seal at 42 % / 31 %. Full tier at 4× CPU: 41 / 45 frames > 50 ms on a quiet machine (A4 47); one noisy run had 72, reported. |
| 6 | Mobile experience | 8 | 8 | **8** | First view clean (lead below the dock); booking control always in view; Ortszeile clear of the dock; one hero request; 05 jump shows its heading. Minor: early sheet 313 ms; the hero photo is over-fetched at 390 DPR 2 (828 w for a 280 px arch). |
| 7 | User experience | 8 | 8 | **8** | The decluttered flow now works for every visitor group, including reduced-motion and Save-Data desktops; FAQ 5 plus „Alle Fragen“; Entdecken first. |
| 8 | Conversion clarity | 8 | 8 | **8** | Every CTA and hand-off verified again: hero search keeps every parameter, no-JS submit, deep link, 03 CTA by keyboard, 07 CTA upgrade; 38 link targets 200. |
| 9 | Technical quality | 8 | 6 | **8** | Island boundaries with server-equal fallbacks plus a fault-injection E2E; fresh image names plus `fresh-check`; one hero fetch; console 0; E2E 85/19/0; JSON-LD = FAQ; HTML 416 KB raw / 54.6 gz. Not 9: the width-only `sizes` trades bytes for correctness below 1024. |
| 10 | Accessibility | 8 | 6 | **8** | axe 0 violations (1440 / 768 / 390); the whole-page Tab walk reaches 07 and the footer at 6 widths with 0 order breaks and 0 invisible stops, desktop included; reduced motion is safe; the 05 jump focuses a visible heading. Not 9: no screen-reader pass; desktop footer links 32 px. |
| 11 | Performance | 7 | 8 | **8** | LH mobile median 91, desktop 99; perf.js TBT 95, LCP 2.36 s, CLS 0; DevTools TBT 179; sheet 127 ms at 4×. Minor: early sheet 313; overlay / place switch at the line; hero over-fetch below 1024. |

**11 of 11 dimensions are ≥ 8.**

---

## 3. Method and environment

- **Same method as audits 3 and 4** (probes copied to `audit-5/scripts/`, paths repointed, viewports as before).
- **Visitor tiers:** `?motion=lite` for mobile gates, `?motion=full` for desktop, `webdriver` masked where the visitor path matters.
- **Order of runs** (`scripts/run-all.sh`), strictly sequential:
  1. Wait for a 1-minute load below 1.2.
  2. Lighthouse 12.8.2: mobile simulate, landing and `/hilfe` interleaved 9 + 9; `/` 5; DevTools 5; desktop 3. The load before each run is in `logs/lh-load.log` (0.1–1.9).
  3. The timing chain: `perf.js` 5; `latency.js` 2 × 3 settled and 2 × 3 early; `hydration`; `early`; `pickers4`; `scrollperf`; `preload-lcp`.
  4. The functional chain.
  5. The E2E suites.
  6. `repeat.sh`: one more latency batch and the 4× scroll runs, on a quiet machine. The first latency and scroll numbers came out worse than A4, so per the Lead's rule they were repeated; every run is reported.
- **New probes:**
  - `sizes-lab.js`: R4-3 on a local test page with the real optimiser `srcset`, five `sizes` set-ups × five device set-ups, with screen = viewport and with a screen taller than the viewport.
  - `index-preview.js`: the preview works, not only "no crash".
  - `jump05.js` with JSON output.
  - `pair.js`: the signature pair in context.
  - `photos.js`: viewport shots instead of the element shots that came out blank in A4.
- **Probe fixes:**
  - `jump.js` first used the hidden „Kapitel“ button at 820 and was re-run with „Menü“ (`logs/jump.log` is the re-run).
  - `run-all.sh` renames each single Lighthouse run from a scratch label, so no run is lost (A4 lost one).
- **Database:** the E2E suites once; `rebook.js` logged in once as `testkunde@soma.test`.
- **Not verified:** real devices (the screen-taller-than-viewport cases are Playwright's `screen` emulation), WebKit, screen readers.

---

## 4. Re-verification of the audit-4 remediation

| Item and claim | Measured | Holds? |
|---|---|---|
| **R4-1** (`d4dce99`, `9737d2c`): pure updater, direct switch in lite/none, error boundaries per island, E2E | `index-crash.js`: 8/8 cases (1440 hover / Tab in full, reduce and Save-Data; 1280, 1024 and 1920 reduce) have 7 chapters and 0 errors. `index-crash-scroll.js`: 7 chapters at x = 300 and x = 1100. `index-preview.js`: in full, lite and none, hover → Pediküre, then focus → Make-up (`data-active`, caption and top image follow), one layer left, no fallback in use. Code: `use-layer-swap.ts:31-50` (the counter is taken before `setLayers`; `direct` when nothing animates), `swap-layer.tsx:28-39` (rAF settle, never synchronous), `island-boundary.tsx`, used for the hero arch, place switch, booking entry, 02 index, rail arrows, 03 step buttons, 05 Profi link and 07 CTAs. The fault-injection E2E (`landing-motion.spec.ts:467`) passes. | **Yes.** The hero and index fallbacks are present in code; I did not fault-inject those two myself. |
| **R4-2:** 17 approved files under fresh `-v6` names, plus `hotel-v6b`; `fresh-check.mjs` | `stale-images.py 1080`: 184 URLs × AVIF and WebP = 368 responses, 0 differ from the file on disk (114 cache hits, 254 fresh). `fresh-check.mjs`: "181 served paths checked: 0 reused names, 0 fetched from an older remote, 0 not the ledger's approved job" (exit 0, `data/fresh-check.json`). The landing serves `hotel-v6b`, `app-pro-v6`, `massage-v6`, `pedikuere-v6`, `after-v6`, `arrival-v5`, `manikuere-v5`, `pro-16-v5`. | **Yes** |
| **R4-3:** width-only `sizes`; heights fail on real phones | One hero request at 360, 390, 412, 430, 768, 820, 1023 and 1440 (`preload-sizes.log`, `preload-lcp.log`); console 0. The claim about heights is verified in § 5. | **Yes** |
| **R4-4:** Für Profis text before its photo below 1024 | `jump05.json`: h2 top 234 / 238 / 239 / 279 / 278 / 286 px at 390 / 412 / 360 / 768 / 820 / 1023 (24–37 % of the view), bottom above the dock top in every case, focus on the h2. The arch follows the CTAs (`05-fuer-profis.tsx:79`, `landing.css` margin 48 px). | **Yes** |
| **M-7:** the lead below the dock | `firstview.json`: lead top 838 / 913 / 932 vs dock 776–832 / 847–903 / 864–920 at 390 / 412 / 430 (`landing.css` `.lp-hero-rest` margin). The first view is now place switch, tagline, subline, arch, Ortszeile, dock. | **Yes** |
| **R4-5 / N4-6** (AUDIT-v4 "Post-audit-4 fixes") | See § 9. | **Yes** |
| Lead's smoke check: `index-crash.js` 8/8 | Reproduced independently (above). My A4 `data/index-crash.json` is unchanged in `audit-4/`. | **Yes** |

## 5. The R4-3 claim, tested (`scripts/sizes-lab.js`, `data/sizes-lab.json`)

Hero widths requested → the width the `<img>` uses. **2×** marks two fetches of the LCP photo.

| `sizes` set-up | 390, screen = viewport | 390 × 664 in a 390 × 844 screen | same, DPR 3 | 768, screen = viewport | 768 × 954 in 768 × 1024 |
|---|---|---|---|---|---|
| A4 (`svh` + `clamp`), with preload | 828 / 640 → 640 **2×** | 828 → 828 | 1080 → 1080 | 1080 / 640 → 1080 **2×** | 828 / 1080 → 1080 **2×** |
| A4, **no preload** (audit 4's option 2 below 1024) | 828 / 640 → 640 **2×** | 828 → 828 | 1080 → 1080 | 1080 / 640 → 640 **2×** | 828 / 1080 → 1080 **2×** |
| A4 with preload only ≥ 1024 (option 2 as written) | 828 / 640 → 640 **2×** | 828 → 828 | 1080 → 1080 | 1080 / 640 → 640 **2×** | 828 / 1080 → 1080 **2×** |
| Height media conditions (audit 4's option 1) | 640 → 640 | 640 → 640 | 1080 / 828 → 828 **2×** | 640 → 640 | 640 → 640 |
| A4 with `vh` instead of `svh` (the engineer's intermediate attempt) | 640 → 640 | 640 / 828 → 828 **2×** | 1080 → 1080 | 640 → 640 | 640 / 1080 → 1080 **2×** |
| **Now: width-only** | 828 → 828 | 828 → 828 | 1080 → 1080 | 1280 → 1280 | 1280 → 1280 |

**Reading:**
- The double fetch happens without any `<link rel=preload>`, so it is the preload scanner's speculative fetch of the `<img>` that diverges.
- `vh` and `max-height` diverge exactly when the screen is taller than the viewport, which supports "evaluated against the screen height".
- Height media conditions fail on the DPR-3 phone with browser UI, which is the common iPhone case.
- **The engineer's claim holds, and my audit-4 R4-3 recommendation was wrong.** Width-only is the only correct `sizes` here. Its cost is N5-1 (§ 10).

---

## 6. Per-dimension notes (changes against audit 4 only)

- **Visual / Brand.** The approved frames are what is served at every width (§ 9). The 05 chapter below 1024 now reads headline → lead → CTAs → arch with the Ortszeile (`t768-jump-fuer-profis.png`), the natural order.
- **Interaction.**
  - Jumps land at 390, 412, 768, 820, 1024 touch, 1024 fine and 1440, with the h2 at 234–311 px (429 for 07 at 820), focus on the h2 and the active chapter set.
  - A jump starts 46–82 ms after the tap; no correction after visitor input.
  - Rapid place switching settles.
  - Latency at 4× (§ 11.3): sheet median 127 (0/9 > 200), Was? list 166, Esc 70 / 89. The overlay open (median 192, 4/9 > 200) and the place switch (197, 4/9 > 200) sit at the line (N5-2).
- **Animation.** Tier table as A4 (`tiers.json`); the scroll runs are in § 11.4.
- **Mobile.**
  - The first view at 390 is clean (`hero-m390.png`).
  - `mobile.js` at 390 and 412: no position without a booking control; header hides and returns; dock → sheet → submit `/suche?plz=10115&kategorie=massage`; swipe to „Im Hotel“; overlay jump to `#fragen` with focus on its h2.
- **Technical.**
  - DOM 1,175 nodes; HTML 416 KB raw / 54.6 KB gz; first-load JS 178.9 KB gz (A4 178.4); CSS 35.8 KB.
  - 0 outlined segments; FAQPage = 5 visible questions.
- **Accessibility.**
  - `focus-walk.json`: 72–80 stops at 768, 820, 1023, 1024, 1440 and 390, chapters 01 → 07 → footer at every width, 0 issues. In A4 the desktop walks ended in the error page.
  - Overlay trap 0 escapes; skip link 44 px; hero focus order follows the visual order at 6 widths (`kb-hero.log`).

## 7. Status of every open item

| ID | Item | Status A5 |
|---|---|---|
| N4-1 | Desktop crash, lite/none | **Fixed** (§ 4) |
| N4-2 | Hero double fetch | **Fixed** (one request), at the cost of N5-1 |
| N4-3 | Stale optimiser variants | **Fixed** (0 / 368; fresh-check clean) |
| N4-4 | 05 jump hides heading | **Fixed** |
| N4-5 | Hotel discretion | **Fixed** (`hotel-v6b`; massage tile too) |
| N4-6 | Pair continuity, barefoot Profi, doc drift | **Fixed.** Pair and shoes (§ 9); PHOTOGRAPHY.md no longer lists the evening shoot times (no 19:25–21:10 left in the file). |
| N4-7 | Stall share above control | **Not reproduced:** 1/9 on both routes, interleaved |
| N4-8 | perf.js overlay Event Timing | perf.js 184–480 (median 240; A4 248). See N5-2. |
| M-1 early | Early sheet ≤ 300 | 227–382 (median 313; A4 308): **open**, P3 |
| M-3 | First Was? tap shell ≤ 200 | hero 245–320 / list 514–795; massage 144–485 / 342–877: **open**, P3 (N5-3) |
| M-4 | DevTools TBT ≤ 150 | 101–295, median 179 (A4 175): **open**, P3 |
| M-7 | Lead under the dock | **Fixed** |
| M-8 | Hard-coded head heights | **Open** (`landing.css:362, :395`) |
| N-9 | Italic fetched twice on routes that prefetch `/` | Kept by Lead decision (`logs/routes.log`) |
| N-11 | Full tier drops frames at 4× | 41 / 45 frames > 50 ms on a quiet machine (A4 47): **open**, unchanged |
| I-16 | AI interim imagery | **Open** (launch blocker, labelled) |
| Constraints | LH stall; first-load JS ≤ 160 KB | Unchanged; the stall is again consistent with an environment artefact (equal rate on the control) |

## 8. Regression check (everything changed since the audit-4 build)

| Change | Finding |
|---|---|
| `use-layer-swap.ts`, `swap-layer.tsx` | Full tier still animates both swaps (`rapid.js`: leaving / entering, settles on the last place). Lite / none switch directly. No console output. **No regression.** |
| `IslandBoundary` around 8 islands; `index-row.tsx` / `StaticIndex`; `static-hero-figure.tsx` | No fallback in use on a normal load (no `[landing] … failed` message in any walk). HTML size is the same as A4 (416 KB raw): the fallbacks are built on the client from the same props. **No regression.** |
| `places.ts` width-only `sizes` | One request everywhere; over-fetch below 1024 (N5-1). |
| `05-fuer-profis.tsx` text before the arch | ≥ 1024 band unchanged (`band.js`: CTAs in one row, Ortszeile clear at 7 desktop sizes; contrast as A4). **No regression.** |
| `.lp-hero-rest` margin (M-7) | No CLS at load (`firstview`, `rebook.js` 0.00014 at 1440 from the account header, as A4). The hero entry starts at 999 / 1074 / 1066 px at 390 / 412 / 430, below the fold; the dock carries „Termin finden“ there, as before. |
| Avatar face crops (`avatar.tsx`, `images.ts`, R7, from the Entdecken review) | Not exercised on the landing: the 03 card shows `pro-03-v4.jpg` at 56 × 61 px (no `-face` file); the 04 portraits are unchanged. No visual change on `/`. |
| „Bilder KI-generiert“ under the category picker (`c3862ea`) | Present in the sheet's list (`pickers-early-motionlite.png`). |
| Photos (§ 9) | Correct files at every width. |

## 9. Photography (the v6 fixes on the landing)

*Sheets: `photo-sheet-hotel.jpg` (v6b left, the retired v3 right), `photo-sheet-cats.jpg`, `photo-sheet-pair-pro.jpg`, `photo-sheet-crops.jpg` (hands and feet); in context: `photo-hero-*-imhotel.png`, `pair-d1440.png`, `t768-jump-fuer-profis.png`, `photo-tiles-*.png`.*

| Check | Finding |
|---|---|
| Hotel hero (`hotel-v6b`) | The linen is drawn up to the shoulder blades; only shoulders, neck and the top of the back are bare. Skyline, room and light are unchanged. No electronics (a leather folder on the desk). Hands are plausible on the shoulders. In the arch at 1440, 768 and 390 the bare area is shoulders and upper back only. **Passes the discretion rule.** |
| Massage tile (`massage-v6`) | Same fix at tile scale. Passes. |
| Pedicure tile (`pedikuere-v6`) | The Profi wears light sand slip-ons, the client is barefoot, hands and file correct. Passes. |
| Signature pair (`arrival-v5` → `after-v6`) | The client from the door (dark hair, stubble, cream waffle knit) sits on the sofa in the right arch at focal 12 %; the red-haired Profi is in the background. "One afternoon in two moments" now reads as one story (`pair-d1440.png`). Hands round the cup are plausible. |
| 05 arch (`app-pro-v6`) | The approved frame: the Profi looks at the phone, matching the alt. |
| Integrity labels | „Demo-Profil · Foto KI-generiert“ on all portrait cards and the 03 card; „Bilder KI-generiert“ under the picker's photos; footer „Bilder: KI-generierte Entwicklungsassets“; demo ribbon. Holds. |
| Ortszeile vs light | Unchanged and consistent (10:30, 15:30, 13:00, 15:25 / 16:10, 11:40). |
| Remaining | I-16 (all imagery AI interim, labelled). The portraits are clean but a little uniform (all smiling, similar poses), not a defect. |

## 10. New findings

| ID | Pri | Finding | Where | Evidence |
|---|---|---|---|---|
| N5-1 | P3 (trade-off of R4-3) | **Hero over-fetch below 1024 is back** (as A3 M-5). The `<img>` correctly describes the uncapped column, but the arch is height-capped. Fetched vs needed: 390 DPR 2: 828 for a 280 px arch (640 would do, +7.4 KB); 768: 1280 for 243 px (640, +26.4 KB); 820: 1280 for 364 px (828, +19 KB); 1023: 640 for 265 px (384). At 768 on Slow 4G the LCP is 2.24–2.35 s (A4 2.16–2.18 with the double fetch). Not worth a height in `sizes` (§ 5). | `hero/places.ts` `heroSizes()`; the cap in `(landing)/landing.css` "The arch's first view below 1024" | `data/firstview.json`, `logs/preload-lcp.log` |
| N5-2 | P3 (watch) | **Two interactions at the 200 ms line on a 4× phone** (9 runs, 3 batches). Overlay open visible 152–278 (median 192; A4 148) and place switch 138–219 (median 197; A4 185), each 4/9 > 200. No code changed on the overlay path since A4. perf.js shows no change for the overlay (median 240 vs 248), and TBT and hydration are unchanged. Possibly noise on this shared machine; re-measure on a device before acting. | `nav/chapter-overlay.tsx`, `hero/place-switch.tsx` | `data/latency-settled-slow4g-batch{1,2,3}.json` |
| N5-3 | P3 | First Was? tap right after hydration: hero shell 245–320 ms, list 514–795 (A4 123–294 / 361–587); massage 144–485 / 342–877. The PR-3 shell target of ≤ 200 is not met; same caveat as N5-2. | `site/booking-entry.tsx` | `data/pickers4.json` |

---

## 11. Performance measurements (all runs, none discarded)

### 11.1 Lighthouse 12.8.2

Score · LCP s · TBT ms (CLS 0 in every simulate run).

| Set | Runs | Median |
|---|---|---|
| **Mobile simulate `?motion=lite`** (interleaved, load 0.1–1.6) | 83 · 4.32 · 127 ᶜ / 91 · 3.46 · 33 / 89 · 3.77 · 36 / 92 · 3.33 · 24 / 92 · 3.33 · 14 / 91 · 3.47 · 42 / 92 · 3.33 · 64 / 92 · 3.34 · 43 / 91 · 3.33 · 84 | **91** · LCP 3.34 · TBT 42 |
| Control `/hilfe` (interleaved) | 91 ᶜ / 97 / 96 / 92 / 96 / 96 / 96 / 96 / 92 | 96 |
| Mobile simulate `/` (tier none) | 92 / 91 / 89 / 84 ᶜ / 91 | 91 |
| Mobile DevTools `?motion=lite` | 92 · 2.43 · 179 / 89 · 2.36 · 295 / 92 · 2.37 · 198 / 94 · 2.39 · 101 / 94 · 2.38 · 113 (CLS 0.0011 each) | 92 · LCP 2.38 · **TBT 179** |
| Desktop `?motion=full` | 99 · 0.85 · 0 / 99 · 0.85 · 0 / 100 · 0.80 · 0 | 99 |

ᶜ = the first-frame stall: observed FCP 1.24–1.32 s while `load` fired at 0.33–0.42 s. It hit the first run of the landing and of the control alike, and run 4 of `/`.

### 11.2 `perf.js` (`MASK=1 … mobile slow4g 5`, `?motion=lite`)

| Run | FCP | LCP | TBT | Hotel · Büro · FAQ · Overlay · Esc (Event Timing, ms) |
|---|---|---|---|---|
| 1 | 2,276 | 2,516 | 197 | 152 · 80 · 88 · 184 · 144 |
| 2 | 2,360 | 2,360 | 136 | 104 · 120 · 80 · 240 · 136 |
| 3 | 2,312 | 2,312 | 87 | 144 · 104 · 72 · 256 · 200 |
| 4 | 2,276 | 2,276 | 79 | 112 · 112 · 88 · 184 · 256 |
| 5 | 2,312 | 2,528 | 95 | 120 · 120 · 88 · 480 · 128 |

Medians: TBT 95, LCP 2,360 (2/5 > 2.5 s), CLS 0. The LCP element is the hero `<img>` (828 w) every time.

### 11.3 Interactions (`latency.js`, 3 batches × 3 runs, 412 × 823, 4× CPU, Slow 4G, cold)

Visible response in ms.

| Interaction | Nine runs | Median | > 200 | A4 median |
|---|---|---|---|---|
| Place switch „Im Hotel“ | 167 / 219 / 197 / 138 / 204 / 207 / 197 / 206 / 186 | 197 | 4/9 | 185 |
| Dock → sheet | 137 / 127 / 150 / 116 / 137 / 169 / 121 / 127 / 109 | **127** | 0/9 | 134 |
| Was? list | 166 / 101 / 143 / 233 / 196 / 261 / 113 / 174 / 116 | 166 | 2/9 | 141 |
| Esc (sheet) | 91 / 87 / 56 / 61 / 103 / 73 / 56 / 70 / 53 | 70 | 0/9 | 56 |
| Dock → overlay | 192 / 224 / 152 / 191 / 278 / 167 / 242 / 227 / 160 | 192 | 4/9 | 148 |
| Esc (overlay) | 82 / 110 / 83 / 112 / 72 / 106 / 88 / 89 / 138 | 89 | 0/9 | 88 |
| FAQ | 156 / 160 / 165 / 130 / 160 / 176 / 161 / 168 / 163 | 161 | 0/9 | 144 |
| Early dock → sheet (6 runs) | 382 / 288 / 270 / 227 / 378 / 338 | 313 | — | 308 |

- **First Was? tap after hydration** (`pickers4.js`): hero shell 264 / 320 / 245, list 514 / 795 / 650; massage shell 485 / 296 / 144, list 877 / 625 / 342.
- **Hydration:** hero form 4.58–4.83 s (A4 4.64–4.69).
- **Early PLZ:** kept 3/3.

### 11.4 Scrolling and weight

| Run | Frames > 50 ms | Long tasks | Scroll CLS |
|---|---|---|---|
| 1440 full, 4×, chain run (noisy; load ≈ 1.5–2) | 72 | 43 | 0.0066 |
| 1440 full, 4×, repeat 1 (quiet) | 41 | 12 | 0.0094 |
| 1440 full, 4×, repeat 2 (quiet) | 45 | 11 | 0.0082 |
| 1440 full, 1× | 13 | — | 0.0094 |
| 390 lite, 4× (chain / repeat) | 7 / 5 | — | 0 |
| 390 lite, 1× | 1 | — | 0 |

- **Hero bytes** (`preload-lcp.js`, Slow 4G): one request per viewport. 390 and 412: 828 w, 25.7 KB, LCP 2.45–2.65 s. 768 and 820: 1280 w, 44.7 KB, LCP 2.24–2.43 s.
- **Weight:** JS 178.9 KB gz (12 module scripts), CSS 35.8 KB, HTML 416 KB raw / 54.6 KB gz.

### 11.5 Against the exit criteria

| Target | A4 | A5 | |
|---|---|---|---|
| Median mobile LCP ≤ 2.5 s | 2.42 | 2.36 (perf.js) · 2.38 (DevTools) | Met |
| TBT ≤ 200 ms | 108 / 175 | 95 / 179 (1/5 > 200) | Met |
| CLS ≤ 0.05 | 0 | 0 at load, ≤ 0.0094 scrolling | Met |
| Lighthouse mobile ≥ 90 (median) | 91 (quiet batch) | 91 | Met |
| Main interactions ≤ 200 ms at 4× | medians ≤ 148 | medians 127–197 | Met at the median |
| Early sheet ≤ 300 ms | 308 | 313 | Narrowly missed |
| Desktop LCP ≤ 1.2 s, LH ≥ 95 | 0.85, 99 | 0.85, 99 | Met |
| First-load JS ≤ 160 KB gz | 178.4 | 178.9 | Constraint (framework) |

## 12. Accessibility

- **axe-core:** 0 violations at 1440 full, 768 lite and 390 lite.
- **Small targets:** unchanged. sr-only skip links, the PLZ inner box, desktop footer links 32 px; on phones three footer links are 29–37 px wide at 44 px height.
- **Keyboard:**
  - skip link → header (44 px) → hero (order = visual order at 6 widths) → entry → 02 rows → … → footer, all visible stops;
  - overlay trap holds and Esc returns focus;
  - jumps focus the h2 (`tabindex=-1`, no ring by design, as before).
- **Reduced motion:** final frames, instant jumps that land, and since R4-1 a safe index.
- **Not 9:** no VoiceOver or NVDA pass.

## 13. Open items and remediation (all P3; none blocks the gate)

1. **N5-1, hero over-fetch below 1024.**
   - **Where:** `hero/places.ts` `heroSizes()` and the arch cap in `(landing)/landing.css`.
   - **Option:** make the arch's below-1024 cap width-expressible, for example a max-width per width range tuned to common phone and tablet heights, so a width-only `sizes` can describe it. Or accept the bytes as the documented price of one fetch.
   - **Expected:** `firstview.js` `heroImg` ≤ 1.3 × rendered width × DPR at 390, 768 and 820, and still one request (`preload-sizes.js`, `sizes-lab.js` "now" row).
2. **N5-2 / N5-3, interactions at the line.**
   - **Action:** re-measure `latency.js` and `pickers4.js` on a quiet dedicated machine or a real mid-range phone before changing code.
   - **If confirmed:** profile the overlay open (inert restyle of what is in view) and the place switch (the direct swap's image decode).
   - **Expected:** visible medians ≤ 160, at most 1/9 > 200.
3. **M-1 early** (313 ms) and **M-4** (DevTools TBT 179): as audit 3 § 15 (start the dialogs' chunk on the first `pointerdown`; TBT ≤ 150).
4. **M-8:** derive `--lp-hero-arch-top` from a measured value (`landing.css:362, :395`).
5. **N-11:** a lite fallback for `hardwareConcurrency ≤ 4` desktops (41–45 frames > 50 ms at 4×).
6. **I-16:** replace the AI interim imagery with the real shoot (PHOTOGRAPHY.md § 13, now in daytime Ortszeilen).

## 14. Verdict

**Passing: 11 of 11 dimensions ≥ 8** (A4: 8 of 11).
- The P0 crash, the stale photos, the double hero fetch, the hidden 05 heading and the hotel discretion issue are fixed. Each fix was re-measured on this build, not taken from the notes, and each is now guarded by E2E tests or `fresh-check`.
- The engineer's R4-3 claim holds and corrects my audit-4 recommendation.
- No follow-up push is needed for the gate. The open items in § 13 are polish.

*Constraints, accepted and not counted: the headless first-frame stall (now equal on the landing and the control route); the framework's share of first-load JS. `:3100` was left running, not restarted, not rebuilt; its caches were not touched.*
