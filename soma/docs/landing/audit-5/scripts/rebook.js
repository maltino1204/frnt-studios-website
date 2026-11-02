// Round-3 regression check: the RebookRow loads its row lazily (discovery-rebook.tsx). Logged in as the demo customer
// (testkunde@soma.test), does `/` show the „Erneut buchen“ row in the hero and in the sheet, without console errors and
// without layout shift in the first view (1440 and 390)?
const { launch, ctx, BASE, OUT, DATA, settle, watchConsole, fs } = require('./lib');
(async () => {
  const b = await launch();
  const out = {};
  for (const vp of ['d1440', 'm390']) {
    const c = await ctx(b, vp);
    const p = await c.newPage();
    const msgs = [];
    watchConsole(p, msgs, vp);
    await p.goto(BASE + '/anmelden');
    await p.getByLabel(/E-Mail/i).fill('testkunde@soma.test');
    await p.getByLabel(/Passwort/i).first().fill('soma-demo-2026');
    await Promise.all([p.waitForURL((u) => !u.pathname.startsWith('/anmelden'), { timeout: 20000 }), p.getByRole('button', { name: /^anmelden$/i }).click()]);
    await p.addInitScript(() => { window.__cls = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls.push({ t: Math.round(e.startTime), v: e.value, src: (e.sources || []).map((s) => s.node ? s.node.nodeName + '.' + String(s.node.className || '').slice(0, 40) : '?').join('|') }); }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(`${BASE}/?motion=${vp.startsWith('d') ? 'full' : 'lite'}`, { waitUntil: 'networkidle' });
    await settle(p, 3000);
    const r = await p.evaluate(() => ({
      rebook: [...document.querySelectorAll('#bei-dir *')].map((e) => e.textContent).find((t) => /Erneut buchen/.test(t || ''))?.replace(/\s+/g, ' ').trim().slice(0, 80) || null,
      cls: window.__cls,
      account: [...document.querySelectorAll('header a')].map((a) => a.textContent.trim()).filter((t) => /Konto|Anmelden/.test(t)),
    }));
    await p.screenshot({ path: `${OUT}/rebook-${vp}.png` });
    out[vp] = { ...r, console: msgs };
    console.log(vp, JSON.stringify(out[vp]).slice(0, 600));
    await c.close();
  }
  fs.writeFileSync(`${DATA}/rebook.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
