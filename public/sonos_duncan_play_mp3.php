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

// Raumname und Track-URL als Input-Parameter
$room = null;
$trackFile = null;
if (isset($_POST['room'])) {
  $room = $_POST['room'];
}
if (isset($_POST['file'])) {
  $trackFile = $_POST['file'];
}
if ($room === null || $trackFile === null) {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if ($room === null && isset($data['room'])) {
    $room = $data['room'];
  }
  if ($trackFile === null && isset($data['file'])) {
    $trackFile = $data['file'];
  }
}
if ($room !== null) $room = trim($room);
if ($trackFile !== null) $trackFile = trim($trackFile);
if (!$room) {
  echo "FEHLER: Raumname muss als 'room' übergeben werden!\n";
  echo "Debug: empfangener Wert: '" . ($room ?? '') . "'\n";
  exit(1);
}
if (!$trackFile) {
  echo "FEHLER: Track-File muss als 'file' übergeben werden!\n";
  echo "Debug: empfangener Wert: '" . ($trackFile ?? '') . "'\n";
  exit(1);
}

$sonos = new Network();
$controller = $sonos->getControllerByRoom($room);

// Queue aktivieren
if (!$controller->isUsingQueue()) {
  $controller->useQueue();
}

// Track hinzufügen (lokale Playlist oder URL)
$controller->getQueue()->addTrack($trackFile);

// Wiedergabe starten
$controller->play();
