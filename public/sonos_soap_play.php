<?php
// sonos_soap_playonly.php
// Erwartet POST: ip (Sonos IP)

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Nur POST erlaubt']);
    exit;
}

$ip = isset($_POST['ip']) ? $_POST['ip'] : null;

if (!$ip) {
    http_response_code(400);
    echo json_encode(['error' => 'ip muss angegeben werden']);
    exit;
}

$soapUrl = "http://$ip:1400/MediaRenderer/AVTransport/Control";
$playAction = 'urn:schemas-upnp-org:service:AVTransport:1#Play';

$bodyPlay = '<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\n  <s:Body>\n    <u:Play xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">\n      <InstanceID>0</InstanceID>\n      <Speed>1</Speed>\n    </u:Play>\n  </s:Body>\n</s:Envelope>';

$headersPlay = [
    'HOST: ' . $ip . ':1400',
    'Accept: application/text',
    'Content-Type: text/xml; charset="utf-8"',
    'SOAPAction: "' . $playAction . '"',
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $soapUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyPlay);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headersPlay);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$responsePlay = curl_exec($ch);
$errPlay = curl_error($ch);
$httpcodePlay = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($errPlay || $httpcodePlay >= 400) {
    http_response_code(500);
    echo json_encode(['error' => 'Fehler bei Play', 'details' => $errPlay, 'httpcode' => $httpcodePlay, 'response' => $responsePlay]);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Play-Befehl gesendet']);

