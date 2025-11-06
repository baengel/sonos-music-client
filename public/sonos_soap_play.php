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

// sonos_soap_play.php
// Ruft einen SOAP-Call an ein Sonos-Gerät ab, um eine MP3-Datei abzuspielen

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    exit;
}

header('Content-Type: application/json');

// Erwartet: fileUrl und playerIp als POST-Parameter (JSON)
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['fileUrl'], $input['playerIp'])) {
    http_response_code(400);
    echo json_encode(['error' => 'fileUrl und playerIp erforderlich']);
    exit;
}

$fileUrl = $input['fileUrl'];
$playerIp = $input['playerIp'];

$soapBody = '<?xml version="1.0" encoding="utf-8"?>\n'
    . '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">'
    . '<s:Body>'
    . '<u:SetAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">'
    . '<InstanceID>0</InstanceID>'
    . '<CurrentURI>' . htmlspecialchars($fileUrl, ENT_XML1) . '</CurrentURI>'
    . '<CurrentURIMetaData></CurrentURIMetaData>'
    . '</u:SetAVTransportURI>'
    . '</s:Body>'
    . '</s:Envelope>';

$url = "http://$playerIp:1400/MediaRenderer/AVTransport/Control";

$options = [
    'http' => [
        'header'  => [
            "Content-type: text/xml; charset=utf-8",
            "SOAPACTION: \"urn:schemas-upnp-org:service:AVTransport:1#SetAVTransportURI\""
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
    echo json_encode(['error' => 'Fehler beim Senden des SOAP-Requests']);
    exit;
}

echo json_encode(['success' => true, 'response' => $result]);
