// Conversion flows: hero search (JS), no-JS submit, all internal links resolve, CTA targets.
const { launch, ctx, BASE, OUT, settle } = require('./lib');
(async () => {
  const b = await launch();
  const out = {};
  // 1. JS desktop hero search with service + PLZ + date
  {
    const c = await ctx(b, 'd1440');
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=full`, { waitUntil: 'networkidle' });
    await settle(p, 800);
    const plz = p.locator('#termin input[name="plz"]');
    await plz.fill('10115');
    await p.waitForTimeout(1500);
    out.plzHint = (await p.locator('#termin').innerText()).split('\n').slice(0, 4).join(' | ');
    await p.locator('#termin button', { hasText: 'Was?' }).click();
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/d1440-was-popover.png` });
    await p.locator('[role=dialog] button', { hasText: /^Massage/ }).first().click();
    await p.waitForTimeout(400);
    const svc = p.locator('[role=dialog] button', { hasText: /Entspannungsmassage/ }).first();
    await svc.click();
    await p.waitForTimeout(400);
    await p.locator('#termin button', { hasText: 'Wann?' }).click();
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/d1440-wann-popover.png` });
    await p.locator('[role=dialog] button', { hasText: /^Morgen$/ }).first().click().catch(() => {});
    await p.locator('[role=dialog] button', { hasText: /^Abends/ }).first().click().catch(() => {});
    await p.locator('[role=dialog] button', { hasText: 'Fertig' }).first().click().catch(() => {});
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/d1440-hero-filled.png`, clip: { x: 0, y: 700, width: 1440, height: 200 } });
    await p.locator('#termin button[type=submit]').click();
    await p.waitForURL(/\/suche/, { timeout: 20000 });
    await settle(p, 1200);
    out.heroSearchUrl = decodeURIComponent(p.url().replace(BASE, ''));
    out.searchH1 = await p.locator('h1').first().innerText();
    await p.screenshot({ path: `${OUT}/d1440-suche-result.png` });
    await c.close();
  }
  // 2. No-JS submit
  {
    const c = await ctx(b, 'm390', { javaScriptEnabled: false });
    const p = await c.newPage();
    await p.goto(`${BASE}/`, { waitUntil: 'load' });
    await p.locator('#termin input[name="plz"]').fill('10115');
    await p.locator('#termin input[name="plz"]').press('Enter');
    await p.waitForLoadState('load');
    out.noJsUrl = p.url().replace(BASE, '');
    out.noJsH1 = await p.locator('h1').first().innerText();
    // no-JS: does Menü / dock / Kapitel do anything?
    await p.goto(`${BASE}/`, { waitUntil: 'load' });
    out.noJsDockVisible = await p.evaluate(() => { const d = document.querySelector('.lp-dock'); if (!d) return 'none'; const cs = getComputedStyle(d); return `${cs.display}/${cs.visibility}/${cs.opacity}`; });
    out.noJsMenuTag = await p.evaluate(() => { const m = [...document.querySelectorAll('header button, header a')].find((x) => /Menü/.test(x.textContent)); return m ? m.tagName + ' ' + (m.getAttribute('href') || '') : 'none'; });
    out.noJsPortraitOpacity = await p.evaluate(() => [...document.querySelectorAll('#profis img')].slice(0, 2).map((i) => getComputedStyle(i).opacity));
    await c.close();
  }
  // 3. links
  {
    const c = await ctx(b, 'd1440');
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=none`, { waitUntil: 'networkidle' });
    const hrefs = await p.evaluate(() => [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))]);
    const internal = hrefs.filter((h) => h.startsWith('/'));
    const anchors = hrefs.filter((h) => h.startsWith('#'));
    const bad = [];
    for (const h of internal) {
      const r = await p.request.get(BASE + h.split('#')[0], { maxRedirects: 0 }).catch((e) => ({ status: () => 'ERR ' + e.message }));
      const s = r.status();
      if (s !== 200) bad.push(`${h} -> ${s}`);
    }
    const missingAnchors = await p.evaluate((as) => as.filter((a) => a.length > 1 && document.querySelectorAll(a).length !== 1), anchors);
    out.links = { internal: internal.length, anchors: anchors.length, bad, missingAnchors };
    out.ctaTargets = await p.evaluate(() => [...document.querySelectorAll('a')].filter((a) => /Profi werden|Konditionen|Freie Termine finden|Termin finden|Alle Behandlungen|Selbst Profi/.test(a.textContent)).map((a) => `${a.textContent.trim().slice(0, 25)} -> ${a.getAttribute('href')}`));
    out.categoryLinks = await p.evaluate(() => [...document.querySelectorAll('#behandlungen a[href^="/behandlungen/"]')].map((a) => a.getAttribute('href')).filter((v, i, s) => s.indexOf(v) === i));
    await c.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
