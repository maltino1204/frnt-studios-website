// (audit 5) R4-1 behaviour, not only "no crash": in each tier the 02 index still mirrors the row under the pointer or
// focus. Hover row 3, then Tab-focus row 5: the preview's data-active, its caption and its top layer's image follow,
// with exactly one layer left once settled, the static fallback not in use, and no console error.
const fs = require('fs');
const { launch, ctx, BASE, DATA, OUT } = require('./lib');
(async () => {
  const b = await launch();
  const out = [];
  for (const [setting, q] of [['full', '?motion=full'], ['lite (Save-Data)', ''], ['none (reduced motion)', '']]) {
    const c = await ctx(b, 'd1440', setting.startsWith('none') ? { reducedMotion: 'reduce' } : {});
    const p = await c.newPage();
    await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
    if (setting.startsWith('lite')) await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'connection', { get: () => ({ saveData: true }) }));
    const errors = [];
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });
    p.on('pageerror', (e) => errors.push('pageerror ' + e.message.slice(0, 140)));
    await p.goto(`${BASE}/${q}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    await p.evaluate(() => document.getElementById('behandlungen').scrollIntoView());
    await p.waitForTimeout(600);
    const state = () => p.evaluate(() => {
      const s = document.querySelector('[data-scene="index-preview"]');
      const layers = [...document.querySelectorAll('[data-preview-layer]')];
      const top = layers[layers.length - 1];
      return { tier: document.documentElement.dataset.motion, island: !!s, active: s?.dataset.active, caption: document.querySelector('[data-preview-caption] p')?.textContent.trim(), layers: layers.map((l) => l.dataset.state), topImg: (top?.querySelector('img')?.currentSrc || '').replace(/^.*images%2Fcategories%2F/, '').replace(/&.*$/, '') };
    });
    const rows = p.locator('#behandlungen a[href^="/behandlungen/"]:visible');
    await rows.nth(2).hover();
    await p.waitForTimeout(1500);
    const afterHover = await state();
    await rows.nth(4).focus();
    await p.waitForTimeout(1500);
    const afterFocus = await state();
    const row = { setting, afterHover, afterFocus, errors };
    console.log(JSON.stringify(row));
    out.push(row);
    await p.screenshot({ path: `${OUT}/index-preview-${setting.split(' ')[0]}.png` });
    await c.close();
  }
  fs.writeFileSync(`${DATA}/index-preview.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
