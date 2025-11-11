<?php
// sonos_status.php
// Liest Track, Position, Titel und Lautstärke eines Sonos-Lautsprechers per IP aus

header('Content-Type: application/json; charset=utf-8');

$ip = isset($_GET['ip']) ? $_GET['ip'] : '';
if (!$ip) {
    echo json_encode(['error' => 'ip Parameter fehlt']);
    exit;
}
$port = 1400;

function sendSoap($ip, $port, $service, $action, $body) {
    $servicePath = ($service === 'AVTransport' || $service === 'RenderingControl')
        ? "MediaRenderer/$service/Control"
        : "$service/Control";
    $url = "http://$ip:$port/$servicePath";
    $xml = '<?xml version="1.0" encoding="utf-8"?>'
        . '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">'
        . '<s:Body>' . $body . '</s:Body>'
        . '</s:Envelope>';
    $headers = [
        'Content-Type: text/xml; charset="utf-8"',
        'SOAPACTION: "urn:schemas-upnp-org:service:' . $service . ':1#' . $action . '"'
    ];
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $xml);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    if ($error) return false;
    return $response;
}

// 1. Track-Infos holen
$trackInfoBody = '<u:GetPositionInfo xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID></u:GetPositionInfo>';
$trackInfoXml = sendSoap($ip, $port, 'AVTransport', 'GetPositionInfo', $trackInfoBody);

// 2. Lautstärke holen
$volumeBody = '<u:GetVolume xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1"><InstanceID>0</InstanceID><Channel>Master</Channel></u:GetVolume>';
$volumeXml = sendSoap($ip, $port, 'RenderingControl', 'GetVolume', $volumeBody);

// 3. XML parsen
function getTag($xml, $tag) {
    if (!$xml) return '';
    if (preg_match('/<' . $tag . '>(.*?)<\/' . $tag . '>/s', $xml, $m)) return $m[1];
    return '';
}

$result = [
    'track' => getTag($trackInfoXml, 'Track'),
    'position' => getTag($trackInfoXml, 'RelTime'),
    'title' => getTag($trackInfoXml, 'TrackMetaData'), // Titel ggf. aus MetaData extrahieren
    'volume' => getTag($volumeXml, 'CurrentVolume'),
];

// Titel aus TrackMetaData extrahieren (DIDL-Lite)
if ($result['title']) {
    $metaDecoded = html_entity_decode($result['title']);
    if (preg_match('/<dc:title>(.*?)<\/dc:title>/', $metaDecoded, $m)) {
        $result['title'] = $m[1];
    } else {
        $result['title'] = '';
    }
}

// Fehlerbehandlung
if (!$trackInfoXml && !$volumeXml) {
    echo json_encode(['error' => 'Keine Antwort von Sonos']);
    exit;
}

// Debug-Ausgabe der Roh-XML-Antworten
if (isset($_GET['debug'])) {
    echo json_encode([
        'trackInfoXml' => $trackInfoXml,
        'volumeXml' => $volumeXml
    ], JSON_PRETTY_PRINT);
    exit;
}

echo json_encode($result);
?>
