// RT-2 (engineer's variant of stagecta.js): scroll the pinned 05 stage to each of its six steps (gradual approach,
// live geometry, as the E2E test positions it), then a real mouse click at the visible CTA's centre: hit target and
// what opened. Usage: node stagecta-steps.js [vp=d1440] [tier=full]
const { launch, ctx, BASE, DATA, settle, fs } = require('./lib');
(async () => {
  const vp = process.argv[2] || 'd1440', tier = process.argv[3] || 'full';
  const b = await launch(); const c = await ctx(b, vp); const p = await c.newPage();
  await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' }); await settle(p, 1500);
  for (let i = 0; i < 200; i++) { const t = await p.evaluate(() => document.getElementById('dein-ort').getBoundingClientRect().top); if (t < 0) break; await p.evaluate(() => scrollBy(0, 300)); await p.waitForTimeout(40); }
  const out = [];
  for (let k = 1; k <= 6; k++) {
    await p.evaluate((n) => { const s = document.querySelector('[data-scene="stage"]'); const run = s.offsetHeight - s.querySelector('[data-stage]').offsetHeight; window.scrollTo(0, s.getBoundingClientRect().top + scrollY + run * ((n - 0.5) / 6)); }, k);
    await p.waitForTimeout(900);
    const r = await p.evaluate(() => { const a = document.querySelector('[data-cta="ch05-stage-termin"]'); const b = a.getBoundingClientRect(); const x = b.x + b.width / 2, y = b.y + b.height / 2; const hit = document.elementFromPoint(x, y); return { step: document.querySelector('[data-scene="stage"]').dataset.step, ready: document.querySelector('[data-scene="stage"]').hasAttribute('data-scene-ready'), x, y, hitIsCta: !!hit && hit.closest('a') === a, hit: hit ? `${hit.tagName}.${String(hit.className).split(' ')[0]}` : null }; });
    await p.mouse.click(r.x, r.y); await p.waitForTimeout(1200);
    r.after = await p.evaluate(() => (document.querySelector('dialog[open]') ? 'dialog open: ' + document.querySelector('dialog[open]').getAttribute('aria-label') : 'no dialog'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(700);
    out.push(r); console.log(`step ${r.step} (ready ${r.ready}) hitIsCta ${r.hitIsCta} hit ${r.hit} → ${r.after}`);
  }
  fs.writeFileSync(`${DATA}/stagecta-steps-${vp}-${tier}.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
