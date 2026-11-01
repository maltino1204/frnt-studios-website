# SOMA: Brand Voice

*Brand Strategist · phase B1 · 1 Nov 2026 · v1.0 · German is the primary language*
*Strategy: `brand/BRAND_STRATEGY.md`. Landing copy: `brand/COPY_DECK_LANDING.md`.*

This guide is written in English for the team; every sample is the German text to ship. Samples contain real non-breaking spaces (U+00A0) where §4 requires them, so copy them as they are. Every sample was checked against the product as built: cancellation tiers and the Bedenkzeit (`src/server/domain/cancellation.ts`), the Start-Code (`reference.ts`), payment reserved at booking and charged after the appointment (`payments/stripe.ts`, `booking-engine.ts`), and verification (`base-seed-data.ts`). Numbers shown in examples (54 €, 84 €) are illustrations; in the product they always come from data.

---

## 1. Address: *du* for customers

### 1.1 Decision
SOMA addresses **customers and providers with *du***, written in **lowercase** (*du, dich, dir, dein, euch*) in every channel, e-mails included. This reverses product spec §15 (*Sie* for customers).

### 1.2 Reasons
1. **The client chose the register.** All four of the client's German sample lines and the landing brief's steps use *du* ("Zeit für dich", "Bei dir", "Dein Moment", "Finde dein …", "Dein Professional kommt zu dir").
2. **The tagline needs it.** "Your body. Your place." is possessive and close. Its natural German carrier is *dein*. "Ihr Körper. Ihr Ort." is stiff and ambiguous, because *Ihr* means your, her or their.
3. **The audience.** For urban, design-conscious adults aged 25–55, *du* is the prevailing register of contemporary German lifestyle, beauty and tech brands. The service itself is personal (hands, skin, someone's home). Formal distance in the copy would contradict the closeness of what we sell.
4. **One voice.** Providers already use *du*, so one register across SOMA and SOMA Pro removes a whole class of inconsistencies.
5. **Mobile-first.** *du* strings are shorter: „Bitte gib deine Postleitzahl ein.“ (33 characters) vs „Bitte geben Sie Ihre Postleitzahl ein.“ (38).

### 1.3 Spec §15 counter-arguments, answered
| Argument for *Sie* | Answer |
|---|---|
| Premium hotels and spas say *Sie* | SOMA is a lifestyle brand between three worlds, not a hotel. We borrow hospitality's *discretion and precision*, not its pronoun |
| Hotel, corporate and 50+ customers expect *Sie* | Hotel guests get the English UI in v1.1. Corporate correspondence stays *Sie* (exception below). For older customers, the tone stays courteous, with no slang. We accept a small loss at the edge of the target group |
| A stranger enters a private home | Respect is shown by what we do (address only after confirmation, Start-Code, preparation notes) and by how we write (no slang, no innuendo). **At the door, Profis say *Sie* until the customer offers *du*** (onboarding guidance, §7.9) |
| It differentiates from jeff (*du*) | Differentiation comes from substance: verification, total price, design. A pronoun is not a position |

### 1.4 Exceptions
- **Statutory legal templates stay verbatim.** The *Muster-Widerrufsbelehrung* and the *Muster-Widerrufsformular* use *Sie*, and their exact wording carries legal protection. Other legal texts (AGB, Datenschutz) use a neutral third person, as the lawyer decides. Never mix *du* and *Sie* inside one document.
- **The withdrawal-consent checkbox** is in the first person („Ich verlange ausdrücklich …“) and stays unchanged.
- **B2B correspondence** with organisations (hotels, companies, press, authorities) uses *Sie* until *du* is offered.
- **Human support** defaults to *du*. If a customer writes formally, the agent may mirror *Sie* in that thread.

### 1.5 Rules
- Lowercase *du/dein* everywhere (Duden standard). Never mix *du* and *Sie* on one surface.
- Greeting: „Hallo Julia,“. Never „Hey“, never „Liebe/r“.
- Imperatives: use the short form where natural (*gib, nimm, wähl, prüf, schau, tipp*). Keep the *-e* where the stem needs it (*melde, öffne, bestätige, sammle*).
- **Avoid pronouns for Profis.** Repeat the name: „Anna antwortet bis 11:00 Uhr.“ This avoids gender assumptions, and a sentence-initial *Sie* (she) would be misread as formal *you*.

---

## 2. Voice principles

| # | Principle | Do | Don't |
|---|---|---|---|
| 1 | **Konkret statt blumig.** Name the treatment, place, time and price | „Shellac-Maniküre, 60 Min., Do., 12. Nov., 18:30 Uhr – 54 € inkl. Anfahrt.“ | „Gönn dir ein unvergessliches Beauty-Erlebnis.“ |
| 2 | **Ruhig statt laut.** No exclamation marks, no urgency, no superlatives | „Am Donnerstag ab 18:00 Uhr frei.“ | „Schnell sein – nur noch heute!“ |
| 3 | **Genau und wahr.** Deadlines as dates, fees as amounts | „Kostenlos stornierbar bis Mi., 11. Nov., 18:30 Uhr.“ | „Flexibel stornieren – jederzeit.“ |
| 4 | **Nah, nicht kumpelhaft.** *du* with good manners | „Schön, dass du da bist.“ | „Hey du, Lust auf Nägel?“ |
| 5 | **Diskret.** Describe the treatment, never the body | „Ganzkörpermassage mit warmem Öl und ruhigen Griffen.“ | „Lass dich von sinnlichen Händen verwöhnen.“ |
| 6 | **Der Profi handelt, SOMA vermittelt.** Credit the person, keep the agency model straight | „Anna kommt um 18:30 Uhr. Zahlung und Fristen laufen über SOMA.“ | „Wir kommen zu dir.“ · „Unsere Masseurin …“ |
| 7 | **Wellness, nicht Medizin.** Describe care and sensation, never effects on health | „Für ein gutes Körpergefühl nach einem langen Tag.“ | „Löst Verspannungen und lindert Rückenschmerzen.“ |

## 3. Tone by context

| Context | Tone | Length | Example |
|---|---|---|---|
| Brand and campaign | Evocative, concrete, one image | Headline ≤ 8 words, body ≤ 2 sentences | „Nach der Massage: schon zu Hause.“ |
| Product UI | Functional, verb first | Labels of 1–3 words | „Termin stornieren“ |
| Transactional | Facts first, then reassurance | Subject ≤ 45 characters | „Dein Termin ist bestätigt“ |
| Errors | What happened → what was *not* affected → what to do | ≤ 2 sentences | „Die Zahlung hat nicht geklappt. Belastet wurde nichts.“ |
| Price and legal | Exact and complete; no tone | As needed | „Zahlungspflichtig buchen · 84 €“ |
| SOMA Pro | A peer; efficient; respectful of their business | Short | „Neue Anfrage. Antworte bis 15:10 Uhr.“ |
| Support (human) | First person singular, signed with a name | Short paragraphs | „Ich habe mir deine Buchung angesehen …“ |

---

## 4. Grammar and typography

| Topic | Rule | Example |
|---|---|---|
| Quotes | German „…“ (U+201E/U+201C), nested ‚…‘. English lines use “…” | „Sofort bestätigt“ |
| Apostrophe | ’ (U+2019), never ' | So funktioniert’s · gibt’s |
| Dash | Gedankenstrich: en dash with spaces („ – “). Ranges: en dash without spaces. Never a hyphen or an em dash | 18:00–19:30 Uhr · 1–3 Werktage |
| Ellipsis | One character …; a space before it in loading states | Termin wird reserviert … |
| **NBSP** (U+00A0) | Between a number and its unit: Uhr, Min., Std., Minuten, Stunden, Tage, €, %, km, m. After §. Inside z. B., d. h., ca. In short dates and floor numbers | 18:30 Uhr · 15 Min. · 84 € · 50 % · § 19 UStG · z. B. · 12. Nov. · 3. OG · 2 × 3 m |
| Time | 24-hour clock. „18:30 Uhr“ in sentences; „18:30“ alone in chips, tables and Ortszeilen. Never „18.30“ or „6:30 pm“ | Do., 12. Nov., 18:30 Uhr |
| Date | Short: „Do., 12. Nov.“; long: „Donnerstag, 12. November 2026“; „heute“ and „morgen“ where they help | — |
| Price | Marketing: whole euros („84 €“, „ab 45 €“). Transactional: exact („84,00 €“). Thousands with a dot („1.250 €“). Never „€ 84“, „84,-“ or „EUR“. Where a PLZ is known, always the Endpreis; „ab“ only on category and SEO pages | 54 € inkl. Anfahrt |
| Percent | „50 %“ with NBSP | — |
| Duration | UI: „60 Min.“, „2 Std.“, „60 / 90 Min.“. Prose: „60 Minuten“ | — |
| Numbers | Digits in UI and body text. Headlines may spell out one to twelve. Ratings with a comma, count in brackets | Sieben Behandlungen. · ★ 4,9 (87) |
| Codes | PLZ: 5 digits, no space. Start-Code: 4 digits. Booking number: „SM-7KX4Q2“ | — |
| Punctuation | Headlines end with a full stop. **No exclamation marks anywhere.** Question marks only for real questions | — |
| Capitals | German orthography; *du* lowercase; SOMA in capitals; hyphenated brand compounds (SOMA-Garantie, SOMA-Guthaben, Start-Code); product name „SOMA Pro“ without a hyphen | — |
| Ampersand | Only in names; „und“ in sentences | Haare & Styling · Beauty & Wellness |
| Word order | Always „Beauty & Wellness“, never „Wellness & Beauty“ | — |
| Emoji | Never, in any channel | — |
| Abbreviations | Avoid in prose. In UI allowed: inkl., zzgl., Min., Std., Nr., Zimmernr., PLZ, OG | — |
| Hyphenation | Soft hyphens in long compounds at display sizes | Wimpern­verlängerung |

## 5. Gendering
- **Neutral nouns first:** *Profi, Kundschaft, Person, alle*. Use *Team* only for SOMA's own staff.
- **Customer copy avoids most gender forms** through *du* and the Profi's name.
- **Where a role must be named in long-form,** use pair forms and alternate their order: „Kosmetikerinnen und Kosmetiker“.
- **No colon, asterisk or underscore forms** in UI, marketing or e-mails. They hurt readability at display sizes and are read out inconsistently by screen readers, and neutral nouns make them unnecessary. Legal texts follow the lawyer.
- **No assumed genders:** never „deine Masseurin“; write „dein Profi“ or the name.

---

## 6. Glossary

### 6.1 Preferred
| Use | Instead of |
|---|---|
| Behandlung · the service name | Treatment, Anwendung (UI), Session |
| Termin | Appointment, Slot (in copy) |
| Profi · the name | Professional, Experte, Dienstleister, Mitarbeiter, Masseur |
| kommt zu dir · bei dir zu Hause, im Hotel, im Büro | Hausbesuch, mobiler Service, überall, vor Ort |
| Endpreis inkl. Anfahrt | „ab“-Preis (in search), Preis zzgl. Gebühren |
| kostenlos stornierbar bis {Datum, Uhrzeit} | flexibel stornieren |
| geprüft · *Verifiziert* (badge only) | handverlesen, kuratiert, zertifiziert |
| Kundschaft (SOMA Pro) | Kunde/Kundin, Kund:innen |
| entspannend, wohltuend, gepflegt, frisch, warm | heilend, therapeutisch, regenerierend |
| Körpergefühl, Ruhe, Wärme, Hände, Haut | Energie, Balance, Detox |
| Routine, fester Termin | Ritual |
| buchen · anfragen · zusagen · absagen · stornieren | — |

### 6.2 Avoid (style)
| Avoid | Replace with |
|---|---|
| Luxus, luxuriös, exklusiv, Premium, edel | Show it through detail and material |
| Erlebnis, Experience | Name the treatment |
| verwöhnen, sich etwas gönnen, Auszeit, abschalten, Me-Time, die Seele baumeln lassen | A concrete benefit: „Nach der Massage: schon zu Hause.“ |
| einfach, ganz einfach, ganz entspannt | Show the steps |
| „Jetzt …“, „Hier klicken“, „Los geht’s“ in CTAs | Verb + object |
| Hey, Yay, mega, easy | Hallo, gern |
| Pflege zu Hause (reads as nursing care) | Beauty & Wellness bei dir |
| mobile Massage (in brand lines; SEO pages may use it) | Massage bei dir |
| Concierge (customer copy) | — (internal positioning only) |

### 6.3 Banned (legal or truth)
| Area | Banned | Why |
|---|---|---|
| Health (HWG) | heilen/Heilung, lindern, Therapie/therapeutisch, Physiotherapie, Podologie, Lymphdrainage, medizinisch (allowed only in disclaimers: „keine medizinische Behandlung“), Schmerzen, Beschwerden, Krankheit, Verspannungen lösen, „gegen …“, Detox/entgiften, Immunsystem, Anti-Aging | Healing or relief claims for non-medical services. The provider-text lint (`content-lint.ts`) enforces the core list |
| Protected titles | Physiotherapeut/in, Masseur und medizinischer Bademeister, Podologe/Podologin, medizinische Fußpflege; „Masseur/Masseurin“ for Profis | Protected or misleading for unverified holders |
| Sexual connotation | sinnlich, intim, erotisch, prickelnd, verführerisch, Happy End, Tantra, Body-to-Body | Massage category; zero tolerance |
| Truth | garantiert (except the defined *SOMA-Garantie*), sofort verfügbar, „in 60 Minuten bei dir“, rund um die Uhr, 24/7, überall, deutschlandweit, Nr. 1, die besten, handverlesen, kuratiert, zertifiziert, „versichert über SOMA“, „mit Führungszeugnis“, „bis zu … € verdienen“, 100 % sicher, risikofrei | Not true or not built (strategy §7.3) |
| Employment | Mitarbeiter, Angestellte, „unser Team“ / „unsere Profis“ (for Profis), Partner, Schicht, Auftrag, Job | Agency model; self-employment status ⚖ |
| Pharma (the name) | Dosis, Pille, Rezept, „Glück auf Knopfdruck“ | Name associations (strategy §9) |

---

## 7. Sample library

### 7.1 Headlines
**Customer**
1. Your body. Your place.
2. Du bleibst. Dein Profi kommt.
3. Nach der Massage: schon zu Hause.
4. Geprüft, bevor es klingelt.
5. Der Endpreis steht, bevor du buchst.
6. Zu Hause. Im Hotel. Im Büro.
7. Sieben Behandlungen. Ein Ort: deiner.
8. Deine Adresse sieht nur dein Profi.
9. Zimmer 614, 21:10 Uhr.
10. Drei Wochen später. Gleicher Profi, gleiche Adresse.
11. Die Stunde gehört der Behandlung. Nicht dem Weg dorthin.

**SEO and category pages:** „Massage bei dir zu Hause in Berlin.“ · „Maniküre, die zu dir kommt.“

**Provider**
1. Dein Können. Deine Preise. Deine Zeiten.
2. Selbstständig, aber nicht allein.
3. Bezahlt wird über SOMA. Nicht an der Tür.
4. Bring deine Stammkundschaft mit. Für 5 %.

### 7.2 Service descriptions (all 7 categories)
Each category has a **tile line** (≤ 6 words), a **category text** (≤ 2 sentences), **one sample service** and a **preparation note**. Every qualification named here is a document the product requires (`base-seed-data.ts`).

| Category | Tile line | Category text |
|---|---|---|
| **Massage** | Klassisch, Aromaöl, Hot Stone. | Wellnessmassagen von geprüften Profis – klassisch, mit Aromaöl, Hot Stone oder kurz für Rücken und Nacken. Liege, Öl und Tücher kommen mit. |
| **Maniküre** | Von klassisch mit Lack bis Gel. | Klassisch mit Lack, Shellac oder Gel-Modellage – von Profis mit Kurszertifikat. Ein Tisch mit gutem Licht genügt. |
| **Pediküre** | Kosmetische Fußpflege im eigenen Sessel. | Kosmetische Pediküre – klassisch, mit Shellac oder mit Fußmassage. Keine medizinische Fußpflege. |
| **Kosmetik** | Gesichtsbehandlungen und Waxing. | Gesichtsbehandlungen und Waxing von Profis mit Kosmetikausbildung – mit professionellen Produkten, an einem ruhigen Platz bei dir. |
| **Haare & Styling** | Föhnen, Schnitt, Hochsteckfrisur. | Föhnen, Haarschnitt und Hochsteckfrisur von Profis mit Meisterbrief oder Eintragung in die Handwerksrolle. |
| **Brows & Lashes** | Lifting, Lamination, Verlängerung. | Augenbrauen und Wimpern von Profis mit Kurszertifikat. Einen Verträglichkeitstest stimmst du auf Wunsch vorab mit deinem Profi ab. |
| **Make-up** | Für Büro, Abend und Hochzeit. | Make-up für den Alltag, besondere Abende und deinen großen Tag – zu Hause oder im Hotel. Für Braut-Make-up gibt es eine eigene Probe. |

| Sample service | Description | Preparation note |
|---|---|---|
| **Entspannungsmassage (klassisch)** · 60 / 90 Min. | Ganzkörpermassage mit warmem Öl und ruhigen, fließenden Griffen. Für ein gutes Körpergefühl nach einem langen Tag. *Wellnessanwendung, keine medizinische oder physiotherapeutische Behandlung.* | Etwa 2 × 3 m freie Fläche für die Liege. Alles andere bringt dein Profi mit. |
| **Shellac-Maniküre** · 60 Min. | Nägel in Form, Nagelhaut gepflegt, Shellac in deiner Farbe. Glänzt bis zu drei Wochen. | Ein Tisch am Fenster ist ideal. Werkzeug, Lacke und Lampe bringt dein Profi mit. |
| **Wellness-Pediküre mit Fußmassage** · 75 Min. | Fußbad, Peeling, Nägel in Form, Maske – und zum Schluss eine entspannende Fußmassage. | Ein bequemer Sessel und etwas Platz davor. Fußbad und Handtücher kommen mit. |
| **Klassische Gesichtsbehandlung** · 60 Min. | Reinigung, Peeling, Ausreinigung, Maske und Pflege – abgestimmt auf deine Haut. | Ein ruhiger, gut beleuchteter Platz genügt. |
| **Föhnen & Styling** · 45 Min. | Waschen, föhnen, stylen – glatt, mit Wellen oder mit Volumen. Bevor der Abend beginnt. | Ein Stuhl an einem Platz, an dem Haare fallen dürfen – etwa Küche oder Bad. |
| **Wimpernlifting inkl. Färben** · 60 Min. | Natürlich geschwungene, dunklere Wimpern – ganz ohne Verlängerung. | Ein Platz zum Zurücklehnen und gutes Licht. |
| **Braut-Make-up Probe** · 75 Min. | Gemeinsam findet ihr deinen Look für den großen Tag – in Ruhe und ohne Zeitdruck. | Ein Stuhl mit Tageslicht. Das komplette Set bringt dein Profi mit. |

### 7.3 CTAs
Rules: verb + object, ≤ 3 words, no „Jetzt“, no exclamation mark. Where money moves, the button says so and shows the amount.

| Context | CTA | Target |
|---|---|---|
| Booking entry (submit) | **Freie Termine finden** | `/suche?plz=…&kategorie=…&leistung=…&datum=…&zeit=…` |
| Persistent navigation | **Termin finden** | `#termin` (booking entry) |
| Category | **Massage entdecken** | `/behandlungen/massage` |
| All categories | **Alle Behandlungen** | `/behandlungen` |
| Explainer | **So funktioniert’s** | anchor |
| Slot chip | „Do. 18:30“ (the time *is* the CTA) | `/buchen?angebot=…&start=…` |
| Profile | **Profil ansehen** | `/profis/{slug}` |
| Checkout (legal, fixed) | **Zahlungspflichtig buchen · 84 €** / **Zahlungspflichtig anfragen · 84 €** | — |
| Booking | Zum Kalender hinzufügen · Termin stornieren · Anfrage zurückziehen · Termin behalten · Problem melden · Erneut buchen · Wieder bei Anna buchen | — |
| Review | Bewertung senden | — |
| Waitlist | Benachrichtigen | — |
| Provider | **Profi werden** (`/pro/registrieren`) · Konditionen ansehen (`/fuer-profis#provision`) · Weiter einrichten · Nachweis hochladen · Annehmen · Ablehnen · Start-Code eingeben · Abschließen · Einnahmen ansehen | — |

### 7.4 Form labels and helper text
„(optional)“ follows the label; required is the default. Never mark fields with asterisks.

| Field | Label | Helper or placeholder |
|---|---|---|
| Location (entry) | Wo? *(screen-reader text: Postleitzahl)* | PLZ, z. B. 10115 · button: Standort verwenden |
| Service (entry) | Was? | Alle Behandlungen |
| Time (entry) | Wann? | So bald wie möglich · Heute · Morgen · Datum wählen · Morgens 7–12 · Nachmittags 12–17 · Abends 17–22 |
| Place (checkout heading) | Wo findet dein Termin statt? | Zuhause · Hotel · Büro |
| First and last name | Vorname · Nachname | — |
| E-mail | E-Mail | Hierhin schicken wir deine Bestätigung und den Link, mit dem du später ein Passwort festlegst. |
| Mobile | Mobilnummer | Nur für Rückfragen am Termintag. Dein Profi sieht sie erst nach der Bestätigung. |
| Address | Straße · Nr. · PLZ · Ort | — |
| Home | Etage (optional) · Klingelname | z. B. 3. OG, Hinterhaus |
| Hotel | Hotelname · Zimmernr. (optional) · Name an der Rezeption | Falls schon bekannt · Unter diesem Namen fragt dein Profi an der Rezeption nach. |
| Office | Firma · Empfang oder Etage | — |
| Notes | Hinweise zur Anfahrt (optional) | z. B. Parkplatz im Hof, Aufzug, Hund in der Wohnung. Bitte keine Telefonnummern oder Links. |
| Massage | ☐ Platz für eine Massageliege (ca. 2 × 3 m) ist vorhanden. | — |
| Credit | SOMA-Guthaben verwenden | — |
| Withdrawal consent (legal) | Ich verlange ausdrücklich, … *(unchanged)* | — |

### 7.5 Empty states
| Where | Title | Body | Action |
|---|---|---|---|
| Search, nothing on that day | Am Do., 12. Nov. ist in 10435 niemand frei. | An diesen Tagen gibt es noch freie Termine: | Day chips (as in `/suche` today) |
| Search, no supply in the PLZ | In 12345 gibt es noch keine Profis auf SOMA. | Sollen wir dir Bescheid geben, sobald es losgeht? | E-Mail field + **Benachrichtigen** → „Eingetragen. Wir melden uns, sobald Profis in 12345 buchbar sind.“ |
| Bookings | Noch keine Termine. | Wenn du buchst, findest du hier Zeit, Ort, Start-Code und Stornofrist. | Behandlungen entdecken |
| Favourites | Noch keine Favoriten. | Tipp bei einem Profil auf das Herz – dann findest du es hier wieder. | — |
| Credit | Noch kein Guthaben. | Guthaben aus Empfehlungen und Gutschriften erscheint hier. | Empfehlen |
| Inbox | Keine neuen Nachrichten. | — | — |
| SOMA Pro · requests | Keine offenen Anfragen. | Neue Anfragen erscheinen hier – mit Antwortfrist. | — |
| SOMA Pro · reviews | Noch keine Bewertungen. | Nach deinen ersten Terminen kann deine Kundschaft dich bewerten. | — |
| SOMA Pro · earnings | Noch keine Einnahmen. | Nach deinem ersten abgeschlossenen Termin siehst du hier Betrag, Provision und Auszahlung. | — |

### 7.6 Error states
Strings marked ⓔ are used by the E2E suite; keep their wording exactly.

| Case | Title | Body | Action |
|---|---|---|---|
| **Network / offline** | Gerade keine Verbindung. | Deine Termine sind gespeichert. Sobald du wieder online bist, geht es hier weiter. | Erneut versuchen |
| Generic | Das hat gerade nicht geklappt. | Bitte versuch es in einem Moment noch einmal. *(+ Fehlercode)* | Erneut versuchen |
| **Slot taken** | Dieser Termin wurde gerade vergeben. ⓔ | Wähl bitte eine andere Uhrzeit. Es wurde nichts gebucht oder belastet. | Andere Zeiten ansehen |
| Hold expired | Deine Reservierung ist abgelaufen. | Während du bezahlst, halten wir den Termin 10 Minuten für dich frei. Belastet wurde nichts. | Termin neu wählen |
| **Payment failed** | Die Zahlung hat nicht geklappt. | Belastet wurde nichts. Prüf deine Angaben oder versuch es mit einer anderen Karte. | Erneut bezahlen |
| Outside radius | Diese Adresse liegt außerhalb von Annas Einsatzgebiet. | Wähl eine andere Adresse oder einen Profi, der zu dir kommt. | Andere Profis finden |
| Booking not found | Diese Buchung finden wir nicht. ⓔ | Prüf den Link oder melde dich mit dem Konto an, mit dem du gebucht hast. | Anmelden |
| 404 | Seite nicht gefunden. | Vielleicht ist der Link veraltet. | Zur Startseite |
| Location denied | — | Dein Gerät gibt keinen Standort frei. Bitte gib deine Postleitzahl ein. | — |

**Validation (inline)**
- PLZ: „Bitte gib deine Postleitzahl ein.“ · „Bitte gib eine fünfstellige Postleitzahl ein.“ · „Diese Postleitzahl kennen wir nicht. Bitte prüf die Eingabe.“ ⓔ (first sentence)
- Fields: „Bitte gib eine gültige E-Mail-Adresse ein.“ · „Bitte gib eine gültige Mobilnummer an.“ · „Bitte gib deinen Vornamen an.“ · „Bitte gib die Hausnummer an.“
- Summary: „Bitte prüf die markierten Angaben.“ ⓔ *(the test changes with the migration)*
- Consent: „Bitte bestätige, dass die Behandlung vor Ablauf der Widerrufsfrist beginnen darf.“
- Contact lint (customer notes): „Kontaktdaten wie Telefonnummern, E-Mail-Adressen oder Profile sind in den Hinweisen nicht erlaubt. Für Rückfragen am Termintag sieht dein Profi nach der Bestätigung deine Mobilnummer.“

### 7.7 Notifications
In-app notifications exist today. Push and SMS are not built; they will reuse these strings. Titles ≤ 40 characters, bodies ≤ 100.

| Event | Title | Body |
|---|---|---|
| Confirmed (instant) | Dein Termin ist bestätigt | Shellac-Maniküre mit Anna, Do., 12. Nov., 18:30 Uhr. Dein Start-Code steht in der Buchung. |
| Request sent | Deine Anfrage ist bei Anna | Anna antwortet bis Sa., 14. Nov., 11:00 Uhr. Bis dahin wird nichts belastet. |
| Request accepted | Anna hat zugesagt | Dein Termin am Sa., 21. Nov., 10:00 Uhr steht. Der Start-Code ist jetzt in der Buchung. |
| Request declined | Anna kann leider nicht | Die Reservierung auf deiner Karte ist aufgehoben. Andere Profis haben vielleicht Zeit. |
| Request expired | Deine Anfrage ist abgelaufen | Anna hat nicht rechtzeitig geantwortet. Belastet wurde nichts. |
| Reminder 24 h | Morgen, 18:30 Uhr: Shellac-Maniküre | Anna kommt zu dir. Ein Tisch mit gutem Licht genügt. |
| Profi cancelled | Anna hat deinen Termin abgesagt | Dir entstehen keine Kosten. Andere Profis findest du in deiner Buchung. |
| Completed | Wie war deine Maniküre mit Anna? | Deine Bewertung hilft anderen bei der Wahl. Du hast 14 Tage Zeit. |
| Referral credit | Deine Empfehlung hat sich gelohnt | 15 € SOMA-Guthaben sind gutgeschrieben. |
| *Pro:* new request | Neue Anfrage: Shellac-Maniküre | Do., 12. Nov., 18:30 Uhr in 10435 Berlin. Antworte bis heute, 15:10 Uhr. |
| *Pro:* confirmed | Termin bestätigt: Shellac-Maniküre | Do., 12. Nov., 18:30 Uhr bei Julia in Berlin. Die Adresse steht jetzt im Termin. |
| *Pro:* cancelled | Termin storniert: Shellac-Maniküre | Do., 12. Nov., 18:30 Uhr. Dir steht ein Anteil der Stornogebühr zu. |
| *Pro:* review | Neue Bewertung: 5 von 5 Sternen | Schau sie dir an und antworte, wenn du magst. |
| *Pro:* approved | Du bist freigeschaltet | Dein Profil ist jetzt sichtbar und buchbar. |

### 7.8 Transactional e-mails (customer)
**Shared footer** (all customer e-mails):
> Buchungsnummer SM-7KX4Q2 · Fragen? Schreib uns an {Support-Adresse} und nenn deine Buchungsnummer.
> SOMA vermittelt diesen Termin. Vertragspartner für die Behandlung ist Anna K. (selbstständig).

**E1 · Booking confirmed (Sofort bestätigt)**
- Betreff: **Dein Termin ist bestätigt**
- Vorschau: Shellac-Maniküre mit Anna, Do., 12. Nov., 18:30 Uhr
> Hallo Julia,
> dein Termin steht.
>
> **Shellac-Maniküre** · 60 Min.
> Do., 12. Nov., 18:30 Uhr · Zuhause, Kastanienallee 12, 10435 Berlin · mit Anna K.
>
> Gesamtpreis 54,00 € inkl. Anfahrt. Der Betrag ist auf deiner Karte reserviert und wird erst nach dem Termin belastet.
> Kostenlos stornierbar bis Mi., 11. Nov., 18:30 Uhr.
>
> Dein Start-Code steht in deiner Buchung. Nenn ihn Anna an der Tür – damit beginnt der Termin.
> Zur Vorbereitung: Ein Tisch mit gutem Licht genügt. Werkzeug, Lacke und Lampe bringt Anna mit.
>
> [Buchung ansehen] [Zum Kalender hinzufügen]

**E2 · Request sent (Auf Anfrage)**
- Betreff: **Deine Anfrage ist bei Anna**
- Vorschau: Antwort bis Sa., 14. Nov., 11:00 Uhr – bis dahin wird nichts belastet
> Hallo Aylin,
> deine Anfrage für **Braut-Make-up Probe** (75 Min.) am Sa., 21. Nov., 10:00 Uhr ist bei Anna.
>
> Anna antwortet bis spätestens Sa., 14. Nov., 11:00 Uhr. Bis dahin ist die Zeit für dich geblockt. Der Betrag von 89,00 € ist nur reserviert – belastet wird erst nach dem Termin.
> Sagt Anna ab oder antwortet nicht rechtzeitig, heben wir die Reservierung auf. Bis zur Zusage kannst du deine Anfrage jederzeit kostenlos zurückziehen.
>
> [Anfrage ansehen]

**E3 · Request accepted**
- Betreff: **Anna hat zugesagt**
- Vorschau: Dein Termin am Sa., 21. Nov., 10:00 Uhr steht
> Hallo Aylin,
> Anna hat deine Anfrage angenommen. Dein Termin steht:
> **Braut-Make-up Probe** · Sa., 21. Nov., 10:00 Uhr · Zuhause, 50823 Köln
>
> Kostenlos stornierbar bis Fr., 20. Nov., 10:00 Uhr. Dein Start-Code steht jetzt in deiner Buchung.
>
> [Buchung ansehen] [Zum Kalender hinzufügen]

**E4 · Request declined**
- Betreff: **Anna kann den Termin leider nicht wahrnehmen**
- Vorschau: Belastet wurde nichts.
> Hallo Aylin,
> Anna kann deine Anfrage für Sa., 21. Nov., 10:00 Uhr leider nicht annehmen.
> Annas Nachricht: „Ich bin an diesem Vormittag leider schon gebucht.“
>
> Die Reservierung auf deiner Karte haben wir aufgehoben – belastet wurde nichts. Ob andere Profis zur selben Zeit frei sind, siehst du in deiner Buchung.
>
> [Andere Profis finden]

**E5 · Reminder (24 h before)**
- Betreff: **Morgen, 18:30 Uhr: Shellac-Maniküre mit Anna**
- Vorschau: Ein Tisch mit gutem Licht genügt
> Hallo Julia,
> morgen ist es so weit: Do., 12. Nov., 18:30 Uhr, Kastanienallee 12, 10435 Berlin.
>
> Zur Vorbereitung: Ein Tisch mit gutem Licht genügt, am besten am Fenster.
> Am Termin: Nenn Anna deinen Start-Code – du findest ihn in deiner Buchung.
> Musst du absagen? Was jetzt gilt, zeigen wir dir vor dem Stornieren in deiner Buchung.
>
> [Buchung ansehen]

**E6 · Cancellation with a fee** (customer cancels between 24 h and 2 h before)
- Betreff: **Dein Termin ist storniert**
- Vorschau: Stornogebühr 42,00 € – den Rest der Reservierung geben wir frei
> Hallo Julia,
> du hast deinen Termin storniert: **Entspannungsmassage (klassisch)** · 60 Min. · Fr., 13. Nov., 19:30 Uhr.
>
> Die Stornierung kam weniger als 24 Stunden vor dem Termin. Deshalb fallen 50 % des Behandlungspreises an; die Anfahrt zahlst du nicht.
>
> | | |
> |---|---|
> | Behandlung 84,00 € · davon 50 % | 42,00 € |
> | Anfahrt 10,00 € | 0,00 € |
> | **Belastet** | **42,00 €** |
> | Freigegeben | 52,00 € |
>
> Wann die Freigabe auf deinem Konto sichtbar ist, hängt von deiner Bank ab. Der Großteil der Gebühr geht an Anna, die die Zeit für dich freigehalten hat.
>
> [Buchung ansehen]

*Note: under 2 h before or on a no-show, the copy becomes „… fallen der volle Behandlungspreis und die Anfahrt an.“ Within the 15-min Bedenkzeit or ≥ 24 h before: „Die Stornierung ist kostenlos. Die Reservierung über 94,00 € geben wir vollständig frei.“*

**E7 · Review request**
- Betreff: **Wie war deine Massage mit Anna?**
- Vorschau: Deine Bewertung hilft anderen bei der Wahl
> Hallo Julia,
> wie war deine Entspannungsmassage am Fr., 20. Nov.? Bewerten kann nur, wer wirklich gebucht hat – deshalb zählt deine Stimme. Du hast dafür 14 Tage Zeit.
>
> [Termin bewerten]
>
> War etwas nicht in Ordnung? Melde es bis So., 22. Nov., 20:30 Uhr über „Problem melden“ in deiner Buchung. Dann greift die SOMA-Garantie.
> Wieder bei Anna? [Erneut buchen]

### 7.9 Provider communications (SOMA Pro)

**P1 · Welcome after registration**
- Betreff: **Willkommen bei SOMA Pro**
- Vorschau: Dein Konto steht. Als Nächstes: Leistungen, Einsatzgebiet, Nachweise.
> Hallo Mira,
> schön, dass du da bist. Dein Konto ist angelegt. So geht es weiter:
> 1. Profil, Leistungen und deine Preise
> 2. Einsatzgebiet und Anfahrtspauschale
> 3. Arbeitszeiten
> 4. Nachweise: Ausweis, Gewerbeanmeldung, Berufshaftpflicht und – je nach Kategorie – dein Qualifikationsnachweis
> 5. Auszahlung
>
> Jeder Schritt wird gespeichert. Sichtbar und buchbar bist du, sobald wir deine Nachweise geprüft haben.
>
> [Weiter einrichten]

**P2 · Verification needs something**
- Betreff: **Ein Nachweis braucht noch etwas**
- Vorschau: Berufshaftpflicht: Bitte lade die vollständige Police hoch
> Hallo Mira,
> wir haben deine Unterlagen geprüft. Ein Nachweis braucht noch etwas:
> **Berufshaftpflicht** – „Auf dem Dokument fehlt die Laufzeit. Bitte lade die vollständige Police hoch.“
> Sobald der Nachweis passt, schalten wir dich frei.
>
> [Nachweis hochladen]

**P3 · Payout**
- Betreff: **Auszahlung unterwegs: 312,40 €**
- Vorschau: In der Regel in 1–3 Werktagen auf deinem Konto
> Hallo Mira,
> wir haben 312,40 € an dich ausgezahlt. Das Geld ist in der Regel in 1–3 Werktagen auf deinem Konto.
> Die Aufstellung pro Termin – Betrag, Provision und Anfahrt – findest du unter Einnahmen. Die Anfahrt geht immer vollständig an dich.
>
> [Einnahmen ansehen]

**P4 · Onboarding card „Am Termin“** (onboarding material; conduct guidance, not a product feature)
> **Am Termin**
> - Pünktlich sein. Wird es knapp, ruf über die Nummer im Termin an (sichtbar, solange der Termin bestätigt ist).
> - Zur Begrüßung *Sie*, bis dir das Du angeboten wird.
> - Erst mit dem Start-Code beginnen.
> - Den Raum so verlassen, wie du ihn vorgefunden hast.

**P5 · Zero-tolerance rule** (*recommended. Not yet in the product or terms; needs a legal and product decision, see strategy §11*)
- Massage checkout: „SOMA vermittelt ausschließlich Wellness- und Beautybehandlungen. Anzügliche Anfragen oder Bemerkungen führen zur Sperrung des Kontos.“
- SOMA Pro: „Fühlst du dich bei einem Termin unwohl, darfst du gehen. Melde es uns – wir kümmern uns darum.“

### 7.10 Gift card line (**future concept**: gift cards are planned for v1.1 and not built; do not show them on the landing page or in the app)
- Line: **„Verschenk eine Stunde, für die niemand das Haus verlassen muss.“**
- Card: „Your body. Your place.“ / „Ein SOMA-Gutschein über 100 € für Lena – einzulösen für jede Behandlung auf SOMA.“ Validity follows the voucher terms (⚖, default 3 years).

### 7.11 Payment wording
- **Today:** „Bei der Buchung wird der Betrag nur reserviert. Belastet wird erst nach dem Termin.“ (Stripe manual capture on completion)
- **If the SetupIntent flow ships** (bookings more than 6 days ahead, `STATUS.md` blocker 3): „Deine Zahlungsart wird bei der Buchung hinterlegt. Belastet wird erst nach dem Termin.“
- **Cash:** „Bezahlt wird ausschließlich online über SOMA – kein Bargeld an der Tür.“
- **Methods:** „Welche Zahlarten dir zur Verfügung stehen, siehst du im Bezahlschritt.“ (Do not list Apple Pay or PayPal until they are verified in production.)

### 7.12 Social captions
No emoji, at most two descriptive hashtags, AI imagery labelled per platform rules, and no fictional Profis presented as real people.

1. *Massage, home.*
   > Altbau, 3. OG · Berlin-Prenzlauer Berg · 19:30
   > Nach der Massage: schon zu Hause.
   > Geprüfte Profis kommen zu dir – mit Liege, Öl und Tüchern. Endpreis inklusive Anfahrt.
2. *Nails, routine.*
   > Drei Wochen später. Gleicher Profi, gleiche Adresse.
   > Mit „Erneut buchen“ sind Profi und Behandlung schon ausgewählt – du wählst nur die Uhrzeit.
3. *Hotel.*
   > Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10
   > Heute ist dein Hotelzimmer dein Ort. Hotel, Zimmernummer, Name an der Rezeption – dein Profi findet dich.
4. *Provider.*
   > Treppenhaus, 2. OG · Berlin-Neukölln · 17:40
   > Selbstständig, aber nicht allein. Auf SOMA legst du Preise, Zeiten und Einsatzgebiet selbst fest.
- **Bio:** „SOMA · Your body. Your place. / Beauty & Wellness. Bei dir – in {Städte}.“

### 7.13 Three ad concepts
| | **A · „Schon zu Hause“** (home, massage) | **B · „Zimmer 614“** (hotel, traveller) | **C · „Dein Kalender“** (supply) |
|---|---|---|---|
| Visual | An Altbau living room after a massage: the table being folded in soft focus, the customer on the sofa under a throw. Ortszeile | A hotel room at blue hour, a Profi's case by the door, the skyline. Ortszeile *Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10* | A Profi's hands packing a nail kit; SOMA Pro *Heute* with a request card (real UI, demo data labelled) |
| Headline | **Nach der Massage: schon zu Hause.** | **Zimmer 614, 21:10 Uhr.** | **Dein Können. Deine Preise. Deine Zeiten.** |
| Copy | Geprüfte Massage-Profis kommen zu dir. Endpreis inklusive Anfahrt, kostenlos stornierbar bis 24 Stunden vorher. | Massage nach dem letzten Termin des Tages – in deinem Hotelzimmer. Hotel und Zimmernummer angeben, dein Profi kommt zu dir. | Werde von Kundschaft in deinem Einsatzgebiet gefunden. Keine Grundgebühr. Bezahlt wird über SOMA – nicht an der Tür. |
| CTA | Freie Termine finden | Freie Termine finden | Profi werden |
| End frame | SOMA · Your body. Your place. | SOMA · Your body. Your place. | SOMA Pro |
| Truth guard | Only in cities and categories with live supply | Only where evening slots exist in that city; the UI is German until v1.1 | No income figures |

---

## 8. Pre-publish checklist
1. Every claim is true today (strategy §7.3).
2. *du* in lowercase, with no *Sie* on the same surface.
3. No banned words (§6.3). Provider texts also pass `content-lint.ts`.
4. Dates, times, prices and units use NBSP; quotes are „…“; no exclamation marks; no emoji.
5. The Profi is named or is „dein Profi“, never „unser“.
6. CTAs are verb + object; the price is on payment buttons.
7. English is limited to the tagline and descriptor.
8. Policy numbers (24 h, 50 %, 15 Min., 48 h, commission) are rendered from data, not hard-coded.
9. AI imagery is labelled.

## 9. Truth audit of current copy (fix in phase B2)
| Where | Current | Issue | Fix |
|---|---|---|---|
| Home trust item and `/hilfe` › Sicherheit | „… und für jede angebotene Behandlung die Qualifikation“ | Make-up requires no qualification document | „… und je nach Kategorie einen Qualifikationsnachweis“ |
| `/fuer-profis` hero | „Du bringst das Können. *Wir die Kundschaft.*“ | Implies guaranteed demand | „Dein Können. Deine Preise. *Deine Zeiten.*“ |
| `/fuer-profis` commission | „Du zahlst nur, wenn ein Termin stattfindet.“ | Commission also applies to retained cancellation fees | „Provision nur auf das, was du über SOMA verdienst.“ |
| `/fuer-profis` FAQ (own clients) | „… du sparst dir Rechnungen und Nachfragen.“ | Automatic invoices are not built | „… du sparst dir Zahlungserinnerungen und Nachfragen.“ |
| `/fuer-profis` steps | „Wir prüfen meist innerhalb von 48 Stunden.“ · „Dauert etwa 15 Minuten“ | Ops target and estimate, not measured | Keep only once ops confirms; otherwise „Wir melden uns, sobald alles geprüft ist.“ |
| Dispute notification | „Wir melden uns innerhalb von 72 Stunden.“ | Ops target | Confirm, or „Wir melden uns, sobald wir den Fall geprüft haben.“ |
| Checkout place heading | „Wo dürfen wir Sie besuchen?“ | SOMA does not visit; the Profi does | „Wo findet dein Termin statt?“ |
| Checkout helpers | „die Fachkraft“ | A second noun for the Profi | The Profi's name, or „dein Profi“ |
| Customer notification on a Profi cancellation | „Sie erhalten den vollen Betrag zurück.“ | Often only a reservation existed | „Dir entstehen keine Kosten.“ |
| Seed hero (`base-seed-data.ts`) | „Wo dürfen wir Sie verwöhnen?“ | Cliché; "wir" implies SOMA performs | Retire (landing copy deck) |
| Home places band | „… und hinterlässt den Raum, wie er war.“ | A conduct promise the product cannot enforce | Move to the Profi onboarding card (P4); customer copy: „… und bringt mit, was die Behandlung braucht.“ |
| `src/lib/brand.ts`, manifest | „Your wellness. Your place.“; *Sie* description; category `"health"` | Retired tagline; medical association | „Your body. Your place.“; DE descriptor; remove `"health"` |
| City intros, hero eyebrow | „Wellness & Beauty …“ | Word order | „Beauty & Wellness …“ |

## 10. Migration notes (*Sie* → *du*, phase B2)
- **Scope:** about 435 *Sie/Ihr/Ihnen* lines in 82 files under `src/app`, `src/components/site`, `src/components/ui` and `src/server`, plus 9 E2E specs. Also the seeded content blocks and category taglines in `scripts/db/lib/base-seed-data.ts`, existing `content_blocks` rows, and `CONTACT_LINT_MESSAGES` (customer variants).
- **Unchanged strings:** legal and first-person strings („Zahlungspflichtig buchen · …“, „Ich verlange ausdrücklich …“) and *du*-neutral strings („Kostenlos stornierbar bis …“, „Diese Postleitzahl kennen wir nicht.“, „Dieser Termin wurde gerade vergeben.“, „Erneut buchen“).

| Current | New | E2E |
|---|---|---|
| Bitte prüfen Sie die markierten Angaben. | Bitte prüf die markierten Angaben. | yes |
| Ihr Start-Code | Dein Start-Code | yes |
| Andere Profis in Ihrer Nähe | Andere Profis in deiner Nähe | yes (regex) |
| Ihre Worte (review field) | Deine Worte | yes |
| Ihre Profis | Deine Profis | — |
| Verfügbare Profis anzeigen | Freie Termine finden | no test found |
| Wellness, die zu Ihnen kommt. | retired → landing copy deck | — |
