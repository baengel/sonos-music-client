<?php
// Link aus POST oder JSON-Body lesen
$link = isset($_POST['link']) ? trim($_POST['link']) : '';
$datei = 'played_titles.txt';

if ($link === '') {
    // Prüfe ob JSON gesendet wurde
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (isset($data['link'])) {
        $link = trim($data['link']);
    }
}

if ($link === '') {
    echo "Link fehlt.";
    exit;
}

$linkListe = [];
if (file_exists($datei)) {
    $zeilen = file($datei, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($zeilen as $zeile) {
        list($url, $count) = explode('|', $zeile, 2);
        $linkListe[$url] = (int)$count;
    }
}

if (isset($linkListe[$link])) {
    $linkListe[$link]++;
} else {
    $linkListe[$link] = 1;
}

$fp = fopen($datei, 'w');
foreach ($linkListe as $url => $count) {
    fwrite($fp, $url . '|' . $count . "\n");
}
fclose($fp);

echo "gespeichert: $link ($linkListe[$link] mal)";
?>
