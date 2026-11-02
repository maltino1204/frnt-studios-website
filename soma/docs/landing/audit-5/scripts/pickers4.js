// (audit 4) CSP-safe replacement for audit-3/scripts/pickers.js. The page's CSP has no 'unsafe-eval', so Playwright's
// waitForFunction(<string>) throws EvalError there; audit-3's pickers.js swallowed that error with .catch() and so timed
// its own 30 s waits, not the picker (audit-3 M-3 was a measurement error). Here every condition is a real function, and
// the time is taken in the page from the tap's pointerdown to the first frame in which the condition holds (rAF poll,
// then setTimeout(0) after that frame's paint), as in latency.js.
//  shell: a picker surface labelled „Behandlung wählen“ is on screen (> 40 px tall)
//  list:  that surface holds the list itself („Alle Behandlungen“ and at least one button), not the placeholder frame
// Phone 412 × 823, DPR 1.75, 4× CPU, Slow 4G, cold cache, webdriver masked. The Was? tap happens as soon as React owns the
// button (hydrated). Output: data/pickers4.json.
const fs = require('fs');
const { launch, BASE, DATA, OUT } = require('./lib');
const NET = { latency: 562.5, downloadThroughput: (1474.56 * 1024) / 8, uploadThroughput: (675 * 1024) / 8 };
const PHONE = { viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, locale: 'de-DE' };
const INIT = () => {
  Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });
  const surface = () => [...document.querySelectorAll('dialog[open], [role=dialog]')].find((d) => /Behandlung wählen/.test(d.getAttribute('aria-label') || d.textContent || '') && d.getBoundingClientRect().height > 40);
  const shell = () => !!surface();
  const list = () => { const t = surface(); return !!t && /Alle Behandlungen/.test(t.textContent) && !!t.querySelector('button'); };
  addEventListener('pointerdown', (e) => {
    window.__pd = e.timeStamp;
    const poll = (cond, key) => { const loop = () => { if (cond()) setTimeout(() => { window[key] = Math.round(performance.now() - e.timeStamp); }, 0); else if (performance.now() - e.timeStamp < 20000) requestAnimationFrame(loop); else window[key] = -1; }; requestAnimationFrame(loop); };
    poll(shell, '__shellVis');
    poll(list, '__listVis');
  }, { capture: true, once: true });
};
(async () => {
  const runs = Number(process.argv[2] || 3);
  const b = await launch();
  const out = { early: [], blocked: [] };
  const pages = [['/?motion=lite', '#termin'], ['/behandlungen/massage', 'form']];
  for (const [path, scope] of pages) {
    for (let run = 1; run <= runs; run++) {
      const c = await b.newContext(PHONE);
      const p = await c.newPage();
      await p.addInitScript(INIT);
      const cdp = await c.newCDPSession(p);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', { offline: false, ...NET });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await p.goto(BASE + path, { waitUntil: 'commit', timeout: 120000 });
      const was = p.locator(`${scope} button`, { hasText: 'Was?' }).first();
      await was.waitFor({ state: 'visible', timeout: 60000 });
      await p.waitForFunction((s) => { const el = [...document.querySelectorAll(`${s} button`)].find((x) => /Was\?/.test(x.textContent)); return !!el && Object.keys(el).some((k) => k.startsWith('__reactProps')); }, scope, { timeout: 60000, polling: 50 });
      const hydratedAt = await p.evaluate(() => Math.round(performance.now()));
      await was.scrollIntoViewIfNeeded();
      await was.tap();
      await p.waitForFunction(() => window.__listVis != null && window.__shellVis != null, null, { timeout: 30000 }).catch(() => {});
      const r = await p.evaluate(() => ({ shell: window.__shellVis ?? null, list: window.__listVis ?? null, pointerdownAt: Math.round(window.__pd || 0) }));
      const row = { path, run, hydratedAt, ...r };
      console.log('early', JSON.stringify(row));
      out.early.push(row);
      if (run === 1) await p.screenshot({ path: `${OUT}/pickers-early-${path.replace(/[^a-z]/g, '') || 'home'}.png` });
      await c.close();
    }
  }
  // the pickers chunk blocked: what the control does then
  const dir = '/home/user/frnt-studios-website/soma/.next/static/chunks';
  const chunks = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && fs.readFileSync(`${dir}/${f}`, 'utf8').includes('Alle verfügbaren Profis in deiner Nähe'));
  for (const [phone, path, scope] of [[true, '/?motion=lite', '#termin'], [false, '/?motion=full', '#termin']]) {
    const c = await b.newContext(phone ? PHONE : { viewport: { width: 1440, height: 900 }, locale: 'de-DE' });
    const p = await c.newPage();
    await p.route((u) => chunks.some((ch) => u.pathname.endsWith(ch)), (r) => r.abort());
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const was = p.locator(`${scope} button`, { hasText: 'Was?' }).first();
    await was.scrollIntoViewIfNeeded();
    if (phone) await was.tap(); else await was.click();
    await p.waitForTimeout(2500);
    const st = await p.evaluate(() => ({ expanded: [...document.querySelectorAll('button')].find((x) => /Was\?/.test(x.textContent) && x.getBoundingClientRect().height > 0)?.getAttribute('aria-expanded'), surfaces: [...document.querySelectorAll('dialog[open], [role=dialog]')].filter((d) => d.getBoundingClientRect().height > 0).map((d) => `${d.getAttribute('aria-label') || ''}:${d.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)}`) }));
    const shot = `pickers-blocked-${phone ? 'm412' : 'd1440'}.png`;
    await p.screenshot({ path: `${OUT}/${shot}` });
    const r = { phone, path, chunks, ...st, shot };
    console.log('blocked', JSON.stringify(r));
    out.blocked.push(r);
    await c.close();
  }
  fs.writeFileSync(`${DATA}/pickers4.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
