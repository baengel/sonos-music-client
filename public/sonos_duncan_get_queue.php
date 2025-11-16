<?php
$autoloadPath = __DIR__ . '/lib/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
  echo "FEHLER: vendor/autoload.php nicht gefunden!\n";
  echo "Bitte im Projektverzeichnis 'composer install' ausführen.\n";
  exit(1);
}
require $autoloadPath;

use duncan3dc\Sonos\Network;
use duncan3dc\Sonos\Controller;

// Raumname oder IP als GET-Parameter
$room = isset($_GET['room']) ? trim($_GET['room']) : null;
$ip = isset($_GET['ip']) ? trim($_GET['ip']) : null;

if (!$room && !$ip) {
    echo "FEHLER: Raumname oder IP muss als 'room' oder 'ip' übergeben werden!\n";
    exit(1);
}

if ($ip) {
  $controller = new \duncan3dc\Sonos\Controller($ip);
} else {
    $sonos = new Network();
    $controller = $sonos->getControllerByRoom($room);
    if (!$controller) {
        echo "FEHLER: Raum '$room' nicht gefunden!\n";
        exit(1);
    }
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
