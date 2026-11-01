const { launch, BASE } = require('./lib');
(async () => { const b = await launch();
const c = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true }); const p = await c.newPage();
const cdp = await c.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: 184320, uploadThroughput: 86400 });
await p.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }); window.__lt = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ t: Math.round(e.startTime), d: Math.round(e.duration), a: (e.attribution || []).map((x) => x.containerSrc || x.containerName || x.name).join(',') }); }).observe({ type: 'longtask', buffered: true }); });
await p.goto(BASE + '/?motion=lite', { waitUntil: 'load' }); await p.waitForTimeout(8000);
console.log(await p.evaluate(() => JSON.stringify({ lt: window.__lt, marks: performance.getEntriesByType('measure').map((m) => `${m.name} @${Math.round(m.startTime)} ${Math.round(m.duration)}ms`), scripts: performance.getEntriesByType('resource').filter((r) => r.initiatorType === 'script').map((r) => `${r.name.split('/').pop()} end@${Math.round(r.responseEnd)}`).slice(-8), rsc: performance.getEntriesByType('resource').filter((r) => /_rsc/.test(r.name)).map((r) => `${r.name.split('?')[0].replace(location.origin,'')} @${Math.round(r.startTime)}`) }, null, 1)));
await b.close(); })();
