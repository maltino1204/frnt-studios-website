// SOMA photography v6: fixes after landing audit 4 (Photo Art Director, 2 Nov 2026; docs/landing/audit-4.md N4-3, N4-5,
// N4-6 / remediation R4-2, R4-5 and the P3 notes in § 2).
// From v6 on, every fetched attempt gets its own, never-used file name (PHOTOGRAPHY.md § 11, "Fresh names"): attempt 1
// is `<base>-v6.jpg`, attempt 2 `<base>-v6b.jpg`, and so on, so no optimiser or CDN cache keyed by URL can ever serve a
// rejected attempt under an approved name. tools/v6-register.mjs derives the path from the attempt number.
import { STYLE } from "./shotlist-v3.mjs";
export const MODEL = { model: "nano_banana_pro", resolution: "2k" };
const EDIT = (change) =>
  `Edit the reference photo. Keep everything else exactly as it is: the people, their faces, poses, hands and light work clothes, the room and furniture, the bright warm daylight, the colours and the framing. Change only this: ${change} Photorealistic, the same clean, bright, warm high-key grade. No text, letters, logos or labels anywhere.`;
export const attemptPath = (base, attempt) => base.replace(/\.jpg$/, `-v6${attempt > 1 ? String.fromCharCode(96 + attempt) : ""}.jpg`);

export const V6 = [
  { id: "G01", review: "N4-5", base: "/images/editorial/hotel.jpg", replaces: "/images/editorial/hotel-v3.jpg", ref: "f75be53e-05a5-4f8a-8013-4d46dec7bcbd", aspect: "3:2",
    issue: "landing hero „Im Hotel“: the guest's back is bare from the neck to mid-back (discretion rule: linen to the shoulder blades or higher); AUDIT-v3 said „sheet at the shoulder blades“",
    prompt: EDIT("the fresh white linen sheet is drawn up over the guest's back to his shoulder blades, so that only his shoulders, the top of the shoulder blades and the neck are bare; the massage professional's two hands rest on the guest's shoulders and upper shoulder blades, on the skin just above the sheet's folded edge.") },
  { id: "G02", review: "N4-5", base: "/images/categories/massage.jpg", replaces: "/images/categories/massage-v3.jpg", ref: "1b5c37b0-5fc8-40e0-9c7a-fd631413fdaa", aspect: "4:5",
    issue: "category tile Massage: the same bare back to mid-back, at tile scale (audit 4 § 8, Discretion)",
    prompt: EDIT("the fresh white linen sheet is drawn up over the client's back to his shoulder blades, so that only his shoulders, the top of the shoulder blades and the neck are bare; the massage professional's two hands rest on the client's shoulders, on the skin just above the sheet's folded edge.") },
  { id: "G03", review: "N4-6", base: "/images/categories/pedikuere.jpg", replaces: "/images/categories/pedikuere-v3.jpg", ref: "cc710e11-7d60-4d89-bd75-2d0d918fadc5", aspect: "4:5",
    issue: "category tile Pediküre: the pedicure Profi works barefoot (audit 4 P3, as audit 1 A6)",
    prompt: EDIT("the pedicure professional sitting on the low wooden stool wears clean, plain, light sand-coloured leather slip-on shoes on both feet, so her feet are no longer bare; the client's feet stay bare.") },
  { id: "G04", review: "N4-6", base: "/images/editorial/after.jpg", replaces: "/images/editorial/after-v3.jpg", ref: "f491b396-2d60-4d36-a6e9-9e873d21e2aa", ref2: "360752f5-bfd2-463e-99bf-75d596204477", aspect: "3:2",
    issue: "the landing's signature pair (03, „one afternoon in two moments“): a younger man opens the door, an older woman sits on the sofa",
    prompt: "Edit the first reference photo. Keep everything else exactly as it is: the room, the sofa, the plant, the massage table, the massage professional with red hair in a white tunic folding linen in the background, the bright warm daylight, the colours and the framing. Change only this: the client relaxing on the left of the sofa is now the man from the second reference photo, the client who opened the door to her: a man of about 30 with short dark-brown hair and light stubble, wearing the same cream waffle-knit jumper, with light sand linen trousers and light grey socks. He sits in the same place, legs drawn up on the sofa, both hands round a cup of tea, looking down at it with a slight, content smile. Photorealistic, the same clean, bright, warm high-key grade. No text, letters, logos or labels anywhere." },
];

// R4-2: approved files whose name had carried earlier attempts (tools/fresh-check.mjs, 2 Nov 2026). Each gets a fresh,
// never-used `-v6` name with the same remote (the approved job), and the old name `replacedBy` → it. hotel-v3 is not
// listed: G01 replaces it.
export const RENAME = [
  "/images/landing/app-pro-v3.jpg", "/images/explore/nach-dem-sport.jpg",
  "/images/portfolio/brows-lashes-4-v3.jpg", "/images/portfolio/haare-styling-17-v3.jpg", "/images/portfolio/kosmetik-8-v3.jpg",
  "/images/portfolio/kosmetik-13-v3.jpg", "/images/portfolio/make-up-8-v3.jpg", "/images/portfolio/manikuere-1-v3.jpg",
  "/images/portfolio/manikuere-4-v3.jpg", "/images/portfolio/manikuere-7-v3.jpg", "/images/portfolio/massage-6-v3.jpg",
  "/images/portfolio/massage-18-v3.jpg",
  "/images/pros/pro-08-v4.jpg", "/images/pros/pro-10-v4.jpg", "/images/pros/pro-27-v4.jpg", "/images/pros/pro-29-v4.jpg", "/images/pros/pro-30-v5.jpg",
];
export const renamed = (p) => p.replace(/(-v\d+)?\.jpg$/, "-v6.jpg");
export { STYLE };
