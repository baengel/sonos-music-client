<?php
// Prüfe, ob autoload.php existiert
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

echo "Sonos Geräte im Netzwerk finden:\n";

$sonos = new Network();

// Alle Controller anzeigen
foreach ($sonos->getControllers() as $controller) {
  echo $controller->getName() . "\n";
}

echo "\nSonos Lautsprecher im Netzwerk finden:\n";
foreach ($sonos->getSpeakers() as $s) {
  echo $s->getName() . " (" . $s->getIp() . ")\n";
}
