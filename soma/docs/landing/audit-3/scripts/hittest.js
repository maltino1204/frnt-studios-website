// Occlusion check: while scrolling the whole page, every visible link/button/summary/tab in main and the footer must
// be the element under its own centre (elementFromPoint). Reports controls that are visible (opacity > 0.5) but
// covered by something else, i.e. look clickable and are not. Fixed chrome (header, dock) covering content is
// reported separately as `underChrome`.
const { launch, ctx, BASE, DATA, settle, fs } = require('./lib');
(async () => {
  const vp = process.argv[2] || 'd1440', tier = process.argv[3] || 'full';
  const b = await launch(); const c = await ctx(b, vp); const p = await c.newPage();
  await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' }); await settle(p, 1500);
  const found = new Map();
  for (let i = 0; i < 400; i++) {
    const r = await p.evaluate(() => {
      const res = [];
      const ctl = [...document.querySelectorAll('main a[href], main button, main summary, main [role=tab], footer a[href]')];
      for (const el of ctl) {
        const b = el.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) continue;
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        if (cy < 70 || cy > innerHeight - 4 || cx < 0 || cx > innerWidth) continue;
        let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); o *= +cs.opacity; if (cs.visibility === 'hidden' || cs.display === 'none') o = 0; }
        if (o < 0.5) continue;
        const hit = document.elementFromPoint(cx, cy);
        if (!hit || el === hit || el.contains(hit)) continue;
        const chrome = hit.closest('.lp-header, .lp-dock');
        const label = `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 32)}" ${el.dataset.cta || ''}`;
        res.push({ label, hit: `${hit.tagName.toLowerCase()}.${String(hit.className).split(' ')[0]}`, chrome: !!chrome, ch: document.documentElement.dataset.chapterActive });
      }
      return { res, done: scrollY + innerHeight >= document.documentElement.scrollHeight - 2 };
    });
    for (const x of r.res) { const k = x.label + '|' + x.hit; if (!found.has(k)) found.set(k, { ...x, n: 0 }); found.get(k).n++; }
    if (r.done) break;
    await p.evaluate(() => scrollBy(0, 180)); await p.waitForTimeout(140);
  }
  const all = [...found.values()];
  const covered = all.filter((x) => !x.chrome);
  const underChrome = all.filter((x) => x.chrome);
  fs.writeFileSync(`${DATA}/hittest-${vp}-${tier}.json`, JSON.stringify({ covered, underChrome }, null, 1));
  console.log(vp, tier, 'covered (not by header/dock):', covered.length);
  for (const x of covered) console.log('  ', x.ch, x.label, '← under', x.hit, '×' + x.n);
  console.log('  under header/dock (transient while scrolling):', underChrome.length);
  await b.close();
})();
