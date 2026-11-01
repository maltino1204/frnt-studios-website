const { launch, ctx, BASE, OUT, scrollToY, chapterTops } = require('./lib');
(async () => {
  const b = await launch();
  for (const [vp, tier] of [['m390', 'lite'], ['d1440', 'full'], ['m390', 'none']]) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const tops = Object.fromEntries((await chapterTops(p)).map((t) => [t.id, t]));
    await scrollToY(p, tops.profis.top + (vp === 'm390' ? 250 : 0), 300);
    const states = [];
    for (const ms of [300, 1000, 2500, 5000]) {
      await p.waitForTimeout(ms - (states.length ? [300, 1000, 2500, 5000][states.length - 1] : 0));
      const s = await p.evaluate(() => [...document.querySelectorAll('#profis img')].slice(0, 3).map((i) => `${i.complete ? 'complete' : 'pending'}/${getComputedStyle(i).opacity}/${i.loading}`));
      states.push(`${ms}ms ${s.join(' ')}`);
      if (ms === 1000) await p.screenshot({ path: `${OUT}/${vp}-${tier}-profis-1s.png` });
    }
    console.log(vp, tier, '\n ' + states.join('\n '));
    await c.close();
  }
  await b.close();
})();
