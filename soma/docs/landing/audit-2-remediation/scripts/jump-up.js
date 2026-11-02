// RT-1 (engineer's variant of jump.js): upward overlay jumps after an instant scroll to the end of the page.
// Upward overlay jumps after an instant scroll to the bottom (intermediate chapters never rendered).
const { launch, ctx, BASE } = require('./lib');
(async () => {
  const b = await launch();
  const vps = (process.argv[2] || 'm390,d1440').split(',');
  const targets = (process.argv[3] || 'behandlungen,so-funktionierts,profis').split(',');
  for (const vp of vps) for (const id of targets) {
    const c = await ctx(b, vp); const p = await c.newPage();
    await p.goto(`${BASE}/?motion=${vp.startsWith('d') ? 'full' : 'lite'}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);
    await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await p.waitForTimeout(1200);
    const mobile = vp.startsWith('m');
    const trig = mobile ? p.locator('.lp-dock button').first() : p.locator('header button', { hasText: 'Kapitel' }).first();
    if (mobile) await trig.tap(); else await trig.click();
    await p.waitForTimeout(900);
    const link = p.locator(`dialog[open] a[href="#${id}"]`);
    if (mobile) await link.tap(); else await link.click();
    const s = [];
    for (let i = 0; i < 16; i++) { await p.waitForTimeout(250); s.push(await p.evaluate((x) => Math.round(document.getElementById(`${x}-titel`).getBoundingClientRect().top), id)); }
    const active = await p.evaluate(() => document.documentElement.dataset.chapterActive);
    console.log(vp, 'up→', id, 'final', s[s.length - 1], 'active', active, s.join(','));
    await c.close();
  }
  await b.close();
})();
