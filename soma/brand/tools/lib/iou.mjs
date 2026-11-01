// Silhouette overlap (IoU) between two outlines: both normalised to the same height, centred on their
// bounding boxes, rasterised at 512 px; the best value over small horizontal shifts is reported
// (conservative: it favours overlap). Used to test the symbol against serif S shapes (Brand Audit 1, O1).
import { createRequire } from "node:module";
import fs from "node:fs";
import { fromD, bounds, toD, transform } from "./geo.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const opentype = require("opentype.js");

const N = 512, H = 400;
export function glyphD(fontFile, ch = "S") {
  const f = opentype.parse(fs.readFileSync(fontFile).buffer);
  return f.charToGlyph(ch).getPath(0, 0, 1000).toPathData(2);
}
async function mask(d, dx = 0) {
  const item = fromD(d);
  const b = bounds(item);
  const s = H / b.h;
  const t = transform(item, { tx: -b.x - b.w / 2, ty: -b.y - b.h / 2 });
  const t2 = transform(t, { sx: s });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-N / 2 - dx} ${-N / 2} ${N} ${N}" width="${N}" height="${N}"><rect x="${-N}" y="${-N}" width="${2 * N}" height="${2 * N}" fill="#fff"/><path fill="#000" fill-rule="nonzero" d="${toD(t2)}"/></svg>`;
  const { data } = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer({ resolveWithObject: true });
  return data;
}
export async function iou(dA, dB, shifts = [-24, -12, 0, 12, 24]) {
  const a = await mask(dA);
  let best = 0;
  for (const dx of shifts) {
    const b = await mask(dB, dx);
    let i = 0, u = 0;
    for (let k = 0; k < a.length; k++) {
      const pa = a[k] < 128, pb = b[k] < 128;
      if (pa && pb) i++;
      if (pa || pb) u++;
    }
    best = Math.max(best, i / u);
  }
  return best;
}
export const REFERENCE_FONTS = {
  "Bodoni Moda": "/tmp/soma-fonts/ttf/BodoniModa.ttf",
  Newsreader: "/tmp/soma-fonts/ttf/Newsreader-Display.ttf",
  Gloock: "/tmp/soma-fonts/ttf/Gloock.ttf",
  "Playfair Display": "/tmp/soma-fonts/ttf/PlayfairDisplay.ttf",
  "Libre Bodoni": "/tmp/soma-fonts/ttf/LibreBodoni.ttf",
};
