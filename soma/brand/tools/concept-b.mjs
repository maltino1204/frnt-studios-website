// Concept B — Editorial. High-contrast uppercase serif, vertical stress, hairline serifs, beak terminals.
import { oval, rect, poly, unite, subtract, intersect, band, contour, halfPlane } from "./lib/geo.mjs";
import { setWord } from "./lib/word.mjs";
import { sSkeleton, expand, sOutline, sEdge, sFromEdges } from "./lib/s.mjs";

export const P = { H: 700, o: 12, V: 112, h: 16, serif: 16 };
const D = Math.PI / 180;
const clipCap = (item, H = P.H) => intersect(item, rect(-2000, 0, 6000, H));
const sstep = (x) => { const f = Math.max(0, Math.min(1, x)); return f * f * (3 - 2 * f); };

export function glyphO({ V, h, o, H } = P, { rx = 318, tilt = 0 } = {}) {
  const ry = H / 2 + o, cx = rx, cy = H / 2;
  const outer = oval({ cx, cy, rx, ry, kx: 0.56, ky: 0.585 });
  const inner = oval({ cx, cy, rx: rx - V, ry: ry - h, kx: 0.6, ky: 0.53 });
  return subtract(outer, inner);
}

function edgeY(path, x, pick) {
  const line = new path.constructor({ segments: [[x, -2000], [x, 3000]], insert: false });
  const ys = path.getIntersections(line).map((c) => c.point.y).sort((a, b) => a - b);
  return pick(ys);
}

export function glyphS({ V, h, o, H } = P, { xr = 398, xl = 38, bh = 140, thA = [160, -22], thB = [104, -78], k = [0.26, 0.26] } = {}) {
  const top = -o, bot = H + o;
  const o1 = { cx: 230, rx: 200, cy: top + 172, ry: 172 };
  const i1 = { cx: 230 + 28, rx: 200 - 56, cy: top + h + 166, ry: 166 - 4 };
  const o2 = { cx: 222, rx: 214, cy: bot - 182, ry: 182 };
  const i2 = { cx: 222 - 30, rx: 214 - 60, cy: bot - h - 176, ry: 176 - 4 };
  const A = sEdge({ up: o1, lo: i2, tTop: -10, th1: thA[0], th2: thA[1], tBot: 170, k1: k[0], k2: k[1] });
  const B = sEdge({ up: i1, lo: o2, tTop: -10, th1: thB[0], th2: thB[1], tBot: 170, k1: k[0], k2: k[1] });
  let g = sFromEdges(A, B);
  g = subtract(g, rect(xr, -200, 600, o1.cy + 10), rect(xl - 600, o2.cy - 10, 600, 600));
  // lens beaks: a narrow vertical ellipse clipped by the vertical cut, fused to the hairline
  const ysAt = (x) => {
    const line = new g.constructor({ segments: [[x, -2000], [x, 3000]], insert: false });
    return g.getIntersections(line).map((c) => c.point.y).sort((a, b) => a - b);
  };
  const e = ysAt(xr - 0.6), f = ysAt(xl + 0.6);
  const yT = e[0], yB = f[f.length - 1];
  const lensT = intersect(oval({ cx: xr - 2, cy: yT + bh * 0.4, rx: 22, ry: bh * 0.44, kx: 0.5, ky: 0.62 }), rect(xr - 200, yT - 1, 200, 400));
  const lensB = intersect(oval({ cx: xl + 2, cy: yB - bh * 0.4, rx: 22, ry: bh * 0.44, kx: 0.5, ky: 0.62 }), rect(xl, yB - 400, 200, 401));
  return unite(g, lensT, lensB);
}

function serifFoot(cx, w, H, sh) {
  return rect(cx - w / 2, H - sh, w, sh);
}

export function glyphM({ V, h, H, serif } = P, { W = 740 } = {}) {
  const hs = h * 1.3;
  const x0 = 0, vx = W * 0.5 - V * 0.25;
  const rsx = W - V; // right stem left edge
  const lst = rect(x0, -50, hs, H + 100);
  const rst = rect(rsx, -50, V, H + 100);
  const angL = Math.atan2(vx - x0, H);
  const ld = band([x0, 0], [vx, H + 14], V * 1.0 / Math.cos(angL), "left");
  const xr = rsx + hs * 0.2;
  const angR = Math.atan2(xr - vx, H);
  const rd = band([xr, 0], [vx, H + 14], hs / Math.cos(angR), "right");
  const vee = poly([[x0, -200], [x0, 0], [vx, H + 14], [xr, 0], [xr, -200]]);
  let m = unite(lst, rst, intersect(unite(ld, rd), vee));
  m = intersect(m, rect(-500, 0, W + 1000, H));
  const fL = serifFoot(x0 + hs / 2, 150, H, serif), fR = serifFoot(rsx + V / 2, 200, H, serif);
  const tL = rect(x0 - 60, 0, 60 + hs, serif), tR = rect(rsx, 0, V + 56, serif);
  return unite(m, fL, fR, tL, tR);
}

export function glyphA({ V, h, H, serif } = P, { W = 660, apexY = -14, bar = 0.62 } = {}) {
  const cx = W * 0.5 + 10;
  const hs = h * 1.25;
  const ll = band([cx, apexY], [80, H], hs, "left");
  const rl = band([cx, apexY], [W - 70, H], V * 1.02, "right");
  const tri = poly([[cx - 1, apexY], [cx + 1, apexY], [W + 40, H + 40], [W - 70, H], [80, H], [40, H + 40]]);
  let a = intersect(unite(ll, rl), poly([[cx, apexY], [W - 70, H], [80, H]]));
  const cb = intersect(rect(-50, H * bar, W + 100, h * 1.05), poly([[cx, apexY], [W - 70, H], [80, H]]));
  const fL = serifFoot(80 + hs * 0.3, 170, H, serif), fR = serifFoot(W - 70 - V * 0.5, 210, H, serif);
  a = unite(a, cb, fL, fR);
  return intersect(a, rect(-300, apexY - 5, W + 600, H - apexY + 5));
}

export function word(opts = {}) {
  const p = { ...P, ...opts };
  return setWord(
    [
      { name: "S", item: glyphS(p), lsb: 0, rsb: 40 },
      { name: "O", item: glyphO(p), lsb: 34, rsb: 30 },
      { name: "M", item: glyphM(p), lsb: 34, rsb: 18 },
      { name: "A", item: glyphA(p), lsb: 0, rsb: 0 },
    ],
    { kern: { SO: 0, OM: 0, MA: -30 }, tracking: 40 },
  );
}
