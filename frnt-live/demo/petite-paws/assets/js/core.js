/* Petite Paws · core behaviour shared by every page.
   Vanilla JS, no dependencies. Everything degrades to a readable static page. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  const PP = (window.PP = { $, $$, reduceMotion, store });

  /* Language --------------------------------------------------------------- */
  const META = {
    en: {
      title: document.body.dataset.titleEn,
      desc: document.body.dataset.descEn,
    },
    fr: {
      title: document.body.dataset.titleFr,
      desc: document.body.dataset.descFr,
    },
  };
  const ATTRS = window.PP_I18N || {};

  function formatDates(lang) {
    const fmt = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    $$('[data-date]').forEach(el => {
      const d = new Date(el.getAttribute('datetime') + 'T12:00:00');
      if (!isNaN(d)) el.textContent = fmt.format(d);
    });
  }

  function setLang(lang, persist) {
    if (!['en', 'fr'].includes(lang)) lang = 'en';
    root.dataset.lang = lang;
    root.lang = lang;
    $$('[data-set-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
    if (META[lang].title) document.title = META[lang].title;
    if (META[lang].desc) $('meta[name="description"]')?.setAttribute('content', META[lang].desc);
    $$('[data-i18n-attr]').forEach(el => {
      el.dataset.i18nAttr.split(';').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        const val = ATTRS[lang]?.[key];
        if (attr && val != null) el.setAttribute(attr, val);
      });
    });
    formatDates(lang);
    if (persist) store.set('pp-lang', lang);
    document.dispatchEvent(new CustomEvent('pp:lang', { detail: lang }));
  }
  PP.setLang = setLang;
  PP.lang = () => root.dataset.lang || 'en';

  if ($('[data-set-lang]')) {
    const saved = store.get('pp-lang');
    const nav = (navigator.languages?.[0] || navigator.language || 'en').slice(0, 2).toLowerCase();
    setLang(saved || (nav === 'fr' ? 'fr' : 'en'));
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-set-lang]');
      if (b) setLang(b.dataset.setLang, true);
    });
  } else {
    formatDates(root.dataset.lang || 'en');
  }

  /* Header: scrolled state + paw walking along the progress line ---------- */
  const head = $('[data-head]');
  if (head) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      head.classList.toggle('is-scrolled', y > 24);
      const foot = document.querySelector('.foot');
      head.classList.toggle('is-night', !!foot && foot.getBoundingClientRect().top < head.offsetHeight);
      head.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* Mobile menu -------------------------------------------------------------- */
  const burger = $('[data-burger]');
  const menu = $('#menu');
  if (burger && menu) {
    const focusables = () => $$('a, button', menu).concat(burger);
    const open = state => {
      burger.setAttribute('aria-expanded', String(state));
      menu.classList.toggle('is-open', state);
      menu.toggleAttribute('inert', !state);
      document.body.classList.toggle('menu-open', state);
      document.body.style.overflow = state ? 'hidden' : '';
      if (state) setTimeout(() => $('a', menu)?.focus({ preventScroll: true }), 350);
    };
    menu.setAttribute('inert', '');
    burger.addEventListener('click', () => open(burger.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', e => { if (e.target.closest('a')) open(false); });
    document.addEventListener('keydown', e => {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') { open(false); burger.focus(); }
      if (e.key === 'Tab') {
        const f = focusables().filter(el => el.offsetParent !== null);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia('(min-width: 1081px)').addEventListener('change', e => { if (e.matches) open(false); });
  }

  /* Reveal on scroll ------------------------------------------------------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  /* Live time in Nice ------------------------------------------------------- */
  const clocks = $$('[data-nice-clock]');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
    const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: 'numeric', hour12: false });
    const tick = () => {
      const now = new Date();
      const t = fmt.format(now).replace(/\s?h\s?/, ':');
      const h = parseInt(hourFmt.format(now), 10);
      const night = h < 7 || h >= 21;
      clocks.forEach(c => { c.textContent = t; c.setAttribute('datetime', now.toISOString()); });
      $$('[data-status]').forEach(s => {
        s.dataset.phase = night ? 'night' : 'day';
        const use = $('.status__icon use', s);
        if (use) use.setAttribute('href', night ? '#pp-moon' : '#pp-sun');
      });
    };
    tick();
    setInterval(tick, 20000);
  }

  /* The live logo: draws itself once it is seen ---------------------------- */
  function playLogo(svg) {
    if (!svg) return;
    if (reduceMotion.matches) { svg.classList.remove('is-ready', 'is-playing'); return; }
    svg.classList.remove('is-playing');
    svg.classList.add('is-ready');
    void svg.getBoundingClientRect();
    requestAnimationFrame(() => svg.classList.add('is-playing'));
  }
  PP.playLogo = playLogo;
  const logos = $$('[data-logo-live]');
  if (logos.length && !reduceMotion.matches) {
    logos.forEach(svg => svg.classList.add('is-ready'));
    const startAll = () => {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { playLogo(en.target); io.unobserve(en.target); } });
      }, { threshold: 0.35 });
      logos.forEach(svg => io.observe(svg));
    };
    (document.fonts?.ready || Promise.resolve()).then(() => setTimeout(startAll, 120));
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-replay]');
    if (b) playLogo($(b.dataset.replay));
  });

  /* Accordion ------------------------------------------------------------------ */
  $$('[data-accordion]').forEach(group => {
    const items = $$('.acc', group);
    items.forEach(item => {
      const btn = $('.acc__btn', item);
      const panel = $('.acc__panel', item);
      panel.setAttribute('inert', '');
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        items.forEach(other => {
          if (other !== item && other.classList.contains('is-open')) {
            other.classList.remove('is-open');
            $('.acc__btn', other).setAttribute('aria-expanded', 'false');
            $('.acc__panel', other).setAttribute('inert', '');
          }
        });
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        panel.toggleAttribute('inert', !open);
      });
    });
  });

  /* Toast ---------------------------------------------------------------------- */
  const toastEl = $('[data-toast]');
  let toastTimer;
  PP.toast = msg => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 5200);
  };

  PP.copy = async text => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove(); return ok;
    }
  };

  /* Year ------------------------------------------------------------------------ */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
