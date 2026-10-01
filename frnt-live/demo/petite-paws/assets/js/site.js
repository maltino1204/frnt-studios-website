/* Petite Paws — small, dependency-free enhancements. The page works without JS. */
(() => {
  const body = document.body;
  const wa = (body.dataset.wa || '').replace(/\D/g, '');
  const waBase = 'https://wa.me/' + wa;
  const igDm = body.dataset.igDm;

  /* 1 — Message composer: builds a ready-to-send WhatsApp / Instagram message */
  const form = document.querySelector('.composer');
  if (form) {
    const L = JSON.parse(form.dataset.labels);
    const out = form.querySelector('.preview__text');
    const send = form.querySelector('[data-send]');
    const copyBtn = form.querySelector('[data-copy]');
    const status = form.querySelector('.composer__status');

    const build = () => {
      const d = new FormData(form);
      const lines = [L.hello, ''];
      ['dates', 'where', 'dog', 'needs', 'notes'].forEach((k) => {
        const v = String(d.get(k) || '').trim();
        if (v) lines.push(L[k] + L.sep + v);
      });
      return lines.join('\n').trim();
    };
    const update = () => {
      const msg = build();
      out.textContent = msg;
      send.href = waBase + '?text=' + encodeURIComponent(msg);
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', (e) => { e.preventDefault(); send.click(); });

    copyBtn.addEventListener('click', async () => {
      status.textContent = '';
      try {
        await navigator.clipboard.writeText(build());
        status.append(L.copied + ' ');
        const a = document.createElement('a');
        a.href = igDm; a.target = '_blank'; a.rel = 'noopener'; a.className = 'link';
        a.textContent = L.open;
        status.append(a);
      } catch (err) {
        status.textContent = L.copyFail;
      }
    });
    update();
  }

  /* 2 — Review rail: prev / next buttons for mouse and keyboard users */
  document.querySelectorAll('[data-rail]').forEach((rail) => {
    const track = rail.querySelector('.rail__track');
    const btns = rail.querySelectorAll('.rail__btn');
    const step = () => {
      const item = track.querySelector('li');
      const gap = parseFloat(getComputedStyle(track.querySelector('ul')).columnGap) || 0;
      return item ? item.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    };
    const sync = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      btns[0].disabled = track.scrollLeft <= 2;
      btns[1].disabled = track.scrollLeft >= max;
    };
    btns.forEach((b) => b.addEventListener('click', () => {
      track.scrollBy({ left: Number(b.dataset.dir) * step(), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }));
    track.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    sync();
  });

  /* 2b — Long reviews are clamped on phones; the full text stays in the DOM */
  document.querySelectorAll('.review__more').forEach((b) => {
    b.addEventListener('click', () => {
      const li = b.closest('.review');
      const open = li.classList.toggle('is-open');
      b.setAttribute('aria-expanded', String(open));
      b.textContent = open ? b.dataset.less : b.dataset.more;
    });
  });

  /* 3 — Mobile dock: appears once the hero button is gone, hides near contact & footer */
  const dock = document.querySelector('.dock');
  if (dock && 'IntersectionObserver' in window) {
    const targets = ['.hero__actions', '#contact', '.site-foot'].map((s) => document.querySelector(s)).filter(Boolean);
    const seen = new Map(targets.map((t) => [t, true]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting));
      const on = ![...seen.values()].some(Boolean);
      dock.classList.toggle('is-on', on);
      dock.toggleAttribute('inert', !on);
      dock.setAttribute('aria-hidden', String(!on));
    });
    targets.forEach((t) => io.observe(t));
  }
})();
