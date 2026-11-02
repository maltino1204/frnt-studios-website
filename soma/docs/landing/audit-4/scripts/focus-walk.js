// (audit 4) Whole-page keyboard walk after the declutter: Tab from the top to the footer at each width and record every
// stop's chapter, document position and visibility. Flags (1) order breaks: the chapter number goes down, or the stop is
// > 80 px above the previous stop in the same chapter while not inside a horizontal rail; (2) invisible stops: zero box,
// opacity 0, visibility hidden, or not in the viewport after the browser scrolled it into view; (3) duplicates in a row.
// usage: node focus-walk.js [vps=t768,t820,t1023,d1024,d1440,m390] (tier none: no reveal / pin can hide a stop)
const fs = require('fs');
const { launch, ctx, BASE, DATA, settle } = require('./lib');
(async () => {
  const vps = (process.argv[2] || 't768,t820,t1023,d1024,d1440,m390').split(',');
  const b = await launch();
  const out = {};
  for (const vp of vps) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=none`, { waitUntil: 'networkidle' });
    await settle(p, 800);
    const stops = [];
    let footer = false;
    for (let i = 0; i < 260 && !footer; i++) {
      await p.keyboard.press('Tab');
      await p.waitForTimeout(60);
      const s = await p.evaluate(() => {
        const e = document.activeElement;
        if (!e || e === document.body) return null;
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        const sec = e.closest('section[data-chapter]');
        let hiddenBy = null;
        for (let n = e; n && n !== document.documentElement; n = n.parentElement) { const s = getComputedStyle(n); if (s.opacity === '0') { hiddenBy = 'opacity0'; break; } if (s.visibility === 'hidden') { hiddenBy = 'visibility'; break; } }
        const rail = !!e.closest('[data-rail], [role=list][class*="overflow-x"], .overflow-x-auto, [class*="snap-x"]');
        return {
          where: e.closest('footer') ? 'footer' : e.closest('header') ? 'header' : e.closest('dialog') ? 'dialog' : sec ? `${sec.dataset.chapter}` : e.closest('main') ? 'main' : 'other',
          tag: e.tagName.toLowerCase(), text: (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40), href: e.getAttribute('href'),
          top: Math.round(r.top + scrollY), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height),
          inView: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth, hiddenBy, rail, outline: cs.outlineStyle !== 'none' || cs.boxShadow !== 'none',
        };
      });
      if (!s) continue;
      stops.push(s);
      if (s.where === 'footer' && stops.filter((x) => x.where === 'footer').length > 25) footer = true;
    }
    const issues = [];
    let prev = null;
    for (const [i, s] of stops.entries()) {
      if (s.w === 0 || s.h === 0 || s.hiddenBy || !s.inView) issues.push({ i, kind: 'invisible', ...s });
      if (prev && /^\d+$/.test(s.where) && /^\d+$/.test(prev.where)) {
        if (Number(s.where) < Number(prev.where)) issues.push({ i, kind: 'chapter-back', from: prev.where, ...s });
        else if (s.where === prev.where && s.top < prev.top - 80 && !s.rail && !prev.rail) issues.push({ i, kind: 'up-jump', dy: s.top - prev.top, prevText: prev.text, ...s });
      }
      if (prev && prev.text === s.text && prev.href === s.href && prev.top === s.top) issues.push({ i, kind: 'duplicate', ...s });
      if (/^\d+$/.test(s.where) || s.where === 'header' || s.where === 'footer') prev = s;
    }
    out[vp] = { count: stops.length, chapters: [...new Set(stops.map((s) => s.where))], issues, stops };
    console.log(vp, 'stops', stops.length, 'chapters', out[vp].chapters.join('>'), 'issues', issues.length, JSON.stringify(issues.map((x) => `${x.kind}@${x.i}:${x.where}:${x.text}`)).slice(0, 600));
    await c.close();
  }
  fs.writeFileSync(`${DATA}/focus-walk.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
