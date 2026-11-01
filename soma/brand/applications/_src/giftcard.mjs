// Gift card: FUTURE CONCEPT (gift cards are v1.1 and not built; BRAND_VOICE § 7.10). Physical ID-1 card + digital.
import path from "node:path";
import * as L from "./lib.mjs";
const { C, nb } = L;
const OUT = path.join(L.APPS, "giftcard");
const MM = 300 / 25.4; // px per mm at 300 dpi
const W = 85.6, H = 54, BLEED = 3, R = 3.18;
const wm = (color, w) => `<div style="width:${w}px">${L.logo("soma-wordmark-micro", color, 'style="width:100%;height:auto"')}</div>`;
// u = px per mm (300 dpi for PNG, 1 mm for PDF via CSS mm)
const front = (u, bleed = 0) => `<div style="position:relative;width:${(W + 2 * bleed) * u}px;height:${(H + 2 * bleed) * u}px;background:${C.oxblood};overflow:hidden">
  <svg style="position:absolute;left:${(bleed + 50) * u}px;top:${(bleed + 9) * u}px" width="${30 * u}" height="${(H + bleed) * u}" viewBox="0 0 800 1440"><path d="M0 1440L0 436.14C0 181 172 0 400 0C628 0 800 181 800 436.14L800 1440" fill="none" stroke="${C.bone}" stroke-width="${0.35 * 800 / 30}" opacity=".9"/></svg>
  <div style="position:absolute;left:${(bleed + 6) * u}px;top:${(bleed + 6.5) * u}px">${wm(C.bone, 20 * u)}</div>
  <div class="it" lang="en" style="position:absolute;left:${(bleed + 6) * u}px;bottom:${(bleed + 6) * u}px;color:${C.bone};font-size:${4.6 * u}px;line-height:1">Your body. Your place.</div>
  <div style="position:absolute;left:${(bleed + 6) * u}px;bottom:${(bleed + 12.2) * u}px;color:${C.ox200};font-size:${1.9 * u}px;font-weight:600;letter-spacing:.14em;text-transform:uppercase">SOMA-Gutschein</div></div>`;
const back = (u, bleed = 0) => `<div style="position:relative;width:${(W + 2 * bleed) * u}px;height:${(H + 2 * bleed) * u}px;background:${C.bone};overflow:hidden;color:${C.espresso}">
  <div style="position:absolute;left:${(bleed + 6) * u}px;top:${(bleed + 5.6) * u}px;font-size:${1.8 * u}px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${C.umberDeep}">Für Lena</div>
  <div class="serif" style="position:absolute;left:${(bleed + 6) * u}px;top:${(bleed + 9.5) * u}px;width:${52 * u}px;font-size:${5.2 * u}px;line-height:1.05">Eine Stunde, für die <em>niemand das Haus verlassen muss.</em></div>
  <div class="num" style="position:absolute;right:${(bleed + 6) * u}px;top:${(bleed + 5) * u}px;font-size:${7.2 * u}px;font-weight:560;letter-spacing:-.02em">100${nb}€</div>
  <div style="position:absolute;left:${(bleed + 6) * u}px;right:${(bleed + 6) * u}px;top:${(bleed + 27.5) * u}px;font-size:${1.75 * u}px;line-height:1.5;color:${C.umberDeep}">Ein SOMA-Gutschein über 100${nb}€ für Lena – einzulösen für jede Behandlung auf SOMA. Gültig gemäß Gutscheinbedingungen.</div>
  <div style="position:absolute;left:${(bleed + 6) * u}px;bottom:${(bleed + 4.6) * u}px;display:flex;flex-direction:column;gap:${1.1 * u}px"><span class="num" style="align-self:flex-start;font-size:${2.3 * u}px;font-weight:600;letter-spacing:.12em;padding:${0.9 * u}px ${1.6 * u}px;border-radius:${1 * u}px;box-shadow:inset 0 0 0 ${0.15 * u}px ${C.taupeDeep}">MUST-ER00-0000</span><span style="font-size:${1.5 * u}px;color:${C.umberDeep}">Code · einlösen auf soma.example/gutschein</span></div>
  <div style="position:absolute;right:${(bleed + 6) * u}px;bottom:${(bleed + 6.2) * u}px">${wm(C.oxblood, 14 * u)}</div></div>`;
const round = (inner, u) => `<div style="width:${W * u}px;height:${H * u}px;border-radius:${R * u}px;overflow:hidden">${inner}</div>`;

const u = MM;
await L.png(L.page(round(front(u), u), { w: Math.round(W * u), h: Math.round(H * u), bg: "transparent" }), path.join(OUT, "physical-front-85.6x54mm@300dpi.png"), { w: Math.round(W * u), h: Math.round(H * u) });
await L.png(L.page(round(back(u), u), { w: Math.round(W * u), h: Math.round(H * u), bg: "transparent" }), path.join(OUT, "physical-back-85.6x54mm@300dpi.png"), { w: Math.round(W * u), h: Math.round(H * u) });
// Print PDF: 2 pages, 3 mm bleed, trim marks outside the bleed are added by the printer's RIP; trim box = 85.6×54 mm, corners die-cut R 3.18 mm.
const pdfCss = `@page{size:${W + 2 * BLEED}mm ${H + 2 * BLEED}mm;margin:0}html,body{width:auto;height:auto;background:#fff}.pg{page-break-after:always}`;
const mmU = 3.7795; // CSS px per mm
await L.pdf(`<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${L.CSS}${pdfCss}</style></head><body><div class="pg">${front(mmU, BLEED)}</div><div class="pg">${back(mmU, BLEED)}</div></body></html>`, path.join(OUT, "giftcard-print-91.6x60mm-bleed.pdf"), { format: undefined });

// Digital card (e-mail / wallet), 1200×760
await L.png(L.page(`<div style="position:relative;width:1200px;height:760px;background:${C.bone};overflow:hidden">
  <div style="position:absolute;left:0;top:0;width:560px;height:760px;overflow:hidden"><img class="cover" src="${L.img.v2("L03-philosophy")}" style="object-position:50% 60%"></div>
  <div class="ai" style="position:absolute;left:20px;bottom:16px;color:${C.bone};font-size:13px">Bild KI-generiert</div>
  <div style="position:absolute;left:624px;top:64px">${wm(C.espresso, 120)}</div>
  <div style="position:absolute;left:624px;top:176px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${C.umberDeep}">SOMA-Gutschein · für Lena</div>
  <div class="serif" style="position:absolute;left:624px;top:214px;width:520px;font-size:52px">Verschenk eine Stunde, <em>für die niemand das Haus verlassen muss.</em></div>
  <div style="position:absolute;left:624px;top:470px;display:flex;align-items:baseline;gap:16px"><span class="num" style="font-size:64px;font-weight:560;letter-spacing:-.02em">100${nb}€</span><span style="font-size:17px;color:${C.umberDeep}">für jede Behandlung auf SOMA</span></div>
  <div style="position:absolute;left:624px;top:580px;display:flex;gap:14px;align-items:center"><span class="btn" style="height:52px;padding:0 26px;font-size:16px;background:${C.oxblood};color:${C.bone}">Gutschein einlösen</span><span class="num" style="font-size:16px;font-weight:600;letter-spacing:.12em;color:${C.umberDeep}">MUST-ER00-0000</span></div>
  <div style="position:absolute;left:624px;bottom:40px;font-size:13px;color:${C.umberDeep};width:520px;line-height:1.5">Gültig gemäß Gutscheinbedingungen (⚖ in Abstimmung, Entwurf: 3 Jahre).</div></div>`, { w: 1200, h: 760 }), path.join(OUT, "digital-1200x760.png"), { w: 1200, h: 760, scale: 2 });

// Presentation board, clearly labelled as a future concept
const f = (p) => "file://" + path.join(OUT, p);
await L.png(L.page(`<div style="padding:64px 72px">
  <div style="display:flex;align-items:center;gap:16px"><span class="eyebrow" style="color:${C.umberDeep}">Anwendung · Gutschein</span><span style="padding:6px 12px;border-radius:999px;background:#F5EAD3;box-shadow:inset 0 0 0 1px #D8BC86;color:#7D5310;font-size:13px;font-weight:600">Zukunftskonzept · Gutscheine sind nicht gebaut (v1.1)</span></div>
  <h1 class="serif" style="font-size:56px;margin:16px 0 40px">Eine Stunde verschenken.</h1>
  <div style="display:flex;gap:56px;align-items:flex-start">
    <div style="display:flex;flex-direction:column;gap:32px">
      <img src="${f("physical-front-85.6x54mm@300dpi.png")}" style="width:520px;border-radius:19px;box-shadow:var(--shadow-overlay)">
      <img src="${f("physical-back-85.6x54mm@300dpi.png")}" style="width:520px;border-radius:19px;box-shadow:var(--shadow-overlay)">
      <div class="place" style="color:${C.umberDeep}">Karte ID-1 · 85,6 × 54 mm · Ecken R 3,18 mm · 3 mm Beschnitt</div></div>
    <div style="display:flex;flex-direction:column;gap:24px"><img src="${f("digital-1200x760.png")}" style="width:760px;box-shadow:var(--shadow-float);border-radius:16px">
      <ul style="font-size:16px;line-height:1.6;color:${C.espresso};padding-left:18px;width:760px">
        <li>Vorderseite: die eine Oxblood-Fläche, Bone-Bogenkontur, die über die Kante läuft (der Bogen schneidet, er wird nicht gefüllt).</li>
        <li>Rückseite: Bone, Oxblood-Wortmarke (nur im Druck erlaubt), Betrag und Code in tabellarischen Ziffern. „MUST-ER…“ ist ein Mustercode.</li>
        <li>Druck: ungestrichener Bone-Karton ≥ 600 g/m² oder PVC-frei; Oxblood als Sonderfarbe nach Andruck; Wortmarke optional als Bone-Heißfolie.</li>
        <li>Gültigkeit und Bedingungen kommen vom Anwalt (⚖). Nicht auf Landingpage oder in der App zeigen, bis Gutscheine gebaut sind.</li></ul></div></div></div>`, { w: 1480, h: 1000 }), path.join(OUT, "board.png"), { w: 1480, h: 1000 });
await L.close();
console.log("giftcard done");
