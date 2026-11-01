// One overview board per concept (all five sizes at true relative scale) → ads/<concept>/board.png
import fs from "node:fs";
import path from "node:path";
import * as L from "./lib.mjs";
const { C } = L;
const OUT = path.join(L.APPS, "ads");
const names = { "a-schon-zu-hause": "A · „Schon zu Hause“ (Zuhause, Massage)", "b-zimmer-614": "B · „Zimmer 614“ (Hotel, Reisende)", "c-dein-kalender": "C · „Dein Kalender“ (Profis, SOMA Pro)" };
for (const id of Object.keys(names)) {
  const f = (s) => "file://" + path.join(OUT, id, `${id}-${s}.png`);
  const html = L.page(`<div style="padding:56px 64px">
    <div class="eyebrow" style="color:${C.umberDeep}">Digitale Werbung · Kampagnenkonzept</div>
    <div class="serif" style="font-size:52px;margin:12px 0 36px">${names[id]}</div>
    <div style="display:flex;gap:40px;align-items:flex-start">
      <img src="${f("1080x1920")}" style="width:405px;box-shadow:var(--shadow-float)">
      <div style="display:flex;flex-direction:column;gap:40px">
        <div style="display:flex;gap:40px;align-items:flex-start"><img src="${f("1080x1080")}" style="width:540px;box-shadow:var(--shadow-float)"><img src="${f("300x250")}" style="width:300px;box-shadow:var(--shadow-float)"></div>
        <img src="${f("1200x628")}" style="width:600px;box-shadow:var(--shadow-float)">
        <img src="${f("728x90")}" style="width:728px;box-shadow:var(--shadow-float)">
      </div></div>
    <div class="place" style="margin-top:36px;color:${C.umberDeep}">1080×1920 · 1080×1080 · 300×250 · 1200×628 · 728×90 — Maßstab: 1080er Formate 50 %, Banner 100 %</div></div>`, { w: 1500, h: 1290 });
  await L.png(html, path.join(OUT, id, "board.png"), { w: 1500, h: 1290 });
}
await L.close();
