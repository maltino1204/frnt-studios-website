# SOMA: Product Spec v1

*"Your wellness. Your place." · Agent 1 (Product & UX) · 30 Oct 2026 · companion doc: [`research/competitive-analysis.md`](research/competitive-analysis.md)*

Conventions:
- **(A)** marks an assumption to validate.
- **⚖** marks an item that needs review by a lawyer or tax advisor before launch.
- UI copy is German. This spec is English.

---

## 1. Goals and non-goals (v1)

### Goals

| # | Goal | v1 metric (A) |
|---|---|---|
| G1 | Home to confirmed booking in **3 screens** | Median under 90 s for returning users; checkout conversion ≥ 55% |
| G2 | Liquidity in every *live* city × category | ≥ 80% of searches show at least 3 pros with a slot within ±2 h of the requested time |
| G3 | Trust: every pro verified, every euro on-platform | 100% verified; dispute rate < 2% of bookings |
| G4 | Repeat behaviour on-platform | ≥ 35% of customers rebook within 60 days; ≥ 40% of GMV from repeat customers by month 6 |
| G5 | Fair, predictable provider economics | Payout ≤ 3 business days after completion; provider 90-day retention ≥ 70% |
| G6 | Legally clean German launch | Every ⚖ item signed off before go-live |

### Non-goals (v1)

- Native iOS/Android apps (PWA only).
- English UI. v1.1, needed for hotel guests; build all strings i18n-ready now.
- Multi-pro bookings: couples massage, groups, events. Corporate events go through an admin-handled lead form.
- Memberships and subscriptions.
- Gift cards (v1.1). Tips (v1.1). Peak or dynamic pricing.
- Product sales.
- Salon or team accounts: one provider account is one person.
- Medical or therapeutic services: Physiotherapie, Podologie, Heilpraktiker, laser/IPL/HIFU (NiSV), needling, injectables.
- Cash payments, ever.
- A map showing pros' base locations (privacy).

---

## 2. Personas

| Persona | Context → needs | Design implications |
|---|---|---|
| **Lena, 34, Berlin** (core) | Agency PM, books evening slots on her phone → speed, the same trusted pro next time | Instant booking, favourites, cadence reminders |
| **Markus, 46, hotel guest, Frankfurt** | Business trip, massage at 21:00 the same day → short notice, discretion, invoice | Lead time 1–3 h, hotel fields, company invoice; English in v1.1 |
| **Sophie, 31, office manager, Hamburg** | Team "Massage-Tag" or a single exec appointment → invoice with USt-IdNr | Office location type; team requests via lead form |
| **Aylin, 28, bride, Köln** | Wedding make-up and hair 2–3 months ahead → portfolio, trial session | Long horizon, portfolio-first profiles |
| **Ingrid, 72, Düsseldorf** (or her daughter) | Limited mobility, pedicure every 5 weeks → same person, simple flow | "Für eine andere Person buchen", recurring rebooking |
| **Mira, 29, nail tech** (pro) | Kleinunternehmerin, Instagram-built, 15 km radius → full calendar, no admin, no no-shows | Instant mode, own-client link, automatic invoices |
| **Thomas, 41, massage therapist** (pro) | Ex-spa, carries his table → fewer empty hours, safe clients, travel paid | Travel fee, buffers, customer rating, safety tools |

---

## 3. Information architecture

### Customer (public, German routes)

```
/                                   Home + booking bar (Wo / Was / Wann)
/behandlungen                       All categories
/behandlungen/[kategorie]           e.g. /behandlungen/massage
/behandlungen/[kategorie]/[stadt]   SEO page, e.g. /behandlungen/massage/berlin
/staedte/[stadt]                    City hub (all categories, districts)
/suche?plz=&leistung=&datum=&zeit=  Compare available pros
/profis/[slug]                      Profile: services, slots, reviews, portfolio
/buchen?angebot=&start=             Checkout (single page)
/buchung/[id]                       Confirmation / booking detail
/konto  → /termine /favoriten /adressen /profil /guthaben /benachrichtigungen
/anmelden  /registrieren
/fuer-profis                        Provider acquisition + earnings calculator
/impressum /datenschutz /agb /agb-profis /widerruf /stornierung /ranking /hilfe
```

Recommended additions to the fixed route list:
- `/stornierung`: the cancellation policy as a public page.
- `/ranking`: how results are ordered. Required by §5b UWG and the P2B Regulation.
- `/hilfe`: FAQ and contact.
- `/agb-profis`: provider terms.
- Later: `/gutscheine` (v1.1).

**Slugs:**
- Cities: `berlin`, `hamburg`, `muenchen`, `koeln`, `frankfurt-am-main`, `duesseldorf`.
- Categories: `massage`, `manikuere`, `pedikuere`, `kosmetik`, `make-up`, `haare-styling`, `brows-lashes`.

**Navigation:** when logged in, a bottom tab bar: *Entdecken · Termine · Favoriten · Konto*.

### Provider `/pro/*`

*Heute* (dashboard) · *Termine* · *Kalender* · *Einnahmen* · *Profil*. Leistungen & Preise, Einsatzgebiet, Verifizierung, Bewertungen and Einstellungen sit under Profil. `/pro/onboarding` is a step wizard.

### Admin `/admin/*`

Overview · Nutzer · Profis & Verifizierung · Kategorien & Leistungen · Buchungen & Konflikte · Zahlungen/Auszahlungen/Erstattungen · Provision · Regionen · Inhalte · Bewertungen.

---

## 4. Core customer journeys

### J1: Minimal booking flow (home → confirmed)

**Screen 1: `/` booking bar.** Three fields, one CTA.

| Field | UI | Rules |
|---|---|---|
| **Wo?** | Text input: "PLZ oder Adresse" with autocomplete, plus a location-icon button "Standort verwenden" | A 5-digit PLZ is enough. A PLZ outside live areas shows "Noch nicht in Ihrer Gegend" and an email waitlist, logged as demand |
| **Was?** | Bottom sheet: 7 category tiles → service list (name · duration · "ab" price) | Pre-filled when arriving from a category or SEO page |
| **Wann?** | Chips: *So bald wie möglich* (default) · *Heute* · *Morgen* · *Datum wählen*; then window chips *Morgens 7–12 · Nachmittags 12–17 · Abends 17–22* or an exact time | Horizon 60 days |
| CTA | "Verfügbare Profis anzeigen" | Values are saved in the URL query (shareable, back-button safe) |

Returning users also see a card above the bar: *"Erneut buchen: Shellac bei Anna K. – nächster Termin Do 18:30"*.

**Screen 2: `/suche`.**
- Header chips (PLZ · Leistung · Datum) can be edited in place.
- Each provider card shows: photo · display name ("Anna K.") · ★ 4,9 (87) · badges *Verifiziert* / *Sofort bestätigt* or *Auf Anfrage* · one line of specialty · **total price incl. Anfahrt** ("94 € inkl. Anfahrt") · 3–5 **slot chips** for the requested window · "Weitere Zeiten".
- **Tapping a slot chip goes straight to checkout.** Tapping the card opens the profile (optional path).
- Filter and sort open in a bottom sheet.

**Screen 3: `/buchen`** is a single scrolling page with a sticky CTA. Logged-in users see prefilled, collapsed sections.

| Section | Fields | Notes |
|---|---|---|
| Übersicht | Pro, service, date/time, duration | "Ändern" links back |
| Ort | Segmented *Zuhause · Hotel · Büro*; Straße + Nr. (autocomplete); PLZ/Ort (locked from search); type-specific fields | Zuhause: Etage, Klingelname. Hotel: Hotelname, Zimmernr., Name an der Rezeption. Büro: Firma, Empfang/Etage. All types: optional "Hinweise zur Anfahrt" (parking, lift, pets). Massage: checkbox "Platz für Massageliege (ca. 2 × 3 m)". If the geocoded address falls outside the pro's radius: block and offer alternatives |
| Kontakt (guests only) | Vorname, Nachname, E-Mail, Mobilnummer (+49) | An account is created silently and claimed via magic link. No password at checkout |
| Für Ihre Behandlung | Service-specific intake, only where configured | Massage: health notes (explicit Art. 9 consent, visible only to the booked pro). Lashes/brows: allergy-test question |
| Zahlung | Apple Pay / Google Pay / Karte (Stripe); PayPal if Stripe supports it for our account (A); Gutschein/Guthaben code (collapsed) | Saved card for returning users |
| Preis & Bedingungen | Behandlung · Anfahrt · Guthaben · **Gesamtpreis** · VAT line or §19 note · cancellation summary with **concrete deadline** · ⚖ withdrawal-consent checkbox · "SOMA vermittelt; Vertragspartner ist [Profi] (Unternehmer:in)" | See §14 |
| Sticky CTA | Instant mode: **"Zahlungspflichtig buchen · 84 €"**. Approval mode: **"Zahlungspflichtig anfragen · 84 €"** with "Belastung erst nach Bestätigung" | §312j BGB button wording ⚖ |

**Screen 4: `/buchung/[id]`.**
- Status hero: *Bestätigt*, or *Angefragt – Antwort bis 14:30*.
- Timeline; add to calendar (.ics).
- Chat (enabled after confirmation); change or cancel, with a live fee preview; preparation tips.
- Only then: the push opt-in and the PWA install prompt.

**Tap count:** a returning user with a saved address and Apple Pay needs 3 screens and about 4 taps (CTA → slot → Apple Pay → confirm).

### J2–J6: other journeys

| Journey | Flow |
|---|---|
| **J2 SEO entry** | `/behandlungen/massage/berlin` → booking bar with the category pre-filled; the customer adds a PLZ → Screen 2. Profiles carry their own booking module: service → day → slot chip → `/buchen` |
| **J3 One-tap rebook** | From *Termine › Vergangene*, a favourite, or a cadence reminder → slot sheet with the same pro, service and address → pick a slot → checkout fully prefilled. No slot within 7 days → "Ähnliche Profis" |
| **J4 Approval request** | Request sent, card authorized → pro gets push + SMS with countdown → accepted: capture, `confirmed`; declined or deadline passed: authorization voided, and the customer sees the **same slot with 3 alternative pros** to book with one tap |
| **J5 Appointment day** | Reminders at 24 h and 2 h → "Ich bin unterwegs" sends the ETA → on arrival the pro enters the customer's **4-digit Start-Code**, moving the booking to `in_progress` → *Abschließen* moves it to `completed` → review prompt (stars, 3 tags, text) + rebook suggestion |
| **J6 Problem** | "Problem melden" within 48 h of completion opens a Dispute and holds that booking's payout |

---

## 5. Search, availability and ranking

### Hard eligibility (all must be true)

1. The provider is active, verified, not paused, and holds every document the category requires.
2. They have an active offering for the service.
3. The distance from their base-PLZ centroid is ≤ their radius. Search measures to the customer's PLZ centroid; checkout uses the geocoded address.
4. They have ≥ 1 slot in the requested window. Otherwise they appear under "Weitere Termine" with their next-best day.

### Slot computation (per provider, per day)

```
windows   = weekly_hours(day) − time_off(day)
blocked   = ∪ [b.start − buffer, b.end + buffer]
            for b in bookings with status ∈ {pending_payment (hold live), requested, confirmed, in_progress}
candidate start s every 15 min (display on :00/:30 unless filtering by exact time) where
            [s, s + duration] ⊆ windows
            [s − buffer, s + duration + buffer] ∩ blocked = ∅
            s ≥ now + lead_time          (provider setting, default 3 h, min 1 h)
            s ≤ now + 60 days
            platform start-time window 07:00–22:00 (A; hotel opt-in to 23:00 in v1.1)
```

- `buffer` is a provider setting: default 30 min, range 15–60. It is applied between bookings only.
- v1.1: buffers based on routing time, and setup time per offering.

### Ranking: default "Empfohlen"

Score = weighted sum of normalised factors (A, tune with data):

| Factor | Weight | Definition |
|---|---|---|
| Time fit | 25% | Distance between the requested time and the nearest slot; "So bald wie möglich" favours the earliest slot |
| Quality | 25% | Bayesian rating: (C·m + Σ stars) / (C + n), with m = 4.6 and C = 5 |
| Reliability | 20% | Acceptance rate, median response time, provider cancellations (90 d), late starts |
| Instant bookable | 10% | Boost for *Sofort bestätigt* |
| Proximity | 10% | Shorter travel means fewer late starts and a lower fee |
| New-pro boost | 5% | Decays over the first 30 days or first 5 completed bookings (cold start) |
| Profile completeness | 5% | Photo, bio, ≥ 3 portfolio images, languages |

- **Relationship pinning:** favourites and previously booked pros appear first, in a "Ihre Profis" row.
- **Fair rotation:** near-ties (within 2%) are shuffled per session so demand spreads across pros.
- **No paid placement in v1.** Any future paid placement must be labelled "Anzeige".

**Sort options:** Empfohlen · Frühester Termin · Preis ↑ · Bewertung.
**Filters:** Sofort bestätigt · Bewertung ≥ 4,5 · Preisspanne · Sprache · Geschlecht der Fachkraft (common for massage; optional for the pro to state) · Produkte (z. B. vegan).

**Empty states:**
- Show the 3 nearest alternatives (other times, adjacent days).
- Offer "Benachrichtigen, wenn frei" (waitlist).
- Log the unmet demand to *Admin › Regionen*.

---

## 6. Service taxonomy and initial catalogue

**Model:** Category → Service (platform-defined: name, slug, default duration, price guidance, required documents, intake form, flags) → **ProviderOffering** (provider's own price and duration within ±30% of the default duration).

All bookings are **single offerings**. Combos are modelled as their own services.

**Prices:** gross, at home, in the 6 launch cities, **excluding travel fee**. These are guidance ranges only; providers set their own prices (independence, see §14). **All figures are (A)** except where a source is cited. Validate with 15–20 pro interviews per category.

| Category | Service (DE) | Duration | Range (A) | Flags |
|---|---|---|---|---|
| **Massage** | Entspannungsmassage (klassisch) | 60 / 90 min | 75–110 € / 105–150 € | Intake form; table required |
| | Aromaölmassage | 60 / 90 | 80–115 € / 110–155 € | Allergy question |
| | Hot-Stone-Massage | 90 | 115–160 € | |
| | Sportmassage | 60 | 80–120 € | Wellness wording only |
| | Schwangerschaftsmassage | 60 | 80–120 € | Specific training doc; trimester question ⚖ |
| | Rücken- & Nackenmassage | 30 / 45 | 45–70 € | Office favourite |
| **Maniküre** | Klassische Maniküre mit Lack | 45 | 35–55 € ([Selfkea](https://www.selfkea.de/blog/mobile-manikuere-zu-hause)) | |
| | Shellac-Maniküre | 60 | 45–70 € (Selfkea) | |
| | Gelnägel Neumodellage | 120 | 70–110 € (Selfkea) | Portfolio required |
| | Gelnägel Auffüllen | 90 | 55–80 € | Rebook cadence 3–4 weeks |
| **Pediküre** | Klassische Pediküre | 50 | 45–65 € (jeff: 49 € incl. travel) | |
| | Pediküre mit Shellac | 75 | 60–85 € | |
| | Wellness-Pediküre mit Fußmassage | 75 | 65–90 € | |
| | Maniküre & Pediküre | 105 | 80–120 € (jeff: 85 €) | |
| **Kosmetik** | Express-Gesichtsbehandlung | 30 | 40–60 € | |
| | Klassische Gesichtsbehandlung | 60 | 65–100 € | Hygiene attestation |
| | Feuchtigkeits- / Anti-Aging-Behandlung | 90 | 95–140 € | No medical claims |
| | Waxing Beine komplett | 45 | 40–65 € | |
| **Make-up** | Tages-Make-up | 45 | 50–80 € | |
| | Abend- & Event-Make-up | 60 | 70–120 € | |
| | Braut-Make-up Probe | 75 | 70–110 € | |
| | Braut-Make-up | 90 | 150–250 € | Approval mode recommended |
| **Haare & Styling** | Föhnen & Styling | 45 | 40–70 € | **Handwerksrolle** ⚖ |
| | Hochsteckfrisur | 60 | 70–130 € | Handwerksrolle ⚖ |
| | Damenhaarschnitt inkl. Föhnen | 60 | 55–95 € | Handwerksrolle |
| | Herrenhaarschnitt | 30 | 30–50 € | Handwerksrolle |
| **Brows & Lashes** | Augenbrauen zupfen & färben | 30 | 25–45 € | **Patch test** |
| | Brow Lamination inkl. Färben | 45 | 50–80 € | Patch test |
| | Wimpernlifting inkl. Färben | 60 | 55–90 € | Patch test |
| | Wimpernverlängerung Neuset (1:1) | 120 | 110–170 € | Certificate + portfolio |
| | Wimpernverlängerung Auffüllen | 75 | 55–85 € | Cadence 2–3 weeks |

**Excluded in v1:**
- "Medizinische Fußpflege" (a protected title for Podologen, PodG).
- Colouration and bleaching (mess and liability).
- Microneedling, laser/IPL, HIFU, chemical peels beyond cosmetic strength.
- Anything advertised as therapy.

---

## 7. Booking lifecycle

| State | Entered when | Payment (Stripe Connect) | Exit |
|---|---|---|---|
| `pending_payment` | Checkout submitted; **slot held 10 min** | Instant mode: PaymentIntent with auto-capture. Approval mode: PaymentIntent with `capture_method=manual` | Success → `confirmed` or `requested`; timeout or failure → `expired` (`reason=payment_timeout`) |
| `requested` | Approval-mode payment authorized; **the slot stays blocked** | Authorization only | Accept → `confirmed` (capture); decline → `declined` (void); deadline passes → `expired` (`reason=no_response`, void) |
| `confirmed` | Instant payment succeeded, or the request was accepted | Captured on the platform; commission **snapshotted at checkout** | Start-Code → `in_progress`; cancellation → `cancelled`; customer absent → `no_show` |
| `in_progress` | Start-Code entered (or admin override) | — | Completed → `completed`; auto-complete at end + 2 h |
| `completed` | Pro taps *Abschließen* | Transfer to the connected account **48 h after completion** if there is no dispute | Review window 14 days |
| `declined` / `expired` | See above | Authorization voided; nothing charged | Alternatives shown |
| `cancelled` | `by ∈ {customer, provider, admin, system}` plus a reason | Refund per policy (§8) | — |
| `no_show` | Customer absent ≥ 15 min after arrival, with 2 contact attempts logged | Charged under the 100% tier | Disputable within 48 h |

**Request response deadline:** the earlier of (a) 2 h, counting only 08:00–21:00 local time, after the request and (b) `start − 2 h`. This is an admin setting.

**Provider no-show:** if the pro hasn't arrived 15 min after the start time, the customer can tap *"Profi nicht erschienen"*. The result is `cancelled` with `by=provider, reason=provider_no_show`: full refund plus 15 € Guthaben (A).

**Per-booking snapshot:** offering name, price, duration, travel fee, commission rule and amount, cancellation policy version, VAT treatment, and the provider's legal identity.

**Commission (A, admin-configured):**

| Booking type | Rate |
|---|---|
| First booking of a customer–pro pair brought by SOMA | **20%** |
| Repeat booking of the same pair | **12%** |
| Client the pro brought via their personal link or QR code | **5%** |
| Travel fee | **0%** |

For reference, Selfkea takes 5% and Blys pays pros "up to 75%". **No customer service fee in v1.**

---

## 8. Cancellation, rescheduling, rebooking

**Recommended policy "SOMA Standard".** This is the single policy in v1. A "Flexibel" variant can follow in v1.1.

| Customer cancels | Fee kept |
|---|---|
| ≥ 24 h before start, or within 15 min of booking ("Bedenkzeit") | **0**, full refund |
| Request not yet accepted | 0 (nothing captured) |
| < 24 h and ≥ 2 h before | 50 % of the service price; **travel fee refunded** |
| < 2 h before, or `no_show` | 100 % of the service price + travel fee |

- **Fee basis** is the service price only; the travel fee is refunded unless the cancellation is < 2 h before the start or a no-show. SOMA's commission applies only to the kept service share; a kept travel fee goes in full to the pro. The Bedenkzeit wins over every tier, but never extends past the start time.

- **Provider cancels:** full refund, plus 10 € Guthaben if < 24 h before (A; in v1 granted by an admin as Kulanzgutschrift). The pro takes a reliability-score hit; the 3rd cancellation in 90 days triggers ranking demotion and admin review. No financial penalty in v1, so supply isn't scared away.
- **Reschedule:** free once if ≥ 24 h before, to the same pro. Instant pros: immediate. Approval pros: the original booking stays until the new time is accepted. Within 24 h it counts as cancel + rebook.
- **Waivers** (illness, emergency) are an admin action, logged with a reason. On retained fees the pro gets the kept service share minus the booking's commission, plus any kept travel fee in full.
- **Display:** always as a concrete deadline ("Kostenlos stornierbar bis Mi, 18:30 Uhr") on the slot sheet, at checkout, in the confirmation and on `/buchung/[id]`.
- ⚖ For how this interacts with the 14-day withdrawal right, see §14.

---

## 9. Provider journeys

### Onboarding wizard `/pro/onboarding` (save and resume)

1. **Konto:** email, mobile with SMS OTP, password or passkey.
2. **Kategorien & Erfahrung:** categories, years of experience, languages.
3. **Leistungen & Preise:** pick services from the catalogue; set price and duration, with the city range as guidance.
4. **Einsatzgebiet:** base PLZ, radius 3–30 km, travel fee (flat 0–30 €, optional free radius).
5. **Verfügbarkeit:** weekly hours, lead time, buffer, mode. New pros start in **Anfrage** mode; *Sofort bestätigen* unlocks after 3 completed bookings rated ≥ 4.5 (A).
6. **Profil & Portfolio:** photo, bio (≤ 400 characters, HWG-linted), ≥ 3 portfolio images for Nails, Lashes, Make-up and Hair.
7. **Verifizierung:** document uploads (table below).
8. **Auszahlung:** Stripe Connect Express (KYC, IBAN), or the simulator in development.
9. **Verträge:** provider terms (P2B), independence declaration, hygiene and conduct code.
10. **Prüfung:** admin review within 48 h, plus a 15-min video call for the launch cohort (A). Then *Freigeschaltet*.

### Verification requirements (Germany)

| Item | Who | Check | Renewal |
|---|---|---|---|
| ID document + selfie | All | Stripe Identity | — |
| Residence or work permit (non-EU) | If applicable | Manual | On expiry |
| **Gewerbeanmeldung** | All | Name and activity match | — |
| Tax data: Steuer-ID, Steuernummer or USt-IdNr, Kleinunternehmer yes/no, date of birth | All | Required for DAC7/PStTG reporting ⚖ | Yearly confirmation |
| **Berufs-/Betriebshaftpflicht** covering mobile work at customer premises, ≥ 1 Mio € (A) | All | Policy document; expiry date stored | Reminders 30 and 7 days before expiry; auto-pause on expiry |
| **Handwerksrolle entry / Handwerkskarte** (Friseurhandwerk is an Anlage A trade; home visits booked in advance count as a *stehendes Gewerbe*, not Reisegewerbe: [ERGO](https://www.ergo.de/de/rechtsportal/gewerbe/selbstaendig-als-mobiler-friseur), [HWK merkblatt](https://www.hwk-reutlingen.de/fileadmin/hwk/hwrolle_meister_dokumente/dhkt-merkblaetter_2026/merkblatt_Handwerk_und_Reisegewerbe_202510.pdf)) | Haare & Styling | Manual | — |
| Qualification certificate | Massage (training certificate), Kosmetik (Kosmetiker:in qualification), Nails and Lashes (course certificate), Schwangerschaftsmassage (specific course) | Manual | — |
| **Führungszeugnis** (Belegart N, ≤ 3 months old) | All (they work in private homes) | Viewed only; only "clean, dated" is recorded; no copy kept ⚖ (DSGVO Art. 10) | Every 3 years (A) |
| Hygiene self-declaration (state hygiene ordinances) | Kosmetik, Nails, Pedi, Lashes | Checkbox + hygiene plan upload | Yearly |

### Daily operations

- **Heute:** next appointment (address, map link, intake); open requests with countdown and **Annehmen / Ablehnen** (a decline needs a reason); weekly earnings; *Pause / Urlaub* toggle.
- **Termine:** *Anfragen · Bevorstehend · Vergangen*. Full address and full customer name appear **only once confirmed**. Actions: *Unterwegs*, *Start-Code eingeben*, *Abschließen*, *Kunde nicht angetroffen*, *Sicherheitsproblem melden*.
- **Kalender:** weekly hours, time off, bookings, iCal export (two-way sync in v1.1).
- **Einnahmen:** per booking gross, commission, travel fee and net; payouts; invoices to customers, issued automatically on the pro's behalf ⚖; DAC7 year summary.
- **Bewertungen:** one public reply per review; report a review.
- **Einstellungen:** mode, lead time, buffer, max bookings per day, notification channels.
- Today's bookings are cached for buildings with no signal.

---

## 10. Admin operations

| Module | Key functions | Ops target (A) |
|---|---|---|
| Overview | GMV, bookings by state, funnel (search → slot → checkout → confirmed), repeat, fill and take rate | Daily |
| Profis & Verifizierung | Document checklist queue; approve, reject or request more (reason templates); expiry monitor; suspend with P2B notice | ≤ 48 h |
| Kategorien & Leistungen | Category and service CRUD, required docs, intake forms, flags, price guidance, per-city on/off | — |
| Buchungen & Konflikte | Live board (stuck requests, late starts); state overrides with audit log; disputes: evidence (chat, Start-Code, timestamps, photos) → full or partial refund, credit, or reject | Response ≤ 4 h, resolution ≤ 72 h |
| Zahlungen | Charges, refunds, payout holds, failed transfers, Stripe events, dev simulator | — |
| Provision | Default and tier rates, category and city overrides, promos; versioned; bookings keep their snapshot | — |
| Regionen | PLZ heatmap of searches vs eligible pros vs bookings; unmet demand and waitlists; **live gate per city × category** (e.g. ≥ 8 active pros and ≥ 120 open slot-hours per week (A)) | Weekly |
| Inhalte · Nutzer · Bewertungen | SEO and legal copy with HWG checklist; block users; GDPR export and deletion; review moderation | — |

---

## 11. Trust, safety, anti-disintermediation

### Trust and safety

- **Badges:** *Verifiziert* (ID, Gewerbe, Haftpflicht), *Qualifikation geprüft*, *Führungszeugnis*.
- **Verified reviews only:** after a `completed` booking, within 14 days, labelled as verified (§5b(3) UWG). Pros also rate customers privately; that score feeds pro safety.
- **SOMA-Garantie** (on-platform bookings only): if the service clearly differs from what was booked, a report within 48 h gets a free redo, or a refund or credit. Damage goes through the pro's Haftpflicht, with SOMA mediating.
- **Zero tolerance for sexualised requests.** Stated in the terms and in massage checkout. Chat keyword detection and a report button lead to immediate suspension pending review.
- **Pro safety:** *Sicherheitsproblem melden*; the pro may leave and is still paid when the customer is at fault; first-time customers need a verified phone; the pro sees the customer's completed-booking count.
- **Safety intake:** massage contraindications; for lashes and brows, an allergy test is confirmed, or the pro offers a patch test ≥ 48 h ahead.

### Anti-disintermediation and retention

| Mechanic | Detail |
|---|---|
| Masked contact | No phone or email exchanged; chat opens on confirmation. Before that, numbers, emails and @handles are replaced with a notice. v1.1: phone relay |
| Address reveal | Only after confirmation; hidden again 24 h after completion |
| Cheaper repeats on-platform | Repeat commission 12% vs 20%; own-client link 5% (A) |
| Lock-in value for the pro | Guaranteed payment, enforced no-show fees, invoices and DAC7 summaries, reviews and ranking |
| Lock-in value for the customer | SOMA-Garantie, free cancellation until 24 h, stored payment, Guthaben, verified pros |
| Favourites + rebooking | Heart on cards; "Ihre Profis" row; rebooking in 3 taps |
| Cadence reminders (opt-in) | Nails 3 weeks, lashes 2.5, massage 4, pedicure 5 → one tap opens the same pro's slots |
| Referral | Customer: give 15 €, get 15 € after the friend's first completed booking ≥ 50 € (A). Pro-to-pro: 100 € after the referred pro's 5th booking (A) |
| Guthaben | Wallet for referrals, goodwill and provider-cancellation compensation; valid 3 years (A ⚖) |
| Leak signal (monitor, don't punish) | Pair with ≥ 2 bookings, then silence > 2× their cadence → admin flag. Reasonable non-circumvention clause in terms ⚖ |

---

## 12. Mobile-first interaction patterns

- **Sticky bottom CTA** in thumb reach, always showing the live total.
- **Bottom sheets** for pickers (service, date, filters, slots); the back gesture closes them.
- **Horizontal chip rows** for days and slots; ≥ 44 px targets; one-handed use.
- Address autocomplete biased to the PLZ; numeric keyboards; `autocomplete` attributes.
- Apple Pay / Google Pay first; card form only on demand.
- Skeletons, not spinners; prefetch slots for the top 5 cards.
- **PWA install prompt only after the first booking.** iOS web push works only for installed PWAs, so **SMS is the fallback** for critical events.
- Every notification deep-links to the booking.
- Provider PWA: large Accept/Decline buttons with countdown ring; "Unterwegs" in one tap.
- WCAG 2.1 AA. ⚖ Check whether the BFSG applies (micro-enterprises are exempt); build to the standard regardless.

---

## 13. Notification matrix

Channels: **E** = E-Mail · **P** = Web Push · **S** = SMS · **I** = In-App · **O** = Ops alert (admin dashboard + Slack). "—" means none.

| Event | Customer | Provider | Admin |
|---|---|---|---|
| Request created | E, I | **P, S**, E | — |
| Request 30 min before deadline | — | P, S | — |
| Confirmed (instant or accepted) | **E (+ .ics), S**, P | P, E | — |
| Declined / expired | E, S, P (with alternatives) | I | O if expired rate > 20% for this pro |
| Payment failed / slot hold expired | E | — | — |
| Reminder 24 h | E, P | P | — |
| Reminder 2 h | **S**, P | P | — |
| Pro "Unterwegs" (ETA) | **S**, P | — | — |
| Pro late > 10 min | P, S | P | O |
| Started / completed | I / E (receipt + review request) | I / P (earnings) | — |
| Cancelled by customer | E | **P, S**, E | — |
| Cancelled by provider | **E, S**, P (+ alternatives, Guthaben) | E | O |
| Cancelled by admin / system | E, S | E, S | — |
| No-show | E | E | O |
| New chat message | P (else E after 10 min) | P (else S after 10 min) | — |
| Review received | — | P, E | O if ≤ 2★ |
| Dispute opened / resolved | E | E | **O** |
| Safety report | I | I | **O (immediate)** |
| Refund issued | E | E | — |
| Payout sent | — | E | O if failed |
| Verification approved / rejected / docs expiring | — | E, P | O (queue) |
| Cadence reminder / waitlist slot free | P, E (opt-in) | — | — |

Marketing messages need a separate double opt-in (§7 UWG). Reschedules follow the "confirmed" row.

---

## 14. German market and legal notes

| Topic | Requirement (summary) | Product implication | ⚖ |
|---|---|---|---|
| **HWG / wellness claims** | No healing or relief claims for non-medical services | Lint copy and bios ("entspannend", "wohltuend", never "lindert Rückenschmerzen"). Protected titles (Physiotherapeut, Masseur und med. Bademeister, Podologe, med. Fußpflege) only for verified holders | Yes |
| **PAngV total price** | Show the Gesamtpreis incl. all components | Total incl. travel on search, profile and checkout; "ab" prices only on SEO and category pages | Yes |
| **§312j BGB button** | The final button must state the payment obligation | "Zahlungspflichtig buchen". Is "…anfragen" OK for approval mode? | Yes |
| **Withdrawal right (§§312g, 356(4), 357a BGB)** | Services booked online usually carry 14 days. Whether the §312g(2) Nr. 9 exception (leisure, fixed date) applies is unclear, so late fees may be unenforceable inside the 14 days | Widerrufsbelehrung + model form; express-request checkbox; a lawyer decides how the fee tiers fit | **Critical** |
| **Marketplace duties (§312l BGB, §5b UWG, P2B Reg., DSA Art. 30–31)** | Disclose that the pro is an Unternehmer, ranking parameters, review checks, trader identity | `/ranking`; legal identity on profiles; 30-day delisting notice. A solo pro's home address must not be published → allow a business or c/o address | Yes |
| **Kleinunternehmer (§19 UStG)** | Since 2025: ≤ 25,000 € previous year and ≤ 100,000 € current year, net ([Finanzamt BW](https://finanzamt-bw.fv-bwl.de/%2CLde/Startseite/Service/Was%2Bist%2Bdie%2Bsogenannte%2BKleinunternehmerregelung_)) | VAT flag per pro; §19 invoice note or 19% shown; SOMA's commission carries 19% | Tax |
| **Agency model (VAT)** | Selling in its own name could make SOMA liable for VAT on the full price (§3(11) UStG) | Terms make clear SOMA only *arranges* the service; invoices in the pro's name (§14(2) UStG) | **Critical (tax)** |
| **DAC7 / PStTG** | Annual report of provider income to the BZSt | Collect tax ID, date of birth, address; export | Yes |
| **Self-employment status** | Don't control pros' prices, hours, exclusivity | Pros set prices, hours and radius and can decline; ranges are guidance only | Yes |
| **Trade law** | Friseur: Handwerksrolle; Kosmetik: possibly handwerksähnlich | Category-required documents (§9) | Yes |
| **DSGVO** | Health data (Art. 9), criminal records (Art. 10), location | Explicit consent; health notes visible to the booked pro only, deleted 30 days after the appointment (A); EU hosting; DPAs; TDDDG consent; export and delete in `/konto` | Yes |
| **Impressum (§5 DDG)** | SOMA's identification | Footer link, including in `/pro` | — |
| **Gutscheine / Guthaben** | Validity vs §195 BGB | Default 3 years | Yes |

---

## 15. Voice: "Sie" for customers, "du" for pros

**Decision:** customer-facing UI and messages use **Sie**. The provider app `/pro` uses **du**. Admin is internal and neutral.

**Why:**
1. A "luxury wellness concierge" mirrors the register of premium hotels and spas, which use Sie.
2. Hotel, corporate and 50+ customers expect Sie.
3. A stranger entering a private home calls for respect and distance.
4. It differentiates SOMA from du-brands like jeff ("zu dir nach Hause").

The beauty-pro community talks to each other in du (Selfkea's provider blog addresses pros the same way), so du suits a peer-like tool.

**Rules:**
- Stay warm and short: Sie is formal, not stiff.
- No "Ihr/e Kunde/in" constructions. Use neutral nouns such as *Profi*, *Fachkraft*, *Kundschaft*.
- Gender-colon forms (*Kosmetiker:innen*) only in marketing headlines, never in UI controls.
- Keep the voice in one i18n namespace per audience so it can be switched later.

| # | Context | String |
|---|---|---|
| 1 | Home hero | „Wellness, die zu Ihnen kommt. Wo dürfen wir Sie verwöhnen?“ |
| 2 | Booking bar CTA | „Verfügbare Profis anzeigen“ |
| 3 | Unsupported PLZ | „In Ihrer Gegend sind wir noch nicht. Sollen wir Ihnen Bescheid geben, sobald es losgeht?“ |
| 4 | Result card price | „94 € inkl. Anfahrt“ |
| 5 | Cancellation line | „Kostenlos stornierbar bis Mittwoch, 18:30 Uhr.“ |
| 6 | Checkout CTA | „Zahlungspflichtig buchen · 84 €“ |
| 7 | Request pending | „Ihre Anfrage ist bei Anna. Sie antwortet bis spätestens 14:30 Uhr – belastet wird erst nach ihrer Zusage.“ |
| 8 | On the way (SMS) | „Anna ist unterwegs zu Ihnen und kommt gegen 18:25 Uhr an.“ |
| 9 | Rebook reminder | „Ihre Maniküre ist drei Wochen her. Wieder bei Anna buchen?“ |
| 10 | Pro dashboard (du) | „Neue Anfrage: Shellac-Maniküre, Do 18:30 in 10405 Berlin. Du hast noch 1 Std. 40 Min. Zeit zu antworten.“ |

---

## 16. Recommendations beyond the fixed architecture

1. **Liquidity gates:** each city × category goes live only when it meets its supply threshold, not all 6 × 7 on day one.
2. **Haare & Styling** stays behind the Handwerksrolle check and legal sign-off; if neither is ready, launch it later.
3. **Payments:** authorize at request, capture on confirmation, payout 48 h after completion; `requested` blocks the slot; `expired` carries a reason.
4. **Commission:** tiered (new, repeat, own client), 0% on travel, no customer fee.
5. **Routes and copy:** add `/ranking`, `/stornierung`, `/hilfe`, `/agb-profis`; make strings i18n-ready now; English in v1.1.
