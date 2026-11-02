// When do the parts of / hydrate on a throttled phone (412 × 823, 4× CPU, Slow 4G, cold, webdriver masked, lite)?
// Polls every 50 ms for React's props on: the header CTA (shell), the place switch (shell), the hero booking form
// (<Activity>), a chapter-03 link and the footer (<Activity>), next to FCP/LCP. The window between the PLZ field
// painting and the hero form hydrating is the window in which typed input is at risk (early.js).
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
    await p.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });
      window.__h = {};
      const probes = { headerCta: '.lp-dock a', placeSwitch: '[role=radio]', heroForm: '#termin form', ch03Link: '#behandlungen a', footer: 'footer a' };
      const has = (el) => !!el && Object.keys(el).some((k) => k.startsWith('__reactProps'));
      const tick = () => {
        for (const [k, s] of Object.entries(probes)) if (!window.__h[k] && has(document.querySelector(s))) window.__h[k] = Math.round(performance.now());
        if (!window.__h.plzPainted && document.querySelector('#termin input[name=plz]')) window.__h.plzInDom = window.__h.plzInDom || Math.round(performance.now());
        if (Object.keys(window.__h).length < 6) setTimeout(tick, 50);
      };
      tick();
    });
    const cdp = await c.newCDPSession(p);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...NET });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.goto(`${BASE}/?motion=lite`, { waitUntil: 'load', timeout: 120000 });
    await p.waitForTimeout(9000);
    const res = await p.evaluate(() => ({ ...window.__h, fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0) }));
    console.log(`run ${r}`, JSON.stringify(res));
    out.push(res);
    await b.close();
  }
  fs.writeFileSync(`${DATA}/hydration-timing.json`, JSON.stringify(out, null, 1));
})();
