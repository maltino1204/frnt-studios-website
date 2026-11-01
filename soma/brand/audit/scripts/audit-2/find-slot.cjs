const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.goto('http://localhost:3000/suche?plz=10115&kategorie=massage', { waitUntil: 'networkidle', timeout: 180000 });
  const r = await p.evaluate(() => [...document.querySelectorAll('a,button')].filter(e => /^\d\d:\d\d$/.test(e.innerText.trim())).map(e => ({ tag: e.tagName, href: e.getAttribute('href'), txt: e.innerText.trim(), aria: e.getAttribute('aria-label') })).slice(0, 12));
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
