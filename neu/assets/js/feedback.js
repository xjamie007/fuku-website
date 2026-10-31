/* ==================================================================
   Anonymes Feedback (Kontaktseite)

   Drei Schritte: Essen 1–5, Service 1–5, freier Text. Ein Klick auf eine
   Zahl führt direkt zur nächsten Frage. Gesendet wird an feedback.php –
   ohne Namen, ohne E-Mail.
   ================================================================== */

import { t, onLangChange, getLang } from './i18n.js?v=20261031d';
import { icon } from './icons.js?v=20261031d';

const root = document.querySelector('[data-feedback]');
const panel = root?.querySelector('[data-feedback-panel]');

const ENDPOINT = 'feedback.php';
const FRAGEN = [
  { key: 'food', text: 'fb.q1' },
  { key: 'service', text: 'fb.q2' },
];

const state = { step: 0, food: 0, service: 0, text: '', done: false, error: false, busy: false };
const gestartet = Date.now();

function fortschritt() {
  const balken = [0, 1, 2]
    .map((i) => `<span class="feedback__bar${i <= state.step ? ' is-on' : ''}"></span>`)
    .join('');
  return `
    <div class="feedback__progress">
      <span>${t('fb.step', { n: state.step + 1 })}</span>
      <span class="feedback__bars" aria-hidden="true">${balken}</span>
    </div>`;
}

function skala(frage) {
  const knoepfe = [1, 2, 3, 4, 5]
    .map(
      (n) => `
        <button type="button" class="feedback__num" data-rate="${n}"
          aria-pressed="${state[frage.key] === n}" aria-label="${t('fb.rate', { n })}">${n}</button>`,
    )
    .join('');
  return `
    <div class="feedback__scale" role="group" aria-labelledby="fb-q">${knoepfe}</div>
    <div class="feedback__ends" aria-hidden="true"><span>${t('fb.low')}</span><span>${t('fb.high')}</span></div>`;
}

function render() {
  if (!panel) return;

  if (state.done) {
    panel.innerHTML = `
      <div class="feedback__step feedback__done">
        <span class="reserve-done__mark">${icon('check')}</span>
        <h3>${t('fb.thanksTitle')}</h3>
        <p>${t('fb.thanksText')}</p>
      </div>`;
    return;
  }

  const zurueck =
    state.step > 0
      ? `<button type="button" class="feedback__back" data-back>${icon('chevron')}<span>${t('fb.back')}</span></button>`
      : '';

  if (state.step < FRAGEN.length) {
    const frage = FRAGEN[state.step];
    panel.innerHTML = `
      <div class="feedback__step">
        ${fortschritt()}
        <h3 id="fb-q">${t(frage.text)}</h3>
        ${skala(frage)}
        ${zurueck}
      </div>`;
    return;
  }

  panel.innerHTML = `
    <form class="feedback__step" data-feedback-form novalidate>
      ${fortschritt()}
      <h3><label for="fb-text">${t('fb.q3')}</label></h3>
      <textarea id="fb-text" name="text" rows="4" maxlength="1000" placeholder="${t('fb.placeholder')}"></textarea>
      <!-- Honigtopf für Bots, für Menschen unsichtbar -->
      <input class="sr-only" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
      ${state.error ? `<p class="notice notice--error" role="alert">${t('fb.error')}</p>` : ''}
      <div class="feedback__actions">
        ${zurueck}
        <button class="btn btn--brand" type="submit" ${state.busy ? 'disabled' : ''}>
          ${icon('mail')}<span>${state.busy ? t('fb.sending') : t('fb.send')}</span>
        </button>
      </div>
    </form>`;

  // Eingegebenen Text nach dem Neuzeichnen (z. B. Sprachwechsel) behalten
  const feld = panel.querySelector('textarea');
  feld.value = state.text;
  feld.addEventListener('input', () => (state.text = feld.value));
}

async function senden(form) {
  state.busy = true;
  state.error = false;
  render();

  try {
    const antwort = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        food: state.food,
        service: state.service,
        text: state.text.trim(),
        website: form.website.value,
        elapsed: Math.round((Date.now() - gestartet) / 1000),
        lang: getLang(),
      }),
    });
    const ergebnis = await antwort.json().catch(() => ({}));
    if (!antwort.ok || !ergebnis.ok) throw new Error(ergebnis.error || `HTTP ${antwort.status}`);
    state.done = true;
  } catch (err) {
    console.error('Feedback:', err);
    state.error = true;
  } finally {
    state.busy = false;
    render();
  }
}

if (root && panel) {
  panel.addEventListener('click', (e) => {
    const zahl = e.target.closest('[data-rate]');
    if (zahl) {
      state[FRAGEN[state.step].key] = Number(zahl.dataset.rate);
      state.step += 1;
      render();
      panel.querySelector('button, textarea')?.focus({ preventScroll: true });
      return;
    }
    if (e.target.closest('[data-back]')) {
      state.step -= 1;
      state.error = false;
      render();
    }
  });

  panel.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.busy) senden(e.target);
  });

  render();
  onLangChange(render);
}
