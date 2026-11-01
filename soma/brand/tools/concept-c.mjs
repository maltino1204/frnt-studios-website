// Concept C — Organic Modernism. High-contrast, serif-less, sculptural. The S is built from the two
// halves of the O, shifted against each other (contrapposto): two crescents meeting at a hairline waist.
import { oval, rect, poly, unite, subtract, intersect, band, contour } from "./lib/geo.mjs";
import { setWord } from "./lib/word.mjs";
import { sOutline, sEdge, sFromEdges } from "./lib/s.mjs";

export const P = { H: 700, o: 12, V: 104, h: 30 };
const clipCap = (item, H = P.H) => intersect(item, rect(-2000, 0, 6000, H));

export function glyphO({ V, h, o, H } = P, { rx = 336 } = {}) {
  const ry = H / 2 + o, cx = rx, cy = H / 2;
  const outer = oval({ cx, cy, rx, ry, kx: 0.57, ky: 0.58 });
  const inner = oval({ cx, cy, rx: rx - V, ry: ry - h, kx: 0.6, ky: 0.54 });
  return subtract(outer, inner);
}

export function glyphS({ V, h, o, H } = P, {
  w = 226, gap = 0, thA = [146, -34], thB = [118, -62], kA = [0.36, 0.36], kB = [0.36, 0.36],
  sh = 0.36, sr = 0.66, xr = 404, xl = 40, tilt = 0,
} = {}) {
  const top = -o, bot = H + o;
  const r1 = 182, r2 = 190;
  const o1 = { cx: 236, rx: w - 14, cy: top + r1, ry: r1 };
  const i1 = { cx: 236 + V * sh, rx: w - 14 - V * sr, cy: top + h + r1 - h * 0.5, ry: r1 - h * 0.5 };
  const o2 = { cx: 230, rx: w, cy: bot - r2, ry: r2 };
  const i2 = { cx: 230 - V * sh, rx: w - V * sr, cy: bot - h - r2 + h * 0.5, ry: r2 - h * 0.5 };
  const A = sEdge({ up: o1, lo: i2, tTop: -10, th1: thA[0], th2: thA[1], tBot: 170, k1: kA[0], k2: kA[1] });
  const B = sEdge({ up: i1, lo: o2, tTop: -10, th1: thB[0], th2: thB[1], tBot: 170, k1: kB[0], k2: kB[1] });
  const path = sFromEdges(A, B);
  return subtract(path, rect(xr, -200, 600, o1.cy + 10), rect(xl - 600, o2.cy - 10, 600, 600));
}

export function glyphM({ V, h, H, o } = P, { W = 700, logic = "didone", vxOff = -0.18 } = {}) {
  const thin = h * 1.5, thick = V;
  const [sL, dL, dR, sR] =
    logic === "didone" ? [thin, thick * 0.98, thin, thick] : logic === "stems" ? [thick * 0.92, thin, thin, thick * 0.92] : [thin, thick * 0.9, thick * 0.9, thin];
  const vx = W * 0.5 + V * (logic === "didone" ? vxOff : 0), vy = H + o * 1.2;
  const lst = rect(0, -50, sL, H + 100);
  const rst = rect(W - sR, -50, sR, H + 100);
  const angL = Math.atan2(vx, vy);
  const ld = band([0, 0], [vx, vy], dL / Math.cos(angL), "left");
  const xr = W;
  const angR = Math.atan2(xr - vx, vy);
  const rd = band([xr, 0], [vx, vy], dR / Math.cos(angR), "right");
  const vee = poly([[0, -200], [0, 0], [vx, vy], [xr, 0], [xr, -200]]);
  const m = unite(lst, rst, intersect(unite(ld, rd), vee));
  return intersect(m, rect(-500, 0, W + 1000, H + o * 1.2));
}

export function glyphA({ V, h, H, o } = P, { W = 640, bar = 0.6 } = {}) {
  const ax = W * 0.5 + 6, ay = -o * 1.4;
  const ll = band([ax, ay], [0, H], h * 1.25 / Math.cos(Math.atan2(ax, H)) + 16, "left");
  const rl = band([ax, ay], [W, H], V * 1.02 / Math.cos(Math.atan2(W - ax, H)), "right");
  const tri = poly([[ax, ay], [W, H], [0, H]]);
  const cb = rect(-50, H * bar, W + 100, h * 0.9);
  return clipCap(intersect(unite(ll, rl, cb), tri));
}

export function word(opts = {}) {
  const p = { ...P, ...opts };
  return setWord(
    [
      { name: "S", item: glyphS(p), lsb: 0, rsb: 40 },
      { name: "O", item: glyphO(p), lsb: 40, rsb: 40 },
      { name: "M", item: glyphM(p), lsb: 54, rsb: 30 },
      { name: "A", item: glyphA(p), lsb: 0, rsb: 0 },
    ],
    { kern: { SO: 0, OM: 0, MA: -20 }, tracking: 60 },
  );
}
