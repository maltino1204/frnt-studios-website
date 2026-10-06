const fs = require('fs');
const path = require("path");
const dir = __dirname;
const spritePath = path.join(dir, "src/logo-sprite.svg.html");
const extraPath = path.join(dir, "src/icons.svg.html");
const pages = ["index.html", "design-guidelines.html", "mentions-legales.html"].map(p => path.join(dir, "..", p));
let sprite = fs.readFileSync(spritePath, 'utf8');
const extra = fs.readFileSync(extraPath, 'utf8');
sprite = sprite.replace(/<\/svg>$/, extra + '</svg>');
const HEART = 'M936 784C925 760 912 730 911 705C911 690 920 684 926 684C936 685 941 700 943 726C956 705 976 683 994 673C1003 668 1002 680 997 690C978 728 952 762 931 797';
const logo = (id, label) => {
  const paws = [1, 0, 2, 3, 4].map((n, i) => `<use class="lg-paw" href="#pp-paw${n}" style="--i:${i}"/>`).join('');
  const word = [...Array(10)].map((_, i) => `<use class="lg-w" href="#pp-w${i}" style="--i:${i}"/>`).join('');
  const tag = [...Array(10)].map((_, i) => `<use class="lg-t" href="#pp-t${i}" style="--i:${i}"/>`).join('');
  return `<svg class="logo-live" id="${id}-svg" data-logo-live viewBox="44 28 1832 790" role="img" aria-label="${label}">` +
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="880" y="650" width="150" height="170"><path class="lg-heart-draw" d="${HEART}" fill="none" stroke="#fff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1"/></mask>` +
    `<g fill="currentColor">${paws}${word}<use class="lg-line" href="#pp-line"/>${tag}<use href="#pp-heart" mask="url(#${id})"/></g></svg>`;
};
for (const p of pages) {
  let html = fs.readFileSync(p, 'utf8');
  html = html.replace(/<!-- sprite:start -->[\s\S]*?<!-- sprite:end -->/, '<!-- sprite:start -->' + sprite + '<!-- sprite:end -->');
  html = html.replace(/<!-- logo:([\w-]+) -->[\s\S]*?<!-- \/logo -->/g, (m, id) => `<!-- logo:${id} -->${logo(id, 'Petite Paws, dog sitting')}<!-- /logo -->`);
  fs.writeFileSync(p, html); console.log('injected', p.split('/').pop(), (html.length / 1024).toFixed(0) + ' KB');
}
