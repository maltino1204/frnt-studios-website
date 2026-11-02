// Mobile (touch) checks: dock visibility through the page, dock -> sheet, sheet pickers inline, swipe on hero,
// header hide on scroll, chapter overlay from the dock, no-booking-control gaps.
const { launch, ctx, BASE, OUT, DATA, settle, scrollToY, chapterTops, fs } = require('./lib');
(async () => {
  const vp = process.argv[2] || 'm390';
  const tier = process.argv[3] || 'lite';
  const b = await launch();
  const c = await ctx(b, vp);
  const p = await c.newPage();
  await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' });
  await settle(p, 1500);
  const res = {};
  const vh = await p.evaluate(() => innerHeight);
  // 1. booking access visibility per scroll position: is any booking control (dock CTA visible, hero submit visible) in view?
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  const gaps = [];
  for (let y = 0; y < H - vh; y += 100) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(120);
    const st = await p.evaluate(() => {
      const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.5; };
      const dock = document.documentElement.dataset.dock === 'shown';
      const heroSubmit = vis(document.querySelector('#termin button[type=submit]'));
      const ctas = [...document.querySelectorAll('main a, main button')].filter((a) => /Termine? finden/.test(a.textContent) && vis(a)).length;
      return { dock, heroSubmit, ctas, ch: document.documentElement.dataset.chapterActive };
    });
    if (!st.dock && !st.heroSubmit && !st.ctas) gaps.push(`${y}(ch${st.ch})`);
  }
  res.noBookingControlAt = gaps;
  // 2. header hide on scroll
  await p.evaluate(() => scrollTo(0, 0));
  await settle(p, 300);
  await scrollToY(p, 1500, 100);
  await settle(p, 500);
  res.headerHiddenAfterDown = await p.evaluate(() => document.documentElement.dataset.headerHidden !== undefined);
  await p.mouse.wheel(0, -60).catch(() => {});
  await p.evaluate(() => scrollTo(0, scrollY - 40));
  await settle(p, 500);
  res.headerBackAfterUp = await p.evaluate(() => document.documentElement.dataset.headerHidden === undefined);
  // 3. dock -> sheet
  const tops = Object.fromEntries((await chapterTops(p)).map((t) => [t.id, t]));
  await scrollToY(p, tops.behandlungen.top, 200);
  await settle(p, 700);
  res.dockState = await p.evaluate(() => document.documentElement.dataset.dock);
  await p.screenshot({ path: `${OUT}/${vp}-dock.png` });
  const dockBtn = p.locator('.lp-dock a, .lp-dock button').filter({ hasText: 'Termin finden' }).first();
  const bb = await dockBtn.boundingBox();
  res.dockBtnBox = bb;
  await dockBtn.tap();
  await p.waitForTimeout(900);
  res.sheetOpen = await p.evaluate(() => !!document.querySelector('dialog[open]'));
  res.sheetFocus = await p.evaluate(() => { const e = document.activeElement; return e.tagName + ' ' + (e.getAttribute('placeholder') || e.getAttribute('aria-label') || e.textContent.trim().slice(0, 30)); });
  await p.screenshot({ path: `${OUT}/${vp}-sheet.png` });
  // fill PLZ in the sheet and open Was? inline
  await p.locator('dialog[open] input[name="plz"]').fill('10115');
  await p.waitForTimeout(1200);
  const was = p.locator('dialog[open] button').filter({ hasText: /Was\?/ }).first();
  await was.tap();
  await p.waitForTimeout(700);
  res.dialogsOpen = await p.evaluate(() => document.querySelectorAll('dialog[open]').length);
  await p.screenshot({ path: `${OUT}/${vp}-sheet-was.png` });
  const massage = p.locator('dialog[open] button').filter({ hasText: /^Massage/ }).first();
  if (await massage.count()) { await massage.tap(); await p.waitForTimeout(500); }
  const allMassage = p.locator('dialog[open] button').filter({ hasText: /alle Leistungen/ }).first();
  if (await allMassage.count()) { await allMassage.tap(); await p.waitForTimeout(500); }
  await p.screenshot({ path: `${OUT}/${vp}-sheet-was-picked.png` });
  const submit = p.locator('dialog[open] button[type=submit]').first();
  await submit.tap();
  await p.waitForURL(/\/suche/, { timeout: 15000 }).catch(() => {});
  res.afterSheetSubmit = p.url().replace(BASE, '');
  // 4. swipe on hero
  await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' });
  await settle(p, 1200);
  const fig = await p.locator('#hero-ort').boundingBox();
  const cdp = await c.newCDPSession(p);
  const y0 = fig.y + fig.height * 0.4, x0 = fig.x + fig.width * 0.8;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
  for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 - i * 25, y: y0 + i * 2 }] }); await p.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(1200);
  res.placeAfterSwipe = await p.locator('[role=radio][aria-checked=true]').innerText();
  await p.screenshot({ path: `${OUT}/${vp}-swipe-hotel.png` });
  // 5. chapter overlay from the dock
  await scrollToY(p, tops.behandlungen.top, 300);
  await settle(p, 600);
  const dockChap = p.locator('.lp-dock button').first();
  res.dockChapLabel = (await dockChap.innerText()).replace(/\s+/g, ' ');
  await dockChap.tap();
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/${vp}-overlay.png` });
  const link = p.locator('dialog[open] a[href="#fragen"]');
  await link.tap();
  await p.waitForTimeout(1500);
  res.afterOverlayJump = await p.evaluate(() => ({ hash: location.hash, focus: document.activeElement.tagName + ' ' + document.activeElement.textContent.trim().slice(0, 30), top: Math.round(document.activeElement.getBoundingClientRect().top) }));
  // 6. footer: dock never covers legal links
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await settle(p, 800);
  res.dockAtFooter = await p.evaluate(() => document.documentElement.dataset.dock);
  await p.screenshot({ path: `${OUT}/${vp}-footer.png` });
  fs.writeFileSync(`${DATA}/mobile-${vp}-${tier}.json`, JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
