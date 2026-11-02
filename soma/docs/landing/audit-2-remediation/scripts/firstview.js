// First view at every audited viewport (visitor tier): screenshot + hero geometry (tagline lines, booking control in
// view, Ortszeile vs fold, placeholder fit, dock state, header targets).
const { launch, ctx, BASE, OUT, DATA, settle, fs, visitorTier, watchConsole } = require('./lib');
(async () => {
  const vps = process.argv[2] ? process.argv[2].split(',') : ['d1920', 'd1440', 'd1280', 'd1280s', 't1024', 't768', 'm430', 'm412', 'm390', 'm390s', 'm360', 'm320'];
  const b = await launch();
  const all = {};
  for (const vp of vps) {
    const tier = visitorTier(vp) === 'full' && vp !== 't1024' ? 'full' : 'lite';
    const c = await ctx(b, vp);
    const p = await c.newPage();
    const errs = [];
    watchConsole(p, errs, vp);
    await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' });
    await settle(p, 2200);
    await p.screenshot({ path: `${OUT}/hero-${vp}.png` });
    const g = await p.evaluate(() => {
      const vh = innerHeight;
      const rect = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width), l: Math.round(r.left) }; };
      const tag = document.querySelector('.lp-hero-tagline');
      const lh = parseFloat(getComputedStyle(tag).lineHeight);
      const i = document.querySelector('#termin input[name=plz]');
      const cs = getComputedStyle(i);
      const measure = (inp) => { const cs = getComputedStyle(inp); const s = document.createElement('span'); for (const k of ['fontFamily','fontSize','fontWeight','fontStyle','fontStretch','fontVariationSettings','letterSpacing','fontFeatureSettings','fontKerning']) s.style[k] = cs[k]; s.style.position = 'absolute'; s.style.whiteSpace = 'pre'; s.style.visibility = 'hidden'; s.textContent = inp.placeholder; document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return w; };
      const avail = i.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const submit = rect('#termin button[type=submit]');
      const hdrTargets = [...document.querySelectorAll('.lp-header a, .lp-header button')].filter((e) => e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).opacity !== '0').map((e) => `${(e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 22)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
      return {
        vw: innerWidth, vh, motion: document.documentElement.dataset.motion, dock: document.documentElement.dataset.dock || null,
        taglineLines: Math.round(tag.getBoundingClientRect().height / lh), taglinePx: parseFloat(getComputedStyle(tag).fontSize),
        figure: rect('#hero-ort'), caption: rect('#hero-ort figcaption'), card: rect('#termin'), submit,
        submitInView: !!submit && submit.top >= 0 && submit.bottom <= vh,
        captionInView: (() => { const r = rect('#hero-ort figcaption'); return !!r && r.bottom <= vh; })(),
        placeholder: i.placeholder, placeholderFits: measure(i) <= avail + 0.5, placeholderNeed: Math.round(measure(i)), stretch: cs.fontStretch, placeholderAvail: Math.round(avail),
        ribbon: rect('[data-demo-ribbon], .demo-ribbon, [aria-label*="Demo"]'),
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        hdrTargets,
      };
    });
    all[vp] = { tier, ...g, errors: errs };
    console.log(vp, tier, JSON.stringify({ lines: g.taglineLines, px: g.taglinePx, dock: g.dock, submitInView: g.submitInView, captionInView: g.captionInView, cardTop: g.card && g.card.top, ph: `${g.placeholder} ${g.placeholderNeed}/${g.placeholderAvail}`, ox: g.overflowX, errs: errs.length }));
    await c.close();
  }
  fs.writeFileSync(`${DATA}/firstview.json`, JSON.stringify(all, null, 1));
  await b.close();
})();
