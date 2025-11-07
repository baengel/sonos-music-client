<?php
$allowed_origins = [
    'https://relay-eu2.ezconnect.to',
    'https://baengel.ezconnect.to'
];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// sonos_soap_stop.php
// Sendet einen SOAP-Stop-Befehl an ein Sonos-Gerät

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Nur POST erlaubt']);
    exit;
}

header('Content-Type: application/json');

// Akzeptiere nur 'ip' (nicht mehr 'playerIp') als Parameter
$ip = null;
if (isset($_POST['ip'])) {
  $ip = $_POST['ip'];
} else {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (isset($data['ip'])) {
    $ip = $data['ip'];
  }
}

if (!$ip) {
    http_response_code(400);
    echo json_encode(['error' => 'ip erforderlich']);
    exit;
}

$soapBody = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">'
    . '<s:Body>'
    . '<u:Stop xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">'
    . '<InstanceID>0</InstanceID>'
    . '</u:Stop>'
    . '</s:Body>'
    . '</s:Envelope>';

$url = "http://$ip:1400/MediaRenderer/AVTransport/Control";

$headersArr = [
    'HOST: ' . $ip . ':1400',
    'Accept: application/text',
    'Content-type: text/xml; charset="utf-8"',
    'SOAPACTION: urn:schemas-upnp-org:service:AVTransport:1#Stop'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $soapBody);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headersArr);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$err = curl_error($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($err || $httpcode >= 400) {
    http_response_code(502);
    echo json_encode(['error' => 'Fehler beim Senden des SOAP-Stop-Requests', 'details' => $err, 'httpcode' => $httpcode, 'response' => $response]);
    exit;
}

echo json_encode(['success' => true, 'response' => $response]);
