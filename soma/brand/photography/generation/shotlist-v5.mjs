// SOMA photography v5: post-review fixes (Photo Art Director, 2 Nov 2026; review: docs/qa/review-entdecken-photos.md R8, R11).
// Each fix is an edit of the file in use: its Higgsfield job is the image reference and the prompt changes only the
// defect, so the role, the composition, the ratio and the focal point stay. Registered as `-v5` (hop limit 8).
import { STYLE } from "./shotlist-v3.mjs";
export const MODEL = { model: "nano_banana_pro", resolution: "2k" };
const EDIT = (change) =>
  `Edit the reference photo. Keep everything else exactly as it is: the people, their faces, poses, hands and light work clothes, the room and furniture, the bright warm daylight, the colours and the framing. Change only this: ${change} Photorealistic, the same clean, bright, warm high-key grade. No text, letters, logos or labels anywhere.`;

export const V5 = [
  // R8 — artefacts and discretion
  { id: "F01", review: "R8", path: "/images/portfolio/brows-lashes-5-v5.jpg", replaces: "/images/portfolio/brows-lashes-5-v3.jpg", ref: "8210790f-f16c-4ab0-b34a-d144133b22b4", aspect: "1:1",
    issue: "a third hand at the right edge holds the thread",
    prompt: EDIT("remove the third hand and the thread at the right edge completely. Exactly two hands remain, both the brow professional's: one rests lightly on the client's forehead, the other holds the fine white brow pencil that marks the arch of the brow (brow mapping with a pencil, no string).") },
  { id: "F02", review: "R8", path: "/images/editorial/arrival-v5.jpg", replaces: "/images/editorial/arrival-v3.jpg", ref: "20b2fd79-1bde-401c-a323-1fae686a8dc8", aspect: "3:2",
    issue: "a torn black hole in the side of the table bag",
    prompt: EDIT("the sand canvas carry case of the folded massage table is intact and smooth, with neat seams, a zip and a handle, and no holes, tears or dark openings anywhere.") },
  { id: "F03", review: "R8", path: "/images/editorial/setup-v5.jpg", replaces: "/images/editorial/setup-v3.jpg", ref: "1255ffbf-4785-48aa-a442-14043b7eeff6", aspect: "3:2",
    issue: "the portable massage table is a bare wooden frame without its padded top",
    prompt: EDIT("the portable massage table is complete: on top of the light wooden legs sit its two padded, cream-upholstered top halves, opening like a book as the hands unfold it, a real professional massage table.") },
  { id: "F04", review: "R8", path: "/images/portfolio/massage-4-v5.jpg", replaces: "/images/portfolio/massage-4-v3.jpg", ref: "d6628d35-dc83-4a41-8d0a-f08a5fdac552", aspect: "1:1",
    issue: "the back is bare almost to the waist",
    prompt: EDIT("the fresh white linen sheet is drawn up over the client's back to the shoulder blades, so that only the shoulders, the top of the shoulder blades and the neck are bare; the massage professional's forearm rests on the upper back above the sheet.") },
  // R11 — non-German cues
  { id: "F05", review: "R11", path: "/images/pros/pro-16-v5.jpg", replaces: "/images/pros/pro-16-v4.jpg", ref: "181b2841-7ecd-4998-b934-885927c5b8c4", aspect: "4:5",
    issue: "Manhattan-like skyline (Yasmin K., Frankfurt)",
    prompt: EDIT("the view through the window shows Frankfurt-Westend: green tree tops and light Gründerzeit apartment façades with tiled roofs across the street, no high-rise towers.") },
  { id: "F06", review: "R11", path: "/images/pros/pro-30-v5.jpg", replaces: "/images/pros/pro-30-v4.jpg", ref: "523bf6e2-ffb4-4c86-aea0-59089df49cc8", aspect: "4:5",
    issue: "Manhattan-like skyline (Theresa H., München)",
    prompt: EDIT("the view through the floor-to-ceiling window shows Munich: low, light old-town façades and red tiled roofs, green tree tops and two distant church towers with green domes, no high-rise towers."),
    // attempt 2 edits attempt 1 (its job as the reference): the view was right, a transom ghost was left on the glass
    retry: "remove the semi-transparent grey horizontal bar that floats across the window glass between the two white vertical window frames, so the glass there is perfectly clear and shows the city view continuously; the two white vertical frames stay." },
  { id: "F07", review: "R11", path: "/images/explore/im-hotel-ankommen-v5.jpg", replaces: "/images/explore/im-hotel-ankommen.jpg", ref: "178e4898-5a9c-4ec2-9706-b627d828466d", aspect: "4:5",
    issue: "Manhattan/Asian skyline",
    prompt: EDIT("the view through the window shows a German city centre in daylight: light old-town façades, red tiled roofs, green tree tops and a distant church spire, no high-rise towers.") },
  { id: "F08", review: "R11", path: "/images/portfolio/make-up-9-v5.jpg", replaces: "/images/portfolio/make-up-9-v3.jpg", ref: "eea81831-04aa-4587-8fd4-df400e356c7f", aspect: "1:1",
    issue: "Manhattan-like skyline in the office window (Charlotte J., Hamburg)",
    prompt: EDIT("the view through the office window shows Hamburg: the red-brick warehouses of the Speicherstadt along a canal and green trees in daylight, no high-rise towers.") },
  { id: "F09", review: "R11", path: "/images/portfolio/massage-16-v5.jpg", replaces: "/images/portfolio/massage-16-v3.jpg", ref: "c326bfef-8df7-4e08-94e4-47dc79e5f85b", aspect: "1:1",
    issue: "an office over Sydney Harbour (Hanna B., Berlin)",
    prompt: EDIT("the view through the windows shows Berlin: the river Spree with light stone embankments, green trees and light six-storey Altbau façades on the far bank in sunshine; no harbour bridge, no opera house, no high-rise towers.") },
  { id: "F10", review: "R11", path: "/images/pros/pro-18-v5.jpg", replaces: "/images/pros/pro-18-v4.jpg", ref: "6f052ea4-068e-4a1e-969a-dd72df9a5729", aspect: "4:5",
    issue: "US-style switch and outlet plates (Emre Y., Köln)",
    prompt: EDIT("remove the light switches and wall sockets from the wall entirely, leaving a plain, smooth white wall there.") },
  { id: "F11", review: "R11", path: "/images/categories/manikuere-v5.jpg", replaces: "/images/categories/manikuere-v3.jpg", ref: "96754f7e-24ef-4f64-b562-ac1033929c8f", aspect: "4:5",
    issue: "the nail professional wears black trousers",
    prompt: EDIT("the nail professional's black trousers become light sand-coloured tailored trousers that match her tunic.") },
  // Lead, 2 Nov (from the Explore engineer, review § Für dich 2): the caption is right, the picture doesn't carry it at card
  // size: two hands round a cup, the micro-French tips about 2 px at 260 px, so Mai T.'s „Shellac-Maniküre“ card reads as
  // „hands holding a cup“. Not an edit but a new frame (text only, the v3 style block), with the nails as the subject.
  { id: "F12", review: "Explore", path: "/images/portfolio/manikuere-3-v5.jpg", replaces: "/images/portfolio/manikuere-3-v3.jpg", aspect: "1:1", how: "new frame, text only, v3 style block",
    issue: "caption „Micro-French auf kurzen Nägeln“, but at card size the picture reads as two hands holding a cup",
    prompt: "Close-up nail photograph for a manicure portfolio: one relaxed female hand rests palm-down on a light oak table, fingers gently fanned and turned slightly toward the camera, the hand and its nails filling most of the frame and sharp. Short, neat, softly rounded natural nails in a sheer pinkish nude, each with a fine but clearly visible bright white tip line along the free edge (a micro French manicure), glossy fresh finish, clean cuticles. Exactly five fingers, natural proportions, real skin texture. Softly out of focus behind: a white ceramic cup and a folded linen napkin." + STYLE },
];
