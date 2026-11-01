// Digital advertising: 3 campaign concepts (BRAND_VOICE § 7.13) × 5 sizes → brand/applications/ads/<concept>/
import path from "node:path";
import * as L from "./lib.mjs";
const { C, nb } = L;
const OUT = path.join(L.APPS, "ads");
const wm = (color, w) => `<div style="width:${w}px">${L.logo("soma-wordmark-micro", color, 'style="width:100%;height:auto"')}</div>`;
const sym = (color, h) => `<div style="height:${h}px;width:${Math.round(h * 472 / 724)}px">${L.logo("soma-symbol", color, 'style="width:100%;height:100%"')}</div>`;

const CONCEPTS = {
  "a-schon-zu-hause": {
    img: L.img.v2("L05-experience-comfort"), pos: "45% 55%", posWide: "45% 50%",
    place: `Sofa, danach · München-Schwabing · 20:20`,
    head: `Nach der Massage: <em>schon zu Hause.</em>`, headShort: `Nach der Massage: <em>schon zu Hause.</em>`,
    copy: `Geprüfte Massage-Profis kommen zu dir. Endpreis inklusive Anfahrt, kostenlos stornierbar bis 24${nb}Stunden vorher.`,
    cta: "Freie Termine finden", end: "tagline", label: "Bild KI-generiert",
  },
  "b-zimmer-614": {
    img: L.img.v2("E04-hotel"), pos: "66% 50%", posWide: "40% 50%",
    place: `Hotelsuite, 6.${nb}Stock · Frankfurt-Westend · 21:10`,
    head: `Zimmer 614, <em>21:10${nb}Uhr.</em>`, headShort: `Zimmer 614, <em>21:10${nb}Uhr.</em>`,
    copy: `Massage nach dem letzten Termin des Tages – in deinem Hotelzimmer. Hotel und Zimmernummer angeben, dein Profi kommt zu dir.`,
    cta: "Freie Termine finden", end: "tagline", label: "Bild KI-generiert",
  },
  "c-dein-kalender": {
    img: L.img.v2("L11-app-pro"), pos: "50% 30%", posWide: "50% 30%",
    place: `Treppenhaus, 2.${nb}OG · Berlin-Neukölln · 17:40`,
    head: `Dein Können. Deine Preise. <em>Deine Zeiten.</em>`, headShort: `Dein Können. <em>Deine Zeiten.</em>`,
    copy: `Werde von Kundschaft in deinem Einsatzgebiet gefunden. Keine Grundgebühr. Bezahlt wird über SOMA – nicht an der Tür.`,
    cta: "Profi werden", end: "pro", label: "Bild KI-generiert · Demo-Daten",
  },
};

// The SOMA Pro request card (real copy from BRAND_VOICE § 7.7; demo values).
const requestCard = (s = 1) => `<div style="width:${430 * s}px;background:${C.paper};border-radius:${16 * s}px;box-shadow:var(--shadow-overlay);padding:${22 * s}px ${24 * s}px;font-size:${16 * s}px;color:${C.espresso}">
  <div style="display:flex;align-items:center;gap:${8 * s}px"><span style="width:${8 * s}px;height:${8 * s}px;border-radius:50%;background:${C.espresso}"></span><span class="eyebrow" style="font-size:${12 * s}px;color:${C.umberDeep}">Heute · Neue Anfrage</span></div>
  <div style="font-size:${21 * s}px;font-weight:600;margin-top:${10 * s}px;letter-spacing:-.008em">Shellac-Maniküre · 60${nb}Min.</div>
  <div class="num" style="margin-top:${6 * s}px;color:${C.umberDeep};line-height:1.45">Do., 12.${nb}Nov., 18:30${nb}Uhr · 10435 Berlin<br>Antworte bis heute, 15:10${nb}Uhr.</div>
  <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid ${C.oat};margin-top:${14 * s}px;padding-top:${12 * s}px"><span style="color:${C.umberDeep}">Dein Anteil inkl. Anfahrt</span><span class="num" style="font-weight:600;font-size:${20 * s}px">44,80${nb}€</span></div>
  <div style="display:flex;gap:${10 * s}px;margin-top:${16 * s}px"><span class="btn" style="flex:1;height:${44 * s}px;background:${C.espresso};color:${C.bone};font-size:${15 * s}px">Annehmen</span><span class="btn" style="flex:1;height:${44 * s}px;box-shadow:inset 0 0 0 1px ${C.taupeDeep};font-size:${15 * s}px">Ablehnen</span></div></div>`;

const endFrame = (k, color, w) => k.end === "pro"
  ? `<div style="display:flex;align-items:flex-end;gap:${w * 0.07}px">${wm(color, w)}<span style="color:${color};font-size:${w * 0.21}px;font-weight:560;line-height:1;margin-bottom:-${w * 0.012}px">Pro</span></div>`
  : `<div style="display:flex;align-items:center;gap:${w * 0.12}px">${wm(color, w)}<span class="it" lang="en" style="color:${color};font-size:${w * 0.19}px;line-height:1;white-space:nowrap">Your body. Your place.</span></div>`;
const cta = (k, size, bg = C.oxblood, fg = C.bone) => `<span class="btn" style="height:${size * 3.2}px;padding:0 ${size * 1.6}px;font-size:${size}px;background:${bg};color:${fg}">${k.cta}</span>`;

const T = {
  "1080x1080": (k) => `
    <div style="position:absolute;left:0;top:0;width:1080px;height:700px;overflow:hidden"><img class="cover" src="${k.img}" style="object-position:${k.pos}"></div>
    <div class="place" style="position:absolute;left:56px;top:640px;color:${C.bone};font-size:17px;text-shadow:0 1px 8px rgb(23 20 18/.5)">${k.place}</div>
    <div class="ai" style="position:absolute;right:40px;top:650px;color:${C.bone};font-size:15px">${k.label}</div>
    ${k.end === "pro" ? `<div style="position:absolute;right:56px;top:196px">${requestCard(1)}</div>` : ""}
    <div style="position:absolute;left:56px;right:56px;top:740px"><div class="serif" style="font-size:62px">${k.head}</div><div style="font-size:23px;line-height:1.45;color:${C.umberDeep};margin-top:16px;max-width:900px">${k.copy}</div></div>
    <div style="position:absolute;left:56px;bottom:56px">${cta(k, 22)}</div>
    <div style="position:absolute;right:56px;bottom:76px">${endFrame(k, C.espresso, 150)}</div>`,
  "1080x1920": (k) => `
    <div style="position:absolute;left:0;top:0;width:1080px;height:1090px;overflow:hidden"><img class="cover" src="${k.img}" style="object-position:${k.pos}"></div>
    ${k.end === "pro" ? `<div style="position:absolute;right:64px;top:520px">${requestCard(1.05)}</div>` : `<div style="position:absolute;left:64px;top:268px">${wm(C.bone, 170)}</div>`}
    <div class="place" style="position:absolute;left:64px;top:1030px;color:${C.bone};font-size:19px;text-shadow:0 1px 8px rgb(23 20 18/.5)">${k.place}</div>
    <div class="ai" style="position:absolute;right:48px;top:1046px;color:${C.bone};font-size:16px">${k.label}</div>
    <div style="position:absolute;left:64px;right:64px;top:1128px"><div class="serif" style="font-size:80px">${k.head}</div>
    <div style="font-size:28px;line-height:1.45;color:${C.umberDeep};margin-top:22px;max-width:900px">${k.copy}</div></div>
    <div style="position:absolute;left:64px;right:64px;top:1484px;display:flex;align-items:center;justify-content:space-between">${cta(k, 27)}${k.end === "pro" ? endFrame(k, C.espresso, 170) : `<span class="it" lang="en" style="font-size:34px">Your body. Your place.</span>`}</div>`,
  "1200x628": (k) => `
    <div style="position:absolute;right:0;top:0;width:640px;height:628px;overflow:hidden"><img class="cover" src="${k.img}" style="object-position:${k.posWide}"></div>
    ${k.end === "pro" ? `<div style="position:absolute;right:100px;top:230px;transform:scale(.78);transform-origin:top right">${requestCard(1)}</div>` : ""}
    <div class="ai" style="position:absolute;right:24px;bottom:18px;color:${C.bone};font-size:13px">${k.label}</div>
    <div style="position:absolute;left:56px;top:52px">${endFrame(k, C.espresso, 120)}</div>
    <div style="position:absolute;left:56px;width:460px;top:150px"><div class="serif" style="font-size:52px">${k.head}</div>
    <div style="font-size:18px;line-height:1.5;color:${C.umberDeep};margin-top:18px">${k.copy}</div></div>
    <div style="position:absolute;left:56px;bottom:52px">${cta(k, 18)}</div>`,
  "300x250": (k) => `
    <div style="position:absolute;left:0;top:0;width:300px;height:128px;overflow:hidden"><img class="cover" src="${k.img}" style="object-position:${k.pos}"></div>
    <div class="ai" style="position:absolute;right:6px;top:112px;color:${C.bone};font-size:9px">KI-Bild</div>
    <div style="position:absolute;left:16px;right:16px;top:138px"><div class="serif" style="font-size:23px;line-height:1.04">${k.headShort}</div></div>
    <div style="position:absolute;left:16px;bottom:14px">${cta(k, 12)}</div>
    <div style="position:absolute;right:16px;bottom:24px">${k.end === "pro" ? endFrame(k, C.espresso, 54) : wm(C.espresso, 56)}</div>`,
  "728x90": (k) => `
    <div style="position:absolute;left:0;top:0;width:150px;height:90px;overflow:hidden"><img class="cover" src="${k.img}" style="object-position:${k.pos}"></div>
    <div class="ai" style="position:absolute;left:4px;bottom:3px;color:${C.bone};font-size:8px">KI-Bild</div>
    <div style="position:absolute;left:174px;top:0;height:90px;display:flex;align-items:center;width:330px"><div class="serif" style="font-size:24px;line-height:1.05">${k.headShort}</div></div>
    <div style="position:absolute;right:20px;top:0;height:90px;display:flex;align-items:center;gap:18px">${cta(k, 12)}${k.end === "pro" ? endFrame(k, C.espresso, 54) : wm(C.espresso, 58)}</div>`,
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
