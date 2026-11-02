// Keyboard-only walkthrough at 1440 (full tier): focus order, focus visibility, overlay, booking bar, place switch, FAQ, tabs.
const { launch, ctx, BASE, OUT, settle, scrollToY, chapterTops } = require('./lib');
(async () => {
  const vp = process.argv[2] || 'd1440';
  const tier = process.argv[3] || 'full';
  const b = await launch();
  const c = await ctx(b, vp);
  const p = await c.newPage();
  await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' });
  await settle(p, 1200);
  const desc = () => p.evaluate(() => {
    const e = document.activeElement;
    if (!e || e === document.body) return 'BODY';
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? `outline ${cs.outlineWidth} ${cs.outlineColor}` : (cs.boxShadow !== 'none' ? 'shadow' : 'NO-RING');
    const inView = r.bottom > 0 && r.top < innerHeight;
    return `${e.tagName.toLowerCase()}${e.getAttribute('role') ? '[' + e.getAttribute('role') + ']' : ''} "${(e.getAttribute('aria-label') || e.innerText || e.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 45)}" ${ring}${inView ? '' : ' OFFSCREEN'} y=${Math.round(r.top)}`;
  });
  const order = [];
  for (let i = 0; i < 45; i++) {
    await p.keyboard.press('Tab');
    await p.waitForTimeout(vp.startsWith('m') ? 120 : 60);
    order.push(`${i + 1}. ${await desc()}`);
    if (i === 0) await p.screenshot({ path: `${OUT}/${vp}-kbd-skiplink.png`, clip: { x: 0, y: 0, width: 700, height: 200 } });
  }
  console.log('TAB ORDER\n' + order.join('\n'));

  // Overlay via header index (desktop) or dock/menu
  await p.evaluate(() => scrollTo(0, 0));
  await settle(p, 400);
  const res = {};
  const trigger = vp.startsWith('d') ? p.locator('header button', { hasText: 'Kapitel' }).first() : p.locator('header button').filter({ hasText: /Menü/ }).first();
  await trigger.focus();
  await p.keyboard.press('Enter');
  await p.waitForTimeout(700);
  res.overlayOpen = await p.evaluate(() => !!document.querySelector('dialog[open]'));
  res.focusInOverlay = await desc();
  await p.screenshot({ path: `${OUT}/${vp}-overlay.png` });
  const trapped = [];
  for (let i = 0; i < 25; i++) { await p.keyboard.press('Tab'); trapped.push(await p.evaluate(() => !!document.activeElement.closest('dialog[open]'))); }
  res.trapHolds = trapped.every(Boolean);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(500);
  res.afterEsc = await desc();
  // open again and jump to chapter 06
  await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  const link = p.locator('dialog[open] a[href="#profis"]');
  res.overlayLinkCount = await p.locator('dialog[open] a[href^="#"]').count();
  res.currentMarked = await p.locator('dialog[open] [aria-current]').count();
  await link.focus();
  await p.keyboard.press('Enter');
  await p.waitForTimeout(1500);
  res.afterJump = await desc();
  res.hash = await p.evaluate(() => location.hash);
  res.chapterActive = await p.evaluate(() => document.documentElement.dataset.chapterActive);

  // header Termin finden while hero is out of view
  if (vp.startsWith('d')) {
    const btn = p.locator('header a, header button').filter({ hasText: 'Termin finden' }).first();
    await btn.focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(800);
    res.barOpen = await p.evaluate(() => !!document.querySelector('[data-booking-surface][open], dialog[open] [data-booking-surface], [data-booking-surface="bar"]'));
    res.focusAfterBar = await desc();
    await p.screenshot({ path: `${OUT}/${vp}-booking-bar.png` });
    await p.keyboard.press('Escape');
    await p.waitForTimeout(500);
    res.focusAfterBarEsc = await desc();
  }
  // place switch keyboard
  await p.evaluate(() => scrollTo(0, 0));
  await settle(p, 300);
  await p.locator('[role=radio][aria-checked=true]').focus();
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(900);
  res.placeAfterRight = await p.locator('[role=radio][aria-checked=true]').innerText();
  res.focusPlace = await desc();
  await p.keyboard.press('End');
  await p.waitForTimeout(300);
  res.placeAfterEnd = await p.locator('[role=radio][aria-checked=true]').innerText();
  await p.keyboard.press('Home');
  await p.waitForTimeout(800);
  // FAQ keyboard
  const s = p.locator('#fragen summary').first();
  await s.focus();
  await p.keyboard.press('Enter');
  await p.waitForTimeout(500);
  res.faqOpen = await p.evaluate(() => document.querySelector('#fragen details').open);
  res.faqFocus = await desc();
  await p.screenshot({ path: `${OUT}/${vp}-faq-focus.png` });
  // tabs
  const tab = p.getByRole('tab').first();
  if (!(await tab.count())) { res.tabs = 'none on the page (v2)'; console.log(JSON.stringify(res, null, 1)); await b.close(); return; }
  await tab.focus();
  await p.keyboard.press('ArrowDown');
  await p.waitForTimeout(600);
  res.tabSelected = await p.locator('[role=tab][aria-selected=true]').innerText();
  res.tabFocus = await desc();
  await p.keyboard.press('End');
  await p.waitForTimeout(600);
  res.tabEnd = (await p.locator('[role=tab][aria-selected=true]').innerText()).split('\n')[0];
  await p.screenshot({ path: `${OUT}/${vp}-tabs-focus.png` });
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
