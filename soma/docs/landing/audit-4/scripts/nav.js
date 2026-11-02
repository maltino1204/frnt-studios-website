// (audit 4) v2 navigation: the header's links per width, the chapter overlay's chapters and „Seiten“, the no-JS static
// list (#kapitel), the links to /entdecken and /hilfe on the landing, and the status of each target.
const fs = require('fs');
const { launch, ctx, BASE, DATA, OUT, settle } = require('./lib');
(async () => {
  const b = await launch();
  const out = { header: {}, overlay: {}, nojs: {}, links: {}, status: {} };
  for (const vp of ['d1920', 'd1440', 'd1280', 'd1024', 't768', 'm390']) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=none`, { waitUntil: 'networkidle' });
    await settle(p, 600);
    out.header[vp] = await p.evaluate(() => [...document.querySelectorAll('header a, header button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; }).map((e) => `${(e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim()}${e.getAttribute('href') ? ' → ' + e.getAttribute('href') : ''} [${Math.round(e.getBoundingClientRect().height)}]`));
    // open the chapter overlay (header „Kapitel“ / „Menü“, or the dock's chapter button on phones)
    const trig = p.locator('header button:visible', { hasText: /Kapitel|Menü/ }).first();
    if (await trig.count()) {
      await trig.click();
      await p.waitForTimeout(900);
      out.overlay[vp] = await p.evaluate(() => { const d = document.querySelector('dialog[open]'); if (!d) return null; return { chapters: [...d.querySelectorAll('nav[aria-label="Kapitel"] a')].map((a) => `${a.textContent.replace(/\s+/g, ' ').trim()} → ${a.getAttribute('href')}`), other: [...d.querySelectorAll('a')].filter((a) => !a.closest('nav[aria-label="Kapitel"]')).map((a) => `${a.textContent.replace(/\s+/g, ' ').trim()} → ${a.getAttribute('href')}`) }; });
      if (vp === 'd1440' || vp === 'm390') await p.screenshot({ path: `${OUT}/nav-overlay-${vp}.png` });
      await p.keyboard.press('Escape');
      await p.waitForTimeout(500);
    }
    if (vp === 'd1440') {
      out.links = await p.evaluate(() => [...document.querySelectorAll('main a[href^="/entdecken"], main a[href^="/hilfe"], footer a[href^="/entdecken"], footer a[href^="/hilfe"]')].map((a) => ({ text: a.textContent.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href'), chapter: a.closest('section[data-chapter]')?.id || (a.closest('footer') ? 'footer' : null) })));
    }
    await c.close();
  }
  for (const vp of ['d1440', 'm390']) {
    const c = await ctx(b, vp, { javaScriptEnabled: false });
    const p = await c.newPage();
    await p.goto(`${BASE}/`, { waitUntil: 'load' });
    out.nojs[vp] = await p.evaluate(() => { const k = document.getElementById('kapitel'); return { exists: !!k, links: k ? [...k.querySelectorAll('a')].map((a) => `${a.textContent.replace(/\s+/g, ' ').trim()} → ${a.getAttribute('href')}`) : [], headerLinks: [...document.querySelectorAll('header a')].filter((a) => a.getBoundingClientRect().width > 0).map((a) => `${a.textContent.replace(/\s+/g, ' ').trim()} → ${a.getAttribute('href')}`), faqDetails: document.querySelectorAll('#fragen details').length, allFragen: [...document.querySelectorAll('#fragen a')].map((a) => `${a.textContent.trim()} → ${a.getAttribute('href')}`) }; });
    await c.close();
  }
  const targets = new Set(['/entdecken', '/hilfe', '/behandlungen', '/staedte', '/fuer-profis']);
  for (const l of out.links) targets.add(l.href);
  for (const v of Object.values(out.overlay)) if (v) for (const s of [...v.chapters, ...v.other]) { const h = s.split(' → ')[1]; if (h && h.startsWith('/')) targets.add(h); }
  for (const t of targets) { const r = await fetch(BASE + t, { redirect: 'manual' }); out.status[t] = r.status; }
  console.log(JSON.stringify(out, null, 1));
  fs.writeFileSync(`${DATA}/nav.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
