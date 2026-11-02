const { launch, ctx, BASE, OUT } = require('./lib');
(async () => {
  const b = await launch();
  const c = await ctx(b, 'd1440');
  const p = await c.newPage();
  await p.goto(`${BASE}/?motion=full`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const names = ['Im Hotel', 'Im Büro', 'Zu Hause', 'Im Hotel', 'Im Büro', 'Im Hotel'];
  for (const n of names) { await p.getByRole('radio', { name: n }).click({ delay: 0 }); await p.waitForTimeout(60); }
  const mid = await p.evaluate(() => [...document.querySelectorAll('[data-place-layer]')].map((l) => l.dataset.state));
  await p.waitForTimeout(1500);
  const end = await p.evaluate(() => ({ layers: [...document.querySelectorAll('[data-place-layer]')].map((l) => l.dataset.state + ':' + (l.querySelector('img')?.getAttribute('src') || '').slice(25, 60)), checked: document.querySelector('[role=radio][aria-checked=true]').textContent, cap: document.querySelector('#hero-ort figcaption').textContent, ph: document.querySelector('#termin input[name=plz]').placeholder }));
  console.log('during:', mid, '\nend:', JSON.stringify(end, null, 1));
  await p.screenshot({ path: `${OUT}/d1440-rapid-switch-end.png`, clip: { x: 700, y: 100, width: 740, height: 800 } });
  // hover index rows rapidly
  await p.evaluate(() => document.getElementById('behandlungen').scrollIntoView());
  await p.waitForTimeout(800);
  const rows = p.locator('#behandlungen a[href^="/behandlungen/"]:visible');
  for (let i = 0; i < 7; i++) { await rows.nth(i).hover(); await p.waitForTimeout(30); }
  await p.waitForTimeout(1500);
  console.log('preview after sweep:', await p.evaluate(() => [...document.querySelectorAll('#behandlungen [aria-hidden] figcaption, #behandlungen [data-preview] *')].map((e) => e.textContent.trim()).filter(Boolean).slice(0, 2)));
  await b.close();
})();
