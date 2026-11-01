const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:3000/suche?plz=10115&kategorie=massage', { waitUntil: 'networkidle', timeout: 180000 });
  const r = await p.evaluate(() => [...document.querySelectorAll('button,[role=radio],[role=switch],input[type=radio],label')].filter(e => /Ganzer Tag|Morgens|Alle Preise|bis 60|Nur sofort|Bewertung ab/.test(e.innerText || e.getAttribute('aria-label') || '')).map(e => ({ tag: e.tagName, txt: (e.innerText||'').trim().slice(0,30), role: e.getAttribute('role'), pressed: e.getAttribute('aria-pressed'), checked: e.getAttribute('aria-checked') ?? e.checked, hasSvg: !!e.querySelector('svg'), bg: getComputedStyle(e).backgroundColor })));
  console.log(JSON.stringify(r, null, 0));
  await b.close();
})();
