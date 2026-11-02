// Interaction latency, two ways, on a throttled phone (412 × 823, DPR 1.75, 4× CPU, Slow 4G, cold, webdriver masked):
//  - INP-like: Event Timing duration of the worst event in each interaction (what INP/Lighthouse see);
//  - visible response: event timeStamp → the first frame in which the requested UI is actually on screen
//    (rAF poll for the condition, then setTimeout(0) after that frame's paint). The landing yields to the main thread
//    before rendering its dialogs (nav/surfaces.ts yieldToMain), so the two can differ.
// usage: node latency.js [runs=3] [scenario=settled|early] [net=slow4g|none]
const fs = require('fs');
const { launch, BASE, DATA } = require('./lib');
const NET = { slow4g: { latency: 562.5, downloadThroughput: (1474.56 * 1024) / 8, uploadThroughput: (675 * 1024) / 8 }, none: null };
const CTX = { viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, locale: 'de-DE', userAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' };
const INIT = () => {
  Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });
  window.__ev = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) window.__ev.push({ id: e.interactionId, n: e.name, d: e.duration, st: e.startTime }); }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
  // visible-response probe: arm(cond, evType) → the next evType event starts a rAF poll until cond() is true
  window.__arm = (src, evType, src2) => {
    const cond = new Function('return (' + src + ')');
    const cond2 = src2 ? new Function('return (' + src2 + ')') : null;
    window.__vis = null;
    window.__vis2 = null;
    const start = (e) => {
      window.removeEventListener(evType, start, true);
      const t0 = e.timeStamp;
      const loop = () => { if (cond()) setTimeout(() => { window.__vis = Math.round(performance.now() - t0); }, 0); else if (performance.now() - t0 < 8000) requestAnimationFrame(loop); else window.__vis = -1; };
      requestAnimationFrame(loop);
      // (audit 3) a second condition, e.g. the inline list itself after its placeholder frame
      if (cond2) { const loop2 = () => { if (cond2()) setTimeout(() => { window.__vis2 = Math.round(performance.now() - t0); }, 0); else if (performance.now() - t0 < 8000) requestAnimationFrame(loop2); else window.__vis2 = -1; }; requestAnimationFrame(loop2); }
    };
    window.addEventListener(evType, start, true);
  };
};
const SHEET_OPEN = `(() => { const d = document.querySelector('dialog[open]'); return !!(d && d.querySelector('input[name=plz]') && d.getBoundingClientRect().height > 100); })()`;
const OVERLAY_OPEN = `(() => { const d = document.querySelector('dialog[open]'); return !!(d && d.querySelector('nav[aria-label="Kapitel"] a')); })()`;
// closing starts the visible response: the sheet marks [data-closing] for its exit animation, the overlay calls close()
const NO_DIALOG = `!document.querySelector('dialog[open]:not([data-closing])')`;
const WAS_OPEN = `!!document.querySelector('dialog[open] [aria-label="Behandlung wählen"]')`;
// (audit 3) the list itself, not the height-holding frame that now opens with the tap
const WAS_LIST = `!!document.querySelector('dialog[open] [aria-label="Behandlung wählen"]:not([aria-busy]) button')`;
const HOTEL = `!!document.querySelector('[role=radio][aria-checked=true]') && document.querySelector('[role=radio][aria-checked=true]').textContent.includes('Hotel')`;
const FAQ_OPEN = `!!document.querySelector('#fragen details[open]')`;
const TAB3 = `(() => { const t = document.querySelectorAll('#deine-buchung [role=tab]')[2]; return !!t && t.getAttribute('aria-selected') === 'true'; })()`;

async function measure(p, label, src, evType, action, src2) {
  await p.evaluate(([s, t, s2]) => window.__arm(s, t, s2), [src, evType, src2 || null]);
  const n0 = await p.evaluate(() => window.__ev.length);
  await action();
  await p.waitForFunction(() => window.__vis !== null, null, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(400);
  if (src2) await p.waitForFunction(() => window.__vis2 !== null, null, { timeout: 15000 }).catch(() => {});
  const r = await p.evaluate((n) => ({ vis: window.__vis, vis2: window.__vis2, ev: window.__ev.slice(n) }), n0);
  const by = {};
  for (const e of r.ev) if (!by[e.id] || by[e.id].d < e.d) by[e.id] = e;
  const inp = Math.max(0, ...Object.values(by).map((e) => e.d));
  return { label, inp: Math.round(inp), visible: r.vis, ...(src2 ? { visible2: r.vis2 } : {}) };
}
(async () => {
  const [runs = '3', scenario = 'settled', net = 'slow4g'] = process.argv.slice(2);
  const all = [];
  for (let run = 1; run <= Number(runs); run++) {
    const b = await launch();
    const c = await b.newContext(CTX);
    const p = await c.newPage();
    const cdp = await c.newCDPSession(p);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (NET[net]) await cdp.send('Network.emulateNetworkConditions', { offline: false, ...NET[net] });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.addInitScript(INIT);
    await p.goto(`${BASE}/?motion=lite`, { waitUntil: 'load', timeout: 120000 });
    const res = [];
    const tap = (loc) => loc.tap({ timeout: 15000 });
    try {
      if (scenario === 'early') {
        // A visitor who taps the dock's „Termin finden“ 1.5 s after load, before any scroll (dialogs not mounted yet).
        await p.waitForTimeout(1500);
        res.push(await measure(p, 'dock Termin finden (early, cold surfaces)', SHEET_OPEN, 'pointerdown', () => tap(p.locator('.lp-dock a, .lp-dock button').filter({ hasText: 'Termin finden' }).first())));
        await p.waitForTimeout(1500);
        res.push(await measure(p, 'Escape (close sheet)', NO_DIALOG, 'keydown', () => p.keyboard.press('Escape')));
      } else {
        await p.waitForTimeout(8000);
        res.push(await measure(p, 'place switch Im Hotel', HOTEL, 'pointerdown', () => tap(p.getByRole('radio', { name: /Im Hotel/ }))));
        await p.waitForTimeout(1500);
        // (audit 4) v2: 02 sits right under the hero, so with 02 at the scroll margin the hero's submit is still in view
        // at the top and the dock hides by design (nav-observer.ts dock rules). 400 px further down the 02 rail is in view
        // and the dock is back, the same situation as audit 3's 03 rail.
        await p.evaluate(() => { document.getElementById('behandlungen').scrollIntoView(); window.scrollBy(0, 400); });
        await p.waitForTimeout(2500);
        await p.waitForFunction(() => document.documentElement.dataset.dock === 'shown', null, { timeout: 10000 }).catch(() => {});
        res.push(await measure(p, 'dock Termin finden → sheet', SHEET_OPEN, 'pointerdown', () => tap(p.locator('.lp-dock a, .lp-dock button').filter({ hasText: 'Termin finden' }).first())));
        await p.waitForTimeout(1500);
        res.push(await measure(p, 'Was? (inline picker in sheet)', WAS_OPEN, 'pointerdown', () => tap(p.locator('dialog[open] button').filter({ hasText: 'Was?' }).first()), WAS_LIST));
        await p.waitForTimeout(1500);
        res.push(await measure(p, 'Escape (close sheet)', NO_DIALOG, 'keydown', () => p.keyboard.press('Escape')));
        await p.waitForTimeout(1500);
        await p.waitForFunction(() => document.documentElement.dataset.dock === 'shown', null, { timeout: 10000 }).catch(() => {});
        res.push(await measure(p, 'dock chapter button → overlay', OVERLAY_OPEN, 'pointerdown', () => tap(p.locator('.lp-dock button').first())));
        await p.waitForTimeout(1500);
        res.push(await measure(p, 'Escape (close overlay)', NO_DIALOG, 'keydown', () => p.keyboard.press('Escape')));
        await p.waitForTimeout(1500);
        await p.evaluate(() => document.getElementById('fragen').scrollIntoView());
        await p.waitForTimeout(2500);
        res.push(await measure(p, 'FAQ summary', FAQ_OPEN, 'pointerdown', () => tap(p.locator('#fragen summary').first())));
        await p.waitForTimeout(1200);
        // (audit 4) v1 chapter 07 (the screen tabs) no longer exists in v2; no tab interaction left on the page
      }
    } catch (e) {
      res.push({ label: 'error', err: e.message.slice(0, 200) });
    }
    console.log(`run ${run} ${scenario}:`, res.map((r) => (r.err ? `ERROR ${r.err}` : `${r.label}: INP ${r.inp} / visible ${r.visible}${r.visible2 != null ? ' / list ' + r.visible2 : ''}`)).join(' | '));
    all.push({ run, scenario, net, res });
    await b.close();
  }
  fs.writeFileSync(`${DATA}/latency-${scenario}-${net}.json`, JSON.stringify(all, null, 1));
})();
