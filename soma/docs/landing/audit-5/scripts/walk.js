// Walk the whole page at one viewport/tier: gradual scroll, a viewport screenshot every `stepFrac` of a viewport,
// console/page errors, header/dock state per stop, then a contact sheet (sharp) in docs/landing/audit-2/.
// usage: node walk.js <vp> <tier|auto> [stepFrac=0.9] [extra: reduce|nojs]
const { launch, ctx, BASE, OUT, TMP, DATA, scrollToY, settle, watchConsole, fs } = require('./lib');
const sharp = require('/home/user/frnt-studios-website/soma/node_modules/sharp');
(async () => {
  const [vp, tier = 'full', stepFrac = '0.9', extra = ''] = process.argv.slice(2);
  const b = await launch();
  const c = await ctx(b, vp, extra === 'nojs' ? { javaScriptEnabled: false } : extra === 'reduce' ? { reducedMotion: 'reduce' } : {});
  const p = await c.newPage();
  const errors = [];
  watchConsole(p, errors, vp);
  const q = tier === 'auto' ? '' : `?motion=${tier}`;
  await p.goto(`${BASE}/${q}`, { waitUntil: 'networkidle' });
  await settle(p, 1200);
  const tag = `${vp}-${tier}${extra ? '-' + extra : ''}`;
  const dir = `${TMP}/walk-${tag}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const vh = await p.evaluate(() => innerHeight);
  let y = 0, i = 0;
  const log = [];
  const files = [];
  while (true) {
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    await scrollToY(p, y, 120);
    await settle(p, 900);
    const st = await p.evaluate(() => ({
      y: Math.round(scrollY),
      H: document.documentElement.scrollHeight,
      motion: document.documentElement.dataset.motion,
      ch: document.documentElement.dataset.chapterActive,
      dock: document.documentElement.dataset.dock,
      hdr: document.documentElement.dataset.headerTheme,
      hid: document.documentElement.dataset.headerHidden,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    const name = `${String(i).padStart(2, '0')}-y${st.y}-ch${st.ch || 'x'}.png`;
    await p.screenshot({ path: `${dir}/${name}` });
    files.push(`${dir}/${name}`);
    log.push({ i, ...st });
    i++;
    if (st.y + vh >= H - 2) break;
    y += Math.round(vh * Number(stepFrac));
    if (i > 70) break;
  }
  fs.writeFileSync(`${DATA}/walk-${tag}.json`, JSON.stringify({ log, errors }, null, 1));
  // contact sheet: thumbnails in a grid
  const vw = (await p.viewportSize()).width;
  const tw = vw >= 1000 ? 360 : vw >= 700 ? 240 : 180;
  const th = Math.round((tw * vh) / vw);
  const cols = vw >= 1000 ? 5 : 8;
  const rows = Math.ceil(files.length / cols);
  const thumbs = await Promise.all(files.map((f) => sharp(f).resize(tw, th).jpeg({ quality: 70 }).toBuffer()));
  await sharp({ create: { width: cols * (tw + 6) + 6, height: rows * (th + 6) + 6, channels: 3, background: '#888' } })
    .composite(thumbs.map((input, k) => ({ input, left: 6 + (k % cols) * (tw + 6), top: 6 + Math.floor(k / cols) * (th + 6) })))
    .jpeg({ quality: 72 })
    .toFile(`${OUT}/sheet-walk-${tag}.jpg`);
  console.log(tag, 'shots', i, 'H', log[log.length - 1].H, 'overflowX', log.some((l) => l.overflowX), 'errors', errors.length, errors.slice(0, 6));
  await b.close();
})();
