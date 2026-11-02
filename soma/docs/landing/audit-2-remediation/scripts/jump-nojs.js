// RT-1 without JavaScript: the hero „So funktioniert’s“ and the chapter feet are plain anchors (the browser's own jump).
const { launch, ctx, BASE, DATA, fs } = require('./lib');
(async () => {
  const b = await launch(); const out = {};
  for (const vp of ['m390', 't768', 'd1440']) {
    const cases = [['#bei-dir a[href="#so-funktionierts"]', 'so-funktionierts'], ['#idee a[href="#behandlungen"]', 'behandlungen'], ['#fragen a[href="#soma"]', 'soma']];
    for (const [sel, id] of cases) {
      const c = await ctx(b, vp, { javaScriptEnabled: false }); const p = await c.newPage();
      await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
      const link = p.locator(sel).last();
      if (!(await link.count())) { out[`${vp} ${id}`] = 'no link'; await c.close(); continue; }
      await link.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
      if (vp.startsWith('d')) await link.click(); else await link.tap();
      await p.waitForTimeout(1200);
      const r = await p.evaluate((x) => ({ h2: Math.round(document.getElementById(`${x}-titel`).getBoundingClientRect().top), sec: Math.round(document.getElementById(x).getBoundingClientRect().top), hash: location.hash }), id);
      out[`${vp} ${sel}`] = r; console.log(vp, 'no-JS', sel, '→', JSON.stringify(r));
      await c.close();
    }
  }
  fs.writeFileSync(`${DATA}/jump-nojs.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
