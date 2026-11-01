# SOMA: Brand Strategy

*Brand Strategist · phase B1 · 1 Nov 2026 · v1.0*
*Binding inputs: `brand/BRIEF.md`, `brand/PLAN.md`. Companions: `brand/BRAND_VOICE.md` (voice, samples), `brand/COPY_DECK_LANDING.md` (landing copy).*

The document is in English for the team; every customer- or provider-facing line is German unless it is a deliberate English brand line. German samples contain real non-breaking spaces (U+00A0) where `BRAND_VOICE.md` § 4 requires them.

**Truth rule.** Every claim below was checked against the product as built (`src/server/domain/*`, `scripts/db/lib/base-seed-data.ts`, `docs/STATUS.md`). Where the product spec describes something that is not built, this document says so. § 7.3 lists the claims we must not make yet.

---

## 0. Decisions at a glance

| Topic | Decision | Rationale (short) |
|---|---|---|
| Customer address | ***du***, lowercase, everywhere in product and marketing (exceptions in `BRAND_VOICE.md` § 1) | The client writes *du*. *du* matches the intimacy of "Your body. Your place." and the 25–55 urban core. Respect comes from the tone, not the pronoun |
| Provider address | ***du*** (unchanged) | A peer tool; the beauty trade talks in *du* |
| Word for providers | **Profi** (DE), *professional* (EN only) | It is already used in the product, the routes (`/profis`, `/fuer-profis`) and the E2E suite. It is short and works for every gender. In German, "Professionals" also means office workers, who are one of our *customer* segments |
| Provider product | **SOMA Pro** (the tool at `/pro`). The acquisition page is **SOMA für Profis** (`/fuer-profis`) | The route, the existing "Pro" marker and the word *Profi* all point to it. It is short and works in English |
| Admin | **SOMA Admin**: internal, no brand expression | Not customer-facing |
| Generic noun | **Behandlung** in all German copy; "treatment" only inside English lines | Routes, SEO and the product use *Behandlung*. Mixing "Treatment" into German sentences is the forced vocabulary the brief rules out |
| Primary tagline | **Your body. Your place.** Always English, never translated | A literal German version ("Dein Körper. Dein Ort.") sounds clinical and echoes body-autonomy protest slogans |
| Descriptor | EN **Beauty & Wellness, wherever you are.** in brand lockups. DE **Beauty & Wellness. Bei dir.** in product, SEO and app contexts | German is the product language; the descriptor must explain at a glance |
| German signature line | **Du bleibst. Dein Profi kommt.** | Explains the model in five words, is true to the agency model (the Profi comes, not SOMA), and is ownable |
| Retired | "Your wellness. Your place." · "Schon da." · "Wellness, die zu Ihnen kommt." · "Wo dürfen wir Sie verwöhnen?" | Replaced by the new tagline system. "Schon da." implies an availability we cannot guarantee. "verwöhnen" is a spa cliché |
| Kept from Design v2 | The **Ortszeile** (place line): *Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10* | It is verbal, not visual. It *is* "Your place" in one line, and it is already ours |

---

## 1. Brand core

### 1.1 Essence
**Personal care, on your terms.** (internal; client's wording, kept)

"On your terms" has a concrete meaning that the product delivers today: **your place** (home, hotel or office), **your time** (a morning, afternoon or evening window, or an exact slot), **your person** (you choose the Profi, not a dispatcher), and **your conditions known in advance** (total price including travel, and a dated free-cancellation deadline).

### 1.2 Purpose
> We bring professional beauty and wellness into everyday life, where it fits, and give independent professionals the infrastructure to run their own business.

German, for internal decks: *Professionelle Beauty- und Wellness-Behandlungen dorthin bringen, wo das Leben stattfindet – und selbstständigen Profis die Infrastruktur für ein eigenes Geschäft geben.*

### 1.3 Positioning statement
> **For** urban, design-conscious adults (about 25–55) who value their time and their privacy,
> **SOMA is** the beauty and wellness marketplace that brings verified, independent professionals to their home, hotel or office,
> **because** they know before booking who is coming, what it costs in total and until when they can cancel for free.
> **Unlike** booking utilities and salon directories, SOMA combines the discretion of good hospitality, the competence of contemporary beauty and the ease of modern technology, so care adapts to life, not the other way round.

**On "concierge".** The brief positions SOMA as a "concierge powered by technology". Keep the word internal. SOMA has no human concierge, no matching service and no 24/7 desk; customers book themselves and support runs by e-mail. In customer copy, "Concierge" would promise a service that does not exist. The *feeling* of a concierge comes from the product doing the work: verification, total price, held slot, card reserved rather than charged, and a dated cancellation deadline.

### 1.4 The three worlds

| World | SOMA takes | SOMA leaves behind | Where it shows |
|---|---|---|---|
| **Luxury hospitality** | Discretion, preparation, punctuality, attention to detail, the etiquette of entering someone's room | Servility ("verwöhnen", "Ihr Wunsch ist uns Befehl"), gold-and-marble luxury, stiffness, butler clichés | Place-specific booking fields (Etage, Klingelname, Zimmernr., Name an der Rezeption, Empfang); the address is shown only to the booked Profi and only after confirmation; preparation notes per category |
| **Contemporary beauty & wellness** | Competence, craft and material (hands, skin, texture, light), confidence, personal routine | Spa clichés (stones, orchids, towels, water drops), healing promises, esotericism, beauty pressure, heavy retouching | Category language that names technique and duration; HWG-safe wording; real portfolios; rebooking rhythm (nails every 3 weeks, lashes every 2–3) |
| **Modern consumer tech** | A three-screen flow, transparent state, real availability, mobile-first, reliability | SaaS look, gradients, gamification, false urgency, "on-demand" gig language, jargon | Real free slots only; total price including travel; held slot (10 min); instant or request mode with a stated deadline; Start-Code; one-tap rebooking |

**The centre, where all three overlap: "considered convenience".** Convenience that has been thought through: it is fast, but never at the expense of privacy, precision or the professional's dignity.

### 1.5 Brand promise

- **External (DE):** *Geprüfte Profis kommen zu dir. Und du weißt vorher, wer kommt, was es kostet und bis wann du kostenlos absagen kannst.*
- **External (EN):** *Verified professionals come to you, and you know beforehand who is coming, what it costs and until when you can cancel for free.*
- **Internal shorthand:** *Vorher klar.* (Clear before the doorbell rings.)

Every part of the promise is built today:

| Part of the promise | How the product keeps it today |
|---|---|
| *Geprüfte Profis* | Approval is blocked until ID, Gewerbeanmeldung and Berufshaftpflicht are approved, plus a category qualification where the category requires one (all except Make-up). Profiles are paused automatically when a required document expires |
| *kommen zu dir* | Zuhause, Hotel and Büro are separate location types with their own fields at checkout |
| *wer kommt* | The profile shows portfolio, services and ratings. Only customers with a completed booking can leave a review |
| *was es kostet* | Search, profile and checkout show the total price including travel. The customer service fee is set to 0 |
| *bis wann kostenlos* | A concrete date and time ("Kostenlos stornierbar bis …"), plus a 15-min Bedenkzeit after booking |

---

## 2. Audiences

### 2.1 Segments

| Segment | Who | What they book | Brand job | Truth flags |
|---|---|---|---|---|
| **Primary: urban core** | Design-conscious adults, about 25–55, in the 6 launch cities | Routine (nails, lashes, massage) and occasion (make-up, hair) | Make the routine effortless and the stranger at the door trustworthy | — |
| **Secondary: busy professionals** | Long days, booked calendars | Evening massage, nails before a trip, *Rücken- & Nackenmassage* at the office | Give back time; make the office booking feel discreet | No company invoices or corporate accounts yet (`STATUS.md` § 6) |
| **Secondary: travellers and hotel guests** | Business travel, mainly Frankfurt, Munich and Hamburg | Massage in the room, styling before an event | The hotel room becomes "your place" | The UI is German only (English is v1.1). Late slots depend on each Profi's hours |
| **Secondary: recurring customers** | Lena-type routine | Same Profi, same address, every few weeks | *Erneut buchen*, favourites, "Ihre Profis" | Cadence reminders are spec only, not built |
| **Secondary: couples** | Partners booking together | Parallel massages | — | **Not supported.** Multi-Profi bookings are a v1 non-goal. Do not market couples' massage |
| **Future: gift-givers** | Birthdays, Christmas | Vouchers | — | **Gift cards are v1.1, not built** |
| **Supply** | Independent beauty and wellness professionals with a registered trade | — | More bookings, less admin, payment certainty, independence | No income claims, ever |

### 2.2 Personas (compact)

**Lena, 34 · agency project lead · Berlin-Prenzlauer Berg** (core)
- **Job:** "When my week is full, I want to keep my routine (nails every three weeks, a massage a month) without losing an evening to getting there."
- **Barriers:** a stranger in her flat; price surprises at checkout; unconfirmed bookings.
- **Triggers:** nails grown out; Friday after a heavy week; an event tomorrow.
- **SOMA's true answer:** verified profiles with reviews from real appointments; the total price including travel in search; *Sofort bestätigt* where the Profi offers it; favourites and *Erneut buchen*.
- **Line that lands:** *Nach der Massage: schon zu Hause.*

**Markus, 46 · consultant on the road · hotel in Frankfurt** (traveller)
- **Job:** "After a long day, I want a massage in my room without planning around the spa's opening hours."
- **Barriers:** discretion; will they find my room; late hours; German-only UI.
- **Triggers:** checking in in the evening; the second night of a trip.
- **SOMA's true answer:** the Hotel location type with hotel name, room number and name at reception; the address goes only to the booked Profi, after confirmation; the Start-Code makes sure the right person is at the door.
- **Line that lands:** *Zimmer 614, 21:10 Uhr.*

**Aylin, 28 · bride-to-be · Köln** (occasion)
- **Job:** "On my wedding morning, I want the artist I did my trial with to arrive at the hotel on time."
- **Barriers:** judging skill from photos; reliability on the day.
- **Triggers:** engagement; a fixed date; a trial session.
- **SOMA's true answer:** portfolios on profiles; *Braut-Make-up Probe* as a separate service; request mode, so the artist confirms personally.
- **Truth flags:** the booking horizon is 60 days; card authorisations for bookings more than 6 days ahead are a known payment gap (`STATUS.md` blocker 3).

**Mira, 29 · nail artist, Kleinunternehmerin · Berlin** (supply)
- **Job:** "I want a full calendar with clients who pay and show up, without admin, and without handing over my regulars."
- **Barriers:** commission; losing control over prices; losing her own clients; no-shows; safety in strangers' homes.
- **Triggers:** a no-show; an empty Tuesday; DMs piling up.
- **SOMA's true answer:**
  - she sets her own prices, radius, hours and buffer, and can decline requests;
  - payment runs through SOMA, never cash; cancellation fees of 50 % and 100 % apply;
  - her own clients pay 5 % commission via her invite link;
  - the Start-Code proves she was there;
  - she sees how many SOMA appointments a customer has completed.
- **Line that lands:** *Dein Können. Deine Preise. Deine Zeiten.*

**Thomas, 41 · massage professional, ex-spa · Hamburg** (supply)
- **Job:** "I want fewer empty hours, and I want the journey paid."
- **Barriers:** unpaid travel; waiting for money; inappropriate requests.
- **Triggers:** reduced spa hours; quiet weekdays.
- **SOMA's true answer:**
  - the travel fee goes 100 % to the Profi, with 0 % commission on it;
  - buffers between bookings;
  - his share is available 48 h after the appointment;
  - the customer's address is visible only after confirmation.
- **Gap to close:** a written zero-tolerance rule for sexualised requests is in the spec (§ 11) but not yet in the UI or terms. Recommended copy is in `BRAND_VOICE.md` § 7.9.

---

## 3. Competitive differentiation

The sources are `docs/research/competitive-analysis.md` (snippet-based, as stated there). We do not name competitors in marketing (§ 6 UWG comparative advertising) and never disparage them.

### 3.1 Map A: facts (price model × who chooses the professional)

```
                         All-in price, no customer fees on top
                                          ▲
              jeff ●                      │                      ◆ SOMA
   (staff model, all-in incl. travel,     │      (independent Profis, 7 categories,
    foot care + mani/pedi, NRW)           │       total incl. travel, no service fee,
                                          │       free cancellation ≥ 24 h included)
  Assigned / staffed ◄────────────────────┼────────────────────► You choose an independent pro
                                          │
               Blys ●                     │                      ● Selfkea
   (matching or choice, 10 % platform     │      (request-only, optional "Flex" ~4 %
    fee, peak and hotel surcharges)       │       for free cancellation, payment-method fee)
                                          ▼
                              Fees and add-ons on top
```
Welladom (a salon directory; fees not verified) and EveryWayz (not verified) are not placed.

### 3.2 Map B: brand territory (inferred from competitors' own positioning lines; their design was not assessed)

```
                         Lifestyle brand (editorial, design-led)
                                          ▲
                                          │                      ◆ SOMA (target)
                                          │
  Specialist (one or two categories) ◄────┼────► Full beauty & wellness range
                                          │
     Blys ● ("fastest … way to book       │      ● Selfkea ("Mobile Massage, Maniküre,
       a massage")                        │        Fußpflege & mehr")
     jeff ● (foot care, care-adjacent)    │      ● Welladom (salon directory)
                                          ▼
                          Booking utility (functional, price-led)
```

### 3.3 What SOMA owns

1. **Place as the experience, not a delivery address.** Home, hotel and office are designed flows with their own fields, preparation notes and discretion rules. The Ortszeile makes this visible in every brand asset.
2. **Clarity before booking.**
   - The total price including travel in search.
   - No service fee.
   - Free cancellation until 24 h before, included rather than sold as an add-on.
   - A dated deadline.
   - A 15-min Bedenkzeit.
   - The card is reserved at booking and charged after the appointment.
3. **Verification you can name.** ID, Gewerbe, Berufshaftpflicht, a category qualification, and for Haare & Styling a Meisterbrief or Handwerksrolle entry. Profiles pause automatically when a document expires.
4. **The premium lifestyle territory** in German at-home beauty and wellness. By their own positioning lines, no German competitor occupies it (inferred).
5. **Fairness to independents.** The Profi sets prices, hours and radius; there is no base fee; commission is tiered at 20 / 12 / 5 % with 0 % on travel; the own-client link costs 5 %.

### 3.4 What SOMA avoids

| Avoid | Why |
|---|---|
| Speed as the hero ("in 60 Minuten bei dir", "sofort verfügbar") | Availability depends on independent Profis (lead time defaults to 3 h). Blys already owns "fastest" |
| Medical and care territory ("Hausbesuch", "Pflege zu Hause", "medizinische Fußpflege", therapy) | HWG; protected titles; "häusliche Pflege" means nursing care in German |
| Discount and deal positioning ("günstig", codes as a headline) | Undermines premium; Glow2Go grew on marketing spend, not on loyalty |
| Gig-economy language ("on demand", "Fahrer", "Auftrag", "Job") | It demeans the Profi and suggests dispatch |
| "Our team / our staff" for Profis | They are independent (agency model, self-employment status ⚖). SOMA arranges; the Profi performs |
| Salon-directory feel (lists, stars, price tags first) | Welladom's territory; it dilutes "your place" |
| Spa clichés and esotericism | The brief rules them out; it would also read as "massage parlour" in this category |

---

## 4. Personality and values

### 4.1 Traits: "X, but never Y"

| Trait | In copy: do | In copy: don't | In design: do | In design: don't |
|---|---|---|---|---|
| **Sophisticated, never distant** | Precise words, short sentences, *du* | Insider jargon, Latinisms, "exquisit" | Editorial grid, generous space | Tiny grey type, unreadable contrast |
| **Confident, never arrogant** | State facts plainly: "Endpreis inkl. Anfahrt." | Superlatives: "die Besten", "Nr. 1" | One strong image, one message | Shouting type, badges everywhere |
| **Sensual, never provocative** | Name texture, warmth and light: "warmes Öl", "ruhige Griffe" | "sinnlich", "intim", innuendo, body-shaming or body ideals | Light, skin texture, hands, fabric | Exposed bodies, gaze into the camera, boudoir light |
| **Premium, never pretentious** | Let the details speak (concrete deadline, room number) | "Luxus", "exklusiv", "Premium", "Erlebnis" | Restraint, crafted typography, one accent | Gold, marble, scripts, faux-French |
| **Modern, never trend-dependent** | Plain contemporary German | Slang, memes, "Self-Care-Sunday" | Timeless type, product-true UI | Trend gradients, 3D blobs, glassmorphism as identity |
| **Calm, never boring** | Rhythm (short, short, longer), one surprising concrete detail | Exclamation marks, false urgency, filler ("einfach", "ganz entspannt") | Slow, settling motion; tonal contrast | Flat beige monotony; bouncing UI |

### 4.2 Values and how they show up in the product

| Value | In the product today |
|---|---|
| **Quality** | Category qualification checks; reviews only after completed appointments; ranking by quality and reliability, not paid placement (`/ranking`) |
| **Convenience** | Three screens from search to booking; guest checkout without a password; saved addresses; one-tap *Erneut buchen*; .ics export |
| **Trust** | Verification gate; Start-Code; address visible only after confirmation; SOMA-Garantie (report within 48 h → redo, credit or refund); payout held until then |
| **Independence** | Profis set prices, hours, radius and mode; they can decline; own-client link at 5 %; no exclusivity |
| **Personal wellbeing** | Wellness wording only; intake questions where relevant (massage, patch test for lashes and brows); no body ideals in copy |
| **Considered simplicity** | One cancellation policy for all; a total price instead of "ab" in search; status always as a word, never as colour alone |

---

## 5. Brand architecture

**Model: branded house.** SOMA is the only brand. Everything else is a plain descriptor.

```
SOMA ─────────────── the marketplace for customers (web/PWA, `/`)
 │                   sign-off: Your body. Your place.
 ├── SOMA Pro ────── the provider tool (`/pro`): Heute · Termine · Kalender · Einnahmen · Profil
 │     └── "SOMA für Profis" ── acquisition page and programme (`/fuer-profis`), onboarding at `/pro/registrieren`
 ├── SOMA Admin ──── internal operations console (`/admin`); neutral voice, no brand moments
 └── reserved (not built): SOMA-Gutschein (gift card, v1.1) · "SOMA für Unternehmen" (corporate offer, when built)
```

Rules:
- **SOMA Pro** is the only sub-product name. In the UI it is the wordmark plus "Pro" set in the interface sans as a descriptor, never a separate logo or lockup (detail for `LOGO_USAGE.md`).
- **Why not the alternatives?**
  - "SOMA Studio" suggests a physical studio, while our pitch to Profis is independence without one.
  - "SOMA Partner" implies partnership or employment (agency-model risk).
  - "SOMA Business" is better kept for a future corporate customer offer.
- Audience pages follow **"SOMA für …"** (für Profis, later für Unternehmen). Features use plain German names, never "SOMA + invented word" (§ 6.4).
- **Admin** may use the wordmark and tokens, but no taglines, no oxblood brand moments and no editorial imagery.

---

## 6. Naming system

### 6.1 Categories (exactly as in the product; route `/behandlungen/[slug]`)

| Name | Slug | Note |
|---|---|---|
| Massage | `massage` | Always "Wellnessmassage" in SEO and legal contexts; never "Therapie" |
| Maniküre | `manikuere` | The landing brief's "Nails & Maniküre" is **not** adopted: one name across the landing page, the app and the URLs. In running text, "Nägel" is fine |
| Pediküre | `pedikuere` | Always *kosmetische* Pediküre; never "medizinische Fußpflege" (PodG) |
| Kosmetik | `kosmetik` | Gesichtsbehandlungen and waxing |
| Haare & Styling | `haare-styling` | Only Profis with a Meisterbrief or Handwerksrolle entry |
| Brows & Lashes | `brows-lashes` | English is established in this trade; keep it |
| Make-up | `make-up` | Duden spelling with a hyphen |

### 6.2 Services
- The German name comes first and states the technique; the duration lives in its own field, never in the name ("Entspannungsmassage (klassisch)", "Wimpernlifting inkl. Färben").
- English only for established technique names: Shellac, Hot-Stone, Brow Lamination, Make-up.
- **No** marketing prefixes ("Luxus-", "Signature-", "Premium-", "Deluxe-").
- **No** efficacy or health terms in names ("Anti-Aging", "Detox", "Therapie", "Lymph-"). The spec's "Anti-Aging-Behandlung" correctly became "Feuchtigkeits- & Pflegebehandlung" in the catalogue; keep it that way.
- Combos are services of their own ("Maniküre & Pediküre"), named with "&".

### 6.3 "Behandlung" vs "Treatment", and "Profi" vs "Professional"

**Behandlung (decided).**
- *Behandlung* is the generic noun in all German copy: UI, SEO, legal, marketing.
- "Treatment" appears only inside English lines.
- In headlines, prefer the concrete service ("Massage", "Shellac") to either generic noun.
- **Why:**
  1. Routes (`/behandlungen`), navigation, the catalogue and the E2E suite use *Behandlung*.
  2. People search in German ("Massage zu Hause", "Kosmetikbehandlung").
  3. "Professionelle Treatments" is the forced, Denglisch vocabulary the brief's verbal-identity section rules out.
  4. One noun means less to think about.
- **Rule for English:** established German loanwords stay (Beauty, Wellness, Make-up, Styling, Shellac, Lashes). Optional anglicisms go: Treatment → Behandlung, Booking → Buchung, Appointment → Termin, Professional → Profi.

**Profi (decided). The client's "Professional werden" becomes "Profi werden".** Why:
1. *Profi* is the product's word in routes (`/profis/[slug]`, `/fuer-profis`), UI ("Verfügbare Profis"), admin ("Profis & Verifizierung"), the footer ("Profi werden bei SOMA") and tests. Changing it would cost URLs, SEO and test churn for no customer benefit.
2. In German usage, *Profi* works for every gender ("Sie ist ein Profi"), so we need no colon forms. "Professional" has no settled German gender or article (der/die/das?).
3. "Professionals" already names one of our **customer** segments in German marketing ("Young Professionals"). Using it for providers creates ambiguity on the very page that addresses both.
4. *Profi* is 5 characters and fits buttons and chips; "Professional" is 12.

Usage:
- **Prefer the name.** Once a booking exists, write "Anna kommt um 19:30 Uhr", not "Ihr Profi".
- **Otherwise:** "dein Profi" (customer), "Profis auf SOMA" (public).
- **Never:** "unsere Profis", "unser Team", "Mitarbeiter", "Partner" (agency model). Also never "Experte", which overclaims, and "Masseur", "Therapeut" or "Physiotherapeut", which are protected or risky titles.
- **"Fachkraft"** is acceptable only in legal texts. In the UI, replace the current "die Fachkraft" in checkout with the Profi's name or "dein Profi".
- **English:** "professional(s)".

### 6.4 Feature names (real features only)

| Name | Meaning | Where |
|---|---|---|
| **Sofort bestätigt** / **Auf Anfrage** | Booking modes: confirmed at booking, or the Profi accepts within a stated deadline | Search, profile, checkout |
| **Endpreis inkl. Anfahrt** | Total price including the travel fee | Search, profile, checkout |
| **Bedenkzeit** | Free cancellation within 15 min of booking (never past the start) | Checkout, booking |
| **Start-Code** | 4-digit code the customer gives the Profi on arrival; it starts the appointment (from 30 min before) | Booking, SOMA Pro |
| **SOMA-Garantie** | Report a problem within 48 h → redo, credit or refund; the payout is held meanwhile | Booking, `/hilfe` |
| **SOMA-Guthaben** | Credit from referrals and goodwill, applied at checkout | `/konto/guthaben` |
| **Empfehlen** | Referral: 15 € for the referrer, 15 € for the invitee (current settings) | `/konto/guthaben` |
| **Einladungslink** | The Profi's personal link; own clients book at 5 % commission | SOMA Pro |
| **Erneut buchen** · **Favoriten** · **Ihre Profis → Deine Profis** | Rebooking and saved Profis | Account, home |
| **Verifiziert** | Badge backed by approved documents | Profiles |
| **Problem melden** | Opens a dispute within 48 h | Booking |
| **Ortszeile** (internal term) | Place line: *Ort · Stadtteil · Uhrzeit* | Brand assets, editorial |

Principles: features are named for what they do, in German, with at most two words. Only **SOMA-Garantie**, **SOMA-Guthaben** and later **SOMA-Gutschein** carry the brand name (hyphenated per Duden). No invented branded features ("SOMA Moments", "SOMA Flow").

---

## 7. Message house

### 7.1 Customer house

**Roof (core message):** *Your body. Your place.* → *Professionelle Beauty- und Wellness-Behandlungen, die zu dir kommen – nach Hause, ins Hotel oder ins Büro.*

| Pillar | Message (DE) | Proof points that are true today | Source |
|---|---|---|---|
| **1 · Dein Ort** | *Du bleibst, wo du bist. Dein Profi kommt – mit allem, was die Behandlung braucht.* | Three location types with specific fields (Etage, Klingelname; Hotelname, Zimmernr., Name an der Rezeption; Firma, Empfang) · per-category preparation notes (e.g. 2 × 3 m for the massage table) · the address is visible to the Profi only after confirmation and hidden again after the appointment | `checkout-form.tsx`, `discovery-copy.ts` (PREP), spec § 11 |
| **2 · Geprüfte Profis** | *Wer zu dir kommt, ist geprüft – und von Menschen bewertet, die wirklich gebucht haben.* | Approval is blocked until ID, Gewerbeanmeldung and Berufshaftpflicht are approved, plus a qualification for every category except Make-up (Haare: Meisterbrief or Handwerksrolle) · auto-pause on an expired document · reviews only after a completed booking (14-day window) · Start-Code at the door | `base-seed-data.ts`, `services/verification.ts`, `STATUS.md` |
| **3 · Vorher klar** | *Du siehst den Endpreis, bevor du buchst, und weißt, bis wann du kostenlos absagen kannst.* | Total incl. travel in search · no service fee (setting = 0) · free cancellation ≥ 24 h before · 15-min Bedenkzeit · 50 % of the service price at 24–2 h (travel refunded), 100 % + travel under 2 h or no-show · requests free until accepted · full refund if the Profi cancels · card reserved at booking, charged after the appointment · slot held for 10 min while paying | `cancellation.ts`, `pricing.ts`, `payments/stripe.ts` (manual capture), `booking-engine.ts` |

**Foundation:** SOMA-Garantie (48 h), payment only through SOMA (no cash), ranking without paid placement.

### 7.2 Provider house (SOMA Pro)

**Roof:** *Dein Können. Deine Preise. Deine Zeiten.* SOMA macht dich sichtbar und kümmert sich um das Drumherum.

| Pillar | Proof points (true today) |
|---|---|
| **Gefunden werden** | Visible in searches within your radius, with the total price; profile with portfolio and verified reviews; ranking by quality and reliability, no paid placement |
| **Selbst bestimmen** | Prices, radius, travel fee, weekly hours, buffer and lead time; request mode with accept/decline; instant mode after 3 completed appointments |
| **Sicher bezahlt** | Payment through SOMA, never cash; cancellation and no-show fees (50 % / 100 % + travel); your share is available 48 h after the appointment; travel fee 100 % yours |
| **Fair berechnet** | No base fee; commission 20 % (new via SOMA), 12 % (repeat), 5 % (own client via invite link), 0 % on travel; commission applies only to service revenue earned through SOMA |

### 7.3 Claims we must not make (yet)

| Not true or not built | Instead |
|---|---|
| Gift cards, tips, couples or multi-Profi bookings, rescheduling (today it is cancel and rebook), in-app chat | Say nothing, or label clearly as "geplant" in internal decks only |
| Native iOS/Android apps | "Läuft im Browser deines Smartphones – ohne Download." (PWA, manifest present) |
| English UI | v1.1 |
| SMS, push, "unterwegs" ETA, 2-h reminder | Today: in-app inbox and e-mail; a 24-h reminder exists |
| Führungszeugnis, Stripe Identity, "zertifiziert", "versichert über SOMA" | Name the actual checks (§ 7.1 pillar 2) |
| "handverlesen", "kuratiert", "die besten Profis" | "geprüft" |
| "in 60 Minuten", "rund um die Uhr", "überall", "deutschlandweit" | "in {Städte}"; "freie Termine morgens, nachmittags und abends", where they exist |
| Income figures ("verdiene bis zu …") | Show the commission table; let the earnings calculator do the maths |
| "Automatische Rechnungen" for Profis | Not built; verify before claiming (the current `/fuer-profis` FAQ hints at it, see `BRAND_VOICE.md` § 9) |
| Review timing promises ("Prüfung in 48 h", "Antwort in 72 h") | These are ops targets; use them only once ops confirms (current copy flagged in `BRAND_VOICE.md` § 9) |

**City-gating rule (lesson from Glow2Go):** advertise a city × category only where the product's coverage gate shows live supply. Brand awareness never runs ahead of liquidity.

---

## 8. Tagline system

### 8.1 Hierarchy

| Level | Line | Language | Use |
|---|---|---|---|
| Primary tagline | **Your body. Your place.** | EN, never translated | Logo lockup, hero, campaign end frames, social bio line 1, app splash. Mark it `lang="en"` |
| Descriptor (brand) | **Beauty & Wellness, wherever you are.** | EN | Brand lockups and brand book only; never alone as an explanation |
| Descriptor (product) | **Beauty & Wellness. Bei dir.** | DE | `<title>` suffix, meta, app-store or PWA subtitle, social bio line 2, footer |
| Signature line | **Du bleibst. Dein Profi kommt.** | DE | Campaigns, "how it works", ads, provider-neutral explanations |
| Supporting line | *Geprüfte Profis für Massage, Nägel, Kosmetik, Haare und Make-up kommen zu dir – nach Hause, ins Hotel oder ins Büro.* | DE | Hero lead, meta description, press boilerplate |
| Provider line | **Dein Können. Deine Preise. Deine Zeiten.** | DE | SOMA für Profis, provider ads |

**Honesty note on "wherever".** As an English brand idiom it is acceptable, but German functional copy always qualifies it: "zu Hause, im Hotel oder im Büro", "in {Städte}".

### 8.2 English vs German
- **English:** only the primary tagline and the brand descriptor, plus at most one English line per campaign asset, always paired with German that explains the offer. English must be understandable at B1 level.
- **German:** everything else, including UI, transactional messages, errors, legal texts, SEO and support. Never mix both languages in one sentence.
- **English UI (v1.1) is localisation, not brand English.** It follows the same voice rules (`BRAND_VOICE.md`).

### 8.3 The client's German lines

| Client line | Verdict | Reason | Final use |
|---|---|---|---|
| *Zeit für dich. Wo du willst.* | **Retire** | "Zeit für dich" is one of the most worn self-care phrases in German wellness; "Wo du willst" promises any location, but supply is limited to 6 cities and each Profi's radius | — |
| *Beauty & Wellness. Bei dir.* | **Adopt** | Clear, true and short; it is the natural German partner of the English descriptor | **German product descriptor** |
| *Dein Moment. Dein Ort.* | **Retire** | It copies the tagline's structure and competes with it; "Moment" is generic; "dein Ort" reads as "your town" | — |
| *Professionelle Treatments. Ganz entspannt bei dir.* | **Rewrite** | Denglisch; "professionelle" is a weak adjective; "ganz entspannt" promises a feeling | → supporting line (§ 8.1) |
| (new) *Du bleibst. Dein Profi kommt.* | **Adopt** | The whole model in five words; true to the agency model; *du*; ownable | **German signature line** |

---

## 9. The name SOMA

**Meaning.** *Sōma* (σῶμα) is ancient Greek for **the body**: the living, physical self, not anatomy.

**How to use it:**
- **As a quiet origin story, one sentence, in "about", press and the brand book:** *„Soma ist das altgriechische Wort für Körper.“* Never as a hero line, never explained in the UI.
- **As a design principle, not a picture:** proportion, curvature, weight and warmth in letterforms, crops and motion (§ 10). The tagline says "body"; the identity *feels* it.
- **In copy:** concrete, bodily, sensory words (Hände, Haut, Wärme, Ruhe, Körpergefühl) instead of abstract wellbeing talk.

**Keep away from:**
- **Medical:** "somatisch", "Soma" as the cell body in neuroscience, "somatic therapy" (an existing therapy trend; HWG).
- **Spiritual:** the Vedic ritual drink *soma*; anything mystical.
- **Literal:** body silhouettes, anatomy, Greek columns, laurel wreaths, Greek letters (σ and Σ also read as statistics and summation symbols).
- **Pharmaceutical:** "Soma" is the drug in Huxley's *Brave New World*, and in the US a brand name for a prescription muscle relaxant. Never pair SOMA with "Dosis", "Pille", "Rezept" or "Glück auf Knopfdruck".
- **Lingerie:** "Soma" is also a US lingerie retailer. That is one more reason for "sensual, never provocative".

**Legal to-do (Lead):** trademark clearance for "SOMA" in DE/EU, Nice classes 35 (marketplace), 44 (beauty and wellness) and 9/42 (software), before any public launch. SOMA is still a working title.

---

## 10. Directives for the Identity Designer and the Art Director

1. **Type is the voice.**
   - The display serif speaks the brand: the tagline and editorial headlines. The sans does the work: UI, numbers and forms.
   - "Your body. Your place." is always set in the display face, never in the UI sans.
   - At most one serif statement per view.
2. **Build the symbol from SOMA, not from Greek.**
   - Derive the compact mark from the wordmark's own letters (the S, or the O as an enclosed place).
   - No σ or Σ, no columns, no body outlines. The v2 σ mark retires with the v2 visual language.
3. **Body as proportion, not picture.** Express *sōma* through curvature, stroke weight, negative space and generous crops. Never through anatomy, figure silhouettes or skin used as a background texture.
4. **Oxblood is a signal.**
   - At most one oxblood moment per screen: the primary action, or the brand moment.
   - Oxblood must never be read as an error. Error states need a distinct hue, an icon and a word.
5. **Every frame answers "where are we?"**
   - Place is the hero: room, light, time of day.
   - Key images carry an Ortszeile (*Ort · Stadtteil · Uhrzeit*), set as a consistent typographic element with tabular figures.
   - Ortszeilen are illustrative scenes; they never pose as real bookings.
6. **Discretion in the crop.**
   - Hands, shoulders, turned-away or closed-eyed faces.
   - Sensuality comes from light and texture, never from exposure or gaze to camera.
   - Nothing may read as an erotic massage.
7. **Pass the three "nots" on every asset:**
   - not a nail salon (no pink, glitter, rose gold, nail-art close-ups as the hero);
   - not a clinic (no blue-white, gloves, crosses, sterile rooms);
   - not SaaS (no gradients, blobs, isometric art, feature-icon grids).
8. **Product truth is design material.**
   - Use real UI facts in brand compositions: *Endpreis inkl. Anfahrt*, the dated cancellation deadline, the Start-Code.
   - Never fake ratings, counts, badges, or AI faces presented as real Profis.
   - Label development imagery as such.
9. **Motion means arrival.** Elements settle into place and stop: ease-out, no bounce, no loops. The motif's metaphor is "coming to rest", not "flowing energy".
10. **Built for German.**
    - Layouts must hold long compounds (*Wimpernverlängerung*, *Gesichtsbehandlung*) at display sizes, with soft hyphens.
    - Buttons must fit *Zahlungspflichtig buchen · 84 €*.
    - Every status is a word plus a colour.

---

## 11. Open items for the Lead

1. **Trademark clearance** for "SOMA" (§ 9).
2. **Legal (lawyer):** confirm the *du* exceptions (statutory Widerrufsbelehrung and model form stay verbatim in *Sie*; see `BRAND_VOICE.md` § 1.3). Add the zero-tolerance rule for sexualised requests to the terms and the massage checkout.
3. **Phase B2 migration:**
   - customer copy from *Sie* to *du* (about 435 lines in 82 source files, plus 9 E2E specs);
   - seeded content blocks and category taglines in `scripts/db/lib/base-seed-data.ts`, and the live `content_blocks` rows;
   - `BRAND_TAGLINE` and `BRAND_PROMISE` in `src/lib/brand.ts`, and the manifest description;
   - remove `"health"` from the manifest categories (medical association).
4. **Copy corrections found in this review** (truth, not taste): see `BRAND_VOICE.md` § 9.
5. **Payments:** if the SetupIntent flow for bookings more than 6 days ahead ships, "reserviert" in the payment copy becomes "hinterlegt" (`BRAND_VOICE.md` § 7.11).
