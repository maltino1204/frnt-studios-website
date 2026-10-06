/* Petite Paws · design guidelines page: live demos */
(() => {
  'use strict';
  const { $, $$, reduceMotion } = window.PP;

  /* Copy a colour ------------------------------------------------------------ */
  $$('[data-copy]').forEach(sw => {
    sw.addEventListener('click', async () => {
      const ok = await window.PP.copy(sw.dataset.copy);
      if (!ok) return;
      sw.classList.add('is-copied');
      setTimeout(() => sw.classList.remove('is-copied'), 1400);
    });
  });

  /* Contrast, computed from the live tokens -------------------------------- */
  const css = getComputedStyle(document.documentElement);
  const hex = name => css.getPropertyValue(name).trim();
  const lum = h => {
    const v = h.replace('#', '');
    return [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16) / 255)
      .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  $$('[data-contrast] tr[data-fg]').forEach(tr => {
    const fg = hex(tr.dataset.fg), bg = hex(tr.dataset.bg);
    const r = ratio(fg, bg);
    const aa = $('.aa', tr);
    aa.style.color = fg; aa.style.background = bg; aa.style.boxShadow = 'inset 0 0 0 1px rgb(65 26 5 / .12)';
    $('.ratio', tr).textContent = r.toFixed(1).replace('.', ',') + ' : 1';
    const [cls, label] = r >= 7 ? ['aaa', 'AAA'] : r >= 4.5 ? ['aa', 'AA'] : r >= 3 ? ['large', 'AA large'] : ['orn', 'Ornament'];
    $('.rate', tr).innerHTML = `<span class="g-badge g-badge--${cls}">${label}</span>`;
  });

  /* Easing curves -------------------------------------------------------------- */
  $$('[data-ease]').forEach(panel => {
    const [x1, y1, x2, y2] = panel.dataset.ease.split(',').map(Number);
    const W = 200, H = 120;
    const P = (x, y) => `${(x * W).toFixed(1)} ${(H - y * H * 0.82 - H * 0.09).toFixed(1)}`;
    const svg = $('svg', panel);
    svg.innerHTML = `
      <line class="axis" x1="0" y1="${H}" x2="${W}" y2="${H}"/><line class="axis" x1="0" y1="0" x2="0" y2="${H}"/>
      <path class="handle" d="M${P(0, 0)} L${P(x1, y1)} M${P(1, 1)} L${P(x2, y2)}"/>
      <path class="curve" d="M${P(0, 0)} C${P(x1, y1)} ${P(x2, y2)} ${P(1, 1)}"/>
      <circle class="dot" cx="${P(x1, y1).split(' ')[0]}" cy="${P(x1, y1).split(' ')[1]}" r="4"/>
      <circle class="dot" cx="${P(x2, y2).split(' ')[0]}" cy="${P(x2, y2).split(' ')[1]}" r="4"/>`;
  });
  const runEase = () => {
    $$('.g-ease__track').forEach(t => { t.classList.remove('is-run'); void t.offsetWidth; t.classList.add('is-run'); });
  };
  $('[data-ease-run]')?.addEventListener('click', runEase);
  const easeIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { setTimeout(runEase, 400); easeIO.disconnect(); } }), { threshold: 0.6 });
  const firstEase = $('.g-ease'); if (firstEase) easeIO.observe(firstEase);

  /* Les Pas: paw prints walking across ---------------------------------------- */
  const walk = $('[data-walk-demo]');
  const runWalk = () => {
    if (!walk) return;
    walk.innerHTML = '';
    const n = 9, w = walk.clientWidth;
    for (let i = 0; i < n; i++) {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.innerHTML = '<use href="#pp-pawmark"/>';
      const x = 20 + (i * (w - 60)) / (n - 1);
      const y = i % 2 ? 30 : 64;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.transform = 'rotate(90deg) scale(.6)';
      walk.appendChild(s);
      const delay = reduceMotion.matches ? 0 : i * 170;
      s.animate([{ opacity: 0, transform: 'rotate(90deg) scale(.4)' }, { opacity: 1, transform: 'rotate(90deg) scale(1)' }],
        { duration: reduceMotion.matches ? 1 : 420, delay, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' });
      if (!reduceMotion.matches) s.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: delay + 1500, fill: 'forwards' });
    }
  };
  $('[data-walk-run]')?.addEventListener('click', runWalk);
  if (walk) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { runWalk(); o.disconnect(); } }), { threshold: 0.6 }).observe(walk);

  /* La Vague ------------------------------------------------------------------- */
  $$('[data-wave]').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true'); el.appendChild(s); });
    const go = () => { el.classList.remove('is-waving'); void el.offsetWidth; el.classList.add('is-waving'); };
    el.addEventListener('pointerenter', go);
    el.addEventListener('click', go);
  });

  /* La Journée: the same keyframes as the website ----------------------------- */
  const sky = $('[data-day-demo]'), range = $('[data-day-range]'), dt = $('[data-day-demo-time]');
  if (sky && range) {
    const K = [['#8FB6E0', '#F9D3B4', '#FFD49A'], ['#79B6F0', '#CBE5FB', '#FFE7A8'], ['#6AAEF2', '#BEE0FD', '#FFF2C2'], ['#7DAFE0', '#F5E1B5', '#FFD27A'], ['#4E5E9A', '#F3A378', '#F6895A'], ['#0A1830', '#1E3A66', '#F6EBD0']];
    const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const mix = (a, b, t) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
    const draw = () => {
      const p = range.value / 1000, seg = p * 5, i = Math.min(4, Math.floor(seg)), t = seg - i;
      const [a, b, s] = [0, 1, 2].map(k => mix(K[i][k], K[i + 1][k], t));
      sky.style.setProperty('--a', a); sky.style.setProperty('--b', b); sky.style.setProperty('--s', s);
      const sp = Math.min(1, p / 0.86);
      sky.style.setProperty('--x', (8 + 84 * sp) + '%');
      sky.style.setProperty('--y', (p > 0.86 ? 120 : 88 - Math.sin(sp * Math.PI) * 52) + '%');
      const mins = Math.round((450 + p * 900) / 30) * 30; dt.textContent = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
      const lum = rgb(a).reduce((s2, v, k) => s2 + v / 255 * [0.2126, 0.7152, 0.0722][k], 0);
      sky.style.setProperty('--ink-c', lum < 0.33 ? '#FBF5EC' : '#411A05');
    };
    range.addEventListener('input', draw); draw();
  }

  /* Heart and paw demos ----------------------------------------------------------- */
  const heart = $('[data-heart-demo]');
  heart?.addEventListener('click', () => window.PP.playLogo(heart));
  const paw = $('[data-paw-demo]');
  paw?.addEventListener('click', () => window.PP.playLogo(paw));

  /* Chapter highlighting in the table of contents ----------------------------- */
  const links = $$('.g-toc a');
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const secIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.removeAttribute('aria-current'));
      const a = map.get(e.target.id);
      if (a) { a.setAttribute('aria-current', 'true'); a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion.matches ? 'auto' : 'smooth' }); }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('.g-sec').forEach(s => secIO.observe(s));
})();
