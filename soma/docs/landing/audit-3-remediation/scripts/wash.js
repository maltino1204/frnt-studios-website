// I-11 re-check: with images blocked (= before they load), the 05 night-band arches show their load colour. Audit 1/2:
// light category washes on Espresso. Samples the computed background of each 05 arch face at 768 (lite) and 390.
const { launch, ctx, BASE, OUT, DATA, settle, fs } = require('./lib');
(async () => {
  const b = await launch();
  const out = {};
  for (const vp of ['t768', 'm390']) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    await p.route('**/_next/image**', (r) => r.abort());
    await p.goto(`${BASE}/?motion=lite`, { waitUntil: 'networkidle' });
    await settle(p, 800);
    await p.evaluate(() => document.getElementById('dein-ort').scrollIntoView());
    for (let i = 0; i < 12; i++) { await p.evaluate(() => scrollBy(0, 400)); await p.waitForTimeout(150); }
    await p.evaluate(() => document.querySelector('#dein-ort .lp-essay-item')?.scrollIntoView({ block: 'center' }));
    await settle(p, 1500);
    out[vp] = await p.evaluate(() => [...document.querySelectorAll('#dein-ort .lp-essay-arch, #dein-ort [data-tone]')].slice(0, 8).map((e) => { const face = e.querySelector('.lp-arch-face') || e; return `${e.className.split(' ')[0]}:${getComputedStyle(face).backgroundColor}`; }));
    await p.screenshot({ path: `${OUT}/${vp}-05-wash-images-blocked.png` });
    console.log(vp, JSON.stringify(out[vp]));
    await c.close();
  }
  fs.writeFileSync(`${DATA}/wash.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
