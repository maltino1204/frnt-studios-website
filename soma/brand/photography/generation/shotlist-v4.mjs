// SOMA photography v4: the 30 Profi portraits with more variety (Photo Art Director, 2 Nov 2026).
// Client (2 Nov): „mach ruhig mit etwas mehr Abwechslung!“ — v3 used one backdrop, one pose and one framing for all 30.
// v4 keeps the v3 „Tageslicht“ light, grade and wardrobe and each Profi's identity (their v3 portrait is the image
// reference), and varies setting (6 × 5), pose (7 kinds, 4–5 each), set dressing (no plant/shelf combination twice)
// and framing (mostly head to waist; seated and arms-at-the-sides frames slightly wider so the hands stay in).
//   node brand/photography/generation/shotlist-v4.mjs   → prints the spread of settings and poses
export const MODEL = { model: "nano_banana_pro", resolution: "2k" };

// v3 final portrait job per Profi (generation/jobs-v3.json → current)
export const REF = {
  "01": "bc1c2887-358c-4c55-8953-9954c5b2b50f", "02": "c9b3e098-6a66-4017-8fc9-dbb44767ca62", "03": "8c108f1a-eddf-4091-85d3-a98a94648c93",
  "04": "34dc4bf8-ce75-4d30-95ea-555ac558b30a", "05": "3607603f-5e3b-4630-92a4-9c2ef39f685a", "06": "7c8718c6-c887-485d-8fe6-9d321a12e8da",
  "07": "9a1b33ef-a04a-470b-96fb-aa15e3fb12cd", "08": "59cd910e-89cd-4798-ba53-ff3b073d66b1", "09": "2b656b33-c59f-4006-afad-9d2a56e213f3",
  "10": "af6d3e14-4042-49f5-bcdc-5f055185b819", "11": "2ab22d83-cb6e-4517-afb3-175341a34886", "12": "47e11f6a-15d5-40e0-991c-5f3e00bfb640",
  "13": "3821eca3-7e7c-45da-9ec5-31e0a8870852", "14": "5b6d118e-0798-4468-98cc-934ad548e23f", "15": "0802ee4b-151a-4129-a414-12a234169114",
  "16": "ac323fcf-6577-41a8-bdc4-287a097eeedc", "17": "4d2cf51f-3591-4c25-90e7-e8ee9cc63535", "18": "aca44ef9-041d-4697-941c-6038b067ced2",
  "19": "8a7652c2-9ba5-40cf-bf2c-3dcc1030ad13", "20": "06270eb8-4b89-4e31-924d-b47fb38d77c8", "21": "2432cbac-3c68-42bc-a943-3db4a0715318",
  "22": "2790a793-1175-4fcc-8bc7-7c121a762732", "23": "893a2de5-7670-42c1-a3c1-76a2d7564be7", "24": "1109952e-cef5-4ae0-bc51-d05abcab028d",
  "25": "09c5f6ef-2722-4a09-9e44-5e1444277efd", "26": "7d7ce569-0d0f-42a4-abe5-3258fa565d6f", "27": "dfe0601d-9d23-47ca-90de-1a6384e73e02",
  "28": "2d16a866-e978-4c9c-bbba-15067e416bc1", "29": "0f1f319d-55ea-40f1-bb52-b22e09cf1b94", "30": "caf5591f-f73f-4bcb-b664-9a0cdb304c84",
};

const SETTING = { A: "own studio", B: "client's living room", C: "doorway arrival", D: "hotel", E: "office", F: "window with tools" };
const POSE = {
  T: "holding {obj} in front of the body with both hands at waist height, both hands fully visible",
  X: "arms lightly crossed in front of the chest, both forearms complete and both hands visible resting on the upper arms",
  L: "leaning lightly with one hip against {obj}, both hands resting on its edge, both arms complete",
  S: "seated {obj}, upright and relaxed, both hands resting together in the lap or on the table, both arms complete",
  G: "a natural, open laugh while still looking into the lens, {obj}",
  Q: "standing in a slight three-quarter turn with the face to the lens, {obj}, both arms visible and complete",
  R: "standing with both arms relaxed along the sides of the body, both hands fully inside the frame at thigh height",
};
const FRAME = {
  head: "framed from the top of the head to the waist, the face in the upper third at about the same size as in the reference photo",
  wide: "framed from the top of the head to mid-thigh so that both hands are inside the frame, the face in the upper third",
};

// [n, setting, pose, object/detail for the pose, set dressing (unique), framing]
export const V4 = [
  ["01", "B", "T", "a neatly folded fresh white towel", "a bright, sunlit Berlin Altbau living room; behind her a neatly set-up portable massage table with fresh white linen and a folded towel on it, tall white windows, light oak herringbone parquet, an olive tree in a terracotta pot; warm and confident", "head"],
  ["02", "E", "X", "", "a bright modern office with glass partitions and white walls, a portable massage chair in light upholstery beside him, no plants", "head"],
  ["03", "F", "L", "a light oak console under a sunlit window", "a neat manicure kit with unlabelled nude polish bottles on the console, a white roman blind, a small jade plant", "head"],
  ["04", "A", "S", "on a light wooden stool beside her treatment couch", "her own small bright studio: a treatment couch with ivory linen, a light oak trolley with unlabelled glass jars, a linen roman blind, no plants", "wide"],
  ["05", "D", "G", "holding a make-up brush loosely at chest height in one hand, the other hand resting lightly on the dressing table", "a bright hotel suite: a bed in crisp white linen, a light dressing table with her open light make-up case, floor-to-ceiling windows, no plants", "head"],
  ["06", "B", "Q", "holding a comb and scissors loosely at waist height", "a client's bright open kitchen-living room: a light wooden chair with a sand-coloured cutting cape over its back, his open leather tool roll on the oak table, white tiles, no plants", "head"],
  ["07", "F", "T", "a small light lash case", "a tall arched window with soft sun, a small white trolley with lash tools in glass jars beside her, a trailing pothos on the window sill", "head"],
  ["08", "E", "R", "", "a bright office lounge with a long light oak table and the harbour through tall windows, her portable massage chair beside her, a tall kentia palm in the corner", "wide"],
  ["09", "C", "Q", "one hand on the strap of a tan leather kit bag over the shoulder, the other hand resting lightly at the waist", "an Altbau stairwell landing with patterned encaustic floor tiles, a turned wooden banister and sun from a stairwell window, no plants", "head"],
  ["10", "E", "L", "the edge of a white meeting table", "a bright meeting room with a light wood-slat wall, white chairs and a closed plain notebook, no plants", "head"],
  ["11", "E", "X", "", "an open-plan office in morning sun with a concrete pillar, a light oak bench and glass walls, a potted bird-of-paradise plant far behind", "head"],
  ["12", "A", "X", "", "his own small bright massage studio: a massage table with fresh white linen, a plain light wall with one framed abstract print without text, a monstera in a woven basket", "head"],
  ["13", "F", "T", "a make-up brush and a small plain palette", "a deep window seat with linen cushions, brushes in a ceramic cup on the sill, sheer curtains, no plants", "head"],
  ["14", "F", "G", "both hands lightly together at waist height", "a large sunlit window with a wide-tooth comb, a round brush and a hairdryer on a light stool beside her, a small olive tree on the sill", "head"],
  ["15", "A", "S", "at her small white manicure table", "her own bright nail studio: a neat manicure set-up and a lamp on the table, a pale stone wall, a small rubber plant on a stool", "wide"],
  ["16", "D", "L", "a light oak desk in a hotel suite", "a bright hotel suite with oak panelling, a brass reading lamp, her make-up case on the desk and the city through the window, no plants", "head"],
  ["17", "D", "R", "", "a bright hotel corridor with oak panelling, soft beige carpet and daylight from a window at the far end, his sand canvas carry case standing on the floor beside him, no plants", "wide"],
  ["18", "E", "G", "one hand resting on the counter beside him, the other holding a comb at waist height", "a bright office break area with a white counter, bar stools and big windows, his compact tool case on the counter, a hanging pothos high on a shelf", "head"],
  ["19", "D", "T", "her light taupe make-up case by its handle", "a hotel corridor with cream walls, warm wall lights and a window with sun at the end, a suite door ajar beside her, no plants", "head"],
  ["20", "B", "S", "at a client's light oak dining table", "a client's bright living room: a neat manicure set-up on a folded ivory towel on the table, a pendant lamp, a softly blurred bookshelf, a small cactus", "wide"],
  ["21", "F", "X", "", "a sunlit bay window with unlabelled skincare bottles and a folded towel on the sill, linen curtains, a peace lily on the floor", "head"],
  ["22", "B", "R", "", "a client's bright living room with a rolled Thai massage mat and folded towels on the floor beside her, a linen sofa, a tall kentia palm", "wide"],
  ["23", "C", "T", "his tan leather tool case", "the open door of a bright Altbau apartment, a herringbone floor and a coat rack in the hallway behind him, no plants", "head"],
  ["24", "C", "G", "one hand on the strap of her bag at the shoulder, the other hand resting lightly at the waist", "a light wooden apartment door in a modern building corridor with white walls and a terrazzo floor, no plants", "head"],
  ["25", "A", "L", "a light terrazzo counter in her studio", "her own bright lash studio: lash tools in glass jars on the counter, a round wall light, a lash bed with ivory linen behind, a trailing string-of-pearls plant on a high shelf", "head"],
  ["26", "B", "Q", "holding a round brush loosely at waist height", "a client's bright bedroom with a light oak dresser, hair tools laid out neatly, a large window, a ficus tree", "head"],
  ["27", "A", "Q", "a folded ivory towel over one forearm and the other hand holding its edge at waist height", "her own bright cosmetic studio: a cosmetic couch with white linen, sheer linen curtains, a tall snake plant in a white pot", "head"],
  ["28", "C", "R", "", "a pale stone-coloured Altbau apartment door with a brass handle, a stairwell window with sun, her tidy sand canvas bag on her shoulder, no plants", "wide"],
  ["29", "C", "Q", "carrying a tan leather kit bag by its handle in one hand, the other hand resting lightly at the waist", "an Altbau entrance hall with warm beige floor tiles and a wooden staircase, sun through the front door glass, no plants", "wide"],
  ["30", "D", "S", "in a cream boucle armchair", "a bright hotel suite by a floor-to-ceiling window with the city, a side table with unlabelled oil bottles, the bed in white linen behind, no plants", "wide"],
];

// Attempt 2 for 08, 10, 18, 29: attempt 1 put dark trousers on them (the wardrobe rule: light uniform, no black).
const LIGHT_TROUSERS = new Set(["08", "10", "18", "29"]);
export const ALL = V4.map(([n, set, pose, obj, dressing, frame]) => ({
  id: `R${n}`, n, setting: set, pose, path: `/images/pros/pro-${n}-v4.jpg`, replaces: `/images/pros/pro-${n}-v3.jpg`,
  medias: [{ role: "image_references", value: REF[n] }],
  prompt: `Professional editorial portrait photograph for a premium beauty and wellness booking platform. The person is exactly the same individual as in the reference photo: keep the face, hair, skin tone, age, build and the same light work outfit${LIGHT_TROUSERS.has(n) ? " with light sand-coloured tailored trousers, no dark trousers" : ""}; only the setting, the pose and the framing change. Setting: ${dressing}. Pose: ${POSE[pose].replace("{obj}", obj)}. ${FRAME[frame][0].toUpperCase() + FRAME[frame].slice(1)}, the face clearly lit and sharp, friendly direct gaze into the lens and a warm natural smile. Anatomy: every visible arm complete from shoulder to hand, every visible hand with five natural fingers; no hand hidden in a pocket or behind the back. Bright, luminous natural daylight, warm high-key, clean fresh slightly lifted grade, natural saturation, healthy glowing skin with real texture, warm whites; palette of warm white, bone, sand, stone, taupe and light oak. 85 mm lens at eye level, shallow depth of field, photorealistic. No text, letters, logos or labels anywhere, no name tag, no gloves, no border, no film grain, no vignette.`,
}));

if (process.argv[1]?.endsWith("shotlist-v4.mjs")) {
  const c = (k) => ALL.reduce((o, s) => ((o[s[k]] = (o[s[k]] || 0) + 1), o), {});
  console.log("settings", c("setting"), "poses", c("pose"), "total", ALL.length);
}
