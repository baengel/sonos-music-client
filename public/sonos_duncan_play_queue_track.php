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
$trackIndex = isset($_POST['track']) ? intval($_POST['track']) : null;
if ($room === null || $trackIndex === null) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if ($room === null && isset($data['room'])) {
        $room = trim($data['room']);
    }
    if ($trackIndex === null && isset($data['track'])) {
        $trackIndex = intval($data['track']);
    }
}
if (!$room) {
    echo "FEHLER: Raumname muss als 'room' übergeben werden!\n";
    exit(1);
}
if ($trackIndex === null || $trackIndex < 1) {
    echo "FEHLER: Track-Index muss als 'track' (ab 1) übergeben werden!\n";
    exit(1);
}

$sonos = new Network();
$controller = $sonos->getControllerByRoom($room);
if (!$controller) {
    echo "FEHLER: Raum '$room' nicht gefunden!\n";
    exit(1);
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
