// RT-12 (engineer's check): header target heights (1440, 1280, 1024), the no-JS „Kapitel“ / „Menü“ links (they reach
// the static chapter list, and a chapter link there jumps), the dock label without JS, and the 05 arches' load colour
// on the night band with images blocked (768, lite).
const { launch, ctx, BASE, OUT, DATA, fs } = require('./lib');
(async () => {
  const b = await launch(); const out = {};
  for (const vp of ['d1440', 'd1280', 'd1024']) {
    const c = await ctx(b, vp); const p = await c.newPage();
    await p.goto(`${BASE}/?motion=full`, { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    out[`targets ${vp}`] = await p.evaluate(() => [...document.querySelectorAll('.lp-header a, .lp-header button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).opacity !== '0'; }).map((e) => `${(e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 22)} ${Math.round(e.getBoundingClientRect().height)}`));
    console.log(vp, 'header targets (h px):', out[`targets ${vp}`].join(' | '));
    await c.close();
  }
  for (const vp of ['m390', 'd1280', 'd1440']) {
    const c = await ctx(b, vp, { javaScriptEnabled: false }); const p = await c.newPage();
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const trig = vp.startsWith('m') ? p.locator('.lp-dock a[href="#kapitel"]') : p.locator('header a[href="#kapitel"]:visible').first();
    const label = await trig.textContent();
    if (vp.startsWith('m')) await trig.tap(); else await trig.click();
    await p.waitForTimeout(600);
    const at = await p.evaluate(() => ({ hash: location.hash, listTop: Math.round(document.getElementById('kapitel').getBoundingClientRect().top), buttons: [...document.querySelectorAll('.lp-header button, .lp-dock button')].filter((e) => e.getBoundingClientRect().width > 0).length }));
    const link = p.locator('#kapitel a[href="#fragen"]');
    if (vp.startsWith('m')) await link.tap(); else await link.click();
    await p.waitForTimeout(600);
    const jumped = await p.evaluate(() => ({ hash: location.hash, h2: Math.round(document.getElementById('fragen-titel').getBoundingClientRect().top) }));
    out[`nojs ${vp}`] = { label: label.trim(), ...at, then: jumped };
    console.log(vp, 'no-JS', JSON.stringify(out[`nojs ${vp}`]));
    await c.close();
  }
  {
    const c = await ctx(b, 't768'); const p = await c.newPage();
    await p.route(/\.(jpg|jpeg|png|webp|avif)(\?|$)|\/_next\/image/, (r) => r.abort());
    await p.goto(`${BASE}/?motion=lite`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
    await p.evaluate(() => document.querySelector('#dein-ort .lp-essay-item').scrollIntoView({ block: 'center', behavior: 'instant' })); await p.waitForTimeout(1500);
    out.wash = await p.evaluate(() => [...document.querySelectorAll('#dein-ort .lp-arch-face')].map((f) => getComputedStyle(f).backgroundColor));
    await p.screenshot({ path: `${OUT}/t768-05-wash-before-load.png` });
    console.log('05 arch load colours (images blocked):', out.wash.join(' '));
    await c.close();
  }
  fs.writeFileSync(`${DATA}/rt12.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
