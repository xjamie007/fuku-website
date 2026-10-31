/* ==================================================================
   Kopfbereich-Varianten der Startseite (Vorschau zum Vergleichen)

   Umschalter unten: die erste Website, das Dampf-Video und fünf
   Animationen mit Fotos des Restaurants. ?option=… merkt sich die Wahl.
   ================================================================== */

// dish = Gericht-ID in data/menu.json – das Karussell verlinkt darauf
const FOTOS = [
  { n: '02', big: true, dish: 2974 }, // King Roll
  { n: '04', big: true, dish: 982 }, // Nigiri Thon
  { n: '05', big: true, dish: 937 }, // Gambas mit Glasnudeln
  { n: '07', big: true, dish: 1048 }, // Chirashi
  { n: '08', big: true, dish: 973 }, // Rind mit Thai-Basilikum
  { n: '10', big: true, dish: 980 }, // Rotes Curry mit Tofu
  { n: '11', big: true, dish: 1059 }, // Fraise Roll
  { n: '12', big: true, dish: 989 }, // Nigiri Avocado
  { n: '01', dish: 1069 }, // Platte 62 Stück
  { n: '06', dish: 892 }, // Gyoza mit Scampi
  { n: '09', dish: 1064 }, // Platte 46 Stück
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

const grossFotos = FOTOS.filter((f) => f.big);
const gross = grossFotos.map((f) => `assets/img/hero/${f.n}.jpg`);
const klein = FOTOS.map((f) => `assets/img/hero/${f.n}-s.jpg`);
const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

const hero = document.querySelector('.hero[data-variant]');
const buehne = hero?.querySelector('[data-hv]');
let timer = null;

// Jedes Foto kennt sein Gericht; ein Klick darauf öffnet es auf der Bestellseite
const GERICHT = new Map(
  FOTOS.flatMap((f) => [
    [`assets/img/hero/${f.n}.jpg`, f.dish],
    [`assets/img/hero/${f.n}-s.jpg`, f.dish],
  ]),
);

const bild = (src, cls = '') =>
  `<img class="${cls}" src="${src}" alt="" decoding="async" data-dish="${GERICHT.get(src)}" />`;

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
  // Jede Karte führt zum Gericht auf der Bestellseite
  buehne.innerHTML = `<div class="hv4__track">${grossFotos
    .map((f) => `<a class="hv4__card" href="bestellen.html#gericht-${f.dish}" tabindex="-1">${bild(`assets/img/hero/${f.n}.jpg`)}</a>`)
    .join('')}</div>`;
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
  const mitVideo = option === 'dampf';
  hero.classList.toggle('hero--dampf', mitVideo);
  if (video && mitVideo && !ruhig) video.play().catch(() => {});
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

  buehne.addEventListener('click', (e) => {
    const foto = e.target.closest('[data-dish]');
    // Karussell-Karten sind schon Links
    if (!foto || foto.closest('a')) return;
    location.href = `bestellen.html#gericht-${foto.dataset.dish}`;
  });

  document.querySelector('.hv-switch').addEventListener('click', (e) => {
    const knopf = e.target.closest('[data-option]');
    if (!knopf) return;
    history.replaceState(null, '', `?option=${knopf.dataset.option}`);
    zeige(knopf.dataset.option);
  });

  zeige(option);
}
