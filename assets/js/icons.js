/* ==================================================================
   Icon-Sprite – eine Quelle für alle Seiten.
   Verwendung im HTML:  <svg class="icon"><use href="#i-cart"></use></svg>
   ================================================================== */

const ICONS = {
  chevron: '<polyline points="6 9 12 15 18 9"/>',
  menu: '<line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  cart: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2.5 6 12 13 21.5 6"/>',
  phone:
    '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 5-9 16-10 0 11-3.5 16-9 17Z"/><path d="M8 17c1.5-4 4-7 8-9"/>',
  flame: '<path d="M12 22c4 0 7-2.7 7-6.5 0-4.5-4-6-4-10.5-3 1.5-4.5 4-4.5 6.5 0 1-1.5 1.5-2 .5C7 13 5 14.2 5 16.5 5 19.7 8 22 12 22Z"/>',
  star: '<polygon points="12 3 14.8 9 21 9.8 16.5 14.2 17.6 20.5 12 17.5 6.4 20.5 7.5 14.2 3 9.8 9.2 9"/>',
  globe: '<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
  external: '<path d="M14 4h6v6"/><line x1="20" y1="4" x2="11" y2="13"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  facebook: '<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v8h4v-8h3l1-4h-4V7.5A.5.5 0 0 1 12.5 7H15Z"/>',
  instagram:
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>',

  /* Kategorien ------------------------------------------------------ */
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M8 8c0-1.5 1.8-2 1.8-3.5M12 8c0-1.5 1.8-2 1.8-3.5M16 8c0-1.5 1.8-2 1.8-3.5"/>',
  soup: '<path d="M4 12h16a8 8 0 0 1-16 0Z"/><line x1="2.5" y1="20.5" x2="21.5" y2="20.5"/><path d="M9 8.5c0-1.6 1.6-1.8 1.6-3.4M14 8.5c0-1.6 1.6-1.8 1.6-3.4"/>',
  sushi: '<rect x="3" y="7" width="18" height="10" rx="4"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none"/>',
  wok: '<path d="M2.5 10.5h15a7.5 7.5 0 0 1-15 0Z"/><path d="M17.5 10.5h4M20 8.5l1.5 2-1.5 2"/><path d="M7 7.5c0-1.4 1.5-1.6 1.5-3M11.5 7.5c0-1.4 1.5-1.6 1.5-3"/>',
  chili: '<path d="M6 20c7 0 12-4.5 12-11"/><path d="M6 20a3.5 3.5 0 0 1 0-7c3.5 0 6 2.5 6 6"/><path d="M18 9c0-2 .7-3.5 2-4.5-2.2-.4-3.7.4-4.6 1.8"/>',
  noodles:
    '<path d="M3.5 12h17a8.5 8.5 0 0 1-17 0Z"/><path d="M7.5 8.5c1-1.5.4-3-1-4M11.5 8.5c1-1.5.4-3-1-4M15.5 8.5c1-1.5.4-3-1-4"/><line x1="15" y1="15" x2="22" y2="9.5"/>',
  pot: '<rect x="3.5" y="9" width="17" height="11" rx="3"/><line x1="2" y1="12.5" x2="3.5" y2="12.5"/><line x1="20.5" y1="12.5" x2="22" y2="12.5"/><path d="M8 6.5h8"/><line x1="12" y1="4" x2="12" y2="6.5"/>',
  glass: '<path d="M6 3h12l-1.2 16a2 2 0 0 1-2 1.9H9.2a2 2 0 0 1-2-1.9Z"/><line x1="6.5" y1="9" x2="17.5" y2="9"/>',
  sprout: '<path d="M12 21v-8"/><path d="M12 13C12 9 9 7 5 7c0 4 3 6 7 6Z"/><path d="M12 13c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5Z"/>',
};

const SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${Object.entries(
  ICONS,
)
  .map(
    ([name, body]) =>
      `<symbol id="i-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</symbol>`,
  )
  .join('')}</svg>`;

/** Fügt den Sprite einmalig ins Dokument ein. */
export function injectSprite() {
  if (document.getElementById('fuku-sprite')) return;
  const holder = document.createElement('div');
  holder.id = 'fuku-sprite';
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  holder.innerHTML = SPRITE;
  document.body.prepend(holder);
}

/** Kurzschreibweise für dynamisch erzeugtes Markup. */
export const icon = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;

/* ------------------------------------------------------------------
   Emoji für die Speisekarte

   Auf einer Restaurantkarte wirkt das Gericht selbst wärmer als eine
   abstrakte Strichzeichnung. Die Schlüssel entsprechen den `icon`-Feldern
   aus data/menu.json, damit beide Darstellungen austauschbar bleiben.
   ------------------------------------------------------------------ */
const EMOJI = {
  sun: '🍱',
  bowl: '🥟',
  soup: '🍜',
  leaf: '🥗',
  sushi: '🍣',
  wok: '🥘',
  chili: '🌶️',
  noodles: '🍚',
  pot: '🫕',
  glass: '🥤',
  sprout: '🌱',
  star: '⭐',
  flame: '🌶️',
};

/**
 * Emoji als dekoratives Element.
 *
 * `aria-hidden`, weil direkt daneben immer der Name der Kategorie steht –
 * sonst läse ein Screenreader „Sushi Sushi“ vor.
 */
export const emoji = (name) => {
  const char = EMOJI[name];
  return char ? `<span class="emoji" aria-hidden="true">${char}</span>` : '';
};
