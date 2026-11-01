// Lighthouse-like lab measurement with Playwright + CDP (method in audit-1.md § Performance).
// usage: node perf.js <profile: mobile|desktop> <net: slow4g|fast4g|none> <runs> [path]
const fs = require('fs');
const { launch, BASE, TMP } = require('./lib');
const NET = {
  slow4g: { latency: 562.5, downloadThroughput: (1474.56 * 1024) / 8, uploadThroughput: (675 * 1024) / 8 },
  fast4g: { latency: 165, downloadThroughput: (9000 * 1024) / 8, uploadThroughput: (1500 * 1024) / 8 },
  none: null,
};
const PROFILES = {
  mobile: { ctx: { viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' }, cpu: 4, tier: 'lite' },
  desktop: { ctx: { viewport: { width: 1350, height: 940 }, deviceScaleFactor: 1 }, cpu: 1, tier: 'full' },
};
const INIT = () => {
  window.__lcp = []; window.__cls = []; window.__lt = []; window.__ev = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp.push({ t: e.startTime, size: e.size, el: e.element ? (e.element.tagName + (e.element.id ? '#' + e.element.id : '') + ' ' + (e.element.getAttribute('src') || e.element.currentSrc || e.element.textContent || '').slice(0, 80)) : null, url: e.url }); }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls.push({ t: e.startTime, v: e.value, src: (e.sources || []).map((s) => s.node ? (s.node.nodeName + '.' + (s.node.className || '').toString().slice(0, 40)) : '?').join('|') }); }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ t: e.startTime, d: e.duration }); }).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) window.__ev.push({ name: e.name, d: e.duration, id: e.interactionId, inDelay: e.processingStart - e.startTime, proc: e.processingEnd - e.processingStart, t: e.target ? e.target.tagName + ' ' + (e.target.textContent || '').trim().slice(0, 30) : '' }); }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
};
function clsMaxSession(shifts) {
  let max = 0, cur = 0, start = -1, last = -1;
  for (const s of shifts) {
    if (start < 0 || s.t - last > 1000 || s.t - start > 5000) { cur = 0; start = s.t; }
    cur += s.v; last = s.t; max = Math.max(max, cur);
  }
  return max;
}
(async () => {
  const [profile = 'mobile', net = 'slow4g', runs = '3', pathArg = ''] = process.argv.slice(2);
  const P = PROFILES[profile];
  const results = [];
  for (let r = 0; r < Number(runs); r++) {
    const b = await launch();
    const c = await b.newContext({ ...P.ctx, locale: 'de-DE' });
    const p = await c.newPage();
    const cdp = await c.newCDPSession(p);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (NET[net]) await cdp.send('Network.emulateNetworkConditions', { offline: false, ...NET[net] });
    if (P.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: P.cpu });
    const reqs = new Map();
    cdp.on('Network.responseReceived', (e) => { reqs.set(e.requestId, { url: e.response.url, type: e.type, mime: e.response.mimeType, status: e.response.status }); });
    cdp.on('Network.loadingFinished', (e) => { const q = reqs.get(e.requestId); if (q) q.bytes = e.encodedDataLength; });
    if (process.env.MASK) await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
    await p.addInitScript(INIT);
    const url = `${BASE}/${pathArg || `?motion=${P.tier}`}`;
    const t0 = Date.now();
    await p.goto(url, { waitUntil: 'load', timeout: 120000 });
    const loadMs = Date.now() - t0;
    await p.waitForTimeout(8000); // let idle work (motion runtime import) run, like Lighthouse's quiet window
    const nav = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const fcp = performance.getEntriesByName('first-contentful-paint')[0]; return { ttfb: n.responseStart, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, fcp: fcp ? fcp.startTime : null }; });
    const m = await p.evaluate(() => ({ lcp: window.__lcp, cls: window.__cls, lt: window.__lt }));
    // interactions (INP-like): place switch, FAQ, overlay open/close
    const inter = [];
    async function tapOrClick(loc) { const bb = await loc.boundingBox(); if (!bb) return; if (P.ctx.hasTouch) await loc.tap({ timeout: 10000 }); else await loc.click({ timeout: 10000 }); }
    try {
      await tapOrClick(p.getByRole('radio', { name: /Im Hotel/ }));
      await p.waitForTimeout(1500);
      await tapOrClick(p.getByRole('radio', { name: /Im Büro/ }));
      await p.waitForTimeout(1500);
      const s = p.locator('#fragen summary').first();
      await s.scrollIntoViewIfNeeded();
      await p.waitForTimeout(800);
      await tapOrClick(s);
      await p.waitForTimeout(800);
      const trig = profile === 'mobile' ? p.locator('.lp-dock button').first() : p.locator('header button', { hasText: 'Kapitel' }).first();
      await p.waitForTimeout(500);
      await tapOrClick(trig);
      await p.waitForTimeout(1200);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(800);
    } catch (e) { inter.push('interaction error ' + e.message.slice(0, 100)); }
    const ev = await p.evaluate(() => window.__ev);
    const byId = {};
    for (const e of ev) byId[e.id] = byId[e.id] && byId[e.id].d >= e.d ? byId[e.id] : e;
    const interactions = Object.values(byId).map((e) => ({ name: e.name, d: Math.round(e.d), inDelay: Math.round(e.inDelay), proc: Math.round(e.proc), t: e.t }));
    const fcp = nav.fcp || 0;
    const tbt = m.lt.filter((x) => x.t >= fcp).reduce((a, x) => a + Math.max(0, x.d - 50), 0);
    const byType = {};
    for (const q of reqs.values()) {
      const k = q.type || 'Other';
      byType[k] = byType[k] || { n: 0, bytes: 0 };
      byType[k].n++; byType[k].bytes += q.bytes || 0;
    }
    const lastLcp = m.lcp[m.lcp.length - 1];
    const res = { run: r + 1, loadMs, ttfb: Math.round(nav.ttfb), fcp: Math.round(fcp), lcp: lastLcp ? Math.round(lastLcp.t) : null, lcpEl: lastLcp ? lastLcp.el : null, lcpCandidates: m.lcp.map((x) => `${Math.round(x.t)}:${(x.el || '').slice(0, 50)}`), cls: +clsMaxSession(m.cls).toFixed(4), clsEntries: m.cls.map((x) => `${Math.round(x.t)} ${x.v.toFixed(4)} ${x.src}`), tbt: Math.round(tbt), longTasks: m.lt.map((x) => `${Math.round(x.t)}+${Math.round(x.d)}`), interactions, inter, byType, images: [...reqs.values()].filter((q) => q.type === 'Image').map((q) => `${(q.bytes / 1024).toFixed(1)}KB ${decodeURIComponent(q.url.replace(BASE, '')).slice(0, 110)}`), fonts: [...reqs.values()].filter((q) => q.type === 'Font').map((q) => `${(q.bytes / 1024).toFixed(1)}KB ${q.url.split('/').pop()}`), scripts: [...reqs.values()].filter((q) => q.type === 'Script').map((q) => `${(q.bytes / 1024).toFixed(1)}KB ${q.url.split('/').pop()}`) };
    results.push(res);
    console.log(`run ${r + 1}: TTFB ${res.ttfb} FCP ${res.fcp} LCP ${res.lcp} (${(res.lcpEl || '').slice(0, 60)}) CLS ${res.cls} TBT ${res.tbt} longtasks ${res.longTasks.length} interactions ${JSON.stringify(interactions.map((i) => i.name + ':' + i.d))}`);
    await b.close();
  }
  fs.writeFileSync(`${TMP}/perf-${profile}-${net}${pathArg ? '-' + pathArg.replace(/[^a-z0-9]/gi, '') : ''}.json`, JSON.stringify(results, null, 1));
})();
