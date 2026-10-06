/* Petite Paws · website behaviour */
(() => {
  'use strict';
  const { $, $$, reduceMotion } = window.PP;

  /* Contact channels. Instagram works today; add an e-mail address or a
     WhatsApp number (international format, digits only) to show those buttons. */
  const CONTACT = { instagram: 'lepetitepaws', email: '', whatsapp: '' };

  const lang = () => window.PP.lang();
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const onScroll = fn => {
    let ticking = false;
    const run = () => { ticking = false; fn(); };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    window.addEventListener('resize', () => requestAnimationFrame(run));
    fn();
  };

  /* Hero: the picture drifts, the logo floats ------------------------------ */
  const canvas = $('[data-parallax]');
  const hero = $('.hero');
  if (canvas && hero && !reduceMotion.matches) {
    const logo = $('.hero__logo');
    onScroll(() => {
      const y = window.scrollY;
      if (y > hero.offsetHeight) return;
      canvas.style.transform = `translate3d(0, ${(y * 0.07).toFixed(1)}px, 0) scale(1.07)`;
      logo?.style.setProperty('--logo-y', `${(y * 0.045).toFixed(1)}px`);
    });
    canvas.style.transformOrigin = '50% 100%';
  }

  /* Header: highlight the section in view ---------------------------------- */
  const navLinks = $$('.nav a[href^="#"]');
  if (navLinks.length) {
    const byId = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const a = byId.get(e.target.id);
        if (!a) return;
        if (e.isIntersecting) { navLinks.forEach(l => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); }
        else if (a.getAttribute('aria-current')) a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* 03 · A day with Léa: the sky follows the scroll ----------------------- */
  const PHASES = [
    { 'sky-a': '#8FB6E0', 'sky-b': '#F9D3B4', sun: '#FFD49A', 'sea-a': '#9CB8D8', 'sea-b': '#5D84B8', 'mount-a': '#AFB2CF', 'mount-b': '#8C9A88', house: '#F2DCC4', roof: '#E3A17C', stone: '#F1D7B4', 'stone-shade': '#D8B08A', cypress: '#4A5A3A', leaf: '#66703A', pot: '#D59670', towel: '#FBF1E6', stripe: '#4B5598', sail: '#FFF6EC', shimmer: '#FFE2C4', 'dog': '#A65A30', 'dog-d': '#6B3418', 'hat': '#B4B08C', stars: 0.12, lights: 0.35, clouds: 0.6 },
    { 'sky-a': '#79B6F0', 'sky-b': '#CBE5FB', sun: '#FFE7A8', 'sea-a': '#5FA3DE', 'sea-b': '#1D5FA8', 'mount-a': '#A5BAD6', 'mount-b': '#6E8A63', house: '#FBE7CF', roof: '#E99B6E', stone: '#FBE6C4', 'stone-shade': '#DDB283', cypress: '#3F5432', leaf: '#5B6029', pot: '#E0A87F', towel: '#FDF4EB', stripe: '#4B5598', sail: '#FFFFFF', shimmer: '#FFFFFF', 'dog': '#B4612C', 'dog-d': '#73381A', 'hat': '#BDB98F', stars: 0, lights: 0, clouds: 0.9 },
    { 'sky-a': '#6AAEF2', 'sky-b': '#BEE0FD', sun: '#FFF2C2', 'sea-a': '#4F99D7', 'sea-b': '#1C4F94', 'mount-a': '#9DB6D6', 'mount-b': '#66825C', house: '#FFF0DC', roof: '#EE9C6C', stone: '#FEE8C3', 'stone-shade': '#D09668', cypress: '#3F5432', leaf: '#5B6029', pot: '#E0A87F', towel: '#FDF4EB', stripe: '#4B5598', sail: '#FFFFFF', shimmer: '#FFFFFF', 'dog': '#B8652E', 'dog-d': '#76391A', 'hat': '#C2BE93', stars: 0, lights: 0, clouds: 0.75 },
    { 'sky-a': '#7DAFE0', 'sky-b': '#F5E1B5', sun: '#FFD27A', 'sea-a': '#5D93C6', 'sea-b': '#234F86', 'mount-a': '#A8A9C2', 'mount-b': '#6F7A55', house: '#FBE0BC', roof: '#E08A58', stone: '#F6D7A6', 'stone-shade': '#C98A55', cypress: '#3D4A2B', leaf: '#5B6029', pot: '#D9905E', towel: '#FBEBD6', stripe: '#4B5598', sail: '#FFF8EE', shimmer: '#FFE7B0', 'dog': '#AD5A2A', 'dog-d': '#6E3418', 'hat': '#B8AE83', stars: 0, lights: 0, clouds: 0.6 },
    { 'sky-a': '#4E5E9A', 'sky-b': '#F3A378', sun: '#F6895A', 'sea-a': '#7A6E99', 'sea-b': '#2B3768', 'mount-a': '#7E6E92', 'mount-b': '#4B4A5E', house: '#E9B99A', roof: '#C66E52', stone: '#E2B48E', 'stone-shade': '#A9705A', cypress: '#2E3328', leaf: '#424629', pot: '#B9704C', towel: '#EBC9B0', stripe: '#3F4884', sail: '#FBD8C2', shimmer: '#FFC09A', 'dog': '#8E4A36', 'dog-d': '#592C26', 'hat': '#9A8C7A', stars: 0.15, lights: 0.7, clouds: 0.45 },
    { 'sky-a': '#0A1830', 'sky-b': '#1E3A66', sun: '#F6EBD0', 'sea-a': '#1B3358', 'sea-b': '#0B1A33', 'mount-a': '#1D2F4F', 'mount-b': '#142540', house: '#2A3C5E', roof: '#233250', stone: '#3A4A66', 'stone-shade': '#2A3852', cypress: '#0F1B2B', leaf: '#1F2C2E', pot: '#4C3F4E', towel: '#5A6788', stripe: '#2E3B6A', sail: '#8C9BB8', shimmer: '#F6EBD0', 'dog': '#3B3148', 'dog-d': '#241E30', 'hat': '#4A5068', stars: 1, lights: 1, clouds: 0.12 },
  ];
  const hexToRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    const A = hexToRgb(a), B = hexToRgb(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const luminance = h => { const [r, g, b] = hexToRgb(h).map(v => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

  const day = $('[data-day]');
  if (day) {
    const scene = $('[data-scene]', day);
    const clockTime = $('[data-day-time]', day);
    const clockName = $('[data-day-name]', day);
    const clock = $('.day__clock', day);
    const feed = $('[data-day-feed]', day);
    const bubble = $('[data-day-bubble]', day);
    const moments = $$('[data-moment]', day);
    const last = moments.length - 1;
    let active = -1, rendered = 0;

    const msgTime = t => { const [h, m] = t.split(':').map(Number); const d = h * 60 + m + 12; return `${String(Math.floor(d / 60) % 24).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`; };
    const messageEl = (i, animate) => {
      const m = moments[i];
      const el = document.createElement('div');
      el.className = 'msg';
      if (!animate) el.style.animation = 'none';
      if (m.dataset.img) { const img = new Image(); img.src = m.dataset.img; img.alt = ''; img.decoding = 'async'; el.appendChild(img); }
      el.append(m.dataset['msg' + (lang() === 'fr' ? 'Fr' : 'En')]);
      const tm = document.createElement('time'); tm.textContent = msgTime(m.dataset.time); el.appendChild(tm);
      return el;
    };
    const renderFeed = (upto, animate) => {
      if (!feed) return;
      if (upto + 1 < rendered || !animate) { feed.textContent = ''; rendered = 0; }
      for (let i = rendered; i <= upto; i++) feed.appendChild(messageEl(i, animate && i === upto));
      rendered = upto + 1;
      if (bubble) { bubble.textContent = ''; if (upto >= 0) bubble.appendChild(messageEl(upto, animate)); }
    };

    const setPhase = p => {
      const seg = p * (PHASES.length - 1);
      const i = Math.min(PHASES.length - 2, Math.floor(seg));
      const t = seg - i;
      const A = PHASES[i], B = PHASES[i + 1];
      for (const k in A) {
        const v = typeof A[k] === 'number' ? (A[k] + (B[k] - A[k]) * t).toFixed(3) : mix(A[k], B[k], t);
        scene.style.setProperty('--' + k, v);
      }
      const sp = clamp(p / 0.86);
      const sx = 70 + 460 * sp;
      const sy = 505 - Math.sin(sp * Math.PI) * (505 - sunPeak);
      scene.style.setProperty('--sx', sx.toFixed(1) + 'px');
      scene.style.setProperty('--sy', (p > 0.86 ? 620 : sy).toFixed(1) + 'px');
      scene.style.setProperty('--moon', clamp((p - 0.8) / 0.15).toFixed(3));
      const sky = mix(A['sky-a'], B['sky-a'], t);
      clock.style.setProperty('--clock-ink', luminance(sky) < 0.33 ? '#FBF5EC' : '#411A05');
    };

    const setActive = i => {
      if (i === active) return;
      const forward = i > active;
      active = i;
      moments.forEach((m, k) => m.classList.toggle('is-active', k === i));
      clockTime.textContent = moments[i].dataset.time;
      clockName.textContent = moments[i].dataset.name;
      renderFeed(i, forward && !reduceMotion.matches);
    };

    // keep the sun's arc below the clock, whatever the height of the window
    let sunPeak = 277;
    const measure = () => {
      const r = scene.getBoundingClientRect();
      if (!r.width) return;
      const scale = Math.max(r.width / 600, r.height / 800);
      const topCut = 800 - r.height / scale;
      const clockBottom = (clock.getBoundingClientRect().bottom - r.top) / scale + topCut;
      sunPeak = clamp(clockBottom + 64, 250, 420);
      scene.style.setProperty('--my', (topCut + 118).toFixed(1) + 'px');
    };
    window.addEventListener('resize', measure);
    (document.fonts?.ready || Promise.resolve()).then(measure);
    measure();

    const update = () => {
      const vc = window.innerHeight * (window.innerWidth <= 900 ? 0.7 : 0.5);
      const c0 = moments[0].getBoundingClientRect();
      const cN = moments[last].getBoundingClientRect();
      const first = c0.top + c0.height / 2, lastC = cN.top + cN.height / 2;
      let p = clamp((vc - first) / (lastC - first));
      const idx = Math.round(p * last);
      if (reduceMotion.matches) p = idx / last;
      setPhase(p);
      setActive(idx);
    };
    onScroll(update);
    document.addEventListener('pp:lang', () => { rendered = 0; renderFeed(active, false); });
  }

  /* 04 · Reviews carousel ------------------------------------------------------ */
  const carousel = $('[data-carousel]');
  let goToReview = () => {};
  if (carousel) {
    const track = $('[data-track]', carousel);
    const slides = $$('.carousel__slide', track);
    const dotsWrap = $('[data-dots]', carousel);
    const prev = $('[data-prev]', carousel), next = $('[data-next]', carousel);
    let current = 0;
    track.style.position = 'relative';

    const dots = slides.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `${i + 1} / ${slides.length}`);
      b.addEventListener('click', () => go(i));
      dotsWrap.appendChild(b);
      return b;
    });

    const go = (i, smooth = true) => {
      i = clamp(i, 0, slides.length - 1);
      const s = slides[i];
      track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.clientWidth) / 2, behavior: smooth && !reduceMotion.matches ? 'smooth' : 'auto' });
      mark(i);
    };
    goToReview = go;
    const mark = i => {
      current = i;
      slides.forEach((s, k) => {
        s.classList.toggle('is-active', k === i);
        s.setAttribute('aria-hidden', String(k !== i));
        $$('a, button, [tabindex]', s).forEach(el => el.setAttribute('tabindex', k === i ? '0' : '-1'));
      });
      dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
    };
    const nearest = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0, dist = Infinity;
      slides.forEach((s, i) => { const d = Math.abs(s.offsetLeft + s.clientWidth / 2 - mid); if (d < dist) { dist = d; best = i; } });
      return best;
    };
    let raf = 0;
    track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const n = nearest(); if (n !== current) mark(n); }); }, { passive: true });
    slides.forEach((s, i) => s.addEventListener('click', e => { if (i !== current && !track.dataset.justDragged) { e.preventDefault(); go(i); } }));
    prev.addEventListener('click', () => go(current - 1));
    next.addEventListener('click', () => go(current + 1));
    track.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
    });

    // drag with the mouse, like a phone
    let drag = null;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('.review__body')) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false };
      track.style.scrollSnapType = 'none';
      track.style.cursor = 'grabbing';
    });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      track.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      track.style.cursor = '';
      const target = nearest();
      track.style.scrollSnapType = '';
      if (moved) {
        track.dataset.justDragged = '1';
        setTimeout(() => delete track.dataset.justDragged, 60);
        go(target);
      }
    });
    track.addEventListener('click', e => { if (track.dataset.justDragged) { e.preventDefault(); delete track.dataset.justDragged; } }, true);

    // long reviews scroll inside the card, with a soft fade while there is more
    $$('.review__body', track).forEach(body => {
      const check = () => {
        const more = body.scrollHeight > body.clientHeight + 4;
        body.classList.toggle('has-more', more);
        body.classList.toggle('at-end', more && body.scrollTop + body.clientHeight >= body.scrollHeight - 4);
      };
      body.addEventListener('scroll', check, { passive: true });
      new ResizeObserver(check).observe(body);
      document.addEventListener('pp:lang', check);
    });

    // on wide screens the arrows sit beside the card, at the middle of the track; they never move
    const placeArrows = () => carousel.style.setProperty('--mid', `${track.offsetTop + track.offsetHeight / 2}px`);
    mark(0);
    placeArrows();
    (document.fonts?.ready || Promise.resolve()).then(placeArrows);
    window.addEventListener('resize', () => { go(current, false); placeArrows(); });
    window.addEventListener('load', () => {
      const m = location.hash.match(/^#review-(\d)$/);
      go(m ? +m[1] - 1 : 0, false);
    });
  }

  // links to a specific review: scroll to the section, then turn the carousel
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-goto-review]');
    if (!a) return;
    e.preventDefault();
    const n = +a.dataset.gotoReview - 1;
    const section = $('#avis');
    section?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => goToReview(n), reduceMotion.matches ? 0 : 650);
    history.replaceState(null, '', '#review-' + (n + 1));
  });

  /* 05 · Steps: a little trail of paw prints -------------------------------- */
  const trail = $('[data-trail]');
  if (trail) {
    const n = 24;
    for (let i = 0; i < n; i++) {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.innerHTML = '<use href="#pp-pawmark"/>';
      const wave = Math.sin(i / (n - 1) * Math.PI * 2) * 6;
      s.style.left = `calc(${(i / (n - 1)) * 100}% - ${(i / (n - 1)) * 17}px)`;
      s.style.top = `${20 + wave + (i % 2 ? -8 : 8)}px`;
      s.style.setProperty('--r', `${90 + Math.cos(i / (n - 1) * Math.PI * 2) * 10 + (i % 2 ? -6 : 6)}deg`);
      s.style.setProperty('--i', i);
      trail.appendChild(s);
    }
    if (reduceMotion.matches) trail.classList.add('is-in');
    else new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { trail.classList.add('is-in'); o.disconnect(); } }), { threshold: 0.5 }).observe(trail);
  }

  /* 07 · The postcard ---------------------------------------------------------- */
  const form = $('[data-book-form]');
  if (form) {
    const card = $('[data-postcard]');
    const T = {
      en: {
        name: 'Please tell me your name.', pet: 'And your companion’s name?', dates: 'The end date is before the start date.',
        svc: { home: 'a home stay', lea: 'holidays at your place', day: 'day care', walks: 'walks' },
        hello: 'Bonjour Léa! 🐾',
        intro: (n, s, p) => s ? `I’m ${n} and I’d love to book ${s} for ${p}.` : `I’m ${n} and I’d love to talk about a stay for ${p}.`,
        both: (f, t) => `Dates: ${f} to ${t}`, from: f => `From ${f}`, about: (p, x) => `About ${p}: ${x}`,
        sign: '(Sent from the Petite Paws website)', subject: p => `Petite Paws: a stay for ${p}`,
        copied: 'Message copied. Paste it into the Instagram chat that just opened.',
        copiedOnly: 'Message copied. Paste it wherever you like.', copyFail: 'Copying didn’t work here. Please select the text of your note and copy it by hand.',
        word: 'ENVOYÉ',
      },
      fr: {
        name: 'Dites-moi votre nom, s’il vous plaît.', pet: 'Et le nom de votre compagnon ?', dates: 'La date de fin est avant la date de début.',
        svc: { home: 'une garde à domicile', lea: 'des vacances chez vous', day: 'une garde de jour', walks: 'des promenades' },
        hello: 'Bonjour Léa ! 🐾',
        intro: (n, s, p) => s ? `Je m’appelle ${n} et j’aimerais réserver ${s} pour ${p}.` : `Je m’appelle ${n} et j’aimerais parler d’une garde pour ${p}.`,
        both: (f, t) => `Dates : du ${f} au ${t}`, from: f => `À partir du ${f}`, about: (p, x) => `À propos de ${p} : ${x}`,
        sign: '(Envoyé depuis le site Petite Paws)', subject: p => `Petite Paws : une garde pour ${p}`,
        copied: 'Message copié. Collez-le dans la conversation Instagram qui vient de s’ouvrir.',
        copiedOnly: 'Message copié. Collez-le où vous voulez.', copyFail: 'La copie n’a pas fonctionné ici. Sélectionnez le texte de votre note et copiez-le à la main.',
        word: 'ENVOYÉ',
      },
    };
    const fmtDate = v => v ? new Intl.DateTimeFormat(lang() === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(v + 'T12:00:00')) : '';

    const setError = (name, msg) => {
      const holder = $(`[data-error-for="${name}"]`, form);
      const field = form.elements[name]?.closest('.field');
      if (holder) holder.textContent = msg || '';
      field?.classList.toggle('is-invalid', !!msg);
      form.elements[name]?.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };
    const validate = () => {
      const t = T[lang()];
      const name = form.elements.name.value.trim(), pet = form.elements.pet.value.trim();
      const from = form.elements.from.value, to = form.elements.to.value;
      setError('name', name ? '' : t.name);
      setError('pet', pet ? '' : t.pet);
      setError('to', from && to && to < from ? t.dates : '');
      const firstBad = !name ? 'name' : !pet ? 'pet' : (from && to && to < from) ? 'to' : null;
      if (firstBad) { form.elements[firstBad].focus(); return null; }
      return { name, pet, from, to, note: form.elements.note.value.trim(), service: form.elements.service.value };
    };
    const compose = d => {
      const t = T[lang()];
      const lines = [t.hello, t.intro(d.name, t.svc[d.service], d.pet)];
      if (d.from && d.to) lines.push(t.both(fmtDate(d.from), fmtDate(d.to)));
      else if (d.from) lines.push(t.from(fmtDate(d.from)));
      if (d.note) lines.push(t.about(d.pet, d.note));
      lines.push('', t.sign);
      return lines.join('\n');
    };
    const stamp = () => {
      const now = new Date();
      $('[data-mark-date]', card).textContent = [now.getDate(), now.getMonth() + 1, now.getFullYear() % 100].map(n => String(n).padStart(2, '0')).join(' · ');
      card.classList.remove('is-sent'); void card.offsetWidth; card.classList.add('is-sent');
    };
    ['name', 'pet', 'to'].forEach(n => form.elements[n].addEventListener('input', () => setError(n, '')));

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const d = validate(); if (!d) return;
      const msg = compose(d);
      const copying = window.PP.copy(msg);
      window.open(`https://ig.me/m/${CONTACT.instagram}`, '_blank', 'noopener');
      const ok = await copying;
      stamp();
      window.PP.toast(ok ? T[lang()].copied : T[lang()].copyFail);
    });
    $('[data-copy-msg]', form).addEventListener('click', async () => {
      const d = validate(); if (!d) return;
      const ok = await window.PP.copy(compose(d));
      if (ok) stamp();
      window.PP.toast(ok ? T[lang()].copiedOnly : T[lang()].copyFail);
    });
    const emailBtn = $('[data-send="email"]', form), waBtn = $('[data-send="whatsapp"]', form);
    if (CONTACT.email) {
      emailBtn.hidden = false;
      emailBtn.addEventListener('click', () => { const d = validate(); if (!d) return; stamp(); location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(T[lang()].subject(d.pet))}&body=${encodeURIComponent(compose(d))}`; });
    }
    if (CONTACT.whatsapp) {
      waBtn.hidden = false;
      waBtn.addEventListener('click', () => { const d = validate(); if (!d) return; stamp(); window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(compose(d))}`, '_blank', 'noopener'); });
    }
    // dates: the end can't be before the start
    form.elements.from.addEventListener('change', () => { form.elements.to.min = form.elements.from.value; });
    const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    form.elements.from.min = form.elements.to.min = today.toISOString().slice(0, 10);
  }
})();
