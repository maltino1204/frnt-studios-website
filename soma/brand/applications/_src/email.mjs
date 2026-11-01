// Fills the e-mail template with demo data (BRAND_VOICE § 7.8 E1) and renders light/dark/mobile previews.
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
const fill = (s, enc) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => { if (!(k in demo)) throw new Error("missing " + k); return enc ? demo[k] : demo[k].replaceAll(nb, " ") === demo[k] ? demo[k] : demo[k]; });
const html = fill(fs.readFileSync(path.join(DIR, "template/buchung-bestaetigt.template.html"), "utf8"), true);
const txt = fill(fs.readFileSync(path.join(DIR, "template/buchung-bestaetigt.template.txt"), "utf8"), false);
fs.writeFileSync(path.join(DIR, "buchung-bestaetigt.html"), html);
fs.writeFileSync(path.join(DIR, "buchung-bestaetigt.txt"), txt);
// The preview loads the template's own fonts from the brand folder (in production: {{asset_base}} on the CDN).
const preview = html.replaceAll('url("assets/fonts/', `url("file://${L.SOMA}/brand/assets/typography/fonts/`).replaceAll('src="assets/', `src="file://${DIR}/assets/`);
await L.png(preview, path.join(DIR, "preview-light-680.png"), { w: 680, h: 900, scale: 2, fullPage: true });
await L.png(preview, path.join(DIR, "preview-dark-680.png"), { w: 680, h: 900, scale: 2, fullPage: true, colorScheme: "dark" });
await L.png(preview, path.join(DIR, "preview-mobile-390.png"), { w: 390, h: 844, scale: 3, fullPage: true });
await L.close();
console.log("email done", Buffer.byteLength(html), "bytes");
