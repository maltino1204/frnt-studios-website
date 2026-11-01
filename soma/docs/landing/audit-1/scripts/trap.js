const { launch, ctx, BASE } = require('./lib');
(async () => { const b = await launch();
for (const vp of ['d1440', 'm390']) {
const c = await ctx(b, vp); const p = await c.newPage(); await p.goto(BASE + '/?motion=' + (vp[0] === 'd' ? 'full' : 'lite'), { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
if (vp[0] === 'd') { await p.locator('header button', { hasText: 'Kapitel' }).first().click(); } else { await p.evaluate(() => scrollTo(0, 3000)); await p.waitForTimeout(600); await p.locator('.lp-dock button').first().tap(); }
await p.waitForTimeout(700);
const seen = [];
for (let i = 0; i < 30; i++) { await p.keyboard.press('Tab'); seen.push(await p.evaluate(() => { const e = document.activeElement; if (e === document.body) return 'BODY'; return (e.closest('dialog[open]') ? 'in:' : 'OUT:') + e.tagName + ' ' + e.textContent.trim().slice(0, 20); })); }
console.log(vp, 'outside focus:', seen.filter((s) => s.startsWith('OUT')).length, 'body:', seen.filter((s) => s === 'BODY').length, 'stops in dialog:', new Set(seen.filter((s) => s.startsWith('in'))).size);
// mobile: page scroll locked?
if (vp[0] === 'm') { const y0 = await p.evaluate(() => scrollY); await p.mouse.wheel(0, 400); await p.waitForTimeout(300); console.log(' scroll moved behind overlay:', (await p.evaluate(() => scrollY)) - y0); }
await c.close(); }
await b.close(); })();
