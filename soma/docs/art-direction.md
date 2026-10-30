# SOMA Art Direction

Version 1.0, October 2026. Companion to `docs/design-guideline.md`.

Licensed stock is not available, so the first image set will most likely be **AI-generated, pending the owner's approval**, and replaced by a commissioned shoot later. This document is written so that both a generator and a photographer produce the same pictures.

---

## 1. The idea in pictures

*Schon da.* Every image shows a real place where someone already is: an Altbau flat, a hotel suite, an office. The professional is the one who arrives. The pictures are about attention and touch in an ordinary, beautiful room. They are never about a spa.

Ask of every frame: **could this be someone's actual Tuesday evening?**

---

## 2. Photographic language

| Aspect | Direction |
|---|---|
| **Light** | Natural window light as the key: late afternoon or blue hour, soft and directional, with real shadows. Mix in one warm practical lamp (about 2700 K) so warm and cool meet in the frame. No ring lights, no flash look, no high-key white. Offices get overcast daylight. |
| **Colour grade** | Warm neutrals: lime-washed off-white, oak, linen, charcoal, ink. White balance around 4300 K, highlights slightly warm, shadows neutral to cool. Saturation −10 to −15 %, gentle contrast, blacks lifted to about 8 % (never crushed). Fine grain (ISO 400 look). No teal-orange LUTs, no pastel wash, no pink cast. |
| **Accent** | In about one image in three, one small ultramarine object appears naturally: a glazed vase, a book spine, a wool throw. Never more than one, and never staged as a product. |
| **Casting** | Diverse in origin, age (customers 25–70, professionals 24–60), gender and body. Real skin with pores, freckles, fine lines, scars and body hair. Natural grooming. Customers look like neighbours, not models. Professionals look competent and relaxed. |
| **Wardrobe** | Customers wear their own clothes: knitwear, cotton shirts, linen trousers, a hotel's waffle robe in white or grey without logos. The palette is oatmeal, charcoal, navy, ecru and olive. Professionals wear plain black, charcoal or deep navy work tops (short-sleeved tunic or heavy tee), minimal jewellery and hair tied back. No uniforms with logos. |
| **Sets** | **A: Altbau, Berlin-Prenzlauer Berg.** 3.4 m ceilings with stucco, lime-washed walls, herringbone oak parquet, tall white double casement windows with tilt-turn handles, a ribbed radiator, an oatmeal linen sofa, a dark oak sideboard, books, one ceramic lamp. **B: Hotel suite, Frankfurt am Main.** Oak panelling, a bouclé armchair, crisp white bedding, a brass reading lamp, a large window onto the evening skyline. **C: Office, Hamburg-HafenCity.** Exposed concrete ceiling, an oak meeting table, glass partitions, overcast daylight over the harbour. **D: Altbau stairwell.** Turned wooden banister, worn steps, patterned tiles. **Portrait wall:** a lime-washed plaster wall in a warm off-white. |
| **Lens and crop** | 35 mm for rooms, 50 mm for treatments, 85 mm for portraits, 100 mm macro for details. Eye or seated height. Verticals corrected. Off-centre subjects, with negative space on the side where text goes. Crop confidently through furniture and shoulders. Only one top-down still life in the whole set. |
| **Hands vs. faces** | About **60 % hands, details and turned-away faces; 40 % recognisable faces**. Customers are often seen from behind, eyes closed or partly out of frame, for privacy and calm. Professionals' faces appear in portraits, arrival and after scenes. |
| **Never** | Candles, stones or pebbles, orchids, bamboo, lotus, decorative leaves or flowers, water drops, rolled towels, spa robes, salon chairs, mirrors with bulbs, rose-gold or blush, staged smiles to camera, text, logos, watermarks. |

---

## 3. Production rules

1. **Order of work:** generate and approve the ten portraits first. Then use the approved portraits as character references (image or reference input, same seed family) for every scene that features that professional, so faces stay consistent across the set.
2. **Quality check for every image:**
   - Hands and fingers are anatomically correct.
   - No garbled text or logos.
   - Equipment is plausible: a portable massage table with a face cradle, a nail kit on a towel, a professional make-up case.
   - German details are right: Schuko sockets, tilt-turn windows, radiators.
   - Skin keeps its texture.
3. **Export:** sRGB JPG at quality 85, at the sizes below. Next.js generates AVIF/WebP. Name files exactly as listed and keep them in `public/images/`.
4. **Honesty:** AI-generated people must never be presented as real SOMA providers. `pro-01` … `pro-10` are for design, prototypes and clearly illustrative marketing only. On the live marketplace, every profile photo is the provider's own, shot to the portrait guide in §4.3. Mark AI images in file metadata (`XMP: dc:source = "AI-generated, SOMA art direction v1"`) and follow EU AI Act transparency duties where they apply.

---

## 4. Shot list (26 images)

The focal point is given as CSS `object-position` (x % y %). Every prompt ends with the same style and exclusion sentences on purpose. Keep them verbatim, because that repetition is what makes the set coherent.

### 4.1 Home, categories, editorial, provider CTA

#### `hero-home.jpg`
Home hero: full-bleed under the search card on mobile, right half running to the viewport edge on desktop. 4:5, 2000 × 2500. Focal point `60% 55%`.

```
A professional massage therapist, a German-Turkish woman of about 38 with dark hair tied back, in a plain charcoal short-sleeved tunic, gives a back massage to a client lying face down on a portable massage table that has been set up in the middle of a Berlin Altbau living room. The client's face is turned away and only her shoulders and back are visible under a folded ecru linen sheet. The room has a 3.4 metre stucco ceiling, lime-washed off-white walls, herringbone oak parquet and two tall white double casement windows at blue hour; a warm ceramic table lamp glows on a dark oak sideboard. The therapist's hands rest flat and calm on the client's shoulder blades. Shot on a 50 mm lens at f/2.8 from standing eye height, subject placed right of centre, quiet negative space of wall and window on the left, verticals straight. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `category-massage.jpg`
Category tile "Massage". 4:5, 1200 × 1500. Focal point `50% 45%`.

```
Close view of a male massage therapist's forearms and hands, a white German man of about 41 with greying hair on his arms, pressing slowly along the upper back of a client lying face down on a portable massage table in a Berlin Altbau living room; the client is a bearded man of about 40, face hidden in the face cradle, an oatmeal linen sheet folded at his waist. Late-afternoon window light rakes from the left across skin and fabric, showing real texture and fine hairs; a herringbone oak parquet floor and the white frame of a tall window are soft in the background. 50 mm lens at f/2.2, tight crop that cuts through the table and the therapist's shoulders. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `category-manikuere.jpg`
Category tile "Maniküre". 4:5, 1200 × 1500. Focal point `50% 55%`.

```
A manicure in progress at a dark oak dining table in a Berlin Altbau flat: a Vietnamese-German nail technician of about 29 with a straight black bob, in a plain black tee, holds a client's hand and shapes a nail with a fine file. The client is a Black German woman of about 34 in an ecru knit jumper, seen from the wrist to the shoulder, face out of frame. On the table: a folded charcoal cotton towel, a small open case of tools, a single glass of water, a nail colour in deep neutral taupe. Soft window light from the left, a warm lamp in the background, tall window frame softly out of focus. 50 mm lens at f/2.8, slightly elevated seated eye height, hands placed in the lower third. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `category-pedikuere.jpg`
Category tile "Pediküre". 4:5, 1200 × 1500. Focal point `50% 60%`.

```
A pedicure at home: a white German woman of about 67 with short silver hair sits relaxed in an oatmeal linen armchair by a tall Altbau window, trousers rolled to the calf, one bare foot resting on a folded charcoal towel on the knee of a nail technician who sits on a low stool facing her. The technician, a Vietnamese-German woman of about 29 with a black bob in a plain black tee, works with a nail file; only her hands, forearms and the back of her head are visible. Herringbone oak parquet, a ribbed white radiator under the window, late-afternoon daylight with a soft shadow pattern from the window frame. 35 mm lens at f/2.8 from seated height, composition weighted to the lower half, the client's calm face partly visible in soft focus at the top edge. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `category-kosmetik.jpg`
Category tile "Kosmetik". 4:5, 1200 × 1500. Focal point `48% 40%`.

```
A facial treatment in a Frankfurt hotel suite: a woman of about 45 with mixed heritage and natural curly hair wrapped in a plain grey hotel waffle robe without any logo lies back on a portable treatment couch next to a large window, eyes closed, a small amount of clear cream on her cheekbones. A cosmetician of about 52, a white German woman with short silver hair and fine lines, in a deep navy tunic, applies cream with two fingertips. Beside them a bouclé armchair and oak panelling; through the window, the soft early-evening Frankfurt skyline. 85 mm lens at f/2.8, three-quarter view from the head end, faces at upper third, real pores and skin texture visible. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `category-make-up.jpg`
Category tile "Make-up". 4:5, 1200 × 1500. Focal point `55% 38%`.

```
Make-up before an evening event in a Berlin Altbau bedroom: a South Asian woman of about 28 with long dark hair pinned back sits on a simple wooden chair by a tall window, face turned three-quarters towards the light, eyes closed. A Black German make-up artist of about 31 with natural short hair, in a plain black tee, leans in and applies foundation with a flat brush; an open black make-up case rests on a dark oak chest of drawers. The client's skin keeps its real texture and a few freckles; only a light, natural base. Cool window daylight on the faces, a warm lamp behind. 85 mm lens at f/2.5, both faces in the upper half, the artist's hand sharp, background soft. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `category-haare-styling.jpg`
Category tile "Haare & Styling". 4:5, 1200 × 1500. Focal point `50% 40%`.

```
A haircut at home in a bright Altbau kitchen: an East Asian man of about 30 sits on a wooden chair with a charcoal cape around his shoulders, looking calmly out of the window. Behind him a Syrian-German hairstylist of about 34 with styled dark hair and a trimmed beard, in a plain black tee, holds a comb and scissors and checks the line at the nape. A few cut hairs on the cape, a white tiled wall, an oak worktop with a single ultramarine-glazed ceramic cup, a tall window with soft overcast daylight. 50 mm lens at f/2.8 from standing height, both figures right of centre, negative space of wall on the left. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `category-brows-lashes.jpg`
Category tile "Brows & Lashes". 4:5, 1200 × 1500. Focal point `50% 42%`.

```
Close portrait of a brow treatment on a sofa in an Altbau living room: a client of about 35, a white German woman with natural thick eyebrows and visible skin texture, reclines against an oatmeal linen cushion, eyes closed, face lit by soft window light. A brow and lash artist of about 26, a Polish-German woman with red-blond hair in a low bun and freckles, in a plain charcoal tee, holds a slim brow brush and a small spoolie close to the client's brow; only her hand, wrist and part of her shoulder are visible. Warm lamp glow at the edge of the frame. 100 mm macro lens at f/4, the brow and the artist's fingertips in critical focus, shallow background. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `editorial-arrival.jpg`
"Schon da." band and the how-it-works opener. 3:2, 2400 × 1600. Focal point `58% 50%`.

```
The moment of arrival at a Berlin Altbau apartment door: a heavy wooden double door with original brass handle stands half open onto a stairwell with a turned wooden banister. A massage therapist of about 58, a Brazilian-German woman with grey curls, in a deep navy jacket over a black tunic, stands on the threshold with a folded portable massage table over her shoulder and a black kit bag in her hand, smiling briefly at the resident. The resident, seen from behind inside the flat, a man in an ecru knit jumper, holds the door. Warm hallway lamp inside, cooler daylight from the stairwell window. 35 mm lens at f/2.8 from inside the hallway, door frame as a strong vertical, figures right of centre, herringbone parquet in the foreground. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `editorial-setup.jpg`
How it works, step 2. 3:2, 2400 × 1600. Focal point `45% 60%`.

```
Hands and forearms of a male massage therapist in a plain charcoal tee unfolding a portable massage table on a herringbone oak parquet floor in a quiet Altbau living room, an ecru linen sheet folded neatly on the edge of an oatmeal sofa beside him, a black kit bag open on the floor. Late-afternoon window light makes long soft shadows of the window frame across the floor. No faces in frame. 35 mm lens at f/4 from a low kneeling height, strong diagonal of the table legs, floor texture sharp, background softly falling off. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `editorial-after.jpg`
How it works, step 3, and the confirmation screen on desktop. 3:2, 2400 × 1600. Focal point `35% 50%`.

```
After the treatment, evening in a Berlin Altbau living room: a white German woman of about 67 with short silver hair, in a soft charcoal cardigan, sits sideways on an oatmeal linen sofa with her legs tucked up, holding a cup of tea with both hands, eyes half closed, at ease. In the soft-focus background a therapist with grey curls in a navy tunic folds a linen sheet next to the closed portable table. A ceramic table lamp gives warm light; the tall window shows deep blue dusk. A single ultramarine-glazed vase stands on the dark oak sideboard. 50 mm lens at f/2, client sharp on the left third, generous dark negative space on the right for text. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `editorial-hotel.jpg`
Night band "Im Hotel" (persona: a business traveller, massage at 21:00). 3:2, 2400 × 1600. Focal point `62% 50%`.

```
Late evening in a contemporary Frankfurt hotel suite: a business traveller, a man of about 46 with short dark-blond hair, lies face down on a portable massage table set up beside a floor-to-ceiling window, a folded ecru linen sheet at his waist, his suit jacket hung over a bouclé armchair and a closed laptop on the desk. A male massage therapist of about 41 with short greying hair and stubble, in a plain charcoal tunic, works slowly along the man's shoulder with flat palms. Outside, the lit Frankfurt skyline in deep blue night; oak panelling, a brass reading lamp casting warm light, the bed made with crisp white linen in the background. 35 mm lens at f/2, figures right of centre, dark window and city glow on the left half for a text overlay. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `editorial-office.jpg`
Band "Im Büro" and the B2B page. 3:2, 2400 × 1600. Focal point `55% 45%`.

```
Lunchtime in a modern Hamburg-HafenCity office meeting room with exposed concrete ceiling, an oak table and glass partitions: a man of about 41 with a dark beard, in a light blue cotton shirt with sleeves rolled up, sits forward on an ergonomic massage chair, forehead resting on its padded face rest, eyes closed. Behind him a male massage therapist of about 41 with greying hair, in a plain charcoal tunic, works on his shoulders with both thumbs. A closed laptop and a glass of water on the table, colleagues blurred far behind the glass. Soft overcast daylight from a large window onto the harbour. 50 mm lens at f/2.8, slightly off-centre, clean architectural verticals. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `editorial-details.jpg`
"Was mitkommt" (what the professional brings) and the FAQ header. 1:1, 1600 × 1600. Focal point `50% 50%`.

```
The only top-down still life of the set: a professional's tools laid out in neat rows on a folded ecru linen cloth on a dark oak table, seen from directly above. A wooden-handled nail file, a set of black make-up brushes, a steel cuticle pusher, two folded charcoal cotton towels, a small unlabelled amber glass bottle of massage oil, a pair of hairdressing scissors and a comb, a black kit bag edge entering the frame on the right. Soft window light from the top-left with gentle real shadows, no reflections. 100 mm lens at f/8, everything sharp, calm grid-like arrangement with generous linen space around. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, labels, watermarks.
```

#### `provider-cta.jpg`
Night band "Für Profis" on the home and `/pro` landing pages. 16:9, 2880 × 1620. Focal point `68% 50%`.

```
A professional between appointments in a Berlin Altbau stairwell: a non-binary hairstylist of about 30 of South Asian heritage with a dark undercut, in a black work jacket and plain black tee, walks up worn wooden stairs with a black kit bag over one shoulder, one hand on the turned wooden banister, looking up the stairs with quiet confidence. Patterned floor tiles on the landing, a tall stairwell window with soft evening light, warm light spilling from a half-open flat door above. 35 mm lens at f/2.8 from the landing below, figure in the right third, deep calm shadow on the left half for a text overlay. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, glossy beauty-ad retouching, text, logos, watermarks, distorted hands or extra fingers.
```

#### `og-default.jpg`
Default social share image. Engineers overlay the wordmark at the bottom-left in Kalk on a 64 % scrim band. 1.91:1, 1200 × 630. Focal point `60% 45%`.

```
Wide, quiet view of a Berlin Altbau living room at blue hour, no people: a portable massage table dressed with a folded ecru linen sheet stands ready in the middle of a herringbone oak parquet floor, a black kit bag beside it; tall white double casement windows with deep blue sky, lime-washed walls, stucco ceiling, an oatmeal linen sofa, a ceramic table lamp glowing warm on a dark oak sideboard next to a single ultramarine-glazed vase. 35 mm lens at f/4 from standing eye height, verticals perfectly straight, table right of centre, calm empty floor at the bottom-left. Shot as an editorial lifestyle photograph on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, candid and unposed, calm documentary mood. Avoid: candles, stones, pebbles, orchids, bamboo, lotus, leaves or flowers as decoration, water drops, rolled spa towels, white spa robes, pink or rose-gold tones, ring lights, studio backdrops, salon interiors, text, logos, watermarks.
```

### 4.2 Professional portraits `pro-01.jpg` … `pro-10.jpg`

These are used on profile headers (4:5), in list rows (1:1 crop) and as avatars (circle crop). Each is 4:5, 1200 × 1500, with focal point `50% 36%` (eyes on the upper third, head and shoulders within the central square so every crop works).

**Fixed for all ten:**
- The same lime-washed plaster wall.
- The same soft window light from camera-left at 45°.
- The same 85 mm lens at f/4, at eye level.
- The same framing: head to mid-chest with 12 % headroom.
- Work tops in black, charcoal or navy.
- A calm, closed-mouth or slight natural smile, looking into the lens.

| File | Person | Specialty (used in) |
|---|---|---|
| pro-01 | German-Turkish woman, 38, dark hair tied back | Massage (`hero-home`) |
| pro-02 | White German man, 41, short greying hair and stubble, broad build | Massage (`category-massage`, `setup`, `office`, `hotel`) |
| pro-03 | Vietnamese-German woman, 29, straight black bob | Maniküre & Pediküre (`category-manikuere`, `category-pedikuere`) |
| pro-04 | White German woman, 52, short silver hair, fine lines | Kosmetik (`category-kosmetik`) |
| pro-05 | Black German woman (Ghanaian heritage), 31, short natural hair | Make-up (`category-make-up`) |
| pro-06 | Syrian-German man, 34, styled dark hair, trimmed beard | Haare & Styling (`category-haare-styling`) |
| pro-07 | Polish-German woman, 26, red-blond hair in a low bun, freckles | Brows & Lashes (`category-brows-lashes`) |
| pro-08 | Brazilian-German woman, 58, grey curls, laughter lines | Massage (`arrival`, `after`) |
| pro-09 | Non-binary person of South Asian heritage, 30, dark undercut | Haare & Styling (`provider-cta`) |
| pro-10 | Nigerian-German man, 27, close-cropped hair, slim build | Kosmetik & men's grooming |

The ten prompts below share one template; only the person sentence differs.

#### `pro-01.jpg`
```
Head-and-shoulders profile portrait of a professional massage therapist, a German-Turkish woman of about 38 with dark brown hair tied back in a low knot, small gold stud earrings, wearing a plain charcoal short-sleeved work tunic, looking straight into the lens with a calm, warm closed-mouth smile. Plain lime-washed warm off-white plaster wall behind her with subtle texture, soft window light from camera-left at 45 degrees, gentle natural shadow on the right side of the face. 85 mm lens at f/4, eye-level, framed from the top of the head to mid-chest with a little headroom, face centred. Shot as an editorial portrait on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: studio backdrop paper, ring-light catchlights, glossy beauty-ad retouching, heavy make-up, pink or rose-gold tones, props, plants, text, logos, watermarks.
```

#### `pro-02.jpg`
```
Head-and-shoulders profile portrait of a professional massage therapist, a white German man of about 41 with short greying hair, light stubble and a broad, sturdy build, wearing a plain charcoal crew-neck work tee, looking straight into the lens with a relaxed, friendly slight smile. Plain lime-washed warm off-white plaster wall behind him with subtle texture, soft window light from camera-left at 45 degrees, gentle natural shadow on the right side of the face. 85 mm lens at f/4, eye-level, framed from the top of the head to mid-chest with a little headroom, face centred. Shot as an editorial portrait on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: studio backdrop paper, ring-light catchlights, glossy beauty-ad retouching, heavy make-up, pink or rose-gold tones, props, plants, text, logos, watermarks.
```

#### `pro-03.jpg`
```
Head-and-shoulders profile portrait of a professional nail technician, a Vietnamese-German woman of about 29 with a straight, chin-length black bob and a neat fringe, no jewellery, wearing a plain black short-sleeved tee, looking straight into the lens with a calm, confident closed-mouth expression and a hint of a smile. Plain lime-washed warm off-white plaster wall behind her with subtle texture, soft window light from camera-left at 45 degrees, gentle natural shadow on the right side of the face. 85 mm lens at f/4, eye-level, framed from the top of the head to mid-chest with a little headroom, face centred. Shot as an editorial portrait on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: studio backdrop paper, ring-light catchlights, glossy beauty-ad retouching, heavy make-up, pink or rose-gold tones, props, plants, text, logos, watermarks.
```

#### `pro-04.jpg`
```
Head-and-shoulders profile portrait of a professional cosmetician, a white German woman of about 52 with short, softly tousled silver hair, fine lines around the eyes, minimal make-up and a thin silver necklace, wearing a plain deep navy work tunic with a small stand collar, looking straight into the lens with a composed, kind slight smile. Plain lime-washed warm off-white plaster wall behind her with subtle texture, soft window light from camera-left at 45 degrees, gentle natural shadow on the right side of the face. 85 mm lens at f/4, eye-level, framed from the top of the head to mid-chest with a little headroom, face centred. Shot as an editorial portrait on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: studio backdrop paper, ring-light catchlights, glossy beauty-ad retouching, heavy make-up, pink or rose-gold tones, props, plants, text, logos, watermarks.
```

#### `pro-05.jpg`
```
Head-and-shoulders profile portrait of a professional make-up artist, a Black German woman of Ghanaian heritage of about 31 with short natural coily hair, small gold hoops and a light, natural make-up, wearing a plain black crew-neck tee, looking straight into the lens with a warm, self-assured closed-mouth smile. Plain lime-washed warm off-white plaster wall behind her with subtle texture, soft window light from camera-left at 45 degrees, gentle natural shadow on the right side of the face, rich true-to-life skin tones. 85 mm lens at f/4, eye-level, framed from the top of the head to mid-chest with a little headroom, face centred. Shot as an editorial portrait on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: studio backdrop paper, ring-light catchlights, glossy beauty-ad retouching, heavy make-up, pink or rose-gold tones, props, plants, text, logos, watermarks.
```

#### `pro-06.jpg`
```
Head-and-shoulders profile portrait of a professional hairstylist, a Syrian-German man of about 34 with thick dark hair styled back, a neatly trimmed beard and warm brown eyes, wearing a plain black short-sleeved work tee, looking straight into the lens with an easy, friendly slight smile. Plain lime-washed warm off-white plaster wall behind him with subtle texture, soft window light from camera-left at 45 degrees, gentle natural shadow on the right side of the face. 85 mm lens at f/4, eye-level, framed from the top of the head to mid-chest with a little headroom, face centred. Shot as an editorial portrait on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: studio backdrop paper, ring-light catchlights, glossy beauty-ad retouching, heavy make-up, pink or rose-gold tones, props, plants, text, logos, watermarks.
```

#### `pro-07.jpg`
```
Head-and-shoulders profile portrait of a professional brow and lash artist, a Polish-German woman of about 26 with red-blond hair in a low bun, many natural freckles, defined but natural eyebrows and no visible make-up, wearing a plain charcoal crew-neck tee, looking straight into the lens with a calm, open closed-mouth smile. Plain lime-washed warm off-white plaster wall behind her with subtle texture, soft window light from camera-left at 45 degrees, gentle natural shadow on the right side of the face. 85 mm lens at f/4, eye-level, framed from the top of the head to mid-chest with a little headroom, face centred. Shot as an editorial portrait on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: studio backdrop paper, ring-light catchlights, glossy beauty-ad retouching, heavy make-up, pink or rose-gold tones, props, plants, text, logos, watermarks.
```

#### `pro-08.jpg`
```
Head-and-shoulders profile portrait of a professional massage therapist, a Brazilian-German woman of about 58 with shoulder-length grey curls, laughter lines and warm olive skin, wearing a plain deep navy short-sleeved work tunic, looking straight into the lens with a generous, natural closed-mouth smile. Plain lime-washed warm off-white plaster wall behind her with subtle texture, soft window light from camera-left at 45 degrees, gentle natural shadow on the right side of the face. 85 mm lens at f/4, eye-level, framed from the top of the head to mid-chest with a little headroom, face centred. Shot as an editorial portrait on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: studio backdrop paper, ring-light catchlights, glossy beauty-ad retouching, heavy make-up, pink or rose-gold tones, props, plants, text, logos, watermarks.
```

#### `pro-09.jpg`
```
Head-and-shoulders profile portrait of a professional hairstylist, a non-binary person of South Asian heritage of about 30 with a dark undercut swept to one side, a small silver nose stud and an androgynous style, wearing a plain black work jacket over a black tee, looking straight into the lens with a quiet, confident expression and a slight smile. Plain lime-washed warm off-white plaster wall behind them with subtle texture, soft window light from camera-left at 45 degrees, gentle natural shadow on the right side of the face. 85 mm lens at f/4, eye-level, framed from the top of the head to mid-chest with a little headroom, face centred. Shot as an editorial portrait on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: studio backdrop paper, ring-light catchlights, glossy beauty-ad retouching, heavy make-up, pink or rose-gold tones, props, plants, text, logos, watermarks.
```

#### `pro-10.jpg`
```
Head-and-shoulders profile portrait of a professional cosmetician specialising in men's grooming, a Nigerian-German man of about 27 with close-cropped hair, a clean-shaven face, a slim build and deep brown skin, wearing a plain charcoal crew-neck work tee, looking straight into the lens with a relaxed, friendly closed-mouth smile. Plain lime-washed warm off-white plaster wall behind him with subtle texture, soft window light from camera-left at 45 degrees, gentle natural shadow on the right side of the face, rich true-to-life skin tones. 85 mm lens at f/4, eye-level, framed from the top of the head to mid-chest with a little headroom, face centred. Shot as an editorial portrait on a full-frame camera, natural light with real soft shadows, muted warm-neutral colour grade (lime-washed off-white, oak, linen, charcoal, ink), gentle contrast, fine film grain, true-to-life unretouched skin with visible texture, candid and unposed, calm documentary mood. Avoid: studio backdrop paper, ring-light catchlights, glossy beauty-ad retouching, heavy make-up, pink or rose-gold tones, props, plants, text, logos, watermarks.
```

### 4.3 Portrait guide for real providers (onboarding in `/pro`)

Show this as a short checklist next to the photo upload:

- Stand about 1 m in front of a plain light wall, facing a window. No flash.
- The phone is at eye height, in portrait orientation, using the main camera (not the selfie camera, if possible).
- Head to chest in frame, look into the lens.
- Wear your normal work clothes. No filters, no sunglasses, no other people.

The upload screen crops to 4:5 with a face guide, and the app derives the 1:1 and circle crops from it.

---

## 5. Fallback: when no photography is available

The UI must look finished without a single photo. Placeholders are **tone-on-tone colour fields with typography**. They are never grey boxes with an image icon, never silhouettes and never gradients. The same panel also serves as the loading state underneath a real image: the photo simply fades in over it (640 ms, `ease-calm`).

### 5.1 Category and editorial panels

Keys are the category slugs from `product-spec.md`, so `bg-tone-${slug}` works directly. Use the same aspect ratio as the intended image and square corners. The panel is decorative (`aria-hidden="true"`), and the real label is rendered as text elsewhere, for example in the tile caption below.

| Key | Panel `bg-tone-*` | Type `text-tone-*-ink` | Used for |
|---|---|---|---|
| `massage` | `#E7E0D3` | `#B5A994` | Massage |
| `manikuere` | `#E4DCD0` | `#A8957F` | Maniküre |
| `pedikuere` | `#E9E3D1` | `#B4A783` | Pediküre |
| `kosmetik` | `#DFE2E0` | `#A3ABA7` | Kosmetik |
| `make-up` | `#D9D6D2` | `#9E9891` | Make-up |
| `haare-styling` | `#E2D8CA` | `#A99377` | Haare & Styling |
| `brows-lashes` | `#2A2824` | `#4A4640` | Brows & Lashes |
| `nacht` | `#161513` | `#2E2B27` | Hero, editorial and night bands |

**Rendering**
- **Box:** `relative overflow-hidden aspect-[4/5] bg-tone-{key}`. Editorial panels use `aspect-[3/2]`.
- **Roof line:** `absolute left-5 top-5 h-0.5 w-6 bg-tone-{key}-ink`. At `lg`, use `left-7 top-7`.
- **Word:** `absolute inset-x-5 bottom-5 type-display-m italic text-tone-{key}-ink`, at most two lines, using the category's display name with `&shy;` where needed (*Haare & Sty&shy;ling*). At `lg`, use `inset-x-7 bottom-7`. On hero and editorial panels, step up to `type-display-l`.
- Nothing else goes on the panel: no icons and no logo.

Markup illustration (not a component):

```html
<div class="relative aspect-[4/5] overflow-hidden bg-tone-massage" aria-hidden="true">
  <span class="absolute left-5 top-5 h-0.5 w-6 bg-tone-massage-ink"></span>
  <span class="absolute inset-x-5 bottom-5 type-display-m italic text-tone-massage-ink">Massage</span>
</div>
```

### 5.2 Hero and editorial fallback

- The hero uses a `nacht` panel (4:5 on mobile, right half on desktop) inside `data-theme="night"`.
- The panel holds the decorative words *Schon da.* in `type-display-l` italic `text-tone-nacht-ink`, bottom-left.
- Above them, a **real, readable** Ortszeile in `type-caption text-ink-muted` (night muted, 7.13:1): *Altbau, 3. OG · Berlin-Prenzlauer Berg · 19:30*.
- Editorial bands work the same way, with their own place lines: *Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10* and *Besprechungsraum · Hamburg-HafenCity · 13:00*.

### 5.3 People

- **Portraits (4:5 and 1:1):**
  - Panel `bg-surface-sunken`.
  - The person's initials in Newsreader 380 at 32 % of the tile width, centred at 40 % from the top, in `text-tone-massage-ink`.
  - Decorative, because the name is always printed next to it.
- **Avatars (≤ 48 px circles):** initials in Instrument Sans 600 at 40 % of the diameter, `text-ink-muted` on `bg-surface-sunken` (4.75:1).

### 5.4 Social image fallback

`og-default` becomes a Kalk canvas (1200 × 630):
- The wordmark in ink, 64 px tall, top-left at 64 px.
- *Wellness, die zu Ihnen kommt.* in Newsreader 360 at 64 px, bottom-left, set in two lines.
- A 24 × 2 roof line above the headline.
