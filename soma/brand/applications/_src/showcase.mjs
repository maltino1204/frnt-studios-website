// Mobile customer app + SOMA Pro dashboard showcase, composed from LIVE screenshots of the migrated app
// (showcase/live, captured by capture-live.cjs from the demo environment) and the brand photography.
import path from "node:path";
import * as L from "./lib.mjs";
const { C } = L;
const OUT = path.join(L.APPS, "showcase");
const live = (f) => "file://" + path.join(OUT, "live", f);
const stamp = `Screenshots aus der App (Demo-Umgebung, Beispieldaten) · Stand 1. Nov. 2026`;
const aiTag = `<span style="display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 14px;border-radius:999px;background:${C.linen};box-shadow:inset 0 0 0 1px ${C.stoneDeep};font-size:14px;font-weight:600;color:${C.umberDeep}">Bilder KI-generiert · Demo-Daten</span>`;
const phone = (f, w = 300) => `<div style="width:${w + 18}px;border-radius:${w * 0.15}px;background:#1A1816;padding:9px;box-shadow:0 0 0 1px #3B3531,0 40px 70px -34px rgb(23 20 18/.5)"><img src="${live(f)}" style="width:${w}px;display:block;border-radius:${w * 0.12}px"></div>`;
const cap = (n, t, d) => `<figcaption style="margin-top:18px;width:300px"><div class="place" style="color:${C.umberDeep}"><span class="num">${n}</span> · ${t}</div><p style="font-size:14px;line-height:1.5;color:${C.umberDeep};margin-top:6px">${d}</p></figcaption>`;

// 1 · Customer app
await L.png(L.page(`<div style="padding:64px 72px">
  <div class="eyebrow" style="color:${C.umberDeep}">Anwendung · Mobile Kunden-App</div>
  <h1 class="serif" style="font-size:60px;margin:14px 0 10px">Vom Ort zur Buchung. <em>In fünf Screens.</em></h1>
  <div style="display:flex;gap:16px;align-items:center"><p style="font-size:17px;color:${C.umberDeep}">${stamp}</p>${aiTag}</div>
  <div style="display:flex;gap:44px;margin-top:48px">
    ${[["c1-home-390.png", "01", "Entdecken", "Eine Serif-Zeile, Wo · Was · Wann als ruhige Karte, die eine Oxblood-Aktion. Darunter das Bogenpaar."],
      ["c2-suche-390.png", "02", "Suche", "Echte freie Termine als Slots, Endpreis inkl. Anfahrt in tabellarischen Ziffern."],
      ["c3-profil-390.png", "03", "Profil", "Porträt im Bogen mit „Demo-Profil · Foto KI-generiert“, Kategorie als Ortszeile, „Termin wählen“ als Oxblood-Moment."],
      ["c4-termine-390.png", "04", "Termine", "Status immer als Wort und Punkt. Datum als Kachel, Preis rechts."],
      ["c5-buchung-390.png", "05", "Bestätigt", "Der Bestätigungsmoment: Bogen-Häkchen, Serif-Titel, Start-Code in vier Ziffern."]].map(([f, n, t, d]) => `<figure>${phone(f)}${cap(n, t, d)}</figure>`).join("")}
  </div></div>`, { w: 1880, h: 1060 }), path.join(OUT, "customer-app.png"), { w: 1880, h: 1060 });

// 2 · SOMA Pro dashboard
await L.png(L.page(`<div style="padding:64px 72px">
  <div class="eyebrow" style="color:${C.umberDeep}">Anwendung · SOMA Pro</div>
  <h1 class="serif" style="font-size:60px;margin:14px 0 10px">Dein Können. Deine Preise. <em>Deine Zeiten.</em></h1>
  <div style="display:flex;gap:16px;align-items:center"><p style="font-size:17px;color:${C.umberDeep}">${stamp}</p>${aiTag}</div>
  <div style="display:flex;gap:48px;margin-top:44px;align-items:flex-start">
    <figure><div style="width:1180px;border-radius:14px;overflow:hidden;box-shadow:var(--shadow-overlay)">
      <div style="height:40px;background:${C.linen};display:flex;align-items:center;gap:8px;padding:0 16px">${["#C7BCAF", "#C7BCAF", "#C7BCAF"].map((c) => `<span style="width:11px;height:11px;border-radius:50%;background:${c}"></span>`).join("")}<span style="margin-left:18px;height:24px;flex:1;max-width:420px;border-radius:999px;background:${C.paper};font-size:12px;color:${C.umberDeep};display:flex;align-items:center;padding:0 12px">soma.example/pro</span></div>
      <img src="${live("p3-heute-1440.png")}" style="width:1180px;display:block"></div>
      <figcaption class="place" style="margin-top:16px;color:${C.umberDeep}">Heute · 1440 px · Wochen-KPIs mit tabellarischen Ziffern, offene Anfragen mit Antwortfrist, Provision und Anfahrt offen ausgewiesen</figcaption></figure>
    <div style="display:flex;flex-direction:column;gap:28px">${phone("p1-heute-390.png", 260)}<div class="place" style="color:${C.umberDeep};width:280px">Heute · mobil</div></div>
    <div style="display:flex;flex-direction:column;gap:28px">${phone("p2-einnahmen-390.png", 260)}<div class="place" style="color:${C.umberDeep};width:280px">Einnahmen · 48 Std. Haltefrist</div></div>
  </div></div>`, { w: 2000, h: 1180 }), path.join(OUT, "pro-dashboard.png"), { w: 2000, h: 1180 });

// 3 · Environment composite for the landing "digital experience" chapter: the live home screen on the oak table (flat, straight).
await L.png(L.page(`<div style="position:relative;width:1800px;height:1195px;overflow:hidden">
  <img class="cover" src="${L.img.v2("L12-app-table")}" style="position:absolute;inset:0">
  <div style="position:absolute;left:1250px;top:150px;width:416px;border-radius:62px;background:#1A1816;padding:14px;box-shadow:0 2px 0 rgb(0 0 0/.25),40px 60px 90px -30px rgb(23 20 18/.65)"><img src="${live("c1-home-390.png")}" style="width:388px;display:block;border-radius:50px"></div>
  <div style="position:absolute;left:640px;top:520px;width:540px;color:${C.bone}">${L.logo("soma-wordmark-micro", C.bone, 'style="width:150px;height:auto"')}<div class="serif" style="font-size:66px;margin-top:28px;text-shadow:0 2px 24px rgb(23 20 18/.45)">Wer kommt. Wann. <em>Was es kostet.</em></div></div>
  <div class="ai" style="position:absolute;right:28px;bottom:18px;color:${C.bone};font-size:18px">Bild KI-generiert · Screen: App, Demo-Daten</div></div>`, { w: 1800, h: 1195 }), path.join(OUT, "app-on-table.png"), { w: 1800, h: 1195 });
await L.close();
console.log("showcase done");
