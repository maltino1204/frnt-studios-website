// Is the S im O distinct from a generic "serif S in an oval ring"? IoU against naive constructions.
const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const sharp = require('/home/user/frnt-studios-website/soma/node_modules/sharp');
const fs = require('fs');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-2';
const sym = fs.readFileSync('/home/user/frnt-studios-website/soma/brand/assets/logo/final/soma-symbol.svg', 'utf8');
const paths = [...sym.matchAll(/<path[^>]*d="([^"]+)"/g)].map(m => m[1]);
// ring: same outer oval as SOMA O (664x724), uniform-ish ring; a generic monogram maker would use an even ring
const ringEven = `<ellipse cx="332" cy="362" rx="312" ry="342" fill="none" stroke="#000" stroke-width="40"/>`;
const ringSoma = `<path fill="#000" fill-rule="evenodd" d="${paths[0]}"/>`;
const sGlyph = (fam, w) => `<text x="332" y="362" text-anchor="middle" dominant-baseline="central" font-family="${fam}" font-weight="${w}" font-size="600">S</text>`;
const cells = [
  ['SOMA S im O', `<svg viewBox="0 0 664 724" style="height:360px">${paths.map(d => `<path fill="#000" d="${d}"/>`).join('')}</svg>`],
  ['SOMA O ring + Bodoni Moda S', `<svg viewBox="0 0 664 724" style="height:360px">${ringSoma}${sGlyph('bm', 500)}</svg>`],
  ['SOMA O ring + Newsreader S', `<svg viewBox="0 0 664 724" style="height:360px">${ringSoma}${sGlyph('nr', 400)}</svg>`],
  ['Even oval ring + Bodoni Moda S', `<svg viewBox="0 0 664 724" style="height:360px">${ringEven}${sGlyph('bm', 500)}</svg>`],
  ['Even oval ring + Gloock S', `<svg viewBox="0 0 664 724" style="height:360px">${ringEven}${sGlyph('gl', 400)}</svg>`],
  ['Circled S U+24C8 (DejaVu Serif)', `<span style="font:400 300px/1 'DejaVu Serif'">Ⓢ</span>`],
];
const html = `<html><head><style>
@font-face{font-family:bm;src:url(file:///tmp/soma-fonts/bodonimoda/latin-normal.woff2);font-weight:400 900}
@font-face{font-family:gl;src:url(file:///tmp/soma-fonts/gloock/latin-normal.woff2)}
@font-face{font-family:nr;src:url(file:///home/user/frnt-studios-website/soma/src/styles/fonts/newsreader-display-roman-latin.woff2)}
body{margin:0;background:#fff;display:flex;gap:40px;padding:30px;align-items:flex-start;font:13px sans-serif}
.c{display:flex;flex-direction:column;align-items:center;gap:8px;width:360px;overflow:hidden}.g{display:flex;align-items:center;justify-content:center;height:380px}
</style></head><body>${cells.map(([n, h], i) => `<div class="c"><div class="g" id="g${i}">${h}</div><div>${n}</div></div>`).join('')}</body></html>`;
(async () => {
  fs.writeFileSync('/tmp/audit2/sino.html', html);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 2500, height: 470 } });
  await p.goto('file:///tmp/audit2/sino.html'); await p.waitForTimeout(1000);
  await p.screenshot({ path: `${OUT}/originality-s-im-o-vs-generic-monograms.png` });
  const masks = [];
  for (let i = 0; i < cells.length; i++) {
    const buf = await p.locator('#g' + i).screenshot();
    const t = await sharp(buf).flatten({ background: '#fff' }).trim().resize(240, 262, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true });
    masks.push(Uint8Array.from(t.data, v => v < 128 ? 1 : 0));
  }
  const iou = (a, c) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && c[k]) i++; if (a[k] || c[k]) u++; } return (i / u).toFixed(2); };
  for (let i = 1; i < cells.length; i++) console.log('SOMA S im O vs', cells[i][0], 'IoU', iou(masks[0], masks[i]));
  console.log('generic BM-even vs generic Gloock-even', iou(masks[3], masks[4]));
  await b.close();
})();
