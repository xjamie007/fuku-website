#!/usr/bin/env node
/**
 * Prüft, ob alle Sprachen denselben Schlüsselsatz haben und ob jeder im
 * HTML verwendete Schlüssel auch übersetzt ist.
 *
 *   node tools/check-i18n.mjs
 */

import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// i18n.js exportiert das Wörterbuch nicht – wir lesen es über t() aus,
// indem wir jede Sprache setzen und alle bekannten Schlüssel abfragen.
const i18nSource = await readFile(resolve(ROOT, 'assets/js/i18n.js'), 'utf8');

/** Schlüssel je Sprachblock aus dem Quelltext ziehen. */
function keysPerLanguage(src) {
  const result = {};
  const langBlock = /^  (de|fr|en|nl): \{$/gm;
  let match;
  const starts = [];
  while ((match = langBlock.exec(src))) starts.push({ lang: match[1], index: match.index });

  starts.forEach((start, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].index : src.length;
    const block = src.slice(start.index, end);
    const keys = new Set();
    for (const m of block.matchAll(/^\s{4}'([^']+)':/gm)) keys.add(m[1]);
    result[start.lang] = keys;
  });

  return result;
}

const perLang = keysPerLanguage(i18nSource);
const langs = Object.keys(perLang);
let problems = 0;

if (langs.length !== 4) {
  console.error(`✗ Es wurden ${langs.length} Sprachblöcke gefunden, erwartet: 4`);
  problems += 1;
}

// 1. Vollständigkeit über alle Sprachen
const all = new Set(langs.flatMap((l) => [...perLang[l]]));
for (const lang of langs) {
  const missing = [...all].filter((k) => !perLang[lang].has(k));
  if (missing.length) {
    console.error(`✗ ${lang}: ${missing.length} fehlende Schlüssel → ${missing.join(', ')}`);
    problems += 1;
  }
}

// 2. Im HTML verwendete Schlüssel müssen existieren
const files = (await readdir(ROOT)).filter((f) => f.endsWith('.html'));
const used = new Set();
for (const file of files) {
  const html = await readFile(resolve(ROOT, file), 'utf8');
  for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) used.add(m[1]);
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(',')) used.add(pair.split(':')[1]?.trim());
  }
}

const unknown = [...used].filter((k) => k && !all.has(k));
if (unknown.length) {
  console.error(`✗ Im HTML verwendet, aber nicht übersetzt: ${unknown.join(', ')}`);
  problems += 1;
}

// 3. Im JavaScript verwendete Schlüssel
const jsFiles = (await readdir(resolve(ROOT, 'assets/js'))).filter((f) => f.endsWith('.js'));
const usedInJs = new Set();
for (const file of jsFiles) {
  const js = await readFile(resolve(ROOT, 'assets/js', file), 'utf8');
  for (const m of js.matchAll(/\bt\(\s*'([a-z][\w.]+)'/gi)) usedInJs.add(m[1]);
}

const unknownJs = [...usedInJs].filter((k) => !all.has(k) && !k.startsWith('days.') && !k.startsWith('meta.'));
if (unknownJs.length) {
  console.error(`✗ In JS verwendet, aber nicht übersetzt: ${unknownJs.join(', ')}`);
  problems += 1;
}

if (problems) {
  process.exit(1);
}

console.log(`✓ ${all.size} Schlüssel in ${langs.length} Sprachen vollständig`);
console.log(`  ${used.size} im HTML, ${usedInJs.size} im JavaScript verwendet – alle vorhanden`);
