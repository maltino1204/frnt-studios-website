// (audit 4) N4-1, the passive case: a reduced-motion desktop visitor who only scrolls with the wheel, the pointer resting
// at the left third of the window (where the 02 index rows pass under it). No click, no hover call, no key.
const fs = require('fs');
const { launch, ctx, BASE, OUT, DATA } = require('./lib');
(async () => {
  const b = await launch();
  const out = [];
  for (const [x, label] of [[300, 'left third'], [1100, 'right third']]) {
    const c = await ctx(b, 'd1440', { reducedMotion: 'reduce' });
    const p = await c.newPage();
    await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().split('\n')[0].slice(0, 120)); });
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    await p.mouse.move(x, 450);
    for (let i = 0; i < 30; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(60); }
    await p.waitForTimeout(1000);
    const st = await p.evaluate(() => ({ tier: document.documentElement.dataset.motion, chapters: document.querySelectorAll('section[data-chapter]').length, errorPage: /Das hat nicht geklappt/.test(document.body.innerText), y: Math.round(scrollY) }));
    const row = { pointer: `${label} (x ${x})`, ...st, errors: [...new Set(errors)] };
    console.log(JSON.stringify(row));
    out.push(row);
    await c.close();
  }
  fs.writeFileSync(`${DATA}/index-crash-scroll.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
