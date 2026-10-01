/* Petite Paws — small, dependency-free enhancements. The page works without JS. */
(() => {
  const body = document.body;
  const wa = (body.dataset.wa || '').replace(/\D/g, '');
  const waBase = 'https://wa.me/' + wa;
  const igDm = body.dataset.igDm;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* 1 — Message composer: turns the fields into a ready-to-send WhatsApp / Instagram message */
  const form = document.querySelector('.composer');
  if (form) {
    const L = JSON.parse(form.dataset.labels);
    const send = form.querySelector('[data-send]');
    const copyBtn = form.querySelector('[data-copy]');
    const status = form.querySelector('.composer__status');
    const build = () => {
      const d = new FormData(form);
      const lines = [L.hello, ''];
      ['dog', 'dates', 'where', 'needs', 'notes'].forEach((k) => {
        const v = String(d.get(k) || '').trim();
        if (v) lines.push(L[k] + L.sep + v);
      });
      return lines.join('\n').trim();
    };
    const update = () => { send.href = waBase + '?text=' + encodeURIComponent(build()); };
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

  /* 2 — Reviews carousel: advances on its own, one review at a time.
     Pauses on hover, keyboard focus, touch, an opened review, an off-screen or hidden tab,
     and stays still for people who prefer reduced motion (they can still press play). */
  document.querySelectorAll('[data-carousel]').forEach((c) => {
    const track = c.querySelector('.carousel__track');
    const items = [...track.querySelectorAll('.review')];
    const prev = c.querySelector('[data-dir="-1"]');
    const next = c.querySelector('[data-dir="1"]');
    const toggle = c.querySelector('[data-toggle]');
    const cur = c.querySelector('[data-cur]');
    const holds = new Set();
    let playing = !reduce.matches;
    let timer = 0;

    const step = () => (items[1] ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth);
    const last = () => Math.max(0, Math.round((track.scrollWidth - track.clientWidth) / step()));
    const index = () => Math.round(track.scrollLeft / step());
    const go = (i) => {
      const n = last();
      const target = i > n ? 0 : i < 0 ? n : i;
      track.scrollTo({ left: target * step(), behavior: reduce.matches ? 'auto' : 'smooth' });
    };
    const dwell = () => {
      // longer reviews stay a little longer: ~7 s, up to 11 s
      const words = (items[index()]?.textContent || '').trim().split(/\s+/).length;
      return Math.min(11000, Math.max(7000, words * 90));
    };
    const schedule = () => {
      clearTimeout(timer);
      c.classList.remove('is-running');
      c.classList.toggle('is-stopped', !playing);
      if (!playing || holds.size) return;
      const ms = dwell();
      c.style.setProperty('--dwell', ms + 'ms');
      void c.offsetWidth; // restart the progress line
      c.classList.add('is-running');
      timer = setTimeout(() => { go(index() + 1); schedule(); }, ms);
    };
    const hold = (key, on) => { on ? holds.add(key) : holds.delete(key); schedule(); };

    prev.addEventListener('click', () => { go(index() - 1); schedule(); });
    next.addEventListener('click', () => { go(index() + 1); schedule(); });
    toggle.addEventListener('click', () => {
      playing = !playing;
      toggle.setAttribute('aria-label', playing ? toggle.dataset.pause : toggle.dataset.play);
      schedule();
    });
    c.addEventListener('mouseenter', () => hold('hover', true));
    c.addEventListener('mouseleave', () => hold('hover', false));
    c.addEventListener('focusin', (e) => { if (e.target !== toggle) hold('focus', true); });
    c.addEventListener('focusout', (e) => { if (!c.contains(e.relatedTarget)) hold('focus', false); });
    let touchTimer = 0;
    track.addEventListener('pointerdown', () => { clearTimeout(touchTimer); hold('touch', true); });
    const release = () => { clearTimeout(touchTimer); touchTimer = setTimeout(() => hold('touch', false), 4000); };
    track.addEventListener('pointerup', release);
    track.addEventListener('pointercancel', release);
    document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => hold('view', !e.isIntersecting), { threshold: 0.15 }).observe(c);
    }
    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { cur.textContent = String(Math.min(items.length, index() + 1)).padStart(2, '0'); });
    }, { passive: true });

    /* Long reviews are clamped; opening one pauses the carousel */
    c.querySelectorAll('.review__more').forEach((b) => {
      b.addEventListener('click', () => {
        const li = b.closest('.review');
        const open = li.classList.toggle('is-open');
        b.setAttribute('aria-expanded', String(open));
        b.textContent = open ? b.dataset.less : b.dataset.more;
        hold('open:' + li.querySelector('p').id, open);
      });
    });

    toggle.setAttribute('aria-label', playing ? toggle.dataset.pause : toggle.dataset.play);
    schedule();
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
