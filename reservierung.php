<?php
/**
 * Restaurant Fuku – Endpunkt für Tischreservierungen
 * ---------------------------------------------------------------------
 * Nimmt das Formular von reservieren.html entgegen, prüft die Angaben
 * noch einmal serverseitig, schickt eine E-Mail ans Restaurant und eine
 * Eingangsbestätigung an den Gast. Zusätzlich wird jede Anfrage in eine
 * CSV-Datei geschrieben, damit nichts verloren geht, falls der Mailversand
 * einmal klemmt.
 *
 * Versand läuft über wp_mail(), sofern WordPress auf demselben Server
 * liegt – dann gilt automatisch dieselbe (funktionierende) Mail- bzw.
 * SMTP-Konfiguration wie für die bestehenden WooCommerce-Mails.
 */

declare(strict_types=1);

/* =====================================================================
   Einstellungen
   ===================================================================== */

/** Empfängeradresse für neue Reservierungen. */
const EMPFAENGER = 'info@fuku.lu';

/** Absenderadresse. Muss zur Domain gehören, sonst landen Mails im Spam. */
const ABSENDER = 'noreply@fuku.lu';

const RESTAURANT_NAME = 'Restaurant Fuku';
const ZEITZONE = 'Europe/Luxembourg';

/**
 * Öffnungszeiten in Minuten ab Mitternacht, Index = Wochentag (0 = Sonntag).
 *
 * ACHTUNG: Muss mit RESTAURANT.hours in assets/js/app.js übereinstimmen.
 * Prüfen mit:  node tools/check-config.mjs
 */
const OEFFNUNGSZEITEN = [
    0 => [[630, 870], [1050, 1380]],
    1 => [],
    2 => [[630, 870], [1050, 1380]],
    3 => [[630, 870], [1050, 1380]],
    4 => [[630, 870], [1050, 1380]],
    5 => [[630, 870], [1050, 1380]],
    6 => [[630, 870], [1050, 1380]],
];

/** Reservierungsregeln – müssen mit RESERVATION in app.js übereinstimmen. */
const RASTER_MINUTEN      = 15;  // Abstand der wählbaren Uhrzeiten
const PUFFER_VOR_SCHLUSS  = 60;  // letzte Reservierung so viele Minuten vor Schluss
const VORLAUF_MINUTEN     = 60;  // frühestens so viele Minuten im Voraus
const MAX_TAGE_IM_VORAUS  = 90;
const MAX_PERSONEN        = 10;  // grössere Gruppen bitte per E-Mail

/** Ablage der Sicherungskopie. Muss vom Web aus gesperrt sein (.htaccess). */
const LOG_VERZEICHNIS = __DIR__ . '/_reservierungen';

/** Höchstens so viele Anfragen je IP-Adresse und Stunde. */
const LIMIT_PRO_STUNDE = 5;

/* =====================================================================
   Antworthilfen
   ===================================================================== */

/**
 * Beendet die Anfrage mit einer JSON-Antwort.
 *
 * Die Kopfzeilen werden bewusst erst hier gesetzt: Wird zwischendurch
 * WordPress geladen, schickt es eigene Header – unsere sollen gewinnen.
 *
 * Rückgabetyp `void` statt `never`, damit das Skript auch auf PHP 7.4
 * läuft; beendet wird ohnehin per exit.
 *
 * @param array<string,mixed> $daten
 */
function antworte(int $status, array $daten): void
{
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: no-store');
        http_response_code($status);
    }
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fehler(string $code, int $status = 400): void
{
    antworte($status, ['ok' => false, 'error' => $code]);
}

/* Kürzen und Zählen funktionieren auch ohne mbstring-Erweiterung. */
function kuerze(string $wert, int $laenge): string
{
    return function_exists('mb_substr') ? mb_substr($wert, 0, $laenge) : substr($wert, 0, $laenge);
}

function laenge(string $wert): int
{
    return function_exists('mb_strlen') ? mb_strlen($wert) : strlen($wert);
}

/* =====================================================================
   Anfrage einlesen
   ===================================================================== */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fehler('method_not_allowed', 405);
}

$roh = file_get_contents('php://input') ?: '';
if (strlen($roh) > 20000) {
    fehler('payload_too_large', 413);
}

$eingabe = json_decode($roh, true);
if (!is_array($eingabe)) {
    fehler('invalid_json');
}

/** Holt ein Feld als getrimmten String. */
function feld(array $quelle, string $name, int $maxLaenge = 200): string
{
    $wert = $quelle[$name] ?? '';
    if (!is_scalar($wert)) {
        return '';
    }
    // Steuerzeichen entfernen – schützt die Kopfzeilen der E-Mail.
    $sauber = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) $wert);
    // Bei ungültigem UTF-8 liefert preg_replace null – dann verwerfen.
    return kuerze(trim($sauber ?? ''), $maxLaenge);
}

/* =====================================================================
   Spamschutz
   ===================================================================== */

// 1. Honigtopf: ein für Menschen unsichtbares Feld, das leer bleiben muss.
if (feld($eingabe, 'website') !== '') {
    // Bots gegenüber keinen Hinweis geben, dass sie erkannt wurden.
    antworte(200, ['ok' => true]);
}

// 2. Ausfüllzeit: unter drei Sekunden war kein Mensch am Werk.
$dauer = (int) ($eingabe['elapsed'] ?? 0);
if ($dauer > 0 && $dauer < 3) {
    antworte(200, ['ok' => true]);
}

// 3. Einfache Begrenzung je IP-Adresse.
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
if (!is_dir(LOG_VERZEICHNIS)) {
    @mkdir(LOG_VERZEICHNIS, 0750, true);
}

$zaehlerDatei = LOG_VERZEICHNIS . '/rate-' . hash('sha256', $ip . date('YmdH')) . '.txt';
$anzahl = (int) @file_get_contents($zaehlerDatei);
if ($anzahl >= LIMIT_PRO_STUNDE) {
    fehler('rate_limited', 429);
}
@file_put_contents($zaehlerDatei, (string) ($anzahl + 1), LOCK_EX);

/* =====================================================================
   Felder prüfen
   ===================================================================== */

$name     = feld($eingabe, 'name', 120);
$email    = feld($eingabe, 'email', 160);
$telefon  = feld($eingabe, 'phone', 40);
$datum    = feld($eingabe, 'date', 10);
$uhrzeit  = feld($eingabe, 'time', 5);
$personen = (int) ($eingabe['guests'] ?? 0);
$hinweis  = feld($eingabe, 'notes', 1000);
$sprache  = in_array($eingabe['lang'] ?? '', ['de', 'fr', 'en', 'nl'], true)
    ? (string) $eingabe['lang']
    : 'de';

$fehlerFelder = [];

if (laenge($name) < 2) {
    $fehlerFelder[] = 'name';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $fehlerFelder[] = 'email';
}
// Telefonnummer bewusst grosszügig prüfen: international sehr verschieden.
if (preg_match('/^[+()\/.\s\d-]{6,}$/', $telefon) !== 1) {
    $fehlerFelder[] = 'phone';
}
if ($personen < 1 || $personen > MAX_PERSONEN) {
    $fehlerFelder[] = 'guests';
}
if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $datum) !== 1) {
    $fehlerFelder[] = 'date';
}
if (preg_match('/^\d{2}:\d{2}$/', $uhrzeit) !== 1) {
    $fehlerFelder[] = 'time';
}

if ($fehlerFelder !== []) {
    antworte(422, ['ok' => false, 'error' => 'invalid_fields', 'fields' => $fehlerFelder]);
}

/* =====================================================================
   Termin gegen die Öffnungszeiten prüfen

   Das geschieht bewusst noch einmal auf dem Server: die Prüfung im
   Browser ist Bedienkomfort, keine Absicherung.
   ===================================================================== */

$zone  = new DateTimeZone(ZEITZONE);
$jetzt = new DateTimeImmutable('now', $zone);

$termin = DateTimeImmutable::createFromFormat('Y-m-d H:i', $datum . ' ' . $uhrzeit, $zone);
if (!$termin || $termin->format('Y-m-d') !== $datum) {
    fehler('invalid_datetime');
}

// Nicht in der Vergangenheit und mit etwas Vorlauf.
if ($termin < $jetzt->modify('+' . VORLAUF_MINUTEN . ' minutes')) {
    fehler('too_soon');
}

if ($termin > $jetzt->modify('+' . MAX_TAGE_IM_VORAUS . ' days')) {
    fehler('too_far');
}

$wochentag = (int) $termin->format('w');
$minuten   = ((int) $termin->format('G')) * 60 + (int) $termin->format('i');

if ($minuten % RASTER_MINUTEN !== 0) {
    fehler('invalid_slot');
}

$passt = false;
foreach (OEFFNUNGSZEITEN[$wochentag] ?? [] as [$von, $bis]) {
    if ($minuten >= $von && $minuten <= $bis - PUFFER_VOR_SCHLUSS) {
        $passt = true;
        break;
    }
}

if (!$passt) {
    fehler('closed');
}

/* =====================================================================
   E-Mails zusammenstellen
   ===================================================================== */

$wochentage = [
    'de' => ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    'fr' => ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    'en' => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    'nl' => ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
];

$tagName    = $wochentage[$sprache][$wochentag];
$datumLang  = $tagName . ', ' . $termin->format('d.m.Y');
$referenz   = strtoupper(substr(hash('sha256', $email . $datum . $uhrzeit . microtime()), 0, 6));

/* --- Mail ans Restaurant ------------------------------------------- */

$betreffTeam = sprintf('Reservierung %s · %s Uhr · %d Pers. (%s)', $termin->format('d.m.Y'), $uhrzeit, $personen, $referenz);

$textTeam = <<<TEXT
Neue Tischreservierung über die Website

Referenz:   {$referenz}
Datum:      {$datumLang}
Uhrzeit:    {$uhrzeit} Uhr
Personen:   {$personen}

Name:       {$name}
E-Mail:     {$email}
Telefon:    {$telefon}
Sprache:    {$sprache}

Anmerkung:
{$hinweis}

--
Bitte dem Gast direkt antworten – die Adresse ist als Antwortadresse hinterlegt.
TEXT;

/* --- Eingangsbestätigung an den Gast -------------------------------- */

$betreffGast = [
    'de' => 'Ihre Reservierungsanfrage bei Restaurant Fuku',
    'fr' => 'Votre demande de réservation au Restaurant Fuku',
    'en' => 'Your reservation request at Restaurant Fuku',
    'nl' => 'Uw reserveringsaanvraag bij Restaurant Fuku',
][$sprache];

$textGast = [
    'de' => <<<TEXT
Guten Tag {$name},

vielen Dank für Ihre Anfrage. Wir haben sie erhalten:

  Datum:    {$datumLang}
  Uhrzeit:  {$uhrzeit} Uhr
  Personen: {$personen}
  Referenz: {$referenz}

Bitte beachten Sie: Dies ist eine Eingangsbestätigung, noch keine
Zusage. Wir melden uns kurzfristig bei Ihnen und bestätigen den Tisch.

Herzliche Grüsse
Restaurant Fuku
9, Rue de la Gare · L-9420 Vianden
TEXT,
    'fr' => <<<TEXT
Bonjour {$name},

merci pour votre demande. Nous l'avons bien reçue :

  Date :      {$datumLang}
  Heure :     {$uhrzeit}
  Personnes : {$personen}
  Référence : {$referenz}

Attention : ceci est un accusé de réception, pas encore une
confirmation. Nous revenons vers vous très rapidement.

Cordialement
Restaurant Fuku
9, Rue de la Gare · L-9420 Vianden
TEXT,
    'en' => <<<TEXT
Hello {$name},

thank you for your request. We have received it:

  Date:      {$datumLang}
  Time:      {$uhrzeit}
  Guests:    {$personen}
  Reference: {$referenz}

Please note: this is a confirmation of receipt, not yet a confirmed
booking. We will get back to you shortly.

Kind regards
Restaurant Fuku
9, Rue de la Gare · L-9420 Vianden
TEXT,
    'nl' => <<<TEXT
Beste {$name},

hartelijk dank voor uw aanvraag. Wij hebben deze ontvangen:

  Datum:      {$datumLang}
  Tijd:       {$uhrzeit}
  Personen:   {$personen}
  Referentie: {$referenz}

Let op: dit is een ontvangstbevestiging, nog geen definitieve
reservering. We nemen zo snel mogelijk contact met u op.

Met vriendelijke groet
Restaurant Fuku
9, Rue de la Gare · L-9420 Vianden
TEXT,
][$sprache];

/* =====================================================================
   Versand
   ===================================================================== */

/**
 * Verschickt eine Nur-Text-Mail.
 *
 * Bevorzugt wp_mail(): Damit gilt dieselbe SMTP-Einstellung wie für die
 * bestehenden WordPress- und WooCommerce-Mails, was die Zustellrate
 * deutlich verbessert. Ist WordPress nicht erreichbar, greift mail().
 */
function sendeMail(string $an, string $betreff, string $text, string $antwortAn = ''): bool
{
    $kopf = [
        'From: ' . sprintf('%s <%s>', RESTAURANT_NAME, ABSENDER),
        'Content-Type: text/plain; charset=UTF-8',
    ];
    if ($antwortAn !== '') {
        $kopf[] = 'Reply-To: ' . $antwortAn;
    }

    if (function_exists('wp_mail')) {
        return (bool) wp_mail($an, $betreff, $text, $kopf);
    }

    return mail(
        $an,
        '=?UTF-8?B?' . base64_encode($betreff) . '?=',
        $text,
        implode("\r\n", $kopf)
    );
}

/*
 * WordPress laden, falls es neben dieser Datei liegt – dann steht
 * wp_mail() mit der dort eingerichteten SMTP-Konfiguration bereit.
 * Die Ausgabe wird verworfen, damit nichts die JSON-Antwort verunreinigt
 * (Leerzeichen, BOM oder Meldungen aus Plugins).
 */
foreach ([__DIR__ . '/wp-load.php', dirname(__DIR__) . '/wp-load.php'] as $pfad) {
    if (is_readable($pfad)) {
        ob_start();
        try {
            require_once $pfad;
        } catch (Throwable $e) {
            // Ohne WordPress geht es mit mail() weiter.
        }
        ob_end_clean();
        break;
    }
}

/* --- Sicherungskopie zuerst: sie darf nie an einem Mailfehler scheitern --- */

$logDatei = LOG_VERZEICHNIS . '/reservierungen-' . $jetzt->format('Y-m') . '.csv';
$neu      = !file_exists($logDatei);

if ($zeiger = @fopen($logDatei, 'a')) {
    if (flock($zeiger, LOCK_EX)) {
        if ($neu) {
            fputcsv($zeiger, ['Eingang', 'Referenz', 'Datum', 'Uhrzeit', 'Personen', 'Name', 'E-Mail', 'Telefon', 'Sprache', 'Anmerkung']);
        }
        fputcsv($zeiger, [
            $jetzt->format('Y-m-d H:i:s'),
            $referenz,
            $datum,
            $uhrzeit,
            $personen,
            $name,
            $email,
            $telefon,
            $sprache,
            $hinweis,
        ]);
        flock($zeiger, LOCK_UN);
    }
    fclose($zeiger);
}

$anTeam = sendeMail(EMPFAENGER, $betreffTeam, $textTeam, sprintf('%s <%s>', $name, $email));

// Die Bestätigung an den Gast ist Beiwerk – ihr Scheitern darf die
// Reservierung nicht als fehlgeschlagen erscheinen lassen.
@sendeMail($email, $betreffGast, $textGast);

if (!$anTeam) {
    fehler('mail_failed', 502);
}

antworte(200, ['ok' => true, 'reference' => $referenz]);
