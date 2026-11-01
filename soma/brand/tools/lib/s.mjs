// Analytic S construction: two elliptical bowls joined by a straight common-tangent spine,
// expanded with a direction-dependent width (contrast model), then curve-fitted.
import { paper } from "./geo.mjs";
const { Path, Point } = paper;
const D = Math.PI / 180;

function ell(e, th) {
  return { x: e.cx + e.rx * Math.cos(th), y: e.cy + e.ry * Math.sin(th) };
}
// tangent for increasing theta
function dEll(e, th) {
  return { x: -e.rx * Math.sin(th), y: e.ry * Math.cos(th) };
}
function angOf(v) {
  return Math.atan2(v.y, v.x);
}
/** On E1 (traversed with decreasing theta in (90°,180°)) find theta with tangent angle a. */
function solveUpper(e, a) {
  let lo = 90.0001 * D, hi = 179.999 * D;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    const t = dEll(e, m);
    const ang = angOf({ x: -t.x, y: -t.y });
    // as theta goes 90->180, ang goes 0° -> 90°
    if (ang < a) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
/** On E2 (increasing theta in (-90°,0°)) find theta with tangent angle a. */
function solveLower(e, a) {
  let lo = -89.999 * D, hi = -0.0001 * D;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    const ang = angOf(dEll(e, m));
    // theta -90 -> 0: ang 0° -> 90°
    if (ang < a) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
/**
 * params: { up: {cx,cy,rx,ry}, lo: {...}, tTop (deg, theta of the upper terminal, e.g. -20),
 *           tBot (deg, theta of the lower terminal, e.g. 160), width(angleRad, u, part) }
 * Returns { skeleton: [{x,y,a,part,u}], spine }
 */
export function sSkeleton({ up, lo, tTop, tBot, n = 600 }) {
  // solve spine angle
  let aLo = 2 * D, aHi = 88 * D, a = 40 * D, t1, t2;
  for (let i = 0; i < 80; i++) {
    a = (aLo + aHi) / 2;
    t1 = solveUpper(up, a);
    t2 = solveLower(lo, a);
    const p1 = ell(up, t1), p2 = ell(lo, t2);
    const d = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    if (d > a) aLo = a; else aHi = a;
  }
  const P1 = ell(up, t1), P2 = ell(lo, t2);
  // arc lengths for an even sampling
  const segs = [];
  const arcLen = (e, th0, th1) => {
    let L = 0, prev = ell(e, th0);
    for (let i = 1; i <= 200; i++) {
      const p = ell(e, th0 + ((th1 - th0) * i) / 200);
      L += Math.hypot(p.x - prev.x, p.y - prev.y);
      prev = p;
    }
    return L;
  };
  const upEnd = t1 - 2 * Math.PI; // decreasing from tTop (e.g. -20°) to t1-360 (e.g. -235°)
  const L1 = arcLen(up, tTop * D, upEnd);
  const L2 = Math.hypot(P2.x - P1.x, P2.y - P1.y);
  const L3 = arcLen(lo, t2, tBot * D);
  const L = L1 + L2 + L3;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = (L * i) / n;
    let p, tan, part;
    if (s <= L1) {
      const th = tTop * D + (upEnd - tTop * D) * (s / L1);
      p = ell(up, th);
      const t = dEll(up, th);
      tan = { x: -t.x, y: -t.y };
      part = "upper";
    } else if (s <= L1 + L2) {
      const f = (s - L1) / L2;
      p = { x: P1.x + (P2.x - P1.x) * f, y: P1.y + (P2.y - P1.y) * f };
      tan = { x: P2.x - P1.x, y: P2.y - P1.y };
      part = "spine";
    } else {
      const th = t2 + (tBot * D - t2) * ((s - L1 - L2) / L3);
      p = ell(lo, th);
      tan = dEll(lo, th);
      part = "lower";
    }
    pts.push({ x: p.x, y: p.y, a: angOf(tan), u: s / L, part });
  }
  return { pts, spineAngle: a / D, P1, P2 };
}
/** Expand a sampled skeleton with width(pt) into a closed, curve-fitted outline. */
export function expand(pts, width, { tol = 0.3, capStart, capEnd } = {}) {
  const left = [], right = [];
  for (const q of pts) {
    const w = width(q) / 2;
    const nx = -Math.sin(q.a), ny = Math.cos(q.a);
    const off = q.offset ?? 0; // shift of the stroke centre along the normal (asymmetric weight)
    left.push(new Point(q.x + nx * (w + off), q.y + ny * (w + off)));
    right.push(new Point(q.x - nx * (w - off), q.y - ny * (w - off)));
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

/**
 * Two-edge S: each edge is its own arc + common tangent + arc construction, so contrast comes from
 * the different radii (like an O built from two ellipses) and never self-intersects.
 * edgeA = (o1 = outer of upper bowl, i2 = inner of lower bowl); edgeB = (i1, o2).
 * tA/tB: [thetaTop, thetaBot] in degrees for each edge (extend past the cuts; clip afterwards).
 */
export function sOutline({ o1, i1, o2, i2, tA, tB, tol = 0.2 }) {
  const A = sSkeleton({ up: o1, lo: i2, tTop: tA[0], tBot: tA[1], n: 900 });
  const B = sSkeleton({ up: i1, lo: o2, tTop: tB[0], tBot: tB[1], n: 900 });
  const pa = new Path({ segments: A.pts.map((q) => new Point(q.x, q.y)), insert: false });
  const pb = new Path({ segments: B.pts.map((q) => new Point(q.x, q.y)).reverse(), insert: false });
  pa.simplify(tol);
  pb.simplify(tol);
  const out = new Path({ insert: false, closed: true });
  out.addSegments(pa.segments.map((s) => s.clone()));
  out.addSegments(pb.segments.map((s) => s.clone()));
  return { path: out, A, B };
}

/**
 * One S edge: arc on `up` from tTop (deg, decreasing) to th1 (deg, in 90..180), a tangent-continuous cubic
 * spine to th2 on `lo` (deg, in -90..0), arc on `lo` to tBot (deg, increasing). k1/k2 = handle length factors.
 */
export function sEdge({ up, lo, tTop, th1, th2, tBot, k1 = 0.4, k2 = 0.4, n = 900 }) {
  const P1 = ell(up, th1 * D), P2 = ell(lo, th2 * D);
  const t1 = dEll(up, th1 * D), t2 = dEll(lo, th2 * D);
  const u1 = { x: -t1.x, y: -t1.y }; // direction leaving the upper arc (decreasing theta)
  const l1 = Math.hypot(u1.x, u1.y), l2 = Math.hypot(t2.x, t2.y);
  const chord = Math.hypot(P2.x - P1.x, P2.y - P1.y);
  const C1 = { x: P1.x + (u1.x / l1) * chord * k1, y: P1.y + (u1.y / l1) * chord * k1 };
  const C2 = { x: P2.x - (t2.x / l2) * chord * k2, y: P2.y - (t2.y / l2) * chord * k2 };
  const bez = (t) => {
    const m = 1 - t;
    return {
      x: m * m * m * P1.x + 3 * m * m * t * C1.x + 3 * m * t * t * C2.x + t * t * t * P2.x,
      y: m * m * m * P1.y + 3 * m * m * t * C1.y + 3 * m * t * t * C2.y + t * t * t * P2.y,
    };
  };
  const pts = [];
  const a0 = tTop * D, a1 = th1 * D - 2 * Math.PI;
  const nA = Math.round(n * 0.4), nB = Math.round(n * 0.2), nC = n - nA - nB;
  for (let i = 0; i <= nA; i++) pts.push(ell(up, a0 + ((a1 - a0) * i) / nA));
  for (let i = 1; i < nB; i++) pts.push(bez(i / nB));
  const b0 = th2 * D, b1 = tBot * D;
  for (let i = 0; i <= nC; i++) pts.push(ell(lo, b0 + ((b1 - b0) * i) / nC));
  return { pts, P1, P2, C1, C2 };
}
/** Closed S from two edges (A: outer-upper/inner-lower, B: inner-upper/outer-lower). */
export function sFromEdges(A, B, tol = 0.2) {
  const pa = new Path({ segments: A.pts.map((q) => new Point(q.x, q.y)), insert: false });
  const pb = new Path({ segments: B.pts.map((q) => new Point(q.x, q.y)).reverse(), insert: false });
  pa.simplify(tol);
  pb.simplify(tol);
  const out = new Path({ insert: false, closed: true });
  out.addSegments(pa.segments.map((s) => s.clone()));
  out.addSegments(pb.segments.map((s) => s.clone()));
  return out;
}
