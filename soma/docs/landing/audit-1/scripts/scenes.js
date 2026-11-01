// Targeted scene captures at a desktop viewport, full tier.
const { launch, ctx, BASE, OUT, scrollToY, settle, chapterTops } = require('./lib');
(async () => {
  const vp = process.argv[2] || 'd1440';
  const tier = process.argv[3] || 'full';
  const b = await launch();
  const c = await ctx(b, vp);
  const p = await c.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${BASE}/?motion=${tier}`, { waitUntil: 'networkidle' });
  await settle(p, 1500);
  const shot = (n) => p.screenshot({ path: `${OUT}/${vp}-${tier}-${n}.png` });
  const out = {};

  // 1. Hero place switch
  await p.getByRole('radio', { name: /Im Hotel/ }).click();
  await p.waitForTimeout(250);
  await shot('01-place-hotel-250ms');
  await p.waitForTimeout(1200);
  await shot('01-place-hotel');
  out.hotelPlaceholder = await p.locator('#termin input[name="plz"]').getAttribute('placeholder');
  out.ortszeile = await p.locator('#bei-dir figcaption').innerText();
  await p.getByRole('radio', { name: /Im Büro/ }).click();
  await p.waitForTimeout(1400);
  await shot('01-place-buero');
  out.bueroPlaceholder = await p.locator('#termin input[name="plz"]').getAttribute('placeholder');
  out.ortszeile2 = await p.locator('#bei-dir figcaption').innerText();
  await p.getByRole('radio', { name: /Zu Hause/ }).click();
  await p.waitForTimeout(1200);

  const tops = Object.fromEntries((await chapterTops(p)).map((t) => [t.id, t]));
  out.tops = tops;
  const vh = await p.evaluate(() => innerHeight);

  // 2. doorway: a few positions
  for (const f of [0.0, 0.35, 0.7, 1.0]) {
    const y = Math.round(tops.idee.top - vh * 0.3 + f * (vh * 0.9));
    await scrollToY(p, y, 100);
    await settle(p, 700);
    await shot(`02-doorway-${Math.round(f * 100)}`);
  }
  // 3. index hover
  await scrollToY(p, tops.behandlungen.top + 150, 150);
  await settle(p, 900);
  const rows = p.locator('#behandlungen a[href^="/behandlungen/"]');
  out.rowCount = await rows.count();
  if (out.rowCount > 3) {
    await rows.nth(3).hover();
    await p.waitForTimeout(250);
    await shot('03-index-hover-kosmetik-250ms');
    await p.waitForTimeout(900);
    await shot('03-index-hover-kosmetik');
  }
  // 4. walkthrough steps: scroll through the chapter and capture at thirds
  const st = tops['so-funktionierts'];
  for (const f of [0.18, 0.42, 0.66]) {
    await scrollToY(p, Math.round(st.top + f * st.h), 150);
    await settle(p, 1100);
    await shot(`04-walk-${Math.round(f * 100)}`);
  }
  // 5. stage steps
  const dr = tops['dein-ort'];
  for (const f of [0.02, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) {
    await scrollToY(p, Math.round(dr.top + f * dr.h), 200);
    await settle(p, 1100);
    await shot(`05-stage-${Math.round(f * 100)}`);
  }
  // 6. profis
  await scrollToY(p, tops.profis.top - 40, 300);
  await settle(p, 1200);
  await shot('06-profis');
  // 7. tabs
  await scrollToY(p, tops['deine-buchung'].top + 60, 300);
  await settle(p, 1000);
  await shot('07-screens-endpreis');
  const tabs = p.getByRole('tab');
  out.tabCount = await tabs.count();
  if (out.tabCount > 2) {
    await tabs.nth(2).click();
    await p.waitForTimeout(1000);
    await shot('07-screens-startcode');
  }
  // 8. band
  await scrollToY(p, tops['fuer-profis'].top - 60, 300);
  await settle(p, 1400);
  await shot('08-band');
  await scrollToY(p, tops['fuer-profis'].top + Math.round(tops['fuer-profis'].h - vh + 40), 300);
  await settle(p, 900);
  await shot('08-benefits');
  // 9. FAQ
  await scrollToY(p, tops.fragen.top - 40, 300);
  await settle(p, 900);
  await p.locator('#fragen summary').nth(4).click();
  await p.waitForTimeout(700);
  await shot('09-faq-open');
  // 10. seal: band partially, then aligned
  await scrollToY(p, tops.soma.top - Math.round(vh * 0.45), 200);
  await settle(p, 1500);
  await shot('10-seal-approach');
  await scrollToY(p, tops.soma.top - 60, 150);
  await p.waitForTimeout(500);
  await shot('10-seal-500ms');
  await p.waitForTimeout(2500);
  await shot('10-seal-final');
  out.sealState = await p.evaluate(() => document.querySelector('[data-scene="seal"]')?.dataset.sceneState);
  out.headerLogo = await p.evaluate(() => document.documentElement.dataset.headerLogo);
  // footer
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await settle(p, 800);
  await shot('11-footer');
  out.errors = errors;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
