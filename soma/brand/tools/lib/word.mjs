// Glyph + spacing helpers shared by the logo concepts.
import { paper, toD, bounds, transform } from "./geo.mjs";
import { svgDoc } from "./svg.mjs";

/** Trim an open path to [a, b] (fractions of its length). */
export function trim(path, a, b) {
  const p = path.clone({ insert: false });
  const L = p.length;
  let tail = p.splitAt(L * b);
  if (tail) tail.remove();
  if (a > 0) {
    const rest = p.splitAt(L * a);
    return rest;
  }
  return p;
}
/**
 * glyphs: [{ name, item, lsb, rsb }] in local coords (ink starts wherever; lsb/rsb are measured from the ink bounds).
 * kern: { "SO": -10, ... } added between pairs. Returns { items: [{name, item}], width }.
 */
export function setWord(glyphs, { kern = {}, tracking = 0 } = {}) {
  let x = 0;
  const items = [];
  glyphs.forEach((g, i) => {
    const b = bounds(g.item);
    x += g.lsb ?? 0;
    const placed = transform(g.item, { tx: x - b.x });
    items.push({ name: g.name, item: placed });
    x += b.w + (g.rsb ?? 0);
    const next = glyphs[i + 1];
    if (next) x += (kern[g.name + next.name] ?? 0) + tracking;
  });
  return { items, width: x };
}
/** Union of placed items' bounds. */
export function inkBounds(items) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const { item } of items) {
    const b = bounds(item);
    x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x2); y2 = Math.max(y2, b.y2);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1, x2, y2 };
}
export function wordSvg(items, { pad = 0, fill = "#25211F", bg, title = "SOMA", id = "wordmark", capTop = 0, baseline = 700, desc } = {}) {
  const b = inkBounds(items);
  const vb = [b.x - pad, Math.min(b.y, capTop) - pad, b.w + 2 * pad, Math.max(b.y2, baseline) - Math.min(b.y, capTop) + 2 * pad];
  return svgDoc({
    viewBox: vb,
    title,
    desc,
    bg,
    groups: [{ id, fill, paths: items.map((it) => ({ id: `${id}-${it.name.toLowerCase()}`, d: toD(it.item) })) }],
  });
}
export { paper };
