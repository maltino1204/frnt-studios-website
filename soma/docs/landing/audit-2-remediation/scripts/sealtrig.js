// I-9 re-check: when does the chapter-10 brand sequence start, measured on live geometry (the page height changes
// while scrolling: pins and content-visibility), approaching slowly from above. Logs every state change with the
// band's visible share, the header logo state, and screenshots at fixed shares.
const { launch, ctx, BASE, OUT, DATA, settle, fs } = require('./lib');
(async () => {
  const vp = process.argv[2] || 'd1440', tier = process.argv[3] || 'full';
  const b = await launch(); const c = await ctx(b, vp); const p = await c.newPage();
  await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' }); await settle(p, 1500);
  const vh = await p.evaluate(() => innerHeight);
  // coarse approach until the band's top is 150 px below the fold (live rect)
  for (let i = 0; i < 400; i++) {
    const top = await p.evaluate(() => document.getElementById('soma').getBoundingClientRect().top);
    if (top < vh + 150) break;
    await p.evaluate((d) => scrollBy(0, d), Math.min(300, top - vh - 100));
    await p.waitForTimeout(50);
  }
  await settle(p, 800);
  const log = [];
  let last = '';
  const shots = new Set([0.1, 0.25, 0.4]);
  for (let i = 0; i < 60; i++) {
    const st = await p.evaluate(() => { const s = document.querySelector('[data-scene="seal"]'); const r = document.getElementById('soma').getBoundingClientRect(); return { state: s.dataset.sceneState, logo: document.documentElement.dataset.headerLogo || '-', share: +((Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height).toFixed(2) }; });
    const key = `${st.state}|${st.logo}`;
    if (key !== last) { log.push(st); last = key; console.log(vp, tier, JSON.stringify(st)); }
    for (const s of [...shots]) if (st.share >= s) { shots.delete(s); await p.screenshot({ path: `${OUT}/${vp}-${tier}-seal-live-${Math.round(s * 100)}.png` }); }
    if (st.share >= 0.7) break;
    await p.evaluate(() => scrollBy(0, 30));
    await p.waitForTimeout(150);
  }
  fs.writeFileSync(`${DATA}/seal-trigger-${vp}-${tier}.json`, JSON.stringify(log, null, 1));
  await b.close();
})();
