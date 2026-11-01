// Fills the e-mail template with demo data (BRAND_VOICE § 7.8 E1) and renders TRUTHFUL previews (audit C3):
//  · webfonts  = Apple Mail / iOS Mail: the hosted @font-face files load (email/assets/fonts).
//  · fallback  = Gmail, Outlook, Yahoo: @font-face is ignored; the stated stack applies (Georgia + Arial/Helvetica).
//    The sandbox has neither Georgia nor Arial, so the preview maps them to metric-compatible OFL/free faces:
//    Georgia → Gelasio (OFL, email/_preview-fonts), Arial/Helvetica → Liberation Sans. Same metrics, same line breaks.
import fs from "node:fs";
import path from "node:path";
import * as L from "./lib.mjs";
const DIR = path.join(L.APPS, "email");
const nb = " ";
const demo = {
  asset_base: "assets", reference: "SM-7KX4Q2", customer_first: "Julia", service: "Shellac-Maniküre", duration: `60${nb}Min.`,
  pro_first: "Anna", pro_name: "Anna K.", date_short: `Do., 12.${nb}Nov.`, time: "18:30", place_kind: "Zuhause", address: "Kastanienallee 12, 10435 Berlin",
  total: "54,00", free_until: `Mi., 11.${nb}Nov., 18:30${nb}Uhr`, prep_note: "Ein Tisch mit gutem Licht genügt. Werkzeug, Lacke und Lampe bringt Anna mit.",
  booking_url: "https://soma.example/buchung/demo", calendar_url: "https://soma.example/buchung/demo/kalender", support_email: "hilfe@soma.example", site_url: "https://soma.example",
};
const fill = (s) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => { if (!(k in demo)) throw new Error("missing " + k); return demo[k]; });
const html = fill(fs.readFileSync(path.join(DIR, "template/buchung-bestaetigt.template.html"), "utf8"));
const txt = fill(fs.readFileSync(path.join(DIR, "template/buchung-bestaetigt.template.txt"), "utf8"));
fs.writeFileSync(path.join(DIR, "buchung-bestaetigt.html"), html);
fs.writeFileSync(path.join(DIR, "buchung-bestaetigt.txt"), txt);

const abs = (h) => h.replaceAll('url("assets/', `url("file://${DIR}/assets/`).replaceAll('src="assets/', `src="file://${DIR}/assets/`);
const webfonts = abs(html);
// Fallback: strip the @font-face rules (what Gmail/Outlook do) and alias the system fonts the stack names.
const PF = `file://${DIR}/_preview-fonts`;
const alias = `<style>
@font-face{font-family:Georgia;src:url("${PF}/gelasio-400-latin.woff2") format("woff2");font-weight:400}
@font-face{font-family:Georgia;src:url("${PF}/gelasio-700-latin.woff2") format("woff2");font-weight:700}
@font-face{font-family:Arial;src:local("Liberation Sans");font-weight:400}
@font-face{font-family:Arial;src:local("Liberation Sans Bold");font-weight:700}
@font-face{font-family:Helvetica;src:local("Liberation Sans");font-weight:400}
@font-face{font-family:Helvetica;src:local("Liberation Sans Bold");font-weight:700}</style>`;
const fallback = abs(html.replace(/@font-face\s*\{[^}]*\}/g, "")).replace("</head>", alias + "</head>");
if (/Newsreader Display";\s*font-style/.test(fallback)) throw new Error("webfonts still present in fallback");

const shots = [
  ["preview-webfonts-light-680.png", webfonts, { w: 680, h: 900, scale: 2, fullPage: true }],
  ["preview-fallback-light-680.png", fallback, { w: 680, h: 900, scale: 2, fullPage: true }],
  ["preview-fallback-dark-680.png", fallback, { w: 680, h: 900, scale: 2, fullPage: true, colorScheme: "dark" }],
  ["preview-fallback-mobile-390.png", fallback, { w: 390, h: 844, scale: 3, fullPage: true }],
];
for (const [f, h, o] of shots) await L.png(h, path.join(DIR, f), o);
for (const old of ["preview-light-680.png", "preview-dark-680.png", "preview-mobile-390.png"]) fs.rmSync(path.join(DIR, old), { force: true });

// Comparison board
const F = (p) => "file://" + path.join(DIR, p);
await L.png(L.page(`<div style="padding:56px 64px">
  <div class="eyebrow" style="color:${L.C.umberDeep}">Anwendung · Transaktionale E-Mail · „Buchung bestätigt“</div>
  <h1 class="serif" style="font-size:52px;margin:12px 0 10px">So sieht sie wirklich aus.</h1>
  <p style="font-size:17px;line-height:1.5;color:${L.C.umberDeep};max-width:1180px">Links mit Webfonts (Apple Mail, iOS Mail). Mitte und rechts ohne Webfonts, wie Gmail und Outlook sie zeigen: Georgia für den Titel, Arial bzw. Helvetica für den Text. Diese Vorschau ist mit metrisch gleichen Ersatzschriften gerendert (Gelasio, Liberation Sans); Zeilenumbrüche und Höhen entsprechen dem Original.</p>
  <div style="display:flex;gap:36px;margin-top:36px;align-items:flex-start">
    ${[["preview-webfonts-light-680.png", "Apple Mail · Webfonts"], ["preview-fallback-light-680.png", "Gmail / Outlook · ohne Webfonts"], ["preview-fallback-dark-680.png", "Dunkelmodus · ohne Webfonts (z. B. Outlook.com)"]].map(([f, t]) => `<figure><img src="${F(f)}" style="width:440px;display:block;box-shadow:var(--shadow-float)"><figcaption class="place" style="margin-top:14px;color:${L.C.umberDeep}">${t}</figcaption></figure>`).join("")}
  </div></div>`, { w: 1520, h: 1050 }), path.join(DIR, "preview-board.png"), { w: 1520, h: 1050 });
await L.close();
console.log("email done", Buffer.byteLength(html), "bytes");
