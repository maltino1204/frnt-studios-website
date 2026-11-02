// Regression checks outside `/` for the changes since audit 1: the root 404's server header (StaticSiteHeader, native
// <details> menu), the Newsreader roman preload moved into DisplayFontScope layouts, and console errors.
const { launch, ctx, BASE, OUT, DATA, settle, watchConsole, fs } = require('./lib');
(async () => {
  const b = await launch();
  const out = { routes: {} };
  const routes = ['/', '/suche?plz=10115', '/behandlungen', '/behandlungen/massage', '/staedte', '/fuer-profis', '/anmelden', '/pro/registrieren', '/hilfe', '/impressum', '/gibt-es-nicht'];
  for (const r of routes) {
    const res = await fetch(BASE + r);
    const html = await res.text();
    const preloads = [...html.matchAll(/<link[^>]+rel="preload"[^>]*>/g)].map((m) => m[0]).filter((l) => /font/.test(l)).map((l) => (l.match(/href="([^"]+)"/) || [])[1].split('/').pop());
    const c = await ctx(b, 'm390');
    const p = await c.newPage();
    const msgs = [];
    watchConsole(p, msgs, r);
    const fonts = [];
    p.on('requestfinished', (q) => { if (q.resourceType() === 'font') fonts.push(q.url().split('/').pop()); });
    await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(BASE + r, { waitUntil: 'networkidle' });
    await settle(p, 1500);
    const st = await p.evaluate(() => {
      const h = document.querySelector('h1');
      return { cls: +window.__cls.toFixed(4), h1Font: h ? getComputedStyle(h).fontFamily.split(',')[0] : null, displayLoaded: [...document.fonts].filter((f) => /display|Newsreader/i.test(f.family) && f.style === 'normal').map((f) => `${f.family}:${f.status}`) };
    });
    out.routes[r] = { status: res.status, fontPreloads: preloads, fontsFetched: fonts, ...st, console: msgs };
    console.log(r, res.status, 'preload', preloads.join(','), '| fetched', fonts.join(','), '| cls', st.cls, '| errors', msgs.length);
    await c.close();
  }
  // 404: header markup, menu disclosure at 390 and 1440, client SiteHeader not loaded
  for (const vp of ['m390', 'd1440']) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    await p.goto(BASE + '/gibt-es-nicht', { waitUntil: 'networkidle' });
    await settle(p, 800);
    await p.screenshot({ path: `${OUT}/404-${vp}.png` });
    if (vp === 'm390') {
      await p.locator('header summary').click();
      await p.waitForTimeout(500);
      out.notFoundMenu = await p.evaluate(() => { const d = document.querySelector('header details'); const r = d.getBoundingClientRect(); return { open: d.open, w: Math.round(r.width), h: Math.round(r.height), links: [...d.querySelectorAll('a')].map((a) => a.getAttribute('href')) }; });
      await p.screenshot({ path: `${OUT}/404-m390-menu.png` });
      await p.keyboard.press('Escape');
      await p.waitForTimeout(300);
      out.notFoundMenuEscCloses = await p.evaluate(() => !document.querySelector('header details').open);
    } else {
      out.notFoundDesktopLinks = await p.evaluate(() => [...document.querySelectorAll('header a')].filter((a) => a.getBoundingClientRect().width > 0).map((a) => `${a.textContent.trim() || a.getAttribute('aria-label')} -> ${a.getAttribute('href')}`));
    }
    await c.close();
  }
  fs.writeFileSync(`${DATA}/routes.json`, JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ notFoundMenu: out.notFoundMenu, esc: out.notFoundMenuEscCloses, desk: out.notFoundDesktopLinks }));
  await b.close();
})();
