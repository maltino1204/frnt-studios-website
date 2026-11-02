// Conversion hand-offs beyond conv.js: deep-link prefill, the final CTA picking up the PLZ, chapter CTAs routing to
// booking access (desktop bar / mobile sheet), the sheet with Was? + Wann? to /suche, category CTA → /suche param,
// 08/10 Profi CTAs, and what /suche receives.
const { launch, ctx, BASE, OUT, DATA, settle, scrollToY, fs } = require('./lib');
(async () => {
  const b = await launch();
  const out = {};
  // 1. Deep link prefill
  {
    const c = await ctx(b, 'd1440');
    const p = await c.newPage();
    await p.goto(`${BASE}/?plz=10435&kategorie=massage&leistung=entspannungsmassage&datum=2026-11-10&zeit=abends&motion=full#termin`, { waitUntil: 'networkidle' });
    await settle(p, 1500);
    out.deepLink = await p.evaluate(() => ({ plz: document.querySelector('#termin input[name=plz]').value, entry: document.querySelector('#termin').innerText.replace(/\s+/g, ' ').slice(0, 200) }));
    await p.locator('#termin button[type=submit]').click();
    await p.waitForURL(/\/suche/, { timeout: 20000 });
    out.deepLinkSubmit = decodeURIComponent(p.url().replace(BASE, ''));
    out.deepLinkH1 = await p.locator('h1').first().innerText();
    await c.close();
  }
  // 2. Final CTA picks up the PLZ; chapter CTA opens the bar on desktop
  {
    const c = await ctx(b, 'd1440');
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=full`, { waitUntil: 'networkidle' });
    await settle(p, 1000);
    out.finalCtaBefore = await p.locator('#soma a[data-cta="final-search"]').getAttribute('href');
    await p.locator('#termin input[name=plz]').fill('20095');
    await p.waitForTimeout(1500);
    await p.locator('#termin input[name=plz]').blur();
    out.finalCtaAfter = await p.locator('#soma a[data-cta="final-search"]').getAttribute('href');
    out.chapterCtas = await p.evaluate(() => [...document.querySelectorAll('main a')].filter((a) => /Termine? finden/.test(a.textContent)).map((a) => `${a.closest('section')?.id}: ${a.textContent.trim()} -> ${a.getAttribute('href')}`));
    // The 05 stage CTA is covered by the active stage item in the full tier (N-2), so a mouse click cannot reach it:
    // use the keyboard (focus + Enter), which works, to verify where the CTA routes.
    const ch05 = p.locator('#so-funktionierts a[data-booking-open="ch03"]'); // (audit 4) v2: the 03 CTA replaces the removed 05 stage CTA
    await ch05.focus();
    await settle(p, 800);
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1200);
    out.ch03Cta = await p.evaluate(() => { const d = document.querySelector('dialog[open]'); return d ? { open: true, plz: d.querySelector('input[name=plz]')?.value, focus: document.activeElement.getAttribute('name') || document.activeElement.textContent.trim().slice(0, 30) } : { open: false, scrollY: Math.round(scrollY) }; });
    await p.screenshot({ path: `${OUT}/d1440-bar-from-ch05.png` });
    await p.keyboard.press('Escape');
    await p.waitForTimeout(600);
    out.ch03CtaFocusBack = await p.evaluate(() => document.activeElement.textContent.trim().slice(0, 30));
    // 03 category row → route, Profi CTAs → onboarding
    out.categoryRows = await p.evaluate(() => [...document.querySelectorAll('#behandlungen a[href^="/behandlungen"]')].map((a) => a.getAttribute('href')).filter((v, i, s) => s.indexOf(v) === i));
    out.proCtas = await p.evaluate(() => [...document.querySelectorAll('a')].filter((a) => /Profi werden|Konditionen ansehen|Selbst Profi/.test(a.textContent)).map((a) => `${a.closest('section,footer,header')?.id || a.closest('footer,header')?.tagName}: ${a.textContent.trim()} -> ${a.getAttribute('href')}`));
    const pro = await fetch(`${BASE}/pro/registrieren`);
    out.proStatus = pro.status;
    const kond = await (await fetch(`${BASE}/fuer-profis`)).text();
    out.provisionAnchor = kond.includes('id="provision"');
    await c.close();
  }
  // 3. Mobile sheet: Was? + Wann? → /suche
  {
    const c = await ctx(b, 'm390');
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=lite`, { waitUntil: 'networkidle' });
    await settle(p, 1200);
    await scrollToY(p, 2600, 300);
    await settle(p, 800);
    await p.locator('.lp-dock a', { hasText: 'Termin finden' }).tap();
    await p.waitForTimeout(1200);
    await p.locator('dialog[open] input[name=plz]').fill('50667');
    await p.waitForTimeout(1500);
    out.sheetPlzHint = await p.evaluate(() => document.querySelector('dialog[open]').innerText.replace(/\s+/g, ' ').slice(0, 160));
    await p.locator('dialog[open] button', { hasText: 'Was?' }).first().tap();
    await p.waitForTimeout(900);
    await p.locator('dialog[open] button', { hasText: /^Maniküre/ }).first().tap().catch(() => {});
    await p.waitForTimeout(700);
    await p.locator('dialog[open] button', { hasText: /alle Leistungen/ }).first().tap().catch(() => {});
    await p.waitForTimeout(600);
    await p.locator('dialog[open] button', { hasText: 'Wann?' }).first().tap();
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/m390-sheet-wann.png` });
    await p.locator('dialog[open] button', { hasText: /^Heute$|^Morgen$/ }).last().tap().catch(() => {});
    await p.waitForTimeout(400);
    await p.locator('dialog[open] button', { hasText: /^Nachmittags/ }).first().tap().catch(() => {});
    await p.waitForTimeout(400);
    out.dialogsOpen = await p.evaluate(() => document.querySelectorAll('dialog[open]').length);
    await p.screenshot({ path: `${OUT}/m390-sheet-filled.png` });
    await p.locator('dialog[open] button[type=submit]').tap();
    await p.waitForURL(/\/suche/, { timeout: 20000 }).catch(() => {});
    await settle(p, 1200);
    out.sheetSubmit = decodeURIComponent(p.url().replace(BASE, ''));
    out.sheetSubmitH1 = await p.locator('h1').first().innerText().catch(() => null);
    await p.screenshot({ path: `${OUT}/m390-suche-from-sheet.png` });
    await c.close();
  }
  // 4. Unserved PLZ in the hero (waitlist path, no submit)
  {
    const c = await ctx(b, 'd1440');
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=full`, { waitUntil: 'networkidle' });
    await p.locator('#termin input[name=plz]').fill('99998');
    await p.waitForTimeout(1800);
    out.unservedPlz = await p.evaluate(() => document.querySelector('#termin').closest('section').innerText.replace(/\s+/g, ' ').match(/(gibt es noch keine|kennen wir nicht|noch nicht verfügbar)[^.?]*[.?]/g));
    await c.close();
  }
  fs.writeFileSync(`${DATA}/conversion2.json`, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
