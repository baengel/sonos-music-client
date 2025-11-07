<?php
// sonos_soap_play.php
// Erwartet POST: ip (Sonos IP), file (MP3-URL)

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Nur POST erlaubt']);
    exit;
}

$ip = isset($_POST['ip']) ? $_POST['ip'] : null;
$file = isset($_POST['file']) ? $_POST['file'] : null;

if (!$ip || !$file) {
    http_response_code(400);
    echo json_encode(['error' => 'ip und file müssen angegeben werden']);
    exit;
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
$body = '<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\n  <s:Body>\n    <u:SetAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">\n      <InstanceID>0</InstanceID>\n      <CurrentURI>' . htmlspecialchars($file) . '</CurrentURI>\n      <CurrentURIMetaData>' . htmlspecialchars($didl) . '</CurrentURIMetaData>\n    </u:SetAVTransportURI>\n  </s:Body>\n</s:Envelope>';

$headers = [
    'HOST: ' . $ip . ':1400',
    'Accept: application/text',
    'Content-Type: text/xml; charset="utf-8"',
    'SOAPAction: "' . $soapAction . '"',
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $soapUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$err = curl_error($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($err || $httpcode >= 400) {
    http_response_code(500);
    echo json_encode(['error' => 'Fehler bei SetAVTransportURI', 'details' => $err, 'httpcode' => $httpcode, 'response' => $response]);
    exit;
}

echo json_encode(['success' => true, 'message' => 'SetAVTransportURI erfolgreich']);
