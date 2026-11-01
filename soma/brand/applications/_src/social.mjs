// Social: avatar, 9 Instagram posts (1080×1350), 3 stories (1080×1920), LinkedIn banner (1584×396), grid preview.
import path from "node:path";
import * as L from "./lib.mjs";
const { C, nb } = L;
const OUT = path.join(L.APPS, "social");
const wm = (color, w) => `<div style="width:${w}px">${L.logo("soma-wordmark-micro", color, 'style="width:100%;height:auto"')}</div>`;
const ai = (color = C.umberDeep, t = "Bild KI-generiert") => `<div class="ai" style="color:${color};font-size:22px">${t}</div>`;

// ── Post templates ────────────────────────────────────────────────────────────────────────────
const archFrame = ({ src, pos = "50% 50%", place }) => `
  <div class="arch" style="position:absolute;left:140px;top:110px;width:800px;height:1000px"><img src="${src}" style="object-position:${pos}"></div>
  <div class="place" style="position:absolute;left:140px;top:1132px;width:560px;font-size:20px;line-height:1.4;color:${C.umberDeep}">${L.ortszeile(place)}</div>
  <div style="position:absolute;right:140px;top:1130px">${ai()}</div>
  <div style="position:absolute;left:436px;top:1236px">${wm(C.espresso, 208)}</div>`;
const fullBleed = ({ src, pos, place, head, sub, pro = false, scrim = 0 }) => `
  <img class="cover" src="${src}" style="position:absolute;inset:0;object-position:${pos}">
  ${scrim ? `<div style="position:absolute;left:0;right:0;bottom:0;height:${scrim}px;background:rgb(23 20 18/.62)"></div>` : ""}
  <div style="position:absolute;left:64px;top:64px;display:flex;align-items:flex-end;gap:12px">${wm(C.bone, 150)}${pro ? `<span style="color:${C.bone};font-size:34px;font-weight:560;letter-spacing:-.005em;line-height:1;margin-bottom:-3px">Pro</span>` : ""}</div>
  <div style="position:absolute;left:64px;right:64px;bottom:72px;color:${C.bone}">
    <div class="place" style="font-size:20px;opacity:.95">${L.ortszeile(place)}</div>
    <div class="serif" style="font-size:76px;margin-top:22px;max-width:860px">${head}</div>
    ${sub ? `<div style="font-size:24px;line-height:1.45;margin-top:18px;max-width:780px;opacity:.92">${sub}</div>` : ""}
  </div>
  <div style="position:absolute;right:48px;bottom:30px">${ai(C.bone)}</div>`;
const photoBand = ({ src, pos, place, head }) => `
  <div style="position:absolute;left:0;top:0;width:1080px;height:1000px;overflow:hidden"><img class="cover" src="${src}" style="object-position:${pos}"></div>
  <div style="position:absolute;left:64px;right:64px;top:1048px"><div class="place" style="font-size:19px;color:${C.umberDeep}">${place}</div>
  <div class="serif" style="font-size:68px;margin-top:16px">${head}</div></div>
  <div style="position:absolute;left:64px;bottom:64px">${wm(C.espresso, 130)}</div>
  <div style="position:absolute;right:48px;bottom:30px">${ai()}</div>`;
const sigPost = ({ a, b, place, head }) => `
  <div style="position:absolute;left:64px;top:72px">${wm(C.espresso, 150)}</div>
  <div style="position:absolute;right:64px;top:76px">${ai(C.umberDeep, "Bilder KI-generiert")}</div>
  <div style="position:absolute;left:64px;top:150px">${L.signature({ a, b, w: 460, h: 740, gap: 32, place, placeSize: 20 })}</div>
  <div class="serif" style="position:absolute;left:64px;right:64px;top:1112px;font-size:68px">${head}</div>`;
const typePost = ({ bg = C.bone, head, foot = "", archOutline = true }) => `
  ${archOutline ? `<svg width="132" height="165" viewBox="0 0 800 1000" style="position:absolute;left:64px;top:96px"><path d="M0 1000L0 436.14C0 181 172 0 400 0C628 0 800 181 800 436.14L800 1000" fill="none" stroke="${C.espresso}" stroke-width="12"/></svg>` : ""}
  <div style="position:absolute;left:64px;right:80px;top:${foot ? 330 : 470}px"><div class="serif" style="font-size:${foot ? 124 : 138}px;line-height:.98">${head}</div>${foot}</div>
  <div style="position:absolute;left:64px;bottom:72px">${wm(C.espresso, 150)}</div>`;
const brandMoment = () => `
  <div style="position:absolute;inset:0;background:${C.oxblood}"></div>
  <div style="position:absolute;left:50%;top:330px;transform:translateX(-50%);width:250px">${L.logo("soma-symbol", C.bone, 'style="width:250px;height:auto"')}</div>
  <div class="it" lang="en" style="position:absolute;left:0;right:0;top:820px;text-align:center;color:${C.bone};font-size:86px;line-height:1">Your body. Your place.</div>
  <div style="position:absolute;left:0;right:0;top:940px;text-align:center;color:${C.ox200};font-size:24px;letter-spacing:.01em">Beauty &amp; Wellness. Bei dir.</div>
  <div style="position:absolute;left:436px;top:1220px">${wm(C.bone, 208)}</div>`;
const pair = ({ a, b, head }) => `
  <div style="position:absolute;left:64px;right:64px;top:80px" class="serif"><span style="font-size:70px;white-space:nowrap">${head}</span></div>
  <div class="arch" style="position:absolute;left:64px;top:270px;width:460px;height:640px;--a:.71875"><img src="${a.src}" style="object-position:${a.pos}"></div>
  <div class="arch" style="position:absolute;left:556px;top:${270 + Math.round(0.18 * 460)}px;width:460px;height:640px;--a:.71875"><img src="${b.src}" style="object-position:${b.pos}"></div>
  <div class="place" style="position:absolute;left:64px;top:934px;width:440px;font-size:17px;color:${C.umberDeep};line-height:1.5">${L.ortszeile(a.place)}</div>
  <div class="place" style="position:absolute;left:556px;top:${934 + Math.round(0.18 * 460)}px;width:440px;font-size:17px;color:${C.umberDeep};line-height:1.5">${L.ortszeile(b.place)}</div>
  <div style="position:absolute;left:64px;bottom:72px">${wm(C.espresso, 150)}</div>
  <div style="position:absolute;right:48px;bottom:30px">${ai()}</div>`;
const truthCard = `<div style="margin-top:72px;width:720px;background:${C.paper};border-radius:16px;box-shadow:var(--shadow-raised);padding:30px 34px">
  <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:22px;color:${C.umberDeep}"><span>Shellac-Maniküre · 60${nb}Min.</span><span class="num">46,00${nb}€</span></div>
  <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:22px;color:${C.umberDeep};margin-top:12px"><span>Anfahrt</span><span class="num">8,00${nb}€</span></div>
  <div style="border-top:2px dashed ${C.stoneDeep};margin:22px 0 18px"></div>
  <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:22px;font-weight:600">Endpreis inkl. Anfahrt</span><span class="num" style="font-size:44px;font-weight:560;letter-spacing:-.02em">54${nb}€</span></div>
  <div style="margin-top:16px;font-size:19px;color:${C.success};display:flex;gap:10px;align-items:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${C.success}" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>Kostenlos stornierbar bis Mi., 12.${nb}Nov.? </div></div>`;

const posts = [
  ["01-hotel", fullBleed({ src: L.img.v2("E04-hotel"), pos: "62% 50%", place: `Hotelsuite, 6.${nb}Stock · Frankfurt-Westend · 21:10`, head: `Zimmer 614, 21:10${nb}Uhr.`, scrim: 330 })],
  ["02-signature", typePost({ head: `Du bleibst. <em>Dein Profi kommt.</em>`, foot: `<div style="margin-top:48px;font-size:32px;line-height:1.45;color:${C.umberDeep};max-width:760px">Geprüfte Profis für Massage, Nägel, Kosmetik, Haare und Make-up kommen zu dir – nach Hause, ins Hotel oder ins Büro.</div>` })],
  ["03-evening", sigPost({ a: { src: L.img.v2("E01-arrival"), pos: "60% 50%" }, b: { src: L.img.v2("E03-after"), pos: "26% 50%" }, place: `Wohnungstür, 4.${nb}OG · Berlin-Prenzlauer Berg · 19:25`, head: `19:25 an der Tür. <em>20:10 auf dem Sofa.</em>` })],
  ["04-after", archFrame({ src: L.img.v2("L05-experience-comfort"), pos: "40% 60%", place: `Sofa, danach · München-Schwabing · 20:20` })],
  ["05-brand", brandMoment()],
  ["06-kit", photoBand({ src: L.img.v2("E06-details"), pos: "50% 45%", place: "Was mitkommt", head: `Liege, Öl und Tücher <em>kommen mit.</em>` })],
  ["07-places", pair({ head: `Zu Hause. Im Hotel. <em>Im Büro.</em>`, a: { src: L.img.v2("L06-experience-privacy"), pos: "60% 50%", place: `Altbau, 3.${nb}OG · Berlin · 19:30` }, b: { src: L.img.v2("L09-experience-flexible"), pos: "70% 45%", place: `Besprechungsraum · Hamburg-HafenCity · 13:00` } })],
  ["08-price", typePost({ bg: C.stone, archOutline: false, head: `Der Endpreis steht, <em>bevor du buchst.</em>` })],
  ["09-pro", fullBleed({ src: L.img.v2("E07-provider-cta"), pos: "70% 50%", place: `Treppenhaus, 2.${nb}OG · Berlin-Neukölln · 17:40`, head: `Selbstständig, <em>aber nicht allein.</em>`, pro: true })],
];
// Post 08 carries a real-UI price card with demo values (labelled).
posts[7][1] = typePost({ archOutline: false, head: `Der Endpreis steht, <em>bevor du buchst.</em>`, foot: truthCard.replace(`Kostenlos stornierbar bis Mi., 12.${nb}Nov.? `, `Kostenlos stornierbar bis Mi., 11.${nb}Nov., 18:30${nb}Uhr`) + `<div class="ai" style="margin-top:18px;color:${C.umberDeep};font-size:20px">Beispielpreise. In der App kommen alle Werte aus deiner Suche.</div>` });
const bgFor = { "08-price": C.stone };
for (const [name, body] of posts) {
  await L.png(L.page(`<div style="position:relative;width:1080px;height:1350px;overflow:hidden">${body}</div>`, { w: 1080, h: 1350, bg: bgFor[name] ?? C.bone }), path.join(OUT, "instagram", `post-${name}.png`), { w: 1080, h: 1350 });
}

// ── Stories (safe zones: top 250, bottom 340) ─────────────────────────────────────────────────
const stories = [
  ["01-tagline", `<img class="cover" src="${L.img.v2("L02-hero-mobile")}" style="position:absolute;inset:0;object-position:50% 70%">
    <div style="position:absolute;left:72px;top:270px">${wm(C.bone, 180)}</div>
    <div class="it" lang="en" style="position:absolute;left:72px;right:72px;top:420px;color:${C.bone};font-size:104px;line-height:1">Your body.<br>Your place.</div>
    <div style="position:absolute;left:72px;top:660px;color:${C.bone};font-size:30px;opacity:.92">Beauty &amp; Wellness. Bei dir.</div>
    <div style="position:absolute;left:0;right:0;bottom:380px;display:flex;justify-content:center"><span class="btn" style="background:${C.bone};color:${C.espresso};height:88px;padding:0 44px;font-size:30px">Freie Termine finden</span></div>
    <div style="position:absolute;right:56px;bottom:300px">${ai(C.bone)}</div>`, C.espresso],
  ["02-verified", `<div style="position:absolute;left:170px;top:262px">${wm(C.espresso, 150)}</div>
    <div class="arch" style="position:absolute;left:170px;top:330px;width:740px;height:900px"><img src="${L.img.v2("L07-experience-quality")}" style="object-position:55% 40%"></div>
    <div class="place" style="position:absolute;left:170px;top:1250px;font-size:20px;color:${C.umberDeep}">${L.ortszeile(`Wohnungstür, 2.${nb}OG · Köln-Ehrenfeld · 18:55`)}</div>
    <div style="position:absolute;right:170px;top:1248px">${ai()}</div>
    <div class="serif" style="position:absolute;left:72px;right:72px;top:1330px;font-size:84px;text-align:center">Geprüft, <em>bevor es klingelt.</em></div>
    <div style="position:absolute;left:110px;right:110px;top:1462px;text-align:center;font-size:27px;line-height:1.5;color:${C.umberDeep}">Ausweis, Gewerbeanmeldung, Berufshaftpflicht – und je nach Kategorie ein Qualifikations&shy;nachweis.</div>`, C.bone],
  ["03-startcode", `<div style="position:absolute;left:72px;top:290px">${wm(C.espresso, 160)}</div>
    <div class="serif" style="position:absolute;left:72px;right:72px;top:470px;font-size:100px">Vier Ziffern. <em>Dann beginnt dein Termin.</em></div>
    <div style="position:absolute;left:72px;top:900px;font-size:22px" class="eyebrow"><span style="color:${C.umberDeep};font-size:20px">Dein Start-Code</span></div>
    <div style="position:absolute;left:72px;top:960px;display:flex;gap:22px">${"4827".split("").map((d) => `<span class="num" style="width:180px;height:220px;border-radius:24px;background:${C.paper};box-shadow:var(--shadow-raised);display:flex;align-items:center;justify-content:center;font-size:120px;font-weight:600;letter-spacing:-.02em">${d}</span>`).join("")}</div>
    <div style="position:absolute;left:72px;right:120px;top:1240px;font-size:30px;line-height:1.5;color:${C.umberDeep}">Nenn ihn deinem Profi an der Tür. Erst mit dem Code beginnt der Termin – so weißt du, dass die richtige Person vor dir steht.</div>
    <div class="ai" style="position:absolute;left:72px;bottom:300px;color:${C.umberDeep};font-size:22px">Beispielcode</div>`, C.bone],
];
for (const [name, body, bg] of stories) {
  await L.png(L.page(`<div style="position:relative;width:1080px;height:1920px;overflow:hidden">${body}</div>`, { w: 1080, h: 1920, bg }), path.join(OUT, "stories", `story-${name}.png`), { w: 1080, h: 1920 });
}

// ── Avatar and LinkedIn banner ────────────────────────────────────────────────────────────────
await L.png(L.page(`<div style="width:1080px;height:1080px;background:${C.oxblood};display:flex;align-items:center;justify-content:center"><div style="width:330px;margin-top:-6px">${L.logo("soma-symbol", C.bone, 'style="width:330px;height:auto"')}</div></div>`, { w: 1080, h: 1080 }), path.join(OUT, "avatar-1080.png"), { w: 1080, h: 1080 });
await L.png(L.page(`<div style="position:relative;width:1584px;height:396px;background:${C.bone};overflow:hidden">
  <div style="position:absolute;left:420px;top:92px"><div class="serif" style="font-size:58px">Du bleibst. <em>Dein Profi kommt.</em></div>
  <div style="font-size:21px;color:${C.umberDeep};margin-top:16px">Beauty &amp; Wellness bei dir zu Hause, im Hotel und im Büro.</div></div>
  <div class="arch" style="position:absolute;left:1216px;top:36px;width:150px;height:360px;--a:.4167"><img src="${L.img.v2("L01-hero-wide")}" style="object-position:72% 50%"></div>
  <div class="arch" style="position:absolute;left:1392px;top:${36 + 27}px;width:150px;height:360px;--a:.4167"><img src="${L.img.v2("E04-hotel")}" style="object-position:66% 50%"></div>
  <div class="ai" style="position:absolute;left:420px;bottom:26px;color:${C.umberDeep};font-size:15px">Bilder KI-generiert</div></div>`, { w: 1584, h: 396 }), path.join(OUT, "linkedin-banner-1584x396.png"), { w: 1584, h: 396 });
await L.close();
console.log("social done");
