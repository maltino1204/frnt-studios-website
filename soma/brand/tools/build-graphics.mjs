// Motif (the SOMA arch), iconography (grid + custom icons) and logo misuse examples.
import fs from "node:fs";
import path from "node:path";
import { oval, rect, unite, intersect, subtract, transform, toD, bounds } from "./lib/geo.mjs";
import { write, png, PALETTE, esc } from "./lib/svg.mjs";
import { shot, closeBrowser } from "./lib/shot.mjs";
import { finalArt, artSvg } from "./build-logo.mjs";
import * as F from "./final.mjs";

const A = new URL("../assets/", import.meta.url).pathname;
const { bone: BONE, stone: STONE, espresso: ESP, oxblood: OX, taupe: TAUPE } = PALETTE;
const PAPER = "#FBF9F5", LINEN = "#ECE6DC", OAT = "#E3DBCF";

/* ------------------------------------------------------------------ the arch */
// The wordmark O: rx 332, ry 362 (ratio 1.0904). The arch = its upper half + straight sides.
export const ARCH_RATIO = 362 / 332;
/** Arch path of width w and total height h, top-left at (x, y). */
export function archD(x, y, w, h) {
  const rx = w / 2, ry = Math.min(rx * ARCH_RATIO, h);
  const k = 0.5523, kx = 0.57, ky = 0.585; // same tensions as the O's outer contour
  const cx = x + rx, sy = y + ry;
  const f = (v) => +v.toFixed(2);
  return `M${f(x)} ${f(y + h)}L${f(x)} ${f(sy)}C${f(x)} ${f(sy - ry * ky)} ${f(cx - rx * kx)} ${f(y)} ${f(cx)} ${f(y)}C${f(cx + rx * kx)} ${f(y)} ${f(x + w)} ${f(sy - ry * ky)} ${f(x + w)} ${f(sy)}L${f(x + w)} ${f(y + h)}Z`;
}
const svg = (w, h, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t">\n  <title id="t">${esc(title)}</title>\n${body}</svg>\n`;

async function motif() {
  const dir = path.join(A, "motif");
  // 1. master arch (4:5)
  write(path.join(dir, "soma-arch.svg"), svg(800, 1000, `  <path id="arch" fill="${ESP}" d="${archD(0, 0, 800, 1000)}"/>\n`, "SOMA Bogen (Master, 4:5)"));
  // 2. construction: arch inside the O
  const O = oval({ cx: 332, cy: 350, rx: 332, ry: 362, kx: 0.57, ky: 0.585 });
  write(path.join(dir, "soma-arch-construction.svg"), svg(864, 1080, `  <path id="arch" fill="${OX}" transform="translate(100 112)" d="${archD(0, -12, 664, 880)}"/>
  <g id="construction" fill="none" stroke="${BONE}" stroke-width="2.5" transform="translate(100 112)">
    <path id="o-outer" d="${toD(O)}" stroke-dasharray="10 8"/>
    <path id="axis" d="M332 -60V760M-60 350H724" stroke="${TAUPE}"/>
  </g>
`, "SOMA Bogen: Konstruktion aus der oberen Hälfte des O"));
  // 3. outline (empty slots, illustrations)
  write(path.join(dir, "soma-arch-outline.svg"), svg(800, 1000, `  <path id="arch-outline" fill="none" stroke="${ESP}" stroke-width="2" vector-effect="non-scaling-stroke" d="${archD(1, 1, 798, 999)}"/>\n`, "SOMA Bogen (Kontur)"));
  // 4. Kontrapost pair: two arches offset like the S's two halves
  write(path.join(dir, "soma-arch-pair.svg"), svg(1200, 1000, `  <g id="kontrapost-pair" fill="${STONE}">
    <path id="arch-left" d="${archD(80, 40, 480, 760)}"/>
    <path id="arch-right" d="${archD(640, 200, 480, 760)}"/>
  </g>
`, "SOMA Bogenpaar (Kontrapost-Versatz)"));
  // 5. crop system: 4:5, 3:4, 2:3 arches, 1:1 O-oval portrait
  const crops = [["4:5", 400, 500], ["3:4", 375, 500], ["2:3", 333, 500]];
  let x = 40, body = "";
  for (const [n, w, h] of crops) {
    body += `  <path id="crop-${n.replace(":", "x")}" fill="${STONE}" d="${archD(x, 40, w, h)}"/>\n`;
    x += w + 40;
  }
  body += `  <ellipse id="crop-portrait-o" cx="${x + 166}" cy="${40 + 181}" rx="166" ry="181" fill="${STONE}"/>\n`;
  write(path.join(dir, "soma-arch-crops.svg"), svg(x + 372, 580, body, "SOMA Bildausschnitte: Bogen 4:5, 3:4, 2:3 und O-Porträt"));
  // 6. social frame 1080x1350 (structure only; imagery by the Art Director)
  write(path.join(dir, "soma-arch-social-1080x1350.svg"), svg(1080, 1350, `  <rect id="background" width="1080" height="1350" fill="${BONE}"/>
  <path id="image-slot" fill="${STONE}" d="${archD(140, 150, 800, 1000)}"/>
  <g id="wordmark" fill="${ESP}" transform="translate(436 1220) scale(0.075)">${finalArt("display").items.map((it) => `<path d="${toD(it.item)}"/>`).join("")}</g>
`, "SOMA Social-Rahmen 4:5 mit Bogen"));
  // board
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;padding:48px;background:${BONE};color:${ESP};font:13px/1.45 sans-serif}
  h2{font:600 12px sans-serif;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px}
  .g{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-bottom:36px}
  .c{background:${PAPER};padding:24px;box-shadow:0 0 0 1px rgb(37 33 31/.08)}
  .c img,.c svg{width:100%;height:auto;display:block}
  .cap{font-size:12px;color:#5E554D;margin-top:10px}
  .arch{border-radius:50% 50% 0 0/calc(54.5% * var(--a,.8)) calc(54.5% * var(--a,.8)) 0 0;overflow:hidden;background:${STONE};position:relative}
  </style></head><body>
  <h2>Motiv · Der SOMA-Bogen</h2>
  <div class="g">
    <div class="c"><img src="file://${dir}/soma-arch-construction.svg"><div class="cap">Konstruktion: die obere Hälfte des Wortmarken-O (ry = 1,09 rx), gerade Flanken.</div></div>
    <div class="c"><img src="file://${dir}/soma-arch-pair.svg"><div class="cap">Kontrapost-Versatz: zwei Bögen, links höher, rechts tiefer, wie die zwei Hälften des S.</div></div>
    <div class="c" style="grid-column:span 2"><img src="file://${dir}/soma-arch-crops.svg"><div class="cap">Ausschnitte: 4:5 (Standard), 3:4, 2:3 und das O-Oval für Porträts.</div></div>
  </div>
  <h2>Mit der Fotografie (Fotoset v2, Entwicklungsbilder)</h2>
  <div class="g">
    ${["editorial/arrival-v2.jpg", "editorial/hotel-v2.jpg", "landing/experience-choice.jpg", "editorial/office-v2.jpg"].map((p, i) => `<div><div class="arch" style="aspect-ratio:4/5"><img src="${new URL(`../../public/images/${p}`, import.meta.url).href}" style="width:100%;height:100%;object-fit:cover;display:block"></div><div class="cap">${["Altbau, 2. OG · Hamburg-Eppendorf · 18:40", "Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10", "Hotelzimmer · Frankfurt-Sachsenhausen · 19:30", "Büro, 4. OG · Hamburg-HafenCity · 12:30"][i]}<br><span style="font-size:12px">Entwicklungsbild, KI-generiert</span></div></div>`).join("")}
  </div>
  </body></html>`;
  await shot(html, path.join(A, "previews", "motif-board.png"), { width: 1400 });
}

/* ------------------------------------------------------------------ iconography */
export const ICONS = {
  zuhause: "M4 10.5L12 4L20 10.5L20 20L4 20Z|M10 20L10 16.5C10 15.4 10.9 14.5 12 14.5C13.1 14.5 14 15.4 14 16.5L14 20",
  hotel: "M5.5 20L5.5 4L18.5 4L18.5 20|M3.5 20L20.5 20|M9 8L9.01 8|M12 8L12.01 8|M15 8L15.01 8|M9 12L9.01 12|M12 12L12.01 12|M15 12L15.01 12|M10.5 20L10.5 17.5C10.5 16.67 11.17 16 12 16C12.83 16 13.5 16.67 13.5 17.5L13.5 20",
  buero: "M4 8.5L20 8.5L20 19L4 19Z|M9 8.5L9 6.5C9 5.67 9.67 5 10.5 5L13.5 5C14.33 5 15 5.67 15 6.5L15 8.5|M4 13L10 13|M14 13L20 13|M10 12L14 12L14 14.5L10 14.5Z",
  massage: "M3 9.5L21 9.5L21 12L3 12Z|M6.5 12L6.5 18|M17.5 12L17.5 18|M6.5 15.5L17.5 15.5|M5 9.5L5 8.25C5 7.28 5.78 6.5 6.75 6.5L10.25 6.5C11.22 6.5 12 7.28 12 8.25L12 9.5",
  manikuere: "M8 20L8 8.5C8 6.29 9.79 4.5 12 4.5C14.21 4.5 16 6.29 16 8.5L16 20|M10 10.5L10 9C10 7.9 10.9 7 12 7C13.1 7 14 7.9 14 9L14 10.5Z",
  pedikuere: "M7 4L7 13C7 14.6 6 15.6 5 16.7C4.1 17.7 4.3 20 6.3 20L17.7 20C18.46 19.97 19.1 19.41 19.23 18.66C19.35 17.9 18.92 17.16 18.2 16.9L13.2 15.2C11.9 14.8 11 13.6 11 12.2L11 4",
  kosmetik: "M5 9.5L19 9.5L19 17C19 17.83 18.33 18.5 17.5 18.5L6.5 18.5C5.67 18.5 5 17.83 5 17Z|M6 6L18 6L18 9.5L6 9.5Z|M9 13.5L15 13.5",
  "make-up": "M4 20L12 12|M11.4 12.6C12.3 9.4 15.1 6.3 19.5 4.5C17.7 8.9 14.6 11.7 11.4 12.6Z",
  "haare-styling": "M4 7.5L20 7.5L20 11L4 11Z|M6 11L6 17|M9 11L9 17|M12 11L12 17|M15 11L15 17|M18 11L18 17",
  "brows-lashes": "M3 11.5C6.5 15.7 17.5 15.7 21 11.5|M5.5 14L4.3 16|M9.3 15.6L8.7 17.8|M14.7 15.6L15.3 17.8|M18.5 14L19.7 16|M5 7.5C7.2 5.9 9.6 5.6 12 6.5",
};
/** Production SVG: 24 grid, Lucide-compatible attributes, decorative (no title, no ids), stroke = currentColor. */
function iconSvg(name, d, size = 24) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-icon="soma-${name}">
${d.split("|").map((p) => `  <path d="${p}"/>`).join("\n")}
</svg>
`;
}
export const ICON_LABELS = { zuhause: "Zuhause", hotel: "Hotel", buero: "Büro", massage: "Massage", manikuere: "Maniküre", pedikuere: "Pediküre", kosmetik: "Kosmetik", "make-up": "Make-up", "haare-styling": "Haare & Styling", "brows-lashes": "Brows & Lashes" };
/** React module for the product (copy to src/components/brand/icons.tsx): Lucide-compatible props. */
function reactModule() {
  const pascal = (n) => n.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("").replace("Buero", "Buero");
  const entries = Object.entries(ICONS);
  return `// GENERATED by brand/tools/build-graphics.mjs (icons). SOMA custom icons, 24 px grid, 1.5 px stroke.
// Copy to src/components/brand/icons.tsx. Props mirror lucide-react (size, strokeWidth, absoluteStrokeWidth), so the
// components also work in the existing <Icon icon={...} /> wrapper. Decorative by default; pass a title prop to label it.
import type { SVGProps } from "react";

export type SomaIconName = ${entries.map(([n]) => JSON.stringify(n)).join(" | ")};

export const SOMA_ICON_NODES: Record<SomaIconName, readonly string[]> = {
${entries.map(([n, d]) => `  ${JSON.stringify(n)}: ${JSON.stringify(d.split("|"))},`).join("\n")}
};

export const SOMA_ICON_LABELS: Record<SomaIconName, string> = ${JSON.stringify(ICON_LABELS, null, 2).replace(/\n/g, "\n")};

export type SomaIconProps = Omit<SVGProps<SVGSVGElement>, "children" | "strokeWidth" | "name"> & {
  size?: number;
  strokeWidth?: number;
  /** Keep the stroke at strokeWidth px whatever the size (SOMA default: true) */
  absoluteStrokeWidth?: boolean;
  /** Accessible name; omit for decorative icons next to a visible label */
  title?: string;
};

export function SomaIcon({ name, size = 20, strokeWidth = 1.5, absoluteStrokeWidth = true, title, ...rest }: SomaIconProps & { name: SomaIconName }) {
  const sw = absoluteStrokeWidth ? (strokeWidth * 24) / size : strokeWidth;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {SOMA_ICON_NODES[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

${entries.map(([n]) => `export const Icon${pascal(n)} = (props: SomaIconProps) => <SomaIcon {...props} name=${JSON.stringify(n)} />;`).join("\n")}
`;
}
function lucideNode(name) {
  const f = new URL(`../../node_modules/lucide-react/dist/esm/icons/${name}.mjs`, import.meta.url).pathname;
  const src = fs.readFileSync(f, "utf8");
  const m = src.match(/const __iconData = (\{[\s\S]*?\n\});/);
  return Function(`return ${m[1]}`)().node;
}
function lucideSvg(name, size = 24, sw = 1.5) {
  const node = lucideNode(name);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${(sw * 24) / size}" stroke-linecap="round" stroke-linejoin="round">${node.map(([t, a]) => `<${t} ${Object.entries(a).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ")}/>`).join("")}</svg>`;
}
async function iconography() {
  const dir = path.join(A, "iconography");
  for (const [n, d] of Object.entries(ICONS)) write(path.join(dir, "custom", `${n}.svg`), iconSvg(n, d));
  write(path.join(dir, "soma-icons.json"), JSON.stringify(Object.fromEntries(Object.entries(ICONS).map(([n, d]) => [n, { label: ICON_LABELS[n], paths: d.split("|") }])), null, 2) + "\n");
  write(path.join(dir, "react", "soma-icons.tsx"), reactModule());
  // grid / keylines
  write(path.join(dir, "icon-grid.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="480" height="480" role="img" aria-labelledby="t">
  <title id="t">SOMA Icon-Raster 24 px: 2 px Schutzzone, Keylines, Strich 1,5</title>
  <rect id="canvas" width="24" height="24" fill="${PAPER}"/>
  <g id="pixel-grid" stroke="${OAT}" stroke-width="0.04">${Array.from({ length: 25 }, (_, i) => `<path d="M${i} 0V24M0 ${i}H24"/>`).join("")}</g>
  <rect id="live-area" x="2" y="2" width="20" height="20" fill="none" stroke="${TAUPE}" stroke-width="0.06" stroke-dasharray="0.3 0.3"/>
  <g id="keylines" fill="none" stroke="${OX}" stroke-width="0.06" opacity="0.7">
    <circle cx="12" cy="12" r="10"/><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="4" y="2" width="16" height="20" rx="2"/><rect x="2" y="4" width="20" height="16" rx="2"/>
  </g>
  <g id="example" fill="none" stroke="${ESP}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS.zuhause.split("|").map((p) => `<path d="${p}"/>`).join("")}</g>
</svg>
`);
  // board
  const lucide = ["search", "calendar", "map-pin", "clock", "arrow-right", "check", "x", "star", "user-round", "credit-card", "car", "shield-check"];
  const row = (svgs, size) => svgs.map(([n, s]) => `<figure><div style="width:${size}px;height:${size}px">${s}</div><figcaption>${n}</figcaption></figure>`).join("");
  const custom = Object.entries(ICONS);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;padding:48px;background:${BONE};color:${ESP};font:13px/1.45 sans-serif}
  h2{font:600 12px sans-serif;letter-spacing:.08em;text-transform:uppercase;margin:28px 0 12px}
  .r{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-end}
  figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:64px}
  figcaption{font-size:10.5px;color:#5E554D}
  figure svg{width:100%;height:100%}
  .dark{background:${ESP};color:${BONE};padding:18px;margin-top:10px}.dark figcaption{color:#BFB4A7}
  .grid img{width:240px;height:240px}
  </style></head><body>
  <div style="display:flex;gap:40px;align-items:flex-start">
    <div class="grid"><h2 style="margin-top:0">Raster</h2><img src="file://${dir}/icon-grid.svg"></div>
    <div style="max-width:620px"><h2 style="margin-top:0">Regeln</h2>24-px-Raster, 2 px Schutzzone, Strich 1,5 px absolut (bei 16, 20 und 24 px), runde Enden und Ecken, Eckradius 1,5–2 px, currentColor. Optisch zentriert, nicht geometrisch. Lucide passt mit diesen Einstellungen; eigene Icons nur dort, wo Lucide keine klischeefreie Metapher hat.</div>
  </div>
  <h2>Eigene Icons · 24 px</h2><div class="r">${row(custom.map(([n, d]) => [n, iconSvg(n, d)]), 24)}</div>
  <h2>Eigene Icons · 20 / 16 px</h2><div class="r">${row(custom.map(([n, d]) => [n, iconSvg(n, d).replace('stroke-width="1.5"', 'stroke-width="1.8"')]), 20)}</div><div class="r" style="margin-top:8px">${row(custom.map(([n, d]) => [n, iconSvg(n, d).replace('stroke-width="1.5"', 'stroke-width="2.25"')]), 16)}</div>
  <h2>Lucide mit SOMA-Einstellungen (1,5 px absolut) · 24 / 20 / 16 px</h2><div class="r">${row(lucide.map((n) => [n, lucideSvg(n, 24)]), 24)}</div><div class="r" style="margin-top:8px">${row(lucide.map((n) => [n, lucideSvg(n, 20)]), 20)}</div><div class="r" style="margin-top:8px">${row(lucide.map((n) => [n, lucideSvg(n, 16)]), 16)}</div>
  <div class="dark"><div class="r">${row([...custom.slice(0, 6).map(([n, d]) => [n, iconSvg(n, d)]), ...lucide.slice(0, 6).map((n) => [n, lucideSvg(n, 24)])], 24)}</div></div>
  <h2>Vergrößert 4× (optische Prüfung)</h2><div class="r">${row(custom.map(([n, d]) => [n, iconSvg(n, d)]), 96)}</div>
  </body></html>`;
  await shot(html, path.join(dir, "iconography-board.png"), { width: 1400 });
}

/* ------------------------------------------------------------------ misuse */
async function misuse() {
  const dir = path.join(A, "logo", "misuse");
  const a = finalArt("display");
  const [vx, vy, vw, vh] = a.vb;
  const paths = a.items.map((it) => `<path d="${toD(it.item)}"/>`).join("");
  const W = 1200, H = 600;
  const sc = 900 / vw;
  const place = (extra = "", fill = ESP, t = "") => `<g id="wordmark" fill="${fill}" ${extra} transform="translate(${(W - vw * sc) / 2} ${(H - vh * sc) / 2 - vy * sc}) scale(${sc}) ${t}">${paths}</g>`;
  const frame = (name, title, body, bg = BONE) => {
    write(path.join(dir, `${name}.svg`), svg(W, H, `  <rect id="background" width="${W}" height="${H}" fill="${bg}"/>\n  ${body}\n`, `Falsch: ${title}`));
    return { name, title };
  };
  const sym = F.symbolMark("line").item;
  const sb = bounds(sym);
  const items = [
    frame("01-stretched", "verzerrt (nicht proportional skaliert)", `<g transform="translate(${W / 2} ${H / 2}) scale(1.2 0.78) translate(${-W / 2} ${-H / 2})">${place()}</g>`),
    frame("02-recoloured", "umgefärbt (Farbe außerhalb der Palette, Verlauf)", `<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#E58FB4"/><stop offset="1" stop-color="#F2C46D"/></linearGradient></defs>${place("", "url(#g)")}`),
    frame("03-effects", "mit Effekten (Schatten, Kontur, Glanz)", `<defs><filter id="s" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="14" flood-color="#000" flood-opacity=".45"/></filter></defs>${place(`filter="url(#s)" stroke="${OX}" stroke-width="18"`, "#FFFFFF")}`),
    frame("04-rotated", "gedreht oder schräg gestellt", `<g transform="rotate(-12 ${W / 2} ${H / 2})">${place()}</g>`),
    frame("05-rearranged", "umgebaut (Zeichen in einer Zeile vor der Wortmarke, Buchstaben neu gesperrt)", `<g fill="${ESP}" transform="translate(120 ${H / 2 - 130}) scale(${260 / sb.h})"><path d="${toD(transform(sym, { tx: -sb.x, ty: -sb.y }))}"/></g><g fill="${ESP}" transform="translate(330 ${H / 2 - 52}) scale(0.15)">${a.items.map((it, i) => `<path transform="translate(${i * 260} 0)" d="${toD(it.item)}"/>`).join("")}</g>`),
    frame("06-low-contrast", "zu wenig Kontrast (Taupe auf Stone)", place("", TAUPE), STONE),
    frame("07-outlined", "als Kontur", place(`stroke="${ESP}" stroke-width="10"`, "none")),
    frame("08-busy-background", "auf unruhigem Grund ohne Ruhefläche oder Scrim", `<g id="busy-pattern">${Array.from({ length: 60 }, (_, i) => { const c = [STONE, TAUPE, OX, "#C7BCAF", "#8F5E69", LINEN][i % 6]; const x = (i * 97) % 1200, y = (i * 53) % 600, r = 40 + ((i * 37) % 110); return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity="0.85"/>`; }).join("")}</g>${place("", "#FFFFFF")}`),
  ];
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;padding:48px;background:${BONE};color:${ESP};font:13px/1.45 sans-serif}
  h2{font:600 12px sans-serif;letter-spacing:.08em;text-transform:uppercase;margin:0 0 16px}
  .g{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
  figure{margin:0}figure img{width:100%;display:block;outline:1px solid #D8CFC3}
  figcaption{display:flex;gap:8px;align-items:flex-start;margin-top:8px;font-size:12px}
  .x{flex:none;width:18px;height:18px;border-radius:50%;background:#B3261E;color:#fff;font:700 12px/18px sans-serif;text-align:center}
  </style></head><body><h2>Falsche Verwendung · nie so</h2><div class="g">
  ${items.map((i) => `<figure><img src="file://${dir}/${i.name}.svg"><figcaption><span class="x">✕</span>${i.title}</figcaption></figure>`).join("")}
  </div></body></html>`;
  await shot(html, path.join(dir, "misuse-board.png"), { width: 1400 });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const what = process.argv[2] ?? "all";
  if (what === "all" || what === "motif") await motif();
  if (what === "all" || what === "icons") await iconography();
  if (what === "all" || what === "misuse") await misuse();
  await closeBrowser();
  console.log("graphics built");
}
