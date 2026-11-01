// Presentation boards: final logo system, construction + clear space, symbol studies, colour, type scale.
import fs from "node:fs";
import path from "node:path";
import { oval, rect, subtract, intersect, unite, transform, toD, bounds } from "./lib/geo.mjs";
import { write, PALETTE, esc, svgDoc } from "./lib/svg.mjs";
import { shot, closeBrowser } from "./lib/shot.mjs";
import { finalArt, artSvg, symbolArt, lockups } from "./build-logo.mjs";
import * as F from "./final.mjs";
import * as T from "./tokens-source.mjs";
import { fluid } from "./build-tokens.mjs";
import { fontFaces } from "./lib/shot.mjs";

const A = new URL("../assets/", import.meta.url).pathname;
const FIN = path.join(A, "logo", "final");
const { bone: BONE, stone: STONE, espresso: ESP, oxblood: OX, taupe: TAUPE } = PALETTE;
const css = `body{margin:0;padding:48px;background:${BONE};color:${ESP};font:13px/1.45 "Instrument Sans",sans-serif}
h1{font:400 34px/1.1 Newsreader;margin:0 0 6px}h2{font:600 11px/1.3 "Instrument Sans";letter-spacing:.1em;text-transform:uppercase;margin:32px 0 12px;color:#5E554D}
.g{display:grid;gap:20px}.c{padding:40px;display:flex;align-items:center;justify-content:center;min-height:120px}
.c img{max-width:100%;max-height:140px}.cap{font-size:12px;color:#5E554D;margin-top:8px}`;

/** Construction and clear space diagram (SVG master). */
function construction() {
  const a = finalArt("display");
  const [vx, vy, vw, vh] = a.vb;
  const x = 100; // unit = stem V = 1/7 cap height
  const pad = 3 * x;
  const W = vw + 2 * pad + 400, H = vh + 2 * pad + 300;
  const ox = pad + 200, oy = pad + 150 - vy;
  const items = a.items.map((it) => `<path id="wordmark-${it.name.toLowerCase()}" d="${toD(it.item)}"/>`).join("");
  const guides = [0, 350, 700].map((y) => `<path d="M${ox - pad - 120} ${oy + y}H${ox + vw + pad + 120}"/>`).join("");
  const body = `  <rect id="background" width="${W}" height="${H}" fill="${BONE}"/>
  <rect id="clear-space" x="${ox - pad}" y="${oy + vy - pad}" width="${vw + 2 * pad}" height="${vh + 2 * pad}" fill="none" stroke="${OX}" stroke-width="4" stroke-dasharray="18 12"/>
  <g id="guides" stroke="${TAUPE}" stroke-width="3">${guides}</g>
  <g id="wordmark" fill="${ESP}" transform="translate(${ox} ${oy})">${items}</g>
  <g id="unit" fill="${OX}" fill-opacity="0.18" stroke="${OX}" stroke-width="3">
    <rect x="${ox - pad}" y="${oy + 250}" width="${x}" height="${x}"/><rect x="${ox - pad + x}" y="${oy + 250}" width="${x}" height="${x}"/><rect x="${ox - pad + 2 * x}" y="${oy + 250}" width="${x}" height="${x}"/>
    <rect x="${ox + vw}" y="${oy + 250}" width="${x}" height="${x}"/><rect x="${ox + vw + x}" y="${oy + 250}" width="${x}" height="${x}"/><rect x="${ox + vw + 2 * x}" y="${oy + 250}" width="${x}" height="${x}"/>
    <rect x="${ox + vw / 2 - x / 2}" y="${oy + vy - pad}" width="${x}" height="${x}"/><rect x="${ox + vw / 2 - x / 2}" y="${oy + vy - pad + x}" width="${x}" height="${x}"/><rect x="${ox + vw / 2 - x / 2}" y="${oy + vy - pad + 2 * x}" width="${x}" height="${x}"/>
  </g>`;
  write(path.join(FIN, "soma-construction-clearspace.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W / 4}" height="${H / 4}" role="img" aria-labelledby="t">\n  <title id="t">SOMA Wortmarke: Schutzraum 3x (x = Grundstrich = 1/7 Versalhöhe), Linien: Versal-, Mittel- und Grundlinie</title>\n${body}\n</svg>\n`);
  return { vw, vh };
}

async function finalBoard() {
  const dim = construction();
  const L = lockups();
  const descCap = (() => {
    const g = L.descriptor.groups[1];
    return null;
  })();
  const f = (n) => `file://${FIN}/${n}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces(["newsreader", "instrumentsans"])}${css}</style></head><body>
  <h1>SOMA Logo-System · v1.1</h1><div class="cap">Wortmarke (Display- und Mikro-Master), Zeichen (S im O; Siegel unter 32 px), Lockups. Alle Formen sind eigene Pfade; Schriften nur für Deskriptor und Tagline, in Pfade umgewandelt.</div>
  <h2>Primäre Wortmarke · hell / dunkel / Oxblood</h2>
  <div class="g" style="grid-template-columns:1fr 1fr 1fr">
    <div class="c" style="background:${BONE};outline:1px solid ${STONE}"><img src="${f("soma-wordmark-espresso.svg")}" style="width:88%"></div>
    <div class="c" style="background:${ESP}"><img src="${f("soma-wordmark-bone.svg")}" style="width:88%"></div>
    <div class="c" style="background:${OX}"><img src="${f("soma-wordmark-bone.svg")}" style="width:88%"></div>
  </div>
  <h2>Monochrom · Schwarz / Weiß / Oxblood auf Bone</h2>
  <div class="g" style="grid-template-columns:1fr 1fr 1fr">
    <div class="c" style="background:#fff;outline:1px solid ${STONE}"><img src="${f("soma-wordmark-black.svg")}" style="width:80%"></div>
    <div class="c" style="background:#000"><img src="${f("soma-wordmark-white.svg")}" style="width:80%"></div>
    <div class="c" style="background:${BONE};outline:1px solid ${STONE}"><img src="${f("soma-wordmark-oxblood.svg")}" style="width:80%"></div>
  </div>
  <h2>Sekundäre Lockups · Deskriptor, Tagline, Zeichen + Wortmarke</h2>
  <div class="g" style="grid-template-columns:1.2fr 1.2fr .8fr">
    <div class="c" style="background:${BONE};outline:1px solid ${STONE};min-height:200px"><img src="${f("soma-lockup-descriptor-espresso.svg")}" style="width:80%;max-height:none"></div>
    <div class="c" style="background:${ESP};min-height:200px"><img src="${f("soma-lockup-tagline-bone.svg")}" style="width:80%;max-height:none"></div>
    <div class="c" style="background:${OX};min-height:200px"><img src="${f("soma-lockup-stacked-bone.svg")}" style="height:170px;max-height:none"></div>
  </div>
  <h2>Zeichen · das S im O · Siegel-Schnitt · App-Icon · Favicon</h2>
  <div class="g" style="grid-template-columns:repeat(5,1fr)">
    <div class="c" style="background:${BONE};outline:1px solid ${STONE}"><img src="${f("soma-symbol-espresso.svg")}" style="height:110px"></div>
    <div class="c" style="background:${ESP}"><img src="${f("soma-symbol-bone.svg")}" style="height:110px"></div>
    <div class="c" style="background:${BONE};outline:1px solid ${STONE};gap:16px;align-items:flex-end"><img src="${f("soma-symbol-solid-espresso.svg")}" style="height:32px"><img src="${f("soma-symbol-solid-espresso.svg")}" style="height:24px"><img src="${f("soma-symbol-solid-espresso.svg")}" style="height:16px"></div>
    <div class="c" style="background:${BONE};outline:1px solid ${STONE}"><img src="file://${A}icons/ios/AppIcon-1024.png" style="height:120px;border-radius:27px"></div>
    <div class="c" style="background:#202124;gap:14px"><img src="file://${A}icons/favicon-32.png" style="height:32px;image-rendering:auto"><img src="file://${A}icons/favicon-16.png" style="height:16px"></div>
  </div>
  <h2>Konstruktion und Schutzraum · Kleinste Größen</h2>
  <div class="g" style="grid-template-columns:1.4fr 1fr">
    <div class="c" style="background:#fff;outline:1px solid ${STONE};padding:12px"><img src="${f("soma-construction-clearspace.svg")}" style="width:100%;max-height:none"></div>
    <div style="padding:8px 0">
      <div class="cap" style="font-size:13px;color:${ESP}">x = Grundstrich der Wortmarke = 1/7 der Versalhöhe. Schutzraum ringsum 3x. Linien: Versalhöhe, optische Mitte, Grundlinie; O, S und die Spitzen von M und A überschießen.</div>
      <div style="display:flex;gap:18px;align-items:flex-end;margin-top:20px">
        ${[32, 24, 20, 16].map((cap) => `<div><img src="${f(cap < 32 ? "soma-wordmark-micro-espresso.svg" : "soma-wordmark-espresso.svg")}" style="height:${Math.round((cap * dim.vh) / 700)}px;max-height:none"><div class="cap">${cap} px Versal${cap < 32 ? " · Mikro" : ""}</div></div>`).join("")}
      </div>
    </div>
  </div>
  </body></html>`;
  await shot(html, path.join(A, "previews", "logo-system-board.png"), { width: 1400 });
  await shot(html.replace(/(<h2>Konstruktion[\s\S]*?)<\/body>/, "</body>"), path.join(FIN, "soma-logo-system.png"), { width: 1400 });
}

/** Symbol studies (exploration evidence). */
async function symbolStudies() {
  const S = F.glyphS({ ...F.MASTERS.display, ...F.SYMBOL }, F.SYMBOL_OPTS);
  const studies = [];
  // 1 shifted O
  {
    const ring = subtract(oval({ cx: 332, cy: 350, rx: 332, ry: 362, kx: 0.57, ky: 0.585 }), oval({ cx: 332, cy: 350, rx: 212, ry: 318, kx: 0.6, ky: 0.54 }));
    const L = transform(intersect(ring, rect(-10, -100, 342, 1000)), { ty: -80 });
    const R = transform(intersect(ring, rect(332, -100, 800, 1000)), { ty: 80 });
    studies.push(["Verschobenes O", "Das O in zwei Hälften, gegeneinander versetzt. Zu sehr Klammer „( )“, liest nicht als S.", unite(L, R)]);
  }
  // 2 two lunes
  {
    const R = 180, rx = 170, th = 0.3;
    const up = subtract(oval({ cx: 0, cy: -R, rx, ry: R }), oval({ cx: rx * th, cy: -R, rx: rx * (1 - th * 0.55), ry: R * 0.93 }));
    const lo = subtract(oval({ cx: 0, cy: R, rx, ry: R }), oval({ cx: -rx * th, cy: R, rx: rx * (1 - th * 0.55), ry: R * 0.93 }));
    studies.push(["Zwei Sicheln", "Abstrakt, aber nah am griechischen Schluss-Sigma ς: verworfen (Strategie: keine griechischen Zeichen).", unite(intersect(up, rect(-400, -800, 434, 800)), intersect(lo, rect(-34, 0, 800, 800)))]);
  }
  // 3 seal
  {
    const b = bounds(S);
    const O = oval({ cx: 0, cy: 0, rx: 332, ry: 362, kx: 0.57, ky: 0.585 });
    const s = transform(transform(S, { tx: -b.x - b.w / 2, ty: -b.y - b.h / 2 }), { sx: (724 * 0.6) / b.h });
    studies.push(["Siegel: S im O", "„Körper im Ort“. Stark, aber als Oval im quadratischen App-Icon ein Abzeichen im Abzeichen.", subtract(O, s)]);
  }
  studies.push(["Gewählt: das S", "Die zwei Hälften des O im Kontrapost, für kleine Größen kräftiger gezeichnet. Klar bei 16 px, eigen in jeder Größe.", S]);
  const cells = studies.map(([t, d, g]) => {
    const b = bounds(g);
    const pad = Math.max(b.w, b.h) * 0.18;
    const svg = svgDoc({ viewBox: [b.x - pad, b.y - pad, b.w + 2 * pad, b.h + 2 * pad], title: t, groups: [{ id: "m", fill: ESP, paths: [{ d: toD(g) }] }] });
    return `<div><div class="c" style="background:#FBF9F5;outline:1px solid ${STONE};height:220px">${svg.replace(/width="[^"]+" height="[^"]+"/, 'style="height:180px;width:auto"')}</div><div style="font-weight:600;margin-top:10px">${t}</div><div class="cap">${d}</div></div>`;
  });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces(["newsreader", "instrumentsans"])}${css}</style></head><body><h1>Zeichen-Studien</h1><div class="cap">Abstraktes S, abstrahierte Buchstabenform, Negativraum: vier Wege, einer gewählt.</div><h2>Studien</h2><div class="g" style="grid-template-columns:repeat(4,1fr)">${cells.join("")}</div></body></html>`;
  await shot(html, path.join(A, "logo", "concepts", "symbol-studies.png"), { width: 1400 });
}

/** Colour board with WCAG values. */
async function colourBoard() {
  const rows = JSON.parse(fs.readFileSync(new URL("../DESIGN_TOKENS/contrast.json", import.meta.url), "utf8"));
  const sw = (name, hex, fg, note) => `<div style="background:${hex};color:${fg};padding:16px;min-height:96px;display:flex;flex-direction:column;justify-content:space-between;outline:1px solid rgb(37 33 31/.08)"><div style="font-weight:600">${name}</div><div style="font-size:11px">${hex}${note ? `<br>${note}` : ""}</div></div>`;
  const P = T.P;
  const ramp = ["paper", "bone", "linen", "oat", "stone", "stone-deep", "taupe", "taupe-deep", "umber", "umber-deep", "cocoa", "espresso"];
  const ox = ["oxblood-50", "oxblood-100", "oxblood-200", "oxblood-300", "oxblood-400", "oxblood-500", "oxblood", "oxblood-700", "oxblood-800", "oxblood-900"];
  const { contrast } = await import("./lib/contrast.mjs");
  const lab = (h) => `${contrast(h, P.bone).toFixed(1)}:1 auf Bone`;
  const fgFor = (h) => (contrast(h, "#25211F") > contrast(h, "#F3EFE8") ? "#25211F" : "#F3EFE8");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces(["newsreader", "instrumentsans"])}${css} .r{display:grid;gap:0}</style></head><body>
  <h1>Farbe</h1><div class="cap">Bone und Espresso tragen das Interface. Oxblood ist die Signatur: ein Moment pro Screen.</div>
  <h2>Markenfarben</h2><div class="r" style="grid-template-columns:2fr 1fr 1fr 1.4fr 2fr">${sw("Bone", P.bone, ESP, "Seite")}${sw("Stone", P.stone, ESP, "Fläche 2")}${sw("Taupe", P.taupe, ESP, "nur dekorativ")}${sw("Oxblood", P.oxblood, BONE, "Signatur")}${sw("Espresso", P.espresso, BONE, "Text, dunkle Fläche")}</div>
  <h2>Warme Neutrale · Tonleiter</h2><div class="r" style="grid-template-columns:repeat(12,1fr)">${ramp.map((k) => sw(k, P[k], fgFor(P[k]), lab(P[k]))).join("")}</div>
  <h2>Oxblood · Tonleiter</h2><div class="r" style="grid-template-columns:repeat(10,1fr)">${ox.map((k) => sw(k.replace("oxblood-", ""), P[k], fgFor(P[k]), lab(P[k]))).join("")}</div>
  <h2>Funktionsfarben · immer mit Icon und Wort</h2><div class="g" style="grid-template-columns:repeat(4,1fr)">${Object.entries(T.feedback).map(([k, f]) => `<div style="background:${P[f.bg]};color:${P[f.fg]};padding:14px 16px;border-radius:12px;box-shadow:inset 0 0 0 1px ${P[f.border]}"><b>${f.word}</b> · ${k}<div style="font-size:11px;margin-top:6px">${P[f.fg]} auf ${P[f.bg]} · ${contrast(P[f.fg], P[f.bg]).toFixed(2)}:1</div></div>`).join("")}</div>
  <h2>Kontrast (Auszug)</h2><table style="border-collapse:collapse;font-size:12px;width:100%">${rows.filter((r) => ["Text", "UI"].includes(r.group)).slice(0, 26).map((r) => `<tr style="border-top:1px solid ${STONE}"><td style="padding:5px 8px;width:22px"><span style="display:inline-block;width:16px;height:16px;background:${r.fgHex};outline:1px solid rgb(0 0 0/.1)"></span></td><td>${r.fg}</td><td>${r.bg}</td><td style="text-align:right;font-variant-numeric:tabular-nums">${r.ratio.toFixed(2)}:1</td><td style="padding-left:12px">${r.pass ? "erfüllt" : "<b>nein</b>"} (${r.need}:1)</td><td style="color:#5E554D">${r.note}</td></tr>`).join("")}</table>
  </body></html>`;
  await shot(html, path.join(A, "colour", "colour-system.png"), { width: 1400 });
}

/** Type scale board. */
async function typeScale() {
  const fam = { display: "Newsreader", sans: "Instrument Sans" };
  const sample = { display: "Du bleibst. <i>Dein Profi kommt.</i>", sans: "Gesichtsbehandlung bei dir" };
  const rowsFor = (vw) => Object.entries(T.type).map(([k, [min, max, lh, tr, w, f, note]]) => {
    const px = min + ((max - min) * (vw - 360)) / 1080;
    const txt = k === "numeric" ? "1.284,50 €" : k === "eyebrow" ? "Hotelsuite · 21:10" : k.startsWith("display") || k === "h1" || k === "h2" ? sample.display : k === "button" ? "Zahlungspflichtig buchen · 84 €" : k === "control" ? "Straße, Hausnummer" : sample.sans;
    return `<tr style="border-top:1px solid ${STONE};vertical-align:baseline"><td style="padding:10px 16px 10px 0;width:120px;font-size:11px;color:#5E554D">${k}<br>${min}→${max} px<br>${w} · ${lh} · ${tr}em</td><td style="padding:10px 0;font-family:'${fam[f]}';font-size:${px.toFixed(1)}px;line-height:${lh};letter-spacing:${tr}em;font-weight:${w};${f === "display" ? "font-variation-settings:'opsz' 72;" : ""}${k === "eyebrow" ? "text-transform:uppercase;" : ""}${k === "numeric" ? "font-variant-numeric:tabular-nums;" : ""}white-space:nowrap;overflow:hidden;text-overflow:clip;max-width:1100px">${txt}</td></tr>`;
  }).join("");
  for (const vw of [1440, 360]) {
    const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${fontFaces(["newsreader", "instrumentsans"])}${css}</style></head><body><h1>Typo-Skala bei ${vw} px Viewport</h1><div class="cap">Fluid zwischen 360 und 1440 px (clamp). Display/H1/H2: Newsreader Display (opsz 72). Alles andere: Instrument Sans.</div><table style="border-collapse:collapse;width:100%;margin-top:16px">${rowsFor(vw)}</table></body></html>`;
    await shot(html, path.join(A, "typography", `type-scale-${vw}.png`), { width: vw === 360 ? 900 : 1400 });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await finalBoard();
  await symbolStudies();
  await colourBoard();
  await typeScale();
  await closeBrowser();
  console.log("boards built");
}
