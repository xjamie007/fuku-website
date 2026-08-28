#!/usr/bin/env node
/**
 * Synchronisiert die Speisekarte aus der WooCommerce Store API von fuku.lu
 * und schreibt eine aufgeräumte, gruppierte data/menu.json.
 *
 *   node tools/sync-menu.mjs
 *
 * Die Website liest ausschliesslich data/menu.json. WooCommerce bleibt damit
 * die einzige Pflegestelle fuer Gerichte und Preise – nach jeder Aenderung im
 * WordPress-Backend dieses Skript erneut laufen lassen.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://fuku.lu/wp-json/wc/store/v1';

/* ------------------------------------------------------------------ *
 * Kategoriebaum – bestimmt Reihenfolge und Beschriftung im Frontend.
 * `slugs` verweist auf die WooCommerce-Kategorie-Slugs.
 *
 * `claim` steuert, welche Sektion ein Gericht zuerst beansprucht. Viele
 * Gerichte hängen in mehreren WooCommerce-Kategorien ("90.Riz sauté au
 * poulet" liegt in `poulet` UND `riz-nouilles-et-udon"). Niedrigere
 * claim-Werte greifen zuerst; die Anzeigereihenfolge bleibt davon
 * unberührt und folgt der Reihenfolge dieses Arrays.
 * ------------------------------------------------------------------ */
const SECTIONS = [
  {
    id: 'midi',
    claim: 1,
    icon: 'sun',
    label: { fr: 'Menu Midi', de: 'Mittagsmenü', en: 'Lunch Menu', nl: 'Lunchmenu' },
    groups: [{ slugs: ['menu-midi'] }],
  },
  {
    id: 'entrees',
    claim: 2,
    icon: 'bowl',
    label: { fr: 'Entrées', de: 'Vorspeisen', en: 'Starters', nl: 'Voorgerechten' },
    groups: [
      { slugs: ['entree'], label: { fr: 'Entrées', de: 'Vorspeisen', en: 'Starters', nl: 'Voorgerechten' } },
      {
        slugs: ['entree-a-la-vapeur'],
        label: { fr: 'À la vapeur', de: 'Gedämpft', en: 'Steamed', nl: 'Gestoomd' },
      },
    ],
  },
  {
    id: 'soupes',
    claim: 2,
    icon: 'soup',
    label: { fr: 'Soupes', de: 'Suppen', en: 'Soups', nl: 'Soepen' },
    groups: [{ slugs: ['soupe'] }],
  },
  {
    id: 'salades',
    claim: 2,
    icon: 'leaf',
    label: { fr: 'Salades', de: 'Salate', en: 'Salads', nl: 'Salades' },
    groups: [{ slugs: ['salade'] }],
  },
  {
    id: 'sushi',
    claim: 2,
    icon: 'sushi',
    label: { fr: 'Sushi', de: 'Sushi', en: 'Sushi', nl: 'Sushi' },
    groups: [
      { slugs: ['plateaux'], label: { fr: 'Plateaux', de: 'Sushi-Platten', en: 'Platters', nl: 'Schotels' } },
      { slugs: ['nigiri'], label: { fr: 'Nigiri', de: 'Nigiri', en: 'Nigiri', nl: 'Nigiri' } },
      { slugs: ['sashimi'], label: { fr: 'Sashimi', de: 'Sashimi', en: 'Sashimi', nl: 'Sashimi' } },
      { slugs: ['tataki'], label: { fr: 'Tataki', de: 'Tataki', en: 'Tataki', nl: 'Tataki' } },
      { slugs: ['tartare'], label: { fr: 'Tartare', de: 'Tatar', en: 'Tartare', nl: 'Tartaar' } },
      { slugs: ['chirashi'], label: { fr: 'Chirashi', de: 'Chirashi', en: 'Chirashi', nl: 'Chirashi' } },
      { slugs: ['maki-rolls'], label: { fr: 'Maki rolls', de: 'Maki Rolls', en: 'Maki rolls', nl: 'Maki rolls' } },
      {
        slugs: ['california-rolls'],
        label: { fr: 'California rolls', de: 'California Rolls', en: 'California rolls', nl: 'California rolls' },
      },
      { slugs: ['spring-rolls'], label: { fr: 'Spring rolls', de: 'Spring Rolls', en: 'Spring rolls', nl: 'Spring rolls' } },
      { slugs: ['soya-rolls'], label: { fr: 'Soya rolls', de: 'Soya Rolls', en: 'Soya rolls', nl: 'Soya rolls' } },
      { slugs: ['saumon-roll'], label: { fr: 'Saumon rolls', de: 'Lachs Rolls', en: 'Salmon rolls', nl: 'Zalm rolls' } },
      { slugs: ['big-rolls'], label: { fr: 'Big rolls', de: 'Big Rolls', en: 'Big rolls', nl: 'Big rolls' } },
      { slugs: ['hot-rolls'], label: { fr: 'Hot rolls', de: 'Hot Rolls', en: 'Hot rolls', nl: 'Hot rolls' } },
      { slugs: ['uramaki-rolls'], label: { fr: 'Uramaki', de: 'Uramaki', en: 'Uramaki', nl: 'Uramaki' } },
      { slugs: ['temaki'], label: { fr: 'Temaki', de: 'Temaki', en: 'Temaki', nl: 'Temaki' } },
      { slugs: ['special-rolls'], label: { fr: 'Spécial rolls', de: 'Special Rolls', en: 'Special rolls', nl: 'Special rolls' } },
    ],
  },
  {
    id: 'chauds',
    claim: 5,
    icon: 'wok',
    label: { fr: 'Plats chinois', de: 'Warme Gerichte', en: 'Wok Dishes', nl: 'Wokgerechten' },
    groups: [
      { slugs: ['poulet'], label: { fr: 'Poulet', de: 'Hähnchen', en: 'Chicken', nl: 'Kip' } },
      { slugs: ['boeuf'], label: { fr: 'Bœuf', de: 'Rind', en: 'Beef', nl: 'Rund' } },
      { slugs: ['canard'], label: { fr: 'Canard', de: 'Ente', en: 'Duck', nl: 'Eend' } },
      { slugs: ['scampis'], label: { fr: 'Scampis', de: 'Scampi', en: 'Prawns', nl: 'Scampi' } },
      { slugs: ['poisson'], label: { fr: 'Poisson', de: 'Fisch', en: 'Fish', nl: 'Vis' } },
      {
        slugs: ['vegetarien'],
        label: { fr: 'Légumes & tofu', de: 'Gemüse & Tofu', en: 'Vegetables & tofu', nl: 'Groenten & tofu' },
      },
    ],
  },
  {
    id: 'thai',
    claim: 3,
    icon: 'chili',
    label: { fr: 'Plats thaïlandais', de: 'Thai-Gerichte', en: 'Thai Dishes', nl: 'Thaise gerechten' },
    groups: [{ slugs: ['plats-thailandais'] }],
  },
  {
    id: 'riz',
    claim: 4,
    icon: 'noodles',
    label: { fr: 'Riz & nouilles', de: 'Reis & Nudeln', en: 'Rice & Noodles', nl: 'Rijst & noedels' },
    groups: [
      {
        slugs: ['riz-nouilles-et-udon'],
        label: { fr: 'Riz, nouilles & udon', de: 'Reis, Nudeln & Udon', en: 'Rice, noodles & udon', nl: 'Rijst, noedels & udon' },
      },
      { slugs: ['vermicelles'], label: { fr: 'Vermicelles', de: 'Glasnudeln', en: 'Vermicelli', nl: 'Vermicelli' } },
    ],
  },
  {
    id: 'fondue',
    claim: 6,
    icon: 'pot',
    label: { fr: 'Fondue', de: 'Fondue', en: 'Fondue', nl: 'Fondue' },
    groups: [{ slugs: ['fondu-chinois'] }],
  },
  {
    id: 'boissons',
    claim: 6,
    icon: 'glass',
    label: { fr: 'Boissons', de: 'Getränke', en: 'Drinks', nl: 'Dranken' },
    groups: [
      { slugs: ['boissons'], label: { fr: 'Softs', de: 'Alkoholfrei', en: 'Soft drinks', nl: 'Frisdrank' } },
      { slugs: ['bierres', 'alcohol'], label: { fr: 'Bières', de: 'Biere', en: 'Beers', nl: 'Bieren' } },
    ],
  },
];

/* Reihenfolge, in der ein Gericht seiner Sektion zugeordnet wird.
   Ein Gericht taucht genau einmal auf – in der ersten passenden Gruppe. */

/* ------------------------------------------------------------------ *
 * Textbereinigung
 * ------------------------------------------------------------------ */

// Häufige Tippfehler aus dem WooCommerce-Katalog.
const TYPOS = [
  [/chesse/gi, 'cheese'],
  [/\bsautees\b/gi, 'sautées'],
  [/\bsaute\b/gi, 'sauté'],
  [/\bcaramalis/gi, 'caramélis'],
  [/\bcaramalise\b/gi, 'caramélisé'],
  [/\bpaulet\b/gi, 'poulet'],
  [/\bpoulrt\b/gi, 'poulet'],
  [/\bcrabes?\b/gi, 'crabe'],
  [/\bcarbes?\b/gi, 'crabe'],
  [/\bthan\b/gi, 'thon'],
  [/\bnigri\b/gi, 'Nigiri'],
  [/\bdprade\b/gi, 'dorade'],
  [/\bgrenouiles\b/gi, 'grenouilles'],
  [/\bgrenouiles?\b/gi, 'grenouilles'],
  [/\bpiquand\b/gi, 'piquant'],
  [/\bsplcy\b/gi, 'spicy'],
  [/\bteamaki\b/gi, 'Temaki'],
  [/\brolle\b/gi, 'roll'],
  [/\bmunu\b/gi, 'Menu'],
  [/\bvege\b/gi, 'Végé'],
  [/´/g, '’'],
  [/`/g, '’'],
  [/'/g, '’'],
  [/\bBoeuf\b/g, 'Bœuf'],
  [/\bboeuf\b/g, 'bœuf'],
];

// Einzelne Gerichte, deren Namen im Katalog zu stark verstümmelt sind.
const NAME_OVERRIDES = {
  7580: 'Vermicelle sautées spécial',
  7575: 'Aubergines caramélisées, sauce aigre-douce',
  7577: 'Vermicelle sauté aux légumes',
  7576: 'Vermicelle sauté aux légumes, sauce coréenne',
  7568: 'Poulet, sauce coréenne',
  3010: 'Poulet caramélisé, sauce aigre-douce',
  66: 'Calamars à l’ail et poivre',
};

// Allergencodes, die im Katalog zusammengeschrieben wurden.
const ALLERGEN_OVERRIDES = {
  1054: ['1A', '2', '3', '11'], // stand als "1A,2,311" im Katalog
};

// Gerichte, die auf der bisherigen Startseite als Empfehlung liefen.
const POPULAR_CODES = new Set(['H2', '23', '45', '48', 'P3', 'SP7', 'CH3', '2']);

// Heuristik für die Schärfe-Kennzeichnung anhand des Gerichtnamens.
const SPICY_RE = /piquant|spicy|sichuan|épicé|epice|curry rouge|kung pao|basilic thä?i/i;

const stripTags = (s = '') =>
  s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&eacute;/g, 'é')
    .replace(/&quot;/g, '"');

const fixTypos = (s) => TYPOS.reduce((acc, [re, to]) => acc.replace(re, to), s);

const tidy = (s) => fixTypos(stripTags(s)).replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();

/** Zerlegt "1,4,11" oder "311" in gültige Allergencodes 1–14. */
function splitAllergenToken(token) {
  const t = token.toUpperCase().trim();
  if (!t) return [];
  if (/^\d{1,2}[A-C]?$/.test(t) && +t.replace(/[A-C]/, '') <= 14) return [t];
  // Zusammengeschriebene Ziffern greedy in gültige Zahlen zerlegen.
  const out = [];
  let i = 0;
  while (i < t.length) {
    const two = t.slice(i, i + 2);
    if (/^\d\d$/.test(two) && +two >= 10 && +two <= 14) {
      out.push(two);
      i += 2;
    } else if (/^\d$/.test(t[i])) {
      out.push(t[i]);
      i += 1;
    } else {
      i += 1;
    }
  }
  return out;
}

/** Trennt Allergenangaben vom restlichen Beschreibungstext. */
function parseDescription(raw, id) {
  const text = tidy(raw);
  const allergens = new Set();
  const kept = [];

  for (const line of text.split('\n')) {
    const m = line.match(/^\s*(?:a?llerg\w*|allergie)\s*[:\s]\s*(.+)$/i);
    if (m) {
      m[1]
        .split(/[,.;\s]+/)
        .filter(Boolean)
        .forEach((tok) => splitAllergenToken(tok).forEach((c) => allergens.add(c)));
      continue;
    }
    // Zeilen, die nur aus Codes bestehen (z. B. "1A").
    if (/^\s*\d{1,2}[A-C]?(\s*[,.]\s*\d{1,2}[A-C]?)*\s*$/i.test(line)) {
      line
        .split(/[,.;\s]+/)
        .filter(Boolean)
        .forEach((tok) => splitAllergenToken(tok).forEach((c) => allergens.add(c)));
      continue;
    }
    if (line.trim()) kept.push(line.trim());
  }

  const list = ALLERGEN_OVERRIDES[id] ?? [...allergens];
  list.sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b));
  return { description: kept.join('\n'), allergens: list };
}

/** Zieht die Artikelnummer ("H2", "108", "40A") aus dem Produktnamen. */
function parseName(rawName) {
  const name = tidy(rawName);
  const m = name.match(/^([A-Z]{1,3}\s?\d{1,3}[A-Z]?|\d{1,3}[A-Z]?)\s*[.·:]\s*(.+)$/);
  if (m) return { code: m[1].replace(/\s+/g, '').toUpperCase(), title: m[2].trim() };

  // "PLATEAU 5 24 pièces" → Code PLATEAU 5
  const plate = name.match(/^PLATEAU\s*(\d+)\s*(.*)$/i);
  if (plate) return { code: `P${plate[1]}`, title: `Plateau ${plate[1]}${plate[2] ? ` · ${plate[2].trim()}` : ''}` };

  return { code: '', title: name };
}

/** Entfernt den Gruppennamen, wenn er im Gerichtnamen wiederholt wird. */
const REDUNDANT_PREFIX = [
  /^(hot\s*rolls?)\s+/i,
  /^(big\s*rolls?)\s+/i,
  /^(spring\s*rolls?)\s+/i,
  /^(soya\s*rolls?)\s+/i,
  /^(maki\s*rolls?)\s+/i,
  /^(special\s*rolls?|spécial\s*rolls?)\s+/i,
  /^(uramaki)\s+/i,
  /^(temaki)\s+/i,
  /^(nigiri)\s+/i,
  /^(sashimi)\s+/i,
  /^(tataki)\s+/i,
  /^(tartare)\s+/i,
  /^(chirashi)\s+/i,
  /^(california)\s+/i,
  /^(saumon\s*roll)\s+/i,
];

function shortTitle(title) {
  for (const re of REDUNDANT_PREFIX) {
    const next = title.replace(re, '');
    if (next !== title && next.trim().length > 2) {
      return next.charAt(0).toUpperCase() + next.slice(1);
    }
  }
  return title;
}

/* ------------------------------------------------------------------ *
 * Abruf
 * ------------------------------------------------------------------ */
async function fetchAll() {
  const items = [];
  for (let page = 1; page <= 20; page += 1) {
    const res = await fetch(`${API}/products?per_page=100&page=${page}`);
    if (!res.ok) throw new Error(`Store API ${res.status} auf Seite ${page}`);
    const batch = await res.json();
    items.push(...batch);
    const totalPages = Number(res.headers.get('x-wp-totalpages') || 1);
    if (page >= totalPages) break;
  }
  return items;
}

/**
 * Variable Produkte (Mittagsmenüs, Fondue) brauchen beim Bestellen eine
 * konkrete Variante. Wir lösen jede Variante zu einer bestellbaren Option
 * mit eigener ID und eigenem Preis auf – die Store API akzeptiert die
 * Varianten-ID direkt, das ist deutlich robuster als das Zusammensetzen
 * von Attribut-Slugs.
 */
async function resolveVariants(product) {
  const detail = await (await fetch(`${API}/products/${product.id}`)).json();

  // Slug → Anzeigename je Attribut
  const termNames = new Map();
  for (const attr of detail.attributes || []) {
    for (const term of attr.terms || []) termNames.set(`${attr.name}|${term.slug}`, term.name);
  }

  const choices = [];
  for (const variation of detail.variations || []) {
    const parts = (variation.attributes || []).map((a) =>
      a.value ? termNames.get(`${a.name}|${a.value}`) || a.value.replace(/-/g, ' ') : null,
    );

    // Varianten ohne festgelegte Attributwerte weist WooCommerce beim
    // Bestellen ab – sie werden deshalb übersprungen.
    if (!parts.length || parts.some((p) => p === null)) continue;

    const info = await (await fetch(`${API}/products/${variation.id}`)).json();
    choices.push({
      id: variation.id,
      label: parts.join(' · '),
      price: info?.prices ? Number(info.prices.price) / 10 ** Number(info.prices.currency_minor_unit) : null,
    });
  }

  return choices;
}

async function main() {
  console.log('→ Lade Produkte von fuku.lu …');
  const raw = await fetchAll();
  console.log(`  ${raw.length} Produkte empfangen`);

  const variants = new Map();
  for (const product of raw.filter((p) => p.type === 'variable')) {
    const choices = await resolveVariants(product);
    variants.set(product.id, choices);
    const note = choices.length ? `${choices.length} Variante(n)` : '⚠︎ keine bestellbare Variante';
    console.log(`  variabel: ${product.name} → ${note}`);
  }

  const dishes = raw.map((p) => {
    const { code, title } = parseName(p.name);
    const { description, allergens } = parseDescription(p.short_description || p.description || '', p.id);
    const overridden = NAME_OVERRIDES[p.id];
    const fullTitle = overridden ? fixTypos(overridden) : title;
    const cats = (p.categories || []).map((c) => c.slug);
    const choices = variants.get(p.id) || null;
    return {
      id: p.id,
      code,
      name: fullTitle,
      short: shortTitle(fullTitle),
      price: Number(p.prices.price) / 10 ** Number(p.prices.currency_minor_unit),
      description,
      allergens,
      // Bei variablen Produkten wird die Varianten-ID bestellt, nicht die
      // Produkt-ID. Ohne verwertbare Variante ist das Gericht online nicht
      // bestellbar und wird nur informativ angezeigt.
      ...(choices ? { choices } : {}),
      orderable: p.type !== 'variable' || (choices?.length ?? 0) > 0,
      image: p.images?.[0]?.src || '',
      // 300×300-Zuschnitt aus der Mediathek – existiert zuverlässig und
      // spart in der Listenansicht deutlich Bandbreite.
      thumb: p.images?.[0]?.thumbnail || '',
      cats,
      veg: cats.includes('vegetarien'),
      spicy: SPICY_RE.test(fullTitle),
      popular: POPULAR_CODES.has(code),
      inStock: p.is_in_stock !== false,
      purchasable: p.is_purchasable !== false,
    };
  });

  // Gerichte den Sektionen zuordnen – jedes Gericht genau einmal.
  // Spezifische Sektionen (kleiner `claim`) greifen zuerst zu.
  const used = new Set();
  const claimed = new Map(); // section.id → group index → items
  const byClaim = [...SECTIONS].sort((a, b) => (a.claim ?? 9) - (b.claim ?? 9));

  for (const section of byClaim) {
    claimed.set(
      section.id,
      section.groups.map((group) => {
        const list = dishes
          .filter((d) => !used.has(d.id) && group.slugs.some((s) => d.cats.includes(s)))
          .sort(sortDishes);
        list.forEach((d) => used.add(d.id));
        return list;
      }),
    );
  }

  const sections = SECTIONS.map((section) => {
    const lists = claimed.get(section.id);
    const groups = section.groups
      .map((group, i) => ({ label: group.label || null, items: lists[i].map(({ cats, ...rest }) => rest) }))
      .filter((g) => g.items.length);
    const { claim, ...rest } = section;
    return { ...rest, groups };
  }).filter((s) => s.groups.length);

  const orphans = dishes.filter((d) => !used.has(d.id));
  if (orphans.length) {
    console.warn(`  ⚠︎ ${orphans.length} Gerichte ohne Sektion:`, orphans.map((o) => `${o.name} [${o.cats}]`));
    sections.push({
      id: 'autres',
      icon: 'bowl',
      label: { fr: 'Autres', de: 'Weitere', en: 'More', nl: 'Overige' },
      groups: [{ label: null, items: orphans.sort(sortDishes).map(({ cats, ...rest }) => rest) }],
    });
  }

  const count = sections.reduce((n, s) => n + s.groups.reduce((m, g) => m + g.items.length, 0), 0);
  const out = { generatedAt: new Date().toISOString(), currency: 'EUR', count, sections };

  await mkdir(resolve(ROOT, 'data'), { recursive: true });
  await writeFile(resolve(ROOT, 'data', 'menu.json'), `${JSON.stringify(out, null, 1)}\n`, 'utf8');
  console.log(`✓ data/menu.json geschrieben – ${count} Gerichte in ${sections.length} Sektionen`);
}

/** Sortiert nach numerischer Artikelnummer, Gerichte ohne Nummer zuletzt. */
function sortDishes(a, b) {
  const na = parseInt(a.code.replace(/\D/g, ''), 10);
  const nb = parseInt(b.code.replace(/\D/g, ''), 10);
  if (Number.isNaN(na) && Number.isNaN(nb)) return a.name.localeCompare(b.name, 'fr');
  if (Number.isNaN(na)) return 1;
  if (Number.isNaN(nb)) return -1;
  if (na !== nb) return na - nb;
  return a.code.localeCompare(b.code);
}

main().catch((err) => {
  console.error('✗ Sync fehlgeschlagen:', err.message);
  process.exit(1);
});
