const { launch, ctx, BASE } = require('./lib');
(async () => { const b = await launch(); const c = await ctx(b, 'd1440'); const p = await c.newPage(); await p.goto(BASE + '/?motion=full', { waitUntil: 'networkidle' });
await p.keyboard.press('Tab');
console.log(await p.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { text: e.textContent, bg: cs.backgroundColor, color: cs.color, pad: cs.padding, pos: cs.position, z: cs.zIndex, rect: [r.x, r.y, r.width, r.height].map(Math.round) }; }));
await b.close(); })();
