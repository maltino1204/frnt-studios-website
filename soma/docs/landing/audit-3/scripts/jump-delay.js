// From the tap on a chapter link in the overlay to the start of the scroll: pointerdown → the jump's scrollIntoView
// call → first scroll event → overlay closed. 390 (tap) and 1440 (click), no CPU throttling, 3 targets each.
const { launch, ctx, BASE, DATA, settle, fs } = require('./lib');
(async () => {
  const b = await launch();
  const out = [];
  for (const vp of ['m390', 'd1440']) {
    for (const id of ['profis', 'fragen', 'soma']) {
      const c = await ctx(b, vp);
      const p = await c.newPage();
      await p.addInitScript(() => {
        window.__j = {};
        const o = Element.prototype.scrollIntoView;
        Element.prototype.scrollIntoView = function (a) { if (window.__j.siv == null && window.__j.down != null) window.__j.siv = performance.now(); return o.apply(this, arguments); };
        addEventListener('pointerdown', (e) => { if (e.target.closest && e.target.closest('dialog[open] a[href^="#"]')) window.__j = { down: e.timeStamp }; }, true);
        addEventListener('scroll', () => { if (window.__j.down != null && window.__j.scroll == null) window.__j.scroll = performance.now(); }, true);
        const mo = new MutationObserver(() => { const d = document.querySelector('dialog.lp-overlay'); if (window.__j.down != null && d && !d.open && window.__j.closed == null) window.__j.closed = performance.now(); });
        addEventListener('DOMContentLoaded', () => mo.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['open'] }));
      });
      await p.goto(`${BASE}/?motion=${vp.startsWith('d') ? 'full' : 'lite'}`, { waitUntil: 'networkidle' });
      await settle(p, 1500);
      const m = vp.startsWith('m');
      const trig = m ? p.locator('.lp-dock button').first() : p.locator('header button', { hasText: 'Kapitel' }).first();
      if (m) await trig.tap(); else await trig.click();
      await p.waitForTimeout(1200);
      const link = p.locator(`dialog[open] a[href="#${id}"]`);
      if (m) await link.tap(); else await link.click();
      await p.waitForTimeout(3000);
      const j = await p.evaluate(() => { const j = window.__j; const r = (x) => (x == null ? null : Math.round(x - j.down)); return { closed: r(j.closed), scrollIntoView: r(j.siv), firstScroll: r(j.scroll) }; });
      out.push({ vp, id, ...j });
      console.log(vp, id, JSON.stringify(j));
      await c.close();
    }
  }
  fs.writeFileSync(`${DATA}/jump-delay.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
