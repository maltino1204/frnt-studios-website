// Hero geometry at load (RT-8, RT-12 / I-13): Ortszeile vs dock, arch size, booking entry (PLZ field, CTA) vs the
// first viewport, plus a screenshot of the first view. Visitor tier (webdriver masked), demo build as served.
// usage: node hero-geom.js <label> [vp,vp,…]   (viewports from lib.js, plus t820 = 820 × 1180, l1023 = 1023 × 768)
const { launch, BASE, OUT, DATA, VIEWPORTS, fs } = require('./lib');
const EXTRA = {
  t820: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  l1023: { viewport: { width: 1023, height: 768 }, hasTouch: true },
};
(async () => {
  const [label = 'now', list = 'm390,m412,m430,m390s,m360,t768,t820,l1023,d1024,d1440'] = process.argv.slice(2);
  const b = await launch();
  const out = {};
  for (const vp of list.split(',')) {
    const conf = VIEWPORTS[vp] || EXTRA[vp];
    const c = await b.newContext({ ...conf, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
    const p = await c.newPage();
    await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
    await p.goto(`${BASE}/`, { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    const g = await p.evaluate(() => {
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) }; };
      const hero = document.querySelector('#bei-dir');
      const dock = document.querySelector('.lp-dock');
      const dockShown = dock && getComputedStyle(dock).visibility !== 'hidden' && getComputedStyle(dock).display !== 'none';
      const ort = hero.querySelector('.lp-hero-figure [data-ortszeile]') || hero.querySelector('.lp-hero-figure figcaption');
      return {
        vh: innerHeight, vw: innerWidth,
        header: r(document.querySelector('.lp-header')),
        ribbon: r(document.querySelector('[data-demo-ribbon], .demo-ribbon')),
        head: r(hero.querySelector('.lp-hero-head')),
        h1: r(hero.querySelector('h1')),
        rest: r(hero.querySelector('.lp-hero-rest')),
        sill: r(hero.querySelector('.lp-sill')),
        form: r(hero.querySelector('#termin form')),
        arch: r(hero.querySelector('.lp-hero-figure .lp-arch')),
        ortszeile: r(ort),
        lead: r(hero.querySelector('.lp-hero-lead')),
        plz: r(hero.querySelector('input[name=plz]')),
        cta: r(hero.querySelector('[data-cta="hero-search-submit"]')),
        dock: dockShown ? r(dock) : null,
        dockAttr: document.documentElement.dataset.dock || null,
      };
    });
    g.ortszeileClearOfDock = g.dock && g.ortszeile ? g.dock.top - g.ortszeile.bottom : null;
    g.entryInFirstView = g.plz && g.cta ? g.plz.top >= 0 && g.cta.bottom <= g.vh : null;
    g.archRatio = g.arch ? +(g.arch.h / g.arch.w).toFixed(3) : null;
    out[vp] = g;
    console.log(vp, `${g.vw}×${g.vh}`, 'arch', g.arch && `${g.arch.w}×${g.arch.h} @${g.arch.left}`, 'ratio', g.archRatio, '| ort bottom', g.ortszeile && g.ortszeile.bottom, '| dock top', g.dock && g.dock.top, '| clear', g.ortszeileClearOfDock, '| plz', g.plz && g.plz.top, 'cta bottom', g.cta && g.cta.bottom, 'in view', g.entryInFirstView, '| head', g.head && `${g.head.top}-${g.head.bottom}`, 'lead', g.lead && `${g.lead.top}-${g.lead.bottom}`, 'form', g.form && `${g.form.top}-${g.form.bottom}`, 'header', g.header && g.header.bottom);
    await p.screenshot({ path: `${OUT}/${label}-hero-${vp}.jpg`, quality: 78 });
    await c.close();
  }
  fs.writeFileSync(`${DATA}/hero-geom-${label}.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
