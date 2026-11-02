// node brand/photography/tools/v3-luminance.mjs [--json]
// Mean luminance per folder, before (the files the v3 set replaces) and after (the v3 files + the new „Entdecken“ covers).
// Luma = Rec. 709 weights on the sRGB-encoded values (0–255); L* = CIE lightness; "dark" = share of pixels with luma < 51 (20 %).
// Every image is measured on a 256 px thumbnail. Writes brand/photography/v3/luminance.json.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const S = JSON.parse(fs.readFileSync(path.join(root, "scripts/images/sources.json"), "utf8"));
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };

async function measure(p) {
  const f = path.join(root, "public", p);
  if (!fs.existsSync(f)) return null;
  const { data, info } = await sharp(f).resize(256, 256, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let y = 0, L = 0, dark = 0; const n = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) {
    const v = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const Y = 0.2126 * lin(data[i]) + 0.7152 * lin(data[i + 1]) + 0.0722 * lin(data[i + 2]);
    y += v; L += Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y; if (v < 51) dark++;
  }
  return { luma: y / n, L: L / n, dark: (100 * dark) / n };
}
const folder = (p) => (p.split("/").length === 3 ? "og" : p.split("/")[2]);
const isV3 = (p) => /-v3\.jpg$/.test(p) || p.startsWith("/images/explore/");
const before = S.filter((e) => e.replacedBy && isV3(e.replacedBy)).map((e) => e.path);
const after = S.filter((e) => isV3(e.path)).map((e) => e.path);

async function agg(list) {
  const by = {}; const per = {};
  for (const p of list) { const m = await measure(p); if (!m) continue; per[p] = m; (by[folder(p)] ||= []).push(m); }
  const out = {}; const all = Object.values(by).flat();
  const avg = (a, k) => +(a.reduce((s, x) => s + x[k], 0) / a.length).toFixed(1);
  for (const [k, a] of Object.entries(by)) out[k] = { n: a.length, luma: avg(a, "luma"), L: avg(a, "L"), dark: avg(a, "dark"), min: +Math.min(...a.map((x) => x.luma)).toFixed(1) };
  out.ALL = { n: all.length, luma: avg(all, "luma"), L: avg(all, "L"), dark: avg(all, "dark"), min: +Math.min(...all.map((x) => x.luma)).toFixed(1) };
  return { out, per };
}
const b = await agg(before), a = await agg(after);
const res = { measured: new Date().toISOString(), before: b.out, after: a.out, perImage: { before: b.per, after: a.per } };
fs.mkdirSync(path.join(root, "brand/photography/v3"), { recursive: true });
fs.writeFileSync(path.join(root, "brand/photography/v3/luminance.json"), JSON.stringify(res, null, 1) + "\n");
if (process.argv.includes("--json")) console.log(JSON.stringify({ before: b.out, after: a.out }, null, 1));
else {
  console.log("| Folder | Images before → after | Mean luma before → after (0–255) | Mean L* before → after | Near-black pixels before → after | Darkest image after |");
  console.log("|---|---|---|---|---|---|");
  for (const k of [...new Set([...Object.keys(b.out), ...Object.keys(a.out)])].filter((k) => k !== "ALL").concat("ALL")) {
    const x = b.out[k] || {}, y = a.out[k] || {};
    console.log(`| ${k === "ALL" ? "**All**" : `\`${k}/\``} | ${x.n ?? "–"} → ${y.n ?? "–"} | ${x.luma ?? "–"} → **${y.luma ?? "–"}** | ${x.L ?? "–"} → ${y.L ?? "–"} | ${x.dark ?? "–"} % → ${y.dark ?? "–"} % | ${y.min ?? "–"} |`);
  }
}
