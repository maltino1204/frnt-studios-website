// node brand/photography/tools/v5-register.mjs
// Registers the post-review fixes (generation/jobs-v5.json → current) in scripts/images/sources.json as `-v5` entries
// with the metadata of the entry they replace (ratio, size, focal, place, caption, avatar crop excluded), and
// `replacedBy` on that entry. Also the auth/city 4:5 crop of the new arrival (review R10): `editorial/arrival.jpg`, the
// v1 path that `images.editorial.arrival` uses in the 4:5 arches of /anmelden and /staedte/[stadt], now points straight
// to `editorial/arrival-4x5-v5.jpg` (a 4:5 crop of arrival-v5), so the arch no longer upscales a 3:2 file.
import fs from "node:fs";
import path from "node:path";
import { V5 } from "../generation/shotlist-v5.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const file = path.join(root, "scripts/images/sources.json");
const S = JSON.parse(fs.readFileSync(file, "utf8"));
const L = JSON.parse(fs.readFileSync(path.join(root, "brand/photography/generation/jobs-v5.json"), "utf8"));
const byPath = new Map(S.map((e) => [e.path, e]));
let added = 0, updated = 0;
const upsert = (p, fields, replaces) => {
  const e = byPath.get(p) ?? { path: p };
  Object.assign(e, fields);
  if (!byPath.has(p)) { S.push(e); byPath.set(p, e); added++; } else updated++;
  if (replaces) byPath.get(replaces).replacedBy = p;
};
for (const s of V5) {
  const c = L.current[s.path]; if (!c) continue;
  const old = byPath.get(s.replaces);
  upsert(s.path, { remote: c.url, ratio: old.ratio, width: old.width, height: old.height, focal: old.focal,
    ...(old.place ? { place: old.place } : {}), ...(old.caption ? { caption: old.caption } : {}), replaces: s.replaces,
    source: `AI-generated development asset (Higgsfield nano_banana_pro 2k, edit of ${s.replaces.split("/").pop()}), SOMA photography v5 post-review fix ${s.id} (${s.review})` }, s.replaces);
}
const arr = L.current["/images/editorial/arrival-v5.jpg"];
if (arr) upsert("/images/editorial/arrival-4x5-v5.jpg", { remote: arr.url, ratio: "4:5", width: 1200, height: 1500, focal: L.arrival4x5Focal ?? "55% 50%",
  replaces: "/images/editorial/arrival.jpg", source: "4:5 crop of editorial/arrival-v5 (fix F02) for the 4:5 arches of /anmelden and /staedte/[stadt] (review R10)" }, "/images/editorial/arrival.jpg");
fs.writeFileSync(file, JSON.stringify(S, null, 2) + "\n");
console.log(`sources.json: ${added} added, ${updated} updated, ${S.length} entries`);
