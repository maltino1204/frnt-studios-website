const { launch, ctx, BASE, OUT } = require('/home/user/frnt-studios-website/soma/docs/landing/audit-4/scripts/lib');
(async () => {
  const b = await launch();
  for (const vp of ['t768', 'm390', 't820']) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    await p.locator('header button:visible', { hasText: /Menü|Kapitel/ }).first().tap();
    await p.waitForTimeout(900);
    await p.locator('dialog[open] a[href="#fuer-profis"]').tap();
    await p.waitForTimeout(3500);
    const r = await p.evaluate(() => { const h = document.getElementById('fuer-profis-titel').getBoundingClientRect(); return { h2Top: Math.round(h.top), h2Bottom: Math.round(h.bottom), vh: innerHeight, focus: document.activeElement.id }; });
    console.log(vp, JSON.stringify(r));
    await p.screenshot({ path: `${OUT}/${vp}-jump-fuer-profis.png` });
    await c.close();
  }
  await b.close();
})();
