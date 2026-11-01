const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
for (const u of ['/fuer-profis', '/hilfe', '/suche?plz=10115&kategorie=massage']) {
await p.goto('http://localhost:3000' + u, { waitUntil: 'networkidle', timeout: 180000 });
console.log(u, await p.evaluate(() => JSON.stringify({ t: document.title, h: [...document.querySelectorAll('h1,h2')].slice(0, 12).map(h => [h.tagName, h.innerText.trim().slice(0, 40), getComputedStyle(h).fontFamily.slice(0, 30), h.querySelectorAll('em').length, h.querySelector('em') ? getComputedStyle(h.querySelector('em')).fontStyle : '']) })));
}
await b.close(); })();
