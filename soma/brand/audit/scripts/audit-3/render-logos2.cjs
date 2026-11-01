const fs = require('fs');
const sharp = require('/home/user/frnt-studios-website/soma/node_modules/sharp');
const A = '/home/user/frnt-studios-website/soma/brand/assets';
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-3';
const BONE = '#F3EFE8', ESP = '#25211F', OX = '#542C35';
const col = (f, c) => Buffer.from(fs.readFileSync(f, 'utf8').replace(/currentColor/g, c));
async function atH(buf, h) { const m = await sharp(buf).metadata(); return sharp(buf, { density: Math.max(1, 72 * h / m.height) }).resize({ height: h }).png().toBuffer(); }
async function tile(items, bg, pad = 10) {
  const ms = await Promise.all(items.map((b) => sharp(b).metadata()));
  const W = ms.reduce((a, m) => a + m.width + pad, pad), H = Math.max(...ms.map((m) => m.height)) + pad * 2;
  let x = pad; const comps = items.map((b, i) => { const c = { input: b, left: x, top: pad + Math.round((H - 2 * pad - ms[i].height) / 2) }; x += ms[i].width + pad; return c; });
  return sharp({ create: { width: W, height: H, channels: 4, background: bg } }).composite(comps).png().toBuffer();
}
async function up(buf, f) { const m = await sharp(buf).metadata(); return sharp(buf).resize({ width: m.width * f, kernel: 'nearest' }).png().toBuffer(); }
(async () => {
  for (const [name, file, hs] of [
    ['symbol-line', `${A}/logo/final/soma-symbol.svg`, [16, 24, 32, 48]],
    ['symbol-seal', `${A}/logo/final/soma-symbol-solid.svg`, [16, 24, 32, 48]],
  ]) {
    for (const [bn, bg, fg] of [['light', BONE, ESP], ['dark', ESP, BONE], ['oxblood', OX, BONE]]) {
      const b = col(file, fg); const pngs = []; for (const h of hs) pngs.push(await atH(b, h));
      fs.writeFileSync(`${OUT}/logo-${name}-${bn}-small-x4.png`, await up(await tile(pngs, bg, 8), 4));
    }
    fs.writeFileSync(`${OUT}/logo-${name}-large.png`, await tile([await atH(col(file, ESP), 520)], BONE, 40));
  }
  // favicon on light and dark tab bars at 16/24/32 + shipped PNGs
  const fav = fs.readFileSync(`${A}/icons/favicon.svg`);
  for (const [bn, bg] of [['light', '#FFFFFF'], ['lightgrey', '#DEE1E6'], ['dark', '#202124'], ['dark2', '#35363A']]) {
    const pngs = [await atH(fav, 16), await atH(fav, 24), await atH(fav, 32), fs.readFileSync(`${A}/icons/favicon-16.png`), fs.readFileSync(`${A}/icons/favicon-32.png`)];
    fs.writeFileSync(`${OUT}/favicon-${bn}-x6.png`, await up(await tile(pngs, bg, 8), 6));
  }
  // ico: extract via sharp (first image)
  try { const ico = await sharp(`${A}/icons/favicon.ico`).png().toBuffer(); fs.writeFileSync(`${OUT}/favicon-ico-frame.png`, await up(await tile([ico], '#202124', 8), 6)); } catch (e) { console.log('ico', e.message); }
  // app icons
  const icons = ['ios/AppIcon.svg', 'ios/AppIcon-dark.svg', 'pwa/icon.svg', 'pwa/icon-maskable.svg', 'android/ic_launcher_foreground.svg', 'android/ic_launcher_monochrome.svg'].filter(f => fs.existsSync(`${A}/icons/${f}`));
  const ib = []; for (const f of icons) ib.push(await atH(fs.readFileSync(`${A}/icons/${f}`), 200));
  fs.writeFileSync(`${OUT}/icons-masters-200.png`, await tile(ib, '#888888', 12));
  // small app icon pngs at true size
  const small = ['ios/AppIcon-20.png', 'ios/AppIcon-29.png', 'ios/AppIcon-40.png', 'ios/AppIcon-60.png', 'ios/AppIcon-120.png'].map(f => fs.readFileSync(`${A}/icons/${f}`));
  fs.writeFileSync(`${OUT}/icons-ios-small-x3.png`, await up(await tile(small, '#FFFFFF', 8), 3));
  // lockups
  for (const n of ['soma-lockup-stacked', 'soma-lockup-descriptor', 'soma-lockup-tagline']) fs.writeFileSync(`${OUT}/lockup-${n}.png`, await tile([await atH(col(`${A}/logo/final/${n}.svg`, ESP), n.includes('stacked') ? 420 : 220)], BONE, 30));
  const st = col(`${A}/logo/final/soma-lockup-stacked.svg`, ESP); const m = await sharp(st).metadata();
  fs.writeFileSync(`${OUT}/lockup-stacked-min-64w-x4.png`, await up(await tile([await sharp(st, { density: 72 * 64 / m.width }).resize({ width: 64 }).png().toBuffer()], BONE, 8), 4));
  console.log('ok');
})();
