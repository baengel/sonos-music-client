<?php
$datei = 'played_titles.txt';
$setMp3Url = 'sonos_soap_set_mp3.php'; // Relativer Pfad zum Endpunkt

header('Content-Type: application/json');

if (!file_exists($datei)) {
  echo json_encode([]);
  exit;
}

$zeilen = file($datei, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$result = [];
foreach ($zeilen as $zeile) {
  list($url, $count) = explode('|', $zeile, 2);
  $filename = basename($url);
  $result[] = [
    'fileUrl' => $url,
    'title' => $filename,
    'count' => (int)$count
  ];
}
echo json_encode($result);
?>
