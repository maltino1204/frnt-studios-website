# Landing page: conversion and integration spec (Agent 5)

*Conversion & Integration Specialist · phase L1 → L2 · 1 Nov 2026 · v1.1 (reconciled with `LANDING_DESIGN_SPEC.md` v1.0; implemented)*
*Inputs: `docs/landing/BRIEF.md` §§ 4, 8, 9 · `brand/PLAN.md` · `brand/COPY_DECK_LANDING.md` · `brand/BRAND_VOICE.md` · `docs/landing/REFERENCE_ANALYSIS.md` (principles 3, 11, 12) · `brand/applications/LANDING_ART_DIRECTION_INPUT.md` · `docs/landing/LANDING_DESIGN_SPEC.md` (binding on design).*

**How to read this.**
- Every route claim cites `file:line` in `soma/` and was checked against the running production build on `:3100`
  (2026-11-01, `DEMO_MODE=true`; `/api/health` reports `demoMode: true`). "200" means an anonymous `GET` returned 200 there.
- Priorities: **P0** is required before the landing ships, **P1** should ship with it, **P2/P3** are follow-ups.
- Copy strings are quoted from the copy deck. This document decides where a string goes and what it does, not what it says.
- Ownership (PLAN.md, phase L2): Agent 5 owns `src/components/landing/booking/**`, the landing metadata, JSON-LD and OG.
  Changes to shared app files (`src/components/site/**`, `src/server/**`) are listed as small, backwards-compatible
  changes (C1–C12, § 1.9) for the Lead to approve.

---

## 0. Reconciliation with the design spec, and implementation status (v1.1)

The Lead approved v1.0 (C1–C9 to implement). Where `LANDING_DESIGN_SPEC.md` differs, **the spec wins on design and this
document on routes and data**. The sections below were edited accordingly; this table is the summary.

| Topic | v1.0 said | Now (source) |
|---|---|---|
| Chapter ids | only the anchors CTAs need | spec § 5.1: `bei-dir` (entry `termin`), `idee`, `behandlungen`, `so-funktionierts`, `dein-ort`, `profis`, `deine-buchung`, `fuer-profis`, `fragen`, `soma` |
| Desktop booking access | header CTA scrolls to the hero | spec § 5.5: hero ≥ 25 % in view → focus its PLZ; otherwise the **booking bar** (dialog under the header, `id="termin-leiste"`) |
| Mobile dock | hidden at the top while the hero entry intersects; Conversion owns the rules | spec § 5.6: **visible until the hero booking card is ≥ 25 % in view**; hidden while chapter 10's CTAs are ≥ 30 % in view, a text field has focus, or a dialog is open. 56 px pill, left half = chapter control, right half „Termin finden“ (**primary**, not accent). DOM position directly after the header. Markup: Frontend (`nav/landing-dock.tsx`); rules: Motion (`html[data-dock]`). Conversion supplies `openBooking` and the sheet. |
| Pickers in the sheet | stacked sheets | spec § 5.5: Was?/Wann? expand **inline** (`pickerLayout="inline"`) |
| Button variants | chapter repeats „secondary“ | spec § 6.1/6.2: hero, bar and sheet submit = accent (Oxblood); header, dock and chapter CTAs = primary (Espresso; Bone in dark scopes); chapter 10: accent with Bone fill on the band + secondary |
| Chapter 05 CTA | desktop-only quiet link | spec § 4.5: the chapter foot carries „Freie Termine finden“ at every width; 06's fallback has it too |
| Provider ratings | „Neu auf SOMA“ under 3 reviews | spec § 4.6: rating only with ≥ 3 reviews, **otherwise nothing**; no proof band and no count-up on the landing (spec § 3.1) |
| Demo label (C10) | add to cards | already shipped by the brand remediation: `AiLabel` (`src/components/ui/ai-label.tsx`) on `ProviderPortraitCard` and every portrait; the landing card uses it |
| OG image | rebuild from `og-default-v2` | spec § 12.1: keep `/brand/og-default.jpg`; it is now the shared `OG_IMAGE` (C7) |
| `SearchAction` | not added | the spec's file plan lists "WebSite + SearchAction (/suche?plz=)". **Kept out** (SEO is this document's remit): `/suche` has no free-text query, is noindex and robots-disallowed, and the sitelinks search box is retired (§ 6.2). Flagged to the Lead. |
| Hero entry | `variant="hero"` | spec § 4.1.6: `variant="sill"` (width `--lp-sill-w`, popovers flip upward, anchored waitlist panel), `placeHint` from the place switch, `RebookRow` under the trust row from lg |

**Implemented (Agent 5):**

| Item | Where |
|---|---|
| C1 no-JS GET form + hidden inputs | `src/components/site/booking-entry.tsx` (form `action="/suche" method="get"`; hidden `kategorie`/`leistung`/`datum`/`zeit` at the end of the form) |
| C2 deep links `kategorie`, `datum`, `zeit` | same file, mount effect (`whenFromDate`, `TIME_WINDOWS`) |
| C3 shared draft | `BookingEntry` props `initialDraft`, `onDraftChange`, `syncDraft`; store `src/components/landing/booking/booking-draft.ts` |
| C4 booking access | `src/components/landing/booking/booking-access.ts` (`openBooking`, `soma:booking:open` routed by one listener), `booking-bar.tsx`, `booking-sheet.tsx`, `booking-link.tsx` (`BookingLink`, `SearchLink`) |
| C5 location-denied copy | `booking-entry.tsx`, `locate()` error callback (`err.code === 1`) |
| C6 loading status | `booking-entry.tsx`, visually hidden `role="status"` „Termine werden gesucht …“ |
| C7 OG constant | `src/lib/brand.ts` `OG_IMAGE`; `src/app/layout.tsx` uses it |
| C8 revalidation | `src/server/actions/admin.ts` `revalidatePublicTerms()` (settings, commission rules) and `/` on review moderation |
| C9 data-bound launch cities | `src/app/(site)/suche/page.tsx` (`listCities()` in the unserved-PLZ card) |
| C12 remember a known PLZ | `booking-entry.tsx`, `resolve()` and `locate()` |
| Spec § 4.1.6 | `variant="sill"`, `placeHint`, `popoverPlacement`, `statusLayout`; wrapper `src/components/landing/booking/hero-booking-entry.tsx` |
| Keyboard fix | `WasPicker` keeps focus inside the popover when drilling into a category (focus fell to `<body>`, and the next Tab closed the popover) |
| Copy, FAQ, SEO | `landing-copy.ts`, `faq-data.ts`, `metadata.ts` (`generateLandingMetadata`, `loadLandingConversion`), `landing-json-ld.tsx` |
| Tests | `tests/unit/landing-conversion.test.ts`, `tests/e2e/landing-conversion.spec.ts` (T1–T22) |

C10 was covered by the brand remediation; C11 is covered by the Frontend's `LandingImage` (`preload`, no fade), so `Photo` stays untouched.

---

## 1. Route map

### 1.1 Every landing CTA and link

| # | Element (chapter) | Label | Target | Params | Verified in code | Live |
|---|---|---|---|---|---|---|
| R1 | Hero booking entry, submit (01) | **Freie Termine finden** | `/suche` | `plz` (required), `kategorie`, `leistung`, `datum`, `zeit` (§ 1.2) | `src/lib/routes.ts:5-13, 31`; `src/components/site/booking-entry.tsx:526-547` | 200 |
| R2 | Hero secondary (01) | So funktioniert’s | `#so-funktionierts` | — | in-page anchor, contract § 1.8 | — |
| R3 | Returning customer row (01) | Erneut buchen: {Shellac} bei {Anna K.} | `/buchen?angebot=…&start=…&plz=…&von=…` | built by the existing row | `src/components/site/discovery-rebook.tsx:18`; `src/components/site/account-rebook.tsx:19`; `src/app/(checkout)/buchen/page.tsx:45-52` | — |
| R4 | Philosophy quiet link (02) | Behandlungen ansehen | `#behandlungen` | — | anchor contract | — |
| R5 | Category tiles (03) | {Massage} entdecken | `/behandlungen/{slug}` | none | `routes.ts:27`; `src/components/site/discovery-tiles.tsx:34`; `src/app/(site)/behandlungen/[kategorie]/page.tsx:29-32` (static params from active categories), `:53` (unknown slug → 404) | 200 for all 7 seed slugs; `/behandlungen/nails` → 404 |
| R6 | Section link (03) | Alle Behandlungen | `/behandlungen` | — | `routes.ts:26` | 200 |
| R7 | Repeat booking CTAs (04, 05, 07) | Freie Termine finden | `#termin` (opens the entry, § 3.8) | — | entry id default `booking-entry.tsx:419`; `src/components/site/discovery-session.ts:47-55` | — |
| R8 | Professional cards (06) | Profil ansehen | `/profis/{slug}` | none on the landing | `routes.ts:32-33`; `discovery-tiles.tsx:80`; `src/app/(site)/profis/[slug]/page.tsx:70-74` (approved slugs only, else 404) | 200 |
| R9 | Professionals secondary (06) | Selbst Profi? | `#fuer-profis` | — | anchor contract | — |
| R10 | Provider CTA (08, 10, footer) | **Profi werden** | `/pro/registrieren` | none | `routes.ts:54`; `src/app/pro/registrieren/page.tsx:72-84` (anonymous: account step, H1 „Werde Profi auf SOMA.“) | 200 |
| R11 | Provider secondary (08) | Konditionen ansehen | `/fuer-profis#provision` | — | `routes.ts:38`; `src/app/fuer-profis/page.tsx:203` (`id="provision"`) | 200, id rendered |
| R12 | FAQ links (09) | Alle Fragen und Antworten · Stornobedingungen | `/hilfe` · `/stornierung` | — | `routes.ts:39`; `src/app/(site)/stornierung/page.tsx` | 200 |
| R13 | Review provenance (06, 09) | So entstehen Bewertungen | `/ranking#bewertungen` | — | `src/app/(site)/ranking/page.tsx:33` | 200, id rendered |
| R14 | Final customer CTA (10) | **Freie Termine finden** | `/suche`, upgraded on the client to `/suche?plz={plz}` when a PLZ is known (§ 2.5) | `plz` | `routes.ts:31`; `src/app/(site)/suche/page.tsx:113-130` (PLZ prompt without a PLZ) | 200 |
| R15 | Cities (FAQ 2, optional list in 05 or 09; footer) | {Berlin} · Alle Städte | `/staedte/{slug}` · `/staedte` | — | `routes.ts:29-30`; `src/app/(site)/staedte/[stadt]/page.tsx:24-27, 44-48` | 200 for all 6 |
| R16 | Header account | Anmelden / Mein Konto / SOMA Pro / Admin | `/anmelden` · `/konto` · `/pro` · `/admin` | — | `src/components/site/site-header.tsx:73-81`; `discovery-session.ts:35-40` | 200 |
| R17 | Footer provider login | Anmelden für Profis | `/anmelden?next=/pro` | `next` | `routes.ts:36`; `src/components/site/site-footer.tsx:43`; `src/app/(auth)/anmelden/page.tsx:19-21` | 200 |
| R18 | Footer legal | Impressum · Datenschutz · AGB · AGB für Profis · Widerrufsbelehrung · Cookie-Einstellungen | `/impressum` · `/datenschutz` · `/agb` · `/agb-profis` · `/widerruf` · `/datenschutz#cookies` | — | `routes.ts:40-42`; `site-footer.tsx:55-64`; `src/app/(site)/datenschutz/page.tsx:81` | 200, `id="cookies"` rendered |
| R19 | Persistent CTA (header ≥ lg, mobile menu, dock) | Termin finden | `/#termin` | — | `site-header.tsx:82-89`; `src/components/site/mobile-menu.tsx:104-114` | — |

Not used by the copy deck but available: category × city pages `/behandlungen/{kategorie}/{stadt}` (`routes.ts:28`). They are noindex
while thin (`src/app/(site)/behandlungen/[kategorie]/[stadt]/page.tsx:53`); link them from the landing only if `coverage.indexable`.

**Login is never required for discovery.** `/suche`, `/profis/{slug}` and `/buchen` all serve guests; checkout creates the
account on the way (`src/app/(checkout)/buchen/page.tsx:66-67` reads an optional session).

### 1.2 What `/suche` accepts today (`src/app/(site)/suche/page.tsx`)

| Param | Accepted | Anything else | Line |
|---|---|---|---|
| `plz` | exactly 5 digits | missing or malformed → prompt page „Wo findet dein Termin statt?“ (malformed adds „Bitte gib eine fünfstellige Postleitzahl ein.“); unknown → „Die Postleitzahl {plz} kennen wir nicht.“ with the prompt | 92, 113-130, 161-172 |
| `kategorie` | active category slug | ignored | 61 |
| `leistung` | service slug *or* id; a category slug means "all services of the category" | ignored | 46-60 |
| `dauer` | integer minutes contained in the service's `durations` (only with `leistung`) | ignored | 81-82 |
| `datum` | `YYYY-MM-DD` (Europe/Berlin), today or later | dropped → "next 7 days" | 83-85 |
| `zeit` | `morgens` · `mittags` · `abends` (labels Morgens 7–12, **Nachmittags** 12–17, Abends 17–22) | ignored | 86-87; `src/components/site/checkout-format.ts:34-36` |
| `sort`, `sofort`, `bewertung`, `sprache`, `preis`, `seite` | on-page filters of `/suche` | defaults | 88-95; `src/app/(site)/suche/_components/search-state.ts:29-49` |

The entry writes `plz`, `kategorie`, `leistung` (service **slug**), `datum`, `zeit` through `routes.search()`, which drops empty
values (`routes.ts:15-22`; `booking-entry.tsx:539-545`). Example:
`/suche?plz=10115&kategorie=massage&leistung=entspannungsmassage&datum=2026-11-03&zeit=abends` → H1 „Entspannungsmassage
(klassisch) in 10115 Berlin“ (checked live).

**No date parameter is missing.** `/suche` already supports `datum` and `zeit`, so `/suche` needs no change.

### 1.3 Category tiles
- Render the tiles from `listCatalog()` (`src/server/services/catalog.ts:76-81`, active categories in admin sort order), never
  from a hard-coded list. The seven seed slugs are `massage`, `manikuere`, `pedikuere`, `kosmetik`, `make-up`,
  `haare-styling`, `brows-lashes` (`scripts/db/lib/base-seed-data.ts:53-199`). The brief's "Nails & Maniküre" is the category
  „Maniküre“ (`manikuere`).
- Use `routes.category(slug)`. Keep the links **clean** (no `?plz=`): they are internal links to canonical, indexable URLs. The
  category page's own entry picks up the remembered PLZ anyway (§ 2.3).
- A tile is one link. Do not add a second "preselect in the entry" action to the tile (`pickInBookingEntry`,
  `booking-entry.tsx:114-116`, exists but would make tiles dual-action and ambiguous on touch).

### 1.4 Professional cards
- `routes.provider(slug)` with no params. The profile accepts `leistung`, `dauer`, `plz`, `datum` and `einladung`
  (`profis/[slug]/page.tsx:72-90`), but the landing has no search context to pass, and clean links keep the canonical
  (`:55`). Search results carry the context instead (`src/components/site/provider-row.tsx:65-70`).

### 1.5 Provider onboarding
- **Profi werden** → `/pro/registrieren` (`routes.pro.onboarding()`). Anonymous visitors get the account step. Signed-in customers
  get „Du bist mit einem Kundenkonto angemeldet.“ with a sign-out (`pro/registrieren/page.tsx:86-99`). Approved providers are
  redirected to `/pro` (`:102`). The route is `noindex, follow` (`src/app/pro/registrieren/layout.tsx:9-13`), so SEO for providers
  runs through `/fuer-profis` (indexed, `src/app/fuer-profis/page.tsx:25-30`).

### 1.6 Login and account
- The header's account link is session-aware and fetched after hydration, so the page stays static
  (`discovery-session.ts:15-32`). The landing adds no login link of its own. Customer registration (`/registrieren`) is not
  linked: checkout creates the account.

### 1.7 Legal and help
- The footer is shared (`site-footer.tsx`) and already carries every link in the copy deck's footer table, including
  „AGB für Profis“ and „Cookie-Einstellungen“ (`:55-64`). The landing does not duplicate legal links.

### 1.8 In-page anchor contract (Frontend Engineer implements, tests check)

Chapter ids per spec § 5.1: `#bei-dir` (01), `#idee`, `#behandlungen`, `#so-funktionierts`, `#dein-ort`, `#profis`,
`#deine-buchung`, `#fuer-profis`, `#fragen`, `#soma` (10).

| Anchor | Must exist on the landing | Referenced by |
|---|---|---|
| `#termin` | the hero `BookingEntry` wrapper (`HeroBookingEntry` sets it) | header, dock, overlay and chapter CTAs (`href="#termin"`, enhanced to `openBooking`), deep links `/?plz=…#termin` |
| `#so-funktionierts` | chapter 04 | R2, header link |
| `#behandlungen` | chapter 03 | R4, chapter foot of 02 |
| `#fuer-profis` | chapter 08 | R9 |
| `#fragen` | chapter 09 | chapter index |

Every `href="#…"` on the page must resolve to exactly one `id` (test T14). Only one element carries `id="termin"`; the bar
and sheet entries use `termin-leiste` and `termin-sheet`, and they exist only while open.

### 1.9 Small app changes required or proposed

| # | Pri | Change | Why (verified) | Files |
|---|---|---|---|---|
| C1 | **P0** | Give the entry form `action="/suche" method="get"`. Render hidden inputs for `kategorie`, `leistung` (slug), `datum` and `zeit`, only when set. Keep `onSubmit` with `preventDefault` and `router.push`. | The form has no `action`. Without JS, or when submitted before hydration, it GETs `/?plz=…` with the PLZ only (served HTML: `<form role="search" … noValidate>` and `name="plz"` is the only named field). Principle 11 requires a plain GET form. CSP `form-action 'self'` allows it (`next.config.ts:30`). | `booking-entry.tsx:586-596` |
| C2 | P1 | On mount, also honour `?kategorie=`, `?datum=` (today ≤ d ≤ today + 60) and `?zeit=` deep links. | Only `plz` and `leistung` are read today (`booking-entry.tsx:455-472`). This lets `/?plz=…&datum=…` and campaign links prefill everything. | `booking-entry.tsx` |
| C3 | P1 | Add optional `initialDraft` and `onDraftChange` props, plus an in-memory draft module (`src/components/landing/booking/booking-draft.ts`), so the hero entry and the dock sheet share PLZ, service and time. | Two instances otherwise start empty. In-memory means no new storage (§ 2.3). | `booking-entry.tsx` (additive props) + new landing file |
| C4 | P1 | `openBookingEntry()`: if `#termin` is at least half visible, focus its PLZ (current behaviour); else, below `lg` on the landing, open the booking sheet. Wire it into `focusBookingEntry()`: when a landing sheet launcher is registered (a `soma:booking-entry:open` listener) and the viewport is below `64rem`, dispatch the event. | Header and menu then gain the sheet without forking them (`discovery-session.ts:47-55`, `site-header.tsx:84-86`, `mobile-menu.tsx:108-111`). | `discovery-session.ts` + new landing files |
| C5 | P1 | Map geolocation errors: `PERMISSION_DENIED` → „Dein Gerät gibt keinen Standort frei. Bitte gib deine Postleitzahl ein.“ (copy deck); `POSITION_UNAVAILABLE`/`TIMEOUT` → the current „Dein Standort ist gerade nicht verfügbar …“. | Today the copy deck string is used only when the API is missing (`booking-entry.tsx:503`); a denial shows the generic one (`:520`). | `booking-entry.tsx:501-524` |
| C6 | P2 | While `pending`, announce „Termine werden gesucht …“ in a visually hidden `role="status"`. | The copy deck's loading string is not rendered; the button only shows a spinner and `aria-busy` (`src/components/ui/button.tsx:75-96`). | `booking-entry.tsx:701-705` |
| C7 | P1 | Export the OG image descriptor (`url`, `width`, `height`, `alt`) from one module (e.g. `src/lib/brand.ts`) and use it in the root layout and the landing. | Metadata merges shallowly: a page that sets `openGraph` loses the layout's image (Next docs `generate-metadata.md` "Merging"). Today the constant is local to `src/app/layout.tsx:86`. | `layout.tsx`, `brand.ts` |
| C8 | P2 | Add `revalidatePath("/")` to `updatePlatformSettingAction`, the commission rule actions and `moderateReviewAction`. | The landing renders terms, commission and ratings. These actions do not revalidate `/` today (`src/server/actions/admin.ts:151-164, 194-201, 224-233`), so changes show only after the hourly ISR. Provider decisions, categories, services and content blocks already revalidate `/` (`:46, 85, 95, 188`). | `admin.ts` |
| C9 | P2 | Render the unserved-PLZ sentence on `/suche` from `listCities()`. | „SOMA startet in Berlin, Hamburg, München, Köln, Frankfurt und Düsseldorf.“ is hard-coded (`suche/page.tsx:314`); the landing's waitlist hand-off ends there. | `suche/page.tsx` |
| C10 | P1 | In `DEMO_MODE`, label provider cards „Demo-Profil · Foto KI-generiert“ (copy deck § 06). | The label does not exist in the code (no match in `src/`). | landing professionals chapter |
| C11 | P2 | `Photo` passes the `priority` prop, which Next 16 deprecates. Use `fetchPriority="high"` with `loading="eager"` for the hero (or `preload` when exactly one LCP image exists). | `src/components/ui/photo.tsx:99`; Next docs `image.md` "priority" and "preload". | `photo.tsx` (FE) |
| C12 | P3 | Optional: remember the PLZ after a successful lookup, not only on submit. | `storePlz` runs only in `submit` (`booking-entry.tsx:538`). A PLZ typed in the hero is lost if the visitor then taps a category tile. This is still the documented "zuletzt verwendete Postleitzahl" (`datenschutz/page.tsx:87-90`). | `booking-entry.tsx` |

---

## 2. Parameter preservation

### 2.1 The URL is the source of truth
```
Landing entry ──► /suche?plz&kategorie&leistung&datum&zeit         (routes.ts:31)
   /suche chips and filters keep the full state                   (search-state.ts:29-49)
   result row ─► /profis/{slug}?leistung&dauer&plz&datum          (provider-row.tsx:65-70)
   slot chip ─► /buchen?angebot&start&plz[&einladung]             (provider-row.tsx:135)
   profile   ─► /buchen?angebot&start&plz                         (profis/[slug]/_components/profile-booking.tsx:38-40, 201)
   profile "other Profis" ─► /suche?plz&kategorie&leistung        (profile-booking.tsx:147)
   checkout login ─► /anmelden?next=/buchen…  „Deine Terminauswahl bleibt erhalten.“  (anmelden/page.tsx:30)
```
- Service, PLZ and date survive every step as URL params that already exist. Nothing new is needed downstream.
- `zeit` is used only by the result list: once a slot is picked, the time is concrete.

### 2.2 Normalisation rules (landing side)
- Omit empty params; never write `?kategorie=` (`routes.ts:15-22` already does this).
- Write slugs, not ids (`leistung=entspannungsmassage`). `/suche` and the profile accept both.
- Dates are Berlin calendar days from `berlinDateKey()` (`booking-entry.tsx:76-82`). "So bald wie möglich" writes no `datum`.
- "Nachmittags" is written as `zeit=mittags` (`booking-entry.tsx:57-61`). Do not invent `nachmittags`.
- Landing links to discovery pages stay param-free (§§ 1.3, 1.4). Only the entry, the final CTA (R14) and `/suche` carry state.

### 2.3 Storage
- **Existing and documented:** `localStorage["soma:last-plz"]`, written on submit (`booking-entry.tsx:53, 84-99, 538`) and read
  on mount by every `BookingEntry` (home, category and city pages). It is listed in the privacy policy as technically
  necessary, consent-free storage (`datenschutz/page.tsx:81-91`). This is the cross-visit PLZ convenience. Keep it.
- **No new persistent storage in v1.** Sharing state between the hero entry and the dock sheet uses the in-memory draft (C3):
  nothing leaves the tab, and nothing needs a privacy update.
- **Optional `sessionStorage` (not recommended for v1; needs Lead approval and a line in `/datenschutz#cookies`).** To restore
  service and time after a reload or a back navigation, it must:
  1. use one key, `soma:entry-draft`, holding `{ v: 1, kategorie, leistung, datum, zeit, savedAt }` (no PLZ: the PLZ stays in the
     existing key);
  2. read only inside `useEffect` after mount and never during render, so server and client HTML match;
  3. wrap every access in `try/catch` (Safari private mode, blocked storage) and treat failure as "no draft";
  4. validate on read: slugs against the catalogue the page received, `datum` ≥ today, `zeit` in the three values. Drop
     anything stale (`savedAt` older than 30 minutes);
  5. never override URL params (URL > draft > defaults), and be cleared on a successful submit.

### 2.4 Hero entry ↔ dock sheet
The dock sheet mounts a second `BookingEntry` (`variant="compact"`, `id="termin-sheet"`) only while it is open, seeded
from the draft. Every change in either instance updates the draft. Result: a PLZ typed in the hero appears in the sheet, and
the reverse.

### 2.5 Final CTA (R14)
Server HTML: `href="/suche"`, a working no-JS target (the `/suche` prompt is a plain GET form, `search-prompt.tsx:28`). After
mount, a client effect upgrades the `href` to `routes.search({ plz })` when the draft or the stored PLZ holds a valid
5-digit PLZ. The visitor then lands directly on results.

### 2.6 Unknown PLZ, unserved area, no supply (existing flows; the landing adds no extra queries)

| Situation | In the entry (before navigating) | On `/suche` (after submit or a deep link) |
|---|---|---|
| Empty or < 5 digits | inline error, focus back to the PLZ (`booking-entry.tsx:526-532`) | prompt page with „Bitte gib eine fünfstellige Postleitzahl ein.“ (`suche/page.tsx:113-130`) |
| Unknown PLZ (not in `postal_codes`) | „Diese Postleitzahl kennen wir nicht. Bitte prüf die Eingabe.“; submit blocked (`:533-537, 715-719`) | „Die Postleitzahl {plz} kennen wir nicht.“ + prompt (`:161-172`) |
| Known PLZ outside launch cities | „· noch nicht verfügbar“ and the inline waitlist: „In {plz} gibt es noch keine Profis auf SOMA. Sollen wir dir Bescheid geben, sobald es losgeht?“ → e-mail + **Benachrichtigen** → „Eingetragen. Wir melden uns, sobald Profis in {plz} buchbar sind.“ (`:362-392, 624-625, 722-729`). Submit stays allowed. | the same empty state with `WaitlistForm` (`suche/page.tsx:311-317`) |
| Launch city, nobody offers the service or category | — | „In {Stadt} gibt es noch keine Profis für {Behandlung}.“ + waitlist + „Alle {Kategorie}-Leistungen“ (`:318-327`) |
| Supply exists, day booked out | — | next days with free slots as chips, else the waitlist (`:328-353`) |

The waitlist writes `waitlist_signups`, idempotent per e-mail, PLZ and category (`src/server/services/search.ts:192-209`).
These are the only "not available" mechanics. The landing must not show availability claims of its own.

---

## 3. Booking entry spec

### 3.1 One component
Reuse `BookingEntry` (`src/components/site/booking-entry.tsx`) for the hero and the dock sheet. Do not build a second search
widget. The Art Director may restyle it through `className` and the hero composition. These must stay:
- `role="search"` with the name „Termin finden“ (`:587-588`);
- the field order Wo? · Was? · Wann? (copy deck § 01: the PLZ decides availability and the total price);
- the single submit;
- the wrapper `id="termin"`, with `scroll-mt-28` adjusted to the final header height.

Variants: `hero` (one 72 px bar from `lg`, stacked rows below) and `compact` (stacked rows at every width, used in the sheet)
(`:403-404, 572-577`). Props: `catalog` from `toEntryCatalog(listCatalog(), floorsById(getPriceFloors()))`
(`src/components/site/discovery-copy.ts:51-63`) and `postalExample` from `listCityPostalExamples()` (`src/server/services/site-ext.ts:156-162`).

### 3.2 Fields

| Field | Control | Behaviour today | Microcopy (copy deck § 01) |
|---|---|---|---|
| **Wo?** | text input, `inputMode="numeric"`, `autoComplete="postal-code"`, `enterKeyHint="search"`, `maxLength=5` (`:603-620`) | strips non-digits; at 5 digits a server lookup runs, guarded against races (`:445-453, 490-499`). Shows „· {Stadt}“ when OK, „· noch nicht verfügbar“ outside launch cities, a spinner while checking (`:621-631`). | Label „Wo?“ + sr-only „Postleitzahl“ (`:599-601`); placeholder „PLZ, z. B. {10115}“; button „Standort verwenden“ |
| **Was?** | button → picker (`aria-haspopup="dialog"`, `aria-expanded`; `:646-659`) | categories → services. Each service row shows durations and the real floor „ab {x} €“ only when a floor exists (`:187-266`). | Default „Alle Behandlungen“; picker title „Behandlung wählen“; first row „Alle Behandlungen / Alle verfügbaren Profis in deiner Nähe“; „{Massage}: alle Leistungen“ |
| **Wann?** | button → picker (`:669-682`) | day chips So bald wie möglich · Heute · Morgen · Datum wählen (60-day strip); optional window Morgens · Nachmittags · Abends (`:294-357`) | Default „So bald wie möglich“; picker title „Zeitpunkt wählen“; „Fertig“ |
| **Submit** | `<Button type="submit" variant="accent">` (`:701-705`) | validates, stores the PLZ, pushes `/suche?…` in a transition (`:526-547`) | **Freie Termine finden**; loading: spinner (+ „Termine werden gesucht …“ with C6) |

### 3.3 Autocomplete and geolocation: what exists, and what does not
- **Exists:** browser autofill of the PLZ (`autoComplete="postal-code"`); the live PLZ → city lookup (`lookupPostalCodeAction`,
  `src/server/actions/site-ext.ts:15-18`); "Standort verwenden" on explicit tap only. That button calls
  `navigator.geolocation.getCurrentPosition` (10 s timeout, 10 min cache) and then `nearestPostalCodeAction`. The server
  accepts German coordinates only and returns the nearest PLZ centroid (`booking-entry.tsx:501-524`; `site-ext.ts:183-198`). The
  location is not stored (`datenschutz/page.tsx:62-63`). `Permissions-Policy: geolocation=(self)` allows it
  (`next.config.ts:40`).
- **Does not exist:** type-ahead suggestions for PLZ or city, and free-text service search. The Was? picker is a list. Do not
  design or promise either. A future combobox would be a product change outside this landing.

### 3.4 Validation and error states (strings exactly as in code and copy deck)
| Case | Message | Behaviour |
|---|---|---|
| Empty PLZ on submit | Bitte gib deine Postleitzahl ein. | focus to the PLZ, `aria-invalid`, red ring (`:528-531, 568, 593`) |
| 1–4 digits | Bitte gib eine fünfstellige Postleitzahl ein. | same |
| Unknown PLZ | Diese Postleitzahl kennen wir nicht. Bitte prüf die Eingabe. | submit blocked (`:533-537`) |
| Geolocation unavailable or denied | Dein Gerät gibt keinen Standort frei. Bitte gib deine Postleitzahl ein. (denied, with C5) · Dein Standort ist gerade nicht verfügbar. Bitte gib deine Postleitzahl ein. (timeout or unavailable) | hint, not an error; the field stays valid (`:570, 720-721`) |
| No PLZ for the position | Zu deinem Standort kennen wir keine Postleitzahl. Bitte gib sie ein. | hint (`:513`) |
| Server lookup error | message from the action | hint |

Messages render in one `aria-live="polite"` region. The input references exactly one message node through
`aria-describedby` (`:565-570, 709-730`), so each message is read once.

### 3.5 Keyboard and screen reader
- Tab order: Wo? input → Standort verwenden → Was? → Wann? → Freie Termine finden. Enter in the PLZ submits (native form).
- **Desktop (≥ 64rem):** pickers are anchored popovers with `role="dialog"` and a name. Focus moves inside on open (to the
  selected option, else the first control). Esc closes and returns focus to the trigger. Pointer-down or focus outside closes
  (`:121-182`). Closing returns focus to the trigger (`:556-562`).
- **Below 64rem:** pickers are `Sheet`s (native `<dialog>`: focus trap, Esc, focus restore, drag-to-dismiss;
  `src/components/ui/sheet.tsx:94-189`), mounted only while open (`booking-entry.tsx:732-751`).
- Picker options are buttons with `aria-pressed` (`:268-289`); day and time chips sit in labelled groups (`:309-353`).
- Required behaviour for the landing: no hover-only affordances; targets ≥ 44 px (`--spacing-touch`, `src/styles/tokens.css:373`); the
  visible focus ring stays on the restyled bar (`focus-within:outline-2`, `:598`).

### 3.6 Visual integration constraints
- The submit is the hero's **single Oxblood moment** (`variant="accent"`, see the `button.tsx:11` rule), so the hero must not
  put Oxblood elsewhere in the same viewport (`LANDING_ART_DIRECTION_INPUT.md:44`).
- The bar may sit on the photograph only on the image's calm half or on the flat 62 % Espresso scrim (same file, rule 4), and
  its contrast must meet WCAG AA.
- The trust row under the entry is data-bound: „Verifizierte Profis · Endpreis inkl. Anfahrt · Kostenlos stornierbar bis
  {freeCancellationHours} vorher“. The last item is omitted when there is no free tier (current home `src/app/(site)/page.tsx:124-139`).

### 3.7 Mobile dock and booking sheet (< 64rem)
**Design and visibility: spec § 5.6** (Frontend `nav/landing-dock.tsx`, Motion `html[data-dock]`):
- a 56 px pill, `left/right: 12px`, `bottom: max(12px, env(safe-area-inset-bottom))`; left half = chapter control, right half
  **Termin finden** (primary, 48 px; Bone in dark scopes);
- visible until the hero booking card is ≥ 25 % in view (`data-dock-hide="0.25"` sits on the entry wrapper rendered by
  `HeroBookingEntry`); hidden while chapter 10's CTAs are ≥ 30 % in view, a text field has focus, or a dialog is open
  (`html[data-booking-overlay]` is set while the bar or sheet is open);
- `<nav aria-label="Schnellzugriff">` directly after the header in the DOM;
- the footer gets `padding-bottom: calc(56px + 24px + env(safe-area-inset-bottom))` below 1024 (spec § 4.10), so the legal row
  is never covered.

**Integration rules that still apply (Conversion):**
- Hidden means not focusable: `inert` or `visibility: hidden` after the exit, never only `opacity: 0`.
- The dock's outer height (56 + 12 px) stays within `--bottom-nav-height` (4 rem + safe area) above which toasts sit
  (`src/components/ui/toast.tsx:36`).
- While it is visible, `scroll-padding-bottom` on `<html>` equals its height (WCAG 2.2 SC 2.4.11).
- Keep ≥ 8 px between the controls and the home indicator, so a tap never re-expands Safari's toolbar.

**The booking sheet** (`src/components/landing/booking/booking-sheet.tsx`):
- opened by `openBooking({ source: "dock" })` when the hero entry is < 25 % in view;
- the kit `Sheet` titled „Termin finden“ (bottom sheet, drag to dismiss; centred dialog from 768);
- holds `BookingEntry variant="compact" id="termin-sheet" pickerLayout="inline"`, seeded from the shared draft, plus
  `RebookRow`, ending with `pb-safe`;
- Was? and Wann? expand inline, never as a second sheet;
- initial focus: the PLZ when none is known, else the close button (no keyboard over the sheet);
- page scroll locked while open; Esc, the close button, a backdrop tap or a drag down closes it, and focus returns to the
  dock; a submit navigates to `/suche?…` and closes it;
- no JS: the dock link is `href="#termin"`, a plain jump to the hero form.

### 3.8 Header, overlay and chapter CTAs (spec § 5.5)
- All of them call `openBooking({ source })` (`booking-access.ts`), or render `<BookingLink source="…">`. Both are
  `<a href="#termin">` without JS.
- **Hero ≥ 25 % in view:** the hero PLZ gets focus (no scroll, no overlay).
- **≥ 1024, otherwise:** the **booking bar** (`booking-bar.tsx`). A modal dialog directly under the header, full content
  width, Paper, `shadow-overlay`, radius 0 0 24 24, backdrop 48 %. It holds the pill entry (`id="termin-leiste"`) and
  `RebookRow`. Focus goes to the PLZ; Esc or a backdrop click closes it, and focus returns to the trigger. Popovers in the bar
  open downward.
- **< 1024, otherwise:** the booking sheet (§ 3.7).
- **No surface mounted:** smooth scroll to `#termin` (instant under reduced motion) and focus the PLZ.
- A raw `window` event `soma:booking:open` from anyone is routed by the same rules (one listener, installed by the first
  surface).
- `categorySlug` in the request preselects that category in whichever entry opens.

## 4. Conversion map

Button variants follow spec § 6.1–6.2; targets follow § 1.

| Ch. | Intention | Primary CTA (variant) | Secondary | Notes |
|---|---|---|---|---|
| 01 Bei dir | understand; start | entry submit **Freie Termine finden** (accent, the view's Oxblood) → R1 | So funktioniert’s (link style) → R2 | `RebookRow` under the trust row from lg |
| 02 Idee | buy into the idea | — | chapter foot „Weiter: Behandlungen“ → `#behandlungen` | no buttons |
| 03 Behandlungen | choose a category | each row or tile (one link) → R5 | Alle Behandlungen → R6 | price chips are data only (§ 5) |
| 04 Ablauf | trust the process | **Freie Termine finden** (primary) → `openBooking({ source: "ch04" })` | Weiter: Dein Ort | vignettes never show checkout buttons |
| 05 Dein Ort | desire | **Freie Termine finden** (primary; Bone in the night scope) → `openBooking` | Weiter: Profis | — |
| 06 Profis | meet a Profi | each card → R8 | Selbst Profi? → R9 · Weiter: Deine Buchung | fallback without Profis: **Freie Termine finden** |
| 07 Deine Buchung | product confidence | **Freie Termine finden** (primary) → `openBooking` | — | the screenshots' own Oxblood is the view's moment |
| 08 Für Profis | provider acquisition | **Profi werden** (primary in the night scope) → R10 | Konditionen ansehen (secondary) → R11 | no customer CTA |
| 09 Fragen | remove objections | — | Alle Fragen und Antworten → `/hilfe` · Stornobedingungen → R12 | accordion, no buttons |
| 10 SOMA | close with both audiences | **Freie Termine finden** (accent, Bone fill on the Oxblood band) → `SearchLink` (R14) | **Profi werden** (secondary, Bone ring) → R10 | the band is the view's Oxblood moment; dock hidden |
| Persistent | always one action away | header **Termin finden** (≥ 1024, primary) · dock (< 1024, primary) | chapter overlay „Termin finden“ | § 3.7–3.8 |

**Rules against CTA overload:**
1. At most one filled button per chapter plus one link-style CTA. The chapter foot's „Weiter: …“ is navigation, not a CTA.
2. A customer CTA and a provider CTA share a chapter only in chapter 10, which closes for both audiences.
3. Labels are verb + object, without „Jetzt …“ and without exclamation marks (`BRAND_VOICE.md` § 7.3).
4. **Oxblood once per viewport** (spec § 6.2): the hero submit, the bar or sheet submit (their own dimmed view), the product
   screenshots in 07, and the chapter 10 band. Everything else is Espresso or Bone. The dock is hidden while the hero entry
   or chapter 10 is in view.
5. Decorative product previews (04, 07) are `aria-hidden`, not focusable and not clickable, and carry the demo caption, so an
   unfinished integration never looks functional (brief § 8).

## 5. Real data

### 5.1 What the landing may show, and from where

| Data | Service function | Used in | Show only when | Otherwise |
|---|---|---|---|---|
| Categories and services | `listCatalog()` `catalog.ts:76-81` | 01 lead list, 03 tiles, entry picker, headline number (`numberWord(catalog.length)`) | active | — |
| "Live" category (for the hero lead and the meta description) | `getPriceFloors()` `site-ext.ts:119-133` (`providerCount > 0`) | the 01 lead „Massage, Nägel, …“ | ≥ 1 approved provider offers it | drop the word; if none: „Geprüfte Profis kommen zu dir – mit Endpreis inklusive Anfahrt.“ |
| „ab {x} €“ per category | `getPriceFloors()` → min over the category's services (as in `behandlungen/(uebersicht)/page.tsx:70-71`) | 03 tile chip | a floor exists (`fromPrice` returns `null` otherwise, `discovery-copy.ts:73-75`) | hide the chip. One caption per chapter: prices without travel; the total incl. travel appears in the search. Never display `services.price_hint_from_cents` (seed hints). |
| Provider cards | `listDiscoveryProviders({ limit: 8 })` `site-ext.ts:75-116` (approved only, `:88`; Bayesian rating order, `:98`) | 06 | ≥ 3 providers | copy deck fallback without faces |
| „Verifiziert“ badge | provider `status = 'approved'`, which requires every required document approved (`src/server/services/admin.ts:211`) | 06 cards (`discovery-tiles.tsx:91`) | always on approved cards | — |
| Rating per provider | `ratingAvg`, `ratingCount` | 06 cards | `count ≥ 3` → „★ 4,9 (87)“ | nothing (spec § 4.6; the kit `Rating` would show „Neu auf SOMA“, `trust.tsx:40-46`, so the landing card renders `Rating` only from 3 reviews) |
| Aggregate rating, provider and city counts, quotes | `getSocialProof()` `src/server/services/site-ext-2.ts:65-101` | **not used in v1** (spec § 3.1: no proof band, no count-up); rules kept for later | `reviewCount ≥ 3` and `ratingAvg != null`; counts > 0; quotes are real, published, rating ≥ 4, 40–180 characters, one per provider (`:87-88`) | omit the element. With quotes: „Auswahl aus {n} Bewertungen nach echten Terminen“ + link R13 (curated quotes must not read as representative; legal check) |
| Cities served | `listCities()` `catalog.ts:110-114` + `getCoverageMatrix()` `site-ext.ts:136-153` | FAQ 2, optional city links, `areaServed` | active city with providerCount > 0 in any category | omit the city |
| Cancellation, dispute, payout, fee, documents | `getPublicTerms()` `site-ext.ts:165-181` | 01 trust row, 04 detail, 08 payment line, 09 FAQ and trust strip | value present | omit the clause (helpers: `freeCancellationHours`, `hoursLabel`, `policyRows` in `discovery-copy.ts:81-115`; grace minutes `cancellationPolicy.graceMinutes`, `src/server/dto.ts:144`) |
| Commission strip | `getProviderTerms().commission` `src/server/services/pro-ext.ts:86-101` | 08 | `commission != null` | hide the strip. „0 % auf die Anfahrt“ is product logic (`src/server/domain/pricing.ts:11`), so it may be stated. |
| Example PLZ | `listCityPostalExamples()` `site-ext.ts:156-162` | entry placeholder | — | „10115“ (current default) |
| Product preview with a real provider | `searchProviders(…, null, { logDemand: false })`, at most one call (current `page.tsx:57-67`) | 04/07 previews (decorative) | a result with slots ≥ 2 h ahead | the preview without price and slots |

**Rules.**
- Never show a number that did not come from these functions. Missing data means the element is absent: no "0", no
  placeholder, no skeleton left behind.
- Ortszeilen (`PLACE_LINES`, `discovery-copy.ts:34-42`) are illustrative scenes, not bookings. They make no live claim.
- `CountUp` renders the final value in server HTML (`src/components/ui/motion.tsx:259-263`), so crawlers and no-JS visitors never see
  "0".
- `DEMO_MODE`: the ribbon is global (`layout.tsx:122`). The cards also need the demo label (C10).
- No "ab" price on provider cards (`showFromPrice` stays off, see the PAngV comment at `discovery-tiles.tsx:72-73`).

### 5.2 Caching and revalidation
- Keep the page static with ISR: `export const revalidate = 3600` (present, `page.tsx:48`). Cache Components are deliberately
  off (`next.config.ts:6-10`), so the route-segment `revalidate` applies (Next docs
  `caching-without-cache-components.md` § "Route segment config revalidate").
- The landing must not call `cookies()`, `headers()` or `getSession()`, and must not read `searchParams`. Any of these makes the
  route dynamic. The `(site)` layout already avoids them (`src/app/(site)/layout.tsx:5-9`). Session-dependent pieces (header account,
  rebook row) hydrate on the client. Deep links are read from `window.location` (`booking-entry.tsx:456-472`).
- Load everything in one `Promise.all`. Wrap the loaders that metadata also needs (`listCatalog`, `getPriceFloors`,
  `getPublicTerms`, `listCities`, `getCoverageMatrix`) in React `cache()` inside the page module, so `generateMetadata` and the page
  share one query each per render.
- Fail soft per section: `.catch(() => null)` on social proof (already, `page.tsx:82-85`), providers, the showcase search and the
  commission terms. A failed section disappears; the page still renders. A failed background regeneration keeps serving
  the last good page.
- On-demand freshness already exists for provider approvals, categories, services and content blocks (`admin.ts:46, 85, 95,
  188`). C8 closes the gap for terms, commission and review moderation. Otherwise data is at most 1 h old.
- The showcase search never logs demand (`logDemand: false`) and must not be repeated per section.
- Client payload: pass only the slim entry catalogue to client components (`toEntryCatalog`). Cards and lists are Server
  Components.

---

## 6. SEO plan

### 6.1 Metadata (`src/components/landing/booking/metadata.ts`, re-exported as the page's `generateMetadata`)
```ts
// Sketch, final code in L2. One OG descriptor shared with the root layout (C7).
export async function generateMetadata(): Promise<Metadata> {
  const [catalog, floors, terms] = await Promise.all([loadCatalog(), loadFloors(), loadTerms()]);
  const description = landingDescription({ live: liveCategorySlugs(catalog, floors), freeHours: freeCancellationHours(terms.cancellationPolicy) });
  return {
    title: { absolute: "SOMA – Beauty & Wellness bei dir zu Hause, im Hotel und im Büro" }, // absolute: skip the "%s · SOMA" template (layout.tsx:90-93)
    description,
    alternates: { canonical: "/" },
    openGraph: { type: "website", url: "/", siteName: BRAND_NAME, locale: "de_DE", title: `${BRAND_NAME} · ${BRAND_TAGLINE}`, description, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: `${BRAND_NAME} · ${BRAND_TAGLINE}`, description, images: [OG_IMAGE.url] },
    // No `robots` here: metadata merges shallowly, and the root layout's DEMO_MODE guard (layout.tsx:106) must win.
  };
}
```
- **Title:** from copy deck § 0.3, built with `BRAND_NAME`. About 63 characters; the brand comes first, so truncation drops only "im Büro".
- **Description:** the copy deck text, with the category words from `liveCategorySlugs` and the cancellation clause from
  `freeCancellationHours`. Both are omitted when not true. The same helper feeds the hero lead and `Organization.description`,
  so the three never disagree. The copy deck's literal „24 Std.“ must not be hard-coded (`BRAND_VOICE.md` § 8, item 8).
- **Canonical** resolves against `metadataBase = SITE_URL` (`layout.tsx:89`; `src/lib/brand.ts:17`). In production `APP_URL` must be the
  final https origin; `npm run check:launch` already blocks placeholders and `DEMO_MODE` (`scripts/check-launch.mjs:17, 25-37`).
- **OG image:** `/brand/og-default.jpg` (1200 × 630, 43 KB, the lockup plus one photograph in the arch; checked), now the shared
  `OG_IMAGE` in `src/lib/brand.ts` (C7). The spec keeps it for v1 (§ 12.1). If the brand team rebuilds it (the photo audit marks
  the v1 photo "replace", `brand/photography/AUDIT.md:49`), write it to a **new filename** so share caches refresh, and update
  `OG_IMAGE` once.
- **Twitter/X:** the current build already emits `twitter:card=summary_large_image` and the image from the OG fields (checked in
  the served HTML). Setting `twitter` explicitly keeps it deterministic. There are no handles to add.
- `og:url` is missing today; the sketch adds it.

### 6.2 Structured data
One JSON-LD graph (`<LandingJsonLd>`, via `JsonLd`, which escapes `<`, `src/components/site/discovery-json-ld.tsx:5-7`). It
also carries the `FAQPage` node, so chapter 09 must **not** use `FaqSection`, which would emit a second one:

```jsonc
{ "@context": "https://schema.org", "@graph": [
  { "@type": "Organization", "@id": "{SITE}/#organization", "name": "SOMA", "url": "{SITE}/",
    "logo": { "@type": "ImageObject", "url": "{SITE}/brand/app-icon-512.png", "width": 512, "height": 512 },
    "slogan": "Your body. Your place.", "description": "{same helper as the meta description}",
    "areaServed": [{ "@type": "City", "name": "{cities with providerCount > 0}" }] },
  { "@type": "WebSite", "@id": "{SITE}/#website", "url": "{SITE}/", "name": "SOMA", "inLanguage": "de-DE",
    "publisher": { "@id": "{SITE}/#organization" } },
  { "@type": "WebPage", "@id": "{SITE}/#webpage", "url": "{SITE}/", "name": "{title}", "description": "{description}",
    "isPartOf": { "@id": "{SITE}/#website" }, "about": { "@id": "{SITE}/#organization" }, "inLanguage": "de-DE",
    "primaryImageOfPage": { "@type": "ImageObject", "url": "{OG_IMAGE absolute}" } }
] }
```
- **Organization** replaces the current flat object (`page.tsx:100-110`). `name` and `logo` come from `BRAND_NAME` and the brand
  assets, so renaming the working title (PLAN.md decision log) is a one-file change. Add **no** `aggregateRating`: the reviews
  rate providers, not SOMA, and self-serving organisation ratings are not eligible. Add no `sameAs` (no profiles exist), and add
  `contactPoint` only when `SUPPORT_EMAIL` is real (not `*.example`).
- **WebSite without `SearchAction`.** `/suche` has no free-text query parameter (§ 1.2), is `noindex` (`suche/page.tsx:37-41`) and
  is disallowed in robots (`src/app/robots.ts:18`). Google also retired the sitelinks search box in November 2024. A
  `SearchAction` would describe a capability the site does not have.
- **FAQPage:** only from the FAQ that is visible on the page: `buildLandingFaq()` (`faq-data.ts`) feeds both the accordion and
  the graph (the pattern of `FaqSection`, `discovery-faq.tsx:43-78`). Requirements:
  - build the items once, in code, from the copy deck § 09 with the data bindings (`buildLandingFaq({ terms, liveCities, activeCategorySlugs })`). Do
    not use the `home.faq` content block, whose text cannot bind policy numbers;
  - show all nine at every width (spec § 4.9); never hide items with CSS (a `mobileLimit` like `discovery-faq.tsx:71-72` would leave
    the JSON-LD listing hidden questions, a mismatch under mobile-first indexing);
  - the answer text in the JSON-LD equals the visible text, markup removed.

  Google shows FAQ rich results only for a few authoritative sites, so expect no snippet. The markup stays because it is
  accurate and cheap.
- **Service / ItemList:** no per-category `Service` with prices or ratings on the landing; the category pages own that
  (`serviceLd`, `discovery-json-ld.tsx:38-63`). Optional (P2): `Organization.hasOfferCatalog` listing the live categories (name +
  canonical URL only, no prices), because prices on the landing are floors that change.

### 6.3 Headings, landmarks, semantics
- Exactly **one `<h1>`**: the German line „Beauty & Wellness bei dir zu Hause, im Hotel oder im Büro.“ The display line
  „Your body. Your place.“ is a `<p lang="en">` (copy deck § 01). The current H1 comes from a content block (`page.tsx:92, 112`);
  the landing replaces it.
- Each chapter is a `<section aria-labelledby>` with one `<h2>` (the visible chapter headline). Cards and steps use `<h3>`
  (category names, provider names, step titles). FAQ questions stay inside `<summary>`, without headings.
- `<nav aria-label="Kapitel">` for the chapter index (anchor links, not buttons), `<nav aria-label="Schnellzugriff">` for the dock;
  the header nav is „Hauptnavigation“ (`site-header.tsx:53`).
- All story text is real HTML. Canvases, motifs and device mockups are `aria-hidden`.
- Note: the shared footer uses `<h2>` for its five column titles (`site-footer.tsx:90`). The outline stays valid; changing it is
  optional.

### 6.4 Internal linking
- Contextual, descriptive anchors to canonical URLs: 7 categories (R5), `/behandlungen`, up to 8 profiles (R8), `/fuer-profis` and
  `/pro/registrieren`, `/hilfe`, `/stornierung`, `/ranking#bewertungen`. The cities are linked from the footer (`site-footer.tsx:34-37`);
  optionally also from FAQ 2 or chapter 05, as text links per live city.
- No tracking params on internal links. Every landing link is crawlable (`<a href>`), including the no-JS fallbacks.

### 6.5 Indexability and `DEMO_MODE`
- Production: the landing is indexable (no page-level `robots`). Robots allows `/` and disallows private and search routes
  (`robots.ts:13-21`).
- `DEMO_MODE` (the current hosted demo): the root layout emits `noindex, nofollow` (`layout.tsx:106`; checked: the served `/` has
  `<meta name="robots" content="noindex, nofollow">`). `robots.txt` disallows `/` (`robots.ts:10-11`), and the sitemap is empty
  (`src/app/sitemap.ts:17`). If the page ever needs `robots` (e.g. `googleBot: { "max-image-preview": "large" }`), it must
  re-apply the guard itself: `robots: DEMO_MODE ? { index: false, follow: false } : { index: true, follow: true, googleBot: { "max-image-preview": "large" } }`.

### 6.6 Sitemap
- `/` is already listed (priority 1, `sitemap.ts:33`); anchors are not sitemap entries; nothing to add.
- Optional (P3): `lastModified: now` on every regeneration (`sitemap.ts:24-30`) makes `lastmod` meaningless. Use a real
  change date (for example the latest provider `approved_at`) or omit it.

### 6.7 Images and alt rules
- `next/image` everywhere (AVIF/WebP and the device sizes are configured, `next.config.ts:56-60`). `sizes` matches the layout. Only the
  hero image loads eagerly with high fetch priority (C11); everything else is lazy. Never more than one preloaded LCP candidate.
- **Alt text:**
  - Editorial photographs get one German sentence describing who, what and where, in the brand's descriptive tone (examples:
    `page.tsx:116-117, 238`).
  - No "Bild von", no keyword lists, no body descriptions (`BRAND_VOICE.md` § 2, principle 5).
  - Images inside a link or card whose text already names the subject get `alt=""`: category tiles do this
    (`discovery-tiles.tsx:37`). Provider portraits currently read „Porträt von {Name}“ (`src/components/ui/avatar.tsx:99`), which
    repeats the card's name; give `Portrait` an empty alt inside cards (P3).
  - Decorative motifs, textures and device frames: `alt=""` or CSS backgrounds.
  - UI previews: `aria-hidden` with a one-line real-text summary next to them.
  - AI-generated development images carry the visible label from the photography rules; the alt text describes the content,
    not the production method.
  - No text baked into images (the OG image is the exception and has its own alt).

---

## 7. Analytics hooks (privacy-friendly, consent-free)

**Already measured, server-side, no client code:**
- `search_events`: every `/suche` search, with PLZ, city, category, service, requested date and result count, without personal data
  (`search.ts:156-163`). It is disclosed in the privacy policy (`datenschutz/page.tsx:58`) and read by the admin analytics
  (`src/server/services/analytics.ts:20, 81, 144`). Hero searches therefore show up as searches. The zero-result rate per city
  doubles as a supply signal.
- `waitlist_signups` (`search.ts:192-209`) and bookings: the downstream conversions.

**Proposed now: `data-*` attributes only, with no listeners and no network.**
- `data-chapter="01"…"10"` on each chapter `<section>`. This is the same attribute as the motion stage contract
  (REFERENCE_ANALYSIS principle 1); share it with Agent 3, do not duplicate it.
- `data-cta="<id>"` on every CTA, with stable ids:
  - `hero-search-submit`, `hero-how-it-works`, `hero-locate`;
  - `nav-termin`, `menu-termin`, `dock-termin`, `sheet-search-submit`;
  - `idea-to-services`, `category:{slug}`, `categories-all`;
  - `steps-termin`, `place-termin`, `pro-card:{slug}`, `pros-to-providers`, `reviews-provenance`;
  - `product-termin`, `providers-signup`, `providers-terms`;
  - `faq-help`, `faq-cancellation`, `final-search`, `final-providers-signup`.
- These cost nothing and let a later, approved measurement (or the auditor's scripts) address CTAs without DOM guessing.

**Not allowed without Lead and client approval:** third-party trackers, pixels, tag managers, fingerprinting, cookies or
storage for measurement. The production CSP already blocks third-party scripts and connections (`next.config.ts:22-34`), and the
privacy policy promises no analytics cookies (`datenschutz/page.tsx:82, 92`).

**Possible later (needs approval, a privacy-policy line and a legal check):** a same-origin, cookieless counter
(`navigator.sendBeacon("/api/…", { cta })`) that stores only daily aggregate counts per `data-cta`, with no IP, user agent or
identifiers. An alternative is a whitelisted `quelle` column on `search_events`, filled from the submitting surface. Do not
overload existing params: `von` on `/buchen` means "rebooked from booking id" (`buchen/page.tsx:50, 217`).

---

## 8. Acceptance tests

File `tests/e2e/landing-conversion.spec.ts` (T1–T22 as below; T12b adds the chapter-10/footer dock check). It runs in both Playwright projects, `mobile` (iPhone 13 profile on Chromium) and `desktop`
(1440 × 900) (`playwright.config.ts:29-32`), against the production build with the demo seed. Use the helpers in
`tests/e2e/helpers.ts` (`berlinDate`, `login`). Assert URLs through `URLSearchParams`, not by string order.

| # | Test | Asserts |
|---|---|---|
| T1 | Hero search with every param | Type `10115` → „Berlin“ appears. Was? → Massage → Entspannungsmassage (klassisch). Wann? → Morgen + Abends → submit. URL is `/suche` with `plz=10115`, `kategorie=massage`, `leistung=entspannungsmassage`, `datum=berlinDate(1)`, `zeit=abends`. H1 contains „in 10115 Berlin“. |
| T2 | PLZ only | `/suche?plz=10115` with no empty params. |
| T3 | Validation | Empty submit → „Bitte gib deine Postleitzahl ein.“, focus on the PLZ, `aria-invalid=true`. `1011` → „… fünfstellige …“. `00000` → „Diese Postleitzahl kennen wir nicht.“ and no navigation. |
| T4 | Unserved PLZ | `01067` → „noch nicht verfügbar“ and the inline waitlist; submit → `/suche?plz=01067` shows „In 01067 gibt es noch keine Profis auf SOMA.“ and an e-mail field. |
| T5 | No JavaScript (C1) | Context with `javaScriptEnabled: false`: fill the PLZ, press Enter → `/suche?plz=10115` renders results or the empty state. The final CTA's `href` is `/suche`. |
| T6 | Keyboard only (desktop) | Skip link → main. Tab to „Wo? Postleitzahl“, type. Tab to Was? → Enter opens the dialog „Behandlung wählen“ with focus inside. Esc closes and focus returns to Was?. Select with Enter. Tab to Wann? → choose → „Fertig“. Enter on submit → `/suche?…`. |
| T7 | Screen reader semantics | `getByRole("search", { name: "Termin finden" })`; `getByLabel("Wo? Postleitzahl")`; `aria-expanded` toggles on Was? and Wann?; the error appears inside the polite live region and is referenced by `aria-describedby`. |
| T8 | Category links | The number of tiles in `#behandlungen` equals the number of category links in the footer. Each `href` matches `^/behandlungen/[a-z0-9-]+$`, and `request.get(href)` returns 200. |
| T9 | City and provider links | Each `/staedte/*` and `/profis/*` link on the page returns 200. A card shows „★ x,y (n)“ only if n ≥ 3, and never „Neu auf SOMA“. In `DEMO_MODE` (read from `/api/health`) the cards carry „Demo-Profil · Foto KI-generiert“. |
| T10 | Provider onboarding | „Profi werden“ (chapter 08 and 10) → `/pro/registrieren`, H1 „Werde Profi auf SOMA.“. „Konditionen ansehen“ → `/fuer-profis#provision`, and the target exists. |
| T11 | Login and legal | Header or menu „Anmelden“ → `/anmelden`. Every footer legal link returns 200; `/datenschutz#cookies` and `/ranking#bewertungen` targets exist. |
| T12 | Mobile dock (mobile) | Hidden at the top. Visible after scrolling past `#termin`. Tap → dialog „Termin finden“; with no PLZ known, focus is in the PLZ field. A PLZ typed in the hero appears in the sheet. Submit from the sheet → `/suche?…`. Esc → focus back on the dock button. Hidden while an input has focus, in chapter 10 and at the footer. Its bounding box never overlaps a focused element or the footer's last link. |
| T13 | Persistent CTA (desktop) | Scroll to chapter 09, click the header „Termin finden“ → the PLZ input is focused and in the viewport. |
| T14 | Anchors | Every `a[href^="#"]` resolves to exactly one element; exactly one `#termin`. |
| T15 | FAQ JSON-LD equals the visible FAQ | Parse every `script[type="application/ld+json"]` and take the `FAQPage`. Its question names equal the `<summary>` texts in `#fragen`, in order and in number. Answers equal the visible answer text (whitespace-normalised). No FAQ item is hidden at the mobile width. |
| T16 | Metadata | `<title>` equals § 6.1. Exactly one `<h1>`. Canonical = `SITE_URL/`. `og:image` is absolute and 1200 × 630. `og:url` is present. `twitter:card` = `summary_large_image`. The description's cancellation clause matches `/stornierung`'s free tier (or is absent). |
| T17 | Indexability | With `demoMode: true`, robots meta is `noindex, nofollow`, and `/robots.txt` disallows `/`. With `demoMode: false`, there is no robots `noindex` and the sitemap lists `/`. |
| T18 | Structured data hygiene | The graph has Organization, WebSite and WebPage. There is no `SearchAction` and no `aggregateRating` on Organization. Every `areaServed` city has a `/staedte/{slug}` link with providers. |
| T19 | No invented numbers | Every tile price chip equals the „ab … €“ in the matching category's overline on `/behandlungen`. No chip is shown where the overview has none. |
| T20 | Privacy | During a full scroll and an entry interaction, every request goes to the page's origin (no third-party hosts). No storage keys other than `soma:last-plz` are written. |
| T21 | Deep links (C2) | `/?plz=10115&leistung=entspannungsmassage&datum={+2}&zeit=morgens` prefills all three fields. |
| T22 | Reduced motion | `emulateMedia({ reducedMotion: "reduce" })`: the dock appears without a transition, and T1 still passes. This joins the existing no-loop checks (`tests/e2e/audit5.spec.ts:80-101`). |

**Unit tests (`tests/unit/landing-conversion.test.ts`, Vitest):**
- `landingDescription` and `liveCategorySlugs` (words dropped when a category has no provider; the clause dropped without a
  free tier);
- `buildLandingFaq` (numbers bound to the terms; cities limited to live ones);
- the draft store (validation, URL beats draft).

**Manual, on a real device (no WebKit in the sandbox; only Chromium is installed in `/opt/pw-browsers`):**
- iOS Safari with the toolbar expanded and collapsed: the dock clears the home indicator, a tap on the dock never re-expands
  the toolbar, the sheet opens above the keyboard, and the page does not scroll behind the sheet;
- Android Chrome with gesture navigation;
- VoiceOver: the entry, the pickers and the sheet are announced correctly.

---

## 9. Coordination and open points
1. **Frontend Engineer:**
   - render `HeroBookingEntry` in 01 (pass `place` or dispatch `soma:hero-place`; set `--lp-sill-w` in `landing.css`);
   - mount `<BookingBar />` and `<BookingSheet />` once (layout or page);
   - use `openBooking` / `BookingLink` for every „Termin finden“ and „Freie Termine finden → #termin“, and `SearchLink` in 10;
   - in 06 render `Rating` only from 3 reviews, plus `AiLabel`;
   - render the 09 accordion from `loadLandingConversion().faq` without `FaqSection`, and `<LandingJsonLd>` once;
   - re-export `generateLandingMetadata` as `generateMetadata`;
   - remove the `(site)/page.tsx` home when `(landing)/page.tsx` takes `/` (two pages cannot both serve `/`).
2. **Motion developer:** the dock rules read `[data-dock-hide]` (the hero wrapper carries 0.25) and `html[data-booking-overlay]`.
   Animate the bar through `[data-booking-surface="bar"]` / `[data-closing]` if the kit `animate-rise` is not wanted. Share one
   `IntersectionObserver` for stage, dock and index.
3. **Lead:**
   - `SearchAction` stays out of the JSON-LD (§ 6.2), contrary to the spec's file-plan note; please confirm;
   - decide on optional `sessionStorage` (§ 2.3; recommendation: no) and on any later measurement (§ 7).
4. **Strategist:** sign-off for the place-hint strings „PLZ des Hotels / des Büros“ (spec § 13). `PLACE_HINT_COPY_APPROVED` in
   `hero-booking-entry.tsx` switches to the fallback (only the example PLZ changes).
5. **Legal:** the wording of any future cookieless counter (§ 7).
