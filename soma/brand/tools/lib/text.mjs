// Outline text with opentype.js (simple LTR layout; Latin needs no shaping). Each glyph's outline is read
// once at the origin and translated, because repeated getPath() calls on the same TrueType glyph can
// return NaN coordinates in opentype.js 2.0.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const opentype = require("opentype.js");
const cache = {};
export function font(file) {
  return (cache[file] ??= { f: opentype.parse(fs.readFileSync(file).buffer), glyphs: new Map() });
}
const r = (v) => {
  const s = (+v.toFixed(2)).toString();
  return s === "-0" ? "0" : s;
};
/** Returns { d, width, capHeight } for text set at `size` px, baseline y = 0, x starting at 0. */
export function textPath(file, text, size, { tracking = 0, upper = false } = {}) {
  const F = font(file), f = F.f;
  const s = size / f.unitsPerEm;
  const str = upper ? text.toUpperCase() : text;
  const glyphs = [...str].map((c) => f.charToGlyph(c));
  let x = 0, d = "";
  glyphs.forEach((g, i) => {
    const key = `${g.index}@${size}`;
    if (!F.glyphs.has(key)) F.glyphs.set(key, g.getPath(0, 0, size).commands.map((c) => ({ ...c })));
    for (const c of F.glyphs.get(key)) {
      if (c.type === "M" || c.type === "L") d += `${c.type}${r(c.x + x)} ${r(c.y)}`;
      else if (c.type === "Q") d += `Q${r(c.x1 + x)} ${r(c.y1)} ${r(c.x + x)} ${r(c.y)}`;
      else if (c.type === "C") d += `C${r(c.x1 + x)} ${r(c.y1)} ${r(c.x2 + x)} ${r(c.y2)} ${r(c.x + x)} ${r(c.y)}`;
      else if (c.type === "Z") d += "Z";
    }
    x += (g.advanceWidth || 0) * s;
    const n = glyphs[i + 1];
    if (n) x += (Number(f.getKerningValue(g, n)) || 0) * s + tracking * size;
  });
  if (/NaN/.test(d)) throw new Error(`NaN in outlined text: ${text}`);
  return { d, width: x, capHeight: (f.tables.os2.sCapHeight || 700) * s };
}
