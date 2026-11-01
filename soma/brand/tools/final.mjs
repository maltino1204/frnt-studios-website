// SOMA final wordmark — refined from Concept C (Organic Modernism, "Kontrapost").
// The S is drawn from the two halves of the O, shifted against each other like the hips and shoulders of a
// figure in contrapposto: two crescents joined by a hairline waist. O, M and A share the same vertical stress.
// Two optical masters: "display" (>= 32 px cap height) and "micro" (< 32 px: heavier hairlines, wider spacing).
import { oval, rect, poly, unite, subtract, intersect, band, transform, bounds } from "./lib/geo.mjs";
import { setWord } from "./lib/word.mjs";
import { sEdge, sFromEdges } from "./lib/s.mjs";

export const MASTERS = {
  display: { H: 700, o: 12, V: 100, h: 32, waist: [150, -30, 124, -56], tracking: 74 },
  micro: { H: 700, o: 12, V: 112, h: 52, waist: [150, -30, 124, -56], tracking: 112 },
};
export const P = MASTERS.display;

/** O: vertical stress, a touch narrower than a circle; inner tension lower so the counter reads soft. */
export function glyphO({ V, h, o, H } = P, { rx = 332 } = {}) {
  const ry = H / 2 + o, cx = rx, cy = H / 2;
  const outer = oval({ cx, cy, rx, ry, kx: 0.57, ky: 0.585 });
  const inner = oval({ cx, cy, rx: rx - V, ry: ry - h, kx: 0.6, ky: 0.54 });
  return subtract(outer, inner);
}

/**
 * S: the O's two halves at half height, the upper one (thick on the left) shifted left, the lower one
 * (thick on the right) shifted right; a cubic waist joins them. Terminals cut on the same vertical as the
 * opposite bowl's extreme, so the S sits in a calm rectangle.
 */
export function glyphS({ V, h, o, H, waist } = P, { w = 240, sh = 0.36, sr = 0.64, cut = 'perp', tT = [-30, -30], tB = [150, 150], xr = 404, xl = 40, wv, kA = 0.36, kB = 0.36, r1 = 170, r2 = 178 } = {}) {
  const top = -o, bot = H + o;
  const [a1, a2, b1, b2] = wv ?? waist;
  const o1 = { cx: 248, rx: w - 14, cy: top + r1, ry: r1 };
  const i1 = { cx: 248 + V * sh, rx: w - 14 - V * sr, cy: top + h + r1 - h * 0.5, ry: r1 - h * 0.5 };
  const o2 = { cx: 242, rx: w, cy: bot - r2, ry: r2 };
  const i2 = { cx: 242 - V * sh, rx: w - V * sr, cy: bot - h - r2 + h * 0.5, ry: r2 - h * 0.5 };
  const vert = cut === "vertical";
  const A = sEdge({ up: o1, lo: i2, tTop: vert ? -10 : tT[0], th1: a1, th2: a2, tBot: vert ? 170 : tB[0], k1: kA, k2: kA });
  const B = sEdge({ up: i1, lo: o2, tTop: vert ? -10 : tT[1], th1: b1, th2: b2, tBot: vert ? 170 : tB[1], k1: kB, k2: kB });
  const path = sFromEdges(A, B);
  // waist geometry (centre between both spine curves, spine direction) for the symbol's cut
  const mid = (E) => ({ x: (E.P1.x + E.P2.x) / 2, y: (E.P1.y + E.P2.y) / 2 });
  const ma = mid(A), mb = mid(B);
  path.data = { waist: { x: (ma.x + mb.x) / 2, y: (ma.y + mb.y) / 2, angle: Math.atan2(A.P2.y - A.P1.y + B.P2.y - B.P1.y, A.P2.x - A.P1.x + B.P2.x - B.P1.x) } };
  if (!vert) return path;
  return subtract(path, rect(xr, -200, 600, o1.cy + 10), rect(xl - 600, o2.cy - 10, 600, 600));
}

/** M: thin left stem, full left diagonal, thin right diagonal, full right stem; pointed vertex below the baseline. */
export function glyphM({ V, h, H, o } = P, { W = 704 } = {}) {
  const thin = h * 1.45;
  const vx = W * 0.5 - V * 0.16, vy = H + o * 1.2;
  const lst = rect(0, -50, thin, H + 100);
  const rst = rect(W - V, -50, V, H + 100);
  const ld = band([0, 0], [vx, vy], (V * 0.97) / Math.cos(Math.atan2(vx, vy)), "left");
  const xr = W - V + thin * 0.2;
  const rd = band([xr, 0], [vx, vy], thin / Math.cos(Math.atan2(xr - vx, vy)), "right");
  const vee = poly([[0, -200], [0, 0], [vx, vy], [xr, 0], [xr, -200]]);
  const m = unite(lst, rst, intersect(unite(ld, rd), vee));
  return intersect(m, rect(-500, 0, W + 1000, H + o * 1.2));
}

/** A: hairline left leg, full right leg, pointed apex above the cap line, low hairline bar. */
export function glyphA({ V, h, H, o } = P, { W = 650, bar = 0.615 } = {}) {
  const ax = W * 0.5 + 8, ay = -o * 1.4;
  const ll = band([ax, ay], [0, H], (h * 1.3) / Math.cos(Math.atan2(ax, H - ay)), "left");
  const rl = band([ax, ay], [W, H], (V * 1.0) / Math.cos(Math.atan2(W - ax, H - ay)), "right");
  const tri = poly([[ax, ay], [W, H], [0, H]]);
  const cb = rect(-50, H * bar, W + 100, h * 0.95);
  return intersect(intersect(unite(ll, rl, cb), tri), rect(-500, ay - 1, W + 1000, H - ay + 1));
}

export function glyphs(m = P) {
  return { S: glyphS(m), O: glyphO(m), M: glyphM(m), A: glyphA(m) };
}

/** Spacing: sidebearings measured from ink; pair kerning hand-tuned for even optical gaps. */
export function word(m = P) {
  const g = glyphs(m);
  return setWord(
    [
      { name: "S", item: g.S, lsb: 0, rsb: 30 },
      { name: "O", item: g.O, lsb: 30, rsb: 34 },
      { name: "M", item: g.M, lsb: 46, rsb: 36 },
      { name: "A", item: g.A, lsb: 0, rsb: 0 },
    ],
    { kern: { SO: -22, OM: -12, MA: -46 }, tracking: m.tracking },
  );
}

/** The S at symbol weight (also used inside the mark). */
export const SYMBOL = { V: 124, h: 46 };
export const SYMBOL_OPTS = { w: 246 };
/** Heavier S for the favicon cut: hairlines opened up so the waist survives rasterisation. */
export const SYMBOL_MICRO = { V: 138, h: 74 };

/**
 * The SOMA mark, "S im O": the S, the body, held inside the O, the place. Both parts are the wordmark's own geometry:
 * the O's outer contour (rx 332, ry 362, tensions 0.57 / 0.585) and the S of the wordmark at symbol weight.
 *
 * v1.2 (Brand Audit 2, O5), the ownable detail: **the Versatz**. The O is cut at its waist and its halves slide
 * against each other by one hairline each (40 units): the upper half to the left, the lower half to the right,
 * the shoulders against the hips of contrapposto and the same gesture as the S it holds (upper bowl left, lower bowl
 * right). A typed S in an oval cannot have it. Two cuts:
 *   line  (>= 32 px): the O as a vertical-stress ring, the S floating in its counter;
 *   solid (< 32 px): the O filled with the S set into it (the seal), for favicons, small app icons and stamps.
 * Returned centred on (0, 0); the O spans (664 + 2 x 40) x 724 units.
 */
export const MARK = {
  rx: 332,
  ry: 362,
  shift: 40,
  line: { OV: 108, Oh: 40, S: { V: 120, h: 46 }, SH: 446, sx: 0.96 },
  solid: { S: { V: 156, h: 82 }, SH: 444, sx: 0.98 },
};
function centred(g, H) {
  const b = bounds(g);
  return transform(transform(g, { tx: -b.x - b.w / 2, ty: -b.y - b.h / 2 }), { sx: H / b.h });
}
/** The Versatz: cut at the waist (y = 0), upper half to the left, lower half to the right, by `shift` each. */
export function versatz(g, shift = MARK.shift) {
  const up = transform(intersect(g, rect(-4000, -4000, 8000, 4000)), { tx: -shift });
  const lo = transform(intersect(g, rect(-4000, 0, 8000, 4000)), { tx: shift });
  return unite(up, lo);
}
/** grow: enlarge the O outline (for the favicon rim) while keeping the same Versatz. */
export function symbolMark(cut = "line", { grow = 0 } = {}) {
  const { rx, ry, shift } = MARK;
  const c = MARK[cut];
  const outer = oval({ cx: 0, cy: 0, rx: rx + grow, ry: ry + grow, kx: 0.57, ky: 0.585 });
  const S = transform(centred(glyphS({ ...MASTERS.display, ...c.S }, SYMBOL_OPTS), c.SH), { sx: c.sx, sy: 1 });
  if (cut === "solid") {
    const seal = versatz(outer, shift);
    return { cut, seal, s: S, item: subtract(seal, S) };
  }
  const inner = oval({ cx: 0, cy: 0, rx: rx - c.OV, ry: ry - c.Oh, kx: 0.6, ky: 0.54 });
  const o = versatz(subtract(outer, inner), shift);
  return { cut, o, s: S, item: unite(o, S) };
}
/** The previous mark (v1.1, no Versatz), kept as the control for studies. */
export function symbolMarkV11() {
  const outer = oval({ cx: 0, cy: 0, rx: 332, ry: 362, kx: 0.57, ky: 0.585 });
  const inner = oval({ cx: 0, cy: 0, rx: 224, ry: 322, kx: 0.6, ky: 0.54 });
  const S = centred(glyphS({ ...MASTERS.display, V: 120, h: 46 }, SYMBOL_OPTS), 466);
  return unite(subtract(outer, inner), S);
}
