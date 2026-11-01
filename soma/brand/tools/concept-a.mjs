// Concept A — Architectural. Uppercase, near-monolinear, built on a datum grid.
import { ellipse, oval, rect, poly, unite, subtract, intersect, stroke, skeleton, halfPlane, band, K } from "./lib/geo.mjs";
import { trim, setWord } from "./lib/word.mjs";
import { sSkeleton, expand } from "./lib/s.mjs";

export const P = {
  H: 700, o: 11, V: 78, h: 68, // cap height, overshoot, vertical stem, horizontal stroke
};

const clipCap = (item, H = P.H) => intersect(item, rect(-2000, 0, 6000, H));

export function glyphO({ V, h, o, H } = P) {
  const rx = 362, ry = H / 2 + o;
  const cx = rx, cy = H / 2;
  const outer = oval({ cx, cy, rx, ry, kx: 0.56, ky: 0.56 });
  const inner = oval({ cx, cy, rx: rx - V, ry: ry - h, kx: 0.555, ky: 0.555 });
  return subtract(outer, inner);
}

export function glyphS({ V, h, o, H } = P, { tTop = -28, tBot = 152, r1 = 138, r2 = 150, rx1 = 182, rx2 = 196, dx = 6, spineBoost = 1.04 } = {}) {
  const t = h / 2;
  const top = -o + t, bot = H + o - t;
  // centreline bowls: the upper bowl is narrower and shorter (optical), set a touch right.
  const up = { cx: 250 + dx, rx: rx1, cy: top + r1, ry: r1 };
  const lo = { cx: 250, rx: rx2, cy: bot - r2, ry: r2 };
  const { pts } = sSkeleton({ up, lo, tTop, tBot });
  const w = (q) => {
    const s = Math.abs(Math.sin(q.a));
    const f = Math.min(1, s / Math.sin((30 * Math.PI) / 180));
    const sm = f * f * (3 - 2 * f);
    return h + (V * spineBoost - h) * sm;
  };
  return expand(pts, w);
}

export function glyphM({ V, h, H, o } = P, { W = 700, dw = 66, vertexY = H + 26 } = {}) {
  const ls = rect(0, -40, V, H + 80), rs = rect(W - V, -40, V, H + 80);
  const cx = W / 2;
  const ang = Math.atan2(cx, vertexY);
  const wh = dw / Math.cos(ang);
  const ld = band([0, 0], [cx, vertexY], wh, "left");
  const rd = band([W, 0], [cx, vertexY], wh, "right");
  const aboveV = poly([[-10, -100], [0, 0], [cx, vertexY], [W, 0], [W + 10, -100]]);
  return clipCap(unite(ls, rs, intersect(unite(ld, rd), aboveV)));
}

export function glyphA({ V, h, H, o } = P, { W = 640, apexY = -26, bar = 0.64, dw = 72 } = {}) {
  const cx = W / 2;
  const ang = Math.atan2(cx, H - apexY);
  const wh = dw / Math.cos(ang);
  const ll = band([cx, apexY], [0, H], wh, "left");
  const rl = band([cx, apexY], [W, H], wh, "right");
  const tri = poly([[cx, apexY], [W, H], [0, H]]);
  const cb = rect(-50, H * bar, W + 100, h * 0.92);
  return clipCap(intersect(unite(ll, rl, cb), tri));
}

export function word(opts = {}) {
  const p = { ...P, ...opts };
  return setWord(
    [
      { name: "S", item: glyphS(p), lsb: 0, rsb: 44 },
      { name: "O", item: glyphO(p), lsb: 40, rsb: 40 },
      { name: "M", item: glyphM(p), lsb: 70, rsb: 70 },
      { name: "A", item: glyphA(p), lsb: 8, rsb: 0 },
    ],
    { kern: { SO: 0, OM: 0, MA: 0 }, tracking: 90 },
  );
}
