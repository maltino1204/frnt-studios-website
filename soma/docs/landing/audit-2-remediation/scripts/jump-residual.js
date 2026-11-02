// RT-1 (engineer's variant of jump.js): where the smooth scroll ended (first `scrollend`) against where the jump
// finally rests, i.e. how far the re-target at the end had to move the page (the visible correction), plus the final
// h2 top and the active chapter. Usage: node jump-residual.js [vps] [targets]
const { launch, ctx, BASE, DATA, settle, fs } = require('./lib');
(async () => {
  const vps = (process.argv[2] || 'm390,m412,t768,t1024,d1440').split(',');
  const targets = (process.argv[3] || 'behandlungen,so-funktionierts,dein-ort,profis,deine-buchung,fuer-profis,fragen,soma').split(',');
  const b = await launch();
  const out = {};
  for (const vp of vps) {
    const rows = [];
    for (const id of targets) {
      const c = await ctx(b, vp);
      const p = await c.newPage();
      await p.goto(`${BASE}/?motion=${vp.startsWith('d') ? 'full' : 'lite'}`, { waitUntil: 'networkidle' });
      await settle(p, 1500);
      const touch = vp.startsWith('m') || vp.startsWith('t');
      const dockMode = await p.evaluate(() => getComputedStyle(document.querySelector('.lp-dock')).display !== 'none');
      const trig = dockMode ? p.locator('.lp-dock button').first() : p.locator('header button', { hasText: 'Kapitel' }).first();
      if (touch) await trig.tap(); else await trig.click();
      await p.waitForTimeout(900);
      await p.evaluate(() => { window.__ends = []; window.addEventListener('scrollend', () => window.__ends.push(Math.round(scrollY))); });
      const link = p.locator(`dialog[open] a[href="#${id}"]`);
      if (touch) await link.tap(); else await link.click();
      await p.waitForTimeout(4000);
      const r = await p.evaluate((x) => ({ y: Math.round(scrollY), ends: window.__ends, h2: Math.round(document.getElementById(`${x}-titel`).getBoundingClientRect().top), sec: Math.round(document.getElementById(x).getBoundingClientRect().top), active: document.documentElement.dataset.chapterActive }), id);
      const first = r.ends.length ? r.ends[0] : r.y;
      rows.push({ id, ...r, correction: r.y - first });
      await c.close();
    }
    out[vp] = rows;
    console.log(vp, rows.map((x) => `${x.id}: h2 ${x.h2} sec ${x.sec} active ${x.active} corr ${x.correction}`).join(' | '));
  }
  fs.writeFileSync(`${DATA}/jump-residual-${process.env.TAG || 'run'}.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
