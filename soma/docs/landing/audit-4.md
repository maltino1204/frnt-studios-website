# SOMA landing page: independent quality audit 4

*Independent Landing Auditor · 2 Nov 2026 · production build on `http://localhost:3100`. Build `6iiBRG4Wz8fPlEvY356WF`, written 14:48 UTC; server started 14:48 (`next-server`, PID 27493), `DEMO_MODE=true`. At the start of the audit (HEAD `0b4b273`) the landing code in the build was the branch head: the last commit touching `src/` that the landing uses is `7ede7b4` (14:27), and the two later commits (`2dfafaf` Entdecken server actions, `0d9384a` / `0b4b273` tests) do not touch the landing. The served HTML carries the v2 chapters, the v3 photos and the daytime Ortszeilen.*
*The branch moved on while I measured: from 16:00 other sessions committed photo v5 fixes, avatar crops (`5ce4b57`, `574d5df`, `91c78b9`), an AI note under the category picker (`c3862ea`) and Entdecken changes. None of them are in the measured build, and :3100 was not rebuilt (`BUILD_ID` unchanged at the end). Every finding below is about build `6iiBRG4Wz8fPlEvY356WF`. Checkpoint commits made by other processes (`005bd28`, `5f7d306`, `d784358`) picked up intermediate copies of `audit-4/`; this report's commit is the final state.*
*Evidence: `docs/landing/audit-4/` (screenshots, contact sheets, raw JSON in `data/`, every log in `data/logs/`, every probe in `scripts/`). Every number below was measured on this build in this audit. I changed nothing in `src/`, tests, configs or other docs, did not restart or rebuild `:3100`, and did not run `demo:refresh`.*
*Audit-3 § 17 (engineer), the spec's "v2 structure" section and `docs/landing/declutter/` are the engineers' and the Lead's claims. I re-measured them (§ 6).*

---

## 1. Summary and verdict

**What improved, verified independently:**

| Audit-3 item | A3 | A4 |
|---|---|---|
| M-1, dock → sheet on a 4× phone (visible) | median 197, 3/6 > 200; early median 382 | **median 134, 1/6 > 200** (233); early median **308** |
| M-2, Was? list in the sheet | median 393 | **median 141** (the list now arrives with its frame) |
| M-6, Esc on the chapter overlay | median 252 | **median 88** |
| M-4, Lighthouse DevTools TBT | median 199 | median 175 (10 runs) |
| M-5, hero `<img>` width below 1024 | over-fetch 1.5–3.4× | the `<img>` now loads 640 / 640 / 828 / 384 w at 390 / 768 / 820 / 1023 |
| M-9, spec § 10.4 sizes | stale | matches the code |

- **The declutter works.** Seven chapters; page height 8,333 / 8,730 / 7,721 px at 390 / 768 / 1440 (A3 about 16,000–18,000); DOM 1,173 nodes (A3 1,436); HTML 54.4 KB gz (A3 65.0). Chapter jumps land at every width, the 768–1023 focus order is clean through the whole page, no-JS works, the FAQPage JSON-LD equals the five visible questions, „Entdecken“ is the first header link from 1280 px. The landing E2E suites pass: 76 passed, 10 skipped, 0 failed.
- **The v3 „Tageslicht“ set** fits the brand: bright, warm-neutral, light uniforms, and every Ortszeile now matches its light.

**But this round introduced, or exposed, defects that block the gate:**

1. **N4-1 (P0): the landing crashes for reduced-motion and Save-Data desktop visitors.** On a fine-pointer screen ≥ 1024 in the `lite` or `none` tier, hovering an 02 index row, tabbing onto it, or simply **wheel-scrolling with the pointer over the left third of the window** throws React #185 (maximum update depth). The root error boundary then replaces the whole page with „Das hat nicht geklappt.“. All 6 hover and Tab cases in those tiers fail, and so does the scroll case; 2 of 2 in the `full` tier pass (`data/index-crash*.json`). Neither the E2E suites nor my audit-3 probes covered this path (my A3 desktop hover and keyboard checks ran in the full tier only). The components involved are unchanged since before the A3 build, so it most likely existed then and I missed it.
2. **N4-3 (P1): the image optimiser serves photos that the photo QA rejected.** The AVIF variants of `editorial/hotel-v3.jpg` (w 640, 1080) and `landing/app-pro-v3.jpg` (w 384, 1080) are cache hits of earlier generation attempts. The 1440 hero „Im Hotel“ therefore shows the attempt with a logo-marked laptop that AUDIT-v3 rejected, and the 05 arch at 768 shows a Profi looking at the camera while the alt says „schaut auf das Smartphone“. The file name was reused for each attempt, and the cache keys by URL.
3. **N4-2 (P2, regression from PR-4):** the hero preload and the hero `<img>` share one `sizes` string, but Chromium resolves it to different widths at 390 (DPR 2), 768 and 820. So two copies of the LCP photo are fetched (+25.7 / +36.8 / +44.7 KB), and a console warning appears at 390 and 768. A3 had 0 console messages.
4. **N4-4 (P2):** below 1024, a jump to „Für Profis“ focuses a heading that sits under the dock or below the fold (h2 top 739 / 1000 / 1048 px in 844 / 1024 / 1180 px viewports).
5. **N4-5 (P2, brand):** the „Im Hotel“ hero shows the guest's back bare to mid-back, against PHOTOGRAPHY.md's discretion rule ("linen to the shoulder blades or more"). AUDIT-v3 line 137 says "sheet at the shoulder blades"; the file does not show that.

**Lighthouse mobile (`?motion=lite`):** 26 runs in three batches.
- The medians are 89, 85 and 91.
- On a quiet machine, interleaved with a control route, the median is 91. Every run without the headless first-frame stall scores 89–92.
- The stall now hits the landing in 3 of 8 runs but the control route `/hilfe` in 1 of 8, under identical conditions. I still treat it as a lab constraint, but it is no longer clearly environment-only (§ 11.2).

**Verdict: not passing. 8 of 11 dimensions ≥ 8 (A3: 10 of 11).**
- Performance rises to 8.
- Technical quality (6), Accessibility (6) and Interaction design (7) fall, all mainly through N4-1.
- Brand fidelity falls to 8 (N4-3, N4-5).
- Remediation is in § 15. R4-1 alone restores Interaction, and with R4-2 to R4-4 it restores Technical and A11y to ≥ 8.

## 2. Scores

| # | Dimension | A2 | A3 | **A4** | One-line basis |
|---|---|---|---|---|---|
| 1 | Overall visual experience | 8 | 8 | **8** | The declutter reads calmer and more premium: fewer elements per view and a bright, coherent daylight set. Held back by the small arch at 768–1023 and an empty 05 opening below 1024. The stale images (N4-3) are scored in 2 and 9. |
| 2 | Brand fidelity | 9 | 9 | **8** | v3 fits the "Tageslicht" direction, and Ortszeilen match the light. But rejected photo attempts are served at hero scale (N4-3); the hotel hero breaks the discretion rule (N4-5); the signature pair shows two different clients; the pedicure Profi is barefoot. |
| 3 | Typography and composition | 8 | 8 | **8** | Shorter copy, one serif headline per view, band contrast now ≥ 8.9:1 for the title. Still open: M-7 (lead under the dock) and M-8 (hard-coded head heights). |
| 4 | Interaction design | 8 | 8 | **7** | Sheet, Was?, Esc and overlay are all fast now; jumps land; rapid input settles. **But hovering, focusing or scrolling past the 02 index crashes the page in the lite and none tiers on desktop (N4-1).** |
| 5 | Animation quality | 8 | 8 | **8** | Tier assignment is correct for every setting (`tiers.json`), the full-tier pin works, reduced motion shows final frames. Full tier at 4× CPU: 47 frames > 50 ms (A3 45, N-11). The crash sits in the no-animation swap path; it is counted in 4, 9 and 10. |
| 6 | Mobile experience | 7 | 8 | **8** | Booking control always in view; sheet 134 ms and Was? 141 ms at 4×; Ortszeile clear of the dock; early typing kept. Held back by M-7, N4-4 (05 heading under the dock) and the double hero fetch at 390 DPR 2. |
| 7 | User experience | 7 | 8 | **8** | Seven chapters with one job each; the trust facts sit where the doubt arises (03); FAQ 5 plus „Alle Fragen“; Entdecken reachable. The 8 holds for the full-tier desktop and phone populations; the crash for the others is scored in 4, 9 and 10. |
| 8 | Conversion clarity | 7 | 8 | **8** | Every CTA and hand-off verified: 38 link targets 200, parameters kept, the 03 CTA by keyboard opens the bar with the PLZ, the 07 CTA upgrades to `/suche?plz=…`. |
| 9 | Technical quality | 8 | 8 | **6** | **P0 runtime crash (N4-1); stale optimiser variants (N4-3); a preload mismatch with a duplicate LCP fetch and console warnings (N4-2).** Otherwise clean: E2E 76/10/0, JSON-LD = FAQ, no outlined segments. |
| 10 | Accessibility | 8 | 8 | **6** | axe 0 violations at 1440, 768 and 390 (full and lite). **But reduced-motion desktop users lose the page by scrolling or tabbing (N4-1), and the 05 jump focuses a heading hidden under the dock (N4-4).** |
| 11 | Performance | 7 | 7 | **8** | perf.js TBT median 108, LCP 2.42 s, CLS 0; sheet 134 / Was? 141 / Esc 88 / overlay 148 ms at 4×; DevTools TBT 175; desktop 99. Minor: early sheet 308; LH 91 quiet but stall-sensitive; double hero fetch at 390/768/820. |

**8 of 11 dimensions are ≥ 8. Interaction design, Technical quality and Accessibility are below the gate. The tasks are in § 15.**

---

## 3. Method and environment

- **Browser and viewports.** As in audits 2 and 3: Playwright with Chromium (headless, software compositing).
  - Desktop: 1920 × 1080, 1440 × 900, 1280 × 800 and 720, 1024 × 768 (fine pointer).
  - Tablet: 1024 × 768 (touch), 1023 × 768, 820 × 1180, 768 × 1024.
  - Phone: 430 × 932, 412 × 915, 390 × 844, 390 × 664, 360 × 740, 320 × 640.
- **Visitor tiers.** Lighthouse runs with `navigator.webdriver = true`, so `/` gets `none`. Mobile gates use `/?motion=lite` (runtime loaded 26/26), desktop uses `/?motion=full`, and `/` is reported. Playwright probes mask `webdriver` where the visitor path matters (`tiers.js`, `index-crash*.js`, `latency.js`, `pickers4.js`, `preload-lcp.js`).
- **Lighthouse 12.8.2** (`/tmp/lh`): mobile simulate, mobile DevTools throttling, desktop preset. Every run is reported; none were discarded.
  - The machine is shared: the parallel reviewer used the `next dev` server on :3000.
  - I logged the 1-minute load before every Lighthouse run of the third batch (`data/logs/lh-load.log`) and started that batch only once the load was below 1.2.
- **Throttled lab runs.** 412 × 823, DPR 1.75, 4× CPU, Slow 4G, cold: `perf.js`, `latency.js` (2 batches × 3), `hydration.js`, `early.js`, `pickers4.js`, `scrollperf.js`. They ran strictly one after another (`scripts/perf-chain.sh`, `run-all.sh`, `run-final.sh`). The functional probes followed (`func-chain.sh`), then the E2E suites.
- **CSP-safe probes.** The page's CSP has no `'unsafe-eval'`, so Playwright's `waitForFunction(<string>)` throws `EvalError` there.
  - My audit-3 `pickers.js` swallowed that error with `.catch()`. **Its M-3 numbers (0.46–1.02 s) timed Playwright's tap call, not the picker, and are void.** The engineer's § 17.2 caveat is correct.
  - `pickers4.js` replaces it: function predicates only, timed in the page from the tap's `pointerdown`.
- **Probe corrections in this audit (documented, nothing discarded):**
  - The first `latency.js` batch scrolled 02 to the scroll margin. In v2 the hero's submit is still in view there, so the dock hides by design and the tap timed out. The batch was aborted and re-run 400 px further down, which is audit 3's situation (`logs/latency-settled-aborted.log`).
  - `nav.js` first picked a hidden header button and was re-run with `:visible`.
  - In the third Lighthouse batch my rename step overwrote the first run's JSON of each route. The two runs survive in the logs (`logs/lh-sim3-*.log`) and are included in § 11.1.
- **Side effects on the shared server.**
  - `stale-images.py` fetched 184 optimiser URLs × 2 formats. Missing entries were freshly generated (current content). The four stale entries were read, not purged.
  - I loaded the dev server on :3000 once (`/?motion=none`, reduced motion) to get the unminified stack of N4-1.
- **Not verified:** WebKit / iOS Safari, real devices, screen readers, the root cause of N4-1 (§ 10).

---

## 4. Per-dimension evidence

### 4.1 Overall visual experience: 8

- **The decluttered page reads as one calm sequence** (`sheet-walk-d1440-full.jpg`, `sheet-walk-m390-lite.jpg`): hero → index with preview → three steps with the pair and the trust row → Profis → the espresso band → five questions → the Oxblood seal.
  - Each view has one job and more air than v1.
  - The daylight photos lift the Bone and Stone surfaces instead of fighting them, which the night band of v1 never did.
- **Held back by:**
  - The first-view arch below 1024 is still small: 243 px wide at 768 × 1024 and 265 px at 1023 × 768, unchanged since A3.
  - Below 1024 a jump to 05 opens on about 350 px of empty Bone above the arch, with the heading off-screen (`t768-jump-fuer-profis.png`, N4-4).
  - The rejected hotel and app-pro attempts served from the cache (N4-3) are what visitors at those widths see. Scored in 2 and 9.

### 4.2 Brand fidelity: 8 (A3 9)

- **Holds:**
  - One italic moment (the tagline, as bookend) and one serif headline per view.
  - No logo inside an arch.
  - The offset pair with Ortszeilen is used once (03, step 3).
  - Light uniforms everywhere, no black workwear.
  - Band contrast improved to title ≥ 8.9:1 and eyebrow ≥ 5.8:1 (`logs/contrast.log`; A3 title 4.15:1).
- **Down to 8 because:**
  - Rejected photo attempts are visible at hero scale (N4-3).
  - The hotel hero breaks the brand's own discretion rule (N4-5).
  - The signature pair no longer tells one story: the arrival shows a man at the door, and the „danach“ arch (focal 12 %) shows an older woman on the sofa, with the Profi cropped out.
  - The pedicure Profi works barefoot (the audit-1 A6 issue again). § 8 has the full review.

### 4.3 Typography and composition: 8

- Copy is shorter without smaller type: the hero lead is one sentence, and the hero at 1024 × 768 now ends 59 px higher (Ortszeile 731 vs 790).
- Ortszeile segments never break inside (`ortszeile.tsx` wraps each segment `nowrap`).
- **Open from A3:**
  - **M-7:** the lead's first line still sits under the dock at load on phones (lead 782 / 857 / 876 vs dock 776 / 847 / 864 at 390 / 412 / 430).
  - **M-8:** the hard-coded head heights are at `(landing)/landing.css:361` (`322px`) and `:389` (`292px + 10.9vw`).

### 4.4 Interaction design: 7 (A3 8)

- **Better than A3, measured at 4× CPU, Slow 4G** (§ 11.4):

  | Interaction | Visible response, median | A3 median |
  |---|---|---|
  | Dock → sheet | 134 ms | 197 |
  | Was? list | 141 ms | 393 |
  | Esc on the sheet | 56 ms | — |
  | Esc on the overlay | 88 ms | 252 |
  | Overlay open | 148 ms | 138 |
  | FAQ | 144 ms | 143 |

- **Also verified:**
  - Chapter jumps land with the heading at the scroll margin at 390, 412, 768, 1024 (touch and fine) and 1440 (`data/jump-*.json`).
  - A jump starts 44–88 ms after the tap.
  - Rapid place switching settles on the last choice.
  - The 03 CTA by keyboard opens the bar with the PLZ focused and returns focus.
- **N4-1 takes it below 8.** In two of three tiers on desktop, the index's hover and focus parity, which is the interaction the spec designed (§ 4.3), destroys the page. It is also reached by plain scrolling (`data/index-crash-scroll.json`).
- **Minor:**
  - The place switch's visible response is 124–208 ms (2/6 at 208).
  - The first Was? tap right after hydration shows its shell after 123–294 ms (median 202) on the hero.

### 4.5 Animation quality: 8

- **Tiers** (`data/tiers.json`, webdriver masked):

  | Setting | Tier |
  |---|---|
  | 1440, 1024 fine pointer | `full` |
  | 1024 touch, 820, 768, 390 | `lite` |
  | Reduced motion | `none` |
  | Save-Data | `lite` |
  | Unmasked automation | `none` |
  | `?motion=lite` | honoured |

  The attribute is already set at DOMContentLoaded, and the full tier upgrades exactly `walkthrough` and `seal`.
- The seal starts at 42 % (1440 full) and 31 % (390 lite) of the band in view, as in A3.
- Reduced-motion walk: final frames, 0 console messages (`sheet-walk-d1440-auto-reduce.jpg`). That walk does not hover the index; N4-1 does.
- Full tier at 4× CPU: 47 frames > 50 ms during a full scroll (A3 45; N-11 open). At 1× it is 5, and the phone lite tier at 4× shows 3.

### 4.6 Mobile experience: 8

- Booking control always in view (`mobile-m390`, `mobile-m412`: no gap).
- The header hides on scroll-down and returns on scroll-up.
- Dock → sheet → inline Was? → submit works.
- The Ortszeile clears the dock by 18 / 14 / 12 px at 390 / 412 / 430.
- Early PLZ typing is kept 3/3.
- The dock hides when the hero's submit is in view at the top after a jump to 02. That is the designed rule; the probe was adapted.
- **Held back by:**
  - M-7;
  - N4-4 (at 390 the focused 05 heading starts 37 px below the dock's top);
  - N4-2 (390 at DPR 2 fetches the hero twice: +25.7 KB on Slow 4G);
  - the early (cold) sheet at 288–355 ms.

### 4.7 User experience: 8

- **The v2 order answers the questions in the order they come:**
  - what and where (01);
  - which treatment (02, with „Alle Behandlungen“ and „Themenwelten entdecken“);
  - how, and why trust it (03: Endpreis · Start-Code · „Kostenlos stornierbar bis 24 Std. vorher“);
  - who comes (04);
  - the second audience (05);
  - residual doubts (06, five questions plus „Alle Fragen“ → `/hilfe` 200);
  - the close (07).
- „Entdecken“ is first in the header from 1280 px, first in the overlay's „Seiten“ and in the no-JS list (`data/nav.json`); `/entdecken` returns 200.
- The 8 describes the full-tier desktop and the phone experience. For reduced-motion and Save-Data desktop visitors the page breaks (N4-1), which is scored in 4, 9 and 10.

### 4.8 Conversion clarity: 8

- Hero search keeps PLZ, category, service, date and window: `/suche?plz=10115&kategorie=massage&leistung=entspannungsmassage&datum=2026-11-03&zeit=abends`.
- No-JS submit goes to `/suche?plz=10115`.
- The deep link keeps its parameters (`/suche?plz=10435&…`).
- The 03 CTA opens the bar with the shared PLZ; the 07 CTA upgrades from `/suche` to `/suche?plz=20095`.
- All 38 distinct internal link targets return 200 and all 8 anchors resolve (`data/tech.json`, `conv.json`, `conv2.json`).
- The CTA ids follow the v2 numbers (`ch03`, `pro-werden-05`, `pro-werden-07`, `final-search`).

### 4.9 Technical quality: 6 (A3 8)

- **Clean:**
  - E2E landing suites 76 passed / 10 skipped / 0 failed (3.4 min, `logs/e2e.log`);
  - JSON-LD Organization, WebSite, WebPage, FAQPage, with the FAQPage equal to the five visible items;
  - no `aggregateRating`, 0 outlined Suspense segments, 8 Activity markers, the tier boot script in the HTML;
  - one `h1`, 7 chapter sections;
  - no horizontal overflow at any width.
- **Down to 6:**
  - **N4-1:** an unguarded render loop takes the whole route down. There is no boundary below the root, so one island blanks seven chapters.
  - **N4-3:** the image pipeline reuses file names for changed content, so cached optimiser output can be any earlier attempt.
  - **N4-2:** the PR-4 `sizes` string is resolved differently by `<link rel=preload imagesizes>` and by `<img sizes>`, which gives a duplicate LCP fetch at 390 (DPR 2), 768 and 820, plus the "preloaded but not used" warning. Console messages went from 0 at 8 widths (A3) to 1 at 768 and 1 at 390, and 1–2 in four walks.

### 4.10 Accessibility: 6 (A3 8)

- **Holds** (§ 12):
  - axe-core 0 violations at 1440 full, 768 lite and 390 lite;
  - skip links, overlay trap (0 escapes, Esc returns focus) and header targets 44 px;
  - the whole-page Tab order at 768, 820, 1023 and 390 runs 01 → 07 → footer with 0 order breaks and 0 invisible stops (`data/focus-walk.json`).
- **Down to 6:**
  - **N4-1** hits exactly the people who asked for less motion. With the OS setting "Reduce motion" on a desktop, Tab onto an index row, hover it, or scroll past it with the pointer on the left, and the page is gone. The full-tier keyboard walk is fine, which is why axe and `keyboard.js` passed.
  - **N4-4:** below 1024, a chapter jump to 05 moves focus to a heading that is under the dock (390) or below the fold (768, 820).

### 4.11 Performance: 8 (A3 7)

| Target | A3 | A4 | |
|---|---|---|---|
| Median mobile LCP ≤ 2.5 s | 2.30 s | 2.42 s (perf.js, 1/5 > 2.5) · 2.37 s (DevTools) | Met |
| TBT ≤ 200 ms | 106 / 199 | 108 (perf.js) · 175 (DevTools, 3/10 > 200) | Met |
| CLS ≤ 0.05 | 0 | 0 at load, ≤ 0.0073 while scrolling | Met |
| Lighthouse mobile ≥ 90 (median) | 92 | 91 quiet / 89 / 85 (§ 11.1) | Met on a quiet machine; stall-sensitive |
| Main interactions ≤ 200 ms at 4× | sheet median 197 | sheet 134, Was? 141, overlay 148, Esc 88 | Met at the median; worst runs 208–233 |
| Early (cold) sheet ≤ 300 ms | 382 | 308 | Narrowly missed |
| Desktop LCP ≤ 1.2 s, LH ≥ 95 | 0.73 s, 100 | 0.85 s, 99 | Met |
| First-load JS ≤ 160 KB gz | 177.2 | 178.4 | Constraint (framework, A3 § 11.6) |

This is a premium result with minor issues: an early sheet at 308 ms, DevTools TBT above the PR-2 target of 150, the stall share in simulate, and the duplicate hero fetch (N4-2). It sits at the lower edge of 8.

---

## 5. Status of every open audit-3 item

| ID | Audit-3 issue | Status | Evidence |
|---|---|---|---|
| M-1 | Sheet ≤ 200 warm, ≤ 300 early | **Mostly fixed.** Warm 102–233 (median 134, 5/6 ≤ 200); early 288–355 (median 308) | `data/latency-*-batch*.json` |
| M-2 | Was? list 393 ms | **Fixed.** 107–245 (median 141); the list paints with its frame | same |
| M-3 | First Was? tap 0.46–1.02 s | **A3 measurement void** (CSP `EvalError`, § 3). Re-measured with `pickers4.js`: hero shell 123–294 (median 202), list 361–587 (median 504); `/behandlungen/massage` shell 188–321, list 514–853. PR-3's "shell ≤ 200" holds in 2/6 | `data/pickers4.json`, `pickers-early-*.png` |
| M-4 | DevTools TBT median 199 | **Improved, target missed.** 10 runs: 83–256, median 175 (batch medians 194 / 153); PR-2 target ≤ 150 not met | § 11.1 |
| M-5 | Hero `sizes` over-fetch | **Fixed for the `<img>`, regressed through the preload** (N4-2) | `data/firstview.json`, `logs/preload-lcp.log` |
| M-6 | Esc on overlay 252 ms | **Fixed.** 62–151 (median 88; 5/6 ≤ 120) | `latency` |
| M-7 | Lead under the dock on phones | **Open** (unchanged to the pixel) | `firstview.json` |
| M-8 | Hard-coded head heights | **Open** (`landing.css:361, :389`) | — |
| M-9 | Spec § 10.4 stale | **Fixed** (v2 table = `cv` props and `landing.css:65-110`) | spec § 10.4 |
| N-9 | Italic fetched twice on routes that prefetch `/` | Kept by Lead decision; unchanged | `logs/routes.log` |
| N-11 | Full tier drops frames at 4× | **Open** (47 > 50 ms; A3 45) | `logs/scrollperf.log` |
| N-12 | Was? pending feedback | **Fixed** with M-2 | — |
| I-16 | AI interim imagery | **Open** (launch blocker, labelled): now v3/v4, still AI | § 8 |
| RT-5 | LH median / no run < 89 / JS ≤ 160 | Median 91 on a quiet machine (89 and 85 in the other batches); the stall is a constraint under review (§ 11.2); JS 178.4 KB is a constraint | § 11 |

## 6. The claims, re-measured

| Claim (source) | Audit 4 | Holds? |
|---|---|---|
| PR-1 sheet warm 113 / 156 / 129 / 208 / 125 / 156, median 143, 5/6 ≤ 200 (§ 17.3) | 233 / 102 / 141 / 145 / 128 / 108, median 134, 5/6 | **Yes** |
| PR-1 early median 322 (§ 17.3) | 326 / 306 / 355 / 294 / 288 / 310, median 308 | **Yes** |
| PR-2 Was? list median 126 (§ 17.4) | median 141 (107–245) | **Yes**, within noise |
| PR-2 DevTools TBT median 177 (§ 17.4) | 175 over 10 runs | **Yes** (target ≤ 150 not met, as § 17.9 says) |
| PR-3 shell 168–209, list 332 / 706 (§ 17.5) | hero shell 123–294, list 361–587; massage 188–321 / 514–853 | Consistent; shell not reliably ≤ 200 |
| PR-4 hero 640 w at 390 and 768, 828 at 820, 384 at 1023 (§ 17.6) | Same for the `<img>` | **Incomplete:** the preload still fetches 828 / 1080 / 1280 w at 390 / 768 / 820 (N4-2) |
| PR-5 Esc overlay 53–101 ms (§ 17.7) | 62–151 (one run > 101) | **Yes**, mostly |
| Overlay open 114–162 (§ 17.8) | 102–180 (median 148) | **Yes** |
| `.lp-hero-ribbon` replaces the `:has()` rule | `landing.css:341, 384`; served class `lp-hero lp-hero-ribbon` | **Yes** |
| § 17.2: `waitForFunction(string)` fails under the CSP | Reproduced (`EvalError`) | **Yes** — my A3 M-3 was void |
| v2: page height 8,333 / 8,730 / 7,721; 9,175 at 1440 full | 8,333 / 8,730 / 7,721; 9,175 (walks) | **Yes**, to the pixel |
| v2: DOM 1,173 | 1,173 (`tech.json`) | **Yes** |
| v2: JS 178.4 · CSS 35.8 · HTML 54.3 KB gz | 178.4 · 35.8 · 54.4 | **Yes** |
| v2: perf.js TBT 53–183, LCP 2.33–2.46 s | TBT 39–190 (median 108), LCP 2.32–2.53 s (median 2.42) | **Yes** |
| v2: E2E landing 76 / 10 / 0 | 76 / 10 / 0 | **Yes** |
| v2: Lighthouse lite 91 / 94 / 92 / 92 / 92, median 92 | 26 runs: batch medians 89 / 85 / 91; runs without the stall 89–92 | Consistent with unstalled runs; the 0/5 stall share is not reproducible here (14/26) |
| v2: daytime Ortszeilen (10:30, 15:30, 13:00, 15:25 / 16:10, 11:40) | All served as stated | **Yes** |
| v2: header Entdecken first from 1280; overlay and no-JS list „Seiten“ | `nav.json` at 1280, 1440, 1920; overlay at all widths; no-JS list 7 chapters + 5 pages | **Yes** |
| v2: FAQPage = the five shown questions | 5 = 5, text match | **Yes** |
| AUDIT-v3 l. 137: hotel attempt 4 "sheet at the shoulder blades" | The file shows the sheet from mid-back; the shoulder blades and upper back are bare | **No** (N4-5) |
| AUDIT-v3 l. 128 / 137: rejected attempts replaced | On disk yes; **served (AVIF) no** | **No** (N4-3) |

## 7. Regression check of the declutter

| Check | Finding |
|---|---|
| **Chapter jumps** | All six targets land at 390, 412, 768, 1024 touch, 1024 fine and 1440. The h2 is at 234–311 px, focus is on the h2, the hash and active chapter are set, and there is no correction after visitor input. **Exception N4-4:** for 05 below 1024 the h2 is at 739 / 771 / 1000 px (390 / 412 / 768), under the dock or below the fold, because the arch precedes the text (`05-fuer-profis.tsx:39-52`). |
| **768–1023 focus order** | Hero: place switch → PLZ → Standort → Was? → Wann? → Submit → „So funktioniert’s“ at 768, 820 and 1023; exactly one hero link displayed (`kb-hero.json`). Whole page: 72–74 stops, 01 → 07 → footer, 0 order breaks, 0 invisible stops (`focus-walk.json`). |
| **Focus order ≥ 1024** | Full tier: correct (`keyboard.log`). **None tier: the walk ends in the error page after the 02 rows (N4-1)**, which is how this audit found the crash. |
| **No-JS** | 7 chapters in order; „Kapitel“ / „Menü“ link to `#kapitel` (7 chapters + Entdecken · Behandlungen · Städte · Für Profis · Hilfe); 5 `<details>`; portraits at opacity 1; submit to `/suche?plz=10115`; 0 console messages (walks). |
| **Dock vs Ortszeile** | Clear by 18 / 14 / 12 px at 390 / 412 / 430. At 360 × 740 and 390 × 664 the Ortszeile is below the fold at load. M-7 unchanged. |
| **Motion tiers** | Correct (§ 4.5). The no-animation swap path crashes on desktop (N4-1). |
| **JSON-LD vs FAQ** | Equal (5 / 5). |
| **Console** | 0 at 1440, 1280, 1024, 430, 412, 320; **1 warning at 768 and 390** (N4-2). |
| **Hit test** | No visible control covered, except the disabled rail arrow „Zurück“ (by design since A2). |

## 8. Photography review (v3 „Tageslicht“, v4 portraits, on the landing)

*Sheets of the source files: `photo-sheet-*.jpg`; crops: `photo-crop-*.jpg`; in-context arches: `photo-hero-{d1440,t768,m390}-*.png`; served versions: `stale-images.jpg`.*

| Criterion | Finding |
|---|---|
| **Brand fit** | Strong. Every landing photo is high-key daylight in warm neutrals; Profis wear ivory, sand or stone tunics and linen, never black. Rooms are real Altbau, hotel and office spaces, with no spa props. The set finally matches the Bone and Stone surfaces. The 05 band keeps a deep espresso calm zone for the Bone text (title ≥ 8.9:1). |
| **Quality** | Clean, consistent grade, plausible depth of field. The v4 portraits are one coherent series (head to waist, both hands visible, bright background) but read stock-like: all smile at the camera in similar poses. |
| **Anatomy** | Hands checked at crop scale in the home, hotel, office, manicure, pedicure, arrival and 11 portrait frames: five fingers, plausible grips, no fused fingers seen. |
| **Discretion** | Home hero: sheet at the shoulder blades, fine. **Hotel hero (N4-5):** the guest's back is bare from the neck to mid-back in the file and in the served variant. This breaks PHOTOGRAPHY.md § 4 rule 4 (l. 70, "linen to the shoulder blades or more") and § 166, at hero scale. The massage tile (`categories/massage-v3`) is similar, at tile scale. |
| **Continuity** | The signature pair (03) is "one afternoon in two moments", but the door shows a younger man and the sofa an older woman. The Profi who would connect them is cropped out of the right arch (`focal="12% 50%"`, `vignettes.tsx:197`). |
| **Detail** | The pedicure Profi works barefoot (`categories/pedikuere-v3`, P3, as audit-1 A6). |
| **Ortszeile vs light** | Matches: Zu Hause 10:30, warm sun through the window (AUDIT-v3 l. 131 calls the source "summer evening sun"; the light reads as either, the documents disagree); Hotel 15:30, hazy sun over the skyline; Büro 13:00, bright; the pair 15:25 / 16:10; 05 Treppenhaus 11:40, morning daylight. The real-shoot shot list (PHOTOGRAPHY.md § 13.2) still schedules these scenes at 19:25–21:10, so a real shoot would put the Ortszeilen back to evening. |
| **Integrity labels** | „Demo-Profil · Foto KI-generiert“ on all eight portrait cards and on the 03 Mai T. card. The footer line „Bilder: KI-generierte Entwicklungsassets“ covers the scene photos, as in A3. The demo ribbon is present. |
| **What visitors actually see (N4-3)** | The optimiser serves AVIF variants of rejected attempts for `editorial/hotel-v3.jpg` at w 640 and 1080 (diff 53 against the file) and for `landing/app-pro-v3.jpg` at w 384 and 1080 (diff 43). The served hotel image is the attempt with a laptop whose lid shows a logo (`stale-hotel-laptop-crop.jpg`), which AUDIT-v3 rejected for exactly that. It is what the 1440 hero (DPR 1 → w 640) and DPR 3 phones (w 1080) show. The served app-pro image at 768 shows the Profi facing the camera, contradicting the alt „schaut auf das Smartphone“ (`t768-jump-fuer-profis.png`). 364 of the 368 responses checked (184 URLs × AVIF and WebP, widths ≤ 1080) match the file. |

## 9. Integrity

| Rule | Result |
|---|---|
| No invented testimonials, ratings, counts, identities or badges | Holds. Ratings come from data; „Verifiziert“ only for approved Profis; no `aggregateRating`. |
| AI images labelled | Holds (§ 8). |
| Nothing unfinished looks functional | Holds. |
| What is shown is what was approved | **Fails on this host (N4-3):** two QA-rejected attempts are served at four widths. |
| Nothing behaves differently for automation in a way that flatters measurements | Holds. `tier.ts` webdriver → `none` is unchanged and documented. Note: Lighthouse's `none` tier is also the crashing tier (N4-1); Lighthouse does not hover, so its scores are unaffected. |
| Evidence integrity (this audit) | My A3 M-3 numbers were void (§ 3). Every run in this audit is reported, including the aborted latency batch and the noisy second Lighthouse batch. |

---

## 10. New findings

| ID | Pri | Finding | Where | Evidence |
|---|---|---|---|---|
| **N4-1** | **P0** | **Desktop crash in the lite and none tiers.** On a fine pointer ≥ 1024 with reduced motion (tier `none`), Save-Data or `deviceMemory < 4` (tier `lite`), any hover or focus on an 02 index row throws React #185 and the root error boundary replaces the page („Das hat nicht geklappt.“, 0 chapters). Wheel-scrolling with the pointer at x = 300 triggers it too; at x = 1100 it does not. Cases: 1440 reduce hover / Tab, 1440 Save-Data hover, 1280 and 1024 reduce hover, 1920 reduce Tab all crash; 1440 full hover / Tab do not. Dev stack: `useLayerSwap.settle` ← `SwapLayer` `useLayoutEffect` (the no-animation branch calls `onSettle(n)` synchronously). A DOM trace shows the preview's layer being remounted with a new `<img>` on every pass. The hero place switch uses the same hook and does not loop in tier `none` (`photos.js` switched all three places), so I have not isolated the root cause. | `hero/swap-layer.tsx:33-35`, `hero/use-layer-swap.ts:18-26` (the updater mutates `counter.current`), `behandlungen/index-list.tsx:24, 88-96` | `data/index-crash.json`, `index-crash-scroll.json`, `index-crash-*.png`, `logs/index-crash-dev-console.txt` |
| **N4-3** | **P1** | **Stale optimiser variants of QA-rejected photos** (§ 8). The pipeline rewrote `hotel-v3.jpg` and `app-pro-v3.jpg` in place across attempts. The optimiser caches each URL × width × format (here `max-age=14400`), and `.next/cache/images` survives rebuilds. Any CDN that caches by URL will do the same. | `public/images/editorial/hotel-v3.jpg`, `landing/app-pro-v3.jpg`; `.next/cache/images` | `data/stale-images.json`, `stale-images.jpg`, `stale-hotel-*.jpg` |
| **N4-2** | P2 (regression) | **Preload ≠ `<img>` width below 1024.** The same `heroSizes()` string yields preload 828 / 1080 / 1280 w but `<img>` 640 / 640 / 828 w at 390 (DPR 2) / 768 / 820. Both start within 30 ms at high priority: +25.7 / +36.8 / +44.7 KB on the LCP path, "preloaded but not used" warnings. LCP is not materially later (2.31–2.51 s at 390 vs 2.34–2.54 s at the unaffected 412). Net bytes are now above A3 at these widths. | `hero/places.ts:65-90` (`heroSizes`), `primitives/landing-image.tsx:36` (`preload()`) | `logs/preload-lcp.log`, `scripts/preload-sizes.js`, `data/tech.json` |
| **N4-4** | P2 | **05 jump below 1024 focuses a hidden heading:** h2 top 739 (390, dock at 776), 1000 (768 × 1024) and 1048 (820 × 1180). The visitor sees the arch photo and the Ortszeile, not the chapter. | `chapters/05-fuer-profis.tsx:39-52` (arch before text), `landing.css:828-860` | `t768-jump-fuer-profis.png`, `m390-jump-fuer-profis.png`, `data/jump-*.json` |
| **N4-5** | P2 (brand) | **Hotel hero discretion** (§ 8); the AUDIT-v3 note is inaccurate. | `public/images/editorial/hotel-v3.jpg`; `brand/photography/AUDIT-v3.md:137` | `photo-crop-hotel.jpg`, `photo-hero-*-imhotel.png` |
| N4-6 | P3 | Signature pair shows two different clients; pedicure Profi barefoot; AUDIT-v3 calls the home hero "evening sun" under a 10:30 Ortszeile; PHOTOGRAPHY.md § 13.2 still plans evening shoots. | `ablauf/vignettes.tsx:197`; photo docs | § 8 |
| N4-7 | P3 | **Stall share on the landing is above the control** in an interleaved batch: 3/8 vs 1/8 (`/hilfe`). Across all batches it is 14/26 on the landing (A3 3/14). | — | § 11.2 |
| N4-8 | P3 | perf.js overlay open (Event Timing, a click soon after load) 200–312 ms (median 248; A3 median 200), while `latency.js` shows 102–180 visible. The place switch's visible response hits 208 ms in 2/6. | `nav/chapter-overlay.tsx`, `hero/place-switch.tsx` | `data/perf-mobile-slow4g.json` |

---

## 11. Performance measurements (all runs, none discarded)

### 11.1 Lighthouse 12.8.2

Score · LCP s · TBT ms · SI s (CLS 0 in every simulate run).

| Set | Runs | Median |
|---|---|---|
| **Mobile simulate `?motion=lite`, batch 1** (15:15) | 85 · 4.22 · 29 · 2.44 ᶜ / 85 · 4.18 · 3 · 2.85 ᶜ / 92 · 3.31 · 43 / 92 · 3.33 · 36 / 89 · 3.72 · 29 / 86 · 4.18 · 20 · 2.42 ᶜ / 83 · 4.37 · 152 · 2.46 ᶜ / 92 · 3.32 · 24 / 91 · 3.33 · 68 | **89** |
| Mobile simulate `?motion=lite`, batch 2 (15:38, load avg ≈ 3) | 85 ᶜ / 92 / 85 ᶜ / 81 · 219 ᶜ / 80 · 235 ᶜ / 85 ᶜ / 91 / 68 · 403 ᶜ / 74 · 266 ᶜ | 85 |
| **Mobile simulate `?motion=lite`, batch 3** (16:17, load < 1.5, interleaved) | 91 · 3.33 · 119 / 92 · 3.26 · 49 / 85 · 4.21 ᶜ / 86 · 4.18 ᶜ / 91 · 3.47 / 92 · 3.33 / 86 · 4.08 ᶜ / 91 · 3.32 | **91** |
| Control `/hilfe`, batch 3 (interleaved) | 91 ᶜ / 95 / 92 / 96 / 96 / 96 / 96 / 96 | 96 |
| Mobile simulate `/` (tier none), batch 1 | 92 / 85 ᶜ / 91 / 69 · 383 ᶜ / 85 ᶜ | 85 |
| Mobile simulate `/`, batch 2 (loaded) | 84 / 73 / 80 / 78 / 79 (TBT 115–434) | 79 |
| Mobile DevTools `?motion=lite` | 91 · 2.44 · 194 / 93 · 2.37 · 164 / 91 · 2.46 · 209 / 93 · 2.37 · 177 / 90 · 2.40 · 256 // 93 · 2.52 · 122 / 94 · 2.27 · 153 / 91 · 2.35 · 230 / 93 · 2.32 · 173 / 95 · 2.35 · 83 (CLS 0.0011 each) | 93 · LCP 2.37 · **TBT 175** |
| Desktop `?motion=full` | 99 · 0.87 · 0 / 99 · 0.83 · 4 / 99 · 0.85 · 0 | 99 |

ᶜ = the first-frame stall (SI ≥ 2.3 s while FCP stays at 1.5 s). Runs without it score 89–92 on the landing.

### 11.2 The stall (constraint, re-examined)

- **The signature is the same as in A3.** The observed first paint comes at 1.24–1.30 s while `load` has already fired at 0.31–0.55 s. In two batch-2 runs, and in `/`-4 of batch 1, the delay was about 2.2 s, together with TBT inflated by machine load.
- **Rate on the landing:** 4/9, 7/9 (loaded) and 3/8. Audit 3 saw 2/9.
- **Control route:** `/hilfe` stalled 1/8 with the runs interleaved, so the stall is not specific to the landing. It does hit the landing more often.
- **Still a constraint:**
  - DevTools-throttled runs never stall (10/10, median 93).
  - The lab vitals outside Lighthouse are within target.
- **Needs a trace (R4-6).** I do not count it against the score.

### 11.3 `perf.js` (`MASK=1 … mobile slow4g 5`, `?motion=lite`)

| Run | FCP | LCP | TBT | CLS | Hotel · Büro · FAQ · Overlay open · Esc (Event Timing, ms) |
|---|---|---|---|---|---|
| 1 | 2,376 | 2,528 | 174 | 0 | 168 · 88 · 56 · 200 · 176 |
| 2 | 2,316 | 2,316 | 190 | 0 | 112 · 112 · 56 · 312 · 192 |
| 3 | 2,284 | 2,444 | 108 | 0 | 176 · 88 · 64 · 248 · 112 |
| 4 | 2,340 | 2,340 | 67 | 0 | 96 · 96 · 64 · 240 · 224 |
| 5 | 2,276 | 2,420 | 39 | 0 | 104 · 72 · 72 · 304 · 176 |

The LCP element is the hero `<img>` (`hero-home-4x5-v3`, 828 w, 25.7 KB) every time. Medians: TBT 108, LCP 2,420.

### 11.4 Interactions (`latency.js`, 2 batches × 3 runs, 412 × 823, 4× CPU, Slow 4G, cold)

Visible response in ms (Event Timing in brackets); "early" is a tap 1.5 s after load, with the surfaces cold.

| Interaction | Six runs | Median | A3 median |
|---|---|---|---|
| Place switch „Im Hotel“ | 124 / 173 / 197 / 208 / 208 / 144 (88–144) | 185 | 205 |
| Dock → sheet | 233 / 102 / 141 / 145 / 128 / 108 (104–192) | **134** | 197 |
| Was? list in the sheet | 107 / 141 / 135 / 245 / 142 / 209 (104–152) | **141** | 393 |
| Esc (sheet) | 50 / 100 / 48 / 73 / 43 / 62 | 56 | 52 |
| Dock → overlay | 132 / 155 / 146 / 102 / 150 / 180 | 148 | 138 |
| Esc (overlay) | 151 / 62 / 76 / 85 / 117 / 91 (64–128) | **88** | 252 |
| FAQ summary | 153 / 160 / 78 / 62 / 157 / 135 | 144 | 143 |
| Early dock → sheet | 326 / 306 / 355 / 294 / 288 / 310 (232–312) | **308** | 382 |

First Was? tap right after hydration (`pickers4.js`, 3 runs each):

| Page | Shell (ms) | List (ms) |
|---|---|---|
| Hero | 202 / 294 / 123 | 504 / 587 / 361 |
| `/behandlungen/massage` | 321 / 217 / 188 | 853 / 577 / 514 |

With the pickers chunks blocked, the list still renders: the code is present elsewhere, so the test is inconclusive, as in A3.

### 11.5 Hydration, early input, scrolling

- **Hydration** (3 runs): FCP 2.14–2.33 s; header CTA 3.43–3.55 s; place switch 3.88–4.03 s; hero form 4.64–4.69 s (A3 4.43–4.72); footer 4.75–4.78 s.
- **Early input:** „10115“ typed at 3.2–3.8 s is kept 3/3, with „· Berlin“ and the submit to `/suche?plz=10115`.
- **Scrolling:**

  | Case | Frames > 50 ms | Scroll CLS |
  |---|---|---|
  | 1440 full, 1× CPU | 5 | 0.0073 |
  | 1440 full, 4× CPU | 47 | 0.0057 |
  | 390 lite, 4× CPU | 3 | 0 |
  | 390 lite, 1× CPU | 0 | 0 |

### 11.6 Weight (`weight.js`)

- **JS:** 12 module scripts, 577 KB raw, **178.4 KB gz**. Of this, react-dom is 70.1 and Next 44.0; the framework and root together are about 148 KB.
- **CSS:** 35.8 KB gz.
- **HTML:** 416 KB raw / 54.4 KB gz.

---

## 12. Accessibility

- **axe-core 4:** 0 violations at 1440 full, 768 lite and 390 lite. The "incomplete" colour-contrast items are over images; the band was re-sampled (§ 4.2).
- **Keyboard:**
  - skip links (44 px, visible on focus) → header (44 px targets) → hero → entry → 02 … 07 → footer;
  - a visible ring on every stop except the PLZ input, whose segment shows the ring;
  - overlay: 0 escapes, Esc restores focus;
  - chapter jumps focus the h2.
- **Failures:**
  - N4-1: reduced motion plus a desktop pointer or keyboard crashes the page.
  - N4-4: the 05 h2 is focused while hidden below 1024.
- **Targets:** as A3. Below 44 px remain the sr-only skip links, the PLZ inner box and the desktop footer links (32 px; AA passes).
- **Not verified:** VoiceOver and NVDA.

## 13. SEO

- Title, description, Open Graph and canonical are unchanged.
- `noindex` in `DEMO_MODE`.
- The FAQPage equals the five visible questions, and the 06 „Alle Fragen“ link points to `/hilfe` (200).
- **Note:** crawlers that run JS usually run with reduced motion off and do not hover, so N4-1 does not affect indexing.

---

## 14. Open issues, prioritised

| ID | Pri | Issue | Dimension |
|---|---|---|---|
| N4-1 | **P0** | Desktop crash in the lite and none tiers (02 index) | Interaction, Technical, A11y |
| N4-3 | **P1** | Stale optimiser variants of rejected photos | Brand, Technical, Integrity |
| N4-2, N4-4, N4-5 | P2 | Preload ≠ img; 05 jump hides its heading; hotel discretion | Technical, Mobile, A11y, Brand |
| M-1 (early), M-3, M-4, M-7, M-8, N-11, N4-6 … N4-8, I-16 | P3 | See §§ 5 and 10 | Performance, Typography, Brand |

---

## 15. Remediation tasks

**R4-1 · No crash in the 02 index, any tier (N4-1).** Restores Interaction to 8; required for Technical and A11y.
- **Where:** `src/components/landing/hero/use-layer-swap.ts:17-36`, `hero/swap-layer.tsx:26-39`, `behandlungen/index-list.tsx:24, 88-96`.
- **Change:**
  - Make the swap terminate without a synchronous state loop. Compute `n` outside the `setLayers` updater, so the updater is pure; React may re-run updaters.
  - When no swap animation applies (`lite`, `none`), switch to the new layer directly in `useLayerSwap` (`[{ key: active, state: "current", n }]`) instead of entering and then settling from a layout effect. Otherwise settle in `requestAnimationFrame`, not synchronously in `useLayoutEffect`.
  - Wrap each chapter island in an error boundary that renders the chapter's static content, so one island can never blank the page.
- **Expected:** `scripts/index-crash.js` gives 7 chapters and 0 console errors in all 8 cases; `index-crash-scroll.js` gives 7 chapters at x = 300.
- **Verify:**
  - those two probes;
  - a new E2E test: 1440, `emulateMedia({ reducedMotion: "reduce" })` and `?motion=lite`; hover every index row, Tab through 02, wheel-scroll with the pointer at x = 300; expect 7 sections and no page error;
  - `focus-walk.js d1024,d1440` reaches 07 and the footer.

**R4-2 · Serve only approved photos (N4-3).** Required for Brand back at 9 and for Technical.
- **Where:** the photo pipeline (`scripts/images/sources.json`, the registry's `replacedBy`) and `.next/cache/images` on every host.
- **Change:**
  - Never overwrite an image file in place. Give each accepted attempt a new name (content-hash or attempt suffix) and point the registry or `replacedBy` at it.
  - For this host, purge `.next/cache/images`. Per the Lead's rule, stop the server first, then `rm -rf soma/.next/server/route-cache`.
  - Add `scripts/stale-images.py` (or an equivalent) to the photo QA sign-off.
- **Expected:** `python3 -I docs/landing/audit-4/scripts/stale-images.py 1080` reports 0 mismatches.
- **Verify:** that script, plus `photo-hero-d1440-imhotel.png` and `t768-jump-fuer-profis.png` re-shot (no laptop; the Profi looks at the phone).

**R4-3 · One hero fetch per viewport (N4-2).**
- **Where:** `src/components/landing/hero/places.ts:65-90`, `primitives/landing-image.tsx:36`.
- **Change:** pick one of:
  - give the preload a `sizes` without `svh` / `clamp()` (height ranges as media conditions, for example `(max-width: 399px) and (max-height: 900px) 72vw`), the same string on the `<img>`;
  - or preload only from 1024 up (`media="(min-width: 1024px)"` on the preload) and rely on `fetchPriority="high"` below.
- **Expected:** `scripts/preload-sizes.js` shows one hero request at 360–1440; the console is clean at 8 widths (`tech.js`); hero bytes at 390 DPR 2 are 18.3 KB.
- **Verify:** `preload-sizes.js`, `preload-lcp.js` (LCP not later than now), `tech.js`.

**R4-4 · A jump to 05 shows its heading (N4-4).**
- **Where:** `src/components/landing/chapters/05-fuer-profis.tsx:38-52`, `(landing)/landing.css:828-860`.
- **Change:** below 1024, put the eyebrow, h2 and lead before the arch (DOM order, or `order` with a matching focus order), or reduce the arch so the h2 starts in the upper half of the first view. Keep the ≥ 1024 band as it is.
- **Expected:** `jump.js` gives the 05 h2 top ≤ 45 % of the viewport height at 390, 412, 768 and 820, clear of the dock.
- **Verify:** `jump.js m390,m412,t768,t820` and `jump05.js` screenshots.

**R4-5 · Hotel discretion (N4-5).** For Brand.
- **Where:** `public/images/editorial/hotel-v3.jpg` (regenerate under a new name, see R4-2); `brand/photography/AUDIT-v3.md:137`.
- **Change:** a frame with the sheet drawn to the shoulder blades, as § 4 rule 4 asks. Correct the AUDIT note.
- **Expected:** at the 1440 and 390 arch crops no bare back below the shoulder blades.
- **Verify:** `photos.js`.

**P3 follow-ups:**
- **R4-6:** record a performance trace of a stalled Lighthouse run (`--save-assets`) and of a control run, and compare the first frame; if something on the landing delays it, fix it.
- **M-1 early:** start the dialogs' chunk on the first `pointerdown`.
- **M-4:** DevTools TBT ≤ 150.
- **M-7:** room under the hero figure below 768.
- **M-8:** a measured `--lp-hero-arch-top`.
- **N-11:** lite fallback for `hardwareConcurrency ≤ 4`.
- **N4-6:** pair continuity (the same client at the door and on the sofa, or a focal that keeps the Profi in the right arch); a shod pedicure Profi; align PHOTOGRAPHY.md § 13.2 with the daytime Ortszeilen.

**After R4-1 to R4-4, Interaction, Technical and Accessibility should return to 8.** R4-2 and R4-5 bring Brand back toward 9. Performance stays at 8; the PR-1 early path and M-4 are what would make it 9.

---

## 16. Verdict

**Not passing: 8 of 11 dimensions ≥ 8.** Below the gate: Interaction design 7, Technical quality 6, Accessibility 6.

**What is fixed:**
- The audit-3 performance gate items are independently verified: the sheet opens in a median 134 ms, the Was? list in 141 and the overlay closes in 88 at 4× CPU.
- Performance reaches 8.
- The declutter does what the client asked: half the page, a quarter less DOM, cleaner focus order, every claim in the spec's before/after table reproduced.
- The daylight photography is the right direction for the brand.

**What fails:**
- A P0 crash takes the whole landing down for reduced-motion and Save-Data desktop visitors who scroll, hover or tab past the treatment index.
- On this host the optimiser shows photos the photo QA rejected.
- PR-4's hero sizing doubled the LCP fetch at 390, 768 and 820.
- Below 1024 the 05 jump focuses a hidden heading.
- The hotel hero breaks the brand's discretion rule.

**Constraints, accepted and not counted:**
- the headless first-frame stall (re-examined in § 11.2; now worth a trace);
- the framework's share of first-load JS.

*Database: I ran the landing E2E suites once (they create searches and waitlist entries) and `rebook.js` logged in once as `testkunde@soma.test`. No `demo:refresh`. `:3100` was left running, not restarted, not rebuilt; its image cache was not purged.*
