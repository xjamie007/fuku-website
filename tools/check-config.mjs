#!/usr/bin/env node
/**
 * Vergleicht die Reservierungsregeln im Browser (assets/js/app.js) mit denen
 * auf dem Server (reservierung.php).
 *
 * Beide Seiten prüfen jede Anfrage unabhängig voneinander. Laufen die Werte
 * auseinander, bietet das Formular Zeiten an, die der Server anschliessend
 * ablehnt – ein Fehler, den man sonst erst im Betrieb bemerkt.
 *
 *   node tools/check-config.mjs
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const js = await readFile(resolve(ROOT, 'assets/js/app.js'), 'utf8');
const php = await readFile(resolve(ROOT, 'reservierung.php'), 'utf8');

const probleme = [];

/* ------------------------------------------------------------------
   Öffnungszeiten
   ------------------------------------------------------------------ */

/** Liest `hours: { 0: [[630, 870], …], … }` aus dem JavaScript. */
function hoursAusJs(src) {
  const block = src.match(/hours:\s*\{([\s\S]*?)\n {2}\},/);
  if (!block) throw new Error('RESTAURANT.hours nicht gefunden in app.js');
  return tageAusText(block[1]);
}

/** Liest den PHP-Konstantenblock OEFFNUNGSZEITEN. */
function hoursAusPhp(src) {
  const block = src.match(/const OEFFNUNGSZEITEN = \[([\s\S]*?)\n\];/);
  if (!block) throw new Error('OEFFNUNGSZEITEN nicht gefunden in reservierung.php');
  return tageAusText(block[1]);
}

/** Beide Sprachen schreiben die Zeiten gleich – ein Parser genügt. */
function tageAusText(text) {
  const tage = {};
  // Zeilen der Form  "0 => [[630, 870], [1050, 1380]],"  bzw.  "0: [[…]],"
  for (const zeile of text.split('\n')) {
    const m = zeile.match(/^\s*(\d)\s*(?:=>|:)\s*\[(.*)\],?\s*$/);
    if (!m) continue;
    const paare = [...m[2].matchAll(/\[\s*(\d+)\s*,\s*(\d+)\s*\]/g)].map((p) => [Number(p[1]), Number(p[2])]);
    tage[m[1]] = paare;
  }
  return tage;
}

const jsHours = hoursAusJs(js);
const phpHours = hoursAusPhp(php);

for (let tag = 0; tag < 7; tag += 1) {
  const a = JSON.stringify(jsHours[tag] ?? null);
  const b = JSON.stringify(phpHours[tag] ?? null);
  if (a !== b) probleme.push(`Öffnungszeiten Tag ${tag}: app.js ${a} ≠ reservierung.php ${b}`);
}

/* ------------------------------------------------------------------
   Reservierungsregeln
   ------------------------------------------------------------------ */

const zuordnung = [
  ['slotMinutes', 'RASTER_MINUTEN'],
  ['bufferBeforeClose', 'PUFFER_VOR_SCHLUSS'],
  ['minLeadMinutes', 'VORLAUF_MINUTEN'],
  ['maxAdvanceDays', 'MAX_TAGE_IM_VORAUS'],
  ['maxGuests', 'MAX_PERSONEN'],
];

for (const [jsName, phpName] of zuordnung) {
  const jsWert = js.match(new RegExp(`${jsName}:\\s*(\\d+)`))?.[1];
  const phpWert = php.match(new RegExp(`const ${phpName}\\s*=\\s*(\\d+)`))?.[1];

  if (jsWert === undefined) probleme.push(`${jsName} fehlt in app.js`);
  else if (phpWert === undefined) probleme.push(`${phpName} fehlt in reservierung.php`);
  else if (jsWert !== phpWert) probleme.push(`${jsName}: app.js ${jsWert} ≠ reservierung.php ${phpWert} (${phpName})`);
}

/* ------------------------------------------------------------------
   Zeitzone und Empfängeradresse
   ------------------------------------------------------------------ */

const jsZone = js.match(/timeZone:\s*'([^']+)'/)?.[1];
const phpZone = php.match(/const ZEITZONE\s*=\s*'([^']+)'/)?.[1];
if (jsZone !== phpZone) probleme.push(`Zeitzone: app.js ${jsZone} ≠ reservierung.php ${phpZone}`);

const jsMail = js.match(/email:\s*'([^']+)'/)?.[1];
const phpMail = php.match(/const EMPFAENGER\s*=\s*'([^']+)'/)?.[1];
if (jsMail !== phpMail) {
  probleme.push(`Empfängeradresse: app.js ${jsMail} ≠ reservierung.php ${phpMail}`);
}

/* ------------------------------------------------------------------ */

if (probleme.length) {
  probleme.forEach((p) => console.error(`✗ ${p}`));
  process.exit(1);
}

console.log('✓ Öffnungszeiten und Reservierungsregeln stimmen in app.js und reservierung.php überein');
