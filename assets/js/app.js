/* ==================================================================
   Gemeinsames Verhalten aller Seiten
   Header, mobile Navigation, Sprachumschalter, Öffnungszeiten.
   ================================================================== */

import { initLang, setLang, t, apply, onLangChange, getLang, getLocale, LANGUAGES } from './i18n.js';
import { injectSprite } from './icons.js';

/* ------------------------------------------------------------------
   Stammdaten des Restaurants
   ------------------------------------------------------------------ */
export const RESTAURANT = {
  name: 'Restaurant Fuku',
  street: '9, Rue de la Gare',
  zip: 'L-9420',
  city: 'Vianden',
  country: 'Luxembourg',
  email: 'info@fuku.lu',
  // TODO: Telefonnummer eintragen – auf der alten Website war keine hinterlegt.
  phone: '',
  timeZone: 'Europe/Luxembourg',
  coords: { lat: 49.9345, lon: 6.2094 },
  social: {
    facebook: 'https://www.facebook.com/Restaurant-Fuku-110551558349707/',
    instagram: 'https://www.instagram.com/restaurant_fuku/',
  },
  /* Öffnungszeiten in Minuten ab Mitternacht, Index = Wochentag (0 = Sonntag).
     Montag ist Ruhetag. */
  hours: {
    0: [[630, 870], [1050, 1380]],
    1: [],
    2: [[630, 870], [1050, 1380]],
    3: [[630, 870], [1050, 1380]],
    4: [[630, 870], [1050, 1380]],
    5: [[630, 870], [1050, 1380]],
    6: [[630, 870], [1050, 1380]],
  },
};

/**
 * Regeln für Tischreservierungen.
 *
 * ACHTUNG: Diese Werte und RESTAURANT.hours müssen mit dem Konstantenblock
 * in reservierung.php übereinstimmen – der Server prüft jede Anfrage noch
 * einmal selbst. Abgleich mit:  node tools/check-config.mjs
 */
export const RESERVATION = {
  slotMinutes: 15, // Abstand der wählbaren Uhrzeiten
  bufferBeforeClose: 60, // letzte Reservierung so viele Minuten vor Schluss
  minLeadMinutes: 60, // frühestens so viele Minuten im Voraus
  maxAdvanceDays: 90,
  maxGuests: 10, // grössere Gruppen bitte per E-Mail
  endpoint: 'reservierung.php',
};

/* ------------------------------------------------------------------
   Formatierung
   ------------------------------------------------------------------ */
export function formatPrice(value) {
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
}

const pad = (n) => String(n).padStart(2, '0');
export const formatTime = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** Aktuelle Zeit in der Zeitzone des Restaurants – unabhängig vom Gerät. */
export function localNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: RESTAURANT.timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type)?.value ?? '0';
  const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    day: days[get('weekday')] ?? new Date().getDay(),
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/**
 * Öffnungsstatus.
 * @returns {{open: boolean, until?: number, nextDay?: number, nextTime?: number}}
 */
export function getStatus() {
  const { day, minutes } = localNow();

  for (const [from, to] of RESTAURANT.hours[day] || []) {
    if (minutes >= from && minutes < to) return { open: true, until: to };
  }

  // Nächste Öffnung suchen – heute später oder an einem der Folgetage.
  for (let offset = 0; offset < 8; offset += 1) {
    const d = (day + offset) % 7;
    for (const [from] of RESTAURANT.hours[d] || []) {
      if (offset > 0 || from > minutes) return { open: false, nextDay: d, nextTime: from, today: offset === 0 };
    }
  }
  return { open: false };
}

/** Setzt Text und Zustand aller Öffnungs-Badges auf der Seite. */
export function renderStatus() {
  const status = getStatus();

  document.querySelectorAll('[data-status-pill]').forEach((pill) => {
    pill.classList.toggle('pill--open', status.open);
    pill.classList.toggle('pill--closed', !status.open);
    const label = pill.querySelector('[data-status-label]');
    if (!label) return;

    if (status.open) {
      label.textContent = `${t('status.open')} · ${t('status.closesAt', { time: formatTime(status.until) })}`;
    } else if (status.nextTime != null) {
      label.textContent = status.today
        ? `${t('status.closed')} · ${t('status.opensAt', { time: formatTime(status.nextTime) })}`
        : `${t('status.closed')} · ${t('status.opensDay', {
            day: t(`days.${status.nextDay}`),
            time: formatTime(status.nextTime),
          })}`;
    } else {
      label.textContent = t('status.closed');
    }
  });

  document.querySelectorAll('[data-today-hours]').forEach((el) => {
    const { day } = localNow();
    const slots = RESTAURANT.hours[day] || [];
    el.textContent = slots.length
      ? slots.map(([a, b]) => `${formatTime(a)}–${formatTime(b)}`).join('  ·  ')
      : t('days.closed');
  });
}

/** Baut die Öffnungszeiten-Tabelle auf. */
export function renderHours() {
  const list = document.querySelector('[data-hours-list]');
  if (!list) return;

  const { day: today } = localNow();
  const order = [1, 2, 3, 4, 5, 6, 0]; // Woche beginnt am Montag

  list.innerHTML = order
    .map((d) => {
      const slots = RESTAURANT.hours[d] || [];
      const value = slots.length
        ? slots.map(([a, b]) => `${formatTime(a)}–${formatTime(b)}`).join(', ')
        : t('days.closed');
      return `<div class="hours__row" data-today="${d === today}">
          <dt>${t(`days.${d}`)}</dt>
          <dd>${value}</dd>
        </div>`;
    })
    .join('');
}

/* ------------------------------------------------------------------
   Header
   ------------------------------------------------------------------ */
function initHeader() {
  const header = document.querySelector('.header');
  const bar = document.querySelector('.order-bar');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('is-stuck', window.scrollY > 4);
    if (bar) bar.classList.toggle('is-stuck', bar.getBoundingClientRect().top <= header.offsetHeight + 1);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ------------------------------------------------------------------
   Mobile Navigation
   ------------------------------------------------------------------ */
function initMobileNav() {
  const panel = document.querySelector('.mobile-nav');
  const openBtn = document.querySelector('[data-nav-open]');
  const closeBtn = document.querySelector('[data-nav-close]');
  if (!panel || !openBtn) return;

  const setOpen = (open) => {
    panel.dataset.open = String(open);
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
    if (open) closeBtn?.focus();
    else openBtn.focus();
  };

  openBtn.addEventListener('click', () => setOpen(true));
  closeBtn?.addEventListener('click', () => setOpen(false));
  panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.dataset.open === 'true') setOpen(false);
  });
}

/* ------------------------------------------------------------------
   Sprachumschalter
   ------------------------------------------------------------------ */
function initLangSwitchers() {
  document.querySelectorAll('[data-lang-switcher]').forEach((root) => {
    const toggle = root.querySelector('.lang__toggle');
    const menu = root.querySelector('.lang__menu');
    const current = root.querySelector('[data-lang-current]');
    if (!toggle || !menu) return;

    menu.innerHTML = LANGUAGES.map(
      (l) => `<button type="button" data-lang="${l.code}" role="menuitemradio">
          <span>${l.native}</span><span class="lang__code">${l.code.toUpperCase()}</span>
        </button>`,
    ).join('');

    const sync = () => {
      if (current) current.textContent = getLang().toUpperCase();
      menu.querySelectorAll('button').forEach((b) => {
        b.setAttribute('aria-current', String(b.dataset.lang === getLang()));
      });
    };

    const setOpen = (open) => {
      menu.dataset.open = String(open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(menu.dataset.open !== 'true');
    });

    menu.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lang]');
      if (!btn) return;
      setLang(btn.dataset.lang);
      setOpen(false);
    });

    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    sync();
    onLangChange(sync);
  });

  // Sprachliste in der mobilen Navigation
  document.querySelectorAll('[data-lang-inline]').forEach((root) => {
    root.innerHTML = LANGUAGES.map(
      (l) => `<button type="button" class="chip" data-lang="${l.code}">${l.native}</button>`,
    ).join('');

    const sync = () =>
      root.querySelectorAll('[data-lang]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.lang === getLang()));
      });

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lang]');
      if (btn) setLang(btn.dataset.lang);
    });

    sync();
    onLangChange(sync);
  });
}

/* ------------------------------------------------------------------
   Titel & Meta-Beschreibung je Sprache
   ------------------------------------------------------------------ */
function initMeta() {
  const page = document.body.dataset.page;
  if (!page) return;

  const sync = () => {
    document.title = t(`meta.title.${page}`);
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', t(`meta.desc.${page}`));
  };

  sync();
  onLangChange(sync);
}

/* ------------------------------------------------------------------
   Einblend-Animation beim Scrollen
   ------------------------------------------------------------------ */
function initReveal() {
  const nodes = document.querySelectorAll('[data-reveal]');
  if (!nodes.length) return;

  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nodes.forEach((n) => n.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add('is-visible'), i * 60);
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
  );

  nodes.forEach((n) => io.observe(n));

  /* Sicherheitsnetz: In einem Hintergrund-Tab pausiert der
     IntersectionObserver. Wird die Seite dann sichtbar, ohne dass gescrollt
     wird, bliebe Inhalt unsichtbar. Deshalb wird nach dem Laden und beim
     Sichtbarwerden alles freigeschaltet, was gerade im Bild liegt. */
  const revealVisible = () => {
    nodes.forEach((node) => {
      if (node.classList.contains('is-visible')) return;
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) node.classList.add('is-visible');
    });
  };

  window.addEventListener('load', revealVisible, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) revealVisible();
  });
}

/* ------------------------------------------------------------------
   Statische Kontaktangaben einsetzen
   ------------------------------------------------------------------ */
function initContactData() {
  const { street, zip, city, email, phone } = RESTAURANT;

  document.querySelectorAll('[data-contact="address"]').forEach((el) => {
    el.innerHTML = `${street}<br>${zip} ${city}`;
  });

  document.querySelectorAll('[data-contact="email"]').forEach((el) => {
    el.textContent = email;
    if (el.tagName === 'A') el.href = `mailto:${email}`;
  });

  document.querySelectorAll('[data-contact="phone"]').forEach((el) => {
    if (!phone) {
      el.closest('[data-contact-block]')?.remove();
      return;
    }
    el.textContent = phone;
    if (el.tagName === 'A') el.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
  });

  const query = encodeURIComponent(`${RESTAURANT.name}, ${street}, ${zip} ${city}, ${RESTAURANT.country}`);
  document.querySelectorAll('[data-contact="route"]').forEach((el) => {
    el.href = `https://www.openstreetmap.org/search?query=${query}`;
    el.target = '_blank';
    el.rel = 'noopener';
  });
}

/* ------------------------------------------------------------------
   Start
   ------------------------------------------------------------------ */
export function boot() {
  injectSprite();
  initLang();
  apply();
  initMeta();
  initHeader();
  initMobileNav();
  initLangSwitchers();
  initContactData();
  initReveal();
  renderHours();
  renderStatus();

  onLangChange(() => {
    renderHours();
    renderStatus();
  });

  // Öffnungsstatus minütlich auffrischen.
  setInterval(renderStatus, 60_000);
}
