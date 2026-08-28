/* ==================================================================
   Zugriff auf data/menu.json
   Die Datei wird von tools/sync-menu.mjs aus WooCommerce erzeugt.
   ================================================================== */

let cache = null;
let pending = null;

/** Lädt die Speisekarte (einmalig, danach aus dem Cache). */
export function loadMenu() {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;

  // 'no-cache' erzwingt eine Revalidierung: nach jedem sync-menu-Lauf ist
  // die neue Karte sofort da, unveränderte Dateien kosten nur ein 304.
  pending = fetch(new URL('../../data/menu.json', import.meta.url), { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`menu.json: HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      cache = data;
      pending = null;
      return data;
    })
    .catch((err) => {
      pending = null;
      throw err;
    });

  return pending;
}

/** Flache Liste aller Gerichte, inklusive Sektions- und Gruppenbezug. */
export function flatten(menu) {
  const out = [];
  for (const section of menu.sections) {
    for (const group of section.groups) {
      for (const item of group.items) {
        out.push({ ...item, sectionId: section.id, groupLabel: group.label });
      }
    }
  }
  return out;
}

/** Anzahl der Gerichte einer Sektion. */
export function countIn(menu, sectionId) {
  const section = menu.sections.find((s) => s.id === sectionId);
  if (!section) return 0;
  return section.groups.reduce((n, g) => n + g.items.length, 0);
}

/** Normalisiert Text für die Suche: Kleinbuchstaben, ohne Akzente. */
export const normalize = (text) =>
  String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
