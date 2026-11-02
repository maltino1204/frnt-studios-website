// First-load weight of `/`: gzip -9 of every module script the served HTML references (noModule excluded), the
// stylesheets and the HTML itself, read from .next/static. Also flags the compile hint. usage: node weight.js
const fs = require('fs');
const zlib = require('zlib');
const NEXT = '/home/user/frnt-studios-website/soma/.next';
(async () => {
  const html = await (await fetch((process.env.BASE || 'http://localhost:3100') + '/')).text();
  const srcs = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+\.js)"[^>]*>/g)].filter((m) => !/noModule/i.test(m[0])).map((m) => m[1]);
  let gz = 0, raw = 0;
  const rows = srcs.map((s) => { const b = fs.readFileSync(NEXT + s.replace('/_next', '')); const g = zlib.gzipSync(b, { level: 9 }).length; gz += g; raw += b.length; return [s.split('/').pop(), (b.length / 1024).toFixed(0), (g / 1024).toFixed(1), b.toString('utf8', 0, 30).startsWith('//# allFunctionsCalledOnLoad')]; });
  rows.sort((a, b) => b[2] - a[2]);
  for (const r of rows) console.log(r.join('  '));
  console.log('module scripts', srcs.length, 'raw KB', (raw / 1024).toFixed(0), 'gz KB', (gz / 1024).toFixed(1));
  const css = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  const cg = css.reduce((a, s) => a + zlib.gzipSync(fs.readFileSync(NEXT + s.replace('/_next', ''))).length, 0);
  console.log('css files', css.length, 'gz KB', (cg / 1024).toFixed(1));
  console.log('html raw KB', (html.length / 1024).toFixed(0), 'gz KB', (zlib.gzipSync(html).length / 1024).toFixed(1));
})();
