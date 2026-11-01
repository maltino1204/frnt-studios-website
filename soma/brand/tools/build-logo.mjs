// Builds every logo asset from the construction modules:
//   assets/logo/concepts/  A, B, C (SVG light + dark, PNG boards with small-size tests)
//   assets/logo/final/     wordmark (display + micro), symbol, lockups; 5 colourways; SVG + PNG @1x/@2x/@3x
//   assets/logo/misuse/    incorrect-usage SVGs + board
// Usage: node brand/tools/build-logo.mjs
import fs from "node:fs";
import path from "node:path";
import { toD, transform, bounds, unite } from "./lib/geo.mjs";
import { svgDoc, write, png, PALETTE } from "./lib/svg.mjs";
import { inkBounds } from "./lib/word.mjs";
import { textPath } from "./lib/text.mjs";
import { shot, closeBrowser } from "./lib/shot.mjs";
import * as A from "./concept-a.mjs";
import * as B from "./concept-b.mjs";
import * as C from "./concept-c.mjs";
import * as F from "./final.mjs";

const ROOT = new URL("../assets/", import.meta.url).pathname;
const LOGO = path.join(ROOT, "logo");
const FONT_SANS = "/tmp/soma-fonts/ttf/InstrumentSans-Medium.ttf";
const FONT_SERIF_I = "/tmp/soma-fonts/ttf/Newsreader-DisplayItalic.ttf";
const COLOURS = { espresso: PALETTE.espresso, bone: PALETTE.bone, oxblood: PALETTE.oxblood, black: "#000000", white: "#FFFFFF" };

// ---------- geometry -> normalised artwork ----------
/** Normalise placed items so the ink starts at x = 0 and the baseline sits at y = 700 (cap line y = 0). */
function art(items) {
  const b = inkBounds(items);
  const placed = items.map((it) => ({ name: it.name, item: transform(it.item, { tx: -b.x }) }));
  return { items: placed, vb: [0, b.y, b.w, b.h] };
}
function artSvg({ items, vb }, { fill, bg, title, desc, id = "wordmark", pad = 0 }) {
  const v = [vb[0] - pad, vb[1] - pad, vb[2] + 2 * pad, vb[3] + 2 * pad];
  return svgDoc({
    viewBox: v,
    title,
    desc,
    bg,
    groups: [{ id, fill, paths: items.map((it) => ({ id: `${id}-${it.name.toLowerCase()}`, d: toD(it.item) })) }],
  });
}
const pixelsFor = (vb, capPx) => Math.round((vb[3] / 700) * capPx);

// ---------- concepts ----------
const CONCEPTS = [
  { key: "A-architectural", title: "SOMA — Konzept A, Architektonisch", mod: A, desc: "Monolinear geometric capitals on a datum: M vertex, A bar and S spine sit on one horizontal at 0.6 H." },
  { key: "B-editorial", title: "SOMA — Konzept B, Editorial", mod: B, desc: "High-contrast serif capitals, vertical stress, hairline serifs, lens-shaped beak terminals." },
  { key: "C-organic", title: "SOMA — Konzept C, Organische Moderne", mod: C, desc: "Serif-less high contrast; the S is the O's two halves shifted against each other (contrapposto)." },
];

async function concepts() {
  const dir = path.join(LOGO, "concepts");
  const cards = [];
  for (const c of CONCEPTS) {
    const w = c.mod.word();
    const a = art(w.items);
    const light = artSvg(a, { fill: PALETTE.espresso, title: c.title, desc: c.desc });
    const dark = artSvg(a, { fill: PALETTE.bone, bg: PALETTE.espresso, title: c.title + " (dunkel)", desc: c.desc, pad: 120 });
    write(path.join(dir, `${c.key}.svg`), light);
    write(path.join(dir, `${c.key}-dark.svg`), dark);
    // small-size tests: real rasters at 16 / 20 / 24 px cap height, light + dark
    const tests = [];
    for (const cap of [16, 20, 24]) {
      for (const [tone, fill, bg] of [["light", PALETTE.espresso, PALETTE.bone], ["dark", PALETTE.bone, PALETTE.espresso]]) {
        const svg = artSvg(a, { fill, bg, title: c.title, pad: 90 });
        const file = path.join(dir, `${c.key}-cap${cap}-${tone}.png`);
        await png(svg, file, { height: pixelsFor([0, 0, 0, a.vb[3] + 180], cap) });
        tests.push({ cap, tone, file });
      }
    }
    cards.push({ ...c, light, dark, tests });
  }
  // boards (one per concept + overview)
  for (const c of cards) {
    const html = board(`<div class="k">${c.title}</div><div class="d">${c.desc}</div>
      <div class="pair"><div class="lt">${c.light}</div><div class="dk">${c.dark}</div></div>
      <div class="k" style="margin-top:28px">Kleingrößen-Test · Versalhöhe 16 / 20 / 24 px (echte Rasterung, 1:1 und 3× vergrößert)</div>
      <div class="tests">${c.tests.map((t) => `<figure><img src="file://${t.file}"><img class="zoom" src="file://${t.file}"><figcaption>${t.cap} px · ${t.tone === "light" ? "hell" : "dunkel"}</figcaption></figure>`).join("")}</div>`);
    await shot(html, path.join(dir, `${c.key}.png`), { width: 1400 });
  }
  const ov = board(`<div class="k">Logo-Exploration · drei Richtungen</div>${cards.map((c) => `<div class="ovr"><div class="k">${c.title}</div><div class="lt">${c.light}</div></div>`).join("")}`);
  await shot(ov, path.join(dir, "concepts-overview.png"), { width: 1400 });
}
function board(inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;padding:48px;background:#F3EFE8;color:#25211F;font:14px/1.4 sans-serif}
  .k{font:600 12px/1.3 sans-serif;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
  .d{font-size:13px;color:#5E554D;margin-bottom:20px;max-width:900px}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}
  .lt{background:#F3EFE8;border:1px solid #D8CFC3;padding:56px 48px;display:flex;align-items:center;justify-content:center}
  .lt svg,.dk svg{width:100%;height:auto;max-height:180px}
  .dk{background:#25211F;padding:0;display:flex;align-items:center;justify-content:center}
  .tests{display:flex;flex-wrap:wrap;gap:16px}
  figure{margin:0;padding:12px;background:#fff;border:1px solid #D8CFC3}
  figure img{display:block;image-rendering:auto;margin-bottom:6px}
  figure img.zoom{image-rendering:pixelated;zoom:3}
  figcaption{font-size:11px;color:#5E554D}
  .ovr{margin:20px 0}.ovr .lt svg{max-height:150px}
  </style></head><body>${inner}</body></html>`;
}

// ---------- final ----------
function finalArt(master = "display") {
  return art(F.word(F.MASTERS[master]).items);
}
export function symbolArt() {
  const S = F.glyphS({ ...F.MASTERS.display, ...F.SYMBOL }, F.SYMBOL_OPTS);
  const b = bounds(S);
  return { items: [{ name: "S", item: transform(S, { tx: -b.x, ty: -b.y }) }], vb: [0, 0, b.w, b.h] };
}
function descriptor(text, capUnits, tracking = 0.08) {
  const size = capUnits / 0.72; // Instrument Sans cap height = 720/1000
  return textPath(FONT_SANS, text, size, { tracking, upper: true });
}
function lockups() {
  const wm = finalArt("display");
  const W = wm.vb[2];
  const out = {};
  // 1. descriptor lockup (centred): wordmark + BEAUTY & WELLNESS, WHEREVER YOU ARE.
  {
    // descriptor set to the wordmark's measure: tracked capitals, cap height solved so both lines share a width
    const probe = descriptor("Beauty & Wellness, wherever you are.", 100, 0.14);
    const cap = (100 * W) / probe.width;
    const t = descriptor("Beauty & Wellness, wherever you are.", cap, 0.14);
    const gap = 250;
    const tx = (W - t.width) / 2;
    const ty = 700 + gap + cap;
    out.descriptor = {
      vb: [Math.min(0, tx), wm.vb[1], Math.max(W, t.width), ty - wm.vb[1] + 4],
      groups: [
        { id: "wordmark", paths: wm.items.map((it) => ({ id: `wordmark-${it.name.toLowerCase()}`, d: toD(it.item) })) },
        { id: "descriptor", transform: `translate(${tx.toFixed(2)} ${ty})`, paths: [{ d: t.d }] },
      ],
    };
  }
  // 2. stacked: symbol above the wordmark, centred
  {
    const sym = symbolArt();
    const sh = 1180, sc = sh / sym.vb[3];
    const sw = sym.vb[2] * sc;
    const gap = 330;
    const sx = (W - sw) / 2;
    const shift = sh + gap; // wordmark moved down
    out.stacked = {
      vb: [0, 0, W, shift + wm.vb[3]],
      groups: [
        { id: "symbol", transform: `translate(${sx.toFixed(2)} 0) scale(${sc.toFixed(5)})`, paths: [{ d: toD(sym.items[0].item) }] },
        { id: "wordmark", transform: `translate(0 ${shift - wm.vb[1]})`, paths: wm.items.map((it) => ({ id: `wordmark-${it.name.toLowerCase()}`, d: toD(it.item) })) },
      ],
    };
    out.stacked.vb = [0, 0, W, shift + wm.vb[3]];
  }
  // 3. tagline lockup: wordmark + "Your body. Your place." (Newsreader Display Italic, outlined)
  {
    const probe = textPath(FONT_SERIF_I, "Your body. Your place.", 100, { tracking: -0.005 });
    const size = (100 * W * 0.72) / probe.width;
    const t = textPath(FONT_SERIF_I, "Your body. Your place.", size, { tracking: -0.005 });
    const gap = 230;
    const tx = (W - t.width) / 2;
    const ty = 700 + gap + size * 0.67;
    out.tagline = {
      vb: [Math.min(0, tx), wm.vb[1], Math.max(W, t.width), ty + size * 0.24 - wm.vb[1]],
      groups: [
        { id: "wordmark", paths: wm.items.map((it) => ({ id: `wordmark-${it.name.toLowerCase()}`, d: toD(it.item) })) },
        { id: "tagline", transform: `translate(${tx.toFixed(2)} ${ty.toFixed(2)})`, paths: [{ d: t.d }] },
      ],
    };
  }
  return out;
}

async function finals() {
  const dir = path.join(LOGO, "final");
  fs.mkdirSync(dir, { recursive: true });
  const jobs = [];
  const masters = { "soma-wordmark": finalArt("display"), "soma-wordmark-micro": finalArt("micro"), "soma-symbol": symbolArt() };
  const titles = { "soma-wordmark": "SOMA", "soma-wordmark-micro": "SOMA (Mikro, unter 32 px Versalhöhe)", "soma-symbol": "SOMA Zeichen" };
  const base1x = { "soma-wordmark": 320, "soma-wordmark-micro": 160, "soma-symbol": 96 };
  for (const [name, a] of Object.entries(masters)) {
    // currentColor master for code
    write(path.join(dir, `${name}.svg`), artSvg(a, { fill: "currentColor", title: titles[name], id: name.includes("symbol") ? "symbol" : "wordmark" }));
    for (const [cn, hex] of Object.entries(COLOURS)) {
      const svg = artSvg(a, { fill: hex, title: titles[name], id: name.includes("symbol") ? "symbol" : "wordmark" });
      write(path.join(dir, `${name}-${cn}.svg`), svg);
      for (const k of [1, 2, 3]) jobs.push(png(svg, path.join(dir, "png", `${name}-${cn}@${k}x.png`), { width: base1x[name] * k }));
    }
  }
  const L = lockups();
  const names = { descriptor: "soma-lockup-descriptor", stacked: "soma-lockup-stacked", tagline: "soma-lockup-tagline" };
  const ltitles = { descriptor: "SOMA · Beauty & Wellness, wherever you are.", stacked: "SOMA Zeichen und Wortmarke", tagline: "SOMA · Your body. Your place." };
  for (const [k, l] of Object.entries(L)) {
    const mk = (fill) => svgDoc({ viewBox: l.vb, title: ltitles[k], groups: l.groups.map((g) => ({ ...g, fill })) });
    write(path.join(dir, `${names[k]}.svg`), mk("currentColor"));
    for (const [cn, hex] of Object.entries(COLOURS)) {
      const svg = mk(hex);
      write(path.join(dir, `${names[k]}-${cn}.svg`), svg);
      for (const s of [1, 2, 3]) jobs.push(png(svg, path.join(dir, "png", `${names[k]}-${cn}@${s}x.png`), { width: (k === "stacked" ? 240 : 400) * s }));
    }
  }
  await Promise.all(jobs);
  return { masters, L };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const what = process.argv[2] ?? "all";
  if (what === "all" || what === "concepts") await concepts();
  if (what === "all" || what === "final") await finals();
  await closeBrowser();
  console.log("logo assets built");
}
export { finals, lockups, finalArt, art, artSvg };
