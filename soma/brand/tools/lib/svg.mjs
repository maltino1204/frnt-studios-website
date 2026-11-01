// SVG document assembly and PNG rasterisation (sharp).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

export const PALETTE = {
  bone: "#F3EFE8",
  stone: "#D8CFC3",
  taupe: "#A69A8D",
  oxblood: "#542C35",
  espresso: "#25211F",
  black: "#000000",
  white: "#FFFFFF",
};
const n = (v) => +v.toFixed(2);
/**
 * groups: [{ id, d, fill?, transform? }]. bg: colour or null. title: accessible title.
 */
export function svgDoc({ viewBox, width, height, title = "SOMA", desc, bg, groups, extra = "" }) {
  const [vx, vy, vw, vh] = viewBox;
  const w = width ?? n(vw), h = height ?? n(vh);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(vx)} ${n(vy)} ${n(vw)} ${n(vh)}" width="${w}" height="${h}" role="img" aria-labelledby="t">\n`;
  s += `  <title id="t">${title}</title>\n`;
  if (desc) s += `  <desc>${desc}</desc>\n`;
  if (bg) s += `  <rect id="background" x="${n(vx)}" y="${n(vy)}" width="${n(vw)}" height="${n(vh)}" fill="${bg}"/>\n`;
  for (const g of groups) {
    s += `  <g id="${g.id}"${g.fill ? ` fill="${g.fill}"` : ""}${g.transform ? ` transform="${g.transform}"` : ""}>\n`;
    for (const p of g.paths ?? [{ id: undefined, d: g.d }]) {
      s += `    <path${p.id ? ` id="${p.id}"` : ""}${p.fill ? ` fill="${p.fill}"` : ""} d="${p.d}"/>\n`;
    }
    s += `  </g>\n`;
  }
  s += extra;
  s += `</svg>\n`;
  return s;
}
export function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}
/** Rasterise an SVG string at a target pixel width (or height). */
function densityFor(svg, width, height) {
  const w = +(svg.match(/<svg[^>]*\swidth="([\d.]+)"/) || [])[1] || 1000;
  const h = +(svg.match(/<svg[^>]*\sheight="([\d.]+)"/) || [])[1] || 1000;
  const scale = Math.max(width ? width / w : 0, height ? height / h : 0) || 1;
  // supersample 4x for small targets, 2x for large; librsvg density is in DPI (72 = 1 unit per px)
  const ss = Math.max(width ?? 0, height ?? 0) < 256 ? 4 : 2;
  return Math.min(72 * scale * ss, 72 * 200);
}
export async function png(svg, out, { width, height, background } = {}) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let img = sharp(Buffer.from(svg), { density: densityFor(svg, width, height), limitInputPixels: false });
  img = img.resize({ width, height, fit: "contain", background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } });
  if (background) img = img.flatten({ background });
  await img.png({ compressionLevel: 9 }).toFile(out);
  return out;
}
export async function pngBuffer(svg, { width, height } = {}) {
  return sharp(Buffer.from(svg), { density: densityFor(svg, width, height), limitInputPixels: false }).resize({ width, height, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}
