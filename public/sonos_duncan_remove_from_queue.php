<?php
$autoloadPath = __DIR__ . '/lib/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
  echo "FEHLER: vendor/autoload.php nicht gefunden!\n";
  echo "Bitte im Projektverzeichnis 'composer install' ausführen.\n";
  exit(1);
}
require $autoloadPath;

use duncan3dc\Sonos\Network;

// Raumname und Track-Nummer als Input-Parameter
$room = null;
$trackNumber = null;
if (isset($_POST['room'])) {
  $room = $_POST['room'];
}
if (isset($_POST['track'])) {
  $trackNumber = $_POST['track'];
}
if ($room === null || $trackNumber === null) {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if ($room === null && isset($data['room'])) {
    $room = $data['room'];
  }
  if ($trackNumber === null && isset($data['track'])) {
    $trackNumber = $data['track'];
  }
}
if ($room !== null) $room = trim($room);
if ($trackNumber !== null) $trackNumber = (int)trim($trackNumber);
if (!$room) {
  echo "FEHLER: Raumname muss als 'room' übergeben werden!\n";
  echo "Debug: empfangener Wert: '" . ($room ?? '') . "'\n";
  exit(1);
}
if (!$trackNumber) {
  echo "FEHLER: Track-Nummer muss als 'track' übergeben werden!\n";
  echo "Debug: empfangener Wert: '" . ($trackNumber ?? '') . "'\n";
  exit(1);
}

$sonos = new Network();
$controller = $sonos->getControllerByRoom($room);

// Queue aktivieren
if (!$controller->isUsingQueue()) {
  $controller->useQueue();
}

// Track aus der Queue entfernen
$controller->getQueue()->removeTrack($trackNumber - 1); // 0-basiert

echo json_encode(["success" => true, "removedTrack" => $trackNumber]);

