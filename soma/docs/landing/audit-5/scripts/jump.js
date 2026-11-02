// Chapter jumps from the overlay (spec § 5.1: the jump lands on the chapter and focuses its h2). Samples the target
// heading's position for 4 s after the tap, per target, at a phone (lite) and a desktop (full). New since audit 1:
// chapters 02–05 and 10 are content-visibility: auto below 1024 px with estimated intrinsic sizes.
const { launch, ctx, BASE, OUT, DATA, settle, fs } = require('./lib');
(async () => {
  const vps = (process.argv[2] || 'm390,d1440').split(',');
  const targets = (process.argv[3] || 'behandlungen,so-funktionierts,profis,fuer-profis,fragen,soma').split(',');
  const b = await launch();
  const out = {};
  for (const vp of vps) {
    for (const id of targets) {
      const c = await ctx(b, vp);
      const p = await c.newPage();
      await p.goto(`${BASE}/?motion=${vp.startsWith('d') ? 'full' : 'lite'}`, { waitUntil: 'networkidle' });
      // (audit 3) the h2 may sit below 320 px by layout (05 full tier, 08 < 1024, 10 at 768), so the section top is recorded too
      await settle(p, 1500);
      const mobile = vp.startsWith('m'); // phones: the dock's chapter button; 768: the header's „Menü“ (the dock hides while the hero entry is in view there)
      const trig = mobile ? p.locator('.lp-dock button').first() : (vp === 't768' || vp === 't820') ? p.locator('header button', { hasText: 'Menü' }).first() : p.locator('header button', { hasText: 'Kapitel' }).first();
      if (mobile || vp.startsWith('t')) await trig.tap(); else await trig.click();
      await p.waitForTimeout(900);
      const link = p.locator(`dialog[open] a[href="#${id}"]`);
      if (mobile || vp.startsWith('t')) await link.tap(); else await link.click();
      const samples = [];
      for (let i = 0; i < 16; i++) {
        await p.waitForTimeout(250);
        samples.push(await p.evaluate((x) => Math.round(document.getElementById(`${x}-titel`).getBoundingClientRect().top), id));
      }
      const fin = await p.evaluate((x) => ({ sectionTop: Math.round(document.getElementById(x).getBoundingClientRect().top), y: Math.round(scrollY), focus: document.activeElement.id, hash: location.hash, active: document.documentElement.dataset.chapterActive, h2InView: (() => { const r = document.getElementById(`${x}-titel`).getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; })() }), id);
      out[`${vp}#${id}`] = { samples, ...fin };
      if (!fin.h2InView) await p.screenshot({ path: `${OUT}/${vp}-jump-${id}-miss.png` });
      console.log(vp, id, 'final h2 top', samples[samples.length - 1], 'section top', fin.sectionTop, 'inView', fin.h2InView, 'active', fin.active, 'samples', samples.join(','));
      await c.close();
    }
  }
  fs.writeFileSync(`${DATA}/jump-${vps.join('_')}.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
