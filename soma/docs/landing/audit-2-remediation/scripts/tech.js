// Technical checks: console/hydration errors per viewport, JSON-LD vs visible FAQ, DOM size, HTML weight, Activity
// markers, outlined Suspense segments, anchors, internal link status, and no-JS behaviour (header, portraits, dock,
// menu, motion attribute, scripting media query).
const { launch, ctx, BASE, DATA, settle, scrollToY, watchConsole, fs, visitorTier } = require('./lib');
(async () => {
  const out = { consoleByVp: {}, };
  const b = await launch();
  // 1. Console + hydration at every viewport (visitor tier, masked webdriver so the visitor code path runs)
  for (const vp of ['d1440', 'd1280', 't1024', 't768', 'm430', 'm412', 'm390', 'm320']) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
    const msgs = [];
    watchConsole(p, msgs, vp);
    await p.goto(`${BASE}/`, { waitUntil: 'load', timeout: 60000 });
    await settle(p, 2500);
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    await scrollToY(p, H, 500, 60);
    await settle(p, 2500);
    const st = await p.evaluate(() => ({ motion: document.documentElement.dataset.motion, overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
    out.consoleByVp[vp] = { ...st, msgs };
    console.error('console pass', vp, msgs.length);
    await c.close();
  }
  // 2. Static structure on the served HTML
  const html = await (await fetch(`${BASE}/`)).text();
  out.htmlBytes = html.length;
  out.activityMarkers = (html.match(/<!--&-->/g) || []).length;
  out.outlinedSegments = (html.match(/<div hidden id="S:/g) || []).length;
  out.suspenseFallbackMarkers = (html.match(/<!--\$\?-->/g) || []).length;
  out.tierScriptInHtml = html.includes('data-motion",t');
  const c = await ctx(b, 'd1440');
  const p = await c.newPage();
  await p.goto(`${BASE}/?motion=none`, { waitUntil: 'networkidle' });
  await settle(p, 800);
  out.struct = await p.evaluate(() => {
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent); } catch (e) { return { parseError: String(e) }; } });
    const graph = ld.flatMap((x) => x['@graph'] || [x]);
    const faqLd = graph.find((g) => g['@type'] === 'FAQPage');
    const faqVisible = [...document.querySelectorAll('#fragen details')].map((d) => ({ q: d.querySelector('summary').textContent.replace(/\s+/g, ' ').trim(), a: [...d.children].filter((x) => x.tagName !== 'SUMMARY').map((x) => x.textContent).join(' ').replace(/\s+/g, ' ').trim() }));
    const faqLdItems = faqLd ? faqLd.mainEntity.map((m) => ({ q: m.name, a: (m.acceptedAnswer.text || '').replace(/\s+/g, ' ').trim() })) : [];
    const faqMatch = faqLdItems.length === faqVisible.length && faqLdItems.every((x, i) => faqVisible[i].q.includes(x.q) && faqVisible[i].a.replace(/[\u00a0\s]+/g, ' ').includes(x.a.replace(/[\u00a0\s]+/g, ' ').slice(0, 60)));
    const anchors = [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1);
    const badAnchors = [...new Set(anchors)].filter((h) => document.querySelectorAll(h.replace(/([^#\w-])/g, '\\$1')).length !== 1);
    const internal = [...new Set([...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')))];
    const org = graph.find((g) => g['@type'] === 'Organization');
    return {
      ldTypes: graph.map((g) => g['@type']), faqLdCount: faqLdItems.length, faqVisibleCount: faqVisible.length, faqMatch,
      orgHasAggregateRating: !!(org && org.aggregateRating), websiteHasSearchAction: !!graph.find((g) => g['@type'] === 'WebSite' && g.potentialAction),
      domNodes: document.getElementsByTagName('*').length, h1: document.querySelectorAll('h1').length,
      h2: [...document.querySelectorAll('h2')].map((h) => h.textContent.replace(/\s+/g, ' ').trim().slice(0, 50)),
      anchors: [...new Set(anchors)].length, badAnchors, internal,
      title: document.title, description: document.querySelector('meta[name=description]')?.content,
      robots: document.querySelector('meta[name=robots]')?.content, canonical: document.querySelector('link[rel=canonical]')?.href,
      og: Object.fromEntries([...document.querySelectorAll('meta[property^="og:"]')].map((m) => [m.getAttribute('property'), m.content])),
      lang: document.documentElement.lang,
      preloads: [...document.querySelectorAll('link[rel=preload]')].map((l) => `${l.getAttribute('as')} ${(l.getAttribute('href') || l.getAttribute('imagesrcset') || '').split('/').pop().slice(0, 60)} ${l.getAttribute('fetchpriority') || ''}`),
    };
  });
  // internal links resolve
  const status = {};
  for (const h of out.struct.internal) {
    const u = h.split('#')[0] || '/';
    if (status[u]) continue;
    try { const r = await fetch(`${BASE}${u}`, { redirect: 'manual', signal: AbortSignal.timeout(20000) }); status[u] = r.status; await r.arrayBuffer().catch(() => {}); } catch (e) { status[u] = 'ERR ' + e.name; }
    console.error('link', u, status[u]);
  }
  out.linkStatus = status;
  out.linkFailures = Object.entries(status).filter(([, s]) => !(s === 200 || s === 307 || s === 308));
  await c.close();
  // 3. No-JS behaviour
  for (const vp of ['d1440', 'm390']) {
    const cj = await ctx(b, vp, { javaScriptEnabled: false });
    const pj = await cj.newPage();
    await pj.goto(`${BASE}/`, { waitUntil: 'load' });
    await settle(pj, 1500);
    const top = await pj.evaluate(() => { const h = getComputedStyle(document.querySelector('.lp-header')); return { bg: h.backgroundColor, motionAttr: document.documentElement.dataset.motion || null, scriptingNone: matchMedia('(scripting: none)').matches }; });
    await pj.evaluate(() => window.scrollTo(0, document.getElementById('dein-ort').offsetTop + 200));
    await pj.waitForTimeout(400);
    const night = await pj.evaluate(() => { const h = getComputedStyle(document.querySelector('.lp-header')); return { bg: h.backgroundColor, backdrop: h.backdropFilter }; });
    await pj.evaluate(() => document.getElementById('profis').scrollIntoView());
    await pj.waitForTimeout(1500);
    const r = await pj.evaluate(([top, night]) => {
      const portraits = [...document.querySelectorAll('#profis img')].slice(0, 4).map((i) => getComputedStyle(i).opacity);
      const dock = document.querySelector('.lp-dock');
      const dcs = dock ? getComputedStyle(dock) : null;
      const menu = [...document.querySelectorAll('header a, header button, header summary')].map((e) => `${e.tagName.toLowerCase()}:${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20)}:${e.getAttribute('href') || ''}`);
      return {
        ...top, headerBgOverNight: night.bg, headerBackdrop: night.backdrop,
        portraits,
        dock: dcs ? { display: dcs.display, visibility: dcs.visibility, opacity: dcs.opacity, links: [...dock.querySelectorAll('a,button')].map((a) => `${a.tagName}:${a.textContent.trim().slice(0, 20)}:${a.getAttribute('href') || ''}`) } : null,
        headerControls: menu,
        chapters: document.querySelectorAll('section[data-chapter]').length,
        formAction: document.querySelector('form')?.getAttribute('action'),
      };
    }, [top, night]);
    out[`nojs_${vp}`] = r;
    await pj.screenshot({ path: `/home/user/frnt-studios-website/soma/docs/landing/audit-2-remediation/nojs-${vp}-profis.png` });
    await cj.close();
  }
  fs.writeFileSync(`${DATA}/tech.json`, JSON.stringify(out, null, 1));
  const brief = { ...out };
  delete brief.linkStatus;
  brief.struct = { ...out.struct, internal: out.struct.internal.length };
  console.log(JSON.stringify(brief, null, 1).slice(0, 9000));
  await b.close();
})();
