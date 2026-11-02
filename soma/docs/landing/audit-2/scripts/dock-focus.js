// § 11.4 debug: dock „Termin finden“ → sheet, Event Timing per event, with variants: a = scrolled to 03, b = scrolled to 04,
// c = after tapping „Buchen“ in 04 (the inp2.js sequence: a focused control before the tap), cold = 4× CPU from navigation.
// usage: node dock-focus.js a|b|c|cold
const { launch, BASE } = require('/home/user/frnt-studios-website/soma/docs/landing/audit-2/scripts/lib');
(async () => {
  const variant = process.argv[2] || 'a';
  const b = await launch();
  const c = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, locale: 'de-DE' });
  const p = await c.newPage();
  await p.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }); window.__ev = []; window.__lt = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) window.__ev.push({ n: e.name, d: e.duration, st: Math.round(e.startTime), inDelay: Math.round(e.processingStart - e.startTime), proc: Math.round(e.processingEnd - e.processingStart) }); }).observe({ type: 'event', buffered: true, durationThreshold: 16 }); new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); });
  const cdp = await c.newCDPSession(p);
  if (variant === 'cold') await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto(`${BASE}/?motion=lite`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  if (variant !== 'cold') await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const target = variant === 'b' || variant === 'c' ? 'so-funktionierts' : 'behandlungen';
  await p.evaluate((t) => document.getElementById(t).scrollIntoView(), target);
  await p.waitForTimeout(3000);
  if (variant === 'c') { await p.locator('#so-funktionierts button, #so-funktionierts a').filter({ hasText: 'Buchen' }).first().tap(); await p.waitForTimeout(1200); }
  const pre = await p.evaluate(() => ({ dialogs: [...document.querySelectorAll('dialog')].map((d) => d.getAttribute('aria-label') || d.className.slice(0, 30)), sheetInputs: document.querySelectorAll('dialog input[name=plz]').length, now: Math.round(performance.now()) }));
  const n0 = await p.evaluate(() => window.__ev.length);
  const l0 = await p.evaluate(() => window.__lt.length);
  await p.locator('.lp-dock a').filter({ hasText: 'Termin finden' }).tap();
  await p.waitForTimeout(1500);
  const post = await p.evaluate(([n, l]) => ({ ev: window.__ev.slice(n), lt: window.__lt.slice(l), open: !!document.querySelector('dialog[open] input[name=plz]') }), [n0, l0]);
  console.log(variant, JSON.stringify(pre), JSON.stringify(post));
  // second open
  await p.keyboard.press('Escape'); await p.waitForTimeout(1200);
  const n1 = await p.evaluate(() => window.__ev.length);
  await p.locator('.lp-dock a').filter({ hasText: 'Termin finden' }).tap();
  await p.waitForTimeout(1500);
  console.log(' second open', JSON.stringify(await p.evaluate((n) => window.__ev.slice(n), n1)));
  await b.close();
})();
