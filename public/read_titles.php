<?php
$datei = 'played_titles.txt';
$setMp3Url = 'sonos_soap_set_mp3.php'; // Relativer Pfad zum Endpunkt

if (!file_exists($datei)) {
  echo "Keine Links gespeichert.";
  exit;
}

$zeilen = file($datei, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
echo "<ul>";
foreach ($zeilen as $zeile) {
  list($url, $count) = explode('|', $zeile, 2);
  $href = $setMp3Url . '?file=' . urlencode($url);
  // Nur Dateiname als Link-Text anzeigen
  $filename = basename($url);
  echo "<li><a href='" . htmlspecialchars($href) . "'>" . htmlspecialchars($filename) . "</a>" . $count . "</li>";
}
echo "</ul>";
?>
