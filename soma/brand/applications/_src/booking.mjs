// Booking confirmation, mobile 390×844 (the real /buchung/[id] flow in the new brand; demo data).
import path from "node:path";
import * as L from "./lib.mjs";
const { C, nb, icon } = L;
const OUT = path.join(L.APPS, "booking-confirmation");
const archCheck = `<svg width="56" height="70" viewBox="0 0 800 1000" style="display:block"><path d="M0 1000L0 436.14C0 181 172 0 400 0C628 0 800 181 800 436.14L800 1000Z" fill="${C.paper}" stroke="${C.espresso}" stroke-width="22"/><path d="M250 610 360 720 560 470" fill="none" stroke="${C.espresso}" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const D = {
  ref: "SM-7KX4Q2", pro: "Anna K.", service: "Shellac-Maniküre", when: `Do., 12.${nb}Nov.`, time: `18:30–19:30`, dur: `60${nb}Min.`,
  kind: "Zuhause", addr: "Kastanienallee 12", plz: "10435 Berlin", details: `3.${nb}OG, Hinterhaus`, code: "4827",
  lines: [["Shellac-Maniküre · 60" + nb + "Min.", "46,00"], ["Anfahrt", "8,00"]], total: "54,00", free: `Mi., 11.${nb}Nov., 18:30${nb}Uhr`,
};
const screen = (full) => `
<div style="width:390px;${full ? "" : "height:844px;overflow:hidden;"}position:relative;background:var(--bone)">
  ${L.statusBar()}
  <div class="appbar">${L.logo("soma-wordmark-micro", C.espresso, 'style="height:15px;width:auto"')}<span style="display:flex;gap:6px;align-items:center" class="small muted"><span style="padding:3px 8px;border-radius:999px;background:var(--linen);font-weight:600;color:var(--umber-deep);white-space:nowrap">Demo-Daten</span>${icon("user", 22, C.espresso)}</span></div>
  <div style="padding:16px 16px ${full ? 120 : 0}px;display:flex;flex-direction:column;gap:16px">
    <section class="card" style="border-radius:24px;padding:24px 20px 22px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="status" style="background:${C.successSoft};color:${C.success}"><i style="background:${C.success}"></i>Bestätigt</span><span class="small muted">Buchung <span class="num" style="color:var(--espresso);font-weight:560;letter-spacing:.02em">${D.ref}</span></span></div>
      <div style="margin-top:22px">${archCheck}</div>
      <h1 class="serif" style="font-size:34px;line-height:1.04;margin-top:14px">Bestätigt.</h1>
      <p style="font-size:17px;line-height:1.5;margin-top:10px" class="muted">${D.pro.split(" ")[0]} kommt am ${D.when}, um 18:30${nb}Uhr zu dir.</p>
      <div style="margin-top:18px"><span class="btn btn-s">${icon("calendarPlus", 18)}Zum Kalender hinzufügen</span></div>
      <div style="margin-top:22px;border-radius:16px;background:var(--linen);padding:18px">
        <div class="eyebrow" style="color:var(--umber-deep)">Dein Start-Code</div>
        <div style="display:flex;gap:8px;margin-top:12px">${D.code.split("").map((d) => `<span class="num" style="width:56px;height:68px;border-radius:12px;background:var(--paper);box-shadow:var(--shadow-raised);display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:600;letter-spacing:-.02em">${d}</span>`).join("")}</div>
        <p class="body-s muted" style="margin-top:12px">Nenn ihn ${D.pro.split(" ")[0]} an der Tür. Erst mit dem Code beginnt der Termin – so weißt du, dass die richtige Person vor dir steht.</p>
      </div>
    </section>
    <section class="card">
      <h2 class="h-m">Dein Termin</h2>
      <div style="display:flex;align-items:center;gap:14px;margin-top:14px">${L.avatar("AK", 48)}<span style="flex:1"><span class="h-s" style="display:block">${D.pro}</span><span class="small muted" style="display:flex;align-items:center;gap:5px;margin-top:2px">${icon("shield", 14, C.umberDeep)}Profil geprüft</span></span>${icon("chevron", 20, C.umberDeep)}</div>
      <dl style="display:flex;flex-direction:column;gap:16px;border-top:1px solid var(--oat);margin-top:16px;padding-top:16px">
        <div class="fact"><span class="ic">${icon("manikuere", 20, C.umberDeep)}</span><dt>Behandlung</dt><dd>${D.service}</dd></div>
        <div class="fact"><span class="ic">${icon("calendar", 20, C.umberDeep)}</span><dt>Wann</dt><dd class="num">${D.when} · ${D.time}<span class="muted" style="display:flex;gap:5px;align-items:center;font-size:14px">${icon("clock", 14, C.umberDeep)}${D.dur}</span></dd></div>
        <div class="fact"><span class="ic">${icon("zuhause", 20, C.umberDeep)}</span><dt>Wo</dt><dd>${D.kind}<br>${D.addr}<br><span class="num">${D.plz}</span><br><span class="muted">${D.details}</span></dd></div>
      </dl>
    </section>
    <section class="card">
      <h2 class="h-m">Preis</h2>
      <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">${D.lines.map(([l, v]) => `<div class="body-s" style="display:flex;justify-content:space-between"><span class="muted">${l}</span><span class="num">${v}${nb}€</span></div>`).join("")}</div>
      <div style="border-top:1.5px dashed var(--taupe);margin:14px 0 12px;opacity:.7"></div>
      <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="h-s">Endpreis inkl. Anfahrt</span><span class="num" style="font-size:28px;font-weight:560;letter-spacing:-.02em">${D.total}${nb}€</span></div>
      <p class="small muted" style="margin-top:10px">SOMA vermittelt diesen Termin. Vertragspartner für die Behandlung ist ${D.pro} (selbstständig).</p>
      <div style="display:flex;gap:12px;align-items:center;margin-top:14px;border-radius:12px;background:var(--linen);padding:12px"><span style="width:44px;height:30px;border-radius:6px;background:var(--paper);box-shadow:var(--shadow-raised);display:flex;align-items:center;justify-content:center">${icon("card", 16, C.umberDeep)}</span><span class="small"><b style="font-weight:560;display:block">Zahlung: reserviert, belastet nach dem Termin</b><span class="muted num">Karte •••• 4242</span></span></div>
    </section>
    <section class="card">
      <h2 class="h-m">Stornierung</h2>
      <p class="body-s" style="display:flex;gap:8px;margin-top:12px;color:${C.success}">${icon("circleCheck", 18, C.success)}<span style="color:var(--espresso)">Kostenlos stornierbar bis ${D.free}.</span></p>
      <ol style="list-style:none;margin-top:12px;border-radius:12px;background:var(--linen);padding:12px 14px;display:flex;flex-direction:column;gap:9px" class="small muted num">
        <li style="display:flex;gap:9px"><i style="width:8px;height:8px;border-radius:50%;background:${C.success};margin-top:4px;flex:none"></i><span style="color:var(--espresso)">Bis ${D.free}: kostenlos <span style="margin-left:4px;padding:1px 6px;border-radius:999px;background:var(--paper);box-shadow:var(--shadow-raised);font-size:11px;font-weight:560;color:var(--espresso)">jetzt</span></span></li>
        <li style="display:flex;gap:9px"><i style="width:8px;height:8px;border-radius:50%;background:#B07A26;margin-top:4px;flex:none"></i><span>Bis Do., 12.${nb}Nov., 16:30${nb}Uhr: 50${nb}% des Behandlungspreises, Anfahrt erstattet</span></li>
        <li style="display:flex;gap:9px"><i style="width:8px;height:8px;border-radius:50%;background:#B3261E;margin-top:4px;flex:none"></i><span>Danach oder bei Nichtantreffen: voller Preis inkl. Anfahrt</span></li>
      </ol>
      <div style="margin-top:14px"><span class="btn btn-s">Termin stornieren</span></div>
    </section>
    <section style="border-radius:12px;background:#E2E9EF;box-shadow:inset 0 0 0 1px #A8BBCB;padding:14px 16px;display:flex;gap:10px">${icon("info", 18, "#2F5470")}<span class="body-s"><b style="color:#2F5470">Vorbereitung.</b> Ein Tisch mit gutem Licht genügt. Werkzeug, Lacke und Lampe bringt Anna mit.</span></section>
    <p class="small muted" style="padding:0 4px">Fragen zur Buchung? <u style="color:var(--espresso);text-decoration-color:var(--taupe-deep);text-underline-offset:3px">Hilfe &amp; Kontakt</u></p>
  </div>
  <nav class="tabbar" style="position:${full ? "absolute" : "absolute"};left:0;right:0;bottom:0">
    ${[["compass", "Entdecken"], ["calendar", "Termine"], ["heart", "Favoriten"], ["user", "Konto"]].map(([i, t]) => `<span class="tab ${t === "Termine" ? "on" : ""}"><span class="pill">${icon(i, 22, t === "Termine" ? C.espresso : C.umberDeep, t === "Termine" ? 1.9 : 1.5)}</span>${t}</span>`).join("")}
  </nav>
</div>`;
const css = L.UI_CSS;
await L.png(L.page(screen(false), { w: 390, h: 844, css }), path.join(OUT, "booking-confirmed-390x844@3x.png"), { w: 390, h: 844, scale: 3 });
await L.png(L.page(screen(true), { w: 390, h: 2000, css: css + "html,body{height:auto;overflow:visible}" }), path.join(OUT, "booking-confirmed-full@2x.png"), { w: 390, h: 844, scale: 2, fullPage: true });
const f = (p) => "file://" + path.join(OUT, p);
await L.png(L.page(`<div style="padding:64px 72px;display:flex;gap:72px">
  <div style="width:520px"><div class="eyebrow" style="color:${C.umberDeep}">Anwendung · Buchungsbestätigung</div>
  <h1 class="serif" style="font-size:56px;margin:14px 0 18px">Bestätigt. <em>Und alles steht drin.</em></h1>
  <p style="font-size:18px;line-height:1.55;color:${C.umberDeep}">Der echte Ablauf von <span class="num">/buchung/[id]</span> im neuen Brand: Status als Wort, die eine Serif-Zeile, der Start-Code als ruhiger Moment, Ort, Zeit, Endpreis und die datierte Stornofrist. Kein Oxblood auf diesem Screen: es gibt keine Primäraktion.</p>
  <ul style="margin-top:24px;font-size:15px;line-height:1.6;color:${C.espresso};padding-left:18px">
    <li>Bewegung: Bogen-Kontur zeichnet sich (640 ms), Haken folgt (320 ms), Ziffern steigen gestaffelt (+90 ms).</li>
    <li>Reduzierte Bewegung: alles erscheint sofort; nichts trägt Information nur durch Bewegung.</li>
    <li>Alle Werte sind Demo-Daten (Beispiel aus BRAND_VOICE § 7.8).</li></ul></div>
  ${L.phoneFrame(f("booking-confirmed-390x844@3x.png"))}
  <img src="${f("booking-confirmed-full@2x.png")}" style="width:300px;border-radius:20px;box-shadow:var(--shadow-float);align-self:flex-start"></div>`, { w: 1640, h: 1600 }), path.join(OUT, "board.png"), { w: 1640, h: 1600 });
await L.close();
console.log("booking done");
