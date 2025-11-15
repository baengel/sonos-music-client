<?php
// sonos_soap_play.php
// Erwartet POST: ip (Sonos IP), file (MP3-URL)

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    http_response_code(405);
    echo json_encode(['error' => 'Nur POST erlaubt']);
    exit;
}

// Unterstützt sowohl application/x-www-form-urlencoded als auch application/json
$ip = null;
$file = null;

if (isset($_POST['ip']) && isset($_POST['file'])) {
    $ip = $_POST['ip'];
    $file = $_POST['file'];
} else {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (isset($data['ip']) && isset($data['file'])) {
        $ip = $data['ip'];
        $file = $data['file'];
    }
}

if (!$ip || !$file) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => 'ip und file müssen angegeben werden']);
    exit;
}

// Pfad für Sonos umwandeln: /volume1/ -> x-file-cifs://asustor/
if (strpos($file, '/volume1/') === 0) {
    $file = 'x-file-cifs://asustor/' . substr($file, strlen('/volume1/'));
}

// Titel aus Dateiname extrahieren
$pathParts = pathinfo($file);
$title = isset($pathParts['filename']) ? $pathParts['filename'] : 'Track';

// DIDL-Lite Metadaten generieren
$didl = '<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">'
    . '<item>'
    . '<dc:title>' . htmlspecialchars($title) . '</dc:title>'
    . '<dc:creator>null</dc:creator>'
    . '<dc:albumArtist>null</dc:albumArtist>'
    . '<upnp:album>null</upnp:album>'
    . '<upnp:albumArtURI>null</upnp:albumArtURI>'
    . '</item>'
    . '</DIDL-Lite>';

$soapUrl = "http://$ip:1400/MediaRenderer/AVTransport/Control";
$soapAction = 'urn:schemas-upnp-org:service:AVTransport:1#SetAVTransportURI';

// 1. SetAVTransportURI
$body = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:SetAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><CurrentURI>' . htmlspecialchars($file) . '</CurrentURI><CurrentURIMetaData>' . htmlspecialchars($didl) . '</CurrentURIMetaData></u:SetAVTransportURI></s:Body></s:Envelope>';

$headersArr = [
    'HOST: ' . $ip . ':1400',
    'Accept: application/text',
    'Content-Type: text/xml; charset="utf-8"',
    'SOAPACTION: "' . $soapAction . '"'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $soapUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headersArr);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$err = curl_error($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

//echo 'response: ' . $response . "\n";
//echo '$err: ' . $err . "\n";
//echo '$httpcode: ' . $httpcode . "\n";

// Vor der finalen Ausgabe nur noch JSON!
header('Content-Type: application/json');
if ($err || $httpcode >= 400) {
    http_response_code(500);
    echo json_encode(['error' => 'Fehler bei SetAVTransportURI', 'details' => $err, 'httpcode' => $httpcode, 'response' => $response]);
    exit;
}

// Nach erfolgreichem Setzen des MP3-Tracks: Titel über write_title.php registrieren
$writeTitleUrl = "http://localhost/music/sonos-music-client/write_title.php";
$ch2 = curl_init();
curl_setopt($ch2, CURLOPT_URL, $writeTitleUrl);
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_POSTFIELDS, http_build_query(['link' => $file]));
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

echo json_encode(['success' => true, 'message' => 'SetAVTransportURI erfolgreich']);
