const { launch, BASE, OUT } = require('./lib');
(async () => {
  const b = await launch();
  for (const [w, h] of [[1024, 768], [1180, 820], [1280, 720], [1280, 800], [1366, 768], [1440, 900], [1920, 1080]]) {
    const c = await b.newContext({ viewport: { width: w, height: h } });
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=none`, { waitUntil: 'networkidle' });
    const r = await p.evaluate(() => {
      const band = document.querySelector('.lp-band').getBoundingClientRect();
      const txt = document.querySelector('.lp-band-text').getBoundingClientRect();
      const place = document.querySelector('.lp-band-place').getBoundingClientRect();
      const btns = [...document.querySelectorAll('.lp-band-ctas a')].map((a) => a.getBoundingClientRect());
      const last = btns[btns.length - 1];
      const overlap = !(last.bottom <= place.top || last.top >= place.bottom);
      return { bandH: Math.round(band.height), textTopInBand: Math.round(txt.top - band.top), textBottomInBand: Math.round(txt.bottom - band.top), placeTop: Math.round(place.top - band.top), lastBtnBottom: Math.round(last.bottom - band.top), ctaRows: new Set(btns.map((x) => Math.round(x.top))).size, overlapCtaPlace: overlap, textRightPct: Math.round(100 * (txt.right - band.left) / band.width) };
    });
    console.log(`${w}x${h}`, JSON.stringify(r));
    if (w === 1024 || w === 1280 && h === 720) { await p.locator('.lp-band').scrollIntoViewIfNeeded(); await p.evaluate(() => { const el = document.querySelector('.lp-band'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 68); }); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/band-${w}x${h}.png` }); }
    await c.close();
  }
  await b.close();
})();
