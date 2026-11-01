// Motion specimen (self-contained HTML, replayable, honours prefers-reduced-motion) + storyboards captured from it.
import fs from "node:fs";
import path from "node:path";
import * as L from "./lib.mjs";
const { C } = L;
const OUT = path.join(L.APPS, "motion");
const sym = fs.readFileSync(path.join(L.SOMA, "brand/assets/logo/final/soma-symbol.svg"), "utf8");
const pathById = (id) => new RegExp(`id="${id}"\\s+d="([^"]+)"`).exec(sym)?.[1];
const sPath = pathById("symbol-s");
const oRing = pathById("symbol-o");            // the O as a ring (outer + inner contour)
const oOuter = oRing ? oRing.split("Z")[0] + "Z" : null;
if (!sPath || !oRing) throw new Error("symbol paths not found");
const vb = /viewBox="([^"]+)"/.exec(sym)[1];
const wmSvg = L.logo("soma-wordmark", C.espresso, 'class="wm" style="width:420px;height:auto"');
const tagSvg = L.logo("soma-lockup-tagline", C.espresso, 'class="tag" style="width:420px;height:auto"');

const TOKENS = `
  --dur-instant:100ms; --dur-fast:160ms; --dur-base:220ms; --dur-slow:320ms; --dur-arrive:480ms; --dur-calm:640ms; --dur-reveal:900ms;
  --ease-standard:cubic-bezier(.2,0,0,1); --ease-arrive:cubic-bezier(.16,1,.3,1); --ease-settle:cubic-bezier(.22,1,.36,1); --ease-exit:cubic-bezier(.4,0,1,1); --ease-calm:cubic-bezier(.4,0,.2,1);
  --stagger:90ms; --rise:16px; --rise-s:8px;`;
const css = `
:root{${TOKENS}}
body{padding:56px 64px;background:${C.bone}}
h1{margin:10px 0 8px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:48px;margin-top:40px}
.stage{position:relative;height:520px;border-radius:24px;background:${C.paper};box-shadow:var(--shadow-raised);overflow:hidden;display:flex;align-items:center;justify-content:center}
.cap{margin-top:16px;font-size:14px;line-height:1.5;color:${C.umberDeep}}
.cap b{color:${C.espresso};font-weight:600}
/* 1 · Arch rise: the arch crop reveals bottom-up; the photo settles inside and stops */
.arch-rise{width:300px;height:375px;border-radius:50% 50% 0 0 / 43.6% 43.6% 0 0;overflow:hidden;
  animation:arch-clip var(--dur-calm) var(--ease-arrive) both, arch-lift var(--dur-calm) var(--ease-arrive) both}
.arch-rise img{width:100%;height:100%;object-fit:cover;display:block;animation:img-settle var(--dur-reveal) var(--ease-settle) both}
.place-l{position:absolute;left:calc(50% - 150px);bottom:44px;animation:fade-rise var(--dur-arrive) var(--ease-arrive) both;animation-delay:calc(var(--dur-calm) - 160ms)}
@keyframes arch-clip{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes arch-lift{from{transform:translateY(var(--rise));opacity:0}to{transform:none;opacity:1}}
@keyframes img-settle{from{transform:scale(1.04)}to{transform:none}}
@keyframes fade-rise{from{opacity:0;transform:translateY(var(--rise-s))}to{opacity:1;transform:none}}
/* 2 · The S draws on: the arch outline traces, the S contour traces inside it, then the fill arrives and the stroke leaves */
.s-draw{width:300px;height:375px;overflow:visible}
.s-draw .o-o{fill:none;stroke:${C.bone};stroke-width:8;stroke-dasharray:1;stroke-dashoffset:1;animation:draw var(--dur-calm) var(--ease-arrive) both, fade-out var(--dur-base) var(--ease-exit) both;animation-delay:0ms, calc(var(--dur-calm) * 1.5)}
.s-draw .o-f{fill:${C.bone};fill-rule:evenodd;opacity:0;animation:fade-in var(--dur-base) var(--ease-standard) both;animation-delay:calc(var(--dur-calm) * 1.35)}
.s-draw .s-o{fill:none;stroke:${C.bone};stroke-width:10;stroke-dasharray:1;stroke-dashoffset:1;animation:draw var(--dur-calm) var(--ease-arrive) both, fade-out var(--dur-base) var(--ease-exit) both;animation-delay:calc(var(--dur-calm) * .5), calc(var(--dur-calm) * 1.5)}
.s-draw .s-f{fill:${C.bone};opacity:0;animation:fade-in var(--dur-base) var(--ease-standard) both;animation-delay:calc(var(--dur-calm) * 1.35)}
.s-stage{background:${C.oxblood}}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes fade-in{to{opacity:1}}
@keyframes fade-out{to{opacity:0}}
/* 3 · Wordmark lockup reveal: one movement for the whole mark (never letter by letter), the tagline follows */
.lock{display:flex;flex-direction:column;align-items:center;gap:30px}
.lock .wm{animation:fade-rise var(--dur-arrive) var(--ease-arrive) both}
.lock .line{width:0;height:1.5px;background:${C.espresso};animation:grow var(--dur-slow) var(--ease-standard) both;animation-delay:var(--dur-fast)}
.lock .tl{font-family:"Newsreader Display";font-style:italic;font-size:44px;animation:fade-rise var(--dur-arrive) var(--ease-arrive) both;animation-delay:calc(var(--dur-fast) * 2)}
@keyframes grow{to{width:40px}}
.replay{margin-top:28px;display:flex;gap:12px;align-items:center}
.replay button{height:44px;padding:0 20px;border-radius:999px;border:0;background:${C.espresso};color:${C.bone};font:560 15px "Instrument Sans";cursor:pointer}
.replay button:focus-visible{outline:2px solid ${C.oxblood};outline-offset:2px}
.replay label{font-size:14px;color:${C.umberDeep};display:flex;gap:8px;align-items:center}
/* Reduced motion: the final frame, at once. Nothing carries meaning through motion alone. */
@media (prefers-reduced-motion: reduce){ *,*::before,*::after{animation-duration:1ms!important;animation-delay:0ms!important;transition-duration:1ms!important} }
html.rm *,html.rm *::before,html.rm *::after{animation-duration:1ms!important;animation-delay:0ms!important}
`;
const body = `
<div class="eyebrow" style="color:${C.umberDeep}">SOMA · Bewegung · Markenanimationen</div>
<h1 class="serif" style="font-size:56px">Ankommen. <em>Und ruhen.</em></h1>
<p style="font-size:17px;color:${C.umberDeep};max-width:880px;line-height:1.5">Jede Bewegung endet still: ease-out, kein Überschwingen, keine Schleife. Token in <code>DESIGN_TOKENS</code>; Regeln in <code>brand/applications/motion/MOTION.md</code>.</p>
<div class="grid" id="g">
  <figure><div class="stage"><div class="arch-rise"><img src="../../photography/v2-previews/L03-philosophy.jpg" alt=""></div>
    <div class="place place-l" style="color:${C.umberDeep}">Flur · Berlin-Schöneberg · 18:40</div></div>
    <figcaption class="cap"><b>1 · Bogen-Aufgang.</b> Maske öffnet von unten (640 ms, arrive), Bogen steigt 16 px, Foto setzt sich von 1,04 auf 1 (900 ms, settle). Ortszeile folgt nach 480 ms.</figcaption></figure>
  <figure><div class="stage s-stage"><svg class="s-draw" viewBox="-70 -110 804 1005"><path class="o-f" d="${oRing}"/><path class="s-f" d="${sPath}"/><path class="o-o" pathLength="1" d="${oOuter}"/><path class="s-o" pathLength="1" d="${sPath}"/></svg></div>
    <figcaption class="cap"><b>2 · Das Zeichen zeichnet sich.</b> Die O-Kontur zieht (640 ms), die S-Kontur folgt ab 320 ms, dann erscheinen Ring und S als Fläche (220 ms) und die Linie geht. Nur Splash und Endframes; nie als Ladeanimation, nie in Schleife.</figcaption></figure>
  <figure><div class="stage"><div class="lock">${wmSvg}<div class="line"></div><div class="tl" lang="en">Your body. Your place.</div></div></div>
    <figcaption class="cap"><b>3 · Wortmarke.</b> Die ganze Marke kommt als eine Form (480 ms, 8 px), die Linie wächst, die Tagline folgt mit 320 ms Versatz. Nie Buchstabe für Buchstabe, nie gemorpht.</figcaption></figure>
</div>
<div class="replay"><button onclick="replay()">Noch einmal abspielen</button><label><input type="checkbox" onchange="document.documentElement.classList.toggle('rm',this.checked);replay()"> Reduzierte Bewegung simulieren</label></div>
<script>function replay(){const g=document.getElementById('g');const c=g.cloneNode(true);g.replaceWith(c)}</script>`;
const relFonts = L.CSS.replaceAll(`file://${L.SOMA}/brand/assets/typography/fonts/`, "../../assets/typography/fonts/");
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>SOMA · Motion specimen</title><style>${relFonts}html,body{width:auto;height:auto;overflow:auto}${css}</style></head><body>${body}</body></html>`;
fs.writeFileSync(path.join(OUT, "specimen.html"), html);

// Storyboards: freeze every animation at t and screenshot the three stages.
const b = await L.launch();
const ctx = await b.newContext({ viewport: { width: 1560, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto("file://" + path.join(OUT, "specimen.html"));
await p.evaluate(() => document.fonts.ready);
const times = [0, 160, 320, 480, 640, 900, 1200];
const frames = [];
for (const t of times) {
  await p.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), t);
  const shots = [];
  for (let i = 0; i < 3; i++) shots.push(await p.locator(".stage").nth(i).screenshot());
  frames.push({ t, shots });
}
await ctx.close();
const tmpDir = fs.mkdtempSync("/tmp/sb-");
for (let i = 0; i < 3; i++) {
  const cells = frames.map(({ t, shots }, k) => { const f = path.join(tmpDir, `s${i}-${k}.png`); fs.writeFileSync(f, shots[i]); return `<figure><img src="file://${f}" style="width:200px;border-radius:12px;display:block"><figcaption class="num place" style="margin-top:8px;color:${C.umberDeep}">${t} ms</figcaption></figure>`; }).join("");
  const title = ["Bogen-Aufgang (arch rise)", "Das Zeichen zeichnet sich: O, dann S (mark draw-on)", "Wortmarke und Tagline (lockup reveal)"][i];
  await L.png(L.page(`<div style="padding:40px 48px"><div class="eyebrow" style="color:${C.umberDeep}">Storyboard · aus specimen.html</div><div class="serif" style="font-size:36px;margin:8px 0 24px">${title}</div><div style="display:flex;gap:16px">${cells}</div></div>`, { w: 1600, h: 400 }), path.join(OUT, `storyboard-${i + 1}.png`), { w: 1600, h: 400 });
}
await L.close();
console.log("motion done");
