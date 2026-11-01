// Renders the typeface comparison specimens (German copy) to brand/assets/typography/*.png.
// Fonts: latin subsets from the Google Fonts CSS API, cached in /tmp/soma-fonts by fetch-fonts.mjs.
import { shot, closeBrowser, fontFaces } from "./lib/shot.mjs";
const OUT = new URL("../assets/typography/", import.meta.url).pathname;
const C = { bone: "#F3EFE8", stone: "#D8CFC3", espresso: "#25211F", ink2: "#5E554D", oxblood: "#542C35" };

const DISPLAY = [
  { id: "newsreader", fam: "Newsreader", css: "font-variation-settings:'opsz' 72; font-weight:400", note: "Production Type · OFL · opsz 6–72, wght 200–800, roman + italic · latin static display cut 21 KB" },
  { id: "bodonimoda", fam: "Bodoni Moda", css: "font-variation-settings:'opsz' 96; font-weight:400", note: "Owen Earl · OFL · opsz 6–96, wght 400–900 · latin variable 45 KB" },
  { id: "fraunces", fam: "Fraunces", css: "font-variation-settings:'opsz' 144,'SOFT' 0,'WONK' 0; font-weight:380", note: "Undercase Type · OFL · opsz/wght/SOFT/WONK · latin variable 118 KB" },
  { id: "gloock", fam: "Gloock", css: "font-weight:400", note: "Duarte Pinto · OFL · one weight, no italic · latin 26 KB" },
  { id: "instrumentserif", fam: "Instrument Serif", css: "font-weight:400", note: "Instrument · OFL · one weight + italic · latin 21 KB" },
  { id: "notoserifdisplay", fam: "Noto Serif Display", css: "font-weight:400; font-stretch:100%", note: "Google · OFL · wdth/wght, Latin/Greek/Cyrillic · latin variable 75 KB" },
];
const UI = [
  { id: "inter", fam: "Inter", css: "font-variation-settings:'opsz' 16", note: "rsms · OFL · opsz 14–32 · latin variable 71 KB" },
  { id: "instrumentsans", fam: "Instrument Sans", css: "font-stretch:100%", note: "Instrument · OFL · wdth 75–100, wght 400–700 · latin variable 56 KB" },
  { id: "hankengrotesk", fam: "Hanken Grotesk", css: "", note: "Hanken Design Co. · OFL · wght 100–900 · latin variable 34 KB" },
  { id: "geist", fam: "Geist", css: "", note: "Vercel · OFL · wght 100–900 · latin variable 29 KB" },
  { id: "manrope", fam: "Manrope", css: "", note: "Mikhail Sharanda · OFL · wght 200–800 · latin variable 24 KB" },
  { id: "schibstedgrotesk", fam: "Schibsted Grotesk", css: "", note: "Bakken & Bæck · OFL · wght 400–900 · latin variable 46 KB" },
];
const base = (faces, extra = "") => `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${faces}
*{box-sizing:border-box;margin:0}body{background:${C.bone};color:${C.espresso};padding:56px 64px;font:14px/1.4 "Instrument Sans",sans-serif}
.lab{font:500 11px/1.3 "Instrument Sans",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${C.ink2}}
.note{font:400 12px/1.4 "Instrument Sans",sans-serif;color:${C.ink2};margin-top:4px}
.row{display:grid;grid-template-columns:220px 1fr;gap:32px;padding:28px 0;border-top:1px solid ${C.stone}}
h1.t{font:400 30px/1.1 Newsreader;margin-bottom:6px;font-variation-settings:'opsz' 72}
${extra}</style></head><body>`;

async function displaySheet() {
  const rows = DISPLAY.map((d) => `<div class="row"><div><div class="lab">${d.fam}</div><div class="note">${d.note}</div></div>
  <div style="font-family:'${d.fam}';${d.css}">
    <div style="font-size:64px;line-height:1.02;letter-spacing:-0.02em">Du bleibst. <i>Dein Profi kommt.</i></div>
    <div style="display:flex;gap:40px;align-items:baseline;margin-top:14px">
      <div style="font-size:34px;letter-spacing:-0.01em" lang="en">Your body. Your place.</div>
      <div style="font-size:34px">Gesichts&shy;behandlung</div>
      <div style="font-size:34px">Ä Ö Ü ß „84&nbsp;€“ 14:30&nbsp;Uhr</div>
    </div>
    <div style="font-size:19px;line-height:1.45;max-width:760px;margin-top:12px">Wärme, Ruhe, Hände, die wissen, was sie tun: Die Massage findet bei dir zu Hause statt, im Hotel oder im Büro.</div>
  </div></div>`).join("");
  const html = base(fontFaces([...DISPLAY.map((d) => d.id), "instrumentsans"])) + `<h1 class="t">Display-Kandidaten</h1><div class="note">Gleicher Text, gleiche Größe (64 / 34 / 19 px), Bone #F3EFE8 / Espresso #25211F. Kursive dort, wo die Schrift eine hat.</div>${rows}</body></html>`;
  await shot(html, OUT + "display-candidates.png", { width: 1500 });
}

async function uiSheet() {
  const rows = UI.map((d) => `<div class="row"><div><div class="lab">${d.fam}</div><div class="note">${d.note}</div></div>
  <div style="font-family:'${d.fam}';${d.css}">
    <div style="font-size:16px;line-height:1.55;max-width:640px">Dein Profi bringt Liege, Öle und frische Handtücher mit. Du brauchst nur zwei Quadratmeter Platz. Kostenlos stornierbar bis Do., 13. Nov., 14:30&nbsp;Uhr.</div>
    <div style="display:flex;gap:10px;margin-top:14px;align-items:center;font-size:15px;font-weight:520">
      <span style="background:${C.espresso};color:${C.bone};padding:11px 20px;border-radius:999px">Zahlungspflichtig buchen · 84&nbsp;€</span>
      <span style="border:1px solid #8C8075;padding:10px 16px;border-radius:999px">Wimpernverlängerung</span>
      <span style="border:1px solid #8C8075;padding:10px 16px;border-radius:999px">Gesichtsbehandlung</span>
      <span style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;font-weight:600">Heute · Fr., 14. Nov.</span>
    </div>
    <div style="display:flex;gap:28px;margin-top:14px;align-items:baseline;font-feature-settings:'tnum' 1">
      <span style="font-size:32px;font-weight:560;letter-spacing:-0.02em">1.284,50&nbsp;€</span>
      <span style="font-size:15px">09:00 · 11:30 · 14:30 · 18:00</span>
      <span style="font-size:15px">Größe ÄÖÜ äöü ß ẞ „Zitat“ – 4,9 · 60&nbsp;Min.</span>
    </div>
    <div style="font-size:12px;margin-top:8px;color:${C.ink2}">12 px Hinweis: Anfahrt inklusive. Endpreis, keine Servicegebühr. 0123456789</div>
  </div></div>`).join("");
  const html = base(fontFaces([...UI.map((d) => d.id), "newsreader"])) + `<h1 class="t">UI-Kandidaten</h1><div class="note">Fließtext 16 px, Labels 15 px / 520, Zahlen mit tabellarischen Ziffern (tnum), Hinweis 12 px.</div>${rows}</body></html>`;
  await shot(html, OUT + "ui-candidates.png", { width: 1500 });
}

export async function pairingSheet() {
  const html = base(fontFaces(["newsreader", "instrumentsans"]), `
  .d{font-family:Newsreader;font-variation-settings:'opsz' 72;font-weight:400}
  .u{font-family:'Instrument Sans'}
  `) + `
  <div class="lab">SOMA Schriftpaar · Newsreader (Display) + Instrument Sans (UI)</div>
  <div class="d" style="font-size:96px;line-height:.98;letter-spacing:-0.025em;margin-top:28px">Massage, <i>bei dir</i><br>zu Hause.</div>
  <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:64px;margin-top:40px">
    <div>
      <div class="u" style="font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:${C.oxblood}">Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10</div>
      <div class="d" style="font-size:40px;line-height:1.08;letter-spacing:-0.015em;margin-top:14px">Du bleibst. <i>Dein Profi kommt.</i></div>
      <div class="u" style="font-size:19px;line-height:1.55;margin-top:16px;max-width:560px">Geprüfte Profis für Massage, Nägel, Kosmetik, Haare und Make-up kommen zu dir – nach Hause, ins Hotel oder ins Büro.</div>
      <div class="u" style="font-size:16px;line-height:1.55;margin-top:14px;max-width:560px;color:${C.ink2}">Gesichtsbehandlung, Wimpernverlängerung, Fußpflege: Lange Wörter brechen sauber um. Dein Endpreis enthält die Anfahrt.</div>
    </div>
    <div class="u">
      <div style="background:#FBF9F5;border-radius:20px;padding:24px;box-shadow:0 0 0 1px rgb(37 33 31/.08),0 8px 24px -12px rgb(37 33 31/.18)">
        <div style="font-size:13px;font-weight:600;color:${C.ink2}">Klassische Massage · 60&nbsp;Min.</div>
        <div class="d" style="font-size:30px;margin-top:6px">Lea Hoffmann</div>
        <div style="display:flex;gap:8px;margin-top:16px;font-size:15px;font-weight:520;font-feature-settings:'tnum' 1">
          ${["09:00", "11:30", "14:30", "18:00"].map((t, i) => `<span style="padding:10px 14px;border-radius:12px;${i === 2 ? `background:${C.espresso};color:${C.bone}` : "box-shadow:inset 0 0 0 1px #8C8075"}">${t}</span>`).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:20px;border-top:1px dashed #BDB3A7;padding-top:14px;font-feature-settings:'tnum' 1">
          <span style="font-size:15px">Endpreis inkl. Anfahrt</span><span style="font-size:28px;font-weight:600;letter-spacing:-0.02em">84&nbsp;€</span>
        </div>
        <div style="margin-top:16px;background:${C.oxblood};color:${C.bone};border-radius:999px;text-align:center;padding:15px;font-size:16px;font-weight:560">Zahlungspflichtig buchen · 84&nbsp;€</div>
        <div style="font-size:12px;color:${C.ink2};margin-top:10px;text-align:center">Kostenlos stornierbar bis Do., 13.&nbsp;Nov., 14:30&nbsp;Uhr</div>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:44px;border-top:1px solid ${C.stone};padding-top:24px">
    <div><div class="lab">Display · Newsreader opsz 72</div><div class="d" style="font-size:44px;margin-top:8px">Aa Ää Öö Üü ß<br><i>Aa Ää Öö Üü ß</i></div></div>
    <div><div class="lab">UI · Instrument Sans 400–600</div><div class="u" style="font-size:30px;margin-top:8px;line-height:1.3">Aa Ää Öö Üü ß ẞ<br><b style="font-weight:600">„84&nbsp;€“ 14:30&nbsp;Uhr</b></div></div>
    <div><div class="lab">Ziffern · tabellarisch</div><div class="u" style="font-size:30px;margin-top:8px;line-height:1.3;font-feature-settings:'tnum' 1">0123456789<br>1.284,50&nbsp;€ · 4,9</div></div>
  </div>
  <div class="u" style="margin-top:28px;font-size:12px;color:${C.ink2}">Instrument Sans wdth 86 für lange Labels: <span style="font-stretch:86%;font-size:15px;font-weight:520;color:${C.espresso}">Wimpernverlängerung · Gesichtsbehandlung · Haare &amp; Styling</span></div>
  </body></html>`;
  await shot(html, OUT + "pairing-newsreader-instrument-sans.png", { width: 1440 });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await displaySheet();
  await uiSheet();
  await pairingSheet();
  await closeBrowser();
}
