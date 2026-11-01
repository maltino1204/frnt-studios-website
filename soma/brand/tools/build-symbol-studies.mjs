// Symbol studies 2 (Brand Audit 1, O1): the control S and four constructions that make the S/O idea visible,
// each measured for silhouette overlap (IoU) against the S of five serif typefaces and rendered at 16/24/32 px.
// Writes assets/logo/concepts/symbol-studies-2.png and symbol-studies-2.json.
import fs from "node:fs";
import path from "node:path";
import { oval, rect, poly, unite, subtract, intersect, transform, toD, bounds } from "./lib/geo.mjs";
import { svgDoc, png, PALETTE } from "./lib/svg.mjs";
import { iou, glyphD, REFERENCE_FONTS } from "./lib/iou.mjs";
import { shot, closeBrowser, fontFaces } from "./lib/shot.mjs";
import * as F from "./final.mjs";

const OUT = new URL("../assets/logo/concepts/", import.meta.url).pathname;
const D = Math.PI / 180;
const sector = (a1, a2, R = 3000) => { const p = [[0, 0]]; for (let a = a1; a <= a2 + 0.01; a += 1) p.push([Math.cos(a * D) * R, Math.sin(a * D) * R]); return poly(p); };
function ring(V = 124, h = 46) {
  return subtract(oval({ cx: 0, cy: 0, rx: 332, ry: 362, kx: 0.57, ky: 0.585 }), oval({ cx: 0, cy: 0, rx: 332 - V, ry: 362 - h, kx: 0.6, ky: 0.54 }));
}
const S = F.glyphS({ ...F.MASTERS.display, ...F.SYMBOL }, F.SYMBOL_OPTS);
const studies = [
  { key: "control", name: "Kontrolle: das S (v1)", item: S, note: "Gut gezeichnet, aber ein Buchstabe: kein Merkmal jenseits der Schrift." },
  { key: "s-im-o", name: "S im O (gewählt)", item: F.symbolMark("line").item, chosen: true, note: "Der Körper im Ort: das S der Wortmarke im O der Wortmarke. Liest als Zeichen, nicht als Buchstabe; die ersten zwei Buchstaben des Namens." },
  { key: "siegel", name: "Siegel (Schnitt < 32 px)", item: F.symbolMark("solid").item, note: "Dieselbe Idee als Fläche: das O gefüllt, das S eingesetzt. Robust bei 16 px; der kleine Schnitt des Zeichens." },
  { key: "versatz", name: "Versatz: O halbiert, verschoben", item: (() => { const r = ring(); const up = subtract(intersect(r, rect(-2000, -2000, 4000, 2000)), sector(-34, 0)); const lo = subtract(intersect(r, rect(-2000, 0, 4000, 2000)), sector(146, 180)); return unite(transform(up, { tx: -80 }), transform(lo, { tx: 80 })); })(), note: "Zeigt die Konstruktion wörtlich, liest bei 16 px aber als Sync-/Neu-laden-Pfeil. Verworfen." },
  { key: "fuge", name: "Fuge: S an der Taille verschoben", item: (() => { const b = bounds(S); const cy = b.y + b.h / 2; return unite(transform(intersect(S, rect(-1000, -1000, 3000, cy + 1000)), { tx: -40 }), transform(intersect(S, rect(-1000, cy, 3000, 2000)), { tx: 40 })); })(), note: "Ein Merkmal im Buchstaben, aber es wirkt wie ein Glitch, und die Überlappung mit Serifen-S liegt mit 0,30–0,36 an der Schwelle. Verworfen." },
];

async function main() {
  const refs = Object.fromEntries(Object.entries(REFERENCE_FONTS).map(([k, f]) => [k, glyphD(f)]));
  const rows = [];
  for (const s of studies) {
    const d = toD(s.item);
    const scores = {};
    for (const [k, rd] of Object.entries(refs)) scores[k] = +(await iou(d, rd)).toFixed(2);
    s.scores = scores;
    s.max = Math.max(...Object.values(scores));
    const b = bounds(s.item);
    const pad = Math.max(b.w, b.h) * 0.12;
    const vb = [b.x - pad, b.y - pad, b.w + 2 * pad, b.h + 2 * pad];
    const svgL = svgDoc({ viewBox: vb, title: s.name, bg: PALETTE.bone, groups: [{ id: "m", fill: PALETTE.espresso, paths: [{ d }] }] });
    const svgD = svgDoc({ viewBox: vb, title: s.name, bg: PALETTE.oxblood, groups: [{ id: "m", fill: PALETTE.bone, paths: [{ d }] }] });
    s.files = {};
    for (const px of [16, 24, 32]) {
      s.files[`l${px}`] = await png(svgL, `/tmp/soma-study-${s.key}-l${px}.png`, { height: px });
      s.files[`d${px}`] = await png(svgD, `/tmp/soma-study-${s.key}-d${px}.png`, { height: px });
    }
    s.svg = svgL.replace(/width="[^"]+" height="[^"]+"/, 'style="width:100%;height:200px"');
    rows.push({ key: s.key, name: s.name, chosen: !!s.chosen, iou: scores, maxIoU: s.max, note: s.note });
  }
  fs.writeFileSync(path.join(OUT, "symbol-studies-2.json"), JSON.stringify({ method: "IoU of silhouettes, both normalised to the same height, centred on their bounding boxes, rasterised at 512 px; best of five horizontal shifts (±24 px). Reference: the S of each typeface. For comparison the five serif S overlap each other 0.52–0.62.", rows }, null, 2) + "\n");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces(["newsreader", "instrumentsans"])}
  body{margin:0;padding:48px;background:#F3EFE8;color:#25211F;font:13px/1.45 "Instrument Sans",sans-serif}
  h1{font:400 34px/1.1 Newsreader;margin:0 0 6px}.cap{color:#5E554D;font-size:12px}
  .g{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-top:24px}
  .c{background:#FBF9F5;padding:16px;box-shadow:0 0 0 1px rgb(37 33 31/.08)}.c.on{box-shadow:0 0 0 2px #542C35}
  .n{font-weight:600;margin:12px 0 4px}.sm{display:flex;gap:8px;align-items:flex-end;margin:10px 0}.sm img{display:block}
  table{width:100%;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums;margin-top:8px}td{padding:3px 0;border-top:1px solid #E3DBCF}td:last-child{text-align:right}
  .ok{color:#336645;font-weight:600}.no{color:#B3261E;font-weight:600}</style></head><body>
  <h1>Zeichen-Studien 2 · die Konstruktion sichtbar machen</h1>
  <div class="cap">Brand Audit 1, O1: Überlappung (IoU) mit dem S von fünf Serifenschriften unter 0,35, mindestens ein Merkmal jenseits des Buchstabens, lesbar bei 16 px. Zum Vergleich: die Serifen-S untereinander 0,52–0,62.</div>
  <div class="g">${studies.map((s) => `<div class="c ${s.chosen ? "on" : ""}">${s.svg}<div class="n">${s.name}</div>
    <div class="sm">${[16, 24, 32].map((px) => `<img src="file://${s.files["l" + px]}">`).join("")}${[16, 24, 32].map((px) => `<img src="file://${s.files["d" + px]}">`).join("")}</div>
    <table>${Object.entries(s.scores).map(([k, v]) => `<tr><td>IoU ${k}</td><td>${v.toFixed(2)}</td></tr>`).join("")}<tr><td><b>Maximum</b></td><td class="${s.max < 0.35 ? "ok" : "no"}">${s.max.toFixed(2)} ${s.max < 0.35 ? "&lt; 0,35" : "≥ 0,35"}</td></tr></table>
    <div class="cap" style="margin-top:8px">${s.note}</div></div>`).join("")}</div></body></html>`;
  await shot(html, path.join(OUT, "symbol-studies-2.png"), { width: 1500 });
  await closeBrowser();
  for (const r of rows) console.log(r.name.padEnd(36), "max IoU", r.maxIoU);
}
main();
