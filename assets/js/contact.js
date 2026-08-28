/* ==================================================================
   Kontaktseite – Karte erst auf ausdrücklichen Wunsch nachladen
   ================================================================== */

import { boot, RESTAURANT } from './app.js';
import { t } from './i18n.js';

boot();

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

/*
 * Die OpenStreetMap-Einbettung stellt eine Verbindung zu einem fremden
 * Server her. Sie wird deshalb erst geladen, wenn die Besucherin oder der
 * Besucher aktiv darauf klickt – vorher verlässt keine Anfrage die Seite.
 */
const frame = document.querySelector('[data-map]');
const trigger = document.querySelector('[data-map-load]');

trigger?.addEventListener('click', () => {
  const { lat, lon } = RESTAURANT.coords;
  const d = 0.004;
  const bbox = [lon - d, lat - d / 2, lon + d, lat + d / 2].join('%2C');

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
  iframe.title = `${RESTAURANT.name}, ${RESTAURANT.street}, ${RESTAURANT.city}`;
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer';

  frame.replaceChildren(iframe);
});
