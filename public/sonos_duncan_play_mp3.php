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
