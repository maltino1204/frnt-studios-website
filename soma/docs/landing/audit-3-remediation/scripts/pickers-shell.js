// (Remediation copy of audit-3/scripts/pickers.js, as audit-3 § 15 PR-3 asks: "add a shell condition". Everything else is
// unchanged: `tapToShell` is the first frame with the picker's sheet or popover on screen (labelled „Behandlung wählen“,
// > 40 px tall), `tapToPicker` the auditor's condition (the list itself). Output: data/pickers-shell.json.)
// Round-3 regression check: BookingEntry's Was?/Wann? now load as their own chunk (booking-entry-pickers.tsx), in the
// first idle period after the entry mounts or on intent. (1) A visitor who taps Was? as soon as the form hydrates on a
// throttled phone (412 × 823, 4× CPU, Slow 4G, cold): time from the tap to the picker on screen, on the landing hero
// and on the discovery pages that carry the entry. (2) The chunk blocked: what the control does then.
const fs = require('fs');
const { launch, BASE, DATA, OUT } = require('./lib');
const NET = { latency: 562.5, downloadThroughput: (1474.56 * 1024) / 8, uploadThroughput: (675 * 1024) / 8 };
const SHELL_VISIBLE = `(() => !![...document.querySelectorAll('dialog[open], [role=dialog]')].find((d) => /Behandlung wählen/.test(d.getAttribute('aria-label') || d.textContent || '') && d.getBoundingClientRect().height > 40))()`;
const PICKER_VISIBLE = `(() => { const t = [...document.querySelectorAll('dialog[open], [role=dialog]')].find((d) => /Behandlung wählen/.test(d.getAttribute('aria-label') || d.textContent || '') && d.getBoundingClientRect().height > 40); return !!t && /Alle Behandlungen/.test(t.textContent) && !!t.querySelector('button'); })()`;
async function ctxFor(b, phone) {
  return b.newContext(phone ? { viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, locale: 'de-DE' } : { viewport: { width: 1440, height: 900 }, locale: 'de-DE' });
}
(async () => {
  const b = await launch();
  const out = { early: [], blocked: [] };
  const pages = [['/?motion=lite', '#termin'], ['/behandlungen/massage', 'form'], ['/staedte/berlin', 'form']];
  for (const [path, scope] of pages) {
    for (let run = 1; run <= 2; run++) {
      const c = await ctxFor(b, true);
      const p = await c.newPage();
      await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
      const cdp = await c.newCDPSession(p);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', { offline: false, ...NET });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await p.goto(BASE + path, { waitUntil: 'commit', timeout: 120000 });
      const was = p.locator(`${scope} button`, { hasText: 'Was?' }).first();
      await was.waitFor({ state: 'visible', timeout: 60000 });
      // wait until React owns the button (hydrated), then tap at once
      await p.waitForFunction((s) => { const el = [...document.querySelectorAll(`${s} button`)].find((x) => /Was\?/.test(x.textContent)); return !!el && Object.keys(el).some((k) => k.startsWith('__reactProps')); }, scope, { timeout: 60000, polling: 50 });
      const tHyd = await p.evaluate(() => Math.round(performance.now()));
      await was.scrollIntoViewIfNeeded();
      const t0 = await p.evaluate(() => performance.now());
      await was.tap();
      await p.waitForFunction(SHELL_VISIBLE, null, { timeout: 30000, polling: 'raf' }).catch(() => {});
      const ts = await p.evaluate(() => performance.now());
      await p.waitForFunction(PICKER_VISIBLE, null, { timeout: 30000, polling: 'raf' }).catch(() => {});
      const t1 = await p.evaluate(() => performance.now());
      const ok = await p.evaluate(PICKER_VISIBLE);
      const r = { path, run, hydratedAt: tHyd, tapToShell: Math.round(ts - t0), tapToPicker: Math.round(t1 - t0), pickerShown: ok };
      console.log('early', JSON.stringify(r));
      out.early.push(r);
      await c.close();
    }
  }
  // blocked chunk: abort every request for the pickers chunk
  const chunks = fs.readdirSync('/home/user/frnt-studios-website/soma/.next/static/chunks').filter((f) => f.endsWith('.js') && fs.readFileSync(`/home/user/frnt-studios-website/soma/.next/static/chunks/${f}`, 'utf8').includes('Alle verfügbaren Profis in deiner Nähe'));
  for (const [phone, path, scope] of [[true, '/behandlungen/massage', 'form'], [false, '/behandlungen/massage', 'form'], [false, '/?motion=full', '#termin'], [true, '/?motion=lite', '#termin']]) {
    const c = await ctxFor(b, phone);
    const p = await c.newPage();
    await p.route((u) => chunks.some((ch) => u.pathname.endsWith(ch)), (r) => r.abort());
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const was = p.locator(`${scope} button`, { hasText: 'Was?' }).first();
    await was.scrollIntoViewIfNeeded();
    if (phone) await was.tap(); else await was.click();
    await p.waitForTimeout(2500);
    const st = await p.evaluate(() => ({ expanded: [...document.querySelectorAll('button')].find((x) => /Was\?/.test(x.textContent) && x.getBoundingClientRect().height > 0)?.getAttribute('aria-expanded'), dialogs: [...document.querySelectorAll('dialog[open], [role=dialog]')].filter((d) => d.getBoundingClientRect().height > 0).map((d) => `${d.getAttribute('aria-label') || ''}:${d.textContent.trim().slice(0, 30)}`) }));
    const name = `blocked-pickers-${phone ? 'm412' : 'd1440'}-${path.replace(/[^a-z]/g, '') || 'home'}.png`;
    await p.screenshot({ path: `${OUT}/${name}` });
    const r = { phone, path, chunks, ...st, shot: name };
    console.log('blocked', JSON.stringify(r));
    out.blocked.push(r);
    await c.close();
  }
  fs.writeFileSync(`${DATA}/pickers-shell.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
