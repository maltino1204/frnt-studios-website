// iOS and Android home-screen mockups (light/dark), store icons and a board → brand/applications/app-icons/
import path from "node:path";
import * as L from "./lib.mjs";
const OUT = path.join(L.APPS, "app-icons");
const ICON = {
  ios: L.img.asset("icons/ios/AppIcon-1024.png"), iosDark: L.img.asset("icons/ios/AppIcon-1024-dark.png"), iosTinted: L.img.asset("icons/ios/AppIcon-1024-tinted.png"),
  play: L.img.asset("icons/android/play-store-512.png"), adaptive: L.img.asset("icons/android/mipmap-xxxhdpi/ic_launcher.png"),
  fg: L.img.asset("icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png"), mono: L.img.asset("icons/android/mipmap-xxxhdpi/ic_launcher_monochrome.png"),
};
// Neutral stand-ins for other apps: flat colours + a simple glyph (no real brands).
const OTHERS = ["#3E6A8A", "#E2A63A", "#2F7D5B", "#C9573E", "#6C5C7E", "#1D1D1F", "#F2F2F2", "#4A84E8", "#E8445A", "#5AC2F0", "#8E8E93", "#7A9A4A", "#B5835A", "#334155", "#D9B44A", "#9C6ADE"];
const glyph = (i, fg) => ["<circle cx='30' cy='30' r='11' fill='none' stroke='" + fg + "' stroke-width='3'/>", "<rect x='19' y='19' width='22' height='22' rx='5' fill='" + fg + "'/>", "<path d='M18 40 30 18 42 40Z' fill='" + fg + "'/>", "<path d='M18 30h24M30 18v24' stroke='" + fg + "' stroke-width='3.5' stroke-linecap='round'/>"][i % 4];
const other = (i, size, shape) => { const bg = OTHERS[i % OTHERS.length]; const fg = bg === "#F2F2F2" ? "#8E8E93" : "#FFFFFF";
  return `<svg width="${size}" height="${size}" viewBox="0 0 60 60" style="display:block;border-radius:${shape === "circle" ? "50%" : "22.4%"};background:${bg}">${glyph(i, fg)}</svg>`; };

function phone({ os, dark, wallpaper, somaIcon, themed = false }) {
  const W = 393, H = 852, I = 62, gapX = (W - 2 * 28 - 4 * I) / 3;
  const shape = os === "ios" ? "squircle" : "circle";
  const label = dark ? "#F5F5F7" : "#FFFFFF";
  let tiles = "";
  for (let i = 0; i < 20; i++) {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 28 + col * (I + gapX), y = (os === "ios" ? 92 : 140) + row * (I + 30);
    const isSoma = i === 9;
    const tint = themed ? "background:#2B2B26" : "";
    const iconHtml = isSoma
      ? (themed ? `<div style="width:${I}px;height:${I}px;border-radius:50%;background:#3A3830;display:flex;align-items:center;justify-content:center"><div style="height:${Math.round(I * 0.5)}px;width:${Math.round(I * 0.5 * 472 / 724)}px">${L.logo("soma-symbol", "#E9E4D0", 'style="width:100%;height:100%"')}</div></div>`
        : `<img src="${somaIcon}" style="width:${I}px;height:${I}px;display:block;border-radius:${shape === "circle" ? "50%" : "22.4%"}">`)
      : themed ? `<div style="width:${I}px;height:${I}px;border-radius:50%;background:#3A3830;display:flex;align-items:center;justify-content:center;opacity:.95"><svg width="30" height="30" viewBox="0 0 60 60">${glyph(i, "#E9E4D0")}</svg></div>` : other(i, I, shape);
    tiles += `<div style="position:absolute;left:${x}px;top:${y}px;width:${I}px;text-align:center">${iconHtml}<div style="margin-top:6px;font-size:11.5px;color:${label};font-weight:${isSoma ? 560 : 450};text-shadow:0 1px 2px rgb(0 0 0/.25);letter-spacing:.01em">${isSoma ? "SOMA" : "App"}</div></div>`;
  }
  let dock = "";
  if (os === "ios") {
    dock = `<div style="position:absolute;left:14px;right:14px;bottom:24px;height:96px;border-radius:36px;background:${dark ? "rgb(40 38 36/.55)" : "rgb(255 255 255/.32)"};backdrop-filter:blur(20px)">` +
      [12, 13, 14, 15].map((k, j) => `<div style="position:absolute;top:17px;left:${16 + j * ((W - 28 - 32 - I) / 3)}px">${other(k, I, shape)}</div>`).join("") + `</div>`;
  } else {
    dock = `<div style="position:absolute;left:20px;right:20px;bottom:40px;height:52px;border-radius:26px;background:${dark ? "#2B2A26" : "rgb(255 255 255/.85)"};display:flex;align-items:center;padding:0 18px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${dark ? "#C9C4B5" : "#5E554D"}" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></div>
      <div style="position:absolute;bottom:108px;left:28px;right:28px;display:flex;justify-content:space-between">${[12, 13, 14, 15].map((k) => themed ? `<div style="width:${I}px;height:${I}px;border-radius:50%;background:#3A3830;display:flex;align-items:center;justify-content:center"><svg width="30" height="30" viewBox="0 0 60 60">${glyph(k, "#E9E4D0")}</svg></div>` : other(k, I, "circle")).join("")}</div>`;
  }
  const status = os === "ios"
    ? `<div style="position:absolute;top:0;left:0;right:0;height:54px;display:flex;justify-content:space-between;align-items:center;padding:0 34px 0 44px;color:${label};font-weight:600;font-size:16px"><span class="num">9:41</span><span style="display:flex;gap:6px;align-items:center"><svg width="18" height="11"><rect x="0" y="7" width="3" height="4" rx="1" fill="${label}"/><rect x="5" y="5" width="3" height="6" rx="1" fill="${label}"/><rect x="10" y="2" width="3" height="9" rx="1" fill="${label}"/><rect x="15" y="0" width="3" height="11" rx="1" fill="${label}"/></svg><svg width="26" height="12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="${label}" opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="2" fill="${label}"/></svg></span></div>
       <div style="position:absolute;top:11px;left:50%;transform:translateX(-50%);width:124px;height:36px;border-radius:20px;background:#000"></div>`
    : `<div style="position:absolute;top:0;left:0;right:0;height:40px;display:flex;justify-content:space-between;align-items:center;padding:0 24px;color:${label};font-size:14px;font-weight:500"><span class="num">9:41</span><span>● ▲ ▮</span></div>
       <div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);width:14px;height:14px;border-radius:50%;background:#000"></div>
       <div style="position:absolute;top:62px;left:28px;color:${label};"><div class="num" style="font-size:44px;font-weight:400;letter-spacing:-.02em">So., 1. Nov.</div></div>`;
  const shade = dark ? "linear-gradient(rgb(23 20 18/.35),rgb(23 20 18/.35))," : "";
  return `<div style="position:relative;width:${W}px;height:${H}px;border-radius:${os === "ios" ? 54 : 40}px;overflow:hidden;background:${shade}url('${wallpaper}') center/cover;box-shadow:0 0 0 10px #1A1816,0 0 0 11px #3B3531,0 40px 80px -30px rgb(23 20 18/.5)">${status}${tiles}${dock}
    <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:134px;height:5px;border-radius:3px;background:${label};opacity:.85"></div></div>`;
}

const css = `body{display:flex;align-items:center;justify-content:center}`;
const variants = [
  ["ios-home-light", { os: "ios", dark: false, wallpaper: L.img.v2("L10-app-home"), somaIcon: ICON.ios }],
  ["ios-home-dark", { os: "ios", dark: true, wallpaper: L.img.v2("L01-hero-wide"), somaIcon: ICON.iosDark }],
  ["android-home-light", { os: "android", dark: false, wallpaper: L.img.v2("L09-experience-flexible"), somaIcon: ICON.adaptive }],
  ["android-home-themed-dark", { os: "android", dark: true, wallpaper: L.img.v2("E04-hotel"), somaIcon: ICON.adaptive, themed: true }],
];
for (const [name, v] of variants) {
  await L.png(L.page(phone(v), { w: 433, h: 892, css, bg: L.C.bone }), path.join(OUT, name + ".png"), { w: 433, h: 892, scale: 2 });
}

// Board: four phones + store icons, labelled honestly (PWA today; native apps not built).
const board = `<div style="padding:72px 80px">
  <div class="eyebrow" style="color:${L.C.umberDeep}">Anwendung · App-Icon</div>
  <h1 class="serif" style="font-size:64px;margin:14px 0 10px">Das S auf dem Home-Bildschirm.</h1>
  <p style="font-size:18px;line-height:1.5;color:${L.C.umberDeep};max-width:980px">Bone-S auf Oxblood: der sichtbarste Oxblood-Moment der Marke. Heute als Web-App-Icon (PWA, „Zum Home-Bildschirm“). Native iOS- und Android-Apps sind <b>nicht gebaut</b>; die Store-Icons rechts sind vorbereitete Assets.</p>
  <div style="display:flex;gap:58px;margin-top:56px;align-items:flex-start">
    ${variants.map(([n, v], i) => `<figure style="width:393px"><div style="transform:scale(.86);transform-origin:top left;width:393px;height:733px">${phone(v)}</div><figcaption class="place" style="margin-top:22px;color:${L.C.umberDeep}">${["iOS · hell", "iOS · dunkel (Dark-Variante)", "Android · hell (adaptiv)", "Android · Themed Icons (monochrom)"][i]}</figcaption></figure>`).join("")}
    <div style="width:360px;display:flex;flex-direction:column;gap:36px">
      <div><img src="${ICON.ios}" style="width:200px;height:200px;border-radius:44.8px;display:block;box-shadow:var(--shadow-float)"><div class="place" style="margin-top:16px;color:${L.C.umberDeep}">App Store · 1024 × 1024</div><p style="font-size:14px;color:${L.C.umberDeep};margin-top:6px;line-height:1.45">AppIcon-1024.png · Dark und Tinted liegen bei (iOS 18).</p></div>
      <div style="display:flex;gap:20px"><img src="${ICON.iosDark}" style="width:96px;height:96px;border-radius:21.5px"><img src="${ICON.iosTinted}" style="width:96px;height:96px;border-radius:21.5px"></div>
      <div><img src="${ICON.play}" style="width:200px;height:200px;border-radius:20%;display:block;box-shadow:var(--shadow-float)"><div class="place" style="margin-top:16px;color:${L.C.umberDeep}">Google Play · 512 × 512</div><p style="font-size:14px;color:${L.C.umberDeep};margin-top:6px;line-height:1.45">play-store-512.png · adaptives Icon mit Vorder-, Hinter- und Monochrom-Ebene.</p></div>
    </div>
  </div></div>`;
await L.png(L.page(board, { w: 2400, h: 1140 }), path.join(OUT, "app-icons-board.png"), { w: 2400, h: 1140 });
await L.close();
console.log("app-icons done");
