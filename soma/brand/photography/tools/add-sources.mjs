// node brand/photography/tools/add-sources.mjs [--dry]
// Appends every approved v2 image (brand/photography/generation/{prompts,jobs}-v2.json) to scripts/images/sources.json
// and marks the v1 entry it replaces with "replacedBy". Idempotent. Never removes or rewrites an existing path.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const file = path.join(root, "scripts/images/sources.json");
const sources = JSON.parse(fs.readFileSync(file, "utf8"));
const shots = JSON.parse(fs.readFileSync(path.join(root, "brand/photography/generation/prompts-v2.json"), "utf8"));
const jobs = JSON.parse(fs.readFileSync(path.join(root, "brand/photography/generation/jobs-v2.json"), "utf8"));
const byPath = new Map(sources.map((s) => [s.path, s]));

const approved = (id) => jobs[id]?.attempts.find((a) => a.status === "approved" && a.url);
const added = [];
const add = (entry) => {
  if (byPath.has(entry.path)) return;
  sources.push(entry);
  byPath.set(entry.path, entry);
  added.push(entry.path);
};

for (const s of shots) {
  const a = approved(s.id);
  if (!a) { console.warn("no approved image for", s.id); continue; }
  const e = {
    path: s.path,
    remote: a.url,
    ratio: s.ratio,
    width: s.width,
    height: s.height,
    focal: s.focal,
    ...(s.caption ? { caption: s.caption } : {}),
    ...(s.replaces ? { replaces: s.replaces } : {}),
    ...(s.place ? { place: s.place } : {}),
    source: `AI-generated development asset (Higgsfield ${s.model}), SOMA photography v2, shot ${s.id}`,
  };
  add(e);
  if (s.replaces && byPath.has(s.replaces)) byPath.get(s.replaces).replacedBy = s.path;
}

// The 4:5 home hero (the app's existing hero slot) is cut from the mobile hero L02.
const l02 = approved("L02");
if (l02) {
  add({ path: "/images/hero/home-v2.jpg", remote: l02.url, ratio: "4:5", width: 1520, height: 1900, focal: "50% 62%", replaces: "/images/hero/home.jpg", place: "Altbau, 3. OG · Berlin-Prenzlauer Berg · 19:30", source: "AI-generated development asset (Higgsfield gpt_image_2_5), SOMA photography v2, shot L02 (4:5 cut)" });
  byPath.get("/images/hero/home.jpg").replacedBy = "/images/hero/home-v2.jpg";
}

if (process.argv.includes("--dry")) { console.log(added.length, "would be added"); process.exit(0); }
fs.writeFileSync(file, JSON.stringify(sources, null, 2) + "\n");
console.log(`${added.length} entries added; ${sources.filter((s) => s.replacedBy).length} v1 entries marked replacedBy; total ${sources.length}`);
fs.writeFileSync(path.join(root, "brand/photography/generation/fetch-list.txt"), added.join("\n") + "\n");
