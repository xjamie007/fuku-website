/* ==================================================================
   Bestellseite – Speisekarte, Filter, Warenkorb und Checkout
   ================================================================== */

import { boot, formatPrice, RESTAURANT } from './app.js';
import { t, onLangChange, apply, ALLERGENS, getLang } from './i18n.js';
import { icon, emoji } from './icons.js';
import { loadMenu, flatten, normalize, dishName, dishShort } from './menu-data.js';

boot();

/* ------------------------------------------------------------------
   WooCommerce-Anbindung

   Die Seite läuft im Livebetrieb auf derselben Domain wie WordPress,
   deshalb genügen relative Pfade: Session-Cookie und Nonce gelten
   dann automatisch. Zum Testen gegen eine andere Domain kann am
   <body> ein Attribut data-woo-origin gesetzt werden.
   ------------------------------------------------------------------ */
const WOO_ORIGIN = document.body.dataset.wooOrigin || '';
const WOO = {
  store: `${WOO_ORIGIN}/wp-json/wc/store/v1`,
  checkout: `${WOO_ORIGIN}/checkout/`,
};

/* ------------------------------------------------------------------
   Zustand
   ------------------------------------------------------------------ */
const CART_KEY = 'fuku:cart';

/*
 * Bestell-IDs: Bei einfachen Produkten ist das die Produkt-ID, bei
 * variablen (Mittagsmenü, Fondue) die ID der gewählten Variante. Die
 * Store API nimmt beides über denselben Weg entgegen, deshalb ist der
 * Warenkorb durchgehend eine Map<bestellId, menge>.
 */
const state = {
  menu: null,
  dishes: [],
  byId: new Map(), // Gericht-ID  → Gericht
  byOrderId: new Map(), // Bestell-ID  → { dish, choice }
  cart: loadCart(),
  query: '',
  filters: new Set(),
  activeSection: '',
};

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    return new Map(Object.entries(raw).map(([id, qty]) => [Number(id), Number(qty)]).filter(([, q]) => q > 0));
  } catch {
    return new Map();
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(Object.fromEntries(state.cart)));
  } catch {
    /* Speicher kann blockiert sein – der Warenkorb lebt dann nur in dieser Sitzung */
  }
}

const cartCount = () => [...state.cart.values()].reduce((a, b) => a + b, 0);

const unitPrice = (orderId) => {
  const entry = state.byOrderId.get(orderId);
  if (!entry) return 0;
  return entry.choice?.price ?? entry.dish.price;
};

const cartTotal = () =>
  [...state.cart.entries()].reduce((sum, [orderId, qty]) => sum + unitPrice(orderId) * qty, 0);

/** Alle Bestell-IDs eines Gerichts (mehrere bei Varianten). */
const orderIdsOf = (dish) => (dish.choices?.length ? dish.choices.map((c) => c.id) : [dish.id]);

/** Gesamtmenge eines Gerichts über alle seine Varianten. */
const dishQty = (dish) => orderIdsOf(dish).reduce((n, id) => n + (state.cart.get(id) || 0), 0);

/* ------------------------------------------------------------------
   Hilfen
   ------------------------------------------------------------------ */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];


/* ------------------------------------------------------------------
   Speisekarte rendern
   ------------------------------------------------------------------ */
function dishMarkup(dish) {
  const qty = dishQty(dish);
  const multiChoice = (dish.choices?.length ?? 0) > 1;

  // Allergene erscheinen bewusst nur in der Detailansicht und in der
  // Legende – auf der Karte würden die Nummern nur Lärm erzeugen.
  const tags = [
    dish.popular ? `<span class="tag tag--pop">${emoji('star')}${esc(t('order.filterPopular'))}</span>` : '',
    dish.veg ? `<span class="tag tag--veg">${emoji('sprout')}${esc(t('order.filterVeg'))}</span>` : '',
    dish.spicy ? `<span class="tag tag--spicy">${emoji('flame')}${esc(t('order.filterSpicy'))}</span>` : '',
  ]
    .filter(Boolean)
    .join('');

  const src = dish.thumb || dish.image;
  const thumb = src
    ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async" width="82" height="82" />`
    : `<span class="dish__thumb--empty" aria-hidden="true">福</span>`;

  return `
    <article class="dish" data-dish="${dish.id}" data-in-cart="${qty > 0}">
      <button class="dish__main" type="button" data-detail="${dish.id}" aria-label="${esc(t('order.details'))}: ${esc(dishName(dish, getLang()))}">
        <span class="dish__thumb">${thumb}</span>
        <span class="dish__body">
          <span class="dish__title">
            ${dish.code ? `<span class="dish__code">${esc(dish.code)}</span>` : ''}
            <span>${esc(dishShort(dish, getLang()))}</span>
          </span>
          ${dish.description ? `<span class="dish__desc">${esc(dish.description.replace(/\n/g, ' · '))}</span>` : ''}
          ${tags ? `<span class="dish__tags">${tags}</span>` : ''}
        </span>
      </button>

      <div class="dish__side">
        <span class="dish__price">${formatPrice(dish.price)}</span>
        ${control(dish, qty, multiChoice)}
      </div>
    </article>`;
}

/** Rechte Bedienelemente einer Gerichtkarte. */
function control(dish, qty, multiChoice) {
  if (dish.orderable === false) {
    return `<span class="dish__note">${esc(t('order.notOrderable'))}</span>`;
  }

  // Mehrere Varianten: erst auswählen, dann in den Warenkorb.
  if (multiChoice) {
    return `<button class="btn btn--ghost dish__choose" type="button" data-detail="${dish.id}">
        ${qty > 0 ? `<span class="dish__chosen">${qty}</span>` : icon('plus')}
        <span>${esc(t('order.choose'))}</span>
      </button>`;
  }

  return stepperMarkup(orderIdsOf(dish)[0], dishShort(dish, getLang()), qty);
}

function stepperMarkup(orderId, label, qty) {
  return `
    <div class="stepper" data-stepper="${orderId}" data-qty="${qty}">
      <button class="stepper__minus" type="button" data-dec="${orderId}" aria-label="${esc(t('order.remove'))}">
        ${icon('minus')}
      </button>
      <span class="stepper__count" data-count="${orderId}" aria-live="polite">${qty}</span>
      <button type="button" data-inc="${orderId}" aria-label="${esc(t('order.addTo', { name: label }))}">
        ${icon('plus')}
      </button>
    </div>`;
}

function visibleDishes() {
  const q = normalize(state.query);
  const terms = q ? q.split(' ').filter(Boolean) : [];

  return state.dishes.filter((dish) => {
    if (state.filters.has('popular') && !dish.popular) return false;
    if (state.filters.has('veg') && !dish.veg) return false;
    if (state.filters.has('spicy') && !dish.spicy) return false;
    if (!terms.length) return true;
    return terms.every((term) => dish.haystack.includes(term));
  });
}

function renderMenu() {
  const root = $('[data-menu-root]');
  const allowed = new Set(visibleDishes().map((d) => d.id));

  if (!allowed.size) {
    root.innerHTML = `
      <div class="empty">
        <span class="empty__mark" aria-hidden="true">福</span>
        <h3>${esc(t('order.noResults'))}</h3>
        <p>${esc(t('order.noResultsText'))}</p>
        <button class="btn btn--ghost" type="button" data-reset-filters>${esc(t('order.reset'))}</button>
      </div>`;
    renderCatNav([]);
    return;
  }

  const sections = state.menu.sections
    .map((section) => {
      const groups = section.groups
        .map((group) => ({ ...group, items: group.items.filter((i) => allowed.has(i.id)) }))
        .filter((g) => g.items.length);
      return { ...section, groups };
    })
    .filter((s) => s.groups.length);

  root.innerHTML = sections
    .map((section) => {
      const n = section.groups.reduce((a, g) => a + g.items.length, 0);
      const groups = section.groups
        .map(
          (group) => `
          <div class="menu-group">
            ${group.label ? `<div class="menu-group__head"><h3>${esc(group.label[getLang()] || group.label.fr)}</h3></div>` : ''}
            <div class="dish-list">${group.items.map((item) => dishMarkup(state.byId.get(item.id))).join('')}</div>
          </div>`,
        )
        .join('');

      return `
        <section class="menu-section" id="${section.id}" data-section="${section.id}">
          <div class="menu-section__head">
            <h2>${esc(section.label[getLang()] || section.label.fr)}</h2>
            <span>${esc(t('order.dishCount', { n }))}</span>
          </div>
          ${groups}
        </section>`;
    })
    .join('');

  renderCatNav(sections);
  observeSections();
}

function renderCatNav(sections) {
  const rail = $('[data-cat-rail]');
  const pills = $('[data-cat-pills]');

  const links = sections
    .map((section) => {
      const n = section.groups.reduce((a, g) => a + g.items.length, 0);
      const name = esc(section.label[getLang()] || section.label.fr);
      return { id: section.id, name, n, icon: section.icon };
    });

  rail.innerHTML = links
    .map(
      (l) => `<li><a href="#${l.id}" data-cat-link="${l.id}">${emoji(l.icon)}<span>${l.name}</span>
        <span class="cat-rail__n">${l.n}</span></a></li>`,
    )
    .join('');

  pills.innerHTML = links
    .map((l) => `<a href="#${l.id}" data-cat-link="${l.id}">${emoji(l.icon)}<span>${l.name}</span></a>`)
    .join('');

  // Die Links sind neu – die gemerkte Auswahl gilt nicht mehr, sonst
  // bliebe nach dem Filtern keine Kategorie markiert.
  state.activeSection = '';
}

/* ------------------------------------------------------------------
   Scrollspy für die Kategorienavigation
   ------------------------------------------------------------------ */
let spyBound = false;
let spyLast = 0;
let spyTimer = null;

/**
 * Bestimmt die aktive Kategorie aus den Positionen der Abschnitte.
 *
 * Bewusst rechnerisch statt über einen IntersectionObserver: die Abschnitte
 * sind unterschiedlich hoch, und beim Sprung zu einem Anker soll sofort die
 * richtige Kategorie markiert sein – nicht erst nach der nächsten Bewegung.
 */
function updateSpy() {
  const sections = $$('[data-section]');
  if (!sections.length) return;

  // Sichtbarer Bereich unterhalb von Kopfzeile und Suchleiste.
  const header = document.querySelector('.header')?.offsetHeight ?? 68;
  const bar = document.querySelector('.order-bar')?.offsetHeight ?? 0;
  const top = header + bar;
  const bottom = window.innerHeight;

  // Aktiv ist die Kategorie, die den grössten Teil des Sichtfelds füllt.
  // Das kommt ohne getunte Schwellwerte aus und bleibt auch dann richtig,
  // wenn ein Abschnitt nur wenige Gerichte hat.
  let best = sections[0];
  let bestVisible = -Infinity;

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    const visible = Math.min(rect.bottom, bottom) - Math.max(rect.top, top);
    if (visible > bestVisible) {
      bestVisible = visible;
      best = section;
    }
  }

  setActiveSection(best.dataset.section);
}

/* Drosselung über die Uhr statt über requestAnimationFrame: In einem
   Hintergrund-Tab pausiert rAF, und die Kategorie bliebe dann falsch
   markiert, sobald der Tab wieder in den Vordergrund kommt. */
function onScroll() {
  const now = Date.now();
  clearTimeout(spyTimer);

  if (now - spyLast >= 100) {
    spyLast = now;
    updateSpy();
  } else {
    spyTimer = setTimeout(() => {
      spyLast = Date.now();
      updateSpy();
    }, 100);
  }
}

function observeSections() {
  updateSpy();
  if (spyBound) return;
  spyBound = true;

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

function setActiveSection(id) {
  if (state.activeSection === id) return;
  state.activeSection = id;

  $$('[data-cat-link]').forEach((link) => {
    const active = link.dataset.catLink === id;
    link.setAttribute('aria-current', String(active));
    if (active) revealPill(link);
  });
}

/**
 * Schiebt die aktive Pille in den sichtbaren Bereich der Kategorienleiste.
 *
 * `scrollIntoView({ inline: 'center' })` ist hier unbrauchbar: Es scrollt
 * auch dann, wenn die Pille längst sichtbar ist, und rechnet den Innenabstand
 * der Leiste nicht mit – die erste Pille landete dadurch angeschnitten links
 * ausserhalb des Bildschirms. Deshalb wird nur bei Bedarf und nur um die
 * fehlende Strecke gescrollt.
 */
function revealPill(link) {
  const rail = link.closest('.cat-pills');
  if (!rail) return;

  const gap = 16; // etwas Luft, damit die Pille nicht am Rand klebt
  const railBox = rail.getBoundingClientRect();
  const pillBox = link.getBoundingClientRect();

  const missingLeft = pillBox.left - railBox.left - gap;
  const missingRight = pillBox.right - railBox.right + gap;

  // Nur eine Richtung kann fehlen; der Browser begrenzt scrollBy selbst.
  if (missingLeft < 0) rail.scrollBy({ left: missingLeft, behavior: 'smooth' });
  else if (missingRight > 0) rail.scrollBy({ left: missingRight, behavior: 'smooth' });
}

/* ------------------------------------------------------------------
   Warenkorb
   ------------------------------------------------------------------ */
function cartMarkup(variant) {
  const closeBtn =
    variant === 'sheet'
      ? `<button class="icon-btn sheet__close" type="button" data-sheet-close aria-label="${esc(t('cart.close'))}">
           ${icon('close')}
         </button>`
      : '';

  return `
    <div class="cart">
      <div class="cart__head">
        <h2 id="sheet-cart-title">${esc(t('cart.title'))}</h2>
        <span class="cart__count" data-cart-count>0</span>
        <button class="cart__clear" type="button" data-cart-clear>${esc(t('cart.clear'))}</button>
        ${closeBtn}
      </div>

      <div class="cart__body" data-cart-body></div>

      <div class="cart__foot">
        <div class="cart__error" data-cart-error data-show="false"></div>
        <div class="cart__totals">
          <div class="is-total">
            <span>${esc(t('cart.total'))}</span>
            <span data-cart-total>${formatPrice(0)}</span>
          </div>
        </div>
        <button class="btn btn--brand btn--lg btn--block" type="button" data-checkout>
          <span>${esc(t('cart.checkout'))}</span>
          ${icon('arrow')}
        </button>
        <p class="cart__note">${esc(t('cart.note'))}</p>
      </div>
    </div>`;
}

function mountCarts() {
  $$('[data-cart-mount]').forEach((node) => {
    node.innerHTML = cartMarkup(node.dataset.cartMount);
  });
  renderCart();
}

function renderCart() {
  const count = cartCount();
  const total = cartTotal();

  $$('[data-cart-count]').forEach((el) => {
    el.textContent = String(count);
  });
  $$('[data-cart-total]').forEach((el) => {
    el.textContent = formatPrice(total);
  });

  const lines = cartLines();

  const body = lines.length
    ? lines
        .map(
          ({ orderId, dish, choice, qty }) => `
          <div class="cart-line" data-line="${orderId}">
            <span class="cart-line__qty">${qty}×</span>
            <span class="cart-line__name">
              ${esc(dishShort(dish, getLang()))}
              ${choice ? `<small>${esc(choice.label)}</small>` : dish.code ? `<small>${esc(dish.code)}</small>` : ''}
            </span>
            <span class="cart-line__end">
              <span class="cart-line__ctrl">
                <button type="button" data-dec="${orderId}" aria-label="${esc(t('order.remove'))}">${icon('minus')}</button>
                <button type="button" data-inc="${orderId}" aria-label="${esc(t('order.add'))}">${icon('plus')}</button>
              </span>
              <span class="cart-line__price">${formatPrice(unitPrice(orderId) * qty)}</span>
            </span>
          </div>`,
        )
        .join('')
    : `<div class="cart__empty">
         ${icon('cart')}
         <strong>${esc(t('cart.empty'))}</strong>
         <p>${esc(t('cart.emptyText'))}</p>
       </div>`;

  $$('[data-cart-body]').forEach((el) => {
    el.innerHTML = body;
  });

  $$('[data-checkout]').forEach((btn) => {
    btn.disabled = !lines.length;
    btn.style.opacity = lines.length ? '' : '0.45';
    btn.style.pointerEvents = lines.length ? '' : 'none';
  });

  $$('[data-cart-clear]').forEach((btn) => {
    btn.hidden = !lines.length;
  });

  const bar = $('[data-cart-bar]');
  if (bar) {
    bar.dataset.show = String(count > 0);
    document.body.classList.toggle('has-cart-bar', count > 0);
  }
}

/** Warenkorbzeilen mit aufgelöstem Gericht und ggf. gewählter Variante. */
function cartLines() {
  return [...state.cart.entries()]
    .map(([orderId, qty]) => ({ orderId, qty, ...(state.byOrderId.get(orderId) || {}) }))
    .filter((l) => l.dish);
}

/** Aktualisiert nur die betroffenen Elemente statt der ganzen Liste. */
function syncOrderId(orderId) {
  const qty = state.cart.get(orderId) || 0;

  $$(`[data-stepper="${orderId}"]`).forEach((stepper) => {
    stepper.dataset.qty = String(qty);
    const count = $(`[data-count="${orderId}"]`, stepper);
    if (!count) return;
    count.textContent = String(qty);
    count.classList.remove('bump');
    void count.offsetWidth; // Animation neu starten
    if (qty > 0) count.classList.add('bump');
  });

  // Karte des zugehörigen Gerichts nachziehen (bei Varianten die Summe).
  const dish = state.byOrderId.get(orderId)?.dish;
  if (!dish) return;
  const total = dishQty(dish);

  $$(`[data-dish="${dish.id}"]`).forEach((card) => {
    card.dataset.inCart = String(total > 0);
    const badge = $('.dish__chosen', card);
    const chooser = $('.dish__choose', card);
    if (!chooser) return;
    if (total > 0) {
      if (badge) badge.textContent = String(total);
      else chooser.insertAdjacentHTML('afterbegin', `<span class="dish__chosen">${total}</span>`);
      $('svg', chooser)?.remove();
    } else if (badge) {
      badge.replaceWith(document.createRange().createContextualFragment(icon('plus')));
    }
  });
}

function setQty(orderId, qty) {
  const next = Math.max(0, Math.min(99, qty));
  if (next === 0) state.cart.delete(orderId);
  else state.cart.set(orderId, next);

  saveCart();
  syncOrderId(orderId);
  renderCart();
}

const addOne = (orderId) => {
  setQty(orderId, (state.cart.get(orderId) || 0) + 1);
  const entry = state.byOrderId.get(orderId);
  if (entry) {
    const short = dishShort(entry.dish, getLang());
    const name = entry.choice ? `${short} · ${entry.choice.label}` : short;
    showToast(t('order.added', { name }));
  }
};

const removeOne = (orderId) => setQty(orderId, (state.cart.get(orderId) || 0) - 1);

/* ------------------------------------------------------------------
   Toast
   ------------------------------------------------------------------ */
let toastTimer = null;

function showToast(message) {
  const toast = $('[data-toast]');
  if (!toast) return;
  $('[data-toast-text]', toast).textContent = message;
  toast.dataset.show = 'true';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.dataset.show = 'false';
  }, 2200);
}

/* ------------------------------------------------------------------
   Overlays
   ------------------------------------------------------------------ */
let lastFocus = null;

function openSheet(name) {
  lastFocus = document.activeElement;
  $('[data-scrim]').dataset.open = 'true';
  $(`[data-sheet="${name}"]`).dataset.open = 'true';
  document.body.classList.add('is-locked');
  $(`[data-sheet="${name}"]`).querySelector('button, [href], input')?.focus();
}

function closeSheets() {
  $('[data-scrim]').dataset.open = 'false';
  $$('[data-sheet]').forEach((s) => {
    s.dataset.open = 'false';
  });
  document.body.classList.remove('is-locked');
  lastFocus?.focus();
}

function openDetail(id) {
  const dish = state.byId.get(id);
  if (!dish) return;

  const allergens = dish.allergens.length
    ? `<div class="detail__allergens">
         <h3>${esc(t('allergens.title'))}</h3>
         <ul>${dish.allergens
           .map((code) => {
             const base = parseInt(code, 10);
             const name = ALLERGENS[base]?.[getLang()];
             return `<li><b>${esc(code)}</b> ${esc(name || '')}</li>`;
           })
           .join('')}</ul>
       </div>`
    : '';

  $('[data-detail-body]').innerHTML = `
    <button class="sheet__x" type="button" data-sheet-close aria-label="${esc(t('cart.close'))}">${icon('close')}</button>
    ${dish.image ? `<div class="detail__media"><img src="${esc(dish.image)}" alt="${esc(dish.name)}" /></div>` : ''}
    <div class="detail__body">
      <h2 id="detail-title">${dish.code ? `<span class="dish__code">${esc(dish.code)}</span> ` : ''}${esc(dishName(dish, getLang()))}</h2>
      ${dish.description ? `<p class="detail__desc">${esc(dish.description)}</p>` : ''}
      ${variantMarkup(dish)}
      ${allergens}
    </div>
    ${detailFoot(dish)}`;

  openSheet('detail');
}

/** Auswahlliste für Gerichte mit mehreren Varianten. */
function variantMarkup(dish) {
  if ((dish.choices?.length ?? 0) < 2) return '';

  return `
    <div class="variants">
      <h3>${esc(t('order.variants'))}</h3>
      ${dish.choices
        .map(
          (choice) => `
          <div class="variant">
            <span class="variant__label">${esc(choice.label)}</span>
            <span class="variant__price">${formatPrice(choice.price ?? dish.price)}</span>
            ${stepperMarkup(choice.id, `${dishShort(dish, getLang())} · ${choice.label}`, state.cart.get(choice.id) || 0)}
          </div>`,
        )
        .join('')}
    </div>`;
}

function detailFoot(dish) {
  if (dish.orderable === false) {
    return `<div class="detail__foot">
        <span class="price">${formatPrice(dish.price)}</span>
        <span class="detail__hint">${esc(t('order.notOrderableHint'))}</span>
      </div>`;
  }

  // Bei mehreren Varianten sitzen die Mengenknöpfe in der Auswahlliste.
  if ((dish.choices?.length ?? 0) > 1) {
    return `<div class="detail__foot">
        <span class="price">${formatPrice(dish.price)}</span>
        <span class="detail__hint">${esc(t('order.variants'))}</span>
      </div>`;
  }

  const orderId = orderIdsOf(dish)[0];
  return `<div class="detail__foot">
      <span class="price">${formatPrice(dish.price)}</span>
      ${stepperMarkup(orderId, dishShort(dish, getLang()), state.cart.get(orderId) || 0)}
    </div>`;
}

/* ------------------------------------------------------------------
   Checkout – Warenkorb an WooCommerce übergeben
   ------------------------------------------------------------------ */
async function pushToWooCommerce(lines) {
  // Nonce und Cart-Token holen; ohne sie weist die Store API Schreibzugriffe ab.
  const probe = await fetch(`${WOO.store}/cart`, { credentials: 'include' });
  if (!probe.ok) throw new Error(`Store API antwortet mit ${probe.status}`);

  const headers = { 'Content-Type': 'application/json' };
  const nonce = probe.headers.get('nonce');
  const cartToken = probe.headers.get('cart-token');
  if (nonce) headers.Nonce = nonce;
  if (cartToken) headers['Cart-Token'] = cartToken;

  // Vorhandenen Serverwarenkorb leeren, damit nichts doppelt landet.
  await fetch(`${WOO.store}/cart/items`, { method: 'DELETE', headers, credentials: 'include' });

  // Nacheinander übertragen: der /batch-Endpunkt reicht die Nonce nicht an
  // seine Teilanfragen weiter und quittiert jedes add-item mit 401.
  const failed = [];
  for (const { orderId, qty } of lines) {
    const res = await fetch(`${WOO.store}/cart/add-item`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ id: orderId, quantity: qty }),
    });
    if (!res.ok) failed.push({ orderId, status: res.status });
  }

  if (failed.length === lines.length) throw new Error('Kein Artikel konnte übernommen werden');
  return failed;
}

/** Bestellung als E-Mail-Text – Rückfallebene, falls die API nicht erreichbar ist. */
function orderMailto() {
  const lines = cartLines();

  const body = [
    `${t('cart.title')}:`,
    '',
    ...lines.map(
      ({ orderId, dish, choice, qty }) =>
        `${qty}× ${dish.code ? `${dish.code} ` : ''}${dish.name}${choice ? ` (${choice.label})` : ''} — ${formatPrice(
          unitPrice(orderId) * qty,
        )}`,
    ),
    '',
    `${t('cart.total')}: ${formatPrice(cartTotal())}`,
    '',
    '---',
    'Name:',
    'Telefon:',
    'Abholung / Lieferung:',
    'Wunschzeit:',
  ].join('\n');

  return `mailto:${RESTAURANT.email}?subject=${encodeURIComponent('Online-Bestellung')}&body=${encodeURIComponent(body)}`;
}

async function checkout(button) {
  const lines = cartLines();
  if (!lines.length) return;

  const label = $('span', button);
  const original = label.textContent;
  button.dataset.busy = 'true';
  label.textContent = t('cart.checkoutBusy');
  $$('[data-cart-error]').forEach((el) => {
    el.dataset.show = 'false';
  });

  try {
    await pushToWooCommerce(lines);
    // Lokalen Warenkorb leeren – ab hier führt WooCommerce.
    state.cart.clear();
    saveCart();
    window.location.href = WOO.checkout;
  } catch (err) {
    console.error('Checkout:', err);
    button.dataset.busy = 'false';
    label.textContent = original;

    $$('[data-cart-error]').forEach((el) => {
      el.dataset.show = 'true';
      el.innerHTML = `${esc(t('cart.error'))}
        <a href="${orderMailto()}" style="display:inline-block;margin-top:.4rem;font-weight:700;text-decoration:underline">
          ${esc(t('home.info.write'))}
        </a>`;
    });
  }
}

/* ------------------------------------------------------------------
   Allergen-Legende
   ------------------------------------------------------------------ */
function renderAllergenKey() {
  const list = $('[data-allergen-key]');
  if (!list) return;
  list.innerHTML = Object.entries(ALLERGENS)
    .map(([num, names]) => `<li><b>${num}</b><span>${esc(names[getLang()])}</span></li>`)
    .join('');
}

/* ------------------------------------------------------------------
   Ereignisse
   ------------------------------------------------------------------ */
function wireEvents() {
  // Mengen ändern und Details öffnen (Delegation für die ganze Seite)
  document.addEventListener('click', (event) => {
    const inc = event.target.closest('[data-inc]');
    if (inc) {
      addOne(Number(inc.dataset.inc));
      return;
    }

    const dec = event.target.closest('[data-dec]');
    if (dec) {
      removeOne(Number(dec.dataset.dec));
      return;
    }

    const detail = event.target.closest('[data-detail]');
    if (detail) {
      openDetail(Number(detail.dataset.detail));
      return;
    }

    if (event.target.closest('[data-cart-open]')) {
      openSheet('cart');
      return;
    }

    if (event.target.closest('[data-sheet-close]') || event.target.closest('[data-scrim]')) {
      closeSheets();
      return;
    }

    const clear = event.target.closest('[data-cart-clear]');
    if (clear) {
      if (state.cart.size && window.confirm(t('cart.clearConfirm'))) {
        const ids = [...state.cart.keys()];
        state.cart.clear();
        saveCart();
        ids.forEach(syncOrderId);
        renderCart();
      }
      return;
    }

    const checkoutBtn = event.target.closest('[data-checkout]');
    if (checkoutBtn) {
      checkout(checkoutBtn);
      return;
    }

    if (event.target.closest('[data-reset-filters]')) {
      state.filters.clear();
      state.query = '';
      $('#dish-search').value = '';
      $('[data-search]').dataset.filled = 'false';
      $$('[data-filter]').forEach((c) => c.setAttribute('aria-pressed', 'false'));
      renderMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSheets();
  });

  // Suche
  const search = $('#dish-search');
  let timer = null;
  search.addEventListener('input', () => {
    $('[data-search]').dataset.filled = String(search.value.length > 0);
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.query = search.value;
      renderMenu();
    }, 140);
  });

  $('[data-search-clear]').addEventListener('click', () => {
    search.value = '';
    state.query = '';
    $('[data-search]').dataset.filled = 'false';
    renderMenu();
    search.focus();
  });

  // Filter
  $$('[data-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.filter;
      const on = !state.filters.has(key);
      if (on) state.filters.add(key);
      else state.filters.delete(key);
      chip.setAttribute('aria-pressed', String(on));
      renderMenu();
    });
  });

  // Kategorie-Links: sanft scrollen, ohne die URL zu fluten
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-cat-link]');
    if (!link) return;
    event.preventDefault();
    const target = document.getElementById(link.dataset.catLink);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${link.dataset.catLink}`);
  });
}

/**
 * Springt zu der in der URL genannten Kategorie (z. B. bestellen.html#sushi).
 *
 * Die Speisekarte entsteht erst nach dem Laden von menu.json, deshalb greift
 * der eingebaute Ankersprung des Browsers ins Leere. Zusätzlich verschieben
 * nachgeladene Bilder die Seitenhöhe, weshalb die Position nach dem
 * vollständigen Laden noch einmal nachgezogen wird.
 */
function jumpToHash() {
  if (!location.hash) return;
  const id = location.hash.slice(1);

  // Verhindert, dass der Browser danach auf die alte Position zurückspringt.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const jump = () => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
    updateSpy();
  };

  jump();
  // Nachgeladene Bilder verschieben die Seitenhöhe – danach nachjustieren.
  setTimeout(jump, 60);
  if (document.readyState !== 'complete') window.addEventListener('load', jump, { once: true });
}

/* ------------------------------------------------------------------
   Start
   ------------------------------------------------------------------ */
loadMenu()
  .then((menu) => {
    state.menu = menu;
    state.dishes = flatten(menu).map((dish) => ({
      ...dish,
      // Suchindex: Name, Nummer, Beschreibung und Gruppenname
      haystack: normalize(
        [
          dish.name,
          dish.code,
          dish.description,
          // Übersetzungen mit in den Suchindex: Wer „Lachs" tippt, soll
          // „Saumon" finden, unabhängig von der eingestellten Sprache.
          ...Object.values(dish.t || {}),
          Object.values(dish.groupLabel || {}).join(' '),
        ].join(' '),
      ),
    }));
    state.byId = new Map(state.dishes.map((d) => [d.id, d]));

    // Bestell-IDs auflösen: Varianten bekommen je eine eigene.
    state.byOrderId = new Map();
    for (const dish of state.dishes) {
      if (dish.choices?.length) {
        dish.choices.forEach((choice) => state.byOrderId.set(choice.id, { dish, choice }));
      } else if (dish.orderable !== false) {
        state.byOrderId.set(dish.id, { dish, choice: null });
      }
    }

    // Warenkorb aus einer früheren Sitzung bereinigen: Gerichte, die es
    // nicht mehr gibt, würden sonst als Geisterposten mitgezählt.
    let pruned = false;
    for (const orderId of [...state.cart.keys()]) {
      if (!state.byOrderId.has(orderId)) {
        state.cart.delete(orderId);
        pruned = true;
      }
    }
    if (pruned) saveCart();

    const intro = $('[data-order-intro-text]');
    const setIntro = () => {
      if (intro) intro.textContent = t('order.text', { n: menu.count });
    };

    setIntro();
    renderMenu();
    mountCarts();
    renderAllergenKey();
    wireEvents();
    apply();

    onLangChange(() => {
      setIntro();
      renderMenu();
      mountCarts();
      renderAllergenKey();
    });

    jumpToHash();
  })
  .catch((err) => {
    console.error('Speisekarte konnte nicht geladen werden:', err);
    $('[data-menu-root]').innerHTML = `
      <div class="empty">
        <span class="empty__mark" aria-hidden="true">福</span>
        <h3>${esc(t('order.noResults'))}</h3>
        <p>${esc(t('cart.errorOffline'))}</p>
      </div>`;
  });
