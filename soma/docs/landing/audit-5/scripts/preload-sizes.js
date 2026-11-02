const { launch, ctx, BASE } = require('/home/user/frnt-studios-website/soma/docs/landing/audit-5/scripts/lib');
(async () => {
  const b = await launch();
  for (const vp of ['m390', 'm360', 'm412', 'm430', 't768', 't820', 't1023', 'd1440']) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    const reqs = [];
    p.on('request', (r) => { if (r.url().includes('hero-home-4x5')) reqs.push(decodeURIComponent(r.url()).replace(/^.*w=/, 'w=')); });
    await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const l = document.querySelector('link[rel=preload][as=image]'); const img = document.querySelector('#hero-ort img'); return { preloadSizes: l?.getAttribute('imagesizes')?.slice(0, 160), imgSizes: img?.getAttribute('sizes')?.slice(0, 160), same: l?.getAttribute('imagesizes') === img?.getAttribute('sizes'), current: (img?.currentSrc || '').replace(/^.*w=/, 'w='), ribbonClass: document.querySelector('.lp-hero')?.className }; });
    console.log(vp, JSON.stringify({ reqs, ...r }));
    await c.close();
  }
  await b.close();
})();
