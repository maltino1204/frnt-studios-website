// node brand/photography/tools/v4-register.mjs
// Registers the v4 Profi portraits (generation/jobs-v4.json → current) in scripts/images/sources.json: a new
// `/images/pros/pro-NN-v4.jpg` entry per portrait (4:5, 1200 × 1500, its own focal point on the face) and
// `replacedBy` on the v3 entry. The chain pro-NN.jpg → -v2 → -v3 → -v4 is exactly the three hops src/lib/images.ts follows.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const file = path.join(root, "scripts/images/sources.json");
const S = JSON.parse(fs.readFileSync(file, "utf8"));
const L = JSON.parse(fs.readFileSync(path.join(root, "brand/photography/generation/jobs-v4.json"), "utf8"));
const byPath = new Map(S.map((e) => [e.path, e]));
let added = 0, updated = 0;
for (const [p, c] of Object.entries(L.current)) {
  const v3 = p.replace("-v4.jpg", "-v3.jpg");
  const e = byPath.get(p) ?? { path: p };
  Object.assign(e, { remote: c.url, ratio: "4:5", width: 1200, height: 1500, focal: c.focal, replaces: v3,
    source: `AI-generated development asset (Higgsfield nano_banana_pro 2k, v3 portrait as identity reference), SOMA photography v4 portraits, shot ${c.shot}` });
  if (!byPath.has(p)) { S.push(e); byPath.set(p, e); added++; } else updated++;
  byPath.get(v3).replacedBy = p;
}
fs.writeFileSync(file, JSON.stringify(S, null, 2) + "\n");
console.log(`sources.json: ${added} added, ${updated} updated, ${S.length} entries`);
