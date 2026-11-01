// Audit 3: independent genre-overlap test for the v1.2 symbol (Versatz).
// Two normalisations: (A) the Audit-2 method (trim, resize 240x262 "fill"), (B) aspect-preserving:
// trim, scale to height 262, centre on a 320x262 canvas, best IoU over horizontal shifts -12..12 px.
const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const sharp = require('/home/user/frnt-studios-website/soma/node_modules/sharp');
const fs = require('fs');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-3';
const A = '/home/user/frnt-studios-website/soma/brand/assets/logo/final';
const read = (f) => { const s = fs.readFileSync(f, 'utf8'); return { vb: s.match(/viewBox="([^"]+)"/)[1], d: [...s.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]) }; };
const v12 = read(`${A}/soma-symbol.svg`), seal12 = read(`${A}/soma-symbol-solid.svg`), v11 = read('/tmp/audit3/symbol-v11.svg'), seal11 = read('/tmp/audit3/seal-v11.svg');
const mark = (m, fillRule = 'nonzero') => `<svg viewBox="${m.vb}" style="height:360px">${m.d.map((d) => `<path fill="#000" fill-rule="${fillRule}" d="${d}"/>`).join('')}</svg>`;
// seal: O filled (path 0), S knocked out (path 1) -> draw S white
const sealSvg = (m) => `<svg viewBox="${m.vb}" style="height:360px"><path fill="#000" d="${m.d[0]}"/>${m.d.slice(1).map((d) => `<path fill="#fff" d="${d}"/>`).join('')}</svg>`;
const ringEven = `<ellipse cx="332" cy="362" rx="312" ry="342" fill="none" stroke="#000" stroke-width="40"/>`;
const ringSoma11 = `<path fill="#000" fill-rule="evenodd" d="${v11.d[0]}"/>`;
const ringVersatz = `<path fill="#000" fill-rule="evenodd" d="${v12.d[0]}"/>`;
const S = (fam, w, x = 332) => `<text x="${x}" y="362" text-anchor="middle" dominant-baseline="central" font-family="${fam}" font-weight="${w}" font-size="600">S</text>`;
const box = (inner, vb = '0 0 664 724') => `<svg viewBox="${vb}" style="height:360px">${inner}</svg>`;
const solidEven = `<ellipse cx="332" cy="362" rx="332" ry="362" fill="#000"/>`;
const Sw = (fam, w) => S(fam, w).replace('<text', '<text fill="#fff"');
const cells = [
  ['v1.2 line (Versatz)', mark(v12)],
  ['v1.2 seal (Versatz)', sealSvg(seal12)],
  ['v1.1 line', mark(v11)],
  ['v1.1 seal', sealSvg(seal11)],
  ['Even ring + Bodoni S', box(ringEven + S('bm', 500))],
  ['Even ring + Gloock S', box(ringEven + S('gl', 400))],
  ['Even ring + Newsreader S', box(ringEven + S('nr', 400))],
  ['Circled S U+24C8', `<span style="font:400 300px/1 'DejaVu Serif'">Ⓢ</span>`],
  ['SOMA plain O + Bodoni S', box(ringSoma11 + S('bm', 500))],
  ['SOMA plain O + Newsreader S', box(ringSoma11 + S('nr', 400))],
  ['Versatz ring + Bodoni S', box(ringVersatz + S('bm', 500, 372), v12.vb)],
  ['Versatz ring + Newsreader S', box(ringVersatz + S('nr', 400, 372), v12.vb)],
  ['Solid oval + white Bodoni S', box(solidEven + Sw('bm', 600))],
  ['Solid oval + white Gloock S', box(solidEven + Sw('gl', 400))],
];
const html = `<html><head><style>
@font-face{font-family:bm;src:url(file:///tmp/soma-fonts/bodonimoda/latin-normal.woff2);font-weight:400 900}
@font-face{font-family:gl;src:url(file:///tmp/soma-fonts/gloock/latin-normal.woff2)}
@font-face{font-family:nr;src:url(file:///home/user/frnt-studios-website/soma/src/styles/fonts/newsreader-display-roman-latin.woff2)}
body{margin:0;background:#fff;display:flex;flex-wrap:wrap;gap:30px;padding:30px;font:13px sans-serif}
.c{display:flex;flex-direction:column;align-items:center;gap:6px;width:380px}.g{display:flex;align-items:center;justify-content:center;height:380px;width:380px;overflow:hidden}
</style></head><body>${cells.map(([n, h], i) => `<div class="c"><div class="g" id="g${i}">${h}</div><div>${n}</div></div>`).join('')}</body></html>`;
(async () => {
  fs.writeFileSync('/tmp/audit3/sino3.html', html);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 2900, height: 900 } });
  await p.goto('file:///tmp/audit3/sino3.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/originality-v12-vs-genre.png`, fullPage: true });
  const fill = [], asp = [];
  for (let i = 0; i < cells.length; i++) {
    const buf = await p.locator('#g' + i).screenshot();
    const t1 = await sharp(buf).flatten({ background: '#fff' }).trim().resize(240, 262, { fit: 'fill' }).greyscale().raw().toBuffer();
    fill.push(Uint8Array.from(t1, (v) => (v < 128 ? 1 : 0)));
    const tr = await sharp(buf).flatten({ background: '#fff' }).trim().resize({ height: 262 }).greyscale().png().toBuffer();
    const m = await sharp(tr).metadata();
    const W = 320; const left = Math.round((W - m.width) / 2);
    const t2 = await sharp({ create: { width: W, height: 262, channels: 3, background: '#fff' } }).composite([{ input: tr, left: Math.max(0, left), top: 0 }]).greyscale().raw().toBuffer();
    asp.push(Uint8Array.from(t2, (v) => (v < 128 ? 1 : 0)));
  }
  const iou = (a, c, W, H, shift = 0) => { let i = 0, u = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const xa = x, xc = x + shift; const va = a[y * W + xa]; const vc = xc >= 0 && xc < W ? c[y * W + xc] : 0; if (va && vc) i++; if (va || vc) u++; } return i / u; };
  const best = (a, c) => { let m = 0; for (let s = -12; s <= 12; s++) m = Math.max(m, iou(a, c, 320, 262, s)); return m; };
  const rows = [];
  for (const ci of [0, 1, 2, 3]) for (let ri = 4; ri < cells.length; ri++) rows.push({ mark: cells[ci][0], ref: cells[ri][0], fill: +iou(fill[ci], fill[ri], 240, 262).toFixed(2), aspect: +best(asp[ci], asp[ri]).toFixed(2) });
  console.table(rows);
  // generic-vs-generic baseline
  console.log('baseline even-Bodoni vs even-Gloock fill', iou(fill[4], fill[5], 240, 262).toFixed(2), 'aspect', best(asp[4], asp[5]).toFixed(2));
  console.log('baseline solid-Bodoni vs solid-Gloock fill', iou(fill[12], fill[13], 240, 262).toFixed(2), 'aspect', best(asp[12], asp[13]).toFixed(2));
  fs.writeFileSync('/tmp/audit3/genre-iou-a3.json', JSON.stringify(rows, null, 1));
  await b.close();
})();
