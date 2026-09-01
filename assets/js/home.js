/* ==================================================================
   Startseite – Zahlen und Empfehlungen aus der Speisekarte
   ================================================================== */

import { boot, formatPrice } from './app.js';
import { t, onLangChange, getLang } from './i18n.js';
import { loadMenu, flatten, countIn, dishName } from './menu-data.js';

boot();

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

/** Vier Empfehlungen – bevorzugt solche mit Foto. */
function pickHighlights(dishes) {
  const popular = dishes.filter((d) => d.popular && d.image);
  const fallback = dishes.filter((d) => d.image && !popular.includes(d));
  return [...popular, ...fallback].slice(0, 4);
}

function renderHighlights(dishes) {
  const rail = document.querySelector('[data-popular]');
  if (!rail) return;

  rail.innerHTML = dishes
    .map(
      (d) => `
      <a class="dish-tile" href="bestellen.html#${d.sectionId}">
        <div class="dish-tile__img">
          <img src="${d.image}" alt="${escapeAttr(dishName(d, getLang()))}" loading="lazy" width="400" height="300" />
        </div>
        <div class="dish-tile__body">
          <h4>${escapeHtml(dishName(d, getLang()))}</h4>
          <div class="dish-tile__meta">
            <span class="price">${formatPrice(d.price)}</span>
            <span class="link-arrow" style="border: 0; padding: 0">
              <svg class="icon" aria-hidden="true"><use href="#i-arrow"></use></svg>
            </span>
          </div>
        </div>
      </a>`,
    )
    .join('');
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const escapeAttr = escapeHtml;

loadMenu()
  .then((menu) => {
    const dishes = flatten(menu);
    const highlights = pickHighlights(dishes);

    renderHighlights(highlights);
    onLangChange(() => renderHighlights(highlights));

    document.querySelectorAll('[data-cat-count]').forEach((el) => {
      el.textContent = String(countIn(menu, el.dataset.catCount));
    });

    const total = menu.count ?? dishes.length;
    document.querySelectorAll('[data-dish-total]').forEach((el) => {
      el.textContent = String(total);
    });

    const setDishCount = () => {
      document.querySelectorAll('[data-dish-count]').forEach((el) => {
        el.textContent = t('hero.dishes', { n: total });
      });
    };
    setDishCount();
    onLangChange(setDishCount);
  })
  .catch((err) => {
    console.error('Speisekarte konnte nicht geladen werden:', err);
    document.querySelector('[data-popular]')?.closest('.section')?.remove();
  });
