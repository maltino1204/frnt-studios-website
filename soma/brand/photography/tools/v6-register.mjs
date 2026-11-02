// node brand/photography/tools/v6-register.mjs
// Registers the fixes after landing audit 4 (generation/jobs-v6.json) in scripts/images/sources.json.
//  - Each generated attempt gets its own entry at its own path (`-v6`, `-v6b`, …; never reused, PHOTOGRAPHY.md § 11),
//    with the metadata of the entry it replaces (ratio, size, focal, place, caption). The replaced entry and any earlier
//    attempt point with `replacedBy` to the approved (or newest open) attempt.
//  - R4-2: every approved file whose name had carried an earlier attempt (shotlist-v6 RENAME, found by tools/fresh-check.mjs)
//    gets a fresh `-v6` name with the same remote and metadata; the old name `replacedBy` → it, and an `avatar` moves along.
import fs from "node:fs";
import path from "node:path";
import { V6, RENAME, renamed } from "../generation/shotlist-v6.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const file = path.join(root, "scripts/images/sources.json");
const S = JSON.parse(fs.readFileSync(file, "utf8"));
const L = JSON.parse(fs.readFileSync(path.join(root, "brand/photography/generation/jobs-v6.json"), "utf8"));
const byPath = new Map(S.map((e) => [e.path, e]));
let added = 0, updated = 0;
const upsert = (p, fields) => { const e = byPath.get(p) ?? { path: p }; Object.assign(e, fields); if (!byPath.has(p)) { S.push(e); byPath.set(p, e); added++; } else updated++; return e; };
const meta = (old) => ({ ratio: old.ratio, width: old.width, height: old.height, focal: old.focal, ...(old.place ? { place: old.place } : {}), ...(old.caption ? { caption: old.caption } : {}) });
for (const s of V6) {
  const js = L.jobs.filter((j) => j.shot === s.id); if (!js.length) continue;
  const cur = Object.entries(L.current).find(([, c]) => c.shot === s.id)?.[0] ?? js.at(-1).path;
  const old = byPath.get(s.replaces);
  for (const j of js) upsert(j.path, { remote: j.url, ...meta(old), replaces: s.replaces,
    source: `AI-generated development asset (Higgsfield nano_banana_pro 2k, edit of ${s.replaces.split("/").pop()}${s.ref2 ? " with the arrival photo as the client reference" : ""}), SOMA photography v6 fix ${s.id} (landing audit 4, ${s.review}), attempt ${j.attempt}`,
    ...(j.path !== cur ? { replacedBy: cur } : {}) });
  delete byPath.get(cur).replacedBy;
  old.replacedBy = cur;
}
for (const from of RENAME) {
  const e = byPath.get(from), to = renamed(from);
  if (!e || (e.replacedBy && e.replacedBy !== to)) throw new Error(`${from}: not a chain end (replacedBy ${e?.replacedBy})`);
  const { path: _p, replacedBy: _r, replaces: _x, avatar, source, ...rest } = e;
  upsert(to, { ...rest, replaces: from, ...(avatar ? { avatar } : {}), source: `${source ?? "AI-generated development asset"} · fresh file name for the approved attempt (landing audit 4, R4-2: the old name had carried rejected attempts)` });
  delete e.avatar; e.replacedBy = to;
}
fs.writeFileSync(file, JSON.stringify(S, null, 2) + "\n");
console.log(`sources.json: ${added} added, ${updated} updated, ${S.length} entries`);
