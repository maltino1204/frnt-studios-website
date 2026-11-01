// Shared kit for every SOMA brand application (Digital Art Director, phase B2).
// Artwork = HTML/SVG → PNG/PDF with Playwright (Chromium at /opt/pw-browsers/chromium). Run from soma/.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

export const SOMA = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
export const APPS = path.join(SOMA, "brand/applications");
const require = createRequire(path.join(SOMA, "package.json"));
const { chromium } = require("@playwright/test");

export const C = {
  bone: "#F3EFE8", paper: "#FBF9F5", linen: "#ECE6DC", oat: "#E3DBCF", stone: "#D8CFC3", stoneDeep: "#C7BCAF",
  taupe: "#A69A8D", taupeDeep: "#857A6E", umber: "#6E6359", umberDeep: "#5E554D", cocoa: "#3B3531",
  espresso: "#25211F", espressoDeep: "#171412", oxblood: "#542C35", ox700: "#45232B", ox200: "#D5B5BC", ox100: "#EBDADD",
  night2: "#BFB4A7", success: "#336645", successSoft: "#E4ECE2",
};

const FONTS = path.join(SOMA, "brand/assets/typography/fonts");
const url = (p) => "file://" + p;
export const img = {
  v1: (p) => url(path.join(SOMA, "public/images", p)),
  v2: (name) => url(path.join(SOMA, "brand/photography/v2-previews", name + ".jpg")),
  asset: (p) => url(path.join(SOMA, "brand/assets", p)),
};

/** Inline SVG of a logo master, coloured via currentColor. name e.g. "soma-wordmark-micro", "soma-symbol". */
export function logo(name, color = C.espresso, attrs = "") {
  let s = fs.readFileSync(path.join(SOMA, "brand/assets/logo/final", name + ".svg"), "utf8").replace(/<\?xml[^>]*>/, "");
  s = s.replace(/\s(width|height)="[^"]*"/g, "");
  const m = /style="([^"]*)"/.exec(attrs);
  const rest = attrs.replace(/style="[^"]*"/, "");
  return s.replace("<svg", `<svg style="color:${color};display:block;${m ? m[1] : ""}" ${rest} aria-hidden="true"`);
}
export const archPath = (w, h) => {
  // The O's upper half on straight flanks: ry = 0.545 * width (guidelines § 5.1)
  const ry = 0.545 * w, k = 0.57;
  return `M0 ${h}L0 ${ry}C0 ${ry * (1 - k) * 0.8} ${w * 0.215} 0 ${w / 2} 0C${w * 0.785} 0 ${w} ${ry * (1 - k) * 0.8} ${w} ${ry}L${w} ${h}Z`;
};

export const CSS = `
@font-face{font-family:"Instrument Sans";src:url("${url(FONTS + "/instrument-sans-variable-latin.woff2")}") format("woff2");font-weight:400 700;font-stretch:75% 100%;}
@font-face{font-family:"Newsreader Display";src:url("${url(FONTS + "/newsreader-display-roman-latin.woff2")}") format("woff2");font-weight:400;}
@font-face{font-family:"Newsreader Display";font-style:italic;src:url("${url(FONTS + "/newsreader-display-italic-latin.woff2")}") format("woff2");font-weight:400;}
:root{--bone:${C.bone};--paper:${C.paper};--linen:${C.linen};--oat:${C.oat};--stone:${C.stone};--taupe:${C.taupe};--taupe-deep:${C.taupeDeep};
--umber:${C.umber};--umber-deep:${C.umberDeep};--espresso:${C.espresso};--espresso-deep:${C.espressoDeep};--oxblood:${C.oxblood};--ox200:${C.ox200};
--shadow-raised:0 0 0 1px rgb(37 33 31/.07),0 1px 2px rgb(37 33 31/.04),0 4px 10px -4px rgb(37 33 31/.06);
--shadow-float:0 0 0 1px rgb(37 33 31/.06),0 2px 4px -1px rgb(37 33 31/.05),0 12px 24px -8px rgb(37 33 31/.10);
--shadow-overlay:0 0 0 1px rgb(37 33 31/.07),0 8px 16px -6px rgb(37 33 31/.08),0 32px 64px -20px rgb(37 33 31/.22);}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--bone);color:var(--espresso);font-family:"Instrument Sans",system-ui,sans-serif;-webkit-font-smoothing:antialiased;font-kerning:normal;font-feature-settings:"kern"}
.serif{font-family:"Newsreader Display",Georgia,serif;font-weight:400;letter-spacing:-.02em;line-height:1.02;text-wrap:balance}
.serif em,.it{font-family:"Newsreader Display",Georgia,serif;font-style:italic;letter-spacing:-.008em}
.num{font-variant-numeric:tabular-nums lining-nums}
.eyebrow{font-weight:600;text-transform:uppercase;letter-spacing:.12em;font-size:12px;line-height:1.2}
.place{font-weight:600;text-transform:uppercase;letter-spacing:.12em;font-variant-numeric:tabular-nums;font-size:12px;line-height:1.3}
.arch{border-radius:50% 50% 0 0 / calc(54.5% * var(--a,.8)) calc(54.5% * var(--a,.8)) 0 0;overflow:hidden}
.arch img,.cover{width:100%;height:100%;object-fit:cover;display:block}
.ai{font-size:11px;letter-spacing:.02em;font-weight:500;opacity:.78}
.btn{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;font-weight:560;letter-spacing:-.004em;white-space:nowrap}
`;

export const page = (body, { w, h, css = "", bg = C.bone, lang = "de" } = {}) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${CSS}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:${bg}}${css}</style></head><body>${body}</body></html>`;

let browser;
export async function launch() { browser ??= await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }); return browser; }
export async function close() { await browser?.close(); browser = undefined; }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "soma-apps-"));
let n = 0;
/** Render an HTML string to PNG at w×h CSS px (scale = deviceScaleFactor). Returns the output path. */
export async function png(html, out, { w, h, scale = 1, colorScheme = "light", fullPage = false } = {}) {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, colorScheme });
  const p = await ctx.newPage();
  const f = path.join(tmp, `p${n++}.html`);
  fs.writeFileSync(f, html);
  await p.goto("file://" + f, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(60);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await p.screenshot({ path: out, fullPage, animations: "disabled" });
  await ctx.close();
  return out;
}
/** Render an HTML file (already on disk) to PNG. */
export async function pngFile(file, out, opts) { return png(fs.readFileSync(file, "utf8"), out, opts); }
/** Print HTML to a PDF (A4 by default). */
export async function pdf(html, out, opts = {}) {
  const b = await launch();
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const f = path.join(tmp, `d${n++}.html`);
  fs.writeFileSync(f, html);
  await p.goto("file://" + f, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await p.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true, ...opts });
  await ctx.close();
  return out;
}
export const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); return p; };
export const nb = " ";

// ── UI kit for product comps (mirrors /kit/marke § 6; Lucide geometry at 1.5 px stroke) ─────────
const LUC = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  circleCheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  calendarPlus: '<path d="M8 2v4M16 2v4M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8M3 10h18M16 19h6M19 16v6"/>',
  calendar: '<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  mapPin: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  euro: '<path d="M4 10h12M4 14h9M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
};
export function icon(name, size = 20, color = "currentColor", sw = 1.5) {
  if (!LUC[name]) {
    const f = path.join(SOMA, "brand/assets/iconography/custom", name + ".svg");
    const s = fs.readFileSync(f, "utf8").replace(/<title[^>]*>.*?<\/title>/, "").replace(/\s(width|height)="[^"]*"/g, "");
    return s.replace("<svg", `<svg width="${size}" height="${size}" style="color:${color};flex:none;display:block" stroke-width="${sw}"`);
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="flex:none;display:block">${LUC[name]}</svg>`;
}
export const UI_CSS = `
.card{background:var(--paper);border-radius:16px;box-shadow:var(--shadow-raised);padding:20px}
.h-m{font-size:17px;font-weight:600;letter-spacing:-.008em;line-height:1.3}
.h-s{font-size:15px;font-weight:600;letter-spacing:-.004em;line-height:1.35}
.body-s{font-size:14px;line-height:1.5}
.small{font-size:12px;font-weight:450;letter-spacing:.01em;line-height:1.4}
.muted{color:var(--umber-deep)}
.status{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:560}
.status i{width:6px;height:6px;border-radius:50%;display:block}
.fact{display:grid;grid-template-columns:20px 1fr;gap:4px 12px;align-items:start}
.fact dt{grid-column:2;font-size:12px;font-weight:600;color:var(--umber-deep)}
.fact .ic{grid-row:1 / span 2;color:var(--umber-deep);padding-top:2px}
.fact dd{grid-column:2;font-size:15px;line-height:1.45}
.btn-s{height:44px;padding:0 18px;font-size:15px;box-shadow:inset 0 0 0 1px var(--taupe-deep);background:transparent;color:var(--espresso);gap:8px}
.btn-p{height:48px;padding:0 22px;font-size:15px;background:var(--espresso);color:var(--bone);gap:8px}
.btn-a{height:52px;padding:0 24px;font-size:16px;background:var(--oxblood);color:var(--bone);gap:8px}
.tabbar{display:flex;justify-content:space-around;align-items:flex-start;height:84px;padding-top:8px;background:rgb(251 249 245/.97);box-shadow:0 -1px 0 var(--oat)}
.tab{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;font-weight:540;color:var(--umber-deep);width:72px}
.tab .pill{width:56px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center}
.tab.on{color:var(--espresso)}.tab.on .pill{background:var(--linen)}
.appbar{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:rgb(251 249 245/.92);box-shadow:0 1px 0 var(--oat)}
.sbar{height:47px;background:rgb(251 249 245/.92);display:flex;align-items:center;justify-content:space-between;padding:0 30px 0 34px;font-size:16px;font-weight:600}
`;
export const statusBar = (color = C.espresso) => `<div class="sbar num" style="color:${color}"><span>9:41</span><span style="display:flex;gap:6px;align-items:center"><svg width="18" height="11"><rect x="0" y="7" width="3" height="4" rx="1" fill="${color}"/><rect x="5" y="5" width="3" height="6" rx="1" fill="${color}"/><rect x="10" y="2" width="3" height="9" rx="1" fill="${color}"/><rect x="15" y="0" width="3" height="11" rx="1" fill="${color}"/></svg><svg width="26" height="12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="${color}" opacity=".45"/><rect x="2" y="2" width="17" height="8" rx="2" fill="${color}"/></svg></span></div>`;
export const avatar = (initials, size = 48, wash = "#EAE1DA", src) => src
  ? `<img src="${src}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 1px rgb(37 33 31/.1);flex:none">`
  : `<span style="width:${size}px;height:${size}px;border-radius:50%;background:${wash};display:flex;align-items:center;justify-content:center;font-family:'Newsreader Display';font-size:${size * 0.42}px;box-shadow:0 0 0 1px rgb(37 33 31/.1);flex:none">${initials}</span>`;
/** Phone frame around a 390×844 screen image. */
export const phoneFrame = (src, w = 390) => `<div style="width:${w + 24}px;height:${(w * 844) / 390 + 24}px;border-radius:${w * 0.14}px;background:#1A1816;padding:12px;box-shadow:0 0 0 1px #3B3531,0 40px 80px -30px rgb(23 20 18/.45)"><img src="${src}" style="width:${w}px;height:${(w * 844) / 390}px;border-radius:${w * 0.115}px;display:block"></div>`;
