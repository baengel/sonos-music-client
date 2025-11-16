<?php
$autoloadPath = __DIR__ . '/lib/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
  echo "FEHLER: vendor/autoload.php nicht gefunden!\n";
  echo "Bitte im Projektverzeichnis 'composer install' ausführen.\n";
  exit(1);
}
//echo "vendor/autoload.php gefunden und wird geladen...\n";
require $autoloadPath;

use duncan3dc\Sonos\Network;

// Raumname und Track-URL als Input-Parameter
$room = null;
$ip = null;
$trackFile = null;
if (isset($_POST['room'])) {
  $room = $_POST['room'];
}
if (isset($_POST['ip'])) {
  $ip = $_POST['ip'];
}
if (isset($_POST['file'])) {
  $trackFile = $_POST['file'];
}
if (($room === null && $ip === null) || $trackFile === null) {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if ($room === null && isset($data['room'])) {
    $room = $data['room'];
  }
  if ($ip === null && isset($data['ip'])) {
    $ip = $data['ip'];
  }
  if ($trackFile === null && isset($data['file'])) {
    $trackFile = $data['file'];
  }
}
if ($room !== null) $room = trim($room);
if ($ip !== null) $ip = trim($ip);
if ($trackFile !== null) $trackFile = trim($trackFile);
if (!$room && !$ip) {
  echo "FEHLER: Raumname ('room') oder IP-Adresse ('ip') muss übergeben werden!\n";
  exit(1);
}
if (!$trackFile) {
  echo "FEHLER: Track-File muss als 'file' übergeben werden!\n";
  exit(1);
}

// Pfad-Konvertierung: /volume1/ → x-file-cifs://asustor/
if (strpos($trackFile, '/volume1/') === 0) {
  $trackFile = 'x-file-cifs://asustor/' . substr($trackFile, strlen('/volume1/'));
}

$sonos = new Network();
if ($ip) {
  // Controller direkt per IP suchen
  $controller = null;
  foreach ($sonos->getControllers() as $c) {
    if ($c->getIp() === $ip) {
      $controller = $c;
      break;
    }
  }
  if (!$controller) {
    echo "FEHLER: Controller mit IP '$ip' nicht gefunden!\n";
    exit(1);
  }
} else {
  $controller = $sonos->getControllerByRoom($room);
  if (!$controller) {
    echo "FEHLER: Raum '$room' nicht gefunden!\n";
    exit(1);
  }
}

// Queue aktivieren
if (!$controller->isUsingQueue()) {
  $controller->useQueue();
}

// Track hinzufügen (lokale Playlist oder URL)
$controller->getQueue()->addTrack($trackFile);
