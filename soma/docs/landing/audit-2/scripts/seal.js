// Note (audit 2): the chapter-10 part below measures from geometry taken once; the page height changes while scrolling
// (pins, content-visibility), so use sealtrig.js for the seal. The 02 doorway part (I-12) is valid.
// I-9 (seal idle) and I-12 (02 closing statement before line 3): full tier at 1440 × 900, gradual scroll.
// Records the band's visible share, scene state, mask progress and the header logo state, with a screenshot per stop.
const { launch, ctx, BASE, OUT, DATA, scrollToY, settle, chapterTops, fs } = require('./lib');
(async () => {
  const vp = process.argv[2] || 'd1440';
  const tier = process.argv[3] || 'full';
  const b = await launch();
  const c = await ctx(b, vp);
  const p = await c.newPage();
  await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' });
  await settle(p, 1500);
  const tops = Object.fromEntries((await chapterTops(p)).map((t) => [t.id, t]));
  const vh = await p.evaluate(() => innerHeight);
  const out = { seal: [], doorway: [] };
  // 02 doorway: where do line 3 and the closing statement become visible?
  const idee = tops.idee;
  for (let f = 0.2; f <= (process.env.SKIP_DOORWAY ? 0 : 1.21); f += 0.1) {
    await scrollToY(p, Math.round(idee.top - vh + f * vh), 60, 50);
    await settle(p, 500);
    out.doorway.push(await p.evaluate((f) => {
      const sec = document.getElementById('idee');
      const vis = (el) => { if (!el) return null; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { op: +(+cs.opacity).toFixed(2), state: el.dataset.revealState || el.closest('[data-reveal-state]')?.dataset.revealState || null, inView: r.top < innerHeight && r.bottom > 0, top: Math.round(r.top) }; };
      const lines = [...sec.querySelectorAll('[data-reveal-order], .lp-idee-text > p.type-lead')].map((el) => ({ t: el.textContent.trim().slice(0, 22), ...vis(el) }));
      return { f: +f.toFixed(1), lines };
    }, f));
  }
  // 10 seal: approach in 10 % steps of the band height
  // fresh geometry: the full tier's pinned stages (04, 05) change the page height after the first measurement
  await scrollToY(p, Math.round((await chapterTops(p)).find((t) => t.id === 'fragen').top), 300, 40);
  await settle(p, 800);
  const soma = (await chapterTops(p)).find((t) => t.id === 'soma');
  out.somaGeom = soma;
  for (const share of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8]) {
    await scrollToY(p, Math.round(soma.top - vh + share * Math.min(soma.h, vh)), 80, 50);
    await settle(p, 700);
    const st = await p.evaluate(() => {
      // (re-read the band rect at every stop)
      const s = document.querySelector('[data-scene="seal"]') || document.getElementById('soma');
      const r = document.getElementById('soma').getBoundingClientRect();
      const mark = document.querySelector('#soma svg');
      return { sealState: s.dataset.sceneState || null, sceneReady: s.hasAttribute('data-scene-ready'), visibleShare: +((Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / innerHeight).toFixed(2), bandShare: +((Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height).toFixed(2), headerLogo: document.documentElement.dataset.headerLogo || null, scene: getComputedStyle(s).getPropertyValue('--lp-scene').trim(), markOpacity: mark ? getComputedStyle(mark).opacity : null };
    });
    await p.screenshot({ path: `${OUT}/${vp}-${tier}-10-seal-${Math.round(share * 100)}.png` });
    out.seal.push({ share, ...st });
  }
  await p.waitForTimeout(2600);
  await p.screenshot({ path: `${OUT}/${vp}-${tier}-10-seal-final.png` });
  out.finalState = await p.evaluate(() => (document.querySelector('[data-scene="seal"]') || {}).dataset?.sceneState);
  fs.writeFileSync(`${DATA}/seal-doorway-${vp}-${tier}.json`, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out.seal), '\nfinal', out.finalState);
  for (const d of out.doorway) console.log(d.f, d.lines.map((l) => `${l.t}:${l.op}${l.inView ? '' : '(off)'}`).join(' | '));
  await b.close();
})();
