<?php
/**
 * Restaurant Fuku – Endpunkt für anonymes Feedback
 * ---------------------------------------------------------------------
 * Nimmt das Feedback von der Kontaktseite entgegen (Essen 1–5, Service
 * 1–5, freier Text), prüft es, legt es in einer CSV-Datei ab und schickt
 * es per E-Mail ans Restaurant. Es werden weder Name noch E-Mail noch
 * IP-Adresse gespeichert; die IP fliesst nur gehasht und stundenweise in
 * die Begrenzung gegen Spam ein.
 *
 * Aufbau und Hilfsfunktionen wie in reservierung.php.
 */

declare(strict_types=1);

const EMPFAENGER = 'info@fuku.lu';
const ABSENDER = 'noreply@fuku.lu';
const RESTAURANT_NAME = 'Restaurant Fuku';
const ZEITZONE = 'Europe/Luxembourg';

/** Gleiches, per .htaccess gesperrtes Verzeichnis wie die Reservierungen. */
const LOG_VERZEICHNIS = __DIR__ . '/_reservierungen';

const LIMIT_PRO_STUNDE = 5;

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

function kuerze(string $wert, int $laenge): string
{
    return function_exists('mb_substr') ? mb_substr($wert, 0, $laenge) : substr($wert, 0, $laenge);
}

/** Holt ein Feld als getrimmten String ohne Steuerzeichen. */
function feld(array $quelle, string $name, int $maxLaenge = 200): string
{
    $wert = $quelle[$name] ?? '';
    if (!is_scalar($wert)) {
        return '';
    }
    $sauber = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) $wert);
    return kuerze(trim($sauber ?? ''), $maxLaenge);
}

/** Note 1–5, sonst 0. */
function note(array $quelle, string $name): int
{
    $wert = $quelle[$name] ?? 0;
    return is_int($wert) && $wert >= 1 && $wert <= 5 ? $wert : 0;
}

/* --- Anfrage einlesen --- */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fehler('method_not_allowed', 405);
}

$roh = file_get_contents('php://input') ?: '';
if (strlen($roh) > 10000) {
    fehler('payload_too_large', 413);
}

$eingabe = json_decode($roh, true);
if (!is_array($eingabe)) {
    fehler('invalid_json');
}

/* --- Spamschutz: Honigtopf, Mindestdauer, Begrenzung je IP --- */

if (feld($eingabe, 'website') !== '') {
    antworte(200, ['ok' => true]);
}

$dauer = (int) ($eingabe['elapsed'] ?? 0);
if ($dauer > 0 && $dauer < 3) {
    antworte(200, ['ok' => true]);
}

if (!is_dir(LOG_VERZEICHNIS)) {
    @mkdir(LOG_VERZEICHNIS, 0750, true);
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
$zaehlerDatei = LOG_VERZEICHNIS . '/feedback-rate-' . hash('sha256', $ip . date('YmdH')) . '.txt';
$anzahl = (int) @file_get_contents($zaehlerDatei);
if ($anzahl >= LIMIT_PRO_STUNDE) {
    fehler('rate_limited', 429);
}
@file_put_contents($zaehlerDatei, (string) ($anzahl + 1), LOCK_EX);

/* --- Felder prüfen --- */

$essen   = note($eingabe, 'food');
$service = note($eingabe, 'service');
$text    = feld($eingabe, 'text', 1000);
$sprache = in_array($eingabe['lang'] ?? '', ['de', 'fr', 'en', 'nl'], true) ? (string) $eingabe['lang'] : 'de';

if ($essen === 0 || $service === 0) {
    fehler('invalid_rating', 422);
}

$jetzt = new DateTimeImmutable('now', new DateTimeZone(ZEITZONE));

/* --- Sicherungskopie zuerst: sie darf nie an einem Mailfehler scheitern --- */

$logDatei = LOG_VERZEICHNIS . '/feedback-' . $jetzt->format('Y-m') . '.csv';
$neu = !is_file($logDatei);
if ($zeiger = @fopen($logDatei, 'ab')) {
    if (flock($zeiger, LOCK_EX)) {
        if ($neu) {
            fputcsv($zeiger, ['Eingang', 'Essen', 'Service', 'Sprache', 'Text']);
        }
        // Führende Formelzeichen entschärfen, damit Excel nichts ausführt.
        $csvText = preg_match('/^[=+\-@]/', $text) === 1 ? "'" . $text : $text;
        fputcsv($zeiger, [$jetzt->format('Y-m-d H:i'), $essen, $service, $sprache, $csvText]);
        flock($zeiger, LOCK_UN);
    }
    fclose($zeiger);
}

/* --- E-Mail ans Restaurant --- */

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

$sterne = static fn (int $n): string => str_repeat('★', $n) . str_repeat('☆', 5 - $n);

$betreff = sprintf('Neues Feedback: Essen %d/5, Service %d/5', $essen, $service);
$inhalt = implode("\n", [
    'Neues anonymes Feedback über die Website',
    '',
    'Essen:    ' . $sterne($essen) . " ($essen/5)",
    'Service:  ' . $sterne($service) . " ($service/5)",
    'Sprache:  ' . strtoupper($sprache),
    'Eingang:  ' . $jetzt->format('d.m.Y H:i'),
    '',
    'Nachricht:',
    $text !== '' ? $text : '(keine)',
]);

$kopf = [
    'From: ' . sprintf('%s <%s>', RESTAURANT_NAME, ABSENDER),
    'Content-Type: text/plain; charset=UTF-8',
];

if (function_exists('wp_mail')) {
    wp_mail(EMPFAENGER, $betreff, $inhalt, $kopf);
} else {
    @mail(EMPFAENGER, '=?UTF-8?B?' . base64_encode($betreff) . '?=', $inhalt, implode("\r\n", $kopf));
}

// Auch wenn die Mail klemmt: Das Feedback liegt in der CSV-Datei.
antworte(200, ['ok' => true]);
