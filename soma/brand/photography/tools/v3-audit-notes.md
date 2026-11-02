## 2. What QA found, and how the set was fixed

Every downloaded file was looked at: contact sheets per group, then every image with people at full size, hands and faces cropped at 150–200 %. The reasons per image are in § 4; these were the systematic ones.

| Finding | Images | Fix |
|---|---|---|
| **Portraits: one arm hidden.** The slight three-quarter turn of the first template hid the far arm behind the torso; only its hand showed in the clasp. | 26 of 30 (attempt 1), Selin A. included | A frontal prompt alone did not hold (Selin still turned; Thomas's hands fell below the frame). Final: the same text plus **pro-08-v3 (Márcia S., attempt 1) as a pose/framing reference** ("only for the pose, the framing, the light and the background; the person is a different individual"), framed to mid-thigh. Four men and women whose arms then hung straight got one more sentence ("hands at navel height … never cut off"). 04 and 09 passed attempt 1 but were redone so that all 30 share one pose, crop and background. |
| **Selin A.** (B2B demo persona) | `pros/pro-01-v3` | Checked at 200 %: frontal, both arms, both hands (fingers lightly interlaced, nothing fused or missing), warm and confident, ivory tunic with a thin oxblood piping. |
| **Gloves** (clinic look, § 8) | manikuere-7, kosmetik-8, kosmetik-13, brows-lashes-4 | "bare hands, no gloves" in the prompt. |
| **Spa props**: towel turbans, decorative rolled towels | explore/im-hotel-ankommen, massage-4, massage-6, kosmetik-8, landing/app-pro | Removed by prompt. Small folded or rolled towels deep in the background of massage-6/18 and a functional neck roll (kosmetik-5) were accepted. |
| **Logos and fake text**: an apple logo on a laptop, embroidered text on a tunic, brand-like stripes on running shoes | editorial/hotel (twice), explore/nach-dem-sport | "completely plain, blank lid", "plain tunic without embroidery", "plain white shoes without logo or stripes". |
| **Discretion**: sheet at the waist on hero-scale massages, a client in a sports bra, a client who read unclothed | editorial/hotel, explore/im-hotel-ankommen, massage-18, make-up-8 | Sheet drawn high (only shoulders and neck bare), a t-shirt, a high-necked knit. |
| **Caption truth** (the portfolio shows the work as done) | manikuere-1 (taupe), -3 (micro French), -4 (black line), haare-styling-17 (low bun) | Macro framing so the nail work is legible; the braids explicitly in one low bun. |
| **Role and identity** | explore/nach-dem-sport (the Profi came out female), pros/pro-13 (read Southeast Asian, not Korean) | Gender and features stated twice. |
| **Wardrobe**: a black sleeve on a make-up artist | make-up-8 | "crisp ivory linen sleeve". |
| **Product contract**: the landing band (chapter 05, ≥ 1024 px) sets Bone text on the photo's left third, measured ≥ 12:1 | editorial/provider-cta | Attempt 2 keeps the Profi bright and puts a deep, evenly lit espresso-brown painted wall in the left 45 % as the calm zone: **12.2:1 left of 31 %, 10.0:1 to 43 %** (measured on the file). |
| **Alt text**: the landing describes app-pro as „schaut auf das Smartphone“ | landing/app-pro | The Profi now looks down at the phone (screen black, for comps). |

## Notes for the Lead and the landing owner

- **Portraits v4.** After the client asked for more variety, the 30 Profi portraits were regenerated as `pros/pro-NN-v4` (v3 → `replacedBy` v4): see **`AUDIT-v4.md`**. The v3 rows for `pros/` below remain the record of the v3 round.

- **Ortszeilen.** The landing hard-codes evening times (17:40–21:10). v3 reads them as long summer evenings (warm low sun, rooms fully lit), so image and line agree; a later copy pass may move them to daytime (`PHOTOGRAPHY.md` § 10).
- **`landing/hero-home-4x5.jpg`** (the home hero's „Zu Hause“ place) was a derived file outside the registry, so `replacedBy` could not reach it. It is now registered as a recrop of `landing/hero-mobile.jpg` with `replacedBy` → `landing/hero-home-4x5-v3.jpg` (the same 4:5 crop of the v3 mobile hero, focal 50 % 45 %, as `scripts/landing/derive-hero.mjs` does). No code changed. `hero/home-v3` is the 4:5 crop at 50 % 62 %, as in v2.
- **Widths.** `nano_banana_pro` 2k delivers 2731 × 1536 px at 16:9 and 1843 × 2304 px at 4:5. `landing/hero-wide-v3` and `editorial/provider-cta-v3` (registry 2880 wide) and the 2000-wide landing 4:5 entries are therefore served at the source width (the fetch never enlarges). All other groups meet their registry size.
- **`src/lib/images.local.json`** keeps 14 stale lines for the temporary model and pose tests (`/images/_v3-test/*`, files and registry entries removed). The fetch script only adds lines; they are harmless (`resolveImage` checks registry paths only). Not hand-edited, per the rule that the workflow owns the file.
- **Hero-wide** (`landing/hero-wide-v3`, not referenced by the landing code at the moment): the Profi's trousers read oxblood, more than the "one subtle detail"; acceptable until the shoot.
- **AI labels** are unchanged: every image is still in `sources.json`, so `isAiImage()` and the „Demo-Profil · Foto KI-generiert“ label apply to every v3 portrait.

## 5. Contact sheets (`brand/photography/v3/`, each ≤ 300 KB)

| Sheet | Content |
|---|---|
| `00-model-test.jpg` | The ten model-test images (§ 1) |
| `01-pros-before.jpg` / `01-pros-after.jpg` | The 30 Profi portraits |
| `02-keys-before.jpg` / `02-keys-after.jpg` | Landing, hero, editorial, OG |
| `03-categories-before.jpg` / `03-categories-after.jpg` | The seven category tiles |
| `04-explore-new.jpg` | The six „Entdecken“ covers (new) |
| `05-portfolio-a-*.jpg`, `06-portfolio-b-*.jpg` | The 85 portfolio images, before and after |
| `07-product-*.jpg` | The set in the product (dev server, Playwright): `/`, `/profis/selin-a-berlin`, `/behandlungen`, `/suche?plz=10115` |
| `luminance.json` | Per-image luminance, before and after |

**Grade masters for v3:** `landing/hero-home-4x5-v3` (the home hero), `pros/pro-01-v3` (the portrait series), `categories/manikuere-v3`, `editorial/after-v3`.
