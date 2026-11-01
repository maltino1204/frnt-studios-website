(() => {
  const ox = ['rgb(84, 44, 53)', 'rgb(69, 35, 43)', 'rgb(54, 27, 33)'];
  const out = { oxblood: [], fonts: new Set(), imgs: [] };
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const hits = [];
    if (ox.includes(cs.backgroundColor)) hits.push('bg');
    if (ox.includes(cs.color) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) hits.push('text');
    if (ox.includes(cs.borderTopColor) && parseFloat(cs.borderTopWidth) > 0) hits.push('border');
    if (hits.length) out.oxblood.push({ tag: el.tagName, hits: hits.join('+'), text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 60), top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width) });
    out.fonts.add(cs.fontFamily.split(',')[0]);
  }
  for (const img of document.querySelectorAll('img')) { const r = img.getBoundingClientRect(); if (r.width < 40) continue; out.imgs.push((img.currentSrc || img.src).replace(location.origin, '').slice(0, 120)); }
  const txt = document.body.innerText;
  out.aiLabels = (txt.match(/[^\n]*KI-generiert[^\n]*/g) || []).slice(0, 20);
  out.fonts = [...out.fonts];
  out.title = document.title;
  out.h1 = [...document.querySelectorAll('h1')].map(h => h.innerText.trim());
  out.hscroll = document.documentElement.scrollWidth > innerWidth + 1;
  out.sie = (txt.match(/[^\n]*\b(Sie|Ihre?[nmrs]?|Ihnen)\b[^\n]*/g) || []).slice(0, 15);
  out.excl = (txt.match(/[^\n]*[a-zäöü]!(\s|$)[^\n]*/g) || []).slice(0, 10);
  out.serif = [...document.querySelectorAll('body *')].filter(e => { const cs = getComputedStyle(e); return /somaDisplay|somaAccent/.test(cs.fontFamily) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && e.getBoundingClientRect().height > 0; }).map(e => e.innerText.trim().slice(0, 50)).slice(0, 30);
  return out;
})()
