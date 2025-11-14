<?php
$autoloadPath = __DIR__ . '/lib/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
  echo "FEHLER: vendor/autoload.php nicht gefunden!\n";
  echo "Bitte im Projektverzeichnis 'composer install' ausführen.\n";
  exit(1);
}
require $autoloadPath;

use duncan3dc\Sonos\Network;

// Raumname als GET-Parameter
$room = isset($_GET['room']) ? trim($_GET['room']) : null;
if (!$room) {
    echo "FEHLER: Raumname muss als 'room' übergeben werden!\n";
    echo "Debug: empfangener Wert: '" . ($room ?? '') . "'\n";
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

header('Content-Type: application/json; charset=utf-8');
$result = [];
foreach ($tracks as $i => $track) {
    $result[] = [
        'index' => $i+1,
        'title' => $track->getTitle(),
        'uri' => $track->getUri(),
    ];
}
echo json_encode([
    'room' => $room,
    'success' => true,
    'tracks' => $result
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
