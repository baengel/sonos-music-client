<?php
// Waehlt einen zufaelligen Song aus files_and_size.txt und startet die Wiedergabe.

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Nur GET erlaubt']);
    exit;
}

$ip = isset($_GET['ip']) ? trim($_GET['ip']) : '';
$source = isset($_GET['source']) ? trim($_GET['source']) : '/www/music/files_and_size.txt';
$maxAttempts = 2;

if ($ip === '') {
    http_response_code(400);
    echo json_encode(['error' => 'ip muss angegeben werden']);
    exit;
}

function readSourceContent(string $source): array
{
    // Direkt vom Filesystem lesen: /www/music/files_and_size.txt
    $path = __DIR__ . '/../files_and_size.txt';

    $content = @file_get_contents($path);
    if ($content === false) {
        return [false, '', 'Nicht lesbar: ' . $path];
    }

    return [true, $content, null];
}

function extractTrackPath(string $line): ?string
{
    $line = trim($line);
    if ($line === '') {
        return null;
    }

    // Unterstuetzt "pfad|groesse".
    if (strpos($line, '|') !== false) {
        $parts = explode('|', $line, 2);
        $line = trim($parts[0]);
    }

    // Unterstuetzt ls -l Ausgabezeilen und holt den absoluten Pfad.
    if (preg_match('/(\/volume1\/.*)$/', $line, $m)) {
        return trim($m[1]);
    }

    if (preg_match('/\s(\/.*)$/', $line, $m)) {
        return trim($m[1]);
    }

    if (strpos($line, '/') === 0 || strpos($line, 'x-file-cifs://') === 0) {
        return $line;
    }

    return null;
}

function parseTracks(string $content): array
{
    $rows = preg_split('/\r\n|\r|\n/', $content);
    $tracks = [];

    foreach ($rows as $row) {
        $track = extractTrackPath($row);
        if ($track !== null && $track !== '') {
            $tracks[] = $track;
        }
    }

    return array_values(array_unique($tracks));
}

function buildLocalUrl(string $scriptName): string
{
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $dir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
    $dir = rtrim($dir, '/');

    if ($dir === '' || $dir === '.') {
        return $scheme . '://' . $host . '/' . $scriptName;
    }

    return $scheme . '://' . $host . $dir . '/' . $scriptName;
}

function postForm(string $url, array $data): array
{
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'ok' => $error === '' && $httpCode > 0 && $httpCode < 400,
        'httpCode' => $httpCode,
        'error' => $error,
        'response' => is_string($response) ? $response : '',
    ];
}

[$sourceOk, $content, $sourceError] = readSourceContent($source);
if (!$sourceOk) {
    http_response_code(500);
    echo json_encode(['error' => $sourceError, 'source' => $source]);
    exit;
}

$tracks = parseTracks($content);
if (count($tracks) === 0) {
    http_response_code(500);
    echo json_encode(['error' => 'Keine gueltigen Tracks gefunden', 'source' => $source]);
    exit;
}

$setMp3Url = buildLocalUrl('sonos_soap_set_mp3.php');
$playUrl = buildLocalUrl('sonos_soap_play.php');

$usedIndexes = [];
$attempts = [];
$success = false;

for ($attempt = 1; $attempt <= min($maxAttempts, count($tracks)); $attempt++) {
    $available = [];
    for ($i = 0; $i < count($tracks); $i++) {
        if (!isset($usedIndexes[$i])) {
            $available[] = $i;
        }
    }

    if (count($available) === 0) {
        break;
    }

    $pickedPos = random_int(0, count($available) - 1);
    $pickedIndex = $available[$pickedPos];
    $usedIndexes[$pickedIndex] = true;

    $trackFile = $tracks[$pickedIndex];

    $setResult = postForm($setMp3Url, [
        'ip' => $ip,
        'file' => $trackFile,
    ]);

    $playResult = null;
    $attemptOk = false;

    if ($setResult['ok']) {
        $playResult = postForm($playUrl, ['ip' => $ip]);
        $attemptOk = $playResult['ok'];
    }

    $attempts[] = [
        'attempt' => $attempt,
        'trackFile' => $trackFile,
        'setMp3' => [
            'ok' => $setResult['ok'],
            'httpCode' => $setResult['httpCode'],
            'error' => $setResult['error'],
            'responseSnippet' => substr($setResult['response'], 0, 280),
        ],
        'play' => $playResult === null ? null : [
            'ok' => $playResult['ok'],
            'httpCode' => $playResult['httpCode'],
            'error' => $playResult['error'],
            'responseSnippet' => substr($playResult['response'], 0, 280),
        ],
    ];

    if ($attemptOk) {
        $success = true;
        break;
    }
}

if ($success) {
    echo json_encode([
        'success' => true,
        'ip' => $ip,
        'source' => $source,
        'attempts' => $attempts,
    ]);
    exit;
}

http_response_code(502);
echo json_encode([
    'success' => false,
    'error' => 'Alle Set/Play-Versuche fehlgeschlagen',
    'ip' => $ip,
    'source' => $source,
    'attempts' => $attempts,
]);



