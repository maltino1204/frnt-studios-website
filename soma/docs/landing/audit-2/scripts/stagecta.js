// 05 pinned stage (full tier): is the visible „Freie Termine finden“ actually clickable at each stage step?
// elementFromPoint at the CTA's centre, then a real mouse click there, then what opened.
const { launch, ctx, BASE, OUT, DATA, settle, fs } = require('./lib');
(async () => {
  const b = await launch();
  const c = await ctx(b, process.argv[2] || 'd1440');
  const p = await c.newPage();
  await p.goto(`${BASE}/?motion=${process.argv[3] || 'full'}`, { waitUntil: 'networkidle' });
  await settle(p, 1500);
  // gradual approach to 05 (live geometry)
  for (let i = 0; i < 200; i++) { const t = await p.evaluate(() => document.getElementById('dein-ort').getBoundingClientRect().top); if (t < 0) break; await p.evaluate(() => scrollBy(0, 300)); await p.waitForTimeout(40); }
  const out = [];
  for (let k = 0; k < 14; k++) {
    await p.evaluate(() => scrollBy(0, 450)); await p.waitForTimeout(900);
    const r = await p.evaluate(() => {
      const ctas = [...document.querySelectorAll('#dein-ort a[data-booking-open]')].map((a) => { const b = a.getBoundingClientRect(); const cs = getComputedStyle(a); let o = 1; for (let e = a; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; return { cta: a.dataset.cta, x: b.x + b.width / 2, y: b.y + b.height / 2, vis: b.bottom > 0 && b.top < innerHeight && o > 0.5 && cs.visibility !== 'hidden', o: +o.toFixed(2) }; }).filter((x) => x.vis);
      return { active: document.documentElement.dataset.chapterActive, ctas: ctas.map((x) => { const hit = document.elementFromPoint(x.x, x.y); const a = hit && hit.closest('a'); return { ...x, hitIsCta: !!a && a.dataset.cta === x.cta, hit: hit ? `${hit.tagName}.${String(hit.className).slice(0, 30)}${hit.closest('li[data-step-item]') ? ' in li#' + hit.closest('li[data-step-item]').dataset.stepItem : ''}` : null }; }) };
    });
    if (r.ctas.length) {
      const t = r.ctas[0];
      await p.mouse.click(t.x, t.y);
      await p.waitForTimeout(1200);
      t.afterClick = await p.evaluate(() => (document.querySelector('dialog[open]') ? 'dialog open: ' + document.querySelector('dialog[open]').getAttribute('aria-label') : 'no dialog, scrollY ' + Math.round(scrollY)));
      await p.keyboard.press('Escape'); await p.waitForTimeout(600);
    }
    out.push(r);
    console.log(k, r.active, JSON.stringify(r.ctas.map((x) => ({ cta: x.cta, hitIsCta: x.hitIsCta, hit: x.hit, after: x.afterClick }))));
    if (r.active === '06') break;
  }
  fs.writeFileSync(`${DATA}/stage-cta-${process.argv[2] || 'd1440'}.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
