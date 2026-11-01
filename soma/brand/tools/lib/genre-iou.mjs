// Genre overlap test (Brand Audit 2, O5): replicates brand/audit/scripts/audit-2/s-in-o-compare.cjs.
// Each shape is rendered in Chromium, trimmed to its ink, resized to 240 x 262 ("fill") and compared by IoU with
// generic enclosed-S monograms: an even oval ring with a typed serif S (Bodoni Moda, Gloock, Newsreader), the SOMA O
// with a typed S, and the circled-letter glyph U+24C8.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");
const sharp = require("sharp");

const NR = new URL("../../../src/styles/fonts/newsreader-display-roman-latin.woff2", import.meta.url).pathname;
const ringEven = `<ellipse cx="332" cy="362" rx="312" ry="342" fill="none" stroke="#000" stroke-width="40"/>`;
const sGlyph = (fam, w) => `<text x="332" y="362" text-anchor="middle" dominant-baseline="central" font-family="${fam}" font-weight="${w}" font-size="600">S</text>`;
/** reference cells; somaRingD = the SOMA O ring path (664 x 724 box) */
export function references(somaRingD) {
  const ringSoma = `<path fill="#000" fill-rule="evenodd" d="${somaRingD}"/>`;
  const svg = (inner) => `<svg viewBox="0 0 664 724" style="height:360px">${inner}</svg>`;
  return [
    ["Even oval ring + Bodoni Moda S", svg(ringEven + sGlyph("bm", 500)), "generic"],
    ["Even oval ring + Gloock S", svg(ringEven + sGlyph("gl", 400)), "generic"],
    ["Even oval ring + Newsreader S", svg(ringEven + sGlyph("nr", 400)), "generic"],
    ["Circled S U+24C8 (DejaVu Serif)", `<span style="font:400 300px/1 'DejaVu Serif'">Ⓢ</span>`, "generic"],
    ["SOMA O ring + Bodoni Moda S", svg(ringSoma + sGlyph("bm", 500)), "soma-o"],
    ["SOMA O ring + Newsreader S", svg(ringSoma + sGlyph("nr", 400)), "soma-o"],
  ];
}
/** candidates: [{ name, svgInner (paths in a viewBox), viewBox }]; returns rows of IoU per reference */
export async function genreIoU(candidates, somaRingD) {
  const refs = references(somaRingD);
  const cells = [...candidates.map((c) => [c.name, `<svg viewBox="${c.viewBox.join(" ")}" style="height:360px">${c.inner}</svg>`]), ...refs.map(([n, h]) => [n, h])];
  const html = `<html><head><style>
@font-face{font-family:bm;src:url(file:///tmp/soma-fonts/bodonimoda/latin-normal.woff2);font-weight:400 900}
@font-face{font-family:gl;src:url(file:///tmp/soma-fonts/gloock/latin-normal.woff2)}
@font-face{font-family:nr;src:url(file://${NR})}
body{margin:0;background:#fff;display:flex;flex-wrap:wrap;gap:40px;padding:30px;align-items:flex-start;font:13px sans-serif}
.g{display:flex;align-items:center;justify-content:center;height:380px;width:380px;overflow:hidden}
</style></head><body>${cells.map(([n, h], i) => `<div class="g" id="g${i}">${h}</div>`).join("")}</body></html>`;
  const file = path.join(os.tmpdir(), `soma-genre-${process.pid}.html`);
  fs.writeFileSync(file, html);
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 2600, height: 1400 } });
  await p.goto(`file://${file}`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);
  const masks = [];
  for (let i = 0; i < cells.length; i++) {
    const buf = await p.locator("#g" + i).screenshot();
    const t = await sharp(buf).flatten({ background: "#fff" }).trim().resize(240, 262, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
    masks.push(Uint8Array.from(t.data, (v) => (v < 128 ? 1 : 0)));
  }
  await b.close();
  fs.unlinkSync(file);
  const iou = (a, c) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && c[k]) i++; if (a[k] || c[k]) u++; } return +(i / u).toFixed(2); };
  const n = candidates.length;
  return candidates.map((c, ci) => ({
    name: c.name,
    iou: Object.fromEntries(refs.map(([rn], ri) => [rn, iou(masks[ci], masks[n + ri])])),
    group: Object.fromEntries(refs.map(([rn, , g]) => [rn, g])),
  }));
}
