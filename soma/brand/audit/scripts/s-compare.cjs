// Compare SOMA S silhouette with generic S glyphs (Bodoni Moda 400/600, Newsreader roman) by IoU after bbox normalisation.
const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const sharp = require('/home/user/frnt-studios-website/soma/node_modules/sharp');
const fs = require('fs');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-1';
const symbol = fs.readFileSync('/home/user/frnt-studios-website/soma/brand/assets/logo/final/soma-symbol.svg', 'utf8').replace(/currentColor/g, '#000');
const wm = fs.readFileSync('/home/user/frnt-studios-website/soma/brand/assets/logo/final/soma-wordmark.svg', 'utf8');
const sPath = wm.match(/id="wordmark-s" d="([^"]+)"/)[1];
const cells = [
  ['SOMA symbol', `<svg viewBox="0 0 472 724.43" style="height:300px">${symbol.match(/<path[^>]+>/)[0].replace('currentColor','#000')}</svg>`],
  ['SOMA wordmark S', `<svg viewBox="0 -12 460 732" style="height:300px"><path fill="#000" d="${sPath}"/></svg>`],
  ['Bodoni Moda 400', `<span style="font:400 400px/1 bm">S</span>`],
  ['Bodoni Moda 700', `<span style="font:700 400px/1 bm">S</span>`],
  ['Newsreader 400', `<span style="font:400 400px/1 nr">S</span>`],
  ['Gloock', `<span style="font:400 400px/1 gl">S</span>`],
];
const html = `<html><head><style>
@font-face{font-family:bm;src:url(file:///tmp/soma-fonts/bodonimoda/latin-normal.woff2);font-weight:400 900}
@font-face{font-family:gl;src:url(file:///tmp/soma-fonts/gloock/latin-normal.woff2)}
@font-face{font-family:nr;src:url(file:///home/user/frnt-studios-website/soma/src/styles/fonts/newsreader-display-roman-latin.woff2)}
body{margin:0;background:#fff;display:flex;gap:40px;padding:40px;align-items:center}
.c{display:flex;flex-direction:column;align-items:center;gap:8px;font:14px sans-serif}
.g{display:flex;align-items:center;justify-content:center}
</style></head><body>${cells.map(([n, h], i) => `<div class="c"><div class="g" id="g${i}">${h}</div><div>${n}</div></div>`).join('')}</body></html>`;
(async () => {
  fs.writeFileSync('/tmp/audit-scripts/s.html', html);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 2000, height: 520 } });
  await p.goto('file:///tmp/audit-scripts/s.html'); await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/originality-s-vs-generic-didone.png` });
  const masks = [];
  for (let i = 0; i < cells.length; i++) {
    const buf = await p.locator('#g' + i).screenshot();
    // trim to ink bbox and normalise to 200x300
    const t = await sharp(buf).flatten({ background: '#fff' }).threshold(128).trim().resize(200, 300, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
    const ch = t.info.channels; const m = new Uint8Array(200 * 300);
    for (let k = 0; k < m.length; k++) m[k] = t.data[k * ch] < 128 ? 1 : 0;
    masks.push(m);
  }
  const iou = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; } return (i / u).toFixed(2); };
  for (let i = 1; i < cells.length; i++) console.log(cells[0][0], 'vs', cells[i][0], 'IoU', iou(masks[0], masks[i]));
  for (let i = 2; i < cells.length; i++) console.log(cells[1][0], 'vs', cells[i][0], 'IoU', iou(masks[1], masks[i]));
  console.log('Bodoni400 vs Newsreader', iou(masks[2], masks[4]), 'Bodoni400 vs Gloock', iou(masks[2], masks[5]));
  await b.close();
})();
