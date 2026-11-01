// First look: hero screenshots per viewport + chapter positions + console errors.
const { launch, ctx, BASE, OUT, TMP, chapterTops, settle } = require('./lib');
(async () => {
  const b = await launch();
  const vps = (process.argv[2] || 'd1440,d1280,t1024,t768,m390,m360,m320').split(',');
  for (const vp of vps) {
    const tier = vp.startsWith('d') ? 'full' : 'lite';
    const c = await ctx(b, vp);
    const p = await c.newPage();
    const errors = [];
    p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text().slice(0, 200)); });
    p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' });
    await settle(p, 1500);
    await p.screenshot({ path: `${OUT}/hero-${vp}.png` });
    const tops = await chapterTops(p);
    const info = await p.evaluate(() => ({
      docH: document.documentElement.scrollHeight,
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
      motion: document.documentElement.dataset.motion,
      dock: document.documentElement.dataset.dock,
    }));
    console.log(vp, JSON.stringify(info), JSON.stringify(tops));
    if (errors.length) console.log('  console:', errors.slice(0, 10));
    await c.close();
  }
  await b.close();
})();
