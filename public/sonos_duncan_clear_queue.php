<?php
$autoloadPath = __DIR__ . '/lib/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
  echo json_encode(['success' => false, 'error' => 'vendor/autoload.php nicht gefunden!']);
  exit(1);
}
require $autoloadPath;

use duncan3dc\Sonos\Network;

// Fehlerausgabe aktivieren
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$room = null;
$ip = null;
$trackFile = null;
if (isset($_POST['room'])) {
  $room = $_POST['room'];
}
if (isset($_POST['ip'])) {
  $ip = $_POST['ip'];
}
if ($room === null && $ip === null) {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if ($room === null && isset($data['room'])) {
    $room = $data['room'];
  }
  if ($ip === null && isset($data['ip'])) {
    $ip = $data['ip'];
  }
}
if ($room !== null) $room = trim($room);
if ($ip !== null) $ip = trim($ip);
if (!$room && !$ip) {
  echo "FEHLER: Raumname ('room') oder IP-Adresse ('ip') muss übergeben werden!\n";
  exit(1);
}

try {
  echo "get controller\n";

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


  echo "queue activate\n";
  if (!$controller->isUsingQueue()) {
    $controller->useQueue();
  }


  echo "Track aus der Queue entfernen\n";
  $controller->getQueue()->clear();
  echo json_encode(['success' => true]);

} catch (Throwable $e) {
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

