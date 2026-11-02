# SOMA: Photography direction

*Photo Art Director · v3.2 „Tageslicht“ · 2 Nov 2026*
*Linked from `brand/BRAND_GUIDELINES.md` § 7. The motif and crop geometry stay as fixed in guidelines § 5.1 and § 5.3. v3 replaces the light, grade, wardrobe and portrait rules of v2 (1 Nov 2026); everything else from v2 that still applies is carried over below.*

## Change log

### v3.2 · 2 Nov 2026: fresh file names, discretion and continuity fixes (landing audit 4)

Landing audit 4 (`docs/landing/audit-4.md` N4-3) found the image optimiser serving QA-rejected attempts: retries had been written over the same file name, and caches keyed by URL kept the old picture. **New rule (§ 11, "Fresh names"): every fetched attempt gets its own, never-used file name**; the 17 approved files whose names had carried earlier attempts were re-registered under fresh `-v6` names, and `tools/fresh-check.mjs` is part of the QA sign-off. The hotel hero and the massage tile now keep linen to the shoulder blades (N4-5), the pedicure Profi wears shoes, and the signature pair shows the same client at the door and on the sofa (N4-6). § 10 and § 13.2 now use the daytime Ortszeilen. Audit: `AUDIT-v4.md`, "Post-audit-4 fixes".

### v3.1 · 2 Nov 2026: the Profi portraits get variety (v4 files)

Client, after seeing v3: „mach ruhig mit etwas mehr Abwechslung!“ — all 30 portraits shared one backdrop, one pose and one framing and read stock-like. The 30 portraits are regenerated as `pros/pro-NN-v4` with the same light, grade and wardrobe and **each Profi's v3 portrait as the identity reference**. § 6 is updated; the audit is `AUDIT-v4.md`, the sheets `v3/08-pros-v4.jpg` and `v3/09-pros-v3-vs-v4.jpg`.

### v3.0 · 2 Nov 2026: „Tageslicht“ (client rejection of the v2 imagery)

**Client feedback, 2026-11-02 (verbatim):**
> „die fotos für die behandler und die behandlungen sehen echt deprimierend aus … ich verstehe, dass das nach privat und zu hause aussehen soll, aber das sieht alles sehr dunkel und unprofessionell aus. außerdem hat die behandlerin selin a. keine arme. gib dir da bitte richtig mühe.“

*(The photos of the Profis and the treatments look depressing. I understand they should feel private and at home, but everything looks very dark and unprofessional. Also, the Profi Selin A. has no arms. Please really make an effort.)*

**Diagnosis.** The feedback is right, and the cause is the v2 direction itself, not the model:
- v2 prescribed blue hour and one lamp as the signature light, a −10 to −15 % desaturation, "never high-key" and black or charcoal work clothes. The measured result: the 143 images in use average a luma of **96.5 / 255 (L\* 40)**; the landing key visuals **77.5 (L\* 32)**, editorial **79.3**, categories **83.4**. On average **27 % of every frame is near-black** (luma < 20 %). On Bone/Stone UI this reads as dim, muddy and cheap.
- Black T-shirts in front of grey walls make the portraits look like passport photos, not like professionals on a premium platform.
- Some v1 files still carry film-strip borders (`AUDIT.md`, code F).
- **Selin A.** (`pros/pro-01`, the B2B demo persona) is cropped at the shoulders: no arms and no hands are visible.

**What changes in v3** (decided by the Lead):

| | v2 (retired) | v3 „Tageslicht“ |
|---|---|---|
| Light | Blue hour + one warm lamp as the signature; "never high-key" | **Bright, luminous natural daylight**, sun-filled rooms, soft and flattering. Warm high-key is allowed. Blue hour and lamp-only scenes are no longer a default. |
| Grade | −10 to −15 % saturation, Espresso shadows, fine grain allowed | **Clean, fresh, slightly lifted**, natural saturation, healthy glowing skin, warm whites. No grain, borders, vignettes or muddy shadows. A premium wellness and beauty campaign, not documentary. |
| Profis' wardrobe | Plain black, charcoal or navy | **Crisp light uniforms**: ivory, sand or stone tunics, or tailored light linen. At most one subtle Oxblood detail. **Never black T-shirts.** |
| Clients | Dark knitwear, linen | **Light robes or soft knitwear**, at ease; eyes closed in calm enjoyment, or a natural smile. Covered per the discretion rules. |
| Places | Dim Altbau, dark oak, black kit | **Upscale bright apartments** (Altbau, white walls, light oak, linen, plants), premium hotel suites, bright modern offices. Fresh white linen, a neat manicure set-up, premium unbranded products. |
| Portraits | Head to chest, dark tee, grey wall | **Editorial headshots in one consistent series**, head to waist, **both arms and hands visible and anatomically correct**, bright warm-neutral background, friendly direct gaze. |

The whole set in use (143 images + 6 new covers for the customer page „Entdecken“) is regenerated to v3; the audit is in **`AUDIT-v3.md`**.

### v2.0 · 1 Nov 2026 (retired in parts)
Replaced the v1 development set (131 images, audit in `AUDIT.md`). Its rules on discretion, casting, places, the Ortszeile, AI labelling, rights and the launch shoot are carried over below; its light, grade and wardrobe rules are retired.

---

| File | Content |
|---|---|
| `PHOTOGRAPHY.md` | This direction |
| `AUDIT-v3.md` | The v3 QA table: every image with pass/fail, reason, retries and the final file; luminance before/after per folder |
| `v3/*.jpg` | Contact sheets, before (v2 in use) and after (v3), per group (≤ 300 KB each) |
| `generation/shotlist-v3.mjs` | The v3 shot list and prompt system (source) → `generation/jobs-v3.json` (every Higgsfield job, approved and rejected) |
| `AUDIT.md`, `audit/` | The v1 audit (historical) |
| `generation/shotlist-v2.mjs`, `jobs-v2.json`, `v2-contact-sheet.jpg`, `v2-previews/` | The v2 record (historical; v2 is no longer the grade reference) |
| `tools/` | `contact-sheets.mjs`, `recrops.mjs`, `render-audit.mjs`, `add-sources.mjs`; v3: `v3-register.mjs` (sources.json from the ledger), `v3-luminance.mjs`, `v3-sheets.mjs`, `v3-audit.mjs` (+ `v3-audit-notes.md`) |

---

## 0. Status: every current image is a development asset

- All images in `scripts/images/sources.json` (v1, v2 and v3) are **AI-generated** (Higgsfield). They are for design, prototypes and clearly labelled previews.
- **Labelling stays, unchanged.** In the product every portrait carries „Demo-Profil · Foto KI-generiert“; other photos „Bild KI-generiert“ / „Bilder KI-generiert“ (`src/lib/images.ts`). On social and in ads, use the platform's AI label (Meta "AI info", TikTok "AI-generated", LinkedIn C2PA) and the caption suffix „Bild KI-generiert.“ Files carry an `ImageDescription` EXIF note (set by `scripts/images/fetch.mjs`).
- **Never** present an AI face as a real Profi, customer or review. AI people never appear next to a real name, a real rating or the *Verifiziert* badge outside the labelled demo.
- **No real people, brands or logos** in any prompt or frame.
- Before launch every key image is replaced by commissioned photography (§ 13). The AI set is the reference the photographer shoots against.

---

## 1. Principles

1. **The place is the hero.** Every frame answers *"Where are we?"* within a second: a sunlit Altbau window, a hotel suite over the skyline, a bright office over the harbour. At least 30 % of the frame is room (portraits excepted).
2. **Bright, private, professional.** Private does not mean dim. SOMA looks like the best morning in your own flat: daylight, fresh linen, a confident Profi who knows exactly what she is doing.
3. **Care, not spa.** Show the work: hands, tools, the dressed table, a towel on a knee. No props that exist only to say "wellness".
4. **Discretion is the composition.** During treatments faces are turned away or eyes are closed in calm enjoyment. Bodies are covered by linen to the shoulder blades or more. Sensuality never; warmth comes from light and texture, never from skin. Nothing may read as an erotic massage (zero-tolerance rule, `BRAND_VOICE.md` P5).
5. **Arrival and after.** The two moments only SOMA has: the Profi at the door, and the customer still on her own sofa afterwards.
6. **One image, one idea.** No collages, split screens or competing props.

---

## 2. Light

| | Rule |
|---|---|
| **Key** | **Bright natural daylight** from large windows: sun-filled rooms, soft and flattering on skin. A soft sun patch on the floor or a wall is welcome; faces sit in open, even light, never in hard shadow. |
| **High-key** | **Warm high-key is allowed** and is the default for portraits and treatments: warm white, never clinical or blue-white. |
| **Fill** | Shadows are open and luminous (bounced daylight off white walls and linen). Nothing important sits in a dark area. |
| **Time of day** | Morning to late afternoon. The landing's Ortszeilen are daytime since 2 Nov 2026 (10:30–16:10, § 10); the warm low sun of some frames reads as morning or afternoon sun, the room always fully lit. |
| **Offices** | Bright daylight through floor-to-ceiling glass; no downlights or LED panels as the visible source. |
| **Never as a default** | Blue hour, lamp-only rooms, night windows, candlelight, flash look, ring-light catchlights, coloured gels, cold blue-white "clinic" light. |

## 3. Grade

The grade sits *with* the palette, so photography and UI share one temperature on Bone and Stone.

| Parameter | Target |
|---|---|
| **Exposure** | Bright. A set average of **luma ≥ 150 / 255 (L\* ≥ 60)**; no image in the people groups below luma 130; less than 8 % of a frame near-black (luma < 20 %). |
| **Highlights** | Clean warm white to **Bone `#F3EFE8`**; windows may bloom softly, skin never clips. |
| **Shadows** | Slightly lifted, warm, transparent. Never muddy, never crushed, never blue. Espresso `#25211F` is a UI colour, not a shadow target any more. |
| **Whites** | Warm white (linen, walls, tunics read ivory or Bone, never blue-white or grey). |
| **White balance** | 5000–5600 K, warm-neutral. Skin healthy and natural, no orange, no magenta. |
| **Saturation** | Natural (0 %). Greens of plants stay fresh but quiet; the palette of the set is warm neutrals. |
| **Skin** | Healthy, glowing, hydrated, with real texture (§ 5). |
| **Contrast** | Soft, clean, fresh. **No film grain, no borders or rebates, no vignettes, no haze filters, no "film look".** |
| **Brand fit** | The set's dominant colours are the palette's warm neutrals (Bone, Stone, Taupe, light oak, linen). An image must sit calmly on a Bone page and on a Stone card. |

**Consistency check.** Put a new image next to the v3 grade masters at thumbnail size on Bone: `landing/hero-home-4x5-v3` (the home hero), `pros/pro-01-v3` (the portrait series), `categories/manikuere-v3`, `editorial/after-v3`. If it reads darker, colder, greyer or more saturated, it is off.

**One deliberate exception:** `editorial/provider-cta-v3` keeps a deep, evenly lit espresso-brown wall in its left 45 % because the landing band (chapter 05, ≥ 1024 px) sets Bone text there (measured 12.2:1). The Profi and the rest of the frame are bright.

---

## 4. Composition and crops (the arch) — unchanged from v2

| Format | Use | Rule |
|---|---|---|
| **Arch 4:5** (default) | Hero, category tiles, editorial, social, „Entdecken“ covers | Heads and hands sit **below the springline** (the top ~20 % is curve). Keep 30 % room. |
| Arch 3:4 | Profile header | Head at 35–40 % height. |
| Tile 4:3, radius 12 | Lists, dense UI | No arch below 120 px width. |
| O-oval 332 : 362 | Avatars, portraits | Eyes on the upper third, chin well inside. |
| 16:9 / 3:2 full bleed | Bands, landing hero desktop | One calm half for type. |
| 9:16 | Stories, mobile hero | Calm top third for the headline. |
| 1:1 | Portfolio tiles | The work in the centre, readable at 160 px. |

- **The contrapposto pair.** Two arches side by side, the right one dropped by 18 % of its width. Pair two places, before/after or Profi and customer. Never two near-identical images.
- **Calm zones.** Text sits on wall, sky, linen or a flat 62 % Espresso scrim. Never on a face, a hand or a gradient. Bright images need the scrim or a text position on Bone beside the image; never set Bone text straight onto a bright wall.
- **Focal points** are stored per image in `scripts/images/sources.json` (`focal`, CSS `object-position`). Use them; do not centre-crop.
- **Verticals straight**, eye or seated height. No Dutch angles; top-down only for the tools still life and the device flat-lay surface.
- **Discreet crops:** hands, shoulders, backs, turned-away or closed-eyed faces. Never crop to the buttocks, the chest or bare legs on a table.

## 5. Skin and retouching

- Skin keeps pores, freckles, fine lines, scars and uneven tone; the glow comes from light and hydration, not from smoothing. **Allowed:** removing temporary blemishes, stray hairs, lint, sensor dust. **Not allowed:** plastic skin, frequency separation that removes texture, reshaping, slimming, eye whitening, teeth bleaching, changing skin tone.
- **Hands:** five fingers, natural knuckles, real nails, correct joints. Every hand is checked at 100 % (§ 11).
- Make-up and nail work is shown as done: no retouching of the treatment result (it would misrepresent the service).

## 6. Portraits (the Profi series, 30 images)

The 30 Profi portraits are **one series**. They must read as trustworthy professionals on a premium platform, and side by side they must look like one shoot.

| | Rule |
|---|---|
| **Framing** | Editorial portrait, 4:5, **head to waist for most**; seated frames and arms-at-the-sides frames to mid-thigh so that the hands stay inside. The face sits in the upper third, clear and sharp; `focal` per file keeps it inside the circle avatar (y 15 %, 10 % for the wider frames). |
| **Setting (v3.1)** | Fitted to the craft and persona, six kinds, **at most 5 each**: own small bright studio · a client's bright living room next to the kit · a doorway arrival with the bag · a hotel corridor or suite (hotel specialists) · a bright office (office specialists) · at a window with tools. No plant/furniture combination twice. |
| **Pose (v3.1)** | Seven kinds, 4–5 each: arms relaxed at the sides · lightly crossed · holding a tool or towel · leaning on a counter · seated · a natural laugh · a slight three-quarter turn. Every visible arm complete; a hand may tuck under a crossed arm, but no hand hidden by a towel, in a pocket or behind the back. |
| **Arms and hands** | **Both arms and both hands visible and anatomically correct**: arms relaxed and loosely folded, or hands lightly clasped at the waist. Five fingers each, no hands hidden behind the back, no cropped forearms. |
| **Gaze** | Friendly, direct gaze into the lens; a natural closed- or open-mouth smile. Shoulders square or a slight three-quarter turn. |
| **Wardrobe** | A crisp light work tunic (ivory, sand or stone) with a short stand collar or V-neck and short or three-quarter sleeves, or a tailored light linen shirt or jacket over an ivory tee. At most one subtle Oxblood detail (thin piping, a hair tie). Clean, pressed, unbranded, no name tags. |
| **Grooming** | Well-groomed: hair neat (tied back for hands-on work), minimal natural make-up, minimal jewellery. |
| **Background** | Bright, warm-neutral and softly blurred in every frame (white walls, light oak, linen, daylight); the props belong to the craft (the massage table, the manicure kit, the kit bag). |
| **Light** | The same soft window daylight from camera left with gentle fill; even, flattering, warm high-key. |
| **Camera** | 85 mm look, eye level, shallow depth of field, sharp eyes. |
| **Consistency** | One family, not one backdrop: the same light, grade, lens look and light wardrobe (light trousers too, never dark), and the same person as in their reference portrait. Prompt system: `generation/shotlist-v4.mjs` (v3 template: `shotlist-v3.mjs`). The series is checked as one contact sheet before any single portrait is approved. |
| **Identity** | Each portrait matches its provider in `scripts/db/lib/demo-data.ts`: gender, approximate age (from the years of experience) and heritage from name and bio. |
| **Selin A.** (`pros/pro-01`, massage, Berlin, the B2B demo persona) | **Must be flawless**: both arms and hands, correct anatomy, warm confident expression, ivory tunic. v4: a bright Altbau living room with her massage table set up behind her, holding a folded towel. |

## 7. Casting and diversity

- **Customers:** 25–70, every body type, origins that reflect German cities. They look like well-kept neighbours, not models; relaxed, at ease, eyes closed in calm enjoyment or a natural smile.
- **Profis:** 24–60, competent, confident and well-groomed (§ 6, § 8).
- **Gender:** men as customers *and* Profis in every category where it is plausible.
- **Coverage:** Black, South Asian, East Asian, Turkish-German, Arab-German, Brazilian-German, Southern and Eastern European, mixed heritage and white German people; ages from about 26 to 67; one non-binary Profi (Kiran D.). Name heritage, age and hair in every prompt: models repeat one face type for anonymous prompts otherwise.

## 8. Wardrobe

| Who | Yes | No |
|---|---|---|
| **Profis** | Crisp ivory, sand or stone tunics; tailored light linen shirts, trousers or jackets; light knit for hair and make-up Profis; clean light trainers or leather shoes. One subtle Oxblood detail at most. | **Black T-shirts**, black or charcoal workwear, scrubs, white medical coats, gloves, aprons with print, name tags, logos. |
| **Clients** | Light unbranded robes (oat, ivory, sand, waffle or cotton), soft knitwear, light cotton shirts, linen trousers. | Logo robes, spa towel turbans, underwear, bra tops, bare torsos facing the camera, sportswear with logos. |
| **Massage** | The client lies under fresh white or ivory linen drawn to the shoulder blades or higher; only the treated area (back, shoulders, forearm, foot) is visible. | Bare backs to the waist at hero scale, skin as a background texture, oil sheen as the subject. |

**Oxblood on photographs.** Guidelines § 3.6 keep Oxblood type and large Oxblood areas off photographs. v3 allows one *small* Oxblood detail in wardrobe (piping, a hair tie, a thin belt) where it helps the set sit on SOMA's UI; never a staged accent object.

## 9. Places

| Place | Must show | Must not show |
|---|---|---|
| **Zuhause · Altbau** (Berlin, Hamburg, Köln, München, Düsseldorf) | High ceilings, white walls, stucco, tall double casement windows full of daylight, light oak herringbone parquet, linen sofa and curtains, one or two green plants, tidy styled surfaces | Clutter, dark walls, salon chairs, bulb mirrors, wall-mounted treatment furniture |
| **Hotel** (Frankfurt, München, Hamburg) | A premium bright suite: floor-to-ceiling window with the skyline in daylight, light oak, bouclé armchair, crisp white bed in the back, the suit jacket over a chair | Hotel names, logos, room numbers, branded robes or minibars |
| **Büro** (Hamburg-HafenCity, Frankfurt) | A bright modern office: glass, light oak table, white walls, plants, a closed *unbranded* laptop, a glass of water, the portable massage chair | Branded laptops, screens with content, colleagues looking on |
| **Threshold** (stairwell, door) | A bright Altbau stairwell: white walls, turned banister, terrazzo or encaustic tiles, a light wooden door, the Profi with a tidy bag | House numbers, name plates, intercom labels (fake text risk) |

**Kit that is always right:** fresh white and ivory linen; the portable massage table with a light wooden frame; a tidy sand, tan-leather or stone canvas kit bag; ivory and sand cotton towels; unlabelled glass and ceramic bottles; a neat manicure set-up on a folded ivory towel; clean steel tools; a light make-up case.
**Never in frame:** candles, orchids or any staged flower, decorative stones, bamboo, cucumber slices, rose petals, rolled spa towels, lotus, water drops, incense, salon furniture, rose gold, glitter, pink nail-salon sets, clinic blue-white, gloves, fake text, logos or brands.

## 10. The Ortszeile (*Ort · Stadtteil · Uhrzeit*) — unchanged from v2

- Format: `type-place` (Instrument Sans 600, caps, +0.12em, tabular figures), left-aligned to the image edge, under or inside the bottom-left of key images.
- Examples (the landing's daytime lines, 2 Nov 2026): *Altbau, 3. OG · Berlin-Prenzlauer Berg · 10:30* · *Hotelsuite, 6. Stock · Frankfurt-Westend · 15:30* · *Besprechungsraum · Hamburg-HafenCity · 13:00*.
- The line must match the picture: the light (the v3 set is daylight, so daytime times), the city skyline and the room type. Each key image in `sources.json` carries its `place`.
- Ortszeilen are illustrative scenes, never bookings. No street names, house numbers or real hotel names.
- In the product the Ortszeile appears only on editorial surfaces (home, landing, empty states), never on a real booking.
- The landing and the discovery surfaces moved to daytime lines on 2 Nov 2026 (`docs/landing/LANDING_DESIGN_SPEC.md`, "Ortszeilen in daylight"); the evening examples of v2 are superseded.

## 11. Generating development assets (until the shoot)

- **Model: Higgsfield `nano_banana_pro`, 2k** (2 credits per image), chosen by a side-by-side test of five configurations on Selin's portrait and a manicure scene (`AUDIT-v3.md` § 1, `v3/00-model-test.jpg`): the most photographic skin, correct hands at 100 %, and no stray props. `gpt_image_2_5` added a candle and a skyline print and reads smoother; `seedream_v5_pro` reads plastic and has no 4:5; `flux_3_image` was close but costs 3 credits. One model for the whole set, so skin, light and grade match.
- **Portrait template (final).** Frontal, shoulders square, framed head to mid-thigh, hands meeting at belt or navel height, plus **`pro-08-v3` as an image reference for pose, framing, light and background only** ("the person is a different individual"). Without the reference the model turned the body (hiding one arm) or let the hands drop out of the frame.
- **Prompt system** (`generation/shotlist-v3.mjs`): one scene sentence (who, where, what the hands do, the wardrobe, lens, where the calm zone is) + the shared v3 style block, verbatim. The portrait series has its own fixed template (§ 6). Positive wording first; exclusions only in one closing sentence.
- **Say it positively and concretely.** The model draws a fruit logo on any laptop (leave laptops out or show a leather folder), gloves on cosmeticians (write "bare hands, no gloves"), towel turbans and rolled towels in spa-like rooms (write "hair loose", "bare shelves"), and fine nail work only at macro framing.
- **Moderation.** Bare backs, legs or feet on a massage table can trip the provider's safety filter; cover the client with linen to the shoulder blades or higher, or dress them. This is also the brand rule.
- **QA before approval** (every image, contact sheet + 100 % view for every image with people). Reject on:
  - anatomy: missing or extra arms, hands or fingers; fused fingers; wrong joints; broken faces or eyes; extra or merged people;
  - warped objects or lines; gibberish text, logos or labels;
  - dark or muddy exposure (§ 3 targets); film borders, grain, vignettes;
  - sexualised framing or exposure;
  - wardrobe or light inconsistent within the portrait series; black T-shirts on Profis;
  - crops that do not work at the entry's ratio and focal point;
  - identity mismatch with the seed (gender, age, heritage).
  Every rejection is logged with its reason and retry count in `AUDIT-v3.md` and `generation/jobs-v3.json`.
- **Fresh names (since v3.2, landing audit 4 R4-2).** **Never write a file name twice.** Image optimisers and CDNs (`.next/cache/images`, the Netlify Image CDN) cache each URL × width × format and do not look at the file's content, so a name that ever carried a rejected attempt can keep serving it. Every attempt that is fetched gets its own, never-used name (`<base>-v6.jpg`, a retry `<base>-v6b.jpg`, `-v6c` …); the registry points at the approved one with `replacedBy`, and rejected attempts stay as dead entries pointing forward. Do not `git rm` a file to re-fetch a new picture under the same name. Sign-off for every round: `node brand/photography/tools/fresh-check.mjs` must report 0 reused names, 0 files fetched from an older remote and 0 files that are not the ledger's approved job (it needs the full git history). On a host that already served old variants, also purge its optimiser cache.
- **Registration.** Each v3 image is a new `-v3` entry in `scripts/images/sources.json` (`remote`, `ratio`, `width`, `height`, `focal`, `place`, `caption` for portfolio, `replaces`, `source`). The entry that was in use gets `replacedBy` → the v3 path; `src/lib/images.ts` follows the chain (v1 → v2 → v3 is two hops), so no code reference changes. The capture workflow (`.github/workflows/soma-capture.yml`) downloads and crops the files.

## 12. The v3 set

| Group | Paths (under `/images/`) | Replaces (in use) |
|---|---|---|
| Profi portraits (30) | `pros/pro-01-v3` … `pro-30-v3` (focal 50 % 30 %), **superseded by `pro-NN-v4`** (v3.1, `AUDIT-v4.md`) | `pro-NN-v2`, `pro-12`, `pro-17`, `pro-28-v2` |
| Landing key visuals (5) + hero home crop (1) | `landing/{hero-wide,hero-mobile,app-home,app-pro,app-table}-v3`, `landing/hero-home-4x5-v3` | `landing/<name>`, `landing/hero-home-4x5` (now registered as a recrop) |
| Skipped by Lead decision (7) | — | `landing/philosophy`, `experience-{time,comfort,privacy,quality,choice,flexible}` stay v2 (their chapters are removed) |
| Hero (1) | `hero/home-v3` | `hero/home-v2` |
| Editorial (7) + OG (1) | `editorial/<name>-v3`, `og-default-v3` | `editorial/<name>-v2`, `og-default-v2` |
| Categories (7) | `categories/<slug>-v3` | `categories/<slug>-v2` |
| Portfolio (85) | `portfolio/<category>-<n>-v3`, same caption | `portfolio/<category>-<n>-v2` |
| „Entdecken“ covers (6, new) | `explore/vor-dem-event`, `nach-dem-sport`, `im-hotel-ankommen`, `mittagspause`, `sonntag-fuer-dich`, `neu-auf-soma` (4:5, 1200 × 1500) | new |

**Result (2 Nov 2026):** 143 final files (141 generated + 2 derived 4:5 crops of the mobile hero), all passed QA; 199 generations for the set + 10 model tests, 56 rejected in QA; **420.50 credits** of the 500 budget. Mean luma of the replaced set **97.6 → 177.6** / 255 (L\* 40.5 → 72.2), near-black pixels 26 % → 2.6 %. Seven landing images were skipped by Lead decision (chapters 02, 05 and 07 removed). Every job and verdict: `AUDIT-v3.md`, `generation/jobs-v3.json`.

---

## 13. Before launch: real photography

### 13.1 Shoot plan
Two shoot days per city block (Berlin day 1–2, Frankfurt hotel day 3, Hamburg office day 4), one photographer + assistant, a digital tech for on-set grading against the v3 LUT (bright, warm-neutral, lifted; built from the v3 grade masters), a casting/production coordinator, a set stylist (props and wardrobe lists § 8–9), a hair and make-up artist for grooming continuity (natural; no beauty make-up on customers). **Shoot in daylight** (09:00–17:00, with large bounce and diffusion); the Ortszeilen are daytime (§ 10), so no evening scenes. Wardrobe: ivory, sand and stone tunics in two cuts per size, ironed on set.

### 13.2 Shot list (minimum 34 finals)
| # | Shot | Format | Place | Ortszeile | Priority |
|---|---|---|---|---|---|
| 1–2 | Hero: the Profi's palms on fresh white linen, sun-filled Altbau, calm half | 16:9 + 9:16 (shoot both) | Altbau, Berlin | Altbau, 3. OG · Berlin-Prenzlauer Berg · 10:30 | P0 |
| 3 | The arched doorway into a sunlit room, kit set down | 4:5 | Altbau hallway | Flur · Berlin-Schöneberg · 11:10 | P0 |
| 4 | Arrival at the door (customer seen from behind) | 3:2 | Altbau | Wohnungstür, 4. OG · Berlin-Prenzlauer Berg · 15:25 | P0 |
| 5 | Unfolding the table, hands only | 3:2 | Altbau | — | P1 |
| 6 | After: the same client (as in 4) on their own sofa, tea, Profi folding linen | 3:2 + 4:5 | Altbau | Sofa, danach · Berlin-Prenzlauer Berg · 16:10 | P0 |
| 7 | Hotel massage, skyline in daylight, linen to the shoulder blades | 3:2 | Hotel, Frankfurt (location release) | Hotelsuite, 6. Stock · Frankfurt-Westend · 15:30 | P0 |
| 8 | Hotel set-up while the guest takes off her shoes | 3:2 | Hotel | same | P1 |
| 9 | Office massage chair, harbour window | 3:2 | Office, HafenCity | Besprechungsraum · Hamburg-HafenCity · 13:00 | P0 |
| 10 | Make-up Profi at the door, case in hand | 4:5 | Stairwell, Köln | Wohnungstür, 2. OG · Köln-Ehrenfeld · 11:15 | P0 |
| 11 | Nails at home on a day off, shoes kicked off | 3:2 | Altbau, Hamburg | Wohnzimmer · Hamburg-Eimsbüttel · 11:40 | P0 |
| 12 | Resting under a light throw after a massage | 4:5 | Flat, München | Sofa, danach · München-Schwabing · 14:20 | P1 |
| 13 | Room through a half-open door (privacy) | 4:5 | Altbau bedroom | — | P1 |
| 14–20 | Seven category tiles (as v3 C01–C07, real Profis with consent) | 4:5 | mixed | — | P0 |
| 21 | Tools still life on ivory linen (top-down, the only one) | 1:1 | Studio table | — | P1 |
| 22 | Profi on the stairs (SOMA Pro band) | 16:9 | Stairwell, Berlin | Treppenhaus, 2. OG · Berlin-Neukölln · 11:40 | P0 |
| 23–24 | Phone in hand, customer and Profi (screens off, for comps) | 4:5 | Kitchen, stairwell | — | P1 |
| 25 | Empty light-oak table for device flat-lays | 3:2 | Studio | — | P2 |
| 26–31 | The six „Entdecken“ covers (before the event, after the run, arriving at the hotel, lunch break, Sunday, new on SOMA) | 4:5 | mixed | — | P1 |
| 32–34 | Social details (hands, a towel on a knee, the Start-Code moment at the door) | 4:5 | mixed | per post | P1 |

Plus **provider portraits**: offered as a free session to the first verified Profis per city, shot to the portrait guide in § 6 (bright warm-neutral background, window light, 85 mm, head to waist, both hands visible, light uniform). Their own photo, their own rights (§ 13.3).

### 13.3 Rights and releases
- **Buyout:** unlimited time, worldwide, all media including paid social, OOH, print and the app; the right to crop, grade and combine with type and UI; no exclusivity limits on SOMA's side. Photographer credit in the press kit only.
- **Model releases** (written, per person, German and English): commercial use in advertising for a beauty and wellness marketplace, including treatment scenes; the right to show the person's face, hands and body as framed; withdrawal terms per GDPR Art. 7 and KUG § 22 explained; minors are never cast.
- **Profis who appear:** a separate release that states the images are brand imagery, not their profile photo, unless they opt in to use them on their profile too.
- **Property releases** for every flat, hotel and office; hotels must approve that their interior appears unnamed. No identifiable artworks, books or products in frame.
- **Metadata:** IPTC creator, copyright, licence and release IDs embedded; a rights register (`brand/photography/rights.csv`, to be created with the shoot) lists every final with its releases.
- **AI assets after launch:** may stay only in internal decks and the brand book, always labelled.
