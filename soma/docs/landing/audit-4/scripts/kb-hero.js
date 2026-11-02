// § 19 check: the hero's focus order follows the visual order at every width, and exactly one „So funktioniert’s“
// hero link is in the focus order and the accessibility tree (the 768–1023 copy after the entry, `display: none`
// elsewhere). Tab walk from the top of the page; also the hero's links as Chromium's accessibility tree reports them.
const { launch, ctx, BASE, DATA, settle, fs } = require('./lib');
(async () => {
  const b = await launch();
  const out = {};
  for (const vp of ['m390', 't768', 't820', 't1023', 'd1024', 'd1440']) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=none`, { waitUntil: 'networkidle' });
    await settle(p, 800);
    const order = [];
    for (let i = 0; i < 22; i++) {
      await p.keyboard.press('Tab');
      const d = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const r = e.getBoundingClientRect(); return { inHero: !!e.closest('#bei-dir'), t: (e.getAttribute('aria-label') || e.textContent || e.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 22), y: Math.round(r.top + scrollY) }; });
      if (d && d.inHero) order.push(`${d.t}@${d.y}`);
      if (order.length && d && !d.inHero && order.length > 3) break;
    }
    const snap = await p.accessibility?.snapshot?.().catch(() => null);
    const howInTree = await p.evaluate(() => [...document.querySelectorAll('#bei-dir a[href="#so-funktionierts"]')].map((a) => ({ cls: a.className.split(' ')[0], display: getComputedStyle(a).display })));
    const visualYs = order.map((s) => +s.split('@')[1]);
    const monotonic = visualYs.every((y, i) => i === 0 || y >= visualYs[i - 1] - 4 || Math.abs(y - visualYs[i - 1]) < 40);
    out[vp] = { order, howLinks: howInTree, monotonicY: monotonic };
    console.log(vp, monotonic ? 'order follows y' : 'ORDER JUMPS', '|', order.join(' → '), '|', JSON.stringify(howInTree));
    await c.close();
  }
  fs.writeFileSync(`${DATA}/kb-hero.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
