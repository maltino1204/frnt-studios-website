// Auditor render: SVG masters -> PNG at small sizes on light/dark, composed into sheets.
const path = require('path');
const fs = require('fs');
const sharp = require('/home/user/frnt-studios-website/soma/node_modules/sharp');
const A = '/home/user/frnt-studios-website/soma/brand/assets';
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-3';
const BONE = '#F3EFE8', ESP = '#25211F';

function svgColored(file, color) {
  let s = fs.readFileSync(file, 'utf8');
  return Buffer.from(s.replace(/currentColor/g, color));
}

async function renderAtHeight(buf, h) {
  // render at exact pixel height using density trick: rasterize via resize of vector
  const meta = await sharp(buf).metadata();
  const density = Math.max(1, 72 * h / meta.height);
  return sharp(buf, { density }).resize({ height: h }).png().toBuffer();
}

async function tile(items, bg, pad = 12) {
  // items: array of png buffers; layout horizontally on bg
  const metas = await Promise.all(items.map((b) => sharp(b).metadata()));
  const W = metas.reduce((a, m) => a + m.width + pad, pad);
  const H = Math.max(...metas.map((m) => m.height)) + pad * 2;
  let x = pad;
  const comps = items.map((b, i) => { const c = { input: b, left: x, top: pad }; x += metas[i].width + pad; return c; });
  return sharp({ create: { width: W, height: H, channels: 4, background: bg } }).composite(comps).png().toBuffer();
}

async function upscale(buf, f) {
  const m = await sharp(buf).metadata();
  return sharp(buf).resize({ width: m.width * f, kernel: 'nearest' }).png().toBuffer();
}

(async () => {
  const sizes = [16, 24, 32];
  const rows = [];
  const specs = [
    ['symbol', `${A}/logo/final/soma-symbol.svg`, sizes],
    ['wordmark-display', `${A}/logo/final/soma-wordmark.svg`, [12, 16, 24, 32]],
    ['wordmark-micro', `${A}/logo/final/soma-wordmark-micro.svg`, [12, 15, 18, 24]],
  ];
  for (const [name, file, hs] of specs) {
    for (const [bgName, bg, fg] of [['light', BONE, ESP], ['dark', ESP, BONE]]) {
      const buf = svgColored(file, fg);
      const pngs = [];
      for (const h of hs) pngs.push(await renderAtHeight(buf, h));
      const t = await tile(pngs, bg, 8);
      const up = await upscale(t, 4);
      const f = `${OUT}/logo-${name}-${bgName}-small-x4.png`;
      fs.writeFileSync(f, up);
      // also 1:1
      fs.writeFileSync(`${OUT}/logo-${name}-${bgName}-small-1x.png`, t);
      console.log(f);
    }
  }
  // favicon.svg (fixed colors) at 16/24/32 on light/dark page
  const fav = fs.readFileSync(`${A}/icons/favicon.svg`);
  for (const [bgName, bg] of [['light', '#FFFFFF'], ['dark', '#202124']]) {
    const pngs = [];
    for (const h of [16, 24, 32]) pngs.push(await renderAtHeight(fav, h));
    // add shipped favicon-16/32 png too
    pngs.push(fs.readFileSync(`${A}/icons/favicon-16.png`));
    pngs.push(fs.readFileSync(`${A}/icons/favicon-32.png`));
    const t = await tile(pngs, bg, 8);
    fs.writeFileSync(`${OUT}/favicon-${bgName}-x6.png`, await upscale(t, 6));
  }
  // Large renders
  for (const [name, file, h] of [['symbol', `${A}/logo/final/soma-symbol.svg`, 600], ['wordmark', `${A}/logo/final/soma-wordmark.svg`, 300], ['wordmark-micro', `${A}/logo/final/soma-wordmark-micro.svg`, 300]]) {
    const p = await renderAtHeight(svgColored(file, ESP), h);
    fs.writeFileSync(`${OUT}/logo-${name}-large.png`, await tile([p], BONE, 40));
  }
  // app icon masters
  for (const f of ['ios/AppIcon.svg', 'ios/AppIcon-dark.svg', 'pwa/icon-maskable.svg', 'android/ic_launcher_foreground.svg', 'android/ic_launcher_monochrome.svg']) {
    const b = fs.readFileSync(`${A}/icons/${f}`);
    const p = await renderAtHeight(b, 256);
    fs.writeFileSync(`${OUT}/icon-${f.replace(/\//g, '-').replace('.svg', '')}-256.png`, await tile([p], '#888888', 10));
  }
  // lockups large
  for (const n of ['soma-lockup-descriptor', 'soma-lockup-tagline', 'soma-lockup-stacked']) {
    const p = await renderAtHeight(svgColored(`${A}/logo/final/${n}.svg`, ESP), n.includes('stacked') ? 400 : 220);
    fs.writeFileSync(`${OUT}/lockup-${n}.png`, await tile([p], BONE, 30));
  }
  // lockups at minimum sizes stated in LOGO_USAGE: descriptor 260 px wide, tagline 200 px wide, stacked 64 px wide
  for (const [n, w] of [['soma-lockup-descriptor', 260], ['soma-lockup-tagline', 200], ['soma-lockup-stacked', 64]]) {
    const buf = svgColored(`${A}/logo/final/${n}.svg`, ESP);
    const meta = await sharp(buf).metadata();
    const p = await sharp(buf, { density: 72 * w / meta.width * 1.0 }).resize({ width: w }).png().toBuffer();
    fs.writeFileSync(`${OUT}/lockup-${n}-min-${w}w-x4.png`, await upscale(await tile([p], BONE, 8), 4));
  }
  console.log('done');
})();
