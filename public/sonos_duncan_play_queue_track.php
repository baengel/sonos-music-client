<?php
$autoloadPath = __DIR__ . '/lib/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
  echo "FEHLER: vendor/autoload.php nicht gefunden!\n";
  echo "Bitte im Projektverzeichnis 'composer install' ausführen.\n";
  exit(1);
}
echo "vendor/autoload.php gefunden und wird geladen...\n";
require $autoloadPath;

use duncan3dc\Sonos\Network;

// Debug-Logging aktivieren
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/sonos_duncan_debug.log');

// Raumname und Track-Index als Input-Parameter
$room = isset($_POST['room']) ? trim($_POST['room']) : null;
$ip = isset($_POST['ip']) ? trim($_POST['ip']) : null;
$trackIndex = isset($_POST['track']) ? intval($_POST['track']) : null;
if (($room === null && $ip === null) || $trackIndex === null) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if ($room === null && isset($data['room'])) {
        $room = trim($data['room']);
    }
    if ($ip === null && isset($data['ip'])) {
        $ip = trim($data['ip']);
    }
    if ($trackIndex === null && isset($data['track'])) {
        $trackIndex = intval($data['track']);
    }
}
if (!$room && !$ip) {
    echo "FEHLER: Raumname ('room') oder IP-Adresse ('ip') muss übergeben werden!\n";
    exit(1);
}
if ($trackIndex === null || $trackIndex < 1) {
    echo "FEHLER: Track-Index muss als 'track' (ab 1) übergeben werden!\n";
    exit(1);
}

$sonos = new Network();
if ($ip) {
    $speaker = null;
    foreach ($sonos->getSpeakers() as $s) {
        if ($s->getIp() === $ip) {
            $speaker = $s;
            break;
        }
    }
    if (!$speaker) {
        echo "FEHLER: Speaker mit IP '$ip' nicht gefunden!\n";
        exit(1);
    }
    $controller = new \duncan3dc\Sonos\Controller($speaker, $sonos);
} else {
  $controller = $sonos->getControllerByRoom($room);
  if (!$controller) {
    echo "FEHLER: Raum '$room' nicht gefunden!\n";
    exit(1);
  }
}

$queue = $controller->getQueue();
$tracks = $queue->getTracks();
if ($trackIndex > count($tracks)) {
    echo "FEHLER: Track-Index $trackIndex ist außerhalb der Queue (max: " . count($tracks) . ")!\n";
    exit(1);
}

// Debug: Queue-Infos ausgeben
foreach ($tracks as $i => $t) {
    echo "Queue-Track " . ($i+1) . ": " . $t->getTitle() . " (" . $t->getUri() . ")\n";
}

// Queue als Quelle aktivieren
$controller->useQueue();
//sleep(1);
$controller->selectTrack($trackIndex-1);
try {
    $controller->play();
    echo "Versuche, die Queue im Raum '$room' zu starten.\n";
    echo "Falls der gewünschte Track nicht startet, bitte manuell mit 'next'/'previous' navigieren.\n";
} catch (Exception $e) {
    echo "FEHLER: " . $e->getMessage() . "\n";
    echo "Debug: UPnPError 711 bedeutet: 'Specified track is not available'. Prüfe die Queue und den Index!\n";
}

// Aktuellen Track ermitteln (URI)
$trackFile = $tracks[$trackIndex-1]->getUri();

// Nach erfolgreichem Setzen des MP3-Tracks: Titel über write_title.php registrieren
$writeTitleUrl = "http://localhost/music/sonos-music-client/write_title.php";
$ch2 = curl_init();
curl_setopt($ch2, CURLOPT_URL, $writeTitleUrl);
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_POSTFIELDS, http_build_query(['link' => $trackFile]));
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
$writeTitleResponse = curl_exec($ch2);
$writeTitleErr = curl_error($ch2);
$writeTitleHttpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);
// Logging der Antwort
if ($writeTitleResponse === false) {
  error_log('Fehler beim CURL-Aufruf von write_title.php: ' . $writeTitleErr);
} else {
  error_log('Antwort von write_title.php (CURL): ' . $writeTitleResponse . ' (HTTP-Code: ' . $writeTitleHttpCode . ')');
}
