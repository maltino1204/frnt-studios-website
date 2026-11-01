// Geometry kit for the SOMA letterforms: paper.js booleans + helpers + clean absolute SVG serialisation.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const paper = require("paper");
paper.setup(new paper.Size(4000, 4000));
export { paper };
const { Path, CompoundPath, Point } = paper;

export const K = 0.5522847498; // circle handle ratio

/** Closed contour from on-curve points with optional handles: [x, y, hInX, hInY, hOutX, hOutY] (handles relative). */
export function contour(pts) {
  const p = new Path({ insert: false, closed: true });
  for (const q of pts) {
    const [x, y, ix = 0, iy = 0, ox = 0, oy = 0] = q;
    p.add(new paper.Segment(new Point(x, y), new Point(ix, iy), new Point(ox, oy)));
  }
  return p;
}
/** Ellipse with adjustable handle tension (k > 0.5523 = squarer superellipse feel). */
export function ellipse(cx, cy, rx, ry, k = K) {
  return contour([
    [cx, cy - ry, -rx * k, 0, rx * k, 0],
    [cx + rx, cy, 0, -ry * k, 0, ry * k],
    [cx, cy + ry, rx * k, 0, -rx * k, 0],
    [cx - rx, cy, 0, ry * k, 0, -ry * k],
  ]);
}
/** Ellipse with independent horizontal/vertical tensions and an optional offset of the extrema. */
export function oval({ cx, cy, rx, ry, kx = K, ky = K }) {
  return contour([
    [cx, cy - ry, -rx * kx, 0, rx * kx, 0],
    [cx + rx, cy, 0, -ry * ky, 0, ry * ky],
    [cx, cy + ry, rx * kx, 0, -rx * kx, 0],
    [cx - rx, cy, 0, ry * ky, 0, -ry * ky],
  ]);
}
export function rect(x, y, w, h) {
  return poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
}
export function poly(points) {
  return new Path({ segments: points.map(([x, y]) => new Point(x, y)), closed: true, insert: false });
}
export function fromD(d) {
  const c = new CompoundPath({ pathData: d, insert: false });
  return c;
}
export function unite(...items) {
  let acc = items[0];
  for (const it of items.slice(1)) acc = acc.unite(it, { insert: false });
  return acc;
}
export function subtract(a, ...bs) {
  let acc = a;
  for (const b of bs) acc = acc.subtract(b, { insert: false });
  return acc;
}
export function intersect(a, b) {
  return a.intersect(b, { insert: false });
}
/** Half-plane (as a big polygon) on the left of the directed line p1->p2. */
export function halfPlane([x1, y1], [x2, y2], size = 20000) {
  const dx = x2 - x1, dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  const nx = uy, ny = -ux; // left normal (y down)
  const a = [x1 - ux * size, y1 - uy * size], b = [x1 + ux * size, y1 + uy * size];
  return poly([a, b, [b[0] + nx * size, b[1] + ny * size], [a[0] + nx * size, a[1] + ny * size]]);
}
/**
 * Variable-width stroke along a skeleton path. width(t, angle) -> full width; t in [0,1] by length,
 * angle = tangent direction in radians. Returns a closed path whose two sides are curve-fitted (simplify).
 */
export function stroke(skel, width, { samples = 240, tol = 0.6, caps = "flat" } = {}) {
  const L = skel.length;
  const left = [], right = [];
  for (let i = 0; i <= samples; i++) {
    const off = (L * i) / samples;
    const pt = skel.getPointAt(Math.min(off, L - 1e-6));
    const tan = skel.getTangentAt(Math.min(off, L - 1e-6));
    const n = new Point(-tan.y, tan.x);
    const w = width(i / samples, Math.atan2(tan.y, tan.x)) / 2;
    left.push(pt.add(n.multiply(w)));
    right.push(pt.subtract(n.multiply(w)));
  }
  const pl = new Path({ segments: left, insert: false });
  const pr = new Path({ segments: right.reverse(), insert: false });
  pl.simplify(tol);
  pr.simplify(tol);
  const out = new Path({ insert: false, closed: true });
  out.addSegments(pl.segments.map((s) => s.clone()));
  out.addSegments(pr.segments.map((s) => s.clone()));
  return out;
}
/** Skeleton from cubic points like contour() but open. */
export function skeleton(pts) {
  const p = contour(pts);
  p.closed = false;
  return p;
}
export function transform(item, { tx = 0, ty = 0, sx = 1, sy = sx, rot = 0, origin = [0, 0] } = {}) {
  const c = item.clone({ insert: false });
  const m = new paper.Matrix();
  m.translate(tx, ty);
  m.translate(origin[0], origin[1]);
  if (rot) m.rotate(rot);
  m.scale(sx, sy);
  m.translate(-origin[0], -origin[1]);
  c.transform(m);
  return c;
}
/** Serialise to absolute path data, rounded; merges children; uses L for straight segments. */
export function toD(item, prec = 2) {
  const r = (v) => {
    const s = (+v.toFixed(prec)).toString();
    return s === "-0" ? "0" : s;
  };
  const paths = item instanceof CompoundPath ? item.children : item.children?.length ? item.children : [item];
  let d = "";
  for (const p of paths) {
    if (!p.segments || !p.segments.length) continue;
    const segs = p.segments;
    d += `M${r(segs[0].point.x)} ${r(segs[0].point.y)}`;
    const n = segs.length;
    for (let i = 1; i <= n; i++) {
      const a = segs[i - 1], b = segs[i % n];
      if (i === n && !p.closed) break;
      const h1 = a.handleOut, h2 = b.handleIn;
      if (h1.isZero() && h2.isZero()) {
        if (i === n) break; // closing line implied by Z
        d += `L${r(b.point.x)} ${r(b.point.y)}`;
      } else {
        d += `C${r(a.point.x + h1.x)} ${r(a.point.y + h1.y)} ${r(b.point.x + h2.x)} ${r(b.point.y + h2.y)} ${r(b.point.x)} ${r(b.point.y)}`;
      }
    }
    if (p.closed) d += "Z";
  }
  return d;
}
export function bounds(item) {
  const b = item.bounds;
  return { x: b.x, y: b.y, w: b.width, h: b.height, x2: b.x + b.width, y2: b.y + b.height };
}
/**
 * A straight stroke between two points with horizontal thickness `wh`, anchored by edge:
 * align = "left" | "right" | "center": which edge passes through p1/p2. Extended by `ext` past both ends
 * (clip afterwards) so booleans never meet coincident edges.
 */
export function band([x1, y1], [x2, y2], wh, align = "center", ext = 60) {
  const dx = x2 - x1, dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  const a = [x1 - ux * ext, y1 - uy * ext], b = [x2 + ux * ext, y2 + uy * ext];
  const off = align === "left" ? [0, wh] : align === "right" ? [-wh, 0] : [-wh / 2, wh / 2];
  return poly([[a[0] + off[0], a[1]], [b[0] + off[0], b[1]], [b[0] + off[1], b[1]], [a[0] + off[1], a[1]]]);
}
