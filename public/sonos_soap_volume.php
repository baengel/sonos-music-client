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

// sonos_soap_volume.php
// Setzt die Lautstärke eines Sonos-Geräts per SOAP

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Nur POST erlaubt']);
    exit;
}

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['playerIp'], $input['volume'])) {
    http_response_code(400);
    echo json_encode(['error' => 'playerIp und volume erforderlich']);
    exit;
}

$playerIp = $input['playerIp'];
$volume = (int)$input['volume'];

$soapBody = '<?xml version="1.0" encoding="utf-8"?>\n'
    . '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">'
    . '<s:Body>'
    . '<u:SetVolume xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">'
    . '<InstanceID>0</InstanceID>'
    . '<Channel>Master</Channel>'
    . '<DesiredVolume>' . $volume . '</DesiredVolume>'
    . '</u:SetVolume>'
    . '</s:Body>'
    . '</s:Envelope>';

$url = "http://$playerIp:1400/MediaRenderer/RenderingControl/Control";

$options = [
    'http' => [
        'header'  => [
            "Content-type: text/xml; charset=utf-8",
            "SOAPACTION: \"urn:schemas-upnp-org:service:RenderingControl:1#SetVolume\""
        ],
        'method'  => 'POST',
        'content' => $soapBody,
        'timeout' => 5
    ]
];
$context  = stream_context_create($options);

$result = @file_get_contents($url, false, $context);

if ($result === FALSE) {
    http_response_code(502);
    echo json_encode(['error' => 'Fehler beim Senden des SOAP-Volume-Requests']);
    exit;
}

echo json_encode(['success' => true, 'response' => $result]);
