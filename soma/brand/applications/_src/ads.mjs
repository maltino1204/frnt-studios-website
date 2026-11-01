// Digital advertising: 3 campaign concepts (BRAND_VOICE § 7.13) × 5 sizes → brand/applications/ads/<concept>/
// Every format carries THE SIGNATURE (guidelines § 10.2): the offset arch pair + the Ortszeile under the left arch.
// Small banners (300×250, 728×90) carry a single arch or a 4:3 pair with the short Ortszeile (arches stay ≥ 120 px wide).
// The wordmark sits on calm Bone only, never on a photograph.
import path from "node:path";
import * as L from "./lib.mjs";
const { C, nb } = L;
const OUT = path.join(L.APPS, "ads");
const wm = (color, w) => `<div style="width:${w}px">${L.logo("soma-wordmark-micro", color, 'style="width:100%;height:auto"')}</div>`;

const CONCEPTS = {
  "a-schon-zu-hause": {
    a: { src: L.img.v2("L01-hero-wide"), pos: "73% 50%" }, b: { src: L.img.v2("E03-after"), pos: "24% 50%" },
    place: `Altbau, 3.${nb}OG · Berlin-Prenzlauer Berg · 19:30`, placeShort: `Berlin · 19:30`,
    head: `Nach der Massage: <em>schon zu Hause.</em>`, headShort: `Nach der Massage: <em>schon zu Hause.</em>`,
    copy: `Geprüfte Massage-Profis kommen zu dir. Endpreis inklusive Anfahrt, kostenlos stornierbar bis 24${nb}Stunden vorher.`,
    cta: "Freie Termine finden", end: "tagline", label: "Bilder KI-generiert",
  },
  "b-zimmer-614": {
    a: { src: L.img.v2("L08-experience-choice"), pos: "62% 50%" }, b: { src: L.img.v2("E04-hotel"), pos: "68% 50%" },
    place: `Hotelsuite, 6.${nb}Stock · Frankfurt-Westend · 21:10`, placeShort: `Frankfurt · 21:10`,
    head: `Zimmer 614, <em>21:10${nb}Uhr.</em>`, headShort: `Zimmer 614, <em>21:10${nb}Uhr.</em>`,
    copy: `Massage nach dem letzten Termin des Tages – in deinem Hotelzimmer. Hotel und Zimmernummer angeben, dein Profi kommt zu dir.`,
    cta: "Freie Termine finden", end: "tagline", label: "Bilder KI-generiert",
  },
  "c-dein-kalender": {
    a: { src: L.img.v2("E07-provider-cta"), pos: "72% 45%" }, b: { src: L.img.v2("L11-app-pro"), pos: "50% 35%" },
    place: `Treppenhaus, 2.${nb}OG · Berlin-Neukölln · 17:40`, placeShort: `Berlin · 17:40`,
    head: `Dein Können. Deine Preise. <em>Deine Zeiten.</em>`, headShort: `Dein Können. <em>Deine Zeiten.</em>`,
    copy: `Werde von Kundschaft in deinem Einsatzgebiet gefunden. Keine Grundgebühr. Bezahlt wird über SOMA – nicht an der Tür.`,
    cta: "Profi werden", end: "pro", label: "Bilder KI-generiert · Demo-Daten",
  },
};

// The SOMA Pro request card (copy from BRAND_VOICE § 7.7; demo values, labelled).
const requestCard = (s = 1) => `<div style="width:${400 * s}px;background:${C.paper};border-radius:${16 * s}px;box-shadow:var(--shadow-overlay);padding:${20 * s}px ${22 * s}px;font-size:${16 * s}px;color:${C.espresso}">
  <div style="display:flex;align-items:center;gap:${8 * s}px"><span style="width:${8 * s}px;height:${8 * s}px;border-radius:50%;background:${C.espresso}"></span><span class="eyebrow" style="font-size:${12 * s}px;color:${C.umberDeep}">Beispiel · Neue Anfrage</span></div>
  <div style="font-size:${20 * s}px;font-weight:600;margin-top:${9 * s}px;letter-spacing:-.008em">Shellac-Maniküre · 60${nb}Min.</div>
  <div class="num" style="margin-top:${5 * s}px;color:${C.umberDeep};line-height:1.45">Do., 12.${nb}Nov., 18:30${nb}Uhr · 10435 Berlin<br>Antworte bis heute, 15:10${nb}Uhr.</div>
  <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid ${C.oat};margin-top:${12 * s}px;padding-top:${10 * s}px"><span style="color:${C.umberDeep}">Dein Anteil inkl. Anfahrt</span><span class="num" style="font-weight:600;font-size:${19 * s}px">44,80${nb}€</span></div>
  <div style="display:flex;gap:${10 * s}px;margin-top:${14 * s}px"><span class="btn" style="flex:1;height:${42 * s}px;background:${C.espresso};color:${C.bone};font-size:${15 * s}px">Annehmen</span><span class="btn" style="flex:1;height:${42 * s}px;box-shadow:inset 0 0 0 1px ${C.taupeDeep};font-size:${15 * s}px">Ablehnen</span></div></div>`;

const endFrame = (k, color, w) => k.end === "pro"
  ? `<div style="display:flex;align-items:flex-end;gap:${w * 0.07}px">${wm(color, w)}<span style="color:${color};font-size:${w * 0.21}px;font-weight:560;line-height:1;margin-bottom:-${w * 0.012}px">Pro</span></div>`
  : wm(color, w);
const tagline = (size) => `<span class="it" lang="en" style="font-size:${size}px;line-height:1;white-space:nowrap">Your body. Your place.</span>`;
const cta = (k, size) => `<span class="btn" style="height:${size * 3.2}px;padding:0 ${size * 1.5}px;font-size:${size}px;background:${C.oxblood};color:${C.bone}">${k.cta}</span>`;
const sig = (k, o) => L.signature({ a: k.a, b: k.b, place: k.place, ...o });
const ai = (k, size, color = C.umberDeep) => `<span class="ai" style="font-size:${size}px;color:${color}">${k.label}</span>`;

const T = {
  "1080x1080": (k) => `
    <div style="position:absolute;left:56px;top:52px">${endFrame(k, C.espresso, 128)}</div>
    <div style="position:absolute;right:56px;top:58px">${ai(k, 18)}</div>
    <div style="position:absolute;left:56px;top:118px">${sig(k, { w: 466, h: 560, gap: 36, placeSize: 17 })}</div>
    ${k.end === "pro" ? `<div style="position:absolute;right:40px;top:470px">${requestCard(0.86)}</div>` : ""}
    <div style="position:absolute;left:56px;right:56px;top:812px"><div class="serif" style="font-size:60px">${k.head}</div></div>
    <div style="position:absolute;left:56px;right:56px;bottom:52px;display:flex;align-items:center;justify-content:space-between">${cta(k, 22)}${k.end === "pro" ? "" : tagline(30)}</div>`,
  "1080x1920": (k) => `
    <div style="position:absolute;left:64px;top:262px">${endFrame(k, C.espresso, 160)}</div>
    <div style="position:absolute;right:64px;top:272px">${ai(k, 20)}</div>
    <div style="position:absolute;left:64px;top:346px">${sig(k, { w: 458, h: 720, gap: 36, placeSize: 19 })}</div>
    ${k.end === "pro" ? `<div style="position:absolute;right:48px;top:820px">${requestCard(1)}</div>` : ""}
    <div style="position:absolute;left:64px;right:64px;top:1236px"><div class="serif" style="font-size:80px">${k.head}</div>
    <div style="font-size:29px;line-height:1.45;color:${C.umberDeep};margin-top:22px;max-width:920px">${k.copy}</div></div>
    <div style="position:absolute;left:64px;right:64px;top:1584px;display:flex;align-items:center;justify-content:space-between">${cta(k, 28)}${k.end === "pro" ? "" : tagline(36)}</div>`,
  "1200x628": (k) => `
    <div style="position:absolute;left:56px;top:50px">${endFrame(k, C.espresso, 112)}</div>
    <div style="position:absolute;left:56px;width:500px;top:132px"><div class="serif" style="font-size:52px">${k.head}</div>
    <div style="font-size:18px;line-height:1.5;color:${C.umberDeep};margin-top:16px">${k.copy}</div></div>
    <div style="position:absolute;left:56px;bottom:48px;display:flex;align-items:center;gap:22px">${cta(k, 18)}${ai(k, 14)}</div>
    <div style="position:absolute;left:628px;top:40px">${sig(k, { w: 258, h: 470, gap: 24, placeSize: 13 })}</div>
    ${k.end === "pro" ? `<div style="position:absolute;right:24px;top:300px">${requestCard(0.66)}</div>` : ""}`,
  "300x250": (k) => `
    <div class="arch" style="position:absolute;left:14px;top:14px;width:120px;height:190px;--a:${(120 / 190).toFixed(4)}"><img src="${k.b.src}" style="object-position:${k.b.pos}"></div>
    <div class="place" style="position:absolute;left:14px;top:212px;width:130px;font-size:9.5px;line-height:1.3;color:${C.umberDeep}">${k.placeShort}</div>
    <div class="ai" style="position:absolute;left:14px;top:228px;font-size:9px;color:${C.umberDeep}">KI-Bild</div>
    <div style="position:absolute;left:150px;right:12px;top:16px">${endFrame(k, C.espresso, 64)}</div>
    <div style="position:absolute;left:150px;right:10px;top:50px"><div class="serif" style="font-size:22px;line-height:1.04">${k.headShort}</div></div>
    <div style="position:absolute;left:150px;bottom:14px">${cta(k, 11.5)}</div>`,
  "728x90": (k) => `
    <div class="arch" style="position:absolute;left:10px;top:8px;width:120px;height:90px;--a:1.3333"><img src="${k.a.src}" style="object-position:${k.a.pos}"></div>
    <div class="arch" style="position:absolute;left:138px;top:${8 + Math.round(120 * 0.18)}px;width:120px;height:90px;--a:1.3333"><img src="${k.b.src}" style="object-position:${k.b.pos}"></div>
    <div style="position:absolute;left:282px;top:14px" class="place"><span style="font-size:10px;color:${C.umberDeep}">${k.placeShort}</span> <span class="ai" style="font-size:9px;color:${C.umberDeep};letter-spacing:.02em;text-transform:none;font-weight:500"> · KI-Bilder</span></div>
    <div style="position:absolute;left:282px;top:30px;width:190px"><div class="serif" style="font-size:22px;line-height:1.04">${k.headShort}</div></div>
    <div style="position:absolute;right:16px;top:0;height:90px;display:flex;align-items:center;gap:16px">${cta(k, 12)}${endFrame(k, C.espresso, 56)}</div>`,
};

for (const [id, k] of Object.entries(CONCEPTS)) {
  for (const [size, tpl] of Object.entries(T)) {
    const [w, h] = size.split("x").map(Number);
    const body = `<div style="position:relative;width:${w}px;height:${h}px;overflow:hidden;background:${C.bone}">${tpl(k)}</div>`;
    await L.png(L.page(body, { w, h }), path.join(OUT, id, `${id}-${size}.png`), { w, h, scale: w < 800 ? 2 : 1 });
  }
}
await L.close();
console.log("ads done");
