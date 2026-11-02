# SOMA — Implementation status

> Snapshot of what exists, what was verified and what still blocks a production launch.
> Last updated at the end of the build session (see git log for the exact commit).

## 1. What was implemented

### Customer app (German, *du* since brand v1.2)
| Area | Routes | Notes |
|---|---|---|
| Home | `/` | Landing page „Durch den Bogen“ (route group `(landing)`, 7 chapters since the client's declutter of 2026-11-02): hero with place switch (Zuhause · Hotel · Büro) and the booking entry on the arch sill, Behandlungen (index ↔ preview, link to Entdecken), So funktioniert’s (with the three trust facts), Profis, Für Profis, Fragen (5 + link to /hilfe; FAQPage JSON-LD), closing seal. Chapter overlay, mobile booking dock and sheet, motion tiers full/lite/none with `prefers-reduced-motion`, works without JS (GET form to `/suche`). Spec and audits: `docs/landing/` |
| Entdecken | `/entdecken`, `/entdecken/[slug]` | „Von SOMA ausgewählt“ (admin-curated collections, editorial; a sponsored collection would show „Anzeige“), „Für dich“ (only the customer's own bookings, favourites and default address; opt-out in `/konto/profil`), „Beliebt in <Stadt>“ (order only, floors ≥ 5/≥ 3 bookings, no counts), „Neu auf SOMA“. Free slots only where the availability engine computed them. Admin: `/admin/entdecken` (audited) |
| Discovery | `/behandlungen`, `/behandlungen/[kategorie]`, `/staedte`, `/staedte/[stadt]`, `/behandlungen/[kategorie]/[stadt]` | Data-driven taxonomy (7 categories, 32 services); 42 statically generated SEO city pages with canonical URLs, BreadcrumbList/Service JSON-LD, `noindex` below the supply threshold |
| Search & compare | `/suche` | PLZ → centroid → radius match; only providers with real slots; total price incl. travel; slot chips go straight to checkout; filters, sort, waitlist for unserved areas; demand logged without PII |
| Profiles | `/profis/[slug]` | Verified badge (backed by approved documents), ratings with provider replies, services and prices, portfolio, service area, policy summary, slot picker; invite links (`?einladung=`) |
| Checkout | `/buchen` | One scrolling page: Übersicht · Ort (home/hotel/office, saved addresses) · Kontakt (inline account creation without password, or login) · Zahlung (dev "Testmodus" or Stripe Payment Element) · Preis & Bedingungen (breakdown, VAT/§ 19 note, concrete free-cancellation deadline, 15-min Bedenkzeit, § 356 consent) · CTA "Zahlungspflichtig buchen/anfragen · 84 €" |
| Booking detail | `/buchung/[id]` | Status (bestätigt / angefragt with deadline), Start-Code, timeline, .ics export, cancel with live fee preview, rebook, review composer, problem report; alternatives after decline/expiry |
| Account | `/konto`, `/konto/{termine,favoriten,adressen,profil,guthaben,benachrichtigungen}` | Upcoming/past/cancelled bookings, one-tap rebooking, favourites, addresses, profile and password, credits and referral programme, notification preferences and inbox, data export and account deletion |
| Content | `/hilfe`, `/stornierung`, `/ranking`, `/widerruf`, `/impressum`, `/datenschutz`, `/agb`, `/agb-profis` | Legal pages are structured placeholders that need legal review |
| Auth | `/anmelden`, `/registrieren`, `/passwort-vergessen` | Safe `next` redirects, rate-limited login |

### Professional app (`/pro`, *du*)
Self-registration and an 8-step onboarding wizard (profile, services and prices, service area with
live travel-fee example, weekly hours, verification documents incl. category-specific ones such as the
Meisterbrief for Haare & Styling, payout setup, review and terms acceptance). Daily tool: *Heute*
dashboard with open requests and countdowns, bookings with accept/decline, Start-Code check-in,
complete, no-show and cancel; calendar (weekly hours, time off); services and prices; service area;
profile and portfolio; verification status; earnings (pending/available/paid out, commission tier per
booking); reviews with replies; settings (instant vs request mode, lead time, buffer, VAT mode,
notifications, personal invite link). Acquisition page `/fuer-profis` with real commission terms,
earnings calculator and live demand per city.

### Admin platform (`/admin`)
KPIs and time series (GMV, net revenue, conversion, repeat rate, rating, utilisation), work queues,
provider verification (approval blocked until all required documents are approved), users (detail,
credits adjustment, GDPR export and anonymisation), categories and services CRUD, bookings and
admin cancel/refund, disputes, payments/refunds/payouts (48 h hold, batches), commission rules and
platform settings, regions (supply vs demand, zero-result searches, waitlist), review moderation,
content blocks, audit log. Every page and action is admin-only and audited.

### Marketplace engine
- **Database as the final guard:** PostgreSQL with RLS on all public tables (switched per transaction
  exactly like Supabase), a `btree_gist` exclusion constraint that makes double bookings impossible,
  triggers that reject invalid slots (weekly hours in Europe/Berlin, time off, lead time, approval) and
  invalid state transitions, and an append-only booking event log.
- **Booking states:** `pending_payment → requested | confirmed → in_progress → completed`, plus
  `declined`, `expired`, `cancelled` (customer/provider/admin/system) and `no_show`. Instant and
  approval modes; response deadlines counted within 08:00–21:00.
- **Availability** is computed from real data only (weekly hours − time off − bookings with travel buffer,
  lead time, horizon), DST-safe.
- **Pricing:** service price + distance-based travel fee; commission 20 % (new), 12 % (repeat via SOMA),
  5 % (client brought via the provider's invite link), 0 % on travel; VAT mode per provider (19 % or § 19 UStG).
- **Cancellation policy:** 15-min Bedenkzeit; free ≥ 24 h; 50 % of the service price ≥ 2 h; 100 % + travel
  < 2 h or no-show; full refund when the provider cancels.
- **Payments:** `PaymentProvider` interface with a dev simulator (clearly labelled) and a Stripe Connect
  implementation (manual capture, destination charges, application fee, webhook).
- **Anti-disintermediation:** contact details masked until confirmation, contact-data filter on bios,
  reviews and notes, lower repeat commission, Start-Code proof of service, on-platform guarantee,
  favourites and one-tap rebooking, credits and referrals.
- **Notifications:** in-app inbox plus an e-mail outbox for every booking event, respecting preferences.

### Photography v3/v4 „Tageslicht“ (client feedback 2026-11-02)
The client found the first image set dark and unprofessional (and one portrait without arms). All images in use were
regenerated to a bright daylight direction (`brand/photography/PHOTOGRAPHY.md` v3.1): 143 images v3, the 30 portraits
again as v4 with varied settings and poses, later fixes as v5/v6, every image checked at full size
(`AUDIT-v3.md`, `AUDIT-v4.md`). Mean luminance 98 → 178, near-black pixels 26 % → 2.6 %. Head-and-shoulders crops for
avatars ≤ 96 px. Every image is still an AI development asset and labelled in the product. Higgsfield credits used:
≈ 530 in total.

### Brand identity v1.2 (`brand/`)
Strategy and voice (*du* for everyone, „Profi“, „SOMA Pro“, signature line „Du bleibst. Dein Profi kommt.“, zero-tolerance
rule for sexualised requests in the product), wordmark and symbol „S im O“ with the Versatz (hand-built SVG masters, seal
below 32 px), Bone/Stone/Taupe/Oxblood/Espresso palette with a contrast table, Newsreader Display + Instrument Sans (OFL),
arch motif and signature arch pair with Ortszeile, iconography, app icons and splash screens, photography direction (AI
development images labelled as such), applications (social, ads, e-mail, gift-card concept, onboarding PDF, motion) and
the rendered brand book at `/kit/marke`. The whole app was migrated to the brand (tokens, type, copy, E2E texts).

## 2. How to run

See `README.md` → Quick start. In short: `npm install`, create the database, `npm run db:setup -- --reset`,
`DEMO_MODE=true npm run db:seed`, `npm run dev`. **Right before a demo: `npm run demo:refresh`** (reseed + maintenance;
appointment testkunde ↔ testkunde-b2b ≈ 35 min later, requests open ≥ 3 h, stamps within 08–21 h). Demo logins: `testkunde@soma.test` (customer),
`testkunde-b2b@soma.test` (provider), `testadmin@soma.test` (admin), all with password `soma-demo-2026`.

## 3. What was actually tested

| Kind | Scope | Result |
|---|---|---|
| Type check | `tsc --noEmit`, strict | clean |
| Unit tests (Vitest) | availability (incl. DST), pricing and VAT, cancellation tiers and Bedenkzeit, state machine, response deadlines, geo, ranking, content lint (health claims, contact data), redirect safety, client IP, messages | see §3.1 |
| Integration tests (Vitest + Postgres) | concurrency (parallel bookings → exactly one wins), DB trigger rejections, RLS (cross-customer reads, provider self-escalation, anon visibility, address visibility before confirmation), admin refusal incl. forged sessions, full lifecycle to review + rating aggregate + referral reward, cancellation fees, hold and request expiry, verification gate, VAT snapshot, GDPR anonymisation | see §3.1 |
| E2E (Playwright, mobile + desktop) | search → book (dev payment) → confirmation → cancel; approval mode; two-customer race; login redirects; open-redirect probes; role isolation; IDOR on booking pages and .ics; private media | see §3.1 |
| Manual/agent journeys | every customer, provider and admin workflow listed in `docs/qa/audit-*.md` | see the audit reports |
| Production build | `next build` (111 routes, 42 SEO pages prerendered) | passes |

### 3.1 Latest numbers (final integration run, 2026-11-02, after landing audit 5)
- `tsc --noEmit`: clean.
- Vitest: **266/266** passing (unit + integration against Postgres; 31 files), including Entdecken (RLS, opt-out,
  popularity floors without counts, slot-promise guard) and the image replacement/avatar chain.
- Playwright E2E against the production build: **227 passed, 21 skipped, 0 failed** (mobile + desktop, about 15 min). Skips
  are viewport-specific checks that only run in one project.
- `next build`: 124 static pages generated.
- Upgrade path checked: from the state deployed before (migrations up to 0009 + demo data) to 0010–0012 + a fresh demo
  refresh, on a database owner without superuser rights (like Supabase/Neon).

**Not tested (no credentials or sandbox limits):** Stripe Connect (keys, webhook, Payment Element),
Supabase Auth and Storage adapters, Resend e-mail delivery, SMS and web push, real photography (the image
CDN is unreachable from the build sandbox; fallbacks were tested), iOS Safari/WebKit, screen readers.

## 4. Independent quality scores

Scores come from the independent QA agent (Agent 6). It does not implement features and scores only what it
observed. Reports: `docs/qa/audit-1.md` … `docs/qa/audit-5.md`.

| Dimension | Audit 1 | Audit 2 | Audit 3 | Audit 4 | Audit 5 (Design v2) |
|---|---|---|---|---|---|
| Visual quality | 8 | 8 | 8 | 8 | **9** |
| UX & navigation | 7 | 8 | 9 | 9 | 9 |
| Mobile responsiveness | 8 | 8 | 9 | 9 | 8 |
| Accessibility | 8 | 9 | 9 | 9 | 8 |
| Functional completeness | 8 | 9 | 9 | 9 | 9 |
| Booking reliability | 9 | 9 | 9 | 9 | 9 |
| Security & permissions | 7 | 7 | 7 | 8 | **9** |
| Performance | 6 | 8 | 8 | 8 | 8 |
| Trust & conversion | 7 | 8 | 8 | 8 | 8 |
| Premium-Anmutung (High-End-Produkt) | – | – | – | – | **9** (Kunde 9 · Profi 9 · Admin 9) |

**Design v2** (client request: lighter colours, a "$100M SaaS" look, better haptics, "Bewegung und Ruhe"; brief:
`docs/design-v2-brief.md`, guideline v2: `docs/design-guideline.md`). In audit 5 every dimension is ≥ 8 and the new tenth
dimension *Premium-Anmutung* scores 9. The audit measured:
- fonts down from 331 KB to 96 KB;
- CLS 0.000, 0 hydration errors in 184 page loads;
- reduced motion fully respected;
- E2E 108/108.

**Fixed after audit 5** (verified by tests, not re-scored). All 15 findings A5-1 … A5-15 are fixed:
- dialogs stay mounted and return focus;
- 0 px overflow at 320 px; valid `dl` markup; accessible names; keyboard-scrollable rows;
- 44 px hit areas; status words as well as colours; `favicon.ico`;
- route cross-fade without a blank frame; NBSP in short dates;
- haptics only on key confirmations; aura contrast ≥ 4.7:1.

Performance (A5-9):
- HTML on `/` is down from 390 to 340 KB, `/pro` from 204 to 163 KB, `/admin` from 301 to 237 KB;
- Newsreader is no longer preloaded;
- LCP with Fast 3G and 4× CPU: `/` 2.3 s, `/pro` 2.3 s, `/admin` 2.1 s.

The `audit5.spec.ts` regressions run without `test.fail()`.

Audit 4 (before Design v2): all nine dimensions ≥ 8; the auditor's demo verdict then: ready to hand to the client, with
the caveats in `DEMO.md`.

### 4.1 Fixed after audit 4 (verified by tests, not re-scored)
| Item | Fix | Verified by |
|---|---|---|
| **A4-3** (high) uncategorised qualification counted for every category | A category requirement only counts documents filed for that category (migration `0009`, `services/pro.ts`). Offerings unlocked only by an uncategorised document wait again. *Weiteres Dokument → Qualifikationsnachweis* now asks for the category. Pro and admin document lists show it (A4-11) | integration test *"an approved qualification without a category unlocks no category"*; SQL replay of the audit repro → `is_active=false, awaiting=true` |
| **A4-2** *Leistung hinzufügen* overwrote an existing price | The dialog opens on a service not yet offered. An existing service/duration shows *„Schon in deinem Angebot“* with *Hinzufügen* disabled, and the server refuses it with `createOnly` | integration test + `tests/e2e/audit4.spec.ts` (no longer `test.fail`) |
| **A4-1** seed-mode bypass of the F2 trigger | `seed_mode()` also checks the session role (inside SECURITY DEFINER triggers `current_user` is the owner) | integration test *"an API session cannot opt into seed mode"* |
| **A4-7** evening refresh widened Selin's hours | Hours stay as they are. Outside them, the demo appointment moves to her next working start, and `demo:refresh` says when | manual run at 21:40 → *„Samstag, 31. Oktober um 09:00 Uhr“* |
| **A4-8**, **A4-10**, F14 rest | `DEMO.md`: `APP_URL` for non-default addresses, an instant-booking pro for the guest flow, where the Start-Code is, review count. Support address configurable via `NEXT_PUBLIC_SUPPORT_EMAIL` (`check:launch` blocks the placeholder) | read-through |
| **A4-4**, **A4-5**, **A4-6**, **A4-9** (copy and layout) | No lone *„Danach: …“* (*„Ab jetzt: …“*); after the start the Start-Code card says *„Code bestätigt um … Uhr“*, the pro sees *„Abschließen ab … Uhr (geplanter Beginn)“* and the button unlocks without a reload; an empty search without any supply says so and offers the waitlist; 3 tiles on `/konto/guthaben` | scripted clock checks, live screenshots at 390/1440, E2E |
| **A4-12** contact-lint bypasses | Letter-spaced text joined before matching, `AT`/`DOT` in capitals, mail hosts without TLD, comma/middle-dot domains, Skype and Discord | 11 new unit cases + 6 clean-prose cases |

Still open from audit 4 (low): F8 rest (seed chart spike on the seed day, regions total 411 vs 422), F12 (fonts 331 KB),
F15 rest (no exact-time filter), A4-12 "borderline texts to moderation".

### 4.2 Hosted demo (Netlify + Neon or Supabase)
`netlify.toml` builds with `npm run netlify:prepare && npm run build`. The prepare step refuses a missing or localhost
`DATABASE_URL`, applies migrations and reloads the demo data. Netlify-specific pieces: storage in Netlify Blobs
(`STORAGE_PROVIDER=netlify`), a scheduled function for the booking maintenance, client IP from `x-nf-client-connection-ip`,
`channel_binding` stripped from Neon URLs, and a placeholder PDF for seeded documents in demo mode. Setup steps: `DEMO.md` §5.
- **Verified here:**
  - against a fresh UTF-8 PostgreSQL 16 cluster whose owner has only CREATEROLE/CREATEDB, like Neon: setup, demo seed, Vitest 198/198 (all suites at the time), production build with `DATABASE_PREPARE=false` and E2E 108/108;
  - the prepare script's guards;
  - a Neon-style URL with `channel_binding=require`;
  - the demo placeholder PDF (admin 200, anonymous 401).
- **Supabase as the database** (with SOMA's local auth): the shim reuses Supabase's `auth` schema, `auth.users` and
  `auth.uid()/role()/jwt()` instead of creating them. It grants only missing role memberships and inserts users with an
  explicit id. `--reset` is refused for non-local hosts. Verified against a Supabase-like cluster, where Auth owns `auth.users`
  and its functions, the users table has Supabase's columns and no id default, and the app role is not the database owner:
  setup, a second deploy (idempotent), demo seed, production build and E2E 108/108. The Supabase-owned objects stayed untouched.
- **Not verifiable here** (needs a Netlify account): the Netlify runtime itself, Netlify Blobs uploads, the scheduled function, a real Neon or Supabase pooler.
  Netlify accepts about 6 MB per request, so uploads above that fail there.

### 4.3 Brand, landing page and Entdecken (independent audits)
- **Brand identity** (`brand/audit/BRAND_AUDIT_1-3.md`, ten dimensions): average 7.6 → 8.1 → **8.2**; 9 of 10 ≥ 8. Originality stays
  at **7** until the human logo tests (O1b, O4a/O4b, O7) are run with people outside the team (blocker 9).
- **Landing page** (`docs/landing/audit-1…4.md`, eleven dimensions):

  | Audit | ≥ 8 | Below 8 | Note |
  |---|---|---|---|
  | 1 | 10/11 | Performance 7 | TBT ≈ 486 ms |
  | 2 | 6/11 | Interaction, Mobile, UX, Conversion, Performance 7 | chapter jumps, dead CTA, early PLZ, sheet latency |
  | 3 | 10/11 | Performance 7 | sheet 197 ms, picker regression |
  | 4 | 8/11 | Interaction 7, Technical 6, Accessibility 6 | after the 7-chapter declutter and the new photos: a crash of the 02 index in the lite/none tiers on desktop (fixed afterwards), stale optimiser images, double hero fetch. Performance 8 (sheet 134 ms, Lighthouse mobile median 91) |

  | 5 | **11/11** | – | **Gate met.** Crash fixed in every tier (8/8 probes), 0 of 368 optimiser responses stale, one hero request per viewport, Lighthouse mobile median 91 / desktop 99, TBT 95 ms, LCP 2.36 s, sheet open 127 ms at 4× CPU. Brand 9. Open P3s: hero bytes below 1024, overlay/place switch at the 200 ms line on a 4× phone, early sheet tap 313 ms, DevTools TBT 179 ms, full-tier scroll jank, AI interim imagery |

  Audit 5 ran on the build before one later change (the login link in the mobile header, client feedback); that change
  is covered by the final E2E run below.
- **Entdecken + photography in the product** (`docs/qa/review-entdecken-photos.md`, 14 dimensions): light and mood 9,
  accessibility 9, security 8; the four required fixes (slot wording, AI labels, guest-only invite, no booking counts for
  anon) and the image defects were fixed afterwards (not re-scored).

## 5. Production blockers

`npm run check:launch` encodes the hard gates and fails while any of them remain.

| # | Blocker | What is needed |
|---|---|---|
| 1 | **Legal texts** | Lawyer-approved Impressum, Datenschutzerklärung, AGB (customers), AGB für Profis, Widerrufsbelehrung and model form, cancellation terms. Open questions flagged in the code (⚖): withdrawal right vs. cancellation fees and early-start consent (§ 356 Abs. 4 BGB), agency model and VAT, P2B ranking transparency, DSA notice-and-action for reviews, HWG wording for massage, Handwerksrolle for mobile hairdressing, BFSG |
| 2 | **Supabase** | Project; run `supabase/migrations` (not `supabase/local`); `AUTH_PROVIDER=supabase`, `STORAGE_PROVIDER=supabase`; pooled `DATABASE_URL` (transaction mode, `DATABASE_PREPARE=false`); buckets `portfolio` (public) and `documents` (private); disable the Data API for `public` or keep the strict grants; verify the Supabase adapters (not covered by tests) |
| 3 | **Stripe Connect** | Platform account and Connect settings; `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`; register `/api/webhooks/stripe`; verify the Payment Element step and Express onboarding; implement SetupIntent + off-session charge for bookings more than 6 days ahead (authorisations expire after 7 days) |
| 4 | **E-mail / SMS / push** | Resend (or Postmark) key and verified domain, German templates for every notification; SMS provider for reminders and request alerts; Web Push (VAPID) |
| 5 | **Data and imagery** | Never run the demo seed in production; replace AI-generated portraits (illustrative only) with providers' own photos and commission or license editorial photography; run `npm run images:fetch` or self-host the final set; replace the postal-code centroid dataset with a source licensed for redistribution (see `supabase/seed-data/README.md`) |
| 6 | **Operations** | Scheduler for `/api/cron/booking-maintenance` (expiry, auto-complete, reminders); monitoring and error tracking; backups; secrets management; per-environment `APP_URL`; a real support address (`NEXT_PUBLIC_SUPPORT_EMAIL`); edge rate limiting and `TRUSTED_PROXY_HOPS` matching the hosting platform |
| 7 | **Verification operations** | A real document review process and staff; optional KYC vendor; insurance checks |
| 8 | **Trademark** | „SOMA“ is a working title (client decision 2026-11-01). Clear the word mark and the figurative mark („S im O“ with the Versatz) in DE and the EU (Nice classes 35, 44 and 9/42; Vienna 27.5, 26.1/26.3 for the figure) before launch (`brand/BRAND_STRATEGY.md`, `brand/LOGO_USAGE.md`) |
| 9 | **Brand tests with people** | The logo's originality stays at 7/10 until the human tests O1b (5-second recall), O4a/O4b (genre line-up) and O7 run with ≥ 8 people outside the team (protocol and pass rules: `brand/LOGO_USAGE.md` § 2.1; fallback: 60-unit Versatz) |
| 10 | **Photography rights** | Every photo and portrait is an AI-generated development image, labelled in the product. Replace with commissioned or licensed photography and providers' own portraits (`brand/photography/PHOTOGRAPHY.md`) |

## 6. Known limitations and next steps
- Rescheduling (customers cancel and rebook today), in-app chat (masked relay), gift cards, corporate accounts.
- Server-side "instant booking unlock" rule (the UI enforces it).
- Address autocomplete and routing-based travel times; today travel is PLZ-centroid distance plus a fixed buffer.
- English UI for hotel guests (strings are German-only; the voice is kept per audience).
- Admin state override for stuck bookings.
- CSP uses `'unsafe-inline'` for scripts because SEO pages are statically rendered; move to nonces or hashes when feasible.

## 7. Assumptions
Commission levels, cancellation tiers, travel-fee defaults, price ranges and launch cities are product
assumptions from `docs/product-spec.md`. All of them are configurable in `/admin/provisionen` or as data. SOMA is a
working title (client decision 2026-11-01); renaming is isolated to `src/lib/brand.ts`, the logo masters and the manifest.
