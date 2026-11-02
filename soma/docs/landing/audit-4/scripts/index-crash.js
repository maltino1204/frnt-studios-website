// (audit 4) N4-1: the 02 index (fine pointer, ≥ 1024) crashes the whole landing in the lite and none tiers. Hover a row,
// or Tab onto it, and React throws #185 (maximum update depth; dev build: SwapLayer's layout effect → useLayerSwap's
// settle), and the root error boundary replaces the page („Das hat nicht geklappt.“). Each case: a fresh page, the
// visitor's own tier (webdriver masked; reduced motion and Save-Data emulated where named), then hover every visible row
// (or Tab 26 times from the top), and record whether the 7 chapters are still there plus the console errors.
// usage: node index-crash.js
const fs = require('fs');
const { launch, ctx, BASE, OUT, DATA } = require('./lib');
const CASES = [
  ['d1440', 'default', 'hover'], ['d1440', 'default', 'tab'],
  ['d1440', 'reduce', 'hover'], ['d1440', 'reduce', 'tab'],
  ['d1440', 'saveData', 'hover'], ['d1280', 'reduce', 'hover'], ['d1024', 'reduce', 'hover'], ['d1920', 'reduce', 'tab'],
];
(async () => {
  const b = await launch();
  const out = [];
  for (const [vp, setting, mode] of CASES) {
    const c = await ctx(b, vp, setting === 'reduce' ? { reducedMotion: 'reduce' } : {});
    const p = await c.newPage();
    await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
    if (setting === 'saveData') await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'connection', { get: () => ({ saveData: true }) }));
    const errors = [];
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().split('\n')[0].slice(0, 160)); });
    p.on('pageerror', (e) => errors.push('pageerror ' + e.message.slice(0, 160)));
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const tier = await p.evaluate(() => document.documentElement.dataset.motion);
    if (mode === 'hover') {
      await p.evaluate(() => document.getElementById('behandlungen').scrollIntoView());
      await p.waitForTimeout(600);
      const rows = p.locator('#behandlungen a[href^="/behandlungen/"]');
      const n = await rows.count();
      for (let i = 0; i < n; i++) { const r = rows.nth(i); if (await r.isVisible().catch(() => false)) { await r.hover({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(250); } }
    } else {
      for (let i = 0; i < 26; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(80); }
    }
    await p.waitForTimeout(800);
    const st = await p.evaluate(() => ({ chapters: document.querySelectorAll('section[data-chapter]').length, errorPage: /Das hat nicht geklappt/.test(document.body.innerText), height: document.documentElement.scrollHeight }));
    const row = { vp, setting, mode, tier, ...st, errors: [...new Set(errors)] };
    console.log(JSON.stringify(row));
    out.push(row);
    if (st.errorPage && !fs.existsSync(`${OUT}/index-crash-${vp}-${setting}.png`)) await p.screenshot({ path: `${OUT}/index-crash-${vp}-${setting}.png` });
    await c.close();
  }
  fs.writeFileSync(`${DATA}/index-crash.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
