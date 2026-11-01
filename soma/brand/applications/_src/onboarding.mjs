// SOMA Pro welcome kit: multi-page A4 PDF (Playwright page.pdf) + PNG page previews. Facts: BRAND_STRATEGY § 2/7,
// BRAND_VOICE § 7.9, scripts/db/lib/base-seed-data.ts (documents, commission 20/12/5 %, payout hold 48 h).
import path from "node:path";
import * as L from "./lib.mjs";
const { C, nb, icon } = L;
const OUT = path.join(L.APPS, "onboarding");
const wm = (color, w) => `<div style="width:${w}px">${L.logo("soma-wordmark-micro", color, 'style="width:100%;height:auto"')}</div>`;
const pro = (color, w) => `<div style="display:flex;align-items:flex-end;gap:${w * 0.07}px">${wm(color, w)}<span style="color:${color};font-size:${w * 0.21}px;font-weight:560;line-height:1;margin-bottom:-1px">Pro</span></div>`;
const box = `<span style="width:15px;height:15px;border-radius:4px;box-shadow:inset 0 0 0 1.3px ${C.taupeDeep};flex:none;margin-top:3px"></span>`;
const head = (n, label) => `<div style="position:absolute;left:18mm;right:18mm;top:12mm;display:flex;justify-content:space-between;align-items:center">${pro(C.espresso, 64)}<span class="place" style="font-size:9px;color:${C.umberDeep}">${label} · <span class="num">${String(n).padStart(2, "0")}</span></span></div>`;
const foot = `<div style="position:absolute;left:18mm;right:18mm;bottom:10mm;font-size:8.5px;color:${C.umberDeep};display:flex;justify-content:space-between"><span>Willkommensmappe SOMA Pro · Entwurf v1.0 · Stand Nov. 2026</span><span>Verbindlich sind die AGB für Profis (⚖ Anwalt) und die Einstellungen in SOMA Pro.</span></div>`;
const P = (inner, n, label, bg = C.bone) => `<section class="pg" style="background:${bg}">${n ? head(n, label) : ""}${inner}${n ? foot : ""}</section>`;
const h = (t) => `<h2 class="serif" style="font-size:40px;line-height:1.02;margin:0">${t}</h2>`;
const lead = (t) => `<p style="font-size:13.5px;line-height:1.55;color:${C.umberDeep};margin-top:12px;max-width:150mm">${t}</p>`;

const pages = [
  // 1 Cover
  P(`<div class="arch" style="position:absolute;left:18mm;top:18mm;width:174mm;height:190mm;--a:.9158"><img src="${L.img.v2("E07-provider-cta")}" style="object-position:72% 50%"></div>
     <div class="ai" style="position:absolute;right:20mm;top:210mm;color:${C.umberDeep};font-size:8px">Bild KI-generiert</div>
     <div style="position:absolute;left:18mm;top:220mm">${pro(C.espresso, 110)}</div>
     <h1 class="serif" style="position:absolute;left:18mm;right:18mm;top:236mm;font-size:52px;line-height:1">Willkommen bei SOMA Pro.</h1>
     <p style="position:absolute;left:18mm;top:262mm;font-size:15px;color:${C.umberDeep}">Dein Können. Deine Preise. <span class="it" style="font-size:17px;color:${C.espresso}">Deine Zeiten.</span></p>
     <p style="position:absolute;left:18mm;bottom:12mm;font-size:8.5px;color:${C.umberDeep}">Willkommensmappe · Entwurf v1.0 · Stand Nov. 2026</p>`, 0),
  // 2 How SOMA works for you
  P(`<div style="position:absolute;left:18mm;right:18mm;top:30mm">${h(`So funktioniert SOMA <em>für dich.</em>`)}
     ${lead("Du bist selbstständig. SOMA macht dich für Kundschaft in deinem Einsatzgebiet sichtbar und kümmert sich um Buchung, Zahlung und Stornofristen. Preise, Zeiten und Gebiet legst du selbst fest.")}
     <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4mm;margin-top:10mm">${[["Profil", "Leistungen und deine Preise"], ["Einsatzgebiet", "Radius und Anfahrtspauschale"], ["Arbeitszeiten", "Wochenzeiten, Puffer, Vorlaufzeit"], ["Nachweise", "Hochladen, wir prüfen"], ["Auszahlung", "Bankverbindung hinterlegen"]].map(([t, d], i) => `<div style="border-top:1.5px solid ${C.espresso};padding-top:3mm"><div class="num" style="font-size:11px;font-weight:600;color:${C.umberDeep}">0${i + 1}</div><div style="font-size:13px;font-weight:600;margin-top:2mm">${t}</div><div style="font-size:11px;line-height:1.45;color:${C.umberDeep};margin-top:1.5mm">${d}</div></div>`).join("")}</div>
     <p style="font-size:12px;color:${C.umberDeep};margin-top:6mm">Jeder Schritt wird gespeichert. Sichtbar und buchbar bist du, sobald wir deine Nachweise geprüft haben.</p>
     <h3 style="font-size:15px;font-weight:600;margin-top:12mm">Wie Buchungen zu dir kommen</h3>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:4mm">
       <div class="card" style="padding:5mm"><div class="eyebrow" style="font-size:9.5px;color:${C.umberDeep}">Auf Anfrage</div><p style="font-size:12px;line-height:1.5;margin-top:2mm">Kundschaft fragt an, du sagst zu oder ab – bis zur angezeigten Antwortfrist. Bis zur Zusage wird nichts belastet.</p></div>
       <div class="card" style="padding:5mm"><div class="eyebrow" style="font-size:9.5px;color:${C.umberDeep}">Sofort bestätigt</div><p style="font-size:12px;line-height:1.5;margin-top:2mm">Freie Zeiten sind direkt buchbar. Diesen Modus kannst du nach drei abgeschlossenen Terminen einschalten.</p></div></div>
     <ul style="margin-top:8mm;display:flex;flex-direction:column;gap:2.6mm;font-size:12px;line-height:1.5;list-style:none">
       ${["Kundschaft sieht den Endpreis inklusive deiner Anfahrt, bevor sie bucht.", "Die Adresse siehst du erst nach der Bestätigung – und nur du.", "Bezahlt wird ausschließlich online über SOMA. Kein Bargeld an der Tür.", "Deine Stammkundschaft bringst du mit deinem Einladungslink mit – für 5 % Provision."].map((t) => `<li style="display:flex;gap:3mm">${icon("check", 15, C.espresso)}<span>${t}</span></li>`).join("")}</ul>
     <div style="position:relative;height:62mm;margin-top:9mm">${[["L01-hero-wide", "72% 50%", "Zuhause"], ["L08-experience-choice", "30% 50%", "Hotel"], ["L09-experience-flexible", "70% 45%", "Büro"]].map(([im, pos, t], i) => `<div style="position:absolute;left:${i * 59}mm;top:${i % 2 ? 6 : 0}mm;width:50mm"><div class="arch" style="width:50mm;height:50mm;--a:1"><img src="${L.img.v2(im)}" style="object-position:${pos}"></div><div class="place" style="font-size:9px;margin-top:2mm;color:${C.umberDeep}">${t}</div></div>`).join("")}<div class="ai" style="position:absolute;right:0;bottom:0;color:${C.umberDeep};font-size:8px">Bilder KI-generiert</div></div></div>`, 2, "So funktioniert’s"),
  // 3 Verification checklist
  P(`<div style="position:absolute;left:18mm;right:18mm;top:30mm">${h(`Geprüft, <em>bevor es klingelt.</em>`)}
     ${lead("Kundschaft lässt dich in ihre Wohnung, ihr Hotelzimmer, ihr Büro. Deshalb prüfen wir vor der Freischaltung diese Nachweise. Läuft ein Pflichtnachweis ab, pausiert dein Profil automatisch, bis der neue geprüft ist.")}
     <div class="card" style="margin-top:12mm;padding:7mm 8mm"><div class="eyebrow" style="font-size:9.5px;color:${C.umberDeep}">Für alle Profis</div>
       ${["Personalausweis oder Reisepass", "Gewerbeanmeldung", "Berufs- bzw. Betriebshaftpflichtversicherung (vollständige Police mit Laufzeit)"].map((t) => `<div style="display:flex;gap:3mm;margin-top:4.5mm;font-size:14px">${box}<span>${t}</span></div>`).join("")}</div>
     <div class="card" style="margin-top:8mm;padding:7mm 8mm"><div class="eyebrow" style="font-size:9.5px;color:${C.umberDeep}">Je nach Kategorie</div>
       <table style="width:100%;border-collapse:collapse;margin-top:2mm;font-size:12.5px">${[["Massage", "Nachweis einer Massageausbildung (Wellness)"], ["Maniküre", "Kurszertifikat Maniküre oder Nageldesign"], ["Pediküre", "Nachweis Ausbildung kosmetische Fußpflege"], ["Kosmetik", "Nachweis der Kosmetikausbildung"], ["Haare & Styling", "Meisterbrief oder Eintragung in die Handwerksrolle"], ["Brows & Lashes", "Kurszertifikat Wimpern- bzw. Augenbrauenbehandlung"], ["Make-up", "kein zusätzlicher Nachweis"]].map(([k, v]) => `<tr style="border-top:1px solid ${C.oat}"><td style="padding:3.6mm 0;width:44mm;font-weight:600;vertical-align:top;font-size:13.5px"><span style="display:flex;gap:3mm">${k === "Make-up" ? '<span style="width:15px"></span>' : box}${k}</span></td><td style="padding:3.6mm 0;color:${C.umberDeep};font-size:13.5px">${v}</td></tr>`).join("")}</table></div>
     <div style="margin-top:9mm;border-radius:12px;background:#E2E9EF;box-shadow:inset 0 0 0 1px #A8BBCB;padding:4mm 5mm;display:flex;gap:3mm;font-size:12px;line-height:1.5">${icon("info", 16, "#2F5470")}<span><b style="color:#2F5470">Hinweis.</b> Braucht ein Nachweis noch etwas, sagen wir dir genau was – zum Beispiel „Auf dem Dokument fehlt die Laufzeit.“ Sobald er passt, schalten wir dich frei.</span></div></div>`, 3, "Verifizierung"),
  // 4 Start-Code + at the appointment
  P(`<div style="position:absolute;left:18mm;right:18mm;top:30mm">${h(`Der Start-Code. <em>Vier Ziffern an der Tür.</em>`)}
     <div style="display:grid;grid-template-columns:1fr 66mm;gap:9mm;margin-top:9mm">
       <div><div style="display:flex;gap:2.4mm">${"4827".split("").map((d) => `<span class="num" style="width:15mm;height:18mm;border-radius:3mm;background:${C.paper};box-shadow:var(--shadow-raised);display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:600">${d}</span>`).join("")}<span class="ai" style="align-self:flex-end;color:${C.umberDeep};font-size:9px;margin-left:2mm">Beispiel</span></div>
       <ol style="margin-top:8mm;display:flex;flex-direction:column;gap:4mm;list-style:none;font-size:12.5px;line-height:1.5">${["Jede bestätigte Buchung hat einen eigenen vierstelligen Start-Code. Die Kundschaft findet ihn in ihrer Buchung.", "Ab 30 Minuten vor Terminbeginn kannst du ihn in SOMA Pro eingeben: Termin öffnen, „Start-Code eingeben“.", "Mit dem Code beginnt der Termin. Er belegt, dass du da warst – wichtig bei Nichtantreffen und Rückfragen.", "Ohne Code nicht beginnen. Stimmt etwas nicht, melde dich über den Termin bei uns."].map((t, i) => `<li style="display:grid;grid-template-columns:8mm 1fr"><span class="num" style="font-weight:600;color:${C.umberDeep}">0${i + 1}</span><span>${t}</span></li>`).join("")}</ol></div>
       <div class="arch" style="width:66mm;height:82mm;--a:.8"><img src="${L.img.v2("L07-experience-quality")}" style="object-position:55% 40%"></div></div>
     <div class="card" style="margin-top:11mm;padding:6mm 7mm;background:${C.espresso};color:${C.bone}"><div class="eyebrow" style="font-size:9.5px;color:${C.night2}">Am Termin</div>
       <ul style="list-style:none;margin-top:3mm;display:flex;flex-direction:column;gap:2.8mm;font-size:13px;line-height:1.5">${["Pünktlich sein. Wird es knapp, ruf über die Nummer im Termin an (sichtbar, solange der Termin bestätigt ist).", "Zur Begrüßung <i>Sie</i>, bis dir das Du angeboten wird.", "Erst mit dem Start-Code beginnen.", "Den Raum so verlassen, wie du ihn vorgefunden hast."].map((t) => `<li style="display:flex;gap:3mm">${icon("check", 15, C.bone)}<span>${t}</span></li>`).join("")}</ul></div>
     <div class="ai" style="margin-top:3mm;color:${C.umberDeep};font-size:8px;text-align:right">Bild KI-generiert</div></div>`, 4, "Start-Code"),
  // 5 Safety and zero tolerance
  P(`<div style="position:absolute;left:18mm;right:18mm;top:30mm">${h(`Sicherheit. <em>Null Toleranz.</em>`)}
     <div style="margin-top:10mm;border-radius:16px;background:${C.oxblood};color:${C.bone};padding:9mm 9mm 8mm">
       <p class="serif" style="font-size:28px;line-height:1.12">Fühlst du dich bei einem Termin unwohl, darfst du gehen. <em>Melde es uns – wir kümmern uns darum.</em></p></div>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:8mm">
       <div class="card" style="padding:6mm"><div class="h-s">Was die Kundschaft liest</div><p style="font-size:12px;line-height:1.55;color:${C.umberDeep};margin-top:2.5mm">Vor jeder Massagebuchung: „SOMA vermittelt ausschließlich Wellness- und Beautybehandlungen. Anzügliche Anfragen oder Bemerkungen führen zur Sperrung des Kontos.“</p></div>
       <div class="card" style="padding:6mm"><div class="h-s">Was du tun kannst</div><ul style="font-size:12px;line-height:1.55;color:${C.umberDeep};margin-top:2.5mm;padding-left:4mm"><li>Anfragen ablehnen.</li><li>Einen Termin abbrechen, wenn du dich unwohl fühlst.</li><li>„Problem melden“ im Termin – wir prüfen jeden Fall.</li></ul></div></div>
     <h3 style="font-size:15px;font-weight:600;margin-top:10mm">Was SOMA für deine Sicherheit tut</h3>
     <ul style="margin-top:4mm;display:flex;flex-direction:column;gap:2.8mm;font-size:12.5px;line-height:1.5;list-style:none">${["Die Adresse siehst nur du, erst nach der Bestätigung; nach dem Termin wird sie wieder ausgeblendet.", "Kontaktdaten in den Buchungshinweisen werden blockiert – Zahlung und Fristen laufen über SOMA.", "Bezahlt wird ausschließlich online. Kein Bargeld an der Tür.", "Du siehst, wie viele SOMA-Termine eine Kundin oder ein Kunde schon abgeschlossen hat."].map((t) => `<li style="display:flex;gap:3mm">${icon("shield", 15, C.espresso)}<span>${t}</span></li>`).join("")}</ul>
     <p style="font-size:10.5px;color:${C.umberDeep};margin-top:8mm">Die Regel ist vom Auftraggeber freigegeben (1. Nov. 2026); die Formulierung in den AGB prüft der Anwalt (⚖).</p></div>`, 5, "Sicherheit"),
  // 6 Payouts and commission (true facts, worked example with demo prices)
  P(`<div style="position:absolute;left:18mm;right:18mm;top:30mm">${h(`Auszahlung. <em>Fair berechnet.</em>`)}
     ${lead("Keine Grundgebühr. Provision nur auf das, was du über SOMA verdienst – nie auf die Anfahrt. Die Anfahrt geht immer vollständig an dich.")}
     <table style="width:100%;border-collapse:collapse;margin-top:8mm;font-size:13px" class="num">
       <tr style="border-bottom:1.5px solid ${C.espresso}"><th style="text-align:left;padding:2.5mm 0;font-weight:600">Buchung</th><th style="text-align:right;font-weight:600">Provision</th></tr>
       ${[["Neue Kundschaft über SOMA", "20 %"], ["Wiederkehrende Kundschaft (nach einem abgeschlossenen Termin)", "12 %"], ["Eigene Kundschaft über deinen Einladungslink", "5 %"], ["Anfahrtspauschale", "0 %"]].map(([a, b]) => `<tr style="border-bottom:1px solid ${C.oat}"><td style="padding:3mm 0">${a}</td><td style="text-align:right;font-weight:600">${b}</td></tr>`).join("")}</table>
     <div class="card" style="margin-top:8mm;padding:6mm 7mm"><div style="display:flex;justify-content:space-between"><span class="eyebrow" style="font-size:9.5px;color:${C.umberDeep}">Rechenbeispiel · neue Kundschaft</span><span class="ai" style="color:${C.umberDeep};font-size:9px">Beispielpreise</span></div>
       ${[["Shellac-Maniküre (dein Preis)", "46,00 €"], ["Provision 20 %", "−9,20 €"], ["Anfahrt (deine Pauschale)", "8,00 €"]].map(([a, b]) => `<div class="num" style="display:flex;justify-content:space-between;font-size:13px;margin-top:3mm;color:${C.umberDeep}"><span>${a}</span><span>${b}</span></div>`).join("")}
       <div style="border-top:1.5px dashed ${C.stoneDeep};margin:4mm 0 3mm"></div><div class="num" style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:600;font-size:13px">Dein Anteil</span><span style="font-size:24px;font-weight:560;letter-spacing:-.02em">44,80 €</span></div></div>
     <ul style="margin-top:8mm;display:flex;flex-direction:column;gap:2.8mm;font-size:12.5px;line-height:1.5;list-style:none">${["Dein Anteil wird 48 Stunden nach dem Termin verfügbar – so lange kann Kundschaft ein Problem melden (SOMA-Garantie).", "Danach zahlen wir aus; das Geld ist in der Regel in 1–3 Werktagen auf deinem Konto.", "Stornogebühren: Sagt Kundschaft weniger als 24 Stunden vorher ab, fallen 50 % des Behandlungspreises an, unter 2 Stunden oder bei Nichtantreffen der volle Preis plus Anfahrt. Den Großteil davon bekommst du; auch hier gilt die Provision nur auf den Behandlungsanteil.", "Die Aufstellung pro Termin – Betrag, Provision, Anfahrt – findest du unter Einnahmen."].map((t) => `<li style="display:flex;gap:3mm">${icon("euro", 15, C.espresso)}<span>${t}</span></li>`).join("")}</ul></div>`, 6, "Auszahlung"),
  // 7 Back cover
  P(`<div style="position:absolute;inset:0;background:${C.espresso}"></div>
     <div style="position:absolute;left:18mm;top:24mm">${pro(C.bone, 110)}</div>
     <p class="serif" style="position:absolute;left:18mm;right:30mm;top:110mm;font-size:54px;line-height:1;color:${C.bone}">Selbstständig, <em>aber nicht allein.</em></p>
     <p style="position:absolute;left:18mm;right:40mm;top:170mm;font-size:14px;line-height:1.55;color:${C.night2}">Fragen zu Nachweisen, Terminen oder Auszahlungen? Schreib uns an {Support-Adresse} – mit deinem Namen und, wenn es um einen Termin geht, der Buchungsnummer.</p>
     <p style="position:absolute;left:18mm;bottom:14mm;font-size:9px;color:${C.night2}">SOMA vermittelt Termine zwischen selbstständigen Profis und ihrer Kundschaft. Entwurf v1.0 · Stand Nov. 2026 · Verbindlich sind die AGB für Profis.</p>`, 0, "", C.espresso),
];
const css = `${L.UI_CSS}@page{size:A4;margin:0}html,body{width:210mm;height:auto;overflow:visible;background:#fff}
.pg{position:relative;width:210mm;height:297mm;overflow:hidden;page-break-after:always;break-after:page}`;
const doc = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>SOMA Pro · Willkommensmappe</title><style>${L.CSS}${css}</style></head><body>${pages.join("")}</body></html>`;
await L.pdf(doc, path.join(OUT, "soma-pro-willkommensmappe-a4.pdf"));
for (let i = 0; i < pages.length; i++) {
  const one = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${L.CSS}${css}html,body{width:794px;height:1123px;overflow:hidden}</style></head><body>${pages[i]}</body></html>`;
  await L.png(one, path.join(OUT, "pages", `page-${String(i + 1).padStart(2, "0")}.png`), { w: 794, h: 1123, scale: 1.5 });
}
await L.close();
console.log("onboarding done");
