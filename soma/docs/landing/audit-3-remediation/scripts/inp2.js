const { launch, BASE } = require('./lib');
(async () => {
  const b = await launch();
  const res = [];
  for (let run = 0; run < 2; run++) {
  const c = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  const p = await c.newPage();
  await p.addInitScript(() => { window.__ev = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) window.__ev.push({ id: e.interactionId, d: e.duration, n: e.name, t: (e.target?.textContent || '').trim().slice(0, 25) }); }).observe({ type: 'event', buffered: true, durationThreshold: 16 }); });
  await p.goto(BASE + '/?motion=lite', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  const cdp = await c.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.evaluate(() => document.getElementById('so-funktionierts').scrollIntoView()); await p.waitForTimeout(1500);
  await p.locator('#so-funktionierts button, #so-funktionierts a').filter({ hasText: 'Buchen' }).first().tap(); await p.waitForTimeout(1200);
  await p.locator('.lp-dock a').filter({ hasText: 'Termin finden' }).tap(); await p.waitForTimeout(1500);
  await p.locator('dialog[open] button').filter({ hasText: 'Was?' }).first().tap(); await p.waitForTimeout(1200);
  await p.keyboard.press('Escape'); await p.waitForTimeout(1200);
  await p.evaluate(() => document.getElementById('deine-buchung').scrollIntoView()); await p.waitForTimeout(1500);
  await p.getByRole('tab').nth(2).tap(); await p.waitForTimeout(1200);
  const ev = await p.evaluate(() => window.__ev);
  const by = {}; for (const e of ev) if (!by[e.id] || by[e.id].d < e.d) by[e.id] = e;
  res.push(Object.values(by).map((e) => `${e.n}:${Math.round(e.d)}ms "${e.t}"`));
  await c.close(); }
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
