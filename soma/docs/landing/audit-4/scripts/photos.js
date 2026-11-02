// (audit 4) The v3 "Tageslicht" photography in context: every landing <img> with its natural file, rendered box, alt and
// the nearest integrity label; the three hero places at 1440 / 768 / 390 (arch + Ortszeile), the 03 pair, the 05 band
// and its <1024 arch, the category tiles and the portraits, as element screenshots. Reduced motion so every reveal is
// final. Output: data/photos.json, photo-*.png.
const fs = require('fs');
const { launch, ctx, BASE, OUT, DATA, settle, scrollToY } = require('./lib');
const LABEL = /KI-generiert|Demo-Profil|Symbolbild|Beispielbild/;
(async () => {
  const b = await launch();
  const out = {};
  for (const vp of ['d1440', 't768', 'm390']) {
    const c = await ctx(b, vp, { reducedMotion: 'reduce' });
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=none`, { waitUntil: 'networkidle' });
    await settle(p, 800);
    const places = [];
    for (const name of ['Zu Hause', 'Im Hotel', 'Im Büro']) {
      const r = p.getByRole('radio', { name: new RegExp(name) }).first();
      if (await r.count()) { await r.click(); await p.waitForTimeout(1200); }
      const info = await p.evaluate(() => {
        const fig = document.querySelector('#hero-ort');
        const imgs = [...fig.querySelectorAll('img')].filter((i) => getComputedStyle(i).opacity !== '0' && i.closest('[data-place-layer]')?.getAttribute('aria-hidden') !== 'true');
        const img = imgs[imgs.length - 1] || fig.querySelector('img');
        const box = img.getBoundingClientRect();
        return { caption: fig.querySelector('figcaption')?.textContent.replace(/\s+/g, ' ').trim(), src: decodeURIComponent((img.currentSrc || '').replace(/^.*url=/, '').replace(/&.*$/, '')), alt: img.alt, objectPosition: getComputedStyle(img).objectPosition, box: { w: Math.round(box.width), h: Math.round(box.height) }, label: (fig.textContent.match(/[^.·]*KI-generiert[^.·]*/) || [null])[0] };
      });
      places.push({ name, ...info });
      await p.locator('#hero-ort').screenshot({ path: `${OUT}/photo-hero-${vp}-${name.replace(/\W+/g, '').toLowerCase()}.png` });
    }
    // reset to the default place
    const home = p.getByRole('radio', { name: /Zu Hause/ }).first();
    if (await home.count()) { await home.click(); await p.waitForTimeout(600); }
    // walk the page so every lazy image loads
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    await scrollToY(p, H, 500, 120);
    await settle(p, 1200);
    await scrollToY(p, 0, 2000, 30);
    const imgs = await p.evaluate((labelSrc) => {
      const LABEL = new RegExp(labelSrc);
      return [...document.querySelectorAll('main img, footer img')].map((i) => {
        const r = i.getBoundingClientRect();
        const sec = i.closest('section[data-chapter]');
        // the nearest integrity label: in the image's figure / card / link, or the section's small print
        let lab = null;
        for (let n = i.parentElement; n && n !== document.body && !lab; n = n.parentElement) {
          const t = [...n.querySelectorAll('figcaption, small, [data-ai-label], span, p')].map((x) => x.textContent.trim()).find((t) => LABEL.test(t) && t.length < 120);
          if (t) lab = { text: t, hops: 0 };
          if (n === sec) break;
        }
        return { chapter: sec ? `${sec.dataset.chapter} ${sec.id}` : 'footer', file: decodeURIComponent((i.currentSrc || i.src).replace(/^.*url=/, '').replace(/&.*$/, '')), natural: `${i.naturalWidth}×${i.naturalHeight}`, rendered: `${Math.round(r.width)}×${Math.round(r.height)}`, alt: i.alt, hidden: r.width === 0 || getComputedStyle(i).visibility === 'hidden', label: lab ? lab.text : null };
      });
    }, LABEL.source);
    // section shots
    const shots = { '#so-funktionierts': 'pair', '.lp-band': 'band', '#behandlungen': 'tiles', '#profis': 'portraits' };
    for (const [sel, n] of Object.entries(shots)) {
      const el = p.locator(sel).first();
      if (await el.count()) { await el.scrollIntoViewIfNeeded(); await settle(p, 600); await el.screenshot({ path: `${OUT}/photo-${n}-${vp}.png` }).catch((e) => console.log('shot', n, e.message.slice(0, 80))); }
    }
    const footerLabel = await p.evaluate(() => (document.querySelector('footer')?.textContent.match(/[^.]*KI-generiert[^.]*\.?/) || [null])[0]);
    out[vp] = { places, imgs, footerLabel };
    console.log(vp, JSON.stringify(places), 'imgs', imgs.length, 'unlabelled', imgs.filter((i) => !i.label && !i.hidden).map((i) => i.file).join(', '), 'footer', footerLabel);
    await c.close();
  }
  fs.writeFileSync(`${DATA}/photos.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
