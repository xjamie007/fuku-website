/* ==================================================================
   Tischreservierung – Formularlogik

   Datum und Uhrzeit werden aus den Öffnungszeiten erzeugt, damit gar
   nicht erst ein Zeitpunkt gewählt werden kann, an dem geschlossen ist.
   Der Server prüft dieselben Regeln noch einmal (reservierung.php) –
   hier geht es um Bedienkomfort, nicht um Absicherung.
   ================================================================== */

import { boot, RESTAURANT, RESERVATION, formatTime, localNow } from './app.js';
import { t, getLang, getLocale, onLangChange, apply } from './i18n.js';
import { icon } from './icons.js';

boot();

const geladenSeit = Date.now();

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* Das Formular wird am Ende der Datei verdrahtet – vorher sind die
   Hilfsfunktionen als const noch nicht initialisiert. */
const form = $('[data-reserve-form]');

/* ------------------------------------------------------------------
   Datum und Uhrzeiten aus den Öffnungszeiten ableiten
   ------------------------------------------------------------------ */

/** Heutiges Datum im Restaurant als 'YYYY-MM-DD'. */
function heute() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: RESTAURANT.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Wandelt 'YYYY-MM-DD' in ein Date um, das auf 12:00 UTC steht.
 * Die Mittagszeit vermeidet Verschiebungen um einen Tag bei Sommerzeit.
 */
function alsDatum(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

const alsIso = (datum) => datum.toISOString().slice(0, 10);

/** Alle wählbaren Uhrzeiten eines Tages, nach Mittag und Abend getrennt. */
function zeitfenster(iso) {
  const wochentag = alsDatum(iso).getUTCDay();
  const jetzt = localNow();
  const istHeute = iso === heute();
  const frueheste = istHeute ? jetzt.minutes + RESERVATION.minLeadMinutes : -1;

  return (RESTAURANT.hours[wochentag] || []).map(([von, bis], index) => {
    const zeiten = [];
    const letzte = bis - RESERVATION.bufferBeforeClose;

    for (let m = von; m <= letzte; m += RESERVATION.slotMinutes) {
      if (m > frueheste) zeiten.push(m);
    }

    return { label: index === 0 ? t('reserve.lunch') : t('reserve.dinner'), zeiten };
  });
}

/** Die nächsten Tage, an denen überhaupt noch etwas frei ist. */
function verfuegbareTage() {
  const start = alsDatum(heute());
  const tage = [];

  for (let i = 0; i <= RESERVATION.maxAdvanceDays; i += 1) {
    const tag = new Date(start);
    tag.setUTCDate(tag.getUTCDate() + i);
    const iso = alsIso(tag);

    // Ruhetage und Tage ohne freie Zeit überspringen.
    if (!(RESTAURANT.hours[tag.getUTCDay()] || []).length) continue;
    if (!zeitfenster(iso).some((f) => f.zeiten.length)) continue;

    tage.push(iso);
  }

  return tage;
}

function datumBeschriften(iso) {
  const datum = alsDatum(iso);
  const istHeute = iso === heute();

  // Für heute reicht Tag und Monat – mit Wochentag und Präfix würde die
  // Beschriftung im schmalen Auswahlfeld abgeschnitten.
  const text = new Intl.DateTimeFormat(getLocale(), {
    weekday: istHeute ? undefined : 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(datum);

  return istHeute ? `${t('status.today')} · ${text}` : text;
}

/* ------------------------------------------------------------------
   Auswahlfelder füllen
   ------------------------------------------------------------------ */

function fuelleDatum() {
  const feld = $('#res-date');
  const bisher = feld.value;
  const tage = verfuegbareTage();

  feld.innerHTML = tage.map((iso) => `<option value="${iso}">${datumBeschriften(iso)}</option>`).join('');
  feld.value = tage.includes(bisher) ? bisher : tage[0] || '';
}

function fuelleZeit() {
  const feld = $('#res-time');
  const bisher = feld.value;
  const fenster = zeitfenster($('#res-date').value).filter((f) => f.zeiten.length);

  if (!fenster.length) {
    feld.innerHTML = `<option value="">${t('reserve.noSlots')}</option>`;
    feld.disabled = true;
    return;
  }

  feld.disabled = false;
  feld.innerHTML =
    `<option value="">${t('reserve.pickTime')}</option>` +
    fenster
      .map(
        (f) =>
          `<optgroup label="${f.label}">${f.zeiten
            .map((m) => `<option value="${formatTime(m)}">${formatTime(m)}</option>`)
            .join('')}</optgroup>`,
      )
      .join('');

  // Vorherige Wahl beibehalten, falls sie am neuen Tag noch existiert.
  if (bisher && $$(`#res-time option`).some((o) => o.value === bisher)) feld.value = bisher;
}

function fuellePersonen() {
  const feld = $('#res-guests');
  const bisher = feld.value;
  const max = RESERVATION.maxGuests;

  const optionen = [];
  for (let n = 1; n <= max; n += 1) {
    optionen.push(`<option value="${n}">${n === 1 ? t('reserve.person', { n }) : t('reserve.persons', { n })}</option>`);
  }
  optionen.push(`<option value="more">${t('reserve.moreGuests', { n: max })}</option>`);

  feld.innerHTML = optionen.join('');
  feld.value = bisher || '2';
}

function fuelleAlles() {
  fuelleDatum();
  fuelleZeit();
  fuellePersonen();
}

/* ------------------------------------------------------------------
   Fehlerausgabe an den Feldern
   ------------------------------------------------------------------ */

function setzeFeldfehler(name, meldung) {
  const feld = $(`[name="${name}"]`);
  const hinweis = $(`[data-error-for="${name}"]`);
  if (!feld) return;

  feld.setAttribute('aria-invalid', meldung ? 'true' : 'false');
  feld.closest('.field')?.classList.toggle('field--error', Boolean(meldung));
  if (hinweis) hinweis.textContent = meldung || '';
}

const alleFehlerLoeschen = () =>
  ['name', 'email', 'phone', 'date', 'time', 'guests'].forEach((n) => setzeFeldfehler(n, ''));

function zeigeStatus(art, titel, text, extra = '') {
  const box = $('[data-reserve-status]');
  box.dataset.state = art;
  box.innerHTML = `
    <div class="notice notice--${art}">
      ${icon(art === 'ok' ? 'check' : 'close')}
      <div>
        <strong>${titel}</strong>
        <p>${text}</p>
        ${extra}
      </div>
    </div>`;
  box.hidden = false;
}

/* ------------------------------------------------------------------
   Absenden
   ------------------------------------------------------------------ */

/** Vorbereitete E-Mail als Rückfallebene, falls der Server nicht antwortet. */
function alsMailto(daten) {
  const zeilen = [
    `${t('reserve.date')}: ${datumBeschriften(daten.date)}`,
    `${t('reserve.time')}: ${daten.time}`,
    `${t('reserve.guests')}: ${daten.guests}`,
    '',
    `${t('reserve.name')}: ${daten.name}`,
    `${t('reserve.email')}: ${daten.email}`,
    `${t('reserve.phone')}: ${daten.phone}`,
    daten.notes ? `\n${t('reserve.notes')}: ${daten.notes}` : '',
  ].join('\n');

  const betreff = `${t('reserve.title')} – ${daten.date} ${daten.time}`;
  return `mailto:${RESTAURANT.email}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(zeilen)}`;
}

const FEHLERTEXTE = {
  closed: 'reserve.errorClosed',
  too_soon: 'reserve.errorTooSoon',
  too_far: 'reserve.errorGeneric',
  invalid_slot: 'reserve.errorClosed',
  rate_limited: 'reserve.errorRate',
  invalid_fields: 'reserve.errorFields',
};

async function absenden(event) {
  event.preventDefault();
  alleFehlerLoeschen();

  const daten = {
    name: $('#res-name').value.trim(),
    email: $('#res-email').value.trim(),
    phone: $('#res-phone').value.trim(),
    date: $('#res-date').value,
    time: $('#res-time').value,
    guests: Number($('#res-guests').value),
    notes: $('#res-notes').value.trim(),
    lang: getLang(),
    website: $('#res-website').value, // Honigtopf – muss leer bleiben
    elapsed: Math.round((Date.now() - geladenSeit) / 1000),
  };

  /* Prüfung im Browser: schnelle Rückmeldung ohne Serverweg. */
  let ersterFehler = null;
  const pruefe = (feld, ok, schluessel) => {
    if (ok) return;
    setzeFeldfehler(feld, t(schluessel));
    ersterFehler = ersterFehler || feld;
  };

  // Reihenfolge wie im Formular, damit der Fokus zum obersten Fehler springt.
  pruefe('date', Boolean(daten.date), 'reserve.required');
  pruefe('time', Boolean(daten.time), 'reserve.required');
  pruefe('guests', Number.isFinite(daten.guests) && daten.guests >= 1, 'reserve.required');
  pruefe('name', daten.name.length >= 2, 'reserve.required');
  pruefe('email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(daten.email), 'reserve.errorEmail');
  pruefe('phone', /^[+()/.\s\d-]{6,}$/.test(daten.phone), 'reserve.errorPhone');

  if (ersterFehler) {
    $(`[name="${ersterFehler}"]`)?.focus();
    return;
  }

  const knopf = $('[data-reserve-submit]');
  const beschriftung = $('span', knopf);
  const original = beschriftung.textContent;
  knopf.dataset.busy = 'true';
  knopf.disabled = true;
  beschriftung.textContent = t('reserve.submitting');
  $('[data-reserve-status]').hidden = true;

  try {
    const antwort = await fetch(RESERVATION.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(daten),
    });

    const ergebnis = await antwort.json().catch(() => ({}));

    if (antwort.ok && ergebnis.ok) {
      zeigeErfolg(daten, ergebnis.reference);
      return;
    }

    // Vom Server gemeldete Feldfehler direkt am Feld anzeigen.
    if (Array.isArray(ergebnis.fields)) {
      ergebnis.fields.forEach((feld) => setzeFeldfehler(feld, t('reserve.required')));
    }

    const schluessel = FEHLERTEXTE[ergebnis.error] || 'reserve.errorGeneric';
    zeigeStatus(
      'error',
      t('reserve.errorTitle'),
      t(schluessel),
      `<a class="notice__link" href="${alsMailto(daten)}">${t('reserve.fallback')}</a>`,
    );
  } catch (err) {
    console.error('Reservierung:', err);
    zeigeStatus(
      'error',
      t('reserve.errorTitle'),
      t('reserve.errorGeneric'),
      `<a class="notice__link" href="${alsMailto(daten)}">${t('reserve.fallback')}</a>`,
    );
  } finally {
    knopf.dataset.busy = 'false';
    knopf.disabled = false;
    beschriftung.textContent = original;
  }
}

function zeigeErfolg(daten, referenz) {
  const zusammenfassung = `${datumBeschriften(daten.date)} · ${daten.time} · ${
    daten.guests === 1 ? t('reserve.person', { n: 1 }) : t('reserve.persons', { n: daten.guests })
  }`;

  $('[data-reserve-panel]').innerHTML = `
    <div class="reserve-done">
      <span class="reserve-done__mark">${icon('check')}</span>
      <h2>${t('reserve.successTitle')}</h2>
      <p class="reserve-done__summary">${zusammenfassung}</p>
      <p>${t('reserve.successText')}</p>
      ${referenz ? `<p class="reserve-done__ref">${t('reserve.successRef')}: <strong>${referenz}</strong></p>` : ''}
      <div class="reserve-done__actions">
        <a class="btn btn--brand" href="bestellen.html">${t('nav.order')}</a>
        <button class="btn btn--ghost" type="button" onclick="location.reload()">${t('reserve.again')}</button>
      </div>
    </div>`;

  $('[data-reserve-panel]').scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* ------------------------------------------------------------------
   Verdrahtung
   ------------------------------------------------------------------ */

function pruefeGruppengroesse() {
  const grosseGruppe = $('#res-guests').value === 'more';
  $('[data-large-group]').hidden = !grosseGruppe;
  $('[data-reserve-submit]').disabled = grosseGruppe;
}

function wire() {
  fuelleAlles();
  pruefeGruppengroesse();

  $('#res-date').addEventListener('change', fuelleZeit);
  $('#res-guests').addEventListener('change', pruefeGruppengroesse);
  form.addEventListener('submit', absenden);

  // Fehlerhinweis verschwindet, sobald das Feld angefasst wird.
  $$('#res-name, #res-email, #res-phone').forEach((feld) => {
    feld.addEventListener('input', () => setzeFeldfehler(feld.name, ''));
  });

  onLangChange(() => {
    fuelleAlles();
    pruefeGruppengroesse();
    apply();
  });
}

/* ------------------------------------------------------------------
   Start
   ------------------------------------------------------------------ */
if (form) {
  const jahr = $('[data-year]');
  if (jahr) jahr.textContent = String(new Date().getFullYear());

  wire();
}
