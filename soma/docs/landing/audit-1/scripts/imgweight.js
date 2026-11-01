const { launch, ctx, BASE, scrollToY } = require('./lib');
(async () => {
  const b = await launch();
  for (const [vp, tier] of [['d1440', 'full'], ['m390', 'lite']]) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    const cdp = await c.newCDPSession(p);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    const reqs = new Map();
    cdp.on('Network.responseReceived', (e) => reqs.set(e.requestId, { url: e.response.url, type: e.type }));
    cdp.on('Network.loadingFinished', (e) => { const q = reqs.get(e.requestId); if (q) q.bytes = e.encodedDataLength; });
    await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    await scrollToY(p, H, 300);
    await p.waitForTimeout(3000);
    const by = {};
    for (const q of reqs.values()) { by[q.type] = by[q.type] || { n: 0, kb: 0 }; by[q.type].n++; by[q.type].kb += (q.bytes || 0) / 1024; }
    const imgs = [...reqs.values()].filter((q) => q.type === 'Image').sort((a, b) => (b.bytes || 0) - (a.bytes || 0)).slice(0, 6).map((q) => `${Math.round((q.bytes || 0) / 1024)}KB ${decodeURIComponent(q.url.replace(BASE, '')).slice(0, 80)}`);
    console.log(vp, JSON.stringify(Object.fromEntries(Object.entries(by).map(([k, v]) => [k, `${v.n} req ${Math.round(v.kb)} KB`]))));
    console.log('  largest:', imgs.join('\n   '));
    await c.close();
  }
  await b.close();
})();
