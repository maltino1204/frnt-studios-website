// Early input on a throttled phone (412 × 823, 4× CPU, Slow 4G, cold, webdriver masked, ?motion=lite): the hero entry
// hydrates after the shell inside <Activity> (performance remediation 2). A visitor who types the PLZ as soon as the
// field paints, before hydration: is the value kept, does the city hint appear, and does submit carry it?
const fs = require('fs');
const { launch, BASE, DATA } = require('./lib');
const NET = { latency: 562.5, downloadThroughput: (1474.56 * 1024) / 8, uploadThroughput: (675 * 1024) / 8 };
(async () => {
  const runs = Number(process.argv[2] || 3);
  const out = [];
  for (let r = 1; r <= runs; r++) {
    const b = await launch();
    const c = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, locale: 'de-DE' });
    const p = await c.newPage();
    await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
    const cdp = await c.newCDPSession(p);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...NET });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const t0 = Date.now();
    await p.goto(`${BASE}/?motion=lite`, { waitUntil: 'commit', timeout: 120000 });
    const input = p.locator('#termin input[name="plz"]');
    await input.waitFor({ state: 'visible', timeout: 60000 });
    await input.scrollIntoViewIfNeeded();
    const tVisible = Date.now() - t0;
    await input.tap({ timeout: 20000 });
    await p.keyboard.type('10115', { delay: 60 });
    const tTyped = Date.now() - t0;
    const valueRightAfter = await input.inputValue();
    await p.waitForLoadState('load');
    await p.waitForTimeout(9000);
    const after = await p.evaluate(() => {
      const i = document.querySelector('#termin input[name="plz"]');
      const hint = [...document.querySelectorAll('#termin span')].map((s) => s.textContent.trim()).find((t) => /^·/.test(t)) || null;
      return { value: i.value, hint, focused: document.activeElement === i };
    });
    let submitted = null;
    try {
      await p.locator('#termin button[type=submit]').tap({ timeout: 10000 });
      await p.waitForURL(/\/suche/, { timeout: 30000 });
      submitted = p.url().replace(BASE, '');
    } catch (e) { submitted = 'no navigation: ' + e.message.slice(0, 80); }
    const res = { run: r, tVisible, tTyped, valueRightAfter, after, submitted };
    console.log(JSON.stringify(res));
    out.push(res);
    await b.close();
  }
  fs.writeFileSync(`${DATA}/early-input.json`, JSON.stringify(out, null, 1));
})();
