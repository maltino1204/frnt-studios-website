// node brand/photography/tools/v3-register.mjs
// Registers the approved-or-pending v3 images in scripts/images/sources.json (Photo Art Director, v3 „Tageslicht“).
// Input: brand/photography/generation/jobs-v3.json → `current` (v3 path → { url, shot }), written while generating.
// For every v3 path: a new entry with the metadata of the entry it replaces (ratio, width, height, focal, place, caption),
// and `replacedBy` on the replaced entry. Re-running updates the remote of an existing v3 entry (a retry).
// Derived 4:5 crops of the mobile hero (hero/home-v3, landing/hero-home-4x5-v3) share its remote; the capture
// workflow crops them around their focal point. The derived v2-era file landing/hero-home-4x5.jpg (scripts/landing/
// derive-hero.mjs) is registered once as a recrop so that `replacedBy` can reach it.
import fs from "node:fs";
import path from "node:path";
import { ALL, SKIPPED, MODEL } from "../generation/shotlist-v3.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const srcFile = path.join(root, "scripts/images/sources.json");
const ledger = JSON.parse(fs.readFileSync(path.join(root, "brand/photography/generation/jobs-v3.json"), "utf8"));
const S = JSON.parse(fs.readFileSync(srcFile, "utf8"));
const byPath = new Map(S.map((e) => [e.path, e]));

// the entry in use that a v3 path replaces
const replacedOf = (p) => {
  if (p === "/images/landing/hero-home-4x5-v3.jpg") return "/images/landing/hero-home-4x5.jpg";
  if (p === "/images/og-default-v3.jpg") return "/images/og-default-v2.jpg";
  const stem = p.replace(/-v3\.jpg$/, "");
  for (const c of [`${stem}-v2.jpg`, `${stem}.jpg`]) {
    const e = byPath.get(c);
    if (e && (!e.replacedBy || e.replacedBy === p || !byPath.has(e.replacedBy))) return c;
  }
  return null; // new (explore)
};

// the v2-era derived hero crop, so that it can be replaced
if (!byPath.has("/images/landing/hero-home-4x5.jpg")) {
  const mob = byPath.get("/images/landing/hero-mobile.jpg");
  const e = { path: "/images/landing/hero-home-4x5.jpg", remote: mob.remote, ratio: "4:5", width: 1440, height: 1800, focal: "50% 50%", place: mob.place,
    recropOf: "/images/landing/hero-mobile.jpg", source: "Derived 4:5 crop of landing/hero-mobile.jpg (scripts/landing/derive-hero.mjs); registered in v3 so that it can be replaced" };
  S.push(e); byPath.set(e.path, e);
}

const shots = new Map(ALL.map((s) => [s.path, s]));
const derived = [
  { path: "/images/hero/home-v3.jpg", from: "/images/landing/hero-mobile-v3.jpg", focal: "50% 62%", width: 1520, height: 1900 },
  { path: "/images/landing/hero-home-4x5-v3.jpg", from: "/images/landing/hero-mobile-v3.jpg", focal: "50% 45%", width: 1440, height: 1800 },
];

let added = 0, updated = 0;
const upsert = (p, url, shotId, override = {}) => {
  const old = replacedOf(p);
  const base = old ? byPath.get(old) : null;
  const s = shots.get(p);
  const e = byPath.get(p) ?? { path: p };
  e.remote = url;
  e.ratio = override.ratio ?? base?.ratio ?? "4:5";
  e.width = override.width ?? base?.width ?? 1200;
  e.height = override.height ?? base?.height ?? 1500;
  e.focal = override.focal ?? s?.focal ?? base?.focal ?? "50% 50%";
  if (base?.place) e.place = base.place;
  if (base?.caption) e.caption = base.caption;
  if (old) e.replaces = old;
  e.source = `AI-generated development asset (Higgsfield ${MODEL.model} ${MODEL.resolution}), SOMA photography v3 „Tageslicht“, shot ${shotId}${override.note ? `, ${override.note}` : ""}`;
  if (!byPath.has(p)) { S.push(e); byPath.set(p, e); added++; } else updated++;
  if (old) byPath.get(old).replacedBy = p;
};

for (const [p, job] of Object.entries(ledger.current)) {
  const s = shots.get(p);
  if (!s) continue;
  if (SKIPPED.has(s.id)) continue;
  upsert(p, job.url, s.id);
}
for (const d of derived) {
  const job = ledger.current[d.from];
  if (!job) continue;
  upsert(d.path, job.url, "L02", { ratio: "4:5", width: d.width, height: d.height, focal: d.focal, note: "4:5 crop of landing/hero-mobile-v3" });
}
// the new „Entdecken“ covers: fixed size
for (const e of S) if (e.path.startsWith("/images/explore/")) { e.ratio = "4:5"; e.width = 1200; e.height = 1500; e.focal = e.focal ?? "50% 50%"; }

fs.writeFileSync(srcFile, JSON.stringify(S, null, 2) + "\n");
console.log(`sources.json: ${added} added, ${updated} updated, ${S.length} entries`);
