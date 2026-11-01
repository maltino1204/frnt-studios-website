const { chromium } = require('/home/user/frnt-studios-website/soma/node_modules/@playwright/test');
const OUT = '/home/user/frnt-studios-website/soma/brand/audit/brand-audit-3';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [name, opts] of [['email-light-680', { viewport: { width: 680, height: 900 }, colorScheme: 'light' }], ['email-dark-680', { viewport: { width: 680, height: 900 }, colorScheme: 'dark' }], ['email-light-390', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light' }]]) {
    const ctx = await b.newContext(opts); const p = await ctx.newPage();
    await p.goto('file:///home/user/frnt-studios-website/soma/brand/applications/email/buchung-bestaetigt.html');
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    const fonts = await p.evaluate(() => [...new Set([...document.querySelectorAll('body *')].map(e => getComputedStyle(e).fontFamily.split(',')[0]))]);
    const hs = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    console.log(name, fonts.join('|'), 'hscroll', hs);
    await ctx.close();
  }
  await b.close();
})();
