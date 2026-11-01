const { launch, ctx, BASE, scrollToY } = require('./lib');
(async () => {
  const b = await launch();
  for (const [vp, tier] of [['d1440', 'full'], ['m390', 'lite']]) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    await scrollToY(p, H, 250);
    await p.waitForTimeout(4000);
    const r = await p.evaluate(() => { const e = performance.getEntriesByType('resource'); const sum = (f) => Math.round(e.filter(f).reduce((a, x) => a + (x.encodedBodySize || 0), 0) / 1024); return { img: sum((x) => x.initiatorType === 'img' || /_next\/image/.test(x.name)), imgN: e.filter((x) => /_next\/image/.test(x.name)).length, fetch: sum((x) => x.initiatorType === 'fetch'), fetchN: e.filter((x) => x.initiatorType === 'fetch').length, script: sum((x) => x.initiatorType === 'script'), css: sum((x) => x.initiatorType === 'link' && /\.css/.test(x.name)), font: sum((x) => /woff2/.test(x.name)) }; });
    console.log(vp, JSON.stringify(r));
    await c.close();
  }
  await b.close();
})();
