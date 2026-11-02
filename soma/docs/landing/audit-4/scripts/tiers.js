// (audit 4) Which motion tier a visitor gets (html[data-motion], before and after hydration), per viewport and setting,
// with navigator.webdriver masked (a real browser), plus the scene-ready markers the full / lite tiers set.
const fs = require('fs');
const { launch, ctx, BASE, DATA, settle } = require('./lib');
(async () => {
  const b = await launch();
  const out = [];
  const cases = [
    ['d1440', {}, ''], ['d1024', {}, ''], ['t1024', {}, ''], ['t820', {}, ''], ['t768', {}, ''], ['m390', {}, ''],
    ['d1440', { reducedMotion: 'reduce' }, 'reduce'], ['m390', { reducedMotion: 'reduce' }, 'reduce'],
    ['d1440', {}, 'saveData'], ['d1440', {}, 'unmasked'], ['d1440', {}, '?motion=lite'],
  ];
  for (const [vp, extra, note] of cases) {
    const c = await ctx(b, vp, extra);
    const p = await c.newPage();
    if (note !== 'unmasked') await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
    if (note === 'saveData') await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'connection', { get: () => ({ saveData: true }) }));
    let early = null;
    p.on('domcontentloaded', async () => { early = await p.evaluate(() => document.documentElement.dataset.motion).catch(() => null); });
    await p.goto(`${BASE}/${note.startsWith('?') ? note : ''}`, { waitUntil: 'networkidle' });
    await settle(p, 1500);
    const r = await p.evaluate(() => ({ tier: document.documentElement.dataset.motion, ready: [...document.querySelectorAll('[data-scene]')].filter((s) => s.hasAttribute('data-scene-ready')).map((s) => s.dataset.scene), scenes: [...document.querySelectorAll('[data-scene]')].map((s) => s.dataset.scene) }));
    const row = { vp, note: note || 'default', atDCL: early, ...r };
    console.log(JSON.stringify(row));
    out.push(row);
    await c.close();
  }
  fs.writeFileSync(`${DATA}/tiers.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
