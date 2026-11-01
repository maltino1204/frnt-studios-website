// Launch treatment (Brand Audit 1, M3): the "mark draws on" animation as a self-contained animated SVG, a static
// splash master, iOS startup images and the data the product needs. Writes brand/assets/splash/**.
import fs from "node:fs";
import path from "node:path";
import { transform, toD, bounds } from "./lib/geo.mjs";
import { write, png, PALETTE, esc } from "./lib/svg.mjs";
import { shot, closeBrowser } from "./lib/shot.mjs";
import { finalArt, symbolArt } from "./build-logo.mjs";
import * as F from "./final.mjs";

const DIR = new URL("../assets/splash/", import.meta.url).pathname;
const { bone: BONE, oxblood: OX, espresso: ESP } = PALETTE;

/** Mark geometry in a 664 x 724 box (the O's bounds), as fill and contour paths. */
function markParts() {
  const m = F.symbolMark("line");
  const b = bounds(m.o);
  const n = (g) => transform(g, { tx: -b.x, ty: -b.y });
  return { o: toD(n(m.o)), s: toD(n(m.s)), w: b.w, h: b.h };
}
/**
 * Timeline (1.2 s, MOTION.md § 3.6.2 with the new mark):
 *   0–640 ms    the O's contours draw (stroke-dashoffset 1 → 0, ease-arrive)
 *   320–960 ms  the S's contour traces inside the O
 *   480–700 ms  the O fills (opacity, 220 ms)
 *   900–1120 ms the S fills; 1000–1200 ms the contours fade out. The mark rests; nothing loops.
 * Reduced motion: the final frame, no animation. The static state of every element IS the final frame.
 */
export function drawOnSvg({ fg = OX, bg = null, size = 664, title = "SOMA" } = {}) {
  const p = markParts();
  const sw = 5;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-sw} ${-sw} ${p.w + 2 * sw} ${p.h + 2 * sw}" width="${size}" height="${Math.round((size * (p.h + 2 * sw)) / (p.w + 2 * sw))}" role="img" aria-labelledby="t">
  <title id="t">${esc(title)}</title>
  <style>
    .soma-fill { fill: ${fg}; }
    .soma-line { fill: none; stroke: ${fg}; stroke-width: ${sw}; stroke-linejoin: round; opacity: 0; }
    @media (prefers-reduced-motion: no-preference) {
      .soma-line { stroke-dasharray: 1; animation: soma-draw 640ms cubic-bezier(0.16, 1, 0.3, 1) both, soma-out 200ms cubic-bezier(0.4, 0, 1, 1) 1000ms forwards; }
      #soma-s-line { animation-delay: 320ms, 1000ms; }
      #soma-o-fill { animation: soma-in 220ms cubic-bezier(0.2, 0, 0, 1) 480ms both; }
      #soma-s-fill { animation: soma-in 220ms cubic-bezier(0.2, 0, 0, 1) 900ms both; }
    }
    @keyframes soma-draw { from { stroke-dashoffset: 1; opacity: 1; } to { stroke-dashoffset: 0; opacity: 1; } }
    @keyframes soma-out { from { opacity: 1; } to { opacity: 0; } }
    @keyframes soma-in { from { opacity: 0; } to { opacity: 1; } }
  </style>
${bg ? `  <rect id="background" x="${-sw}" y="${-sw}" width="${p.w + 2 * sw}" height="${p.h + 2 * sw}" fill="${bg}"/>\n` : ""}  <g id="symbol">
    <path id="soma-o-fill" class="soma-fill" d="${p.o}"/>
    <path id="soma-s-fill" class="soma-fill" d="${p.s}"/>
    <path id="soma-o-line" class="soma-line" pathLength="1" d="${p.o}"/>
    <path id="soma-s-line" class="soma-line" pathLength="1" d="${p.s}"/>
  </g>
</svg>
`;
}

/** Static splash: Bone ground (= manifest background_color), the stacked lockup in Oxblood, optically centred. */
function splashSvg(W, H) {
  const sym = symbolArt("line");
  const wm = finalArt("micro");
  const markH = Math.min(W, H) * 0.2;
  const sc = markH / sym.vb[3];
  const mw = sym.vb[2] * sc;
  const wmW = mw * 1.9, wsc = wmW / wm.vb[2];
  const gap = markH * 0.34;
  const totalH = markH + gap + wm.vb[3] * wsc;
  const top = H * 0.47 - totalH / 2;
  const symPaths = sym.items.map((it) => `<path id="symbol-${it.name.toLowerCase()}" d="${toD(it.item)}"/>`).join("");
  const wmPaths = wm.items.map((it) => `<path id="wordmark-${it.name.toLowerCase()}" d="${toD(it.item)}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">
  <title id="t">SOMA</title>
  <rect id="background" width="${W}" height="${H}" fill="${BONE}"/>
  <g id="symbol" fill="${OX}" transform="translate(${((W - mw) / 2).toFixed(2)} ${top.toFixed(2)}) scale(${sc.toFixed(5)})">${symPaths}</g>
  <g id="wordmark" fill="${OX}" transform="translate(${((W - wmW) / 2).toFixed(2)} ${(top + markH + gap - wm.vb[1] * wsc).toFixed(2)}) scale(${wsc.toFixed(5)})">${wmPaths}</g>
</svg>
`;
}
const STARTUP = [
  [1290, 2796], [1179, 2556], [1284, 2778], [1170, 2532], [1125, 2436], [828, 1792], [750, 1334], [2048, 2732], [1668, 2388], [1640, 2360],
];

async function main() {
  fs.mkdirSync(DIR, { recursive: true });
  write(path.join(DIR, "soma-mark-draw.svg"), drawOnSvg({ title: "SOMA: das Zeichen zeichnet sich" }));
  write(path.join(DIR, "soma-mark-draw-bone.svg"), drawOnSvg({ fg: BONE, title: "SOMA: das Zeichen zeichnet sich (hell)" }));
  write(path.join(DIR, "soma-splash.svg"), splashSvg(1179, 2556));
  for (const [w, h] of STARTUP) await png(splashSvg(w, h), path.join(DIR, "ios", `apple-splash-${w}x${h}.png`), { width: w, height: h, background: BONE });
  const p = markParts();
  fs.writeFileSync(path.join(DIR, "soma-mark-draw.json"), JSON.stringify({ viewBox: [0, 0, +p.w.toFixed(2), +p.h.toFixed(2)], o: p.o, s: p.s, timeline: { totalMs: 1200, oLine: [0, 640], sLine: [320, 960], oFill: [480, 700], sFill: [900, 1120], linesOut: [1000, 1200] } }, null, 1) + "\n");
  // storyboard: frames 0..1200 ms captured from the animated SVG
  const frames = [0, 160, 320, 480, 640, 800, 960, 1200];
  const svg = fs.readFileSync(path.join(DIR, "soma-mark-draw.svg"), "utf8");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:40px;background:${BONE};font:12px sans-serif;color:#5E554D}
  .r{display:grid;grid-template-columns:repeat(${frames.length},1fr);gap:12px}.c{background:#FBF9F5;padding:16px;box-shadow:0 0 0 1px rgb(37 33 31/.08)}.c svg{width:100%;height:auto;display:block}</style></head><body>
  <div class="r">${frames.map((t) => `<div><div class="c" data-t="${t}">${svg}</div><div style="margin-top:6px">${t} ms</div></div>`).join("")}</div>
  <script>for (const c of document.querySelectorAll('[data-t]')) { const t = +c.dataset.t; for (const a of c.getAnimations({ subtree: true })) { a.pause(); a.currentTime = t; } }</script></body></html>`;
  await shot(html, path.join(DIR, "soma-mark-draw-storyboard.png"), { width: 1500 });
  await closeBrowser();
  console.log("splash built");
}
main();
