// axe-core (injected via CDP evaluate, bypasses CSP) + semantics dump + target sizes.
const fs = require('fs');
const { launch, ctx, BASE, TMP, scrollToY, settle } = require('./lib');
const AXE = fs.readFileSync('/tmp/audit-tools/node_modules/axe-core/axe.min.js', 'utf8');
(async () => {
  const [vp = 'd1440', tier = 'full'] = process.argv.slice(2);
  const b = await launch();
  const c = await ctx(b, vp);
  const p = await c.newPage();
  await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' });
  await settle(p, 1200);
  // scroll whole page so reveals settle, then back to top
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  await scrollToY(p, H, 600);
  await settle(p, 2500);
  await scrollToY(p, 0, 2000);
  await settle(p, 800);
  await p.evaluate(AXE);
  const res = await p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations', 'incomplete'] });
    const map = (arr) => arr.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, nodes: v.nodes.slice(0, 6).map((n) => ({ t: n.target.join(' '), s: (n.failureSummary || '').slice(0, 300) })) }));
    return { violations: map(r.violations), incomplete: map(r.incomplete) };
  });
  const sem = await p.evaluate(() => {
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => h.offsetParent !== null || getComputedStyle(h).position === 'fixed').map((h) => h.tagName + ' ' + (h.innerText || h.getAttribute('aria-label') || h.textContent).replace(/\s+/g, ' ').trim().slice(0, 70) + (h.closest('[aria-hidden="true"],[inert]') ? ' [hidden]' : ''));
    const allHs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].length;
    const lm = [...document.querySelectorAll('header,nav,main,footer,aside,[role=banner],[role=navigation],[role=main],[role=contentinfo],section[aria-labelledby],[role=region]')].map((e) => `${e.tagName.toLowerCase()}${e.getAttribute('role') ? '[' + e.getAttribute('role') + ']' : ''} "${e.getAttribute('aria-label') || (e.getAttribute('aria-labelledby') && document.getElementById(e.getAttribute('aria-labelledby'))?.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)) || ''}"${e.closest('[inert]') ? ' (inert)' : ''}`);
    const ems = document.querySelectorAll('h1 em, h2 em').length;
    const italic = [...document.querySelectorAll('main *')].filter((e) => getComputedStyle(e).fontStyle === 'italic' && e.children.length === 0 && e.textContent.trim()).map((e) => e.textContent.trim().slice(0, 40));
    const imgs = [...document.querySelectorAll('img')].map((i) => ({ alt: i.getAttribute('alt'), src: (i.currentSrc || i.src).replace(location.origin, '').slice(0, 90), w: i.naturalWidth, rw: Math.round(i.getBoundingClientRect().width), hid: !!i.closest('[aria-hidden="true"]') }));
    const noAlt = imgs.filter((i) => i.alt === null);
    // targets < 44 px (visible interactive)
    const small = [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[role=tab],[role=radio]')].filter((e) => {
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      if (!r.width || !r.height || cs.visibility === 'hidden' || e.closest('[inert],[aria-hidden="true"],dialog:not([open])')) return false;
      return r.width < 44 || r.height < 44;
    }).map((e) => { const r = e.getBoundingClientRect(); return `${e.tagName.toLowerCase()} "${(e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40)}" ${Math.round(r.width)}x${Math.round(r.height)} ${e.closest('footer') ? '(footer)' : ''}`; });
    const live = [...document.querySelectorAll('[aria-live],[role=status],[role=alert]')].map((e) => `${e.tagName.toLowerCase()} ${e.getAttribute('role') || ''} live=${e.getAttribute('aria-live')} "${e.textContent.trim().slice(0, 40)}"`);
    const skip = [...document.querySelectorAll('a')].slice(0, 3).map((a) => a.textContent.trim() + ' -> ' + a.getAttribute('href'));
    return { hs, allHs, lm, ems, italic: [...new Set(italic)], imgCount: imgs.length, noAlt, imgs, small, live, skip, lang: document.documentElement.lang };
  });
  fs.writeFileSync(`${TMP}/a11y-${vp}-${tier}.json`, JSON.stringify({ res, sem }, null, 1));
  console.log('violations:', res.violations.map((v) => `${v.id}(${v.impact}) x${v.n}`).join(', '));
  console.log('incomplete:', res.incomplete.map((v) => `${v.id} x${v.n}`).join(', '));
  console.log('headings', sem.hs.length, 'of', sem.allHs, '| em in h1/h2:', sem.ems, '| italic leaves:', JSON.stringify(sem.italic));
  console.log('small targets', sem.small.length);
  await b.close();
})();
