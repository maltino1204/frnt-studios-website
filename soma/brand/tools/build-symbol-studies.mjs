// Symbol studies 3 (Brand Audit 2, O5): the S im O with and without its ownable detail (the Versatz), against
//   (a) the S of five serif typefaces (IoU, lib/iou.mjs), and
//   (b) generic enclosed-S monograms, with the auditor's method (lib/genre-iou.mjs replicates
//       brand/audit/scripts/audit-2/s-in-o-compare.cjs: trim, resize 240 x 262 "fill", IoU).
// Writes assets/logo/concepts/symbol-studies-3.png + .json. (Studies 1 and 2 are kept as the record.)
import fs from "node:fs";
import path from "node:path";
import { oval, rect, unite, subtract, intersect, transform, toD, bounds } from "./lib/geo.mjs";
import { svgDoc, png, PALETTE } from "./lib/svg.mjs";
import { iou, glyphD, REFERENCE_FONTS } from "./lib/iou.mjs";
import { genreIoU } from "./lib/genre-iou.mjs";
import { shot, closeBrowser, fontFaces } from "./lib/shot.mjs";
import * as F from "./final.mjs";

const OUT = new URL("../assets/logo/concepts/", import.meta.url).pathname;
const centred = (g, H) => { const b = bounds(g); return transform(transform(g, { tx: -b.x - b.w / 2, ty: -b.y - b.h / 2 }), { sx: H / b.h }); };
const O = (OV = 108, Oh = 40) => subtract(oval({ cx: 0, cy: 0, rx: 332, ry: 362, kx: 0.57, ky: 0.585 }), oval({ cx: 0, cy: 0, rx: 332 - OV, ry: 362 - Oh, kx: 0.6, ky: 0.54 }));
const Sline = centred(F.glyphS({ ...F.MASTERS.display, V: 120, h: 46 }, F.SYMBOL_OPTS), 446);
const vSplit = (g, s) => unite(transform(intersect(g, rect(-4000, -4000, 4000, 8000)), { ty: -s }), transform(intersect(g, rect(0, -4000, 4000, 8000)), { ty: s }));

const studies = [
  { key: "control-s", name: "Kontrolle: das S (v1.0)", item: F.glyphS({ ...F.MASTERS.display, ...F.SYMBOL }, F.SYMBOL_OPTS), note: "Ein Buchstabe." },
  { key: "s-im-o", name: "S im O (v1.1)", item: F.symbolMarkV11(), note: "Sichtbare Idee, aber im Genre des Monogramms im Oval (Audit 2: 0,49–0,52)." },
  { key: "versatz", name: "S im O mit Versatz (v1.2, gewählt)", item: F.symbolMark("line").item, chosen: true, note: "Das O ist an der Taille geschnitten, die Hälften gleiten um je eine Haarlinie gegeneinander: Schulter gegen Hüfte, dieselbe Geste wie das S. Ein getipptes S im Oval kann das nicht haben." },
  { key: "siegel", name: "Siegel mit Versatz (< 32 px)", item: F.symbolMark("solid").item, chosen: true, note: "Derselbe Versatz als Fläche: die Silhouette ist kein Punkt mehr. Favicon, kleine App-Icons, Stempel." },
  { key: "split", name: "Verworfen: O-Hälften senkrecht versetzt", item: unite(vSplit(O(), 50), Sline), note: "Die Konstruktion des S wörtlich, aber das O zerfällt in zwei Klammern; bei 24 px ein Wirbel." },
  { key: "riser", name: "Verworfen: senkrecht versetzt, mit Steg", item: unite(vSplit(O(), 50), rect(-20, -412, 40, 140), rect(-20, 272, 40, 140), Sline), note: "Liest als Dollarzeichen ($). Ausgeschlossen." },
];

async function main() {
  const refs = Object.fromEntries(Object.entries(REFERENCE_FONTS).map(([k, f]) => [k, glyphD(f)]));
  const cands = studies.map((s) => { const b = bounds(s.item); return { name: s.name, viewBox: [b.x, b.y, b.w, b.h], inner: `<path fill="#000" d="${toD(s.item)}"/>` }; });
  const somaRing = toD(transform(O(), { tx: 332, ty: 362 }));
  const genre = await genreIoU(cands, somaRing);
  const rows = [];
  for (const [i, s] of studies.entries()) {
    const d = toD(s.item);
    const plain = {};
    for (const [k, rd] of Object.entries(refs)) plain[k] = +(await iou(d, rd)).toFixed(2);
    const g = genre[i];
    const generic = Object.fromEntries(Object.entries(g.iou).filter(([k]) => g.group[k] === "generic"));
    const somaO = Object.fromEntries(Object.entries(g.iou).filter(([k]) => g.group[k] === "soma-o"));
    s.res = { plain, generic, somaO, maxPlain: Math.max(...Object.values(plain)), maxGeneric: Math.max(...Object.values(generic)), maxSomaO: Math.max(...Object.values(somaO)) };
    const b = bounds(s.item);
    const pad = Math.max(b.w, b.h) * 0.12;
    const vb = [b.x - pad, b.y - pad, b.w + 2 * pad, b.h + 2 * pad];
    const svgL = svgDoc({ viewBox: vb, title: s.name, bg: PALETTE.bone, groups: [{ id: "m", fill: PALETTE.espresso, paths: [{ d }] }] });
    const svgD = svgDoc({ viewBox: vb, title: s.name, bg: PALETTE.oxblood, groups: [{ id: "m", fill: PALETTE.bone, paths: [{ d }] }] });
    s.files = {};
    for (const px of [16, 24, 32]) {
      s.files[`l${px}`] = await png(svgL, `/tmp/soma-study3-${s.key}-l${px}.png`, { height: px });
      s.files[`d${px}`] = await png(svgD, `/tmp/soma-study3-${s.key}-d${px}.png`, { height: px });
    }
    s.svg = svgL.replace(/width="[^"]+" height="[^"]+"/, 'style="width:100%;height:180px"');
    rows.push({ key: s.key, name: s.name, chosen: !!s.chosen, note: s.note, ...s.res });
  }
  fs.writeFileSync(path.join(OUT, "symbol-studies-3.json"), JSON.stringify({
    method: {
      plain: "IoU against the S of five serif typefaces: silhouettes normalised to the same height, centred, 512 px, best of five horizontal shifts (brand/tools/lib/iou.mjs).",
      genre: "The auditor's method (brand/audit/scripts/audit-2/s-in-o-compare.cjs, replicated in brand/tools/lib/genre-iou.mjs): render, trim, resize 240 x 262 fill, IoU against an even oval ring with a typed Bodoni Moda / Gloock / Newsreader S, the circled-letter glyph U+24C8, and the SOMA O ring with a typed S.",
      targets: "plain < 0.35; generic < 0.35; SOMA O + typed S <= 0.65 (Brand Audit 2, O5)",
    },
    rows,
  }, null, 2) + "\n");
  const f2 = (v) => v.toFixed(2).replace(".", ",");
  const ok = (v, t, le = false) => `<span class="${(le ? v <= t : v < t) ? "ok" : "no"}">${f2(v)}</span>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces(["newsreader", "instrumentsans"])}
  body{margin:0;padding:48px;background:#F3EFE8;color:#25211F;font:13px/1.45 "Instrument Sans",sans-serif}
  h1{font:400 34px/1.1 Newsreader;margin:0 0 6px}.cap{color:#5E554D;font-size:12px}
  .g{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-top:24px}
  .c{background:#FBF9F5;padding:14px;box-shadow:0 0 0 1px rgb(37 33 31/.08)}.c.on{box-shadow:0 0 0 2px #542C35}
  .n{font-weight:600;margin:10px 0 4px;min-height:36px}.sm{display:flex;gap:6px;align-items:flex-end;margin:8px 0;flex-wrap:wrap}.sm img{display:block}
  table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;margin-top:6px}td{padding:3px 0;border-top:1px solid #E3DBCF}td:last-child{text-align:right}
  .ok{color:#336645;font-weight:600}.no{color:#B3261E;font-weight:600}</style></head><body>
  <h1>Zeichen-Studien 3 · ein eigenes Detail: der Versatz</h1>
  <div class="cap">Brand Audit 2, O5. Ziele: Überlappung (IoU) mit Serifen-S &lt; 0,35; mit generischen Monogrammen „S im Oval“ &lt; 0,35 (Methode des Auditors); mit „SOMA-O + getipptes S“ ≤ 0,65. Grün = erfüllt.</div>
  <div class="g">${studies.map((s) => `<div class="c ${s.chosen ? "on" : ""}">${s.svg}<div class="n">${s.name}</div>
    <div class="sm">${[16, 24, 32].map((px) => `<img src="file://${s.files["l" + px]}">`).join("")}${[16, 24, 32].map((px) => `<img src="file://${s.files["d" + px]}">`).join("")}</div>
    <table><tr><td>Serifen-S (max.)</td><td>${ok(s.res.maxPlain, 0.35)}</td></tr><tr><td>Monogramm im Oval (max.)</td><td>${ok(s.res.maxGeneric, 0.35)}</td></tr><tr><td>SOMA-O + getipptes S (max.)</td><td>${ok(s.res.maxSomaO, 0.65, true)}</td></tr></table>
    <div class="cap" style="margin-top:8px">${s.note}</div></div>`).join("")}</div></body></html>`;
  await shot(html, path.join(OUT, "symbol-studies-3.png"), { width: 1600 });
  await closeBrowser();
  for (const r of rows) console.log(r.name.padEnd(42), "plain", r.maxPlain, "generic", r.maxGeneric, "somaO", r.maxSomaO);
}
main();
