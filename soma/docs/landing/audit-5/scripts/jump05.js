// (audit 5) R4-4 / N4-4: where a chapter jump to 05 „Für Profis“ lands below 1024 (via the overlay, as a visitor):
// the focused h2's box against the viewport and the dock. Screenshot of the landing view.
const fs = require('fs');
const { launch, ctx, BASE, OUT, DATA } = require('./lib');
(async () => {
  const b = await launch();
  const out = {};
  for (const vp of ['m390', 'm412', 'm360', 't768', 't820', 't1023']) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    await p.locator('header button:visible', { hasText: /Menü|Kapitel/ }).first().tap();
    await p.waitForTimeout(900);
    await p.locator('dialog[open] a[href="#fuer-profis"]').tap();
    await p.waitForTimeout(3500);
    const r = await p.evaluate(() => {
      const h = document.getElementById('fuer-profis-titel').getBoundingClientRect();
      const d = document.querySelector('.lp-dock');
      const dr = d && getComputedStyle(d).visibility !== 'hidden' && document.documentElement.dataset.dock !== 'hidden' ? d.getBoundingClientRect() : null;
      const arch = document.querySelector('#fuer-profis .lp-band-arch')?.getBoundingClientRect();
      return { h2Top: Math.round(h.top), h2Bottom: Math.round(h.bottom), vh: innerHeight, dockTop: dr ? Math.round(dr.top) : null, archTop: arch ? Math.round(arch.top) : null, focus: document.activeElement.id, h2TopPct: Math.round((h.top / innerHeight) * 100), clearOfDock: dr ? h.bottom <= dr.top : h.bottom <= innerHeight };
    });
    console.log(vp, JSON.stringify(r));
    out[vp] = r;
    await p.screenshot({ path: `${OUT}/${vp}-jump-fuer-profis.png` });
    await c.close();
  }
  fs.writeFileSync(`${DATA}/jump05.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
