// Walk the whole page at one viewport/tier: gradual scroll, a viewport screenshot every `stepFrac` of a viewport.
// usage: node walk.js <vp> <tier> [stepFrac] [extra: reduce|nojs]
const { launch, ctx, BASE, TMP, scrollToY, settle } = require('./lib');
const fs = require('fs');
(async () => {
  const [vp, tier = 'full', stepFrac = '0.9', extra = ''] = process.argv.slice(2);
  const b = await launch();
  const c = await ctx(b, vp, extra === 'nojs' ? { javaScriptEnabled: false } : {});
  const p = await c.newPage();
  if (extra === 'reduce') await p.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  const q = tier === 'auto' ? '' : `?motion=${tier}`;
  await p.goto(`${BASE}/${q}`, { waitUntil: 'networkidle' });
  await settle(p, 1200);
  const dir = `${TMP}/walk-${vp}-${tier}${extra ? '-' + extra : ''}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const vh = await p.evaluate(() => innerHeight);
  let y = 0, i = 0;
  const log = [];
  while (true) {
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    await scrollToY(p, y, 120);
    await settle(p, 900);
    const st = await p.evaluate(() => ({
      y: Math.round(scrollY),
      ch: document.documentElement.dataset.chapterActive,
      dock: document.documentElement.dataset.dock,
      hdr: document.documentElement.dataset.headerTheme,
      hid: document.documentElement.dataset.headerHidden,
    }));
    const name = `${String(i).padStart(2, '0')}-y${st.y}-ch${st.ch || 'x'}.png`;
    await p.screenshot({ path: `${dir}/${name}` });
    log.push({ i, ...st });
    i++;
    if (st.y + vh >= H - 2) break;
    y += Math.round(vh * Number(stepFrac));
    if (i > 60) break;
  }
  fs.writeFileSync(`${dir}/log.json`, JSON.stringify({ log, errors }, null, 1));
  console.log(vp, tier, extra, 'shots', i, 'errors', errors.length, errors.slice(0, 5));
  await b.close();
})();
