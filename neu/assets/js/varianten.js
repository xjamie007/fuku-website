/* ==================================================================
   Kopfbereich-Varianten der Startseite (Vorschau zum Vergleichen)

   Umschalter unten: die erste Website, das Dampf-Video und fünf
   Animationen mit Fotos des Restaurants. ?option=… merkt sich die Wahl.
   ================================================================== */

const FOTOS = [
  { n: '02', big: true }, // King Roll
  { n: '03', big: true }, // Xiao Long Bao
  { n: '04', big: true }, // Nigiri Thon
  { n: '05', big: true }, // Gambas mit Glasnudeln
  { n: '07', big: true }, // Chirashi
  { n: '08', big: true }, // Rind mit Thai-Basilikum
  { n: '10', big: true }, // Rotes Curry
  { n: '11', big: true }, // Fraise Roll
  { n: '12', big: true }, // Nigiri Avocado
  { n: '01' }, // Platte 62 Stück
  { n: '06' }, // Gyoza
  { n: '09' }, // Platte 46 Stück
];

// Map statt Objekt: Zahlen-Schlüssel würden sonst nach vorne sortiert
const OPTIONEN = new Map([
  ['original', 'Erste Website'],
  ['dampf', 'Dampf'],
  ['1', 'Diashow'],
  ['2', 'Fotowand'],
  ['3', 'Mosaik'],
  ['4', 'Karussell'],
  ['5', 'Story'],
]);

const gross = FOTOS.filter((f) => f.big).map((f) => `assets/img/hero/${f.n}.jpg`);
const klein = FOTOS.map((f) => `assets/img/hero/${f.n}-s.jpg`);
const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

const hero = document.querySelector('.hero[data-variant]');
const buehne = hero?.querySelector('[data-hv]');
let timer = null;

const bild = (src, cls = '') => `<img class="${cls}" src="${src}" alt="" decoding="async" />`;

/* 1 · Diashow: langsames Heranzoomen, weiche Überblendung */
function diashow() {
  buehne.innerHTML = gross.map((src, i) => bild(src, `hv1__slide${i === 0 ? ' is-on' : ''}`)).join('');
  if (ruhig) return;
  const slides = [...buehne.children];
  let i = 0;
  timer = setInterval(() => {
    slides[i].classList.remove('is-on');
    i = (i + 1) % slides.length;
    slides[i].classList.add('is-on');
  }, 5000);
}

/* 2 · Fotowand: drei Reihen laufen schräg gegeneinander */
function fotowand() {
  const reihe = (start) => {
    const fotos = [...klein.slice(start), ...klein.slice(0, start)];
    // doppelt, damit das Band nahtlos weiterläuft
    return `<div class="hv2__row">${[...fotos, ...fotos].map((src) => bild(src)).join('')}</div>`;
  };
  buehne.innerHTML = `<div class="hv2__wall">${reihe(0)}${reihe(4)}${reihe(8)}</div>`;
}

/* 3 · Mosaik: Kacheln wechseln einzeln ihr Foto */
function mosaik() {
  const kacheln = 12;
  buehne.innerHTML = `<div class="hv3__grid">${Array.from(
    { length: kacheln },
    (_, i) => `<div class="hv3__tile">${bild(klein[i % klein.length], 'is-on')}</div>`,
  ).join('')}</div>`;
  if (ruhig) return;
  let naechstes = kacheln;
  timer = setInterval(() => {
    const tiles = buehne.querySelectorAll('.hv3__tile');
    const tile = tiles[Math.floor(Math.random() * tiles.length)];
    const alt = tile.querySelector('img');
    tile.insertAdjacentHTML('beforeend', bild(klein[naechstes++ % klein.length]));
    const neu = tile.lastElementChild;
    neu.decode?.().catch(() => {}).finally(() => {
      requestAnimationFrame(() => neu.classList.add('is-on'));
      setTimeout(() => alt.remove(), 900);
    });
  }, 1100);
}

/* 4 · Karussell: Fotos drehen sich in der Tiefe am Betrachter vorbei */
function karussell() {
  buehne.innerHTML = `<div class="hv4__track">${gross.map((src) => `<figure class="hv4__card">${bild(src)}</figure>`).join('')}</div>`;
  const karten = [...buehne.querySelectorAll('.hv4__card')];
  let aktiv = 0;
  const setzen = () => {
    karten.forEach((karte, i) => {
      let o = i - aktiv;
      // kürzester Weg im Kreis
      if (o > karten.length / 2) o -= karten.length;
      if (o < -karten.length / 2) o += karten.length;
      karte.style.setProperty('--o', o);
      karte.style.setProperty('--abs', Math.abs(o));
      karte.hidden = Math.abs(o) > 3;
    });
  };
  setzen();
  if (ruhig) return;
  timer = setInterval(() => {
    aktiv = (aktiv + 1) % karten.length;
    setzen();
  }, 2800);
}

/* 5 · Story: Vollbild mit Wisch-Übergang und Fortschrittsbalken */
function story() {
  const dauer = 4500;
  buehne.innerHTML = `
    ${gross.map((src, i) => bild(src, `hv5__slide${i === 0 ? ' is-on' : ''}`)).join('')}
    <div class="hv5__bars">${gross.map(() => '<span><i></i></span>').join('')}</div>`;
  buehne.style.setProperty('--dauer', `${dauer}ms`);
  const slides = [...buehne.querySelectorAll('.hv5__slide')];
  const bars = [...buehne.querySelectorAll('.hv5__bars span')];
  let i = 0;
  const zeigen = () => {
    bars.forEach((b, k) => {
      b.classList.toggle('is-done', k < i);
      b.classList.toggle('is-now', k === i);
    });
    slides.forEach((s, k) => {
      s.classList.toggle('is-on', k === i);
      s.classList.toggle('is-prev', k === (i - 1 + slides.length) % slides.length);
    });
  };
  zeigen();
  if (ruhig) return;
  timer = setInterval(() => {
    i = (i + 1) % slides.length;
    zeigen();
  }, dauer);
}

const BAUEN = { 1: diashow, 2: fotowand, 3: mosaik, 4: karussell, 5: story };

function zeige(option) {
  clearInterval(timer);
  buehne.innerHTML = '';
  buehne.removeAttribute('style');
  hero.dataset.variant = option;
  hero.classList.toggle('hero--v', option in BAUEN);
  BAUEN[option]?.();

  const video = hero.querySelector('.hero__video');
  if (video && option === 'dampf' && !ruhig) video.play().catch(() => {});
  else video?.pause();

  // Kopfleiste neu einfärben (dunkel nur über Video/Fotos)
  window.dispatchEvent(new Event('scroll'));
  document.querySelectorAll('[data-option]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.option === option));
}

if (hero && buehne) {
  const start = new URLSearchParams(location.search).get('option');
  const option = OPTIONEN.has(start) ? start : hero.dataset.variant;

  document.body.insertAdjacentHTML(
    'beforeend',
    `<nav class="hv-switch" aria-label="Varianten des Kopfbereichs">
      ${[...OPTIONEN]
        .map(([n, name]) => `<button type="button" data-option="${n}">${n in BAUEN ? `<b>${n}</b> ` : ''}${name}</button>`)
        .join('')}
    </nav>`,
  );

  document.querySelector('.hv-switch').addEventListener('click', (e) => {
    const knopf = e.target.closest('[data-option]');
    if (!knopf) return;
    history.replaceState(null, '', `?option=${knopf.dataset.option}`);
    zeige(knopf.dataset.option);
  });

  zeige(option);
}
