// (audit 4) N4-2: the hero preload fetches a different width than the hero <img> where the arch is capped (390 × 844
// DPR 2, 768 × 1024, 820 × 1180): Chromium evaluates the same `sizes` string differently for <link imagesizes> (falls
// back to the uncapped entry) and for the <img>, so two copies of the LCP photo are fetched and the one used is not
// preloaded. This measures what it costs: hero requests (width, start, end, bytes) and LCP, Slow 4G, cold, webdriver
// masked, 3 runs each; CPU 4× on phones, 1× on tablets. 412 × 823 (Lighthouse's Moto) as the unaffected control.
// usage: node preload-lcp.js [runs=3]
const fs = require('fs');
const { launch, BASE, DATA } = require('./lib');
const NET = { latency: 562.5, downloadThroughput: (1474.56 * 1024) / 8, uploadThroughput: (675 * 1024) / 8 };
const CASES = {
  m390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, cpu: 4 },
  m412: { viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, cpu: 4 },
  t768: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, cpu: 1 },
  t820: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, cpu: 1 },
};
(async () => {
  const runs = Number(process.argv[2] || 3);
  const out = {};
  for (const [vp, { cpu, ...opts }] of Object.entries(CASES)) {
    out[vp] = [];
    for (let run = 1; run <= runs; run++) {
      const b = await launch();
      const c = await b.newContext({ ...opts, locale: 'de-DE' });
      const p = await c.newPage();
      await p.addInitScript(() => {
        Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });
        window.__lcp = [];
        new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp.push({ t: Math.round(e.startTime), url: (e.url || '').replace(/^.*w=/, 'w=') }); }).observe({ type: 'largest-contentful-paint', buffered: true });
      });
      const cdp = await c.newCDPSession(p);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', { offline: false, ...NET });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
      const reqs = new Map();
      let t0 = null;
      cdp.on('Network.requestWillBeSent', (e) => { if (t0 === null) t0 = e.timestamp; if (e.request.url.includes('hero-home-4x5')) reqs.set(e.requestId, { w: decodeURIComponent(e.request.url).replace(/^.*w=(\d+).*$/, '$1'), start: Math.round((e.timestamp - t0) * 1000), prio: e.request.initialPriority }); });
      cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) { r.end = Math.round((e.timestamp - t0) * 1000); r.kb = +(e.encodedDataLength / 1024).toFixed(1); } });
      await p.goto(`${BASE}/`, { waitUntil: 'load', timeout: 120000 });
      await p.waitForTimeout(4000);
      const lcp = await p.evaluate(() => window.__lcp);
      const last = lcp[lcp.length - 1] || {};
      const row = { run, lcp: last.t, lcpUrl: last.url, hero: [...reqs.values()] };
      console.log(vp, JSON.stringify(row));
      out[vp].push(row);
      await b.close();
    }
  }
  fs.writeFileSync(`${DATA}/preload-lcp.json`, JSON.stringify(out, null, 1));
})();
