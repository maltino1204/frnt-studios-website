// In-page link jumps outside the overlay: the hero's „So funktioniert’s“ (secondary CTA), a chapter foot
// („Weiter: …“), the desktop header link, plus the overlay jump to #fragen with reduced motion (instant scroll).
const { launch, ctx, BASE, OUT, DATA, settle, fs } = require('./lib');
async function sample(p, id) {
  const s = [];
  for (let i = 0; i < 14; i++) { await p.waitForTimeout(250); s.push(await p.evaluate((x) => Math.round((document.getElementById(`${x}-titel`) || document.getElementById(x)).getBoundingClientRect().top), id)); }
  return s;
}
(async () => {
  const b = await launch();
  const out = {};
  const cases = [
    ['m390', 'lite', 'hero „So funktioniert’s“', async (p) => p.locator('#bei-dir a[href="#so-funktionierts"]').first().tap(), 'so-funktionierts'],
    ['m390', 'lite', 'foot 02 „Weiter: So funktioniert’s“', async (p) => { await p.evaluate(() => document.querySelector('#behandlungen a[href="#so-funktionierts"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(800); await p.locator('#behandlungen a[href="#so-funktionierts"]').last().tap(); }, 'so-funktionierts'],
    ['m390', 'reduce', 'overlay → Fragen (reduced motion)', async (p) => { await p.locator('.lp-dock button').first().tap(); await p.waitForTimeout(900); await p.locator('dialog[open] a[href="#fragen"]').tap(); }, 'fragen'],
    ['d1440', 'full', 'header „So funktioniert’s“', async (p) => p.locator('header a[href="#so-funktionierts"]').first().click(), 'so-funktionierts'],
    ['d1440', 'full', 'hero „So funktioniert’s“', async (p) => p.locator('#bei-dir a[href="#so-funktionierts"]').first().click(), 'so-funktionierts'],
    ['d1440', 'reduce', 'overlay → Fragen (reduced motion)', async (p) => { await p.locator('header button', { hasText: 'Kapitel' }).first().click(); await p.waitForTimeout(900); await p.locator('dialog[open] a[href="#fragen"]').click(); }, 'fragen'],
  ];
  for (const [vp, tier, label, act, id] of cases) {
    const c = await ctx(b, vp, tier === 'reduce' ? { reducedMotion: 'reduce' } : {});
    const p = await c.newPage();
    await p.goto(`${BASE}/${tier === 'reduce' ? '' : '?motion=' + tier}`, { waitUntil: 'networkidle' });
    await settle(p, 1500);
    await act(p);
    const s = await sample(p, id);
    const fin = await p.evaluate(() => ({ active: document.documentElement.dataset.chapterActive, hash: location.hash, focus: document.activeElement.id || document.activeElement.tagName }));
    out[`${vp} ${label}`] = { samples: s, ...fin };
    console.log(vp, label, '→ final h2 top', s[s.length - 1], 'active', fin.active, 'focus', fin.focus);
    await c.close();
  }
  fs.writeFileSync(`${DATA}/jump2.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
