# SOMA Landing Page: Copy Deck (DE)

*Brand Strategist · phase B1 · 1 Nov 2026 · v1.0 · for `docs/landing/BRIEF.md` sections 01–10*
*v2.0 · 2 Nov 2026 · Kundenentscheidung 2026-11-02: Landing gestrafft (seven chapters; see below)*
*Voice and typography: `brand/BRAND_VOICE.md`. Strategy: `brand/BRAND_STRATEGY.md`.*

> **Kundenentscheidung 2026-11-02: Landing gestrafft.** The client wrote: „die landingpage wirkt etwas überladen, du kannst sie etwas aufräumen.“ The Lead cut the page from ten chapters to seven (`docs/landing/LANDING_DESIGN_SPEC.md`, „v2 structure“). The copy is shorter: sentences are cut, the type is not shrunk.
>
> | v2 | Chapter | From v1 | Copy change |
> |---|---|---|---|
> | 01 | Bei dir | 01 | The lead is one sentence (§ 01). |
> | 02 | Behandlungen | 03 | New quiet link **Themenwelten entdecken** → `/entdecken` next to „Alle Behandlungen“. |
> | 03 | So funktioniert’s | 04 | Nav name „So funktioniert’s“ (was „Ablauf“). New trust row from v1 07's callouts: Endpreis · Start-Code · Kostenlos stornierbar bis {24 Std.} vorher. |
> | 04 | Profis | 06 | One supporting sentence; „Selbst Profi?“ is gone (the next chapter is Für Profis). |
> | 05 | Für Profis | 08 | Compact: eyebrow, headline, one line, the two CTAs. Benefits, commission strip and payment line stay on `/fuer-profis`. |
> | 06 | Fragen | 09 | Five questions (1, 2, 3, 5, 6), then **Alle Fragen** → `/hilfe`. No trust strip. |
> | 07 | SOMA | 10 | Unchanged. |
>
> **Removed from the page:** 02 Idee, 05 Dein Ort, 07 Deine Buchung. Their copy below is marked „entfernt (v2)“; it is not retired and may be reused on other pages with the Strategist's sign-off.

**How to read this deck.**
- Copy is German, addressed with *du*, and contains real NBSP (U+00A0).
- `{…}` marks a value rendered from data. Never hard-code those values: they come from `getPublicTerms()`, `listCatalog()`, `listCities()` and `getPriceFloors()`, so the page stays true when admin settings change.
- *Accent clause* marks the optional second clause set in the display accent style.
- Section anchors are suggestions; the Landing Art Director and the Frontend Engineer own the final IDs.
- Copy is final. Layout, motion and interaction are not decided here.

---

## 0. Global

### 0.1 Routes used (all verified in `src/lib/routes.ts` and `src/app/**`)
| CTA | Target | Source |
|---|---|---|
| Freie Termine finden (booking entry) | `/suche?plz=&kategorie=&leistung=&datum=&zeit=` | `routes.search`; `BookingEntry` submit |
| Termin finden (persistent navigation) | `#termin` (the `BookingEntry` default id) | `booking-entry.tsx` |
| Category | `/behandlungen/{massage · manikuere · pedikuere · kosmetik · haare-styling · brows-lashes · make-up}` | `routes.category`, seed slugs |
| Alle Behandlungen | `/behandlungen` | `routes.categories` |
| Entdecken · Themenwelten entdecken (v2) | `/entdecken` | `routes.explore` |
| Profile | `/profis/{slug}` | `routes.provider` |
| Städte | `/staedte`, `/staedte/{slug}` | `routes.cities`, `routes.city` |
| Profi werden | `/pro/registrieren` | `routes.pro.onboarding` |
| Konditionen ansehen | `/fuer-profis#provision` | `id="provision"` exists |
| Hilfe · Stornierung · Ranking | `/hilfe` · `/stornierung` · `/ranking` | pages exist |
| Legal | `/impressum` · `/datenschutz` · `/agb` · `/agb-profis` · `/widerruf` · `/datenschutz#cookies` | pages exist |
| Anmelden · Profi-Login | `/anmelden` · `/anmelden?next=/pro` | `routes.login` |

### 0.2 Navigation
- **Persistent booking CTA** (desktop header and mobile thumb bar): **Termin finden** → `#termin`.
- **Links (v2):** Entdecken · Behandlungen · So funktioniert’s · Für Profis · Hilfe · Anmelden. „Entdecken“ → `/entdecken` comes first, as in the site header.
- **Chapter navigation (v2, 01–07):** Bei dir · Behandlungen · So funktioniert’s · Profis · Für Profis · Fragen · SOMA.
  - Accessible name of the nav: „Kapitel“.
  - Progress text: „Kapitel 2 von 7: Behandlungen“.
  - *(v1, 01–10: Bei dir · Idee · Behandlungen · Ablauf · Dein Ort · Profis · Deine Buchung · Für Profis · Fragen · SOMA.)*

### 0.3 Metadata (proposal for Conversion & Integration)
- `title`: **SOMA – Beauty & Wellness bei dir zu Hause, im Hotel und im Büro**
- `description`: Geprüfte Profis für Massage, Nägel, Kosmetik, Haare und Make-up kommen zu dir. Endpreis inkl. Anfahrt, kostenlos stornierbar bis 24 Std. vorher.
- OG title: **SOMA · Your body. Your place.** · OG description: the same as `description`.
- Organization JSON-LD `slogan`: „Your body. Your place.“

---

## 01 · Hero: Bei dir
**Intent:** within seconds the visitor understands that professional beauty and wellness come to them, and can start a search.

| Element | Copy |
|---|---|
| Eyebrow | Zu Hause · Hotel · Büro |
| Display line (`lang="en"`) | **Your body. Your place.** |
| H1 (German, visible) | Beauty & Wellness bei dir zu Hause, im Hotel oder im Büro. |
| Lead (v2: one sentence) | Geprüfte Profis für {Massage, Nägel, Kosmetik, Haare und Make-up} kommen zu dir. *(v1 added: „Du siehst echte freie Termine – mit Endpreis inklusive Anfahrt.“ The trust row right under the entry says „Endpreis inkl. Anfahrt“, and the search shows only real free slots.)* |
| Primary CTA (entry submit) | **Freie Termine finden** → `/suche?…` |
| Secondary CTA | **So funktioniert’s** → `#so-funktionierts` |
| Trust row | Verifizierte Profis · Endpreis inkl. Anfahrt · Kostenlos stornierbar bis {24 Std.} vorher |

**Why not the brief's "Jetzt entdecken".** It names no outcome. „Freie Termine finden“ says what happens and is true: search shows only real free slots. "Entdecken" survives as step 01 and in the category CTAs.

**Lead rule.** The category list must match the live catalogue. If Haare & Styling is not live, drop „Haare“. If the list cannot be rendered, use the fallback: „Geprüfte Profis kommen zu dir.“ *(v1: „… – mit Endpreis inklusive Anfahrt.“)*

### Booking entry microcopy
**Field order: Wo? · Was? · Wann?** "Your place" comes first. The PLZ is the only required field, it decides availability and the total price, and the order matches the app.

| Field | Label | Default / placeholder | States |
|---|---|---|---|
| Wo? | Wo? *(screen reader: Postleitzahl)* | PLZ, z. B. {10115} · button „Standort verwenden“ | Checking: „Postleitzahl wird geprüft“ (screen reader) · OK: „{10115} {Berlin}“ · Unserved: „In {12345} gibt es noch keine Profis auf SOMA. Sollen wir dir Bescheid geben, sobald es losgeht?“ + E-Mail + **Benachrichtigen** |
| Was? | Was? | Alle Behandlungen | Picker title „Behandlung wählen“. First row: „Alle Behandlungen“ / „Alle verfügbaren Profis in deiner Nähe“. Category row: name + tile line. Inside a category: „{Massage}: alle Leistungen“, then each service „{Name}“ · „{60 / 90 Min.} · ab {75 €}“ (price only from real floors) |
| Wann? | Wann? | So bald wie möglich | Chips: Heute · Morgen · Datum wählen. Window: Morgens 7–12 · Nachmittags 12–17 · Abends 17–22 (optional). Picker title „Zeitpunkt wählen“ |
| Submit | **Freie Termine finden** | — | Loading: „Termine werden gesucht …“ |
| Errors | — | — | „Bitte gib deine Postleitzahl ein.“ · „Bitte gib eine fünfstellige Postleitzahl ein.“ · „Diese Postleitzahl kennen wir nicht. Bitte prüf die Eingabe.“ · „Dein Gerät gibt keinen Standort frei. Bitte gib deine Postleitzahl ein.“ |
| Returning customer | — | „Erneut buchen: {Shellac} bei {Anna K.}“ | Existing `RebookRow` |

### Content for a place-led hero interaction (optional)
If the hero interaction switches between places, use these lines. They exist in `PLACE_LINES` and are illustrative scenes, not bookings.

| Toggle | Ortszeile |
|---|---|
| Zu Hause | Altbau, 3. OG · Berlin-Prenzlauer Berg · 19:30 |
| Im Hotel | Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10 |
| Im Büro | Besprechungsraum · Hamburg-HafenCity · 13:00 |

### Hero headline alternatives
| | Headline | When | Note |
|---|---|---|---|
| **A (recommended)** | **Your body. Your place.** + German H1 above | Default | The brand's primary line; the German H1 carries meaning and SEO |
| B | **Du bleibst. Dein Profi kommt.** | A/B test, or if English in the hero underperforms | Explains the model in five words; the tagline then moves to section 10 |
| C | **Beauty & Wellness. Bei dir.** | Paid traffic, SEO-heavy variants | The most literal; the least distinctive |
| D | **Nach der Massage: schon zu Hause.** | Massage-led campaign landings only | Category-specific; not for the generic home |

---

## v1 02 · Philosophy: Idee · entfernt (v2)
**Removed from the landing** (Kundenentscheidung 2026-11-02). Its copy, for reuse elsewhere with sign-off: headline „Dein Termin richtet sich nach deinem Leben. Nicht umgekehrt.“ · lines „Kein Weg durch die Stadt. · Kein Parkplatz. · Kein Wartebereich.“ · statement „Du bleibst, wo du bist. Dein Profi kommt – mit allem, was die Behandlung braucht.“ · caption „Soma ist das altgriechische Wort für Körper.“

---

## 02 · Services: Behandlungen *(v1 03)*
**Intent:** the service universe; every tile leads to its discovery route.

| Element | Copy |
|---|---|
| Eyebrow | Behandlungen |
| Headline | **{Sieben} Behandlungen.** *Accent clause:* Ein Ort: deiner. *(the number word comes from `catalog.length`)* |
| Supporting | Von Profis, die mitbringen, was die Behandlung braucht – von der Liege bis zur Lampe. |
| Section link | **Alle Behandlungen** → `/behandlungen` |
| Quiet link (v2) | **Themenwelten entdecken** → `/entdecken` |

| Tile | Line | Price chip (data only) | CTA → route |
|---|---|---|---|
| Massage | Klassisch, Aromaöl, Hot Stone. | ab {45 €} | Massage entdecken → `/behandlungen/massage` |
| Maniküre | Von klassisch mit Lack bis Gel. | ab {30 €} | Maniküre entdecken → `/behandlungen/manikuere` |
| Pediküre | Kosmetische Fußpflege im eigenen Sessel. | ab {45 €} | Pediküre entdecken → `/behandlungen/pedikuere` |
| Kosmetik | Gesichtsbehandlungen und Waxing. | ab {40 €} | Kosmetik entdecken → `/behandlungen/kosmetik` |
| Haare & Styling | Föhnen, Schnitt, Hochsteckfrisur. | ab {30 €} | Haare & Styling entdecken → `/behandlungen/haare-styling` |
| Brows & Lashes | Lifting, Lamination, Verlängerung. | ab {25 €} | Brows & Lashes entdecken → `/behandlungen/brows-lashes` |
| Make-up | Für Büro, Abend und Hochzeit. | ab {50 €} | Make-up entdecken → `/behandlungen/make-up` |

**Prices.** Prices are "ab" (from) without travel and come from `getPriceFloors()`. Hide the chip when there is no floor. The values shown are seed hints, not facts. In an expanded tile or on hover, list up to three service names from the catalogue.

**Name.** The category is named „Maniküre“, not the brief's „Nails & Maniküre“, so the landing page, app and URLs use one name (strategy § 6.1).

---

## 03 · How it works: So funktioniert’s (`#so-funktionierts`) *(v1 04 „Ablauf“)*
**Intent:** three steps, understood at a glance.

| Element | Copy |
|---|---|
| Eyebrow | So funktioniert’s |
| Headline | **Drei Schritte.** *Accent clause:* Kein Weg. |

| Step | Title | Line | Detail (walkthrough or caption) |
|---|---|---|---|
| 01 | **Entdecken** | Finde deine Behandlung. | PLZ, Behandlung, Zeitraum: Du siehst nur echte freie Termine – mit Endpreis inklusive Anfahrt. |
| 02 | **Buchen** | Wähl Ort und Uhrzeit. | Zuhause, Hotel oder Büro. Bezahlt wird online, belastet erst nach dem Termin. |
| 03 | **Bleiben** | Dein Profi kommt zu dir. | Mit deinem vierstelligen Start-Code beginnt der Termin. Du bleibst, wo du bist. |

- **Step 03 label.** „Bleiben“ is recommended over the brief's „Genießen“. It is concrete and echoes the signature line rather than promising a feeling. „Genießen“ is an acceptable alternative if the client insists.
- **The brief's lines, revised:**
  - „Finde dein persönliches Treatment“ becomes „Finde deine Behandlung.“
  - „Dein Professional kommt zu dir“ becomes „Dein Profi kommt zu dir.“
- **UI callouts** (from real components; demo values labelled in demo mode):
  - „{10115} {Berlin}“
  - „{54 €} inkl. Anfahrt“
  - „Kostenlos stornierbar bis {Mi., 18:30 Uhr}“
  - „Start-Code {4827}“
- **Trust row (v2, under the steps; the three callouts of v1 07, verbatim):**

  | Title | Line |
  |---|---|
  | Endpreis | Inklusive Anfahrt, bevor du buchst. |
  | Start-Code | Vier Ziffern, mit denen dein Termin beginnt. |
  | Kostenlos stornierbar bis {24 Std.} vorher *(from `terms.cancellationPolicy`; „Kostenlos stornierbar bis zum Termin“ with a 0 h window; „Stornofrist“ without a free window)* | Mit Datum und Uhrzeit, nicht im Kleingedruckten. |
- **CTA:** Freie Termine finden → `#termin`.

---

## v1 05 · Experience: Dein Ort · entfernt (v2)
**Removed from the landing** (Kundenentscheidung 2026-11-02). The copy below is kept for reference.

**Intent:** the benefits of being at home, told in pictures. No numbers, no availability promises.

| Element | Copy |
|---|---|
| Eyebrow | Bei dir |
| Headline | **Nach der Massage:** *Accent clause:* schon zu Hause. |

| Theme | Line | Ortszeile (illustrative) |
|---|---|---|
| Time saved | Die Stunde gehört der Behandlung. Nicht dem Weg dorthin. | Wohnzimmer · Hamburg-Eimsbüttel · 19:05 |
| Comfort | Dein Sofa. Deine Decke. Dein Licht. | Sofa, danach · München-Schwabing · 20:20 |
| Privacy | Deine Adresse sieht nur dein Profi – und erst nach der Bestätigung. | Altbau, 3. OG · Berlin-Prenzlauer Berg · 19:30 |
| Professional quality | Geprüft, bevor es klingelt. *(small: Ausweis, Gewerbe, Berufshaftpflicht – und je nach Kategorie die Qualifikation.)* | Wohnungstür, 2. OG · Köln-Ehrenfeld · 18:55 |
| Personal choice | Du wählst die Person, nicht nur die Uhrzeit. | Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10 |
| Flexible scheduling | Morgens, nachmittags oder abends – du suchst nach deiner Zeit. | Besprechungsraum · Hamburg-HafenCity · 13:00 |

**End link:** Freie Termine finden → `#termin`.

**Truth guard.** No "in 60 Minuten", "rund um die Uhr" or "immer verfügbar". The time windows reflect the search filter (7–22), not a promise that every Profi is available.

---

## 04 · Professionals: Profis *(v1 06)*
**Intent:** the human side, with real data only.

| Element | Copy |
|---|---|
| Eyebrow | Die Profis |
| Headline | **Wer bei dir klingelt.** |
| Supporting (v2) | Geprüft, bevor sie buchbar sind – bewertet nur von Menschen, die wirklich gebucht haben. *(v1 began with „Selbstständige Profis mit eigener Handschrift.“)* |
| Card (data only) | {Anna K.} · {Massage, Kosmetik} · ★ {4,9} ({87}), shown only when reviews exist · „Verifiziert“ only from approved documents · CTA **Profil ansehen** → `/profis/{slug}` |
| Demo label (`DEMO_MODE`) | Demo-Profil · Foto KI-generiert |
| Secondary link | *(v1: Selbst Profi? → `#fuer-profis`; v2: none, the chapter foot's „Weiter: Für Profis“ goes there)* |

**Fallback when no verified Profis are available** (a non-specific presentation without faces):
- Headline: **Wer bei dir klingelt.**
- Body (v2): „Wer auf SOMA buchbar ist, hat Ausweis, Gewerbeanmeldung, Berufshaftpflicht und je nach Kategorie eine Qualifikation nachgewiesen.“ *(v1 began with „Auf SOMA arbeiten selbstständige Profis – mit eigenen Preisen, eigenen Zeiten und eigenem Stil.“)*
- CTA: **Freie Termine finden**.

**Never:** invented names, testimonials, review counts, qualifications or badges.

---

## v1 07 · Digital experience: Deine Buchung · entfernt (v2)
**Removed from the landing** (Kundenentscheidung 2026-11-02). Endpreis, Stornofrist and Start-Code are the trust row of 03 now. The copy below is kept for reference.

**Intent:** the product, shown truthfully: a web app, with no store badges.

| Element | Copy |
|---|---|
| Eyebrow | Deine Buchung |
| Headline | **Wer kommt. Wann. Was es kostet.** *Accent clause:* Alles an einem Ort. |
| Supporting | SOMA läuft im Browser deines Smartphones – ohne Download. Alles zu deinem Termin steht in deiner Buchung. |
| CTA | Freie Termine finden → `#termin` |

| Callout | Line | Real feature |
|---|---|---|
| Endpreis | Inklusive Anfahrt, bevor du buchst. | Search, profile, checkout |
| Stornofrist | Mit Datum und Uhrzeit, nicht im Kleingedruckten. | Checkout, `/buchung/[id]` |
| Start-Code | Vier Ziffern, mit denen dein Termin beginnt. | `/buchung/[id]` |
| Kalender | Dein Termin mit einem Tipp im Kalender. | .ics export |
| Erneut buchen | Profi und Behandlung sind schon gewählt – du wählst nur die Uhrzeit. | `/konto/termine`, home `RebookRow` |
| Favoriten | Deine Profis, gespeichert für das nächste Mal. | `/konto/favoriten` |

**Do not show:** App Store or Play badges, chat, live "unterwegs" tracking, push or SMS, gift cards, rescheduling. None of these is built.

---

## 05 · For professionals: SOMA für Profis (`#fuer-profis`) *(v1 08)*
**Intent:** win independent professionals, with no income claims.

**v2 (compact):** on the landing only the eyebrow, the headline, the supporting line and the two CTAs below. The benefits, the commission strip and the payment line are not on the landing any more; they stay true for `/fuer-profis`.

| Element | Copy |
|---|---|
| Eyebrow | SOMA für Profis |
| Headline | **Dein Können. Deine Preise.** *Accent clause:* Deine Zeiten. |
| Supporting | SOMA macht dich für Kundschaft in deinem Einsatzgebiet sichtbar und kümmert sich um Buchung, Zahlung und Stornofristen. |
| Primary CTA | **Profi werden** → `/pro/registrieren` |
| Secondary CTA | Konditionen ansehen → `/fuer-profis#provision` |

| Benefit (brief) | Title | Line (true today) |
|---|---|---|
| New customer discovery | Gefunden werden | Du erscheinst in Suchen in deinem Radius – mit deinem Endpreis inklusive Anfahrt. |
| Flexible scheduling | Deine Zeiten | Arbeitszeiten, Puffer, Vorlaufzeit und freie Tage legst du selbst fest. |
| Booking management | Alles in SOMA Pro | Anfragen annehmen oder ablehnen, Kalender, Start-Code und Einnahmen an einem Ort. |
| Professional visibility | Dein Profil | Portfolio, Leistungen und Bewertungen aus echten Terminen. |
| Business independence | Dein Geschäft | Eigene Preise und dein Einladungslink: Stammkundschaft bucht dich darüber für {5 %} Provision. |

**Commission strip** (rendered from `terms.commission`): Keine Grundgebühr · {20 %} bei neuer Kundschaft über SOMA · {12 %} bei Stammkundschaft · {5 %} mit deinem Einladungslink · 0 % auf die Anfahrt.

**Payment line:** Bezahlt wird über SOMA – nicht an der Tür. Dein Anteil ist {48} Stunden nach dem Termin verfügbar.

**Never:** "verdiene bis zu …", average earnings, "Wir bringen die Kundschaft", or review-time promises (strategy § 7.3).

---

## 06 · FAQ: Fragen *(v1 09)*
**Intent:** practical answers that are true to the product. The same strings feed the FAQPage JSON-LD.

**v2:** the landing shows questions **1, 2, 3, 5 and 6** (the booking flow, 4, is chapter 03 itself; 7, 8 and 9 are answered on `/hilfe`), then one link **Alle Fragen** → `/hilfe`. The FAQPage JSON-LD holds exactly these five. No trust strip: the hero's trust row and 03's carry those facts. The texts of all nine stay as below.

| Element | Copy |
|---|---|
| Eyebrow | Fragen & Antworten |
| Headline | **Antworten,** *Accent clause:* bevor du fragst. |
| Trust strip | *(v1: Verifizierte Profis · Endpreis inkl. Anfahrt · Bezahlt nur über SOMA · SOMA-Garantie: Problem melden bis {48} Std. nach dem Termin; v2: none)* |
| Link (v2) | **Alle Fragen** → `/hilfe` *(v1: Alle Fragen und Antworten → `/hilfe` · Stornobedingungen → `/stornierung`; „Stornierung“ stays in the footer)* |

**1 · Wie funktioniert SOMA?**
Du gibst deine Postleitzahl ein und wählst eine Behandlung und einen Zeitraum. Du siehst geprüfte Profis mit echten freien Terminen und dem Endpreis inklusive Anfahrt. Du buchst – und dein Profi kommt zu dir nach Hause, ins Hotel oder ins Büro.

**2 · Wo gibt es SOMA?**
Aktuell in {Berlin, Hamburg, München, Köln, Frankfurt am Main und Düsseldorf}. Profis legen ihr Einsatzgebiet selbst fest. Ob es bei dir freie Termine gibt, siehst du, sobald du deine Postleitzahl eingibst. Noch niemand in deiner Gegend? Trag dich ein – wir sagen dir Bescheid, sobald Profis bei dir buchbar sind.

**3 · Wie prüft SOMA die Profis?** *(the brief's "How are professionals selected?". SOMA verifies; it does not hand-pick)*
Auf SOMA arbeiten selbstständige Profis mit Gewerbeanmeldung. Bevor jemand buchbar ist, prüfen wir {Ausweis, Gewerbeanmeldung und Berufshaftpflicht} – und je nach Kategorie einen Qualifikationsnachweis, etwa eine Massageausbildung oder für Haare & Styling den Meisterbrief bzw. die Eintragung in die Handwerksrolle. Läuft ein Pflichtnachweis ab, pausieren wir das Profil. Bewerten kann nur, wer wirklich gebucht hat.

**4 · Wie läuft die Buchung ab?**
Tipp auf eine freie Uhrzeit, gib an, wo der Termin stattfindet – Zuhause, Hotel oder Büro –, und bezahl online. Ein Konto legst du dabei nebenbei an, ohne Passwort. Bei „Sofort bestätigt“ steht dein Termin sofort. Bei „Auf Anfrage“ sagt dein Profi innerhalb einer Frist zu, die du vor dem Absenden siehst. Am Termin nennst du deinem Profi deinen vierstelligen Start-Code – damit beginnt der Termin.

**5 · Was passiert, wenn ein Termin abgesagt wird?**
Bis {24 Stunden} vor dem Termin stornierst du kostenlos, in den ersten {15} Minuten nach der Buchung sogar immer. Danach fallen {50 %} des Behandlungspreises an; die Anfahrt wird nicht berechnet. Weniger als {2 Stunden} vorher oder wenn du nicht da bist, werden Behandlung und Anfahrt voll berechnet. Offene Anfragen kannst du jederzeit kostenlos zurückziehen. Sagt dein Profi ab, entstehen dir keine Kosten. Die genaue Frist siehst du vor dem Bezahlen – mit Datum und Uhrzeit.

**6 · Wie bezahle ich?**
Online bei der Buchung, über unseren Zahlungsdienstleister Stripe. Welche Zahlarten verfügbar sind, siehst du im Bezahlschritt. Der Betrag wird zunächst nur reserviert und erst nach dem Termin belastet. {Eine Servicegebühr berechnet SOMA nicht.} Bargeld gibt es nicht – so ist jeder Termin für beide Seiten abgesichert.

*Optional (recommended for trust and HWG clarity):*

**7 · Ist eine Massage auf SOMA eine medizinische Behandlung?**
Nein. Alle Angebote auf SOMA sind Beauty- und Wellnessanwendungen und ersetzen keine ärztliche, physiotherapeutische oder podologische Behandlung.

**8 · Wer sieht meine Adresse?**
Nur dein gebuchter Profi, und erst, wenn der Termin bestätigt ist. Nach dem Termin wird sie wieder ausgeblendet.

**9 · Was ist die SOMA-Garantie?**
Stimmt etwas nicht, meldest du es bis {48} Stunden nach dem Termin über deine Buchung. Bis zur Klärung halten wir die Auszahlung an den Profi zurück und finden mit dir eine Lösung: Nachbesserung, Gutschrift oder Erstattung.

**Data bindings:**
- {24 Stunden}, {15}, {50 %}, {2 Stunden} → `terms.cancellationPolicy`
- {48} → `terms.disputeWindowHours`
- the documents list → `terms.baseRequiredDocuments`
- the service-fee sentence only when `terms.customerServiceFeeCents === 0`
- the cities → active cities

**Payment wording.** If the SetupIntent flow ships, the payment answer changes (`BRAND_VOICE.md` § 7.11).

---

## 07 · Final brand moment: SOMA *(v1 10, unchanged)*
**Intent:** return to the core message and close with both audiences.

| Element | Copy |
|---|---|
| Statement | **SOMA.** |
| Tagline (`lang="en"`) | **Your body. Your place.** |
| German line | Du bleibst. Dein Profi kommt. |
| Customer CTA | **Freie Termine finden** → `/suche` (with `?plz={stored PLZ}` when the entry already holds one) |
| Provider CTA | **Profi werden** → `/pro/registrieren` |

### Footer
| Column | Links |
|---|---|
| Behandlungen | the seven categories → `/behandlungen/{slug}` · Alle Behandlungen |
| Städte | {the six cities} → `/staedte/{slug}` · Alle Städte |
| Für Profis | Profi werden → `/pro/registrieren` · SOMA für Profis → `/fuer-profis` · Anmelden für Profis → `/anmelden?next=/pro` |
| Hilfe | Hilfe & häufige Fragen · Stornierung · So sortieren wir (`/ranking`) · {Support-Adresse} |
| Rechtliches | Impressum · Datenschutz · AGB · AGB für Profis *(new in the footer; the page exists)* · Widerrufsbelehrung · Cookie-Einstellungen |

**Footer base line:** SOMA · Beauty & Wellness. Bei dir. · © {Jahr} SOMA · SOMA vermittelt Termine mit selbstständigen Profis.

---

## Appendix: retired lines (do not reuse)
- Wellness, die zu Ihnen kommt.
- Wo dürfen wir Sie verwöhnen?
- Your wellness. Your place.
- Schon da.
- Jetzt entdecken
- Professional werden
- Finde dein persönliches Treatment.
- Du bringst das Können. Wir die Kundschaft.
