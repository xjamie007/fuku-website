/* ==================================================================
   Kontaktseite

   Die Karte ist ein Bild im Projekt (siehe tools/make-map.py) und braucht
   kein JavaScript mehr. Adresse, Öffnungszeiten und der Google-Maps-Link
   werden von boot() aus RESTAURANT gefüllt.
   ================================================================== */

import { boot } from './app.js';

boot();

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
