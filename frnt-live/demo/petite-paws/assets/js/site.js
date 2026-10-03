/* Petite Paws — small enhancements. Every page is readable and usable without JavaScript. */
(() => {
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const io = (cb, opts) => ('IntersectionObserver' in window ? new IntersectionObserver(cb, opts) : null);

  /* 1 · Mobile menu: button toggles, Escape and link clicks close, focus returns to the button */
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('site-nav');
  if (btn && nav) {
    const set = (open) => {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? btn.dataset.close : btn.dataset.open;
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); btn.focus(); } });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  }

  /* 2 · Header wordmark appears once the masthead has scrolled away */
  const mast = document.querySelector('.masthead__mark');
  const mo = mast && io(([e]) => body.classList.toggle('past-masthead', !e.isIntersecting && e.boundingClientRect.top < 0));
  if (mo) mo.observe(mast);

  /* 3 · Guest book entries: the heart beats once when an entry comes into view */
  const ho = io((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-seen'); ho.unobserve(e.target); } }), { threshold: 0.5 });
  document.querySelectorAll('.entry').forEach((el) => (ho ? ho.observe(el) : el.classList.add('is-seen')));

  /* 4 · Long entries are clamped and can be opened */
  const opened = new Set();
  document.querySelectorAll('.entry__more').forEach((b) => {
    b.addEventListener('click', () => {
      const en = b.closest('.entry');
      const open = en.classList.toggle('is-open');
      b.setAttribute('aria-expanded', String(open));
      b.textContent = open ? b.dataset.less : b.dataset.more;
      open ? opened.add(en) : opened.delete(en);
      document.dispatchEvent(new CustomEvent('pp:entry'));
    });
  });

  /* 5 · Guest book carousel: turns by itself, one entry at a time.
     Pauses on hover, focus, touch, an opened entry, off-screen or hidden tab.
     With reduced motion it stays still until someone presses play. */
  document.querySelectorAll('[data-carousel]').forEach((c) => {
    const track = c.querySelector('.carousel__track');
    const items = [...c.querySelectorAll('.carousel__item')];
    const toggle = c.querySelector('[data-toggle]');
    const cur = c.querySelector('[data-cur]');
    const holds = new Set();
    let playing = !reduce.matches, timer = 0, touchT = 0, raf = 0;
    const step = () => (items[1] ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth);
    const last = () => Math.max(0, Math.round((track.scrollWidth - track.clientWidth) / step()));
    const index = () => Math.round(track.scrollLeft / step());
    const go = (i) => { const n = last(); track.scrollTo({ left: (i > n ? 0 : i < 0 ? n : i) * step(), behavior: reduce.matches ? 'auto' : 'smooth' }); };
    const dwell = () => Math.min(11000, Math.max(7000, (items[index()]?.textContent || '').trim().split(/\s+/).length * 90));
    const schedule = () => {
      clearTimeout(timer);
      c.classList.remove('is-running');
      c.classList.toggle('is-stopped', !playing);
      toggle.setAttribute('aria-label', playing ? toggle.dataset.pause : toggle.dataset.play);
      if (!playing || holds.size || opened.size) return;
      const ms = dwell();
      c.style.setProperty('--dwell', ms + 'ms');
      void c.offsetWidth;
      c.classList.add('is-running');
      timer = setTimeout(() => { go(index() + 1); schedule(); }, ms);
    };
    const hold = (k, on) => { on ? holds.add(k) : holds.delete(k); schedule(); };
    c.querySelector('[data-dir="-1"]').addEventListener('click', () => { go(index() - 1); schedule(); });
    c.querySelector('[data-dir="1"]').addEventListener('click', () => { go(index() + 1); schedule(); });
    toggle.addEventListener('click', () => { playing = !playing; schedule(); });
    c.addEventListener('mouseenter', () => hold('hover', true));
    c.addEventListener('mouseleave', () => hold('hover', false));
    c.addEventListener('focusin', (e) => { if (e.target !== toggle) hold('focus', true); });
    c.addEventListener('focusout', (e) => { if (!c.contains(e.relatedTarget)) hold('focus', false); });
    track.addEventListener('pointerdown', () => { clearTimeout(touchT); hold('touch', true); });
    const release = () => { clearTimeout(touchT); touchT = setTimeout(() => hold('touch', false), 4000); };
    track.addEventListener('pointerup', release); track.addEventListener('pointercancel', release);
    document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));
    document.addEventListener('pp:entry', schedule);
    const vo = io(([e]) => hold('view', !e.isIntersecting), { threshold: 0.15 });
    if (vo) vo.observe(c);
    track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { cur.textContent = String(Math.min(items.length, index() + 1)).padStart(2, '0'); }); }, { passive: true });
    schedule();
  });

  /* 6 · Composer: the message writes itself in the note while you fill in the form */
  const form = document.querySelector('.composer[data-labels]');
  const note = document.querySelector('[data-note]');
  if (form && note) {
    const L = JSON.parse(form.dataset.labels);
    const wa = (body.dataset.wa || '').replace(/\D/g, '');
    const send = document.querySelector('[data-send]');
    const status = document.querySelector('.note__status');
    const build = () => {
      const d = new FormData(form); const lines = [L.hello, ''];
      ['dog', 'dates', 'where', 'needs', 'notes'].forEach((k) => { const v = String(d.get(k) || '').trim(); if (v) lines.push(L[k] + L.sep + v); });
      return lines.join('\n').trim();
    };
    const update = () => {
      const text = build();
      if (note.textContent !== text) { note.textContent = text; note.classList.remove('is-fresh'); void note.offsetWidth; note.classList.add('is-fresh'); }
      if (send && wa) send.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(text);
    };
    form.addEventListener('input', update); form.addEventListener('change', update);
    form.addEventListener('submit', (e) => e.preventDefault());
    document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
      status.textContent = '';
      try {
        await navigator.clipboard.writeText(build());
        status.append(L.copied + ' ');
        const a = document.createElement('a');
        a.href = body.dataset.igDm; a.target = '_blank'; a.rel = 'noopener'; a.className = 'link'; a.textContent = L.open;
        status.append(a);
      } catch (err) { status.textContent = L.copyFail; }
    }));
    update();
  }

  /* 7 · Mobile dock: shown once the page's own call to action has scrolled away, hidden at the footer */
  const dock = document.querySelector('.dock');
  const targets = [...document.querySelectorAll('[data-dock-hide]')];
  const dio = dock && targets.length && io((es) => {
    es.forEach((e) => seen.set(e.target, e.isIntersecting));
    const on = ![...seen.values()].some(Boolean);
    dock.classList.toggle('is-on', on); dock.toggleAttribute('inert', !on); dock.setAttribute('aria-hidden', String(!on));
  });
  const seen = new Map(targets.map((t) => [t, true]));
  if (dio) targets.forEach((t) => dio.observe(t));
})();
