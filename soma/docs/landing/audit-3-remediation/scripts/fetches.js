const { launch, ctx, BASE, scrollToY } = require('./lib');
(async () => {
  const b = await launch();
  const c = await ctx(b, 'm390');
  const p = await c.newPage();
  const f = [];
  p.on('requestfinished', async (r) => { if (r.resourceType() === 'fetch') { const s = await r.sizes().catch(() => null); f.push(`${r.url().replace(BASE, '')} ${s ? s.responseBodySize : '?'}B ${(r.headers()['next-router-prefetch'] ? 'prefetch' : '')}`); } });
  const imgs = [];
  p.on('requestfinished', async (r) => { if (r.resourceType() === 'image') { const s = await r.sizes().catch(() => null); imgs.push(s ? s.responseBodySize : 0); } });
  await p.goto(`${BASE}/?motion=lite`, { waitUntil: 'networkidle' });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  await scrollToY(p, H, 300);
  await p.waitForTimeout(3000);
  console.log('fetch count', f.length); console.log(f.slice(0, 70).join('\n'));
  console.log('images', imgs.length, 'total KB', Math.round(imgs.reduce((a, b) => a + b, 0) / 1024));
  await b.close();
})();
