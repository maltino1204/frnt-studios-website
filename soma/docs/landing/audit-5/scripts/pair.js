// (audit 5) N4-6: the signature pair (03, step 3) in context, as the arches crop it, at 1440 (tier none: final frame) and
// 390 (lite: the „03 Bleiben“ step selected). Screenshot of the pair plus each arch's image source.
const { launch, ctx, BASE, OUT, DATA } = require('./lib');
const fs = require('fs');
(async () => {
  const b = await launch();
  const out = {};
  for (const [vp, q] of [['d1440', '?motion=none'], ['m390', '?motion=lite'], ['t768', '?motion=lite']]) {
    const c = await ctx(b, vp, { reducedMotion: 'reduce' });
    const p = await c.newPage();
    await p.goto(`${BASE}/${q}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    const step3 = p.locator('#so-funktionierts a[href="#schritt-3"], #so-funktionierts button', { hasText: 'Bleiben' }).first();
    if (await step3.isVisible().catch(() => false)) { await step3.click(); await p.waitForTimeout(800); }
    const pair = p.locator('.lp-pair').first();
    await pair.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await p.waitForTimeout(1200);
    out[vp] = await p.evaluate(() => [...document.querySelectorAll('.lp-pair img')].map((i) => ({ src: decodeURIComponent(i.currentSrc).replace(/^.*url=/, '').replace(/&.*$/, ''), box: [Math.round(i.getBoundingClientRect().width), Math.round(i.getBoundingClientRect().height)], visible: i.getBoundingClientRect().width > 0 })));
    const box = await pair.boundingBox();
    if (box) await p.screenshot({ path: `${OUT}/pair-${vp}.png`, clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: Math.min(box.width + 40, p.viewportSize().width), height: Math.min(box.height + 60, p.viewportSize().height) } });
    console.log(vp, JSON.stringify(out[vp]));
    await c.close();
  }
  fs.writeFileSync(`${DATA}/pair.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
