<?php
// sonos_soap_clear_queue.php
header('Content-Type: application/json');

if (!isset($_POST['ip'])) {
    http_response_code(400);
    echo json_encode(['error' => 'IP-Adresse fehlt!']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Content-Type: application/json');
  http_response_code(405);
  echo json_encode(['error' => 'Nur POST erlaubt']);
  exit;
}

// Unterstützt sowohl application/x-www-form-urlencoded als auch application/json
$ip = null;
$file = null;

if (isset($_POST['ip'])) {
  $ip = $_POST['ip'];
} else {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (isset($data['ip'])) {
    $ip = $data['ip'];
  }
}

// SOAP-Request zum Löschen der Queue
$soapBody = '<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <RemoveAllTracksFromQueue xmlns="urn:schemas-upnp-org:service:AVTransport:1">
      <InstanceID>0</InstanceID>
    </RemoveAllTracksFromQueue>
  </s:Body>
</s:Envelope>';

$url = "http://$ip:1400/MediaRenderer/AVTransport/Control";

$options = [
    'http' => [
        'header'  => [
            "Content-type: text/xml; charset=utf-8",
            "SOAPACTION: \"urn:schemas-upnp-org:service:AVTransport:1#RemoveAllTracksFromQueue\""
        ],
        'method'  => 'POST',
        'content' => $soapBody,
        'timeout' => 5
    ]
];

$context  = stream_context_create($options);

try {
    $result = file_get_contents($url, false, $context);
    if ($result === FALSE) {
        throw new Exception('Fehler beim Senden des SOAP-Requests.');
    }
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

