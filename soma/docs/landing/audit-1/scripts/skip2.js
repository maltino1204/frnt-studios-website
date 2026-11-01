const { launch, ctx, BASE, OUT } = require('./lib');
(async () => { const b = await launch(); const c = await ctx(b, 'd1440'); const p = await c.newPage(); await p.goto(BASE + '/?motion=full', { waitUntil: 'networkidle' });
await p.keyboard.press('Tab'); await p.waitForTimeout(400);
await p.screenshot({ path: OUT + '/d1440-kbd-skiplink.png', clip: { x: 0, y: 0, width: 520, height: 120 } });
await p.keyboard.press('Tab'); await p.waitForTimeout(400);
await p.screenshot({ path: OUT + '/d1440-kbd-skiplink2.png', clip: { x: 0, y: 0, width: 520, height: 120 } });
await p.keyboard.press('Enter'); await p.waitForTimeout(800);
console.log(await p.evaluate(() => document.activeElement.name + ' ' + document.activeElement.getAttribute('placeholder')));
await b.close(); })();
