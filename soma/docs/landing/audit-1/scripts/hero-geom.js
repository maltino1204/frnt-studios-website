const { launch, BASE } = require('./lib');
(async () => {
  const b = await launch();
  for (const [w, h] of [[1440, 900], [1280, 800], [1024, 768], [1366, 768], [390, 844]]) {
    const c = await b.newContext({ viewport: { width: w, height: h } });
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=none`, { waitUntil: 'networkidle' });
    const r = await p.evaluate(() => {
      const q = (s) => document.querySelector(s)?.getBoundingClientRect();
      const arch = q('.lp-hero-arch') || q('#hero-ort');
      const form = q('#termin form') || q('#termin');
      const tag = document.querySelector('.lp-hero-tagline');
      const tagLines = tag ? Math.round(tag.getBoundingClientRect().height / parseFloat(getComputedStyle(tag).lineHeight)) : null;
      const trust = [...document.querySelectorAll('#termin ~ * li, #termin li')].map((l) => l.getBoundingClientRect());
      const cap = q('#hero-ort figcaption');
      const plz = document.querySelector('#termin input[name=plz]');
      const truncated = [...document.querySelectorAll('#termin button, #termin input')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => (e.getAttribute('placeholder') || e.textContent).trim().slice(0, 30));
      return { archTop: Math.round(arch.top), archBottom: Math.round(arch.bottom), archLeft: Math.round(arch.left), archW: Math.round(arch.width), formTop: Math.round(form.top), formBottom: Math.round(form.bottom), formRight: Math.round(form.right), sillToArchBase: Math.round(arch.bottom - form.bottom), tagLines, tagFont: tag && getComputedStyle(tag).fontSize, captionBottom: cap && Math.round(cap.bottom), fold: innerHeight, plzPlaceholderOverflow: plz.scrollWidth > plz.clientWidth, truncated };
    });
    console.log(`${w}x${h}`, JSON.stringify(r));
    await c.close();
  }
  await b.close();
})();
