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

function sym(micro = false) {
  const S = F.glyphS({ ...F.MASTERS.display, ...(micro ? F.SYMBOL_MICRO : F.SYMBOL) }, F.SYMBOL_OPTS);
  const b = bounds(S);
  return { item: transform(S, { tx: -b.x - b.w / 2, ty: -b.y - b.h / 2 }), w: b.w, h: b.h };
}
/** Square icon SVG: size units, background (or null), S height as a fraction of the size, optical lift. */
function iconSvg({ size = 1024, bg = OX, fg = BONE, sFrac = 0.5, radius = 0, micro = false, lift = 0.006, title = "SOMA", extra = "" }) {
  const s = sym(micro);
  const sc = (size * sFrac) / s.h;
  const g = transform(s.item, { sx: sc, tx: size / 2 + s.w * sc * 0.012, ty: size / 2 - size * lift });
  const bgEl = bg ? `  <rect id="background" width="${size}" height="${size}"${radius ? ` rx="${radius}"` : ""} fill="${bg}"/>\n` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-labelledby="t">
  <title id="t">${esc(title)}</title>
${bgEl}${extra}  <g id="symbol" fill="${fg}">
    <path d="${toD(g)}"/>
  </g>
</svg>
`;
}
async function out(svg, file, px) {
  return png(svg, path.join(DIR, file), { width: px, height: px });
}

async function ios() {
  const master = iconSvg({ sFrac: 0.5 });
  write(path.join(DIR, "ios/AppIcon.svg"), master);
  await out(master, "ios/AppIcon-1024.png", 1024);
  // iOS 18 appearances
  const dark = iconSvg({ bg: ESP, fg: "#E9DCCF", sFrac: 0.5, title: "SOMA (dunkel)" });
  write(path.join(DIR, "ios/AppIcon-dark.svg"), dark);
  await out(dark, "ios/AppIcon-1024-dark.png", 1024);
  const tinted = iconSvg({ bg: "#000000", fg: "#FFFFFF", sFrac: 0.5, title: "SOMA (getönt)" });
  await out(tinted, "ios/AppIcon-1024-tinted.png", 1024);
  for (const px of [180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20]) {
    const svg = iconSvg({ sFrac: 0.5, micro: px <= 60 });
    await out(svg, `ios/AppIcon-${px}.png`, px);
  }
}
async function android() {
  // adaptive: 108dp canvas; the foreground S stays inside the 66dp safe circle
  const fg = iconSvg({ size: 432, bg: null, sFrac: 0.42, title: "SOMA Vordergrund" });
  const bgOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 432 432" width="432" height="432"><title>SOMA Hintergrund</title><rect id="background" width="432" height="432" fill="${OX}"/></svg>\n`;
  const mono = iconSvg({ size: 432, bg: null, fg: "#FFFFFF", sFrac: 0.42, title: "SOMA monochrom" });
  write(path.join(DIR, "android/ic_launcher_foreground.svg"), fg);
  write(path.join(DIR, "android/ic_launcher_background.svg"), bgOnly);
  write(path.join(DIR, "android/ic_launcher_monochrome.svg"), mono);
  const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(dens)) {
    await out(fg, `android/mipmap-${d}/ic_launcher_foreground.png`, 108 * k);
    await out(bgOnly, `android/mipmap-${d}/ic_launcher_background.png`, 108 * k);
    await out(mono, `android/mipmap-${d}/ic_launcher_monochrome.png`, 108 * k);
    // legacy (pre-API 26): rounded square and round
    await out(iconSvg({ size: 192, sFrac: 0.5, radius: 34, micro: k <= 1 }), `android/mipmap-${d}/ic_launcher.png`, 48 * k);
    await out(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192"><circle cx="96" cy="96" r="96" fill="${OX}"/>${iconSvg({ size: 192, bg: null, sFrac: 0.48 }).replace(/^[\s\S]*?(<g id="symbol"[\s\S]*?<\/g>)[\s\S]*$/, "$1")}</svg>`, `android/mipmap-${d}/ic_launcher_round.png`, 48 * k);
  }
  write(path.join(DIR, "android/mipmap-anydpi-v26/ic_launcher.xml"), `<?xml version="1.0" encoding="utf-8"?>
<!-- SOMA adaptive icon: Oxblood background, Bone S foreground, monochrome layer for themed icons (API 33+). -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
`);
  await out(iconSvg({ size: 512, sFrac: 0.5 }), "android/play-store-512.png", 512);
}
async function pwa() {
  const any = iconSvg({ size: 512, sFrac: 0.52, radius: 112 });
  const mask = iconSvg({ size: 512, sFrac: 0.44 }); // full bleed, S inside the 80 % safe circle
  write(path.join(DIR, "pwa/icon.svg"), any);
  write(path.join(DIR, "pwa/icon-maskable.svg"), mask);
  await out(any, "pwa/icon-192.png", 192);
  await out(any, "pwa/icon-512.png", 512);
  await out(mask, "pwa/icon-maskable-192.png", 192);
  await out(mask, "pwa/icon-maskable-512.png", 512);
}
function favSvg() {
  // 32-unit tile, micro S; in dark browser chrome the tile gains a hairline so it does not sink into the bar
  const base = iconSvg({ size: 32, sFrac: 0.7, radius: 7, micro: true, lift: 0.004 });
  return base.replace('<rect id="background"', `<style>@media (prefers-color-scheme: dark){#background{stroke:#8F5E69;stroke-width:1}}</style>\n  <rect id="background"`);
}
async function favicons() {
  const fav = favSvg();
  write(path.join(DIR, "favicon.svg"), fav);
  const bufs = [];
  for (const px of [16, 32, 48]) {
    const svg = iconSvg({ size: 32, sFrac: px === 16 ? 0.74 : 0.7, radius: 7, micro: true, lift: 0.004 });
    const file = await out(svg, `favicon-${px}.png`, px);
    bufs.push({ px, buf: fs.readFileSync(file) });
  }
  fs.writeFileSync(path.join(DIR, "favicon.ico"), ico(bufs));
  await out(iconSvg({ size: 180, sFrac: 0.5 }), "apple-touch-icon.png", 180);
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
