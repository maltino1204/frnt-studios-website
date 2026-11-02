// Round-2 regression check for lib/scroll-jump.ts ("the visitor wins"): a visitor who touches or wheels the page while
// a long chapter jump is still running must keep control: no correction snaps the page back to the target afterwards.
// 390 (touch: a CDP touch drag 400 ms after the tap) and 1440 (wheel 400 ms after the click). Logs scrollY right after
// the visitor's input and 2.5 s later.
const { launch, ctx, BASE, DATA, settle, fs } = require('./lib');
(async () => {
  const b = await launch();
  const out = [];
  for (const vp of ['m390', 'd1440']) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    // log every scrollIntoView call (behavior, time) to tell the library's corrections from the native smooth scroll
    await p.addInitScript(() => { window.__siv = []; const o = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function (a) { window.__siv.push({ t: Math.round(performance.now()), id: this.id, b: a && a.behavior }); return o.apply(this, arguments); }; window.__inputAt = null; for (const t of ['wheel', 'touchstart']) window.addEventListener(t, () => { if (window.__inputAt == null) window.__inputAt = Math.round(performance.now()); }, true); });
    await p.goto(`${BASE}/?motion=${vp.startsWith('d') ? 'full' : 'lite'}`, { waitUntil: 'networkidle' });
    await settle(p, 1500);
    const mobile = vp.startsWith('m');
    const trig = mobile ? p.locator('.lp-dock button').first() : p.locator('header button', { hasText: 'Kapitel' }).first();
    if (mobile) await trig.tap(); else await trig.click();
    await p.waitForTimeout(900);
    const link = p.locator('dialog[open] a[href="#fragen"]');
    if (mobile) await link.tap(); else await link.click();
    await p.waitForTimeout(400);
    if (mobile) {
      const cdp = await c.newCDPSession(p);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 500 }] });
      for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 500 + i * 30 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await p.mouse.move(700, 450);
      await p.mouse.wheel(0, -300);
    }
    await p.waitForTimeout(150);
    const after = await p.evaluate(() => Math.round(scrollY));
    await p.waitForTimeout(2500);
    const calls = await p.evaluate(() => ({ siv: window.__siv, inputAt: window.__inputAt }));
    const later = await p.evaluate(() => ({ y: Math.round(scrollY), h2: Math.round(document.getElementById('fragen-titel').getBoundingClientRect().top), active: document.documentElement.dataset.chapterActive }));
    const r = { vp, inputAt: calls.inputAt, scrollIntoViewCalls: calls.siv, correctionsAfterInput: calls.siv.filter((x) => calls.inputAt != null && x.t > calls.inputAt).length, yAfterInput: after, y2500msLater: later.y, drift: later.y - after, fragenH2Top: later.h2, active: later.active };
    console.log(JSON.stringify(r));
    out.push(r);
    await c.close();
  }
  fs.writeFileSync(`${DATA}/jump-user-input.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
