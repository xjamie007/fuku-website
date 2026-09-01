# Restaurant Fuku – Website

Neue Website für das Restaurant Fuku, 9 Rue de la Gare, L-9420 Vianden.
Statisches HTML/CSS/JavaScript ohne Build-Schritt. Die Speisekarte kommt aus
dem bestehenden WooCommerce, Bestellung und Zahlung laufen weiterhin über den
vorhandenen Kassenbereich.

---

## Aufbau

```
index.html          Startseite
bestellen.html      Speisekarte und Warenkorb
reservieren.html    Tischreservierung
kontakt.html        Kontakt, Anfahrt, Impressum, Datenschutz

reservierung.php    Server-Endpunkt für Reservierungen
_reservierungen/    Sicherungskopien der Reservierungen (nicht öffentlich)

assets/css/         style.css (global) · order.css (Bestellseite)
assets/js/          app.js · i18n.js · icons.js · menu-data.js
                    home.js · order.js · reserve.js · contact.js
assets/fonts/       Selbstgehostete Schriften (Inter, Instrument Serif)
assets/img/         Logo, Kartenbild

data/menu.json      Erzeugte Speisekarte – nicht von Hand bearbeiten
tools/              sync-menu.mjs · dish-i18n.mjs · check-i18n.mjs
                    check-config.mjs · make-map.py · dev-server.py

.htaccess           Cache- und Sicherheits-Header für Apache/LiteSpeed
_headers            Dasselbe für Netlify / Cloudflare Pages
```

---

## Speisekarte aktualisieren

Gerichte und Preise werden weiterhin **im WordPress-Backend** gepflegt. Nach
jeder Änderung dort:

```bash
node tools/sync-menu.mjs
```

Das Skript lädt alle Produkte über die WooCommerce Store API, räumt Namen und
Allergenangaben auf, ordnet sie den Kategorien zu und schreibt
`data/menu.json`. Anschliessend nur diese eine Datei auf den Server laden.

Was das Skript dabei erledigt:

- trennt die Artikelnummer vom Namen (`H2.Hot Rolls …` → Nummer `H2`)
- entfernt wiederholte Gruppennamen (`N1.Nigiri Saumon` → `Saumon` unter „Nigiri“)
- korrigiert wiederkehrende Tippfehler aus dem Katalog (`chesse` → `cheese` …)
- liest Allergennummern aus der Beschreibung und trennt sie vom Beschreibungstext
- markiert vegetarische, scharfe und beliebte Gerichte für die Filter
- löst variable Produkte in bestellbare Varianten auf

Übersetzungen und Konfiguration prüfen:

```bash
node tools/check-i18n.mjs && node tools/check-config.mjs
```

---

## Lokal ansehen

```bash
python3 tools/dev-server.py 4371
```

Dann `http://localhost:4371` öffnen. Die Bestellabgabe funktioniert lokal
**nicht** – dazu muss die Seite auf derselben Domain wie WordPress laufen
(siehe unten). Alles andere lässt sich lokal testen.

---

## Anbindung an WooCommerce

Der Warenkorb wird im Browser aufgebaut und erst beim Klick auf „Zur Kasse“
an WooCommerce übergeben:

1. `GET /wp-json/wc/store/v1/cart` – holt Nonce und Cart-Token
2. `DELETE /wp-json/wc/store/v1/cart/items` – leert einen alten Serverwarenkorb
3. `POST /wp-json/wc/store/v1/cart/add-item` je Position
4. Weiterleitung auf `/checkout/`

Ab da führt WooCommerce: Lieferung oder Abholung, Zeitfenster, Zahlung und
Bestätigungsmail bleiben unverändert.

**Wichtig für den Livegang:** Die Seite muss unter derselben Domain wie
WordPress laufen (`fuku.lu`). Nur dann gelten Session-Cookie und Nonce. Liegt
WordPress in einem Unterverzeichnis oder auf einer anderen Domain, kann das
Attribut `data-woo-origin` am `<body>` von `bestellen.html` gesetzt werden –
die fremde Domain muss dann CORS mit `credentials` erlauben.

Schlägt die Übertragung fehl, bleibt der Warenkorb erhalten und es erscheint
ein Hinweis mit der Möglichkeit, die Bestellung als vorbereitete E-Mail zu
senden. So geht keine Bestellung verloren.

### Der `/batch`-Endpunkt wird bewusst nicht verwendet

WooCommerce reicht den Nonce-Header nicht an die Teilanfragen von
`/wp-json/wc/store/v1/batch` weiter; jedes `add-item` darin scheitert mit
`401 woocommerce_rest_missing_nonce`. Die Positionen werden deshalb
nacheinander übertragen.

---

## Tischreservierung

`reservieren.html` zeigt ein Formular, dessen Auswahlfelder direkt aus den
Öffnungszeiten entstehen. Ein Termin, an dem geschlossen ist, lässt sich
gar nicht erst anklicken: Montage tauchen nicht auf, und für heute werden
nur noch Zeiten angeboten, die weit genug in der Zukunft liegen.

Regeln (in `assets/js/app.js` unter `RESERVATION`):

| Wert | Vorgabe | Bedeutung |
| --- | --- | --- |
| `slotMinutes` | 15 | Abstand der wählbaren Uhrzeiten |
| `bufferBeforeClose` | 60 | letzte Reservierung 60 Min. vor Schluss (also 13:30 und 22:00) |
| `minLeadMinutes` | 60 | frühestens eine Stunde im Voraus |
| `maxAdvanceDays` | 90 | wie weit im Voraus reserviert werden kann |
| `maxGuests` | 10 | darüber erscheint ein Hinweis, sich per E-Mail zu melden |

**Diese Werte sind gesetzt, nicht abgestimmt** – bitte einmal prüfen und
anpassen. Jede Änderung muss an beiden Stellen erfolgen: in `app.js` und im
Konstantenblock oben in `reservierung.php`. Danach:

```bash
node tools/check-config.mjs
```

Das Skript vergleicht Öffnungszeiten, Regeln, Zeitzone und Empfängeradresse
in beiden Dateien und meldet Abweichungen. Ohne diesen Abgleich würde das
Formular Zeiten anbieten, die der Server anschliessend ablehnt.

### Was beim Absenden passiert

1. Der Browser prüft die Eingaben und schickt sie als JSON an `reservierung.php`.
2. Der Server prüft **alles noch einmal** – die Prüfung im Browser ist nur
   Bedienkomfort, keine Absicherung.
3. Die Anfrage wird nach `_reservierungen/reservierungen-JJJJ-MM.csv`
   geschrieben, **bevor** die E-Mails rausgehen. Klemmt der Mailversand,
   ist die Reservierung trotzdem festgehalten.
4. Eine E-Mail geht an `info@fuku.lu` (Antwortadresse ist der Gast), eine
   Eingangsbestätigung an den Gast – in dessen Sprache.
5. Der Gast sieht eine Referenznummer.

Der Versand nutzt `wp_mail()`, sobald WordPress auf demselben Server liegt.
Damit gilt automatisch dieselbe SMTP-Einstellung wie für die bestehenden
WooCommerce-Mails, was für die Zustellrate wichtig ist. Ist WordPress nicht
erreichbar, greift das einfache `mail()` von PHP.

Antwortet der Server gar nicht, verliert der Gast nichts: Es erscheint ein
Hinweis mit einer vorbereiteten E-Mail, die alle Angaben bereits enthält.

### Spamschutz

Ohne CAPTCHA, damit niemand Bilderrätsel lösen muss:

- ein für Menschen unsichtbares Feld, das ausgefüllt zur stillen Verwerfung führt
- Formulare, die in unter drei Sekunden abgeschickt werden, gelten als Bot
- höchstens fünf Anfragen je IP-Adresse und Stunde

### Vor dem Livegang prüfen

- **PHP muss auf dem Server laufen.** Bei WordPress ist das gegeben; lokal
  mit `python3 -m http.server` funktioniert die Reservierung nicht.
- **`ABSENDER` in `reservierung.php`** steht auf `noreply@fuku.lu`. Die
  Adresse muss zur Domain gehören, sonst stufen Mailanbieter die Nachrichten
  als Spam ein.
- **Ordner `_reservierungen/` muss gesperrt sein.** Die mitgelieferte
  `.htaccess` erledigt das auf Apache und LiteSpeed. Auf einem Nginx-Server
  muss die Sperre von Hand eingetragen werden – dort liegen personenbezogene
  Daten.
- **Eine echte Testreservierung durchführen** und prüfen, ob beide E-Mails
  ankommen (auch im Spam-Ordner nachsehen).

Das Formular ersetzt die bisherige WPForms-Seite `/reservations/`. Diese
kann nach dem Umstieg in WordPress deaktiviert werden.

---

## Offene Punkte für das Restaurant

Diese Angaben liessen sich aus der alten Website nicht ermitteln:

1. **Telefonnummer** – auf der bisherigen Website war keine hinterlegt.
   Eintragen in `assets/js/app.js` bei `RESTAURANT.phone`. Der Kontaktblock
   erscheint dann automatisch auf allen Seiten.

2. **Impressumsangaben** – in `kontakt.html` unter `#impressum`. In Luxemburg
   verpflichtend: Betreibergesellschaft und Rechtsform, vertretungsberechtigte
   Person, RCS-Nummer, Umsatzsteuer-Identifikationsnummer und die
   Betriebsgenehmigung (*autorisation d'établissement*).

3. **„Menu Plats chaud Midi“ ist online nicht bestellbar.** Das Produkt (ID 687)
   ist in WooCommerce als variables Produkt angelegt, seine einzige Variante
   hat aber für „Entrée au choix“ und „Plat au choix“ keine festgelegten Werte.
   WooCommerce weist deshalb jeden Bestellversuch ab – auch auf der alten
   Website. Auf der neuen Seite erscheint das Menü mit dem Hinweis „Nur im
   Restaurant“, bis im Backend echte Varianten angelegt sind.

4. **Fondu Fuku** – die Variante heisst im Backend `1-personne`, die Anzeige
   sagt „4 personnes“. Bestellbar ist das Gericht, die Bezeichnung sollte im
   Backend aber vereinheitlicht werden.

5. **Allergen-Legende prüfen.** Die Nummern der Karte wurden der
   EU-Kennzeichnung (LMIV Anhang II) zugeordnet – 1 Gluten, 2 Krebstiere,
   3 Eier und so weiter. Die Zuordnung passt zu den Gerichten, sollte aber
   von der Küche bestätigt werden. Zu ändern in `assets/js/i18n.js` unter
   `ALLERGENS`.

6. **Fotos.** 152 der 222 Gerichte haben ein Bild. Gerichte ohne Foto zeigen
   ein 福-Zeichen als Platzhalter. Neue Bilder einfach in WordPress hochladen
   und `node tools/sync-menu.mjs` erneut ausführen.

---

## Gerichtnamen übersetzen

Die Namen kommen französisch aus WooCommerce. `tools/dish-i18n.mjs`
übersetzt sie beim Sync nach Deutsch, Englisch und Niederländisch und legt
das Ergebnis als `t` und `tShort` neben den Originalnamen in `data/menu.json`.
Französisch bleibt unverändert die Originalfassung.

Übersetzt wird **nicht** Wort für Wort, sondern über ein gepflegtes
Wörterbuch aus Wendungen – die längste passende gewinnt:

```
'riz sauté'          → Gebratener Reis
'aux légumes'        → mit Gemüse
'sur plat chauffant' → auf heisser Platte
```

Fachbegriffe (Sushi, Nigiri, Tempura, Udon …) bleiben stehen. Für Namen,
die sich mechanisch nur holprig übersetzen lassen, gibt es `OVERRIDES` mit
der besseren Formulierung.

Neue Gerichte aus WooCommerce werden automatisch mitübersetzt, solange sie
dieselben Bausteine verwenden. Was das Wörterbuch nicht kennt, bleibt
französisch stehen – `node tools/sync-menu.mjs` meldet solche Wörter am
Ende, damit sie ergänzt werden können.

Die Suche durchsucht alle Sprachen gleichzeitig: Wer „Lachs" eintippt,
findet auch „Saumon".

---

## Kartenbild erneuern

Die Karte auf der Kontaktseite ist ein Bild im Projekt, kein eingebetteter
Dienst. Dadurch ist sie sofort sichtbar, es geht keine Anfrage an einen
fremden Server, und die Seite bleibt ohne Cookie-Banner. Der Klick führt
nach Google Maps.

```bash
python3 tools/make-map.py
```

Das Skript liest die Koordinaten aus `RESTAURANT.coords` in `app.js`, lädt
die Kacheln von OpenStreetMap, setzt den Marker und schreibt
`assets/img/karte.jpg`. Nötig nur, wenn sich die Adresse ändert.

Die Namensnennung „Kartendaten © OpenStreetMap-Mitwirkende" steht unter der
Karte und muss dort bleiben – sie ist Lizenzbedingung.

---

## Sprachen

Deutsch, Französisch, Englisch und Niederländisch. Die Oberfläche ist
vollständig übersetzt, die **Gerichtnamen bleiben französisch** – so stehen
sie auf der Karte, im Restaurant und auf der Rechnung.

Die Sprache richtet sich nach der Browsereinstellung und lässt sich oben
rechts umschalten; die Wahl wird im Browser gemerkt. Preise werden je Sprache
korrekt formatiert (`15,80 €` / `€15.80`).

Neue Texte in `assets/js/i18n.js` in **allen vier** Sprachblöcken ergänzen,
danach `node tools/check-i18n.mjs` ausführen.

---

## Datenschutz

- Schriften sind selbst gehostet, keine Google Fonts, kein CDN
- keine Analyse-, Tracking- oder Werbedienste
- der Warenkorb liegt nur lokal im Browser (`localStorage`)
- die OpenStreetMap-Karte auf der Kontaktseite lädt erst nach ausdrücklichem Klick
- damit ist kein Cookie-Banner nötig, solange in WordPress nichts Weiteres läuft

Reservierungsdaten sind personenbezogen. Sie liegen in `_reservierungen/`
und in den Postfächern. Für die Aufbewahrung gilt: Was nicht mehr gebraucht
wird, sollte gelöscht werden – die CSV-Dateien sind nach Monaten getrennt,
alte Dateien lassen sich also einfach entfernen.

---

## Vorschau auf GitHub Pages

Zum Abstimmen liegt die Seite unter:

**https://xjamie007.github.io/fuku-website/**

Quelle ist der `main`-Branch dieses Repositories. Jeder `git push` erneuert die
Vorschau nach etwa einer Minute von selbst.

Was dort **nicht** funktioniert, weil GitHub Pages nur statische Dateien
ausliefert und kein PHP ausführt:

- **Das Reservierungsformular sendet nicht.** Es lässt sich vollständig
  bedienen und prüft alle Eingaben; beim Absenden erscheint der Hinweis mit
  der vorbereiteten E-Mail. Das ist dasselbe Verhalten wie später bei einem
  Serverausfall – der Weg ist also mitgetestet, nur eben nicht der Versand.
- **Der Checkout springt zu `fuku.lu`.** Die WooCommerce-Anbindung braucht
  dieselbe Domain.

Beides funktioniert erst, wenn die Dateien auf dem Hoster von fuku.lu liegen.

`robots.txt` sperrt die Vorschau für Suchmaschinen aus, damit sie der echten
Seite keine Konkurrenz macht. **Diese Datei vor dem Umzug auf fuku.lu
ersatzlos löschen**, sonst verschwindet die Website aus Google.

---

## Veröffentlichen

Alle Dateien in das Web-Wurzelverzeichnis neben WordPress legen. `.htaccess`
sorgt für Komprimierung, sinnvolle Cache-Zeiten und lässt die WordPress-Pfade
(`/wp-json`, `/checkout`, `/cart`, `/wp-admin` …) unangetastet.

`index.html` muss dabei die WordPress-Startseite ersetzen. Am einfachsten
lässt sich WordPress dazu in ein Unterverzeichnis verschieben oder die
WordPress-Startseite auf die neue Datei umleiten – Bestellung und Zahlung
laufen unverändert weiter, weil sie unter `/checkout/` liegen.
