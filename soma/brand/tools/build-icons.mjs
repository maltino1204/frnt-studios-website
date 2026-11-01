// App icons and favicons from the symbol master. Writes brand/assets/icons/**.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { toD, transform, bounds } from "./lib/geo.mjs";
import { write, png, PALETTE, esc } from "./lib/svg.mjs";
import { shot, closeBrowser } from "./lib/shot.mjs";
import * as F from "./final.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

const DIR = new URL("../assets/icons/", import.meta.url).pathname;
const OX = PALETTE.oxblood, BONE = PALETTE.bone, ESP = PALETTE.espresso;

/** The mark, centred on (0, 0): line cut (O ring + S) or solid cut (oval with the S set in). */
function markPaths(cut) {
  const m = F.symbolMark(cut);
  return cut === "line" ? { o: m.o, s: m.s, h: 2 * F.MARK.ry } : { seal: m.seal, s: m.s, h: 2 * F.MARK.ry };
}
/**
 * Square icon SVG. frac = height of the O as a fraction of the tile. cut "line" for app icons (>= 32 px),
 * "solid" for favicons. rim: a Bone hairline around the oval so the seal keeps its edge on dark browser chrome.
 */
function iconSvg({ size = 1024, bg = OX, fg = BONE, frac = 0.62, radius = 0, cut = "line", sealFill = OX, rim = null, title = "SOMA" }) {
  const m = markPaths(cut);
  const sc = (size * frac) / m.h;
  const t = (g) => transform(g, { sx: sc, tx: size / 2, ty: size / 2 });
  const bgEl = bg ? `  <rect id="background" width="${size}" height="${size}"${radius ? ` rx="${radius}"` : ""} fill="${bg}"/>\n` : "";
  let body = "";
  if (cut === "line") {
    body = `  <g id="symbol" fill="${fg}">\n    <path id="symbol-o" d="${toD(t(m.o))}"/>\n    <path id="symbol-s" d="${toD(t(m.s))}"/>\n  </g>\n`;
  } else {
    const rx = F.MARK.rx * sc, ry = F.MARK.ry * sc;
    if (rim) body += `  <ellipse id="rim" cx="${size / 2}" cy="${size / 2}" rx="${+(rx + rim.w).toFixed(2)}" ry="${+(ry + rim.w).toFixed(2)}" fill="${rim.c}"/>\n`;
    body += `  <path id="seal" fill="${sealFill}" d="${toD(t(m.seal))}"/>\n  <path id="symbol-s" fill="${fg}" d="${toD(t(m.s))}"/>\n`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-labelledby="t">
  <title id="t">${esc(title)}</title>
${bgEl}${body}</svg>
`;
}
async function out(svg, file, px) {
  // App-store and home-screen icons must be opaque: flatten onto the tile colour (no alpha channel).
  const opaque = /^ios\/|apple-touch|play-store|ic_launcher_background/.test(file);
  return png(svg, path.join(DIR, file), { width: px, height: px, ...(opaque ? { background: file.includes("tinted") ? "#000000" : file.includes("dark") ? ESP : OX } : {}) });
}

async function ios() {
  const master = iconSvg({ frac: 0.62 });
  write(path.join(DIR, "ios/AppIcon.svg"), master);
  await out(master, "ios/AppIcon-1024.png", 1024);
  // iOS 18 appearances
  const dark = iconSvg({ bg: ESP, fg: "#E9DCCF", frac: 0.62, title: "SOMA (dunkel)" });
  write(path.join(DIR, "ios/AppIcon-dark.svg"), dark);
  await out(dark, "ios/AppIcon-1024-dark.png", 1024);
  const tinted = iconSvg({ bg: "#000000", fg: "#FFFFFF", frac: 0.62, title: "SOMA (getönt)" });
  await out(tinted, "ios/AppIcon-1024-tinted.png", 1024);
  for (const px of [180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20]) {
    const svg = iconSvg({ frac: px <= 40 ? 0.66 : 0.62 });
    await out(svg, `ios/AppIcon-${px}.png`, px);
  }
}
async function android() {
  // adaptive: 108dp canvas; the foreground S stays inside the 66dp safe circle
  const fg = iconSvg({ size: 432, bg: null, frac: 0.5, title: "SOMA Vordergrund" });
  const bgOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 432 432" width="432" height="432"><title>SOMA Hintergrund</title><rect id="background" width="432" height="432" fill="${OX}"/></svg>\n`;
  const mono = iconSvg({ size: 432, bg: null, fg: "#FFFFFF", frac: 0.5, title: "SOMA monochrom" });
  write(path.join(DIR, "android/ic_launcher_foreground.svg"), fg);
  write(path.join(DIR, "android/ic_launcher_background.svg"), bgOnly);
  write(path.join(DIR, "android/ic_launcher_monochrome.svg"), mono);
  const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(dens)) {
    await out(fg, `android/mipmap-${d}/ic_launcher_foreground.png`, 108 * k);
    await out(bgOnly, `android/mipmap-${d}/ic_launcher_background.png`, 108 * k);
    await out(mono, `android/mipmap-${d}/ic_launcher_monochrome.png`, 108 * k);
    // legacy (pre-API 26): rounded square and round
    await out(iconSvg({ size: 192, frac: 0.64, radius: 34 }), `android/mipmap-${d}/ic_launcher.png`, 48 * k);
    await out(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192"><circle cx="96" cy="96" r="96" fill="${OX}"/>${iconSvg({ size: 192, bg: null, frac: 0.62 }).replace(/^[\s\S]*?(<g id="symbol"[\s\S]*?<\/g>)[\s\S]*$/, "$1")}</svg>`, `android/mipmap-${d}/ic_launcher_round.png`, 48 * k);
  }
  write(path.join(DIR, "android/mipmap-anydpi-v26/ic_launcher.xml"), `<?xml version="1.0" encoding="utf-8"?>
<!-- SOMA adaptive icon: Oxblood background, Bone S foreground, monochrome layer for themed icons (API 33+). -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
`);
  await out(iconSvg({ size: 512, frac: 0.62 }), "android/play-store-512.png", 512);
}
async function pwa() {
  const any = iconSvg({ size: 512, frac: 0.64, radius: 112 });
  const mask = iconSvg({ size: 512, frac: 0.56 }); // full bleed, the mark inside the 80 % safe circle
  write(path.join(DIR, "pwa/icon.svg"), any);
  write(path.join(DIR, "pwa/icon-maskable.svg"), mask);
  await out(any, "pwa/icon-192.png", 192);
  await out(any, "pwa/icon-512.png", 512);
  await out(mask, "pwa/icon-maskable-192.png", 192);
  await out(mask, "pwa/icon-maskable-512.png", 512);
}
/**
 * Favicon: the solid cut (the seal) in Oxblood with a Bone S, no tile. A 1 px Bone rim (at 16 px) keeps the edge on
 * dark browser chrome (#202124: 13.6:1, #35363A: 10.6:1) and disappears into light tab bars.
 */
const favicon = (title = "SOMA") => iconSvg({ size: 32, bg: null, cut: "solid", frac: 0.875, rim: { w: 1.6, c: BONE }, title });
async function favicons() {
  const fav = favicon();
  write(path.join(DIR, "favicon.svg"), fav);
  const bufs = [];
  for (const px of [16, 32, 48]) {
    const file = await out(fav, `favicon-${px}.png`, px);
    bufs.push({ px, buf: fs.readFileSync(file) });
  }
  fs.writeFileSync(path.join(DIR, "favicon.ico"), ico(bufs));
  await out(iconSvg({ size: 180, frac: 0.62 }), "apple-touch-icon.png", 180);
}
/** ICO container with PNG payloads (Vista+). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  images.forEach(({ px, buf }, i) => {
    const o = i * 16;
    dir.writeUInt8(px >= 256 ? 0 : px, o);
    dir.writeUInt8(px >= 256 ? 0 : px, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.buf)]);
}

/** Visual checks: browser tabs at 16 px, home screens light/dark. */
async function checks() {
  const P = new URL("../assets/previews/", import.meta.url).pathname;
  const f16 = path.join(DIR, "favicon-16.png"), f32 = path.join(DIR, "favicon-32.png"), app = path.join(DIR, "ios/AppIcon-180.png");
  const tab = (dark) => `<div style="display:flex;gap:2px;padding:8px 8px 0;background:${dark ? "#202124" : "#DEE1E6"}">
    ${["SOMA – Beauty &amp; Wellness. Bei dir.", "Postfach", "Kalender"].map((t, i) => `<div style="display:flex;align-items:center;gap:8px;width:240px;height:34px;padding:0 12px;border-radius:8px 8px 0 0;background:${i === 0 ? (dark ? "#35363A" : "#fff") : "transparent"};color:${dark ? "#E8EAED" : "#3C4043"};font:12px system-ui">${i === 0 ? `<img src="file://${f16}" width="16" height="16">` : `<span style="width:16px;height:16px;border-radius:4px;background:${dark ? "#5F6368" : "#9AA0A6"}"></span>`}${t}</div>`).join("")}</div>`;
  const others = ["#3E6B8A", "#E3A72F", "#2F7D59", "#C8553D", "#6C5B7B", "#1D1D1F", "#F2F2F2", "#4285F4", "#FF2D55", "#5AC8FA", "#8E8E93"];
  const home = (dark) => `<div style="width:390px;padding:60px 28px;border-radius:44px;background:${dark ? "linear-gradient(#1b1d24,#0e0f12)" : "linear-gradient(#d9dde4,#bfc6d1)"};display:grid;grid-template-columns:repeat(4,1fr);gap:26px 22px">
    ${others.slice(0, 5).map((c) => `<div><div style="width:62px;height:62px;border-radius:14px;background:${c}"></div><div style="font:11px system-ui;color:${dark ? "#fff" : "#111"};text-align:center;margin-top:5px;width:62px">App</div></div>`).join("")}
    <div><img src="file://${app}" style="width:62px;height:62px;border-radius:14px;display:block"><div style="font:11px system-ui;color:${dark ? "#fff" : "#111"};text-align:center;margin-top:5px;width:62px">SOMA</div></div>
    ${others.slice(5).map((c) => `<div><div style="width:62px;height:62px;border-radius:14px;background:${c}"></div><div style="font:11px system-ui;color:${dark ? "#fff" : "#111"};text-align:center;margin-top:5px;width:62px">App</div></div>`).join("")}
  </div>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:32px;background:#F3EFE8;font:13px system-ui;color:#25211F}h2{font:600 12px system-ui;letter-spacing:.08em;text-transform:uppercase;margin:24px 0 10px}.z{image-rendering:pixelated}</style></head><body>
  <h2>Favicon 16 px · Tab-Leiste hell und dunkel (1:1)</h2>${tab(false)}<div style="height:8px"></div>${tab(true)}
  <h2>Favicon 16 / 32 px, 8× vergrößert (Pixelprüfung)</h2><div style="display:flex;gap:24px;align-items:flex-end"><img class="z" src="file://${f16}" width="128"><img class="z" src="file://${f32}" width="256"><img src="file://${f16}"><img src="file://${f32}"></div>
  <h2>Home-Screen hell und dunkel</h2><div style="display:flex;gap:32px">${home(false)}${home(true)}</div>
  </body></html>`;
  await shot(html, path.join(P, "icons-check.png"), { width: 1000 });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await ios();
  await android();
  await pwa();
  await favicons();
  await checks();
  await closeBrowser();
  console.log("icons built");
}
