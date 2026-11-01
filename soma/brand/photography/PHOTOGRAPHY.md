# SOMA: Photography direction

*Digital Art Director · phase B2 · 1 Nov 2026 · v1.0*
*Linked from `brand/BRAND_GUIDELINES.md` § 7. It replaces the photographic language of `docs/art-direction.md` (v2 era; its ultramarine accent object is retired). The motif and crop geometry are fixed in guidelines § 5.1 and § 5.3.*

| File | Content |
|---|---|
| `PHOTOGRAPHY.md` | This direction: principles, light, grade, crops, skin, casting, places, the Ortszeile, do/don't, AI rules, the launch shoot |
| `AUDIT.md` | The audit of all 131 v1 images: keep / recrop / replace, with findings per image |
| `audit/sheets/*.jpg` | Contact sheets of the v1 set · `audit/recrops-*.jpg` recrop previews · `audit/recrops.json` crop boxes |
| `generation/shotlist-v2.mjs` | The v2 shot list and prompt system (source) → `prompts-v2.json` · `jobs-v2.json` (every Higgsfield job, approved and rejected) · `fetch-list.txt` (new paths for the capture workflow) |
| `v2-contact-sheet.jpg`, `v2-previews/` | The v2 key visuals as reviewed (web-size previews, not the masters) |
| `tools/` | `contact-sheets.mjs`, `recrops.mjs`, `render-audit.mjs`, `add-sources.mjs` |

---

## 0. Status: every current image is a development asset

- All 131 v1 images and all 109 v2 images are **AI-generated** (Higgsfield: `soul_2`, `gpt_image_2_5`). They are for design, prototypes and clearly labelled previews.
- **Labelling.** In the product the demo label stays „Demo-Profil · Foto KI-generiert“. On social and in ads, use the platform's AI label (Meta "AI info", TikTok "AI-generated", LinkedIn C2PA) and the caption suffix „Bild KI-generiert.“ Files carry `ImageDescription: AI-generated development asset` (set by `scripts/images/fetch.mjs`).
- **Never** present an AI face as a real Profi, customer or review. AI people never appear next to a name, a rating or the *Verifiziert* badge.
- Before launch every key image is replaced by commissioned photography (§ 12). The AI set is the reference the photographer shoots against.

---

## 1. Principles

1. **The place is the hero.** Every frame answers *"Where are we?"* within a second: an Altbau window, a hotel skyline, a meeting room over the harbour. At least 30 % of the frame is room.
2. **Care, not spa.** Show the work: hands, tools, a folded table, a towel on a knee. No props that exist only to say "wellness".
3. **Discretion is the composition.** Faces turned away or eyes closed during treatments. Bodies are covered by linen to the shoulder blades or more. Sensuality comes from light and texture, never from skin.
4. **Arrival and after.** The two moments only SOMA has: the Profi at the door, and the customer still on her own sofa afterwards. Prefer them to the treatment itself.
5. **Real time of day.** Morning light in kitchens, overcast noon in offices, blue hour and lamp light in the evening. The time in the Ortszeile matches the light.
6. **One image, one idea.** No collages, no split screens, no props competing with the gesture.

---

## 2. Light

| | Rule |
|---|---|
| Key | Window daylight, soft and directional, from the side. Real shadows with soft edges. |
| Evening | Blue hour outside, one warm practical lamp inside (≈ 2700 K). Warm and cool meet in the frame: this is SOMA's signature light. |
| Offices | Overcast daylight. No downlights, no LED panels in frame. |
| Never | Flash look, ring-light catchlights, high-key white, coloured gels, candlelight as the only source. |

## 3. Grade (Bone highlights, Espresso shadows)

The grade sits *inside* the palette, so photography and UI share one temperature.

| Parameter | Target |
|---|---|
| Highlights | Roll off to **Bone `#F3EFE8`**, never to pure white. Brightest wall ≈ L 94. |
| Shadows | Settle in **Espresso `#25211F`** (warm brown-black), lifted ≈ 6 %. Never crushed to `#000`, never blue. |
| Mid-tones | Stone `#D8CFC3` / Taupe `#A69A8D` for linen and plaster; oak and walnut carry the warmth. |
| White balance | 3800–4300 K. Skin stays neutral-warm; no orange, no magenta. |
| Saturation | −10 to −15 %. The only cool colour is the dusk sky in a window. |
| Contrast | Gentle S-curve; fine grain (ISO 400 look) is allowed, film borders are not. |
| Accent | **No Oxblood on photographs** (guidelines § 3.6) and no staged accent object. The v2-era ultramarine vase is retired. |
| Reference | `v2-contact-sheet.jpg`: L01, L03, E03, E04 are the grade masters. |

**Checking consistency.** Put a new image next to L01 and L03 at thumbnail size: if it reads colder, greener or brighter, it is off. Five v1 portraits fail this test (green-grey walls, code G in `AUDIT.md`).

---

## 4. Composition and crops (the arch)

| Format | Use | Rule |
|---|---|---|
| **Arch 4:5** (default) | Hero, category tiles, editorial, social | Heads and hands sit **below the springline** (the top ~20 % is curve). Keep 30 % room. |
| Arch 3:4 | Profile header | Head at 35–40 % height. |
| Tile 4:3, radius 12 | Lists, dense UI | No arch below 120 px width. |
| O-oval 332 : 362 | Avatars, portraits | Eyes on the upper third, chin well inside. |
| 16:9 / 3:2 full bleed | Bands, landing hero desktop | One calm half for type (left in L01, E07, L08, E04). |
| 9:16 | Stories, mobile hero | Calm top third for the headline (L02). |

- **The contrapposto pair.** Two arches side by side, the right one dropped by 18 % of its width. Pair two places (L03 hallway + L08 hotel), before/after (E01 arrival + E03 after) or Profi and customer. Never pair two near-identical images.
- **Calm zones.** Text sits on wall, sky, linen or shadow, or on a flat 62 % Espresso scrim. Never on a face, a hand or a gradient.
- **Focal points** are stored per image in `scripts/images/sources.json` (`focal`, CSS `object-position`). Use them; do not centre-crop.
- **Verticals straight**, eye or seated height. No Dutch angles, no top-down except the one still life (E06) and flat-lay surfaces for device mockups (L12).
- **Discreet crops:** hands, shoulders, backs, turned-away or closed-eyed faces. Never crop to the buttocks, the chest or bare legs on a table.

## 5. Skin and retouching

- Skin keeps pores, freckles, fine lines, scars, body hair and uneven tone. **Allowed:** removing temporary blemishes, stray hairs, lint, sensor dust. **Not allowed:** skin smoothing, frequency separation that removes texture, reshaping, slimming, eye whitening, teeth bleaching, changing skin tone.
- Hands: five fingers, natural knuckles, real nails. Check every hand at 100 %.
- Make-up and nail work is shown as done: no retouching of the treatment result (it would misrepresent the service).

## 6. Casting and diversity

- **Customers:** 25–70, every body type, origins that reflect German cities. They look like neighbours, not models.
- **Profis:** 24–60, competent and relaxed, plain black, charcoal or navy work clothes, hair tied back, minimal jewellery, no logos.
- **Gender:** men as customers *and* Profis in every category where it is plausible (v2: male Profi in massage, hotel; men as customers in hotel, office, haircut, grooming, make-up for a portrait).
- **Coverage of the v2 set:** Black, South Asian, East Asian, Turkish-German, Brazilian-German, mixed heritage and white German people; ages from about 27 to 67; one non-binary Profi. The cast list is in `generation/shotlist-v2.mjs`.
- **Known gap:** GPT Image tends to repeat one face type for anonymous "client" prompts (the Kosmetik portfolio has a recurring brunette). Name heritage, age and hair in every prompt; the real shoot casts at least 12 people (§ 12).

## 7. Places

| Place | Must show | Must not show |
|---|---|---|
| **Zuhause · Altbau** (Berlin, Hamburg, Köln, München) | Tall double casement windows with tilt-turn handles, ribbed radiators, herringbone parquet, lime-washed walls, stucco, an oak or walnut sideboard, one lamp | Salon chairs, bulb mirrors, wall-mounted treatment furniture |
| **Hotel** (Frankfurt, München, Hamburg) | Floor-to-ceiling window with the real skyline, oak panelling, bouclé armchair, made bed in the back, the suit jacket over a chair | Hotel names, logos, room-number signs, minibar branding, robes with logos |
| **Büro** (Hamburg-HafenCity, Frankfurt) | Concrete ceiling, oak table, glass partitions, a closed *unbranded* laptop, a glass of water, the portable massage chair | Branded laptops (retouch logos), colleagues looking on, screens with content |
| **Threshold** (stairwell, door) | Turned banister, terrazzo or encaustic tiles, a heavy wooden door, the kit bag and the folded table | House numbers, name plates, intercom labels (fake text risk) |

**Kit that is always right:** the folded portable table in a black case, a plain black kit bag, ecru/oatmeal/taupe linen, charcoal cotton towels, unlabelled amber glass, a plain black make-up case.
**Never in frame:** candles, orchids or any staged flower, stones, bamboo, cucumber slices, rose petals, rolled spa towels, white spa robes, lotus, water drops, incense, salon furniture, rose-gold, glitter.

## 8. The Ortszeile (*Ort · Stadtteil · Uhrzeit*)

- Format: `type-place` (Instrument Sans 600, caps, +0.12em, tabular figures), left-aligned to the image edge, under or inside the bottom-left of key images.
- Examples: *Altbau, 3. OG · Berlin-Prenzlauer Berg · 19:30* · *Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10* · *Besprechungsraum · Hamburg-HafenCity · 13:00*.
- The line must match the picture: the light (19:30 = blue hour), the city skyline and the room type. Each v2 entry in `sources.json` carries its `place`.
- Ortszeilen are illustrative scenes, never bookings. No street names, house numbers or real hotel names.
- On ads and social, the Ortszeile replaces a caption headline; in the product it appears only on editorial surfaces (home, landing, empty states), never on a real booking.

## 9. Do and don't (from our own set)

| Do (v2) | Don't (v1) | Why |
|---|---|---|
| `landing/hero-wide` (L01): blue-hour Altbau, the Profi's flat palms on linen, a calm left half | `hero/home`: flower in the client's hair, ring mirror, back bare to the waist | Place first, discretion, no salon prop |
| `landing/philosophy` (L03): an arched doorway, the kit set down, nobody yet | `editorial/details` v1: orchids, candle, stones around the tools | Arrival tells the model; props say "spa" |
| `editorial/hotel-v2` (E04): Frankfurt skyline and the Main, linen to the shoulder blades | `editorial/hotel`: fake signage „BAKANΤΙΘΑ“ across the window | Fake text destroys trust in one glance |
| `landing/experience-privacy` (L06): the room seen through a half-open door | `portfolio/massage-14`, `make-up-5`, `haare-styling-5`: nudity | Zero tolerance is a visual rule too |
| `categories/manikuere-v2` (C02): two pairs of hands, a towel, a glass of water | `portfolio/manikuere-3`: orchids, candle, fake word „mecile“ | Work, not decoration |
| `editorial/office-v2` (E05): massage chair by the window, plain laptop | `editorial/office`: fake „nordic“ logo, rolled towels, petals on the table | The office must look like an office |
| `landing/experience-flexible` (L09): the Elbphilharmonie through the window | `portfolio/massage-11`: couples' massage | Show only what SOMA offers |

## 10. Generating development assets (until the shoot)

- **Model choice.** `gpt_image_2_5` (quality *medium* for key visuals, *high* for heroes, *low* at 2k for 1:1 portfolio details, 0.5 credits) for anything with people, props, rooms or surfaces that can carry text. `soul_2` only for single portraits and textures, and **only with positive prompts** (it renders whatever a negative list names).
- **Prompt system** (`generation/shotlist-v2.mjs`): one scene sentence (who, where, what the hands do, the time of day, lens and where the calm zone is) + the shared style block, verbatim. The style block names the palette (bone, stone, taupe, oak, espresso) and ends with the exclusions.
- **Moderation.** Bare backs, legs or feet on a massage table trip the provider's safety filter (6 of 135 jobs). Cover the client with linen "up to the neck" or dress them; this is also the brand rule.
- **QA before approval** (every image at 100 %): text, logos and UI chrome; film borders; hands and feet; exposure; spa props; grade against L01; the place matches the Ortszeile; no branded devices. Rejections are logged with the reason in `generation/jobs-v2.json` (19 rejected).
- **Known retouch notes:** L08 the Profi is barefoot (retouch shoes in before paid use); L09 faint mark on the laptop lid; L05/L06/L11 are mood shots, not for UI compositing.

## 11. The v2 set (109 images, AI development assets)

| Group | Paths (all new, under `/images/`) | Replaces |
|---|---|---|
| Landing key visuals (12) | `landing/hero-wide`, `hero-mobile`, `philosophy`, `experience-time`, `-comfort`, `-privacy`, `-quality`, `-choice`, `-flexible`, `app-home`, `app-pro`, `app-table` | new |
| Hero (1) | `hero/home-v2` (4:5 cut of `hero-mobile`) | `hero/home` |
| Editorial (7) + OG (1) | `editorial/{arrival,setup,after,hotel,office,details,provider-cta}-v2`, `og-default-v2` | the v1 files of the same name |
| Categories (7) | `categories/{massage,manikuere,pedikuere,kosmetik,haare-styling,brows-lashes,make-up}-v2` | v1 tiles |
| Profi portrait (1) | `pros/pro-28-v2` | `pros/pro-28` |
| Portfolio (80) | `portfolio/<category>-<n>-v2` with the v1 caption (corrected where the audit found a voice or truth issue) | v1 portfolio |

- Every entry is in `scripts/images/sources.json` with `remote`, `ratio`, `width`, `height`, `focal`, `place` (key visuals), `caption` (portfolio), `replaces`, and `source`. The v1 entries are untouched except for an added `replacedBy`. The seed's portfolio pool ignores `-v2` paths, so nothing changes in the app until the migration switches paths.
- **To fetch:** the 109 paths in `generation/fetch-list.txt` (the Lead re-runs `soma-capture` by changing `.github/capture-request`).
- **Credits:** 76.9 of the 150 budget (balance 1312.39 → 1235.49), 135 jobs including calibration and retries.

---

## 12. Before launch: real photography

### 12.1 Shoot plan
Two shoot days per city block (Berlin day 1–2, Frankfurt hotel day 3, Hamburg office day 4), one photographer + assistant, a digital tech for on-set grading against the LUT built from L01/L03, a casting/production coordinator, a set stylist (props list § 7), a hair and make-up artist for continuity only (no beauty make-up on customers).

### 12.2 Shot list (minimum 34 finals)
| # | Shot | Format | Place | Ortszeile | Priority |
|---|---|---|---|---|---|
| 1–2 | Hero: Profi's palms on linen, blue hour, calm half | 16:9 + 9:16 (shoot both) | Altbau, Berlin | Altbau, 3. OG · Berlin-Prenzlauer Berg · 19:30 | P0 |
| 3 | The arched doorway, kit set down | 4:5 | Altbau hallway | Flur · Berlin-Schöneberg · 18:40 | P0 |
| 4 | Arrival at the door (customer seen from behind) | 3:2 | Altbau | Wohnungstür, 4. OG · Berlin-Prenzlauer Berg · 19:25 | P0 |
| 5 | Unfolding the table, hands only | 3:2 | Altbau | — | P1 |
| 6 | After: on her own sofa, tea, Profi folding linen | 3:2 + 4:5 | Altbau | Sofa, danach · Berlin-Prenzlauer Berg · 20:10 | P0 |
| 7 | Hotel massage, skyline, linen to the shoulder blades | 3:2 | Hotel, Frankfurt (location release) | Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10 | P0 |
| 8 | Hotel set-up while the guest takes off her shoes | 3:2 | Hotel | same | P1 |
| 9 | Office massage chair, harbour window | 3:2 | Office, HafenCity | Besprechungsraum · Hamburg-HafenCity · 13:00 | P0 |
| 10 | Make-up Profi at the door, case in hand | 4:5 | Stairwell, Köln | Wohnungstür, 2. OG · Köln-Ehrenfeld · 18:55 | P0 |
| 11 | Nails after work, shoes kicked off | 3:2 | Altbau, Hamburg | Wohnzimmer · Hamburg-Eimsbüttel · 19:05 | P0 |
| 12 | Asleep under a throw after a massage | 4:5 | Flat, München | Sofa, danach · München-Schwabing · 20:20 | P1 |
| 13 | Room through a half-open door (privacy) | 4:5 | Altbau bedroom | — | P1 |
| 14–20 | Seven category tiles (as v2 C01–C07, real Profis with consent) | 4:5 | mixed | — | P0 |
| 21 | Tools still life on linen (top-down, the only one) | 1:1 | Studio table | — | P1 |
| 22 | Profi on the stairs (SOMA Pro band) | 16:9 | Stairwell, Berlin | Treppenhaus, 2. OG · Berlin-Neukölln · 17:40 | P0 |
| 23–24 | Phone in hand, customer and Profi (screens off, for comps) | 4:5 | Kitchen, stairwell | — | P1 |
| 25 | Empty table on oak for device flat-lays | 3:2 | Studio | — | P2 |
| 26–34 | Social set: 9 details (hands, towel on a knee, the Start-Code moment at the door, the folded table on a landing, a coat on a hook) | 4:5 | mixed | per post | P1 |

Plus **provider portraits**: offered as a free session to the first verified Profis per city, shot to the portrait guide (`docs/art-direction.md` § 4.3): light wall, window light, 85 mm, head to chest. Their own photo, their own rights (§ 12.3).

### 12.3 Rights and releases
- **Buyout:** unlimited time, worldwide, all media including paid social, OOH, print and the app; the right to crop, grade and combine with type and UI; no exclusivity limits on SOMA's side. Photographer credit in the press kit only.
- **Model releases** (written, per person, German and English): commercial use in advertising for a beauty and wellness marketplace, including treatment scenes; the right to show the person's face, hands and body as framed; withdrawal terms per GDPR Art. 7 and KUG § 22 explained; minors are never cast.
- **Profis who appear:** a separate release that states the images are brand imagery, not their profile photo, unless they opt in to use them on their profile too.
- **Property releases** for every flat, hotel and office; hotels must approve that their interior appears unnamed. No identifiable artworks, books or products in frame.
- **Metadata:** IPTC creator, copyright, licence and release IDs embedded; a rights register (`brand/photography/rights.csv`, to be created with the shoot) lists every final with its releases.
- **AI assets after launch:** may stay only in internal decks and the brand book, always labelled.
