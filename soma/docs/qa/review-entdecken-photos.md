# SOMA: Independent product review: „Entdecken / Für dich“ and the new photo set

*Independent Product Reviewer · 2 Nov 2026 · I observed, tested and scored. I changed no product code. Evidence: `docs/qa/review-entdecken-photos/*.jpg` (57 files, each ≤ 400 KB).*

| | |
|---|---|
| Build under test | Production build `next start` on `http://localhost:3100`, `BUILD_ID 6iiBRG4Wz8fPlEvY356WF` (14:48 UTC). HEAD is `0b4b273`. The only commits after the build touch tests: `0d9384a`, `0b4b273`. The cached-404 fix `2dfafaf` (14:46) is in the build. No file under `src/`, `scripts/` or `supabase/` is newer than `BUILD_ID`. `DEMO_MODE=true`, `AUTH_PROVIDER=local` |
| Accounts | `testkunde@soma.test` (Julia H.), `testkunde-b2b@soma.test` (Selin A.), `testadmin@soma.test` |
| Devices | Chromium 390×844 @2x and @3x (touch), 768×1024, 1440×900 @1x and @2x. One browser at a time. No Lighthouse or performance batteries |
| Tools | Playwright, used for screenshots, keyboard walks, PerformanceObserver CLS, and server-action replay with foreign sessions. axe-core 4.14 (WCAG 2.0–2.2 A/AA), injected from a scratch install. sharp, for luma and near-black per file, and for 100 % crops. Vitest integration `tests/integration/explore.test.ts`: **13/13**. E2E `tests/e2e/entdecken.spec.ts` on :3100, `--workers=1`: **12/12** |
| Clean-up | I created one test collection as admin (`qa-review-mvzeu9cg`) and **deleted** it again. The E2E run created and deleted its own two. Afterwards `/admin/entdecken` lists exactly the 6 seeded collections. The audit log keeps the 7 `explore.*` rows of my test (create, 4× update, unpublish, delete), because it is append-only by design. I switched Julia's „Persönliche Vorschläge“ off and back **on**, and verified it is on |

---

## Scores

| # | Dimension | Score | One-line evidence |
|---|---|---|---|
| 1 | Entdecken: usefulness and concept fit | **8** | Explore + For you + featured are all delivered. Personal rails with real slots and Endpreis |
| 2 | Visual quality and premium feel | **7** | Bright and calm, but there are repeated images in a rail, a 3+1 orphan with a mid-word break at 768 px, and work photos that do not match the service |
| 3 | UX and navigation (incl. account nav fix) | **7** | The nav fix is correct on every viewport. Signed-in Profis and admins see „Melde dich an“. „Beliebt“ has no link to its ranking explanation |
| 4 | Mobile experience | **8** | Snap rails with peek, focus scrolls cards into view, the bottom bar shows Entdecken active, CLS 0, no overflow |
| 5 | Accessibility | **9** | axe: 0 violations on 9 Entdecken/account/admin views. Visible focus ring, named lists, correct tabs, 12 px floor, 44 px targets |
| 6 | Integrity and transparency | **7** | Labels, opt-out, real slots and popularity floors all hold. **But** 4 seeded cards say „Freie Termine zwischen … Uhr“ without the engine, and the covers carry no AI label |
| 7 | Admin curation workflow | **8** | Complete CRUD, validation, preview of any state, audit, and immediate revalidation, all measured. There is no staged preview for edits to a live collection |
| 8 | Security and permissions | **8** | RLS, admin re-check, and replayed admin actions refused for guest, customer and Profi. No IDOR. The anon RPC leaks exact booking counts |
| 9 | Technical quality | **8** | 0 console or hydration errors, CLS 0, cached 404 cleared on activation. Scheduled windows lag up to 15 min. One admin prefetch 404 |
| 10 | Photos: light and mood | **9** | Luma: portraits 119.5 → 181.9, portfolio 93.7 → 174.4. Near-black 25 % → 2 % |
| 11 | Portrait credibility (incl. Selin A.) | **7** | All 30 are credible, and Selin is flawless. But the full-body framing leaves faces at about 6–15 px in the 32–80 px avatars, where portraits appear most |
| 12 | Anatomy and artefact freedom | **7** | Portraits: 30/30 pass at 100 %. Sample: 32 at full size, 4 fail (an extra hand on Mai T.'s profile, a torn bag on `/anmelden`, a topless table on `/fuer-profis`, a bare back) |
| 13 | Brand fit and consistency | **8** | One coherent bright series that sits on Bone/Stone. Minor deviations: skylines that are not German, US switch plates, black trousers |
| 14 | Integrity: AI labels | **6** | Portraits are labelled everywhere (100 %). Category, portfolio and cover images are unlabelled on `/entdecken`, `/behandlungen` and `/staedte/[stadt]` |

**Verdict.**
- **Entdecken** answers the client's request („Explore- oder For-you-Page … featured Behandlungen“) with a calm, honest, well-built feature. It can ship after a short fix list:
  - R1: the static slot claims;
  - R2: the AI labels on covers and tiles;
  - R3: the invite shown to signed-in Profis;
  - R9: the count column in the public RPC.

  Security has no blockers.
- **The photo set** clearly fixes what the client complained about: it is bright, professional, in light uniforms, and Selin A. now has both arms and hands. Before the client sees it again, fix:
  - the labelling gaps;
  - the small-avatar crop;
  - four images: `brows-lashes-5-v3`, `editorial/arrival-v3`, `editorial/setup-v3`, `massage-4-v3`.

---

## Rule check (from the brief)

| Rule | Result | Evidence |
|---|---|---|
| A free slot only from the availability engine | **Fails in seeded copy** | „Nächster freier Termin“ appears only in `#fuer-dich` (0 elsewhere, measured). It matches the profile picker: Mai T. shows „Heute, 19:30“ in Für dich and the same in the picker (`slot-check-mai-t.jpg`). **However**, `scripts/db/lib/demo-data.ts:397,410,423,436` seed the notes „Freie Termine zwischen 12/17 und 17/22 Uhr“, which render on public cards, e.g. `/entdecken/im-hotel-ankommen` „Am Abend der Anreise“ (`sammlung-hotel-d-scrolled.jpg`). Nothing computes them, and the link goes to `/suche` without a PLZ |
| No invented popularity, reviews, badges or verification | Pass | Floors are enforced in SQL (`explore_popular_services`, ≥ 5 per city / ≥ 3 per service; tested). Ratings show only from 3 published reviews (`visibleRating`). „Neu“ shows the real `approved_at`. „Verifiziert“ appears only for approved Profis |
| „Von SOMA ausgewählt“ / „Anzeige“ | Pass | The editorial label appears on every card and page. Sponsored shows „Anzeige“ + „Bezahlte Platzierung im Auftrag von Beispiel QA GmbH.“ on the card, the page and `/ranking` (`entdecken-anzeige-karte.jpg`, `sammlung-anzeige-seite.jpg`). The DB constraint refuses a sponsor-less paid row |
| Personalisation only from own data; opt-out stops it | Pass | `getForYouAction()` takes no arguments; the session alone decides. `withUser(session.userId)`. The payload has only own data plus catalogue keys (inspected; a foreign UUID passed as an argument is ignored). Off means `{state:"off"}` before any read (`explore.ts` `getForYou`). After opt-out, `/entdecken` shows no section, no invite and no slot claim, and „Beliebt“ falls back to Berlin |
| Every AI image labelled | **Fails** | See dimension 14 |
| *du*, ≤ 1 Oxblood, ≤ 1 italic, 1 serif headline, 12 px floor | Pass | 0 *Sie* in the new copy. Oxblood: 0 on `/entdecken` and the collection pages (only the focus ring). Italics: 1 (`h1 em`) on `/entdecken`, 0 on collection, preview, `/konto/profil` and `/admin/entdecken`. Serif: the h1 plus card titles and names in `type-title-serif`, which brand § 9.3 allows. Text < 12 px: 0 elements on every view measured |
| RLS: only live collections public; writes admin-only, audited | Pass | Migration 0011 has policies plus no write grants. 13/13 integration tests pass. Replay and audit are measured below |
| No IDOR on preview or admin; „Für dich“ only from the session | Pass | Measured below (dimension 8) |

---

## A. Entdecken

### 1. Usefulness and concept fit: 8

**What works.**
- *Explore*: six editorial Themenwelten, „Beliebt in <Stadt>“ (six qualifying cities, Berlin first) and „Neu auf SOMA“ (4 Profis, ≤ 60 days).
- *For you*, for Julia:
  - **Wieder buchen**: 6 Profis, favourites first, a one-tap rebook dialog;
  - **Passend zu deinen Buchungen**: 8 offers, interleaved across 5 categories, each with a real next slot and the Endpreis to 10435;
  - **Neu in deiner Nähe**: Hanna B.

  It loads in 1.0–1.5 s after hydration (`fuer-dich-d.jpg`, `fuer-dich-m.jpg`).
- *Featured* is a curated collection model that can also carry future paid placements. That answers „featured Behandlungen anbieten“ without inventing anything.
- The rebook for Katrin B. (Frankfurt) reuses the previous address („Gleicher Profi, gleiche Leistung, gleiche Adresse“, `rebook-katrin-frankfurt.jpg`), so her slot is honest even for a Berlin customer.

**What holds it back.**
- „Für dich“ sits **below** the six collections. Its top is at 2,100 px on 1440 × 900 (more than two screens) and at 1,227 px on 390 (`entdecken-gast-d-full.jpg`). The spec chose this to avoid layout shift, but the most valuable part for a returning customer is the least visible.
- The seeded collection „Neue Profis“ duplicates the section „Neu auf SOMA“ two screens further down. It is also a static list: in 60 days it will still say „Seit Kurzem auf SOMA“.
- „Featured“ exists only inside collections. There is no single featured treatment on `/suche` or the category pages, which a client asking for „featured Behandlungen“ may expect. This is a product decision, not a defect.

### 2. Visual quality and premium feel: 7

**What works.**
- Bright covers in the arch.
- One serif headline with one italic clause.
- Sans section titles.
- Generous white space.
- Quiet labels, never Oxblood.
- The collection page (`sammlung-hotel-d-fold-3s.jpg`) looks like a premium editorial page.

**Issues.**
1. **Repeated images inside one rail or list.**
   - „Beliebt in Berlin“ shows `categories/massage-v3` twice (Entspannungs- and Rücken-&Nackenmassage; `entdecken-gast-d-full.jpg`).
   - „Massage im Hotel“ uses it three times out of five cards.

   Cause: unpinned service items and popular cards fall back to the category image (`src/server/services/explore.ts:155` `categoryImage`).
2. **The work photo does not match the service.** Hanna B.'s „Thai-Massage“ card shows an office chair massage. Mai T.'s „Shellac-Maniküre“ shows hands holding a cup (`fuer-dich-d.jpg`). `portfolioImages()` (`explore.ts:178`) picks the first portfolio image per *Profi × category*, not per service.
3. **768 px:**
   - The 4-card rails become 3 + 1, leaving an orphan card.
   - „Entspannungsmassag|e“ breaks without a hyphen (`entdecken-gast-t-beliebt-crop.jpg`).

   See `explore-rail.tsx:30` (`md:grid-cols-3`) and `explore-cards.tsx:85` (no `hyphens`).
4. The 64 px avatars in „Wieder buchen“ show tiny full-body figures (see dimension 11).
5. On desktop the collection hero leaves an empty band above the text because of `lg:items-end` (`sammlung-hotel-d-fold-3s.jpg`). This is a taste issue, not a defect.

### 3. UX and navigation (including the account nav fix): 7

- **The account nav fix works.** „Entdecken“ → `/entdecken` from:
  - the desktop header nav „Konto“;
  - the mobile and tablet bottom bar (`konto-nav-m.jpg`).

  On `/entdecken` the bar stays with **Entdecken active** (`aria-current="page"`, `entdecken-kunde-m-fold.jpg`). On desktop, „Entdecken“ is the first site link and is active. This is verified on all three viewports and in E2E.
- **Bug: signed-in non-customers get the guest invite.** Selin A. (Profi, the client's demo persona) and the admin see „Melde dich an, dann siehst du hier Vorschläge … Anmelden →“ while signed in (`entdecken-profi-sieht-anmelden.jpg`). Cause: `src/server/actions/explore.ts:25` returns `{state:"guest"}` for every non-customer role. `explore-for-you.tsx:42` then renders the invite, although its own comment says other roles get nothing.
- **„Beliebt“ and „Neu“ have no „So zählen wir“ link.** `/ranking#entdecken` exists, but nothing on `/entdecken` links to it (grep: only the `ranking/page.tsx` TOC). The collections have „So wählen wir aus“, and Für dich has „Warum sehe ich das?“.
- Good:
  - breadcrumbs;
  - „Mehr entdecken“ back link;
  - links go into the existing flow (`/profis/<slug>?leistung&dauer&plz`, `/suche?…`);
  - one-tap rebook.

### 4. Mobile experience: 8

**Good.**
- Snap rails at `min(78vw, 19rem)` with a visible peek.
- Keyboard focus scrolls the card into view (`rail-fokus-m.jpg`).
- `scrollWidth = 390` (no horizontal overflow).
- CLS 0, including when Für dich arrives.
- The fixed customer bottom bar has a spacer.
- City chips are 36 px visually and 44 px as a hit area (`chip.tsx:15`, `before:-inset-y-1`).

**Weaker.**
- The first screen is almost only text: eyebrow, h1, lead, section header and link take about 1,170 of 1,688 device px before the first image (`entdecken-gast-m-fold.jpg`).
- The tablet orphan and the word break (dimension 2).
- The small avatars (dimension 11).

### 5. Accessibility: 9

- **axe-core 4.14:** 0 violations on:
  - `/entdecken` as guest (390, 768, 1440) and as customer with Für dich loaded;
  - `/entdecken/neu-auf-soma` (3 viewports) and `/entdecken/im-hotel-ankommen`;
  - `/entdecken/vorschau/[id]`;
  - `/admin/entdecken`, the editor and `/admin/entdecken/neu`;
  - `/konto` and `/konto/profil`.
- **Keyboard** (Tab walk, 40 stops, 390 and 1440):
  - logical order;
  - every stop has a 2 px Oxblood focus ring;
  - rail cards scroll into view;
  - the city switch is a real `tablist` with roving `tabindex` and ←/→/Home/End (E2E);
  - the rebook opens a named dialog.
- **Names:** every rail is a `ul` with `aria-label` („Von SOMA ausgewählt“, „Wieder buchen“ …). The Für dich groups are `role=group` with headings. The loading state is `role=status` „Für dich wird geladen“.
- **Floor and targets:** no text below 12 px, and every interactive target ≥ 44 px on mobile.
- **Minor:**
  - AI covers are `alt=""` (decorative). Since there is no visible label either (dimension 14), screen-reader users get no AI disclosure for them.
  - The pre-existing TOC numbers on `/ranking` and `/datenschutz` fail contrast at 4.25:1 (`text-ink-muted/80`). This is outside the feature, but the new sections sit in those TOCs.

### 6. Integrity and transparency: 7

**Holds.**
- Labels (see the rule table).
- The opt-out is server-side: nothing is computed when it is off.
- Popularity floors live in the database.
- Ratings show only from 3 reviews.
- The „ab“ price is the real minimum, with „zzgl. Anfahrt“.
- Endpreis is shown only with a PLZ.
- Slots are verified against the profile picker.
- `/ranking#auswahl`, `#entdecken`, `#fuer-dich` and `/datenschutz#vorschlaege` describe the code: the constants are imported, and the legal basis is flagged ⚖ for the lawyer.

**Breaks.**
1. **Static slot claims in the seed:** „Freie Termine zwischen 17 und 22 Uhr.“ / „… 12 und 17 Uhr.“ (`demo-data.ts:397,410,423,436`). This is exactly what the rule forbids. The editor's hint under „Notiz“ even says „keine Versprechen zu Terminen“, but nothing enforces it (`explore-admin.ts:126`, `explore-editor.tsx:24` `FLAGGED`).
2. **The AI covers on `/entdecken` are unlabelled.**
   - All 6 collection covers plus 4 „Beliebt“ category images: 0 × „Bild KI-generiert“ on the page outside the portraits.
   - The cover of „Neue Profis“ shows an AI man who is visibly the same face as demo Profi **Chidi O.** (`pros/pro-10-v4`; `foto-befunde.jpg`, last two tiles). That is an unlabelled AI portrait of a „Profi“ next to „Von SOMA ausgewählt“.
3. **The public text contradicts the database.** `/ranking#entdecken` says „Wir zeigen nur die Reihenfolge, keine Zahlen“ (`ranking/page.tsx:208`). But `explore_popular_services()` returns `booking_count` to `anon` (migration 0011, lines 115–147; `tests/integration/explore.test.ts:314` even asserts `[3]`).
4. „Anzeige“ is a pill with the same size and position as the editorial pill (`entdecken-anzeige-karte.jpg`). It is legally adequate as built, and could be stronger: above the image, or on the image's top-left.

### 7. Admin curation workflow: 8

Measured end to end with my own collection:

| Step | Result |
|---|---|
| Create (title, address, line, cover from the registry, a service item, a category item with PLZ 10435) | Saved and redirected to the editor |
| Draft | Public page 404, not on `/entdecken`. Preview shows „Vorschau · Entwurf“ (`admin-vorschau-entwurf.jpg`) |
| Activate and save | On `/entdecken` **at once** (`x-nextjs-cache: MISS`). The collection page went from 404 to 200 and shows `HIT` with the title, so the cached 404 was cleared |
| Rename | New title on both pages at once |
| „Sichtbar ab“ tomorrow 10:00 | Status „Geplant“. Gone from `/entdecken`, page 404. Preview shows „Vorschau · Geplant“ |
| Paid placement + sponsor | „Anzeige“ and „Bezahlte Platzierung im Auftrag von Beispiel QA GmbH.“ on the card, the page and `/ranking` |
| Deactivate (row action) | Gone at once, page 404 |
| Delete (confirm dialog) | Row gone, page 404, preview 404 |
| Audit (`/admin/protokoll?bereich=explore_collection`) | 7 rows with actor, time and snapshot (`admin-protokoll-entdecken.jpg`) |

The editor is strong:
- inline validation;
- the pinned-Profi picker shows „6 Profis bieten die Leistung an“;
- reorder with ↑/↓;
- a live card preview;
- a tone-of-voice check (`admin-entdecken-bearbeiten.jpg`).

Gaps:
- Saving a **live** collection publishes at once. There is no preview of unsaved changes, and no draft revision for live content.
- The audit stores a snapshot with `items: N`, not which items changed. For paid placements, the item list matters.
- The voice check does not catch slot promises (dimension 6).
- On `/admin/entdecken/neu` the inert card preview prefetches `/entdecken/neu` and gets a 404 in the console (`explore-editor.tsx:370`).

### 8. Security and permissions: 8

- **Routes:** `/admin/entdecken`, `/neu`, `/[id]` and `/entdecken/vorschau/[id]` redirect with 307:
  - guest → `/anmelden?next=…`;
  - customer → `/konto`;
  - Profi → `/pro`.
- **Server actions replayed with foreign sessions** (captured action IDs, `fetch` with `Next-Action`):
  - `setExploreCollectionPublishedAction` and `saveExploreCollectionAction` return „Bitte melde dich an.“ (guest) and „Dafür fehlt die Berechtigung.“ (customer, Profi);
  - a random UUID was used, so nothing could change even on failure;
  - nothing was created.
- **Für dich:**
  - takes no input; extra arguments are ignored;
  - returns `guest` for non-customers;
  - runs in `withUser`;
  - the payload holds no other person's data.
- **Admin services** run `assertAdmin` (session role plus a DB re-check) inside the transaction.
- **Tables** have no API write grants, and RLS is tested 13/13.
- **Input handling:** JSON-LD escapes `<`. Slug, cover path (no `..`) and filters are validated on the server.
- **Finding (low):** `explore_popular_services` is `security definer`, `grant execute … to anon` (`0011…sql:147`), and returns exact `booking_count` for every service at or above the floor. With the public anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY` when `AUTH_PROVIDER=supabase`), anyone can read booking volumes per service and city over a rolling window. Polling and differencing over time also reveals when individual bookings happen. This contradicts the „keine Zahlen“ promise.

### 9. Technical quality: 8

- **Errors:** 0 console errors and 0 hydration warnings on every Entdecken view.
  - The only error was the admin prefetch 404 above.
  - The aborted RSC prefetches are normal.
  - The one-off `ERR_SSL_PROTOCOL_ERROR` on `/ranking` did not reproduce.
- **CLS:** 0.000 at 390, 768 and 1440, guest and customer, including the arrival of Für dich.
- **Caching:** `/entdecken` and the collection pages are ISR (`s-maxage=900`, `x-nextjs-prerender: 1`), and admin writes revalidate them at once (measured above).
- **Gaps:**
  - Time-based starts and ends rely on the 15-minute ISR (`entdecken/page.tsx:20`, `[slug]/page.tsx:11`). A **paid** placement can stay visible up to 15 minutes after `active_until`. With `stale-while-revalidate`, it can also be served stale once more.
  - Non-customer roles are mapped to `guest` (dimension 3).
- **Tests:** E2E 12/12 and integration 13/13.
- The sitemap is empty, which is correct under `DEMO_MODE` (`sitemap.ts:18`).

---

## B. Photography in the product

The landing `/` was only glanced at (`foto-landing-glance-d.jpg`): its images are v3, and the footer note reads „Bilder: KI-generierte Entwicklungsassets“. Every image rendered on the 32 swept page views (33 distinct files) is a v3/v4 file; I found **0** old-set files (sweep of every `<img>` src).

### 10. Light and mood: 9

My own measurements (sharp; Rec. 709 luma on sRGB, 0–255; near-black = luma < 51), on the files the product serves:

| Group | Old (in use before) | Now | Near-black old → now |
|---|---|---|---|
| Portraits (30) | 119.5 (v2) | **181.9** (v4; darkest `pro-29-v4` 140.7) | 24.7 % → **1.9 %** |
| Categories (7) | 83.4 | **174.1** | 32.5 % → 3.4 % |
| Portfolio (85) | 93.7 | **174.4** | 25.0 % → 2.5 % |
| Editorial (7) | 79.3 | **168.2** | 40.0 % → 5.6 % |
| Entdecken covers (6) | new | **177.9** | 2.1 % |

These match `AUDIT-v3.md`. In the product, the set reads like sunny, warm-neutral mornings, which is exactly the opposite of „dunkel und deprimierend“ (`foto-behandlungen-d.jpg`, `foto-profil-selin-d.jpg`, `portraits-v2-alt-sheet.jpg` against `portraits-v4-sheet.jpg`).

The only reservation: the warm cast is uniform (R − B of 35–49 on average). Next to Bone it is coherent, but a few frames lean yellow, e.g. `kosmetik-3`.

### 11. Professional credibility of the portraits (incl. Selin A.): 7

- **The images themselves are excellent.** There are:
  - six settings and seven poses;
  - light tunics and linen, never black;
  - an 85 mm look and a friendly gaze;
  - real diversity of age, origin and gender (Kiran D. non-binary, Gabriele H. 60+).

  They read like one shoot (`portraits-v4-sheet.jpg`).
- **Selin A. (`pro-01-v4`)** is flawless at 100 %:
  - both arms and hands cradle a folded towel;
  - fingers are correct;
  - the ivory tunic has an Oxblood piping;
  - one coherent massage table with face cradle is in a bright Altbau.

  It answers the „keine Arme“ complaint completely.
- **In the product, the wider v4 framing works against them.** The `Avatar` circle crops the 4:5 image to its upper 1200 × 1200 px (`avatar.tsx:42`; `Portrait` `avatar.tsx:105`), so a head-to-thigh figure becomes a miniature. Measured face width:
  - **about 8 px** in the 40 px avatars on `/konto` (and about 6 px in the 32 px card avatars);
  - about 12 px at 64 px (Für dich „Wieder buchen“);
  - about 14–15 px at 72–80 px (`/suche` result rows).

  See `avatare-klein-dpr3.jpg`. These sizes are where most portrait impressions happen. The old v2 set was head-and-shoulders and read better at those sizes.
- Minor: every Profi has the same broad smile and polish, so the series edges towards stock. This is acceptable for a demo, and the shoot plan (§ 13) should loosen it.

### 12. Anatomy and artefact freedom: 7

**All 30 portraits at full size, with hands cropped at 100 %:** 30/30 pass.

| Profi | Note |
|---|---|
| 01 Selin A. | pass, flawless |
| 02, 03, 07, 08, 09, 10, 11, 12, 13, 14, 15, 17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 29 | pass: both arms complete, five fingers, tucked hands unambiguous |
| 04 Gabriele H., 28 Nora K. | pass. Wardrobe reads as a dress with bare legs, not tunic + light trousers (§ 6) |
| 05 Abena O. | pass. The brush ferrule is rose-gold (§ 9 „never rose gold“) |
| 06 Karim H. | pass for anatomy. **The scissors are incoherent**: blades above, the handle loop emerges under the other hand (`foto-befunde.jpg`, tile 1) |
| 16 Yasmin K. (Frankfurt), 30 Theresa H. (München) | pass. The window skylines read as Manhattan, not Frankfurt or Munich |
| 18 Emre Y. | pass. US-style switch and outlet plates on the wall |

**Sample of 32 other images at full size:**
- 6 Entdecken covers;
- 4 categories: manikuere, haare-styling, massage, kosmetik;
- 2 editorial: arrival, setup;
- 20 portfolio: manikuere-1/3/7/9, pedikuere-1/3, massage-4/6/12/13/16/18, kosmetik-3/10, brows-lashes-5/7, make-up-3/9, haare-styling-4/14.

| Result | Images |
|---|---|
| **Fail (4)** | **`portfolio/brows-lashes-5-v3`** (on Mai T.'s profile, „Arbeiten“): a **third hand** at the right edge holds the thread, while the Profi's two hands are on the forehead and the pencil. **`editorial/arrival-v3`** (`/anmelden`, `/registrieren`, `/passwort-vergessen`, `/staedte/frankfurt`): an irregular **black torn hole** in the side of the table bag, visible in the product crop (`foto-anmelden-d.jpg`, `foto-befunde.jpg` tile 2). **`editorial/setup-v3`** (`/fuer-profis` hero): the „portable massage table“ is a **bare wooden frame without its padded top**. **`portfolio/massage-4-v3`**: the back is bare almost to the waist, against § 8 „linen drawn to the shoulder blades or higher“ / „Bare backs to the waist“ |
| Watch (5) | `manikuere-7-v3` (three hands interleave, about 10 fingertips in a small area, plausible but busy at 100 %). `massage-6-v3` (male Profi, supine female client, sheet at chest line, hand at the armpit; review against the zero-tolerance discretion rule). `explore/vor-dem-event` (the Profi's left hand grips nothing). `categories/manikuere-v3` (Profi in black trousers). `massage-16-v3` (an „office“ over Sydney Harbour) |
| Pass (23) | the rest. The hands are correct at 100 % |

### 13. Brand fit and consistency: 8

**Fits.**
- One grade, one wardrobe family and one lens look across portraits, categories, portfolio and covers.
- The images sit calmly on Bone and Stone.
- The places are mostly unmistakably Altbau (herringbone, double casements, tiled stove in `nach-dem-sport`).
- The arch crops respect the focal points.

**Deviations.**
- **Discretion** (`massage-4`, `massage-6`).
- **Wardrobe:**
  - black trousers on `categories/manikuere-v3`;
  - dresses with bare legs on `pro-04` and `pro-28`;
  - the rose-gold brush on `pro-05`;
  - a flowering peace lily, a staged flower, on `pro-21`.
- **Non-German cues:**
  - Manhattan or Asian skylines (`pro-16`, `pro-30`, `explore/im-hotel-ankommen`, `make-up-9`);
  - Sydney Harbour (`massage-16`);
  - US switch plates (`pro-18`).
- **Resolution on the auth pages:** the 3:2 `arrival-v3` is object-covered into a 384 × 480 arch with `sizes="(min-width: 1024px) 384px"` (`src/app/(auth)/layout.tsx:39`). The browser fetches `w=384` at 1× and `w=828` at 2×, which is about 1.8× upscaled and visibly soft (`auth-foto-weich-dpr2.jpg`).

### 14. Integrity: AI labels: 6

- **Portraits: 100 %.** „Demo-Profil · Foto KI-generiert“ appears beside every AI portrait I rendered. That covers:
  - the profile header;
  - `/suche` rows;
  - category and city cards;
  - `/konto` and Favoriten;
  - SOMA Pro (the shell avatar is swapped to initials);
  - Für dich;
  - „Neu auf SOMA“;
  - collection items.

  Admin lists use initials, with no photo. Portfolio grids carry „Bilder KI-generiert“, and collection and category heroes carry „Bild KI-generiert“.
- **Not labelled (visible text absent and `alt=""`):**

| Where | Images | Code |
|---|---|---|
| `/entdecken` collection cards | 6 covers, incl. the Chidi-O.-like face on „Neue Profis“ | `explore-cards.tsx:122` |
| `/entdecken` „Beliebt“, collection item cards (category and portfolio images) | 4 + up to 5 per collection | `explore-cards.tsx:79` |
| `/behandlungen` | 7 category images | `src/app/(site)/behandlungen/(uebersicht)/page.tsx:88` |
| `/staedte/[stadt]` | 7 category tiles | `discovery-tiles.tsx:37` (`CategoryTile`, used at `staedte/[stadt]/page.tsx:133`) |

---

## Remediation tasks (every dimension < 8, plus the security finding)

| # | Dim. | Where | Change | Expected result | Verify |
|---|---|---|---|---|---|
| R1 | 6 | `scripts/db/lib/demo-data.ts:397,410,423,436`; `src/server/services/explore-admin.ts:126` (`note`); `src/components/admin/explore-editor.tsx:24` (`FLAGGED`) | Reword the notes to the filter, not a promise, e.g. „Zeigt dir Termine zwischen 17 und 22 Uhr.“ On the server, refuse notes and titles matching `/frei(e|en)?\s+Termin|noch frei|sofort verfügbar/i` with a field error. Add the same terms to `FLAGGED` | No public card claims availability. Only Für dich shows „Nächster freier Termin“ | `npm run demo:refresh`, then `curl -s :3100/entdecken/im-hotel-ankommen \| grep -c "Freie Termine"` → 0. In `entdecken.spec.ts` (collection test), add `expect(page.getByText(/Freie Termine/)).toHaveCount(0)`. Add a vitest case for the refusal |
| R2 | 14, 6 | `explore-cards.tsx:122` (`CollectionCard`), `:79` (`ExploreCard`); `discovery-tiles.tsx:37`; `behandlungen/(uebersicht)/page.tsx:88` | Render `<AiLabel src={…} kind="image" />` under each AI photo, in 12 px caption, as on the collection hero. Alternatively, one „Bilder KI-generiert“ line in each rail or grid header (`ExploreSectionHeader` lead) | Every AI image has a visible disclosure in its card or section | Rerun the sweep: for every `img` whose src contains `/images/`, an ancestor ≤ 7 levels up (card, `li` or section) contains „KI-generiert“. Expect 0 unlabelled on `/entdecken`, `/behandlungen` and `/staedte/frankfurt`. Add it as an E2E assertion |
| R3 | 3 | `src/server/actions/explore.ts:25`; `src/components/site/explore-for-you.tsx:42` | Return `{state:"guest"}` only when `!session`. Other roles get `{state:"off"}` (hidden), or a new `{state:"other"}` with no invite | Selin A. and the admin see no „Melde dich an“ on `/entdecken` | Log in as `testkunde-b2b@soma.test`, then `getByText(/Melde dich an, dann siehst du/)` count 0. Add to `entdecken.spec.ts` |
| R4 | 3, 6 | `src/app/(site)/entdecken/page.tsx:84-89` (Beliebt), `:107-112` (Neu) | Add an `aside` link „So zählen wir“ → `/ranking#entdecken`, like „So wählen wir aus“ | Every ranked section links to its explanation | `getByRole('link', {name:'So zählen wir'})` has `href="/ranking#entdecken"` |
| R5 | 2 | `src/server/services/explore.ts:155` (`categoryImage`), `:178` (`portfolioImages`), `listPopularByCity`, `itemCards` | Pick work photos per **service**: `provider_portfolio.service_id`, or a caption tag, falling back to category. Within one list, do not reuse an image already used: try the next Profi's portfolio, then another category variant | No duplicate image src within one rail or list. Thai-Massage shows a mat or Thai scene, not chair massage | Script: for each `ul[aria-label]` on `/entdecken` and every collection, collect the `img` srcs and expect no duplicates. Visually check Hanna B.'s Thai card |
| R6 | 2, 4 | `src/components/site/explore-rail.tsx:30`; `explore-cards.tsx:85` | 4-item rails use `md:grid-cols-2 lg:grid-cols-4`. Titles get `hyphens-auto` (with `lang="de"` on `<html>`) or `&shy;` in long service names (brand § 4.4) | At 768 px, 2 + 2 cards. „Entspannungs-massage“ breaks with a hyphen | Recapture `entdecken-gast-t-full.jpg` at 768 and check visually |
| R7 | 11 | `src/components/ui/avatar.tsx:42` (`Avatar`), `:105` (`Portrait`, `tile`/`oval` ≤ 96 px); `scripts/images/sources.json`; `brand/photography/tools/recrops.mjs` | Derive a head-and-shoulders square crop per v4 portrait (`pros/pro-NN-v4-face.jpg`, 600 × 600, face width ≈ 45 %) via `recrops.mjs`. Register it as a variant, and use it in `Avatar` and in Portraits rendered ≤ 96 px. Keep the 4:5 for the profile header and „Neu“ cards | Faces fill about 40–50 % of the circle at 40, 64 and 80 px. The AI label is unchanged | Recapture `avatare-klein-dpr3.jpg`. Measure that face width ≥ 0.4 × diameter |
| R8 | 12, 13 | `public/images/portfolio/brows-lashes-5-v3.jpg`, `editorial/arrival-v3.jpg`, `editorial/setup-v3.jpg`, `portfolio/massage-4-v3.jpg` (+ review `massage-6-v3`, `manikuere-7-v3`) | Regenerate (`generation/shotlist-v3.mjs`; same model and grade): brows-5 with exactly two hands, mapping **or** threading. Arrival with an intact bag. Setup with the padded table top unfolding. Massage-4 with linen to the shoulder blades. Log in `AUDIT-v3.md` / `jobs-v3.json` | No extra limbs, warped objects or discretion breaches in the set in use | 100 % crops of the new files. Product check on `/profis/mai-t-berlin`, `/anmelden`, `/fuer-profis` |
| R9 | 8, 6 | `supabase/migrations/0011_explore_collections.sql:115-147` → new migration `0012` | Return `(service_id uuid, rank integer)` (`row_number()`), not `booking_count`. Or revoke `anon/authenticated` and call it with `withService` from `listPopularByCity`. Update `tests/integration/explore.test.ts:314` | No booking count leaves the database. `/ranking#entdecken` („keine Zahlen“) becomes true | `select * from public.explore_popular_services('berlin')` as `anon` has no count column. Integration test green |
| R10 | 13 | `src/app/(auth)/layout.tsx:39` | Register a 4:5 recrop `editorial/arrival-4x5-v3` (like `landing/hero-home-4x5`), or set `sizes="(min-width: 1024px) 720px, 1px"` | The auth photo is sharp: served width ≥ 720 at 1× and ≥ 1440 at 2× | `currentSrc` `w=` on `/anmelden` at DPR 1 and 2 |
| R11 | 13 | `pros/pro-16-v4`, `pro-30-v4`, `explore/im-hotel-ankommen`, `portfolio/make-up-9-v3`, `massage-16-v3`, `pro-18-v4`, `categories/manikuere-v3` | At the next regeneration, prompt for city-true views (Frankfurt Westend/Main, München without towers, Hamburg HafenCity), German switch plates and light trousers | Places match their city | Contact sheet review |

**Smaller items (dimensions ≥ 8, optional):**
- Live edits: add „Vorschau mit Änderungen“, which runs the preview resolver on the unsaved form state through an admin-only action (`explore-editor.tsx`).
- Audit the item list or diff (`explore-admin.ts:362`).
- Add `prefetch={false}` or a non-link wrapper for the inert card (`explore-editor.tsx:370`).
- For collections with `active_until` or `active_from` within 24 h, schedule a revalidation at the boundary (cron route calling `revalidatePath`), so paid windows end on time.
- Give „Anzeige“ more weight: place it on the cover's top-left.
- Consider moving Für dich above the collections for signed-in customers, with a fixed-height skeleton so CLS stays 0.
- Compact the mobile hero so the first card shows above the fold.

---

## Evidence index (selection)

- **Entdecken:**
  - `entdecken-gast-{m,t,d}-{fold,full}.jpg`
  - `entdecken-kunde-m-fold.jpg`
  - `fuer-dich-{d,m}.jpg` (the sticky header overlapping in `fuer-dich-d` is a capture artefact)
  - `rail-fokus-m.jpg`
  - `entdecken-gast-t-beliebt-crop.jpg`
  - `entdecken-profi-sieht-anmelden.jpg`
  - `slot-check-mai-t.jpg`
  - `rebook-katrin-frankfurt.jpg`
  - `konto-nav-{m,d}.jpg`
  - `konto-profil-optout-aus.jpg`
  - `ranking-fuer-dich.jpg`
  - `sammlung-hotel-{d,m}-{fold-3s,scrolled}.jpg`
  - `sammlung-anzeige-seite.jpg`
  - `entdecken-anzeige-karte.jpg`
- **Admin:**
  - `admin-entdecken-liste.jpg`
  - `admin-entdecken-neu-formular.jpg`
  - `admin-entdecken-bearbeiten.jpg`
  - `admin-vorschau-entwurf.jpg`
  - `admin-protokoll-entdecken.jpg`
- **Photos:**
  - `portraits-v4-sheet.jpg` and `portraits-v2-alt-sheet.jpg` (old vs new)
  - `foto-befunde.jpg` (10 crops of the findings)
  - `avatare-klein-dpr3.jpg`
  - `auth-foto-weich-dpr2.jpg`
  - `foto-*.jpg` (23 product views: profiles, search, categories, `/behandlungen`, `/staedte`, `/fuer-profis`, auth, `/konto`, `/pro`, admin)
- **Note:** Playwright `fullPage` captures of the collection pages showed empty arch slots. A real viewport scroll renders every image at opacity 1 (`sammlung-hotel-m-scrolled.jpg`), so those captures were discarded as artefacts and are **not** a finding.
