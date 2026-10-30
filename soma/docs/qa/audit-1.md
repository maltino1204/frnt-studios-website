# SOMA — Independent QA & Conversion Audit 1

*Agent 6 (QA & Conversion) · 30 Oct 2026 · read-only audit, no product code changed*

| | |
|---|---|
| Build under test | production build `next start` on `http://localhost:3100`, `BUILD_ID WdL5w482PKe408x2n3lH5` (built 13:54 UTC) |
| Source at audit end | `HEAD 8a61fff`. Two commits landed **after** the build (VAT notes / § 19 UStG, Stripe Payment Element). They are not in the tested build; findings that they may affect are marked *(HEAD differs)* |
| Data | dev DB `soma`, demo seed. All data I created was deleted again at the end (see §12) |
| Devices | Chromium 390×844 @2x (touch) and 1440×900, plus 320/768/1024 for layout checks |
| Tools | Playwright (scripts + `@playwright/test`), axe-core 4, Lighthouse 12 (mobile, simulated throttling), psql (RLS probes), Server Action replay with `fetch` |
| Evidence | curated screenshots in `docs/qa/audit-1/*.jpg`; raw shots and probe scripts in the QA scratch dir (`…/scratchpad/qa1/`, not in the repo) |

---

## Executive summary

SOMA is a strong, coherent product. It is clearly above template level. The visual system is calm, editorial and consistent across all three surfaces. The booking engine is the strongest part. In my tests availability was always real, concurrent double bookings were impossible, every tampered price was recomputed on the server, and each state transition and cancellation tier behaved exactly as the architecture describes. Row-level security held against every direct SQL probe. Role and IDOR checks held for every page and Server Action I replayed with foreign cookies.

The gaps are concentrated in a few places:

1. **Trust integrity:** an admin can approve a provider whose required documents are all still unreviewed. That profile then shows the *Verifiziert* badge with "Was wir geprüft haben" (R1).
2. **Security:** there is an **open redirect** after login via a control character in `?next=` (R2). The per-IP login limit can be bypassed by spoofing `X-Forwarded-For` (R6). There is no CSP and no HSTS (R5).
3. **Legal surfaces:** the checkout's mandatory withdrawal-consent links to `/widerruf`, and search links to `/ranking`. **Both are 404.** Impressum, AGB and Datenschutz are labelled placeholders (R3, R12).
4. **Performance:** mobile LCP is about 5 s under Lighthouse throttling, caused by 527 KB of six preloaded web fonts (R4).
5. **Conversion:** dead ends after *declined/expired* (no alternatives) and no social proof on the home page. The provider page is persuasive but lacks proof of demand (R8, R14, R15).

None of these needs an architectural change, and most are a day of work or less.

## Scores

| # | Dimension | Score | One-line justification |
|---|---|---|---|
| 1 | Visual quality | **8** | Premium, consistent editorial system across customer, `/pro` and `/admin`; minor copy/typographic slips, very long mobile home, loading states not observable |
| 2 | UX & navigation | **7** | 3 screens / 5 interactions to a confirmed booking, good forms; but two legal links 404, no alternatives after decline/expiry, night-time response deadlines, password at guest checkout |
| 3 | Mobile responsiveness | **8** | No overflow on customer and `/pro` surfaces at 320–1440, sticky CTAs with safe area; `/fuer-profis` 4 px overflow at 320, `/admin/regionen` page overflow up to 1024 |
| 4 | Accessibility | **8** | Very few axe violations, full keyboard journey works, visible focus, reduced motion honoured; a handful of name/role issues and not-found pages without `h1` |
| 5 | Functional completeness | **8** | All engine capabilities and nearly all customer/provider/admin capabilities work; gaps: service areas, review moderation UI, GDPR self-service, admin credit/override tools |
| 6 | Booking reliability | **9** | Real availability (3 providers cross-checked), race-proof, server-side pricing, all tiers and transitions correct; no 15-min *Bedenkzeit*, fee basis differs from spec |
| 7 | Security & permissions | **7** | RLS, IDOR, role checks, CSRF, XSS escaping, private media and cookies are solid; open redirect (high), spoofable IP limit, no CSP/HSTS |
| 8 | Performance | **6** | TTFB 4–60 ms, CLS 0, TBT 80–207 ms; LCP 5.0–5.6 s (mobile, throttled) from 6 preloaded fonts (527 KB); JS 171–206 KB gz per route |
| 9 | Trust & conversion | **7** | Clear promise, booking bar above the fold, total price incl. travel and concrete free-cancellation deadline; no social proof, legal 404s/placeholders, badge integrity, thin provider proof on `/fuer-profis` |

---

## 1. Visual quality — 8/10

**What I did:** full-page screenshots of 30+ routes at 390 px and 1440 px for all three roles, plus 320 px for selected pages. I compared them with `docs/design-guideline.md`.

**Strengths (observed)**
- The guideline is applied faithfully. Primary actions are ink and ultramarine is used only as a pointer (links, focus, verified icon). The roof line marks the current step and the active tab. Surfaces are square with hairline dividers and no shadows in the flow. Newsreader is reserved for display sizes, and Instrument Sans with tabular figures carries the UI (`docs/qa/audit-1/01…07`).
- The three surfaces read as one brand. `/pro` gets the same system at higher density (greeting in Newsreader, stat tiles, accept/decline cards). `/admin` is a dense, credible ops console with tables, sparklines and *Zu erledigen* queues (`09-admin-overview-desktop.jpg`).
- The tone-on-tone fallback panels look intentional and finished. Initials portraits and *Ortszeilen* captions follow `art-direction.md` §5. The decorative text is correctly `aria-hidden` (22/22 nodes on `/`).
- Empty states follow the spec: roof line, `type-display-s` headline, one action (*Noch keine Favoriten.*, *Dieses Profil ist nicht verfügbar.*, `11-320px-…jpg`).
- Images are correctly integrated. `next/image` uses AVIF/WebP with correct `sizes` (`72px` thumbnails, `(min-width:1024px) 50vw, 100vw` hero) and `object-position` from focal points. The hero is preloaded, below-the-fold images are lazy, and alt text reads *Porträt von Selin A.*

**Findings**
- The mobile home is about 9,700 CSS px, roughly 11 screens. The dark fallback hero is about 580 px of near-black with only a faint *Schon da.* It is acceptable as a fallback, but long (`01-home-mobile-overview.jpg`).
- Copy breaks the guideline's "no exclamation marks" rule: *„Danke! Wir geben Ihnen Bescheid …“* (waitlist) and *„Danke für Ihre Bewertung!“* (`src/server/actions/booking.ts`).
- The `/pro` invite card headline uses a gender colon, *„Bring deine Stammkund:innen mit“* (`src/components/pro/invite-card.tsx:53`). The guideline allows colon forms only in marketing headlines.
- The search row meta shows a dangling separator, *„Neu auf SOMA ·“*, before the line wraps to *Sofort bestätigt* (`03-search-mobile.jpg`).
- At 320 px the checkout `dt` label hyphenates to *„Behand-lung“*. The guideline says UI labels never hyphenate (`11-320px-…jpg`).
- The double full stop in *„außerhalb des Einsatzgebiets von Hanna B..“* (`src/server/services/bookings.ts`, createBooking).
- Loading skeletons (`loading.tsx` exists on nearly every route) **could not be observed**: the server answers in under 60 ms. Not scored either way.

## 2. UX & navigation — 7/10

**Step count (home → confirmed booking), returning customer, measured by script (`taps.js`):**
1. `/`: type PLZ `10405` (Wo?), then tap **Verfügbare Profis anzeigen**
2. `/suche`: tap a **slot chip** (goes straight to checkout, as specified)
3. `/buchen`: saved default address preselected → tick the **§ 356 Abs. 4 BGB consent** → tap **Zahlungspflichtig buchen · 46,50 €**
4. `/buchung/[id]`: *Bestätigt.* with Start-Code

That is **3 screens and 5 interactions**, which meets goal G1. A guest adds about 7 fields (address and contact). When the searched PLZ does not match a saved address, *Neue Adresse* is preselected and the customer has to pick the saved address manually.

**Strengths**
- Search parameters live in the URL (shareable, back-safe). Header chips can be edited in place. The checkout keeps the slot and the address when you log in inline (`checkoutSignInAction`).
- Bottom sheets move focus inside, `Esc` closes them, and focus returns to the trigger (*Was?* sheet).
- Form errors are in German, linked through `aria-describedby`, and the page scrolls to the first invalid section. A taken slot shows an inline *„Dieser Termin wurde gerade vergeben.“* with fresh alternative times from the same provider.
- Sie/du is consistent. Customer surfaces use Sie. `/pro` uses du, and shared server messages are mapped to du in `src/components/pro/labels.ts` (`DU_MESSAGES`).

**Findings**
- **The Widerrufsbelehrung link in the mandatory consent goes to a 404** (`/widerruf`, linked in `src/components/site/checkout-form.tsx:720` and in the checkout footer, `src/app/(checkout)/layout.tsx:24`). On search, **„So sortieren wir“ goes to a 404** (`/ranking`, `src/app/(site)/suche/page.tsx:330,339`). The 404 prefetch of `/ranking?_rsc=…` also never completes, so `networkidle` never settles on `/suche` (the repo's own `scripts/screenshot.mjs` times out there).
- **There are no alternatives after *declined* or *expired*.** The decline dialog promises the provider *„bekommt passende Alternativen angezeigt“*. The customer page (`src/app/(checkout)/buchung/[id]/page.tsx`, `alternativesFor`) only searches the **identical service**. In my test (Aromaölmassage, 10115) it returned nothing, and the page then offers no link onward: a dead end (journey J4).
- **Response deadlines fall at night.** The deadline is `now + 12 h` (`computeRespondBy`, `src/server/domain/booking-state.ts:106`). Requests created in the afternoon therefore expire at *01:54* or *03:12 Uhr* (seen on `/pro` and in the DB). Spec §7 wants 2 h counted within 08:00–21:00.
- **There is no 15-minute *Bedenkzeit*.** I cancelled a short-notice booking about 60 s after booking and was charged **35,25 € (50 %)**. Spec §8 makes this free.
- **Guest checkout asks for a password** (min. 10 characters). Spec J1 says *„No password at checkout“* and uses a magic link to claim the account. That is extra friction on the conversion step.
- **The provider sees *Termin starten* three days ahead** (`/pro/termine/[id]`). The server correctly refuses until 30 minutes before the start, but the button invites an error.
- **Some messages are raw zod wording,** for example *„Zu klein: erwartet, dass number >=15 ist“* (duration) and *„… >=0 ist“* (travel fee) from `z.locales.de()` (`src/server/services/_shared.ts:10`).
- **Copy:** *„Bitte vereinbart Termine immer über SOMA“* uses the ihr-form inside a du-surface (`src/app/pro/(app)/termine/[id]/page.tsx:98`).

## 3. Mobile responsiveness — 8/10

**What I did:** measured `scrollWidth − clientWidth` and listed offending elements on 19 routes (customer, `/pro`, `/admin`) at 320, 390, 768, 1024 and 1440 px (`resp.js`). I also checked tap-target sizes.

- Customer and `/pro` routes have **no horizontal overflow at any width**.
- `/fuer-profis` at 320 px: **4 px overflow** from the *Provision · Transparent. Ohne Grundgebühr.* block.
- `/admin/regionen`: the table overflows the **page**, by 470 px at 320, 34 px at 768 and **26 px at 1024**. The guideline says admin tables scroll inside their own container with the first column fixed.
- The sticky checkout CTA and the profile booking bar use `env(safe-area-inset-bottom)` and sit in thumb reach. Chips scroll horizontally. Long German words wrap correctly (*Wimpernverlängerung*, *Berufs- bzw. Betriebshaftpflichtversicherung*).
- Small targets: the provider-name link in result rows is 22 px tall (the portrait next to it is the large target), and *Spätere Tage laden* is 18 px tall. Everything else at or below 24 px was a visually hidden native input or a skip link.

## 4. Accessibility — 8/10

**axe-core** (WCAG 2.0/2.1/2.2 A+AA + best practice) on 16 pages × 2 viewports (`axe.js`):

| Violation | Where | Note |
|---|---|---|
| `color-contrast` (serious) | `/`, `/suche`, profile, `/fuer-profis`, SEO page | **All flagged nodes are aria-hidden decorative fallback text.** WCAG 1.4.3 exempts this; not counted against the score |
| `aria-prohibited-attr` ×5 | profile, review distribution | `<dd aria-label="5 Sterne: 5">` (`src/components/site/review-list.tsx:44`) |
| `label-content-name-mismatch` | account button in the header (`.-mr-3`), `/pro` header (`.-mr-1`), demo-login buttons on `/anmelden`, profile *Termin wählen* (`h-control-s`), admin logo link | the visible text is not part of the `aria-label` (WCAG 2.5.3) |
| `heading-order` | `/pro/termine` | request card heading skips a level |
| `region` (moderate) | every page | the demo ribbon sits outside landmarks (demo only) |

Checkout (`/buchen`) and the confirmation page have **zero** non-demo violations.

**Manual checks**
- **Keyboard-only journey** `/` → `/suche` → slot chip (Enter) → `/buchen`. The skip link comes first, the tab order is logical, and the first slot chip is reached after 13 tabs. In the checkout the order runs saved address → fields → consent checkbox → **Zahlungspflichtig buchen**. Every focused element had a visible 2 px ring; the PLZ field shows its ring on the container (`13-focus-rings.jpg`).
- **Reduced motion:** with `prefers-reduced-motion: reduce`, transitions drop to 1 ms.
- Landmarks are in place, `lang="de"`, and there is one `h1` on every audited page. Exceptions: **the not-found states of `/buchung/[id]` and `/pro/termine/[id]` have only an `h2`** (*„Diese Buchung finden wir nicht.“*, *„Termin nicht gefunden.“*), and **`/anmelden` has no skip link**.
- The PLZ field's error is announced twice, because `aria-describedby` names the same message node twice (`booking-entry.tsx`).

## 5. Functional completeness — 8/10 (capability checklist)

Status comes from actually using the feature (UI or replayed Server Action), not from reading code.

| Area | Capability | Status | Evidence / gap |
|---|---|---|---|
| Customer | Browse categories | ✅ working | `/behandlungen`, `/behandlungen/[kategorie]`, SEO city pages, *Was?* sheet |
| | Discover professionals by location | ✅ working | PLZ radius search; non-launch PLZ 01067 → waitlist (row stored) |
| | Enter postal code or address | ◑ partial | PLZ works, unknown PLZ is validated; **no address autocomplete**; *Standort verwenden* not testable in the sandbox |
| | Choose a service | ✅ working | category and service filters, offering preselected on profile via `?leistung=&dauer=` |
| | Select date, time, duration | ✅ working | `datum`, time windows, duration via offering; exact-time filter not offered |
| | Compare available professionals | ✅ working | sort (Empfohlen, Frühester Termin, Preis ↑, Bewertung), filters (Sofort, ≥ 4,5, Sprache); price range, gender and products are missing |
| | View verified profiles, ratings, pricing | ◑ partial | works, but the **Verifiziert** badge can show for unreviewed providers (R1) |
| | Book | ✅ working | instant, request and guest checkout (with inline account creation) |
| | Manage upcoming/past bookings | ✅ working | `/konto/termine` tabs, detail, cancel with fee preview, .ics, dispute |
| | Save favourites | ✅ working | toggled on search, listed and removed in `/konto/favoriten` |
| | Rebook previous treatments | ✅ working | *Erneut buchen* sheet: same pro, service and address, slots → checkout |
| | Manage personal info & addresses | ◑ partial | profile, phone, password, address CRUD work; e-mail change and **GDPR export/deletion only on request** |
| Provider | Register & create profile | ✅ working | 8-step wizard `/pro/registrieren`, completed end-to-end with a QA account |
| | Submit qualifications/verification | ✅ working | category-specific documents; a fake PDF (HTML) was rejected by magic bytes |
| | Upload portfolio images | ✅ working | uploaded on `/pro/profil` (*1 von 24 Bildern*) |
| | Define services & pricing | ✅ working | price 5–1,000 € and duration enforced on the server |
| | Travel radius & service areas | ◑ partial | one base PLZ + radius 3–30 km + fee model; **no multiple or excluded areas** |
| | Manage availability | ✅ working | weekly hours (overlap/inverted windows rejected), time off (slots disappear, conflicts reported) |
| | Accept / decline requests | ✅ working | decline needs a reason (UI and server) |
| | View appointments & earnings | ✅ working | `/pro`, `/pro/termine`, `/pro/kalender`, `/pro/einnahmen` (pending / available / paid out) |
| | Manage cancellations | ✅ working | provider *Termin stornieren* with reason |
| | Track reviews | ✅ working | `/pro/bewertungen` with public reply |
| | Notification preferences | ◑ partial | E-mail/SMS/Push toggles stored; only e-mail is delivered (documented) |
| Admin | User management | ◑ partial | list, search, block; **no credit-adjustment UI** (action exists, no client), no GDPR export/delete |
| | Provider verification | ◑ partial | queue, document review, approve/reject/suspend; **approval possible with 0 approved documents** (R1) |
| | Service category management | ✅ working | category and service CRUD, live without deploy |
| | Bookings & disputes | ✅ working | detail, admin cancel (refund amount), disputes with 25/50/100 % or free refund; no generic state override |
| | Commission configuration | ✅ working | versioned rules (base / repeat / own-client), cancellation tiers editable |
| | Payments & payout status | ✅ working (not executed) | payments/refunds/payouts tabs, payout batch present; I did **not** run a batch so the seeded payouts stay intact |
| | Refunds & cancellations | ✅ working | *Erstatten* on a completed booking, admin cancel |
| | Marketplace analytics | ✅ working | GMV, net revenue, funnel, statuses, time series |
| | Geographic supply & demand | ✅ working | `/admin/regionen` (layout overflow, R11) |
| | Content management | ✅ working | content blocks (JSON editor) |
| | (spec) Review moderation | ❌ missing | `/admin/bewertungen` 404; `moderateReview` has no UI |
| Engine | Explicit states & transitions | ✅ working | all transitions exercised, see §6 |
| | Instant vs approval | ✅ working | *Zahlungspflichtig buchen* / *…anfragen*, authorisation vs capture |
| | Transparent price, travel fee, cancellation before confirmation | ◑ partial | breakdown and concrete deadline shown; **Widerruf/Ranking pages 404**; **no VAT line in the tested build** *(HEAD differs: VAT notes added)* |
| | No invented availability | ✅ working | slots match hours, time off, bookings and buffers for 3 providers |
| | Clearly labelled dev payments | ✅ working | *„Testmodus – es wird keine echte Zahlung ausgeführt“*, ribbon, Visa •••• 4242 |

## 6. Booking reliability — 9/10

**Real availability (cross-checked against the DB):** I called `loadAvailabilityAction` for 7 days and compared the result against `provider_weekly_hours`, `provider_time_off` and active `bookings` (`blocked_range`).
- **Hanna B.** (Wed–Sun 09–17, lead 180 min, 60 min): no slots today (now + 3 h > 17:00), Saturday 09:00–16:00, Mon/Tue struck out. ✔
- **Linh N.** (Tue–Sat 10–20, lead 120, buffer 30, 45 min): today 17:30–19:00. Tue 3 Nov skips 16:00–18:30 around a 17:00–18:15 booking (blocked until 18:45). Wed 4 Nov skips 15:00–17:00 around 16:00–16:45. ✔
- **Selin A.** (Mon–Sat 09–19, request mode, 60 min): every gap matches `[S, S+90)` against the blocked ranges on 31 Oct, 2, 3 and 4 Nov. ✔
- **Time off:** adding Thu 12:00–15:00 for Linh removed 11:00–14:30 (45 + 30 min buffer) and restored them after deletion. ✔

**Double booking**
- 12 truly parallel `createBookingAction` calls (6 × kundin, 6 × anna) for the same slot gave **exactly 1 winner** (174 ms). One loser got *„gerade vergeben“* (exclusion constraint) and the others got *„nicht mehr verfügbar“*.
- Parallel bookings at 13:00, 13:30 and 14:00/14:30 behaved correctly with the 30-minute buffer. 14:00 lost against the 13:00–13:45 booking (blocked until 14:15), and 14:30 won.
- Two browser contexts: customer B with an open checkout gets *„Dieser Termin wurde gerade vergeben.“* (E2E test `booking.spec.ts`).

**Crafted requests** (replayed `createBookingAction` as a customer), all rejected server-side: outside weekly hours, a day without hours, a slot ending after the window, inside the lead time, in the past, off-step (09:07), more than 60 days ahead, outside the radius (80331 for a Berlin pro), unknown PLZ, unapproved provider (Nora), another user's `addressId`, 100k-character notes.

**Price consistency:** search row *69 €* = checkout *69,00 €* = CTA *69 €*. After choosing the saved 10405 address the total became *70,50 €* (7.7 km → travel fee 8,50 €), and confirmation and DB agreed: `service 6200 + travel 850 = total 7050`, `commission 1240 (20 %)`, `payout 5810`. Sending `totalCents: 1, priceCents: 1, discountCents: 6000, commissionRate: 0` in the payload had **no effect** (DB `total_cents = 6900`).

**Cancellation tiers** (times shifted with `session_replication_role = replica` where needed):
| Case | Result |
|---|---|
| > 24 h (E2E, both projects) | *Kostenlos stornieren*, fee 0 |
| 24 h – 2 h (≈ 18 h before) | dialog *„Stornogebühr von 35,25 € (50 %)“*, DB `fee 3525 / refund 3525`, payment `captured 3525` |
| < 2 h (start + 90 min) | *„46,50 € (100 %)“*, refund 0 |
| No-show (start − 120 min) | provider *Nicht angetroffen melden* → `no_show`, fee 4650 |

**State machine** (UI as Linh/Selin, plus server replays):
- Start-Code: a wrong code shows *„Noch 4 Versuche“*. After 5 wrong codes the field is disabled, and the correct code is then refused on the server (`rate_limited`).
- Start more than 30 minutes before the start, complete before the start and no-show before start + 15 min are all refused with clear du-messages.
- *Abschließen* → payment captured, *„Deine Auszahlung von 41,46 €“* (repeat-client rate 12 %).
- Accept → confirmed; full name and phone appear only now.
- Decline without a reason is refused; with a reason the authorisation is voided.
- **Request expiry:** `respond_by` set to the past, then `POST /api/cron/booking-maintenance` → `expired / no_response`, payment `cancelled`, e-mails queued. A wrong or missing bearer token returns 401.
- **Hold expiry:** `confirmDevPayment` after the hold expired → *„Ihre Reservierung ist abgelaufen“*; cron → `expired / payment_timeout`.

**Findings**
- There is no 15-min *Bedenkzeit* (see §2). **The fee basis also differs from spec §8:** the 24–3 h tier should charge *50 % of the service, travel fee refunded*. The implementation charges 50 % of the **total including travel** (architecture §5.5) and takes commission on the retained travel share (`commission 705` of `3525`). The architecture's tiers are 24 h/2 h and the spec's are 24 h/3 h. A product and legal decision is needed (R10, R21).
- With `computeRespondBy` = `max(now, min(now+12h, start−1h))`, a request-mode provider with the minimum lead time of 60 min can receive requests whose window is about 0 min, so they expire before the provider can answer (R9).

## 7. Security & permissions — 7/10

**IDOR (pages):**
- Customer B on customer A's `/buchung/[id]`: *„Diese Buchung finden wir nicht.“*, with no address, Start-Code or price in the HTML or RSC payload.
- `/buchung/[id]/kalender` as B: 404. Anonymous visitors are redirected to login. ✔
- Provider Hanna on Selin's `/pro/termine/[id]`: *„Termin nicht gefunden.“* ✔
- `/api/media/documents/<selin>/…pdf`: anonymous 401, customer 403, other provider 403, owner and admin 200 with `no-store`, `nosniff` and a sandbox CSP. Path traversal (`..%2F`, `%2e%2e`) returns 404. ✔

**Role escalation (Server Actions replayed with foreign cookies, `sec1.js`):** 25 probes were all denied (*„Dafür fehlt die Berechtigung.“* or *„nicht gefunden“*):
- customer → `decideProvider`, `updatePlatformSetting`, `setUserBlocked`, `createPayoutBatch`, `refundPayment`, `adminCancel`, `upsertContentBlock`, `respondToRequest`, `updateProSettings`, `setWeeklyHours`;
- provider → `commissionOverride`, `decideProvider`, `toggleFavorite`;
- other provider → `respond`, `start`, `complete` and `cancel` on Selin's booking;
- other customer → `cancel`, `rebookOptions`, `devPay`, `deleteAddress` and `setDefaultAddress` on Julia's data;
- anonymous → admin and cancel actions.

Sending an action with `Origin: https://evil.example` is rejected (CSRF). ✔

**Tampering:** prices are recomputed (§6). Providers' own prices (−500, 99,999,999 ct), duration 5 min, radius 500 km and a negative travel fee are all rejected. ✔

**RLS directly in SQL** (`begin; set local role authenticated; select set_config('request.jwt.claims','{"sub":"<uuid>","role":"authenticated"}',true); …; rollback;`, script `rls.sh`, 39 probes). Every probe behaved as specified:
- A customer sees only own bookings (7/7), and 0 rows of others' bookings, payments, profiles, addresses, notifications, documents and audit log.
- `UPDATE bookings SET total_cents=1`, `UPDATE profiles SET role='admin'`, `INSERT credit_ledger`, and `INSERT reviews` for someone else's booking (and even one's own) are all *permission denied*. Favourite for another customer → RLS violation.
- A provider sees 0 rows in `bookings` and only its own rows in `provider_bookings`. A requested row has `customer_phone`, `address_line` and `customer_last_name` = NULL. The provider **cannot** update `status`, `rating_avg` or `commission_rate_override`, can update `booking_mode`, and updating another provider's bio affects 0 rows.
- A submitted provider cannot approve itself.
- `anon` sees only approved providers (28), cannot read `invite_code` or `reviews` (only the `public_reviews` view), and cannot insert `search_events`.

**XSS:** stored `<script>` and `<img onerror>` in review text, provider bio and headline, address street/details and booking notes render **escaped** on the profile, search, `/pro/termine/[id]`, `/pro/bewertungen`, `/buchung/[id]` and admin booking pages, with 0 dialogs and 0 injected nodes. ✔

**Open redirect:** **❌ vulnerable.** `/anmelden?next=/%09/evil.example`: after a successful login the action redirects to `"/\t/evil.example"`. The browser strips the TAB and navigates to `http://evil.example/` (the request was observed). `safeNext()` in `src/server/actions/_run.ts` checks only `startsWith("/")`, `!startsWith("//")` and `!startsWith("/\\")`. `//evil`, `https://…`, `/\evil` and `javascript:` were correctly kept on the origin.

**Login rate limiting:**
- 5 wrong passwords for `ben@…` → the 6th attempt, even with the correct password, gets *„Zu viele fehlgeschlagene Anmeldeversuche…“*, also with a spoofed `X-Forwarded-For`. ✔
- 20 failures from `X-Forwarded-For: 198.51.100.1` → that "IP" is blocked, but the **same client with `X-Forwarded-For: 198.51.100.2` logs in at once.** The per-IP limit is therefore ineffective against credential stuffing (`getRequestMeta()` trusts the left-most XFF, `src/server/auth/session.ts:27`).

**Session cookie:** `soma_session` is `HttpOnly; Secure; SameSite=Lax`, 30 days, rotated on login. ✔

**Security headers:** `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy` and `Permissions-Policy` are present. **There is no `Content-Security-Policy` and no `Strict-Transport-Security`** (`next.config.ts`). Authenticated pages are `private, no-store`. ✔

**Contact exposure before confirmation:** before confirmation, `/pro`, `/pro/termine` and `/pro/termine/[id]` contain neither the customer's last name, phone, street nor e-mail. Only the first name and PLZ appear. After confirmation the last name, phone and street appear; the e-mail and Start-Code never do. ✔ This matches the architecture. Note that spec §11 wants *no* phone exchange in v1 (R7).

**Anti-disintermediation leak:** a provider bio with *„Ruf mich an: 0170 1234567 oder linh@example.com, Insta @linh.nails“* is accepted and published on the profile. The HWG lint caught *„heilt“*, but there is no contact lint (R7).

**Other**
- The UI kit `/kit` is publicly reachable in production.
- The not-found states of `/buchung/[id]` and `/pro/termine/[id]` answer HTTP 200 (streamed), with `noindex`.

## 8. Performance — 6/10

**Lighthouse 12, mobile** (simulated slow 4G, 4× CPU), production build:

| Route | Perf | FCP | LCP | TBT | CLS | JS (gz) | Total |
|---|---|---|---|---|---|---|---|
| `/` | 76 | 0.97 s | **5.58 s** | 207 ms | 0 | 171 KB / 10 | 773 KB |
| `/suche?plz=10115&kategorie=massage` | 80 | 0.92 s | **5.27 s** | 79 ms | 0 | 194 KB / 17 | 816 KB |
| `/profis/selin-a-berlin` | 80 | 0.92 s | **5.12 s** | 115 ms | 0 | 182 KB / 12 | 779 KB |
| `/buchen?…` (anon) | 79 | 0.92 s | **5.57 s** | 80 ms | 0 | 206 KB / 15 | 830 KB |
| `/fuer-profis` | 81 | 0.92 s | 4.98 s | 104 ms | 0 | 183 KB / 16 | 797 KB |

- **What drives LCP:** 92 % of LCP is *render delay*, and the LCP element is text. All pages preload **6 font files = 527 KB** at high priority: Newsreader normal + italic and Instrument Sans, each in `latin` + `latin-ext`, with the `opsz` and `wdth` axes (`src/app/layout.tsx`). On the throttled link these fonts saturate bandwidth for about 4 s, and the text LCP is only final after the swap. Images do not contribute: the CDN is unreachable, so 0 KB, and they are not penalised.
- **Server:** TTFB median `/` 4 ms (static, `s-maxage=3600`), `/suche` 19–28 ms, profile 48 ms, `/buchen` 17 ms, `/konto/termine` 23 ms, `/pro` 30 ms, `/admin` 37 ms (5 runs each, max 157 ms).
- **Images:** set up correctly (AVIF/WebP, custom `deviceSizes`, `sizes` per use, hero preload, lazy below the fold).
- **Other:** about 26 KB unused JS and about 13 KB of legacy polyfills on `/`. `bf-cache` is blocked on `/suche`, profile and checkout. SEO scores 63–69 only because `DEMO_MODE` disallows crawling, which is intended.

## 9. Trust & conversion — 7/10

**Strengths**
- **The value proposition lands in a second:** *„Wellness, die zu Ihnen kommt.“* with *Zu Hause · Hotel · Büro*. The full booking bar, including the CTA, sits above the fold on a 390×844 phone (CTA bottom at about 640 px).
- **Price transparency:** the total including travel appears on search, profile (with PLZ) and checkout. The checkout breakdown is *Behandlung / Anfahrt (km) / Gesamtpreis*, with the concrete deadline *„Kostenlos stornierbar bis …“*, *„SOMA vermittelt; Vertragspartner ist …“* and the § 312j button wording with the live total.
- **Verification is explained** (*Geprüft, bevor es klingelt.*, the badge sheet *Was wir geprüft haben*, the document list on `/fuer-profis`), and only verified reviews are shown. Anti-disintermediation is stated (*„Bezahlt wird nur über SOMA“*, *„Bitte vereinbare Termine immer über SOMA“*, address only after confirmation, cheaper repeat and own-client commission).
- **`/fuer-profis`** would convince many professionals. It offers an honest earnings calculator (*Du erhältst 73,00 €*), 0 € base fee, payout 48 h after the appointment, start-code protection, no-show fees and a clear list of requirements (`10-fuer-profis-desktop.jpg`).

**Weaknesses**
- **No social proof on the home page.** There are no aggregate numbers (*105 verifizierte Bewertungen*, *28 geprüfte Profis*), no review quotes and no named guarantee. The spec's *SOMA-Garantie* (§11) is never named as such.
- **Trust leaks:** two legal links are 404 (one of them inside the payment consent), Impressum, AGB and Datenschutz are visible placeholders (*„Platzhalter – rechtliche Prüfung erforderlich“*, *[Firmenname]*), and the *Verifiziert* badge can be granted without checks (R1).
- **Liquidity looks thin in the demo:** *Massage in 10115 Berlin* shows 2 profis, one of them *Neu auf SOMA*. That is a seed issue, but the UI does not soften it, for example with *„Weitere Termine in der Nähe“* or a nearby-PLZ suggestion.
- **`/fuer-profis` leads with the lowest rate** (*5 % Provision ab · für eigene Kundschaft*) although 20 % is the normal case. It has no proof of demand (searches or waitlist per city, both available in analytics), no monthly projection and no provider voices. A professional would sign up out of curiosity rather than conviction.
- **Friction:** password at guest checkout; a mandatory consent tick on every booking (legally required, but the label is a 3-line legal sentence); new addresses are preselected when the saved address's PLZ differs from the searched one.

---

## Remediation list (prioritised)

Severity: **blocker** = must fix before launch · **high** = fix in the next iteration · **medium** · **low**.

| ID | Sev. | Dim. | Issue → expected behaviour | Where | How to verify |
|---|---|---|---|---|---|
| **R1** | blocker | 9, 7, 5 | An admin can approve a provider with all required documents unreviewed, and the public profile then shows **Verifiziert** with "Was wir geprüft haben". **Expected:** `decideProvider('approve')` refuses while any required document (`base_required_documents` + category documents) is not `approved`; if an override is kept, it needs a written reason, and the badge and copy depend on the actual document states. | `src/server/services/admin.ts` (`decideProvider`), `src/app/admin/profis/[id]/page.tsx`, badge in `src/app/(site)/profis/[slug]/_components/profile-bits.tsx`, `src/components/site/provider-row.tsx` | Register a provider, upload documents, try *Freigeben* without reviewing them → refused; integration test in `tests/integration/admin-pro.test.ts` |
| **R2** | high | 7 | **Open redirect** after login: `?next=/%09/evil.example` → `http://evil.example/`. **Expected:** `next` is accepted only if `new URL(next, APP_URL).origin === APP_URL.origin` and it contains no control characters (`/[\u0000-\u001F\u007F\\]/`); otherwise fall back to the role's home. Apply the same rule in `loginUrl()`. | `src/server/actions/_run.ts` (`safeNext`), `src/server/auth/guards.ts` (`loginUrl`) | `tests/e2e/access.spec.ts` › *control character*: remove `test.fail()` and it must pass; also add a unit test for `%09`, `%0A`, `%0D` and `/\` |
| **R3** | blocker | 2, 9 | `/widerruf` (linked in the **mandatory § 356 consent** and the checkout footer) and `/ranking` (*So sortieren wir*, required by § 5b UWG and P2B) return 404. **Expected:** both pages exist, with the Widerrufsbelehrung + model form and the ranking parameters from spec §5. | new `src/app/(site)/widerruf/page.tsx`, `src/app/(site)/ranking/page.tsx`; links in `src/components/site/checkout-form.tsx:720`, `src/app/(checkout)/layout.tsx:24`, `src/app/(site)/suche/page.tsx:330,339` | `curl -I /widerruf /ranking` → 200; a crawler or link check over all internal links finds no 404 |
| **R4** | high | 8 | Mobile LCP is 5.0–5.6 s because 6 fonts (527 KB) are preloaded. **Expected:** preload at most 2 files (Instrument Sans `latin` roman, Newsreader `latin` roman); `preload: false` for italic and `latin-ext` (served through `unicode-range`); consider static weights or dropping `opsz` if the file stays above about 60 KB. Target: LCP < 2.5 s and font transfer < 150 KB on `/`. | `src/app/layout.tsx` (`Newsreader`, `Instrument_Sans`) | Lighthouse mobile on `/`, `/suche`, profile, `/buchen`: LCP < 2.5 s, Perf ≥ 90 |
| **R5** | medium | 7 | No CSP and no HSTS. **Expected:** a strict CSP (`default-src 'self'`, `img-src 'self' data: <cdn>`, `script-src 'self' 'nonce-…'` or `'strict-dynamic'`, `frame-ancestors 'none'`, Stripe hosts when `PAYMENTS_PROVIDER=stripe`), plus `Strict-Transport-Security: max-age=63072000; includeSubDomains` in production. | `next.config.ts` (`headers()`) or `src/proxy.ts` for nonces | `curl -I /` shows both headers; the E2E suite stays green; no CSP violations in the console |
| **R6** | medium | 7 | The per-IP login limit can be bypassed by spoofing `X-Forwarded-For` (left-most value trusted). **Expected:** take the client IP from the trusted hop only (platform header such as `x-vercel-forwarded-for` or the right-most XFF entry behind a known proxy, configurable with `TRUSTED_PROXY_HOPS`); add exponential back-off per e-mail. | `src/server/auth/session.ts` (`getRequestMeta`), `src/server/auth/rate-limit.ts` | 20 failures with rotating XFF values → the 21st attempt is still limited |
| **R7** | medium | 7, 9 | Phone numbers, e-mails, @handles and URLs are accepted in the provider bio and headline (and in reviews, replies and booking notes). **Expected:** a contact lint like the HWG lint that rejects them or masks them with a notice (spec §11 "masked contact"); decide on the spec-vs-architecture conflict about showing the customer's phone after confirmation (spec: phone relay). | `src/server/domain/content-lint.ts`, `services/pro.ts` (`updateProProfile`), `services/reviews.ts`, `services/bookings.ts` (notes) | Saving a bio with `0170 1234567` is refused with a du-message; a unit test covers number, e-mail and @handle patterns |
| **R8** | medium | 2, 9 | No alternatives after *declined/expired* if no other pro offers the **identical** service, so the page is a dead end, although the decline dialog promises alternatives. **Expected:** fall back to the same **category** (same day, then the next 7 days), and always show a CTA *Andere Profis finden* linking to `/suche?plz=&kategorie=&datum=`. | `src/app/(checkout)/buchung/[id]/page.tsx` (`alternativesFor`) | Decline a request for a service only one pro offers → the page shows category alternatives or at least the CTA |
| **R9** | medium | 2, 6 | Response deadlines land at night (01:54, 03:12), and with a 60-min lead time a request's window can be about 0 min. **Expected:** implement spec §7: the earlier of 2 h counted within 08:00–21:00 Europe/Berlin and `start − 2 h`, keeping the admin setting; in request mode require `lead_time ≥ minimum response window` or do not offer slots whose window would be under 30 min. | `src/server/domain/booking-state.ts` (`computeRespondBy`), `services/pro.ts` (settings validation), `domain/availability.ts` | Unit tests: a request at 20:30 → deadline next day 09:30; a request 70 min before the start → slot not offered or deadline ≥ 30 min |
| **R10** | medium | 6, 2 | No 15-min *Bedenkzeit* (spec §8). A booking cancelled 60 s after booking was charged 50 %. **Expected:** free cancellation within 15 min of `created_at` regardless of tier, shown in checkout (*„In den ersten 15 Minuten kostenlos stornierbar“*) and in the cancel dialog. | `src/server/domain/cancellation.ts` (`computeCancellation`), policy schema in `platform_settings`, checkout copy | Unit test on `computeCancellation` (t+14 min free, t+16 min tiered); manual cancel within 15 min → fee 0 |
| **R11** | low | 3 | `/admin/regionen` table overflows the page (26 px at 1024, 470 px at 320). **Expected:** wrap it in the kit's `Table` scroll container with a fixed first column (guideline §8 tables). | `src/app/admin/regionen/page.tsx` | `scrollWidth === clientWidth` at 320/768/1024 |
| **R12** | blocker | 9 | Impressum, AGB and Datenschutz are visible placeholders (*[Firmenname]*, *[Anschrift]*); `agb-profis` and `stornierung` still need legal review (⚖). **Expected:** final, lawyer-approved texts before go-live; `DEMO_MODE` may keep the placeholders. | `src/app/(site)/impressum|agb|datenschutz|agb-profis|stornierung/page.tsx` | No `[`…`]` placeholders and no *Platzhalter* notice when `DEMO_MODE=false` (add a build-time check) |
| **R13** | medium | 4 | Accessibility fixes. **Expected:** <br>(a) review distribution: drop `aria-label` on `<dd>`; use visible text or `role="img"` on a wrapper (`src/components/site/review-list.tsx:44`); <br>(b) make `aria-label`s start with the visible text (account header button in `src/components/site/account-nav.tsx`, `/pro` header in `src/components/pro/shell.tsx`, demo-login buttons in `auth-login-form.tsx`, profile *Termin wählen* sticky button in `profile-booking.tsx`, admin logo link *Admin-Übersicht* in `src/components/admin/shell.tsx:149,153`); <br>(c) `h1` on the not-found states (`src/app/(checkout)/buchung/[id]/not-found.tsx`, `src/app/pro/(app)/termine/[id]/not-found.tsx`); <br>(d) skip link on `(auth)/layout.tsx`; <br>(e) heading order of request cards on `/pro/termine`; <br>(f) PLZ error referenced once in `booking-entry.tsx`; <br>(g) put the demo ribbon inside a landmark (`role="region" aria-label="Hinweis"`). | listed | axe on the 16 pages: 0 violations apart from the aria-hidden fallback contrast |
| **R14** | medium | 9 | No social proof on the home page. **Expected:** a proof band under the hero with real numbers from the DB (*„4,8 ★ aus 105 verifizierten Bewertungen · 28 geprüfte Profis in 6 Städten“*), 2–3 real review quotes with *Ortszeile*, and a named **SOMA-Garantie** block (spec §11: redo, refund or credit within 48 h). | `src/app/(site)/page.tsx`, `services/catalog.ts` or `reviews.ts` for aggregates | Visual review; numbers match `select count(*) from public_reviews` |
| **R15** | medium | 9 | `/fuer-profis` lacks proof of demand and leads with the 5 % own-client rate. **Expected:** lead with *„20 % nur bei neuer Kundschaft, 12 % bei Stammkundschaft, 5 % mit deinem Link“*; add a monthly projection (bookings per week × net), live demand per city (searches and waitlist from `analytics.getSupplyDemandByCity`), and 2 provider testimonials once available. | `src/app/fuer-profis/page.tsx` | Content review; demand numbers match `/admin/regionen` |
| **R16** | medium | 2, 9 | Guest checkout asks for a password (10+ characters). **Expected:** spec J1 — create the account silently, send a magic link (or "Passwort später festlegen"), and ask only for name, e-mail and mobile. | `src/components/site/checkout-form.tsx`, `src/server/actions/checkout-ext.ts`, auth adapter | Guest booking without a password field; account claimable through the link from `email_outbox` |
| **R17** | low | 1, 2 | Copy and typography fixes: no `!` (*Danke!* in `actions/booking.ts`); *„von Hanna B..“* (`services/bookings.ts`); *„Bitte vereinbart“* → *„Bitte vereinbare“* (`pro/(app)/termine/[id]/page.tsx:98`); *Stammkund:innen* → *Stammkundschaft* in UI (`components/pro/invite-card.tsx:53`); human German zod messages for min/max (`services/_shared.ts`); no hyphenation in `dt` labels (*Behand-lung*); no dangling *„·“* in the search meta line (`provider-row.tsx`). | listed | grep for `!"`, `..`, `:innen` in `src/components/pro`; visual check at 320 px |
| **R18** | low | 2 | *Termin starten* is shown days before the appointment. **Expected:** show it from `startsAt − 30 min`; before that show *„Start ab 08:30 Uhr möglich“*. | `src/components/pro/booking-actions.tsx` and the action flags in `getBookingForProvider` | Open a booking 3 days ahead: no start button |
| **R19** | low | 7 | `/kit` (UI kit) is public in production. **Expected:** `notFound()` unless `DEMO_MODE` or `NODE_ENV !== "production"`. | `src/app/kit/page.tsx` | `curl -I /kit` → 404 with `DEMO_MODE=false` |
| **R20** | medium | 5 | Admin gaps. **Expected:** review moderation page (`/admin/bewertungen`, backed by the existing `moderateReview`); credit adjustment UI (`adjustCreditsAction`); GDPR export and deletion for users; optional state override with audit for stuck bookings. | `src/app/admin/**`, `src/server/actions/admin.ts` | Each action reachable from the UI and writes `audit_log` |
| **R21** | medium | 6 | The cancellation fee basis and tiers differ between spec (24 h/3 h, 50 % of the service, travel refunded) and architecture/implementation (24 h/2 h, % of the total including travel; commission taken on retained travel). **Expected:** one decided policy, documented in both docs, with travel commission-free on retained fees too. | `docs/product-spec.md` §8, `docs/architecture.md` §5.5, `domain/cancellation.ts`, `domain/pricing.ts` (`splitRetainedFee`) | Unit tests on tier boundaries; `/stornierung` copy matches |
| **R22** | low | 5 | Search: add a price-range filter and an exact-time option (spec §5, J1); optionally gender and products. *Standort verwenden* could not be tested here. | `src/app/(site)/suche/_components/search-controls.tsx`, `services/search.ts` | Filters change the results and are kept in the URL |
| **R23** | low | — | Config and docs: `APP_URL` (`:3000`) leaks into canonical links, invite and referral links, e-mails and the dev payout redirect while the app runs on `:3100`; `docs/STATUS.md` is referenced by the README and architecture but missing. **Expected:** derive dev URLs from the request host or set `APP_URL` per environment; add `STATUS.md`. | `.env*`, `src/lib/brand.ts`, `README.md` | Canonical link matches the served origin |

**Path to ≥ 8 per dimension below 8:**
- **UX** (7 → 8+): R3, R8, R9, R10, R16, R17, R18.
- **Security** (7 → 8+): R2, R5, R6, R7, R19.
- **Performance** (6 → 8+): R4 alone should move LCP below 2.5 s; also remove the 404 prefetch (R3) and the unused JS.
- **Trust & conversion** (7 → 8+): R1, R3, R12, R14, R15, R16.

---

## 10. E2E regression suite (`tests/e2e/`)

| File | Covers |
|---|---|
| `helpers.ts` | UI login, euro parsing, Berlin dates, UI clean-up (`cancelViaUi`) |
| `booking.spec.ts` | (1) instant: search (10405, 3–9 days ahead) → slot chip → checkout (saved address preselected, *Testmodus* notice, free-cancellation line, total = search total = CTA, consent required) → dev payment → *Bestätigt.* + Start-Code + same total → listed in `/konto/termine` → *Kostenlos stornieren* → *Storniert.* <br>(2) approval mode: *Termin anfragen.*, *Zahlungspflichtig anfragen*, *Angefragt – Antwort bis …*, no Start-Code, withdrawn for free. <br>(3) two customers, same slot: the second gets *„Dieser Termin wurde gerade vergeben.“* <br>An `afterEach` cancels anything still open. |
| `access.spec.ts` | Signed-out redirects with `next` for `/konto*`, `/pro*`, `/admin*`, `/buchung/*`; `/pro/registrieren` stays public; safe `next` honoured; open-redirect probes (`//`, `https://`, `/\`, `javascript:`), plus **`/%09/` marked `test.fail()` for R2**; role isolation (customer ↛ `/admin` and `/pro`, provider ↛ `/admin` and `/konto`, admin home); IDOR on `/buchung/[id]` (+ `.ics`) and `/pro/termine/[id]` using IDs discovered at runtime; private media without a session |

Run: `E2E_BASE_URL=http://localhost:3100 npx playwright test` → **52 passed (1.6 min)**, mobile + desktop. That includes the 2 expected failures documenting R2. Once R2 is fixed, remove `test.fail()`. The suite needs the demo seed (`kundin`, `anna@kunden`, `profi`, `hanna@profis`, `admin`). Every booking it creates is cancelled through the UI. I also verified that none were left active. Type check: `npx tsc --noEmit` is clean.

## 11. Not tested / limits

- **Stripe, Supabase Auth/Storage, Resend, SMS and push:** no keys. I tested the dev payment path only. The Payment Element step added in `HEAD` is not in the tested build.
- **VAT line (§ 19 UStG / 19 %):** missing in the tested build; `HEAD` adds it but was not rebuilt. **The Lead should rebuild and re-run Lighthouse and the E2E suite.**
- Real photography (CDN unreachable): image weight and real-image LCP are not measured; the integration itself was checked.
- Geolocation (*Standort verwenden*), PWA install and offline, iOS Safari/WebKit (Chromium only), screen-reader output (axe and keyboard only), 200 % zoom.
- Loading skeletons (server too fast to observe), payout batch execution (not run, to protect seeded payouts), auto-complete after 24 h (cron ran, but no eligible booking).

## 12. Data hygiene

Everything I created was deleted at the end, and booking counts are back to the seed: requested 5 · confirmed 32 · completed 125 · cancelled 13 · no_show 1. That covered:
- 23 test bookings with their payments, events, notifications and e-mails, and 1 review;
- Linh's `completed_count` and rating (back to 4.80 / 5);
- 5 new `provider_client_links`;
- the QA provider *Quinn T.* (user, documents, uploads under `.data/uploads/*/<id>`, status events, 3 audit entries);
- the guest customer;
- the waitlist row;
- login attempts.

Linh's bio and headline, the favourites and the time off were restored through the app. **Not removed:** about 200 anonymous `search_events` rows from my searches, which have no user attribution and slightly inflate *Suchen* in `/admin` and `/admin/regionen` for 30 Oct.

Neither server was restarted. Both were up at the end of the audit (`:3100` 200, `:3000` `/api/health` ok).
