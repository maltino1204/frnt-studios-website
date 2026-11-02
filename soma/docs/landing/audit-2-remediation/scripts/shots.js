// Evidence screenshots: the no-JS static chapter list (390), the filled hero entry with the place caption (1440, the
// middle dots of RT-10), and the hero first view at the tall phones (RT-8, not changed).
const { launch, ctx, BASE, OUT } = require('./lib');
(async () => {
  const b = await launch();
  { const c = await ctx(b, 'm390', { javaScriptEnabled: false }); const p = await c.newPage();
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.getElementById('kapitel').scrollIntoView({ block: 'start', behavior: 'instant' })); await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}/m390-nojs-kapitel.png` }); await c.close(); }
  { const c = await ctx(b, 'd1440'); const p = await c.newPage();
    await p.goto(`${BASE}/?motion=full`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    await p.getByRole('radio', { name: /Im Hotel/ }).click(); await p.waitForTimeout(900);
    const box = await p.locator('#termin').boundingBox();
    await p.screenshot({ path: `${OUT}/d1440-hero-hotel-caption.png`, clip: { x: box.x, y: box.y - 10, width: box.width, height: 100 } });
    await p.locator('#termin input[name="plz"]').fill('10115'); await p.getByText('Berlin', { exact: false }).first().waitFor();
    await p.locator('#termin button', { hasText: 'Wann?' }).click(); await p.getByRole('button', { name: 'Morgen', exact: true }).click(); await p.getByRole('button', { name: /^Abends/ }).click(); await p.getByRole('button', { name: 'Fertig' }).click();
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/d1440-hero-filled.png`, clip: { x: box.x, y: box.y - 10, width: box.width, height: 100 } }); await c.close(); }
  await b.close();
})();
