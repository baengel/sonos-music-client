<?php
// sonos_soap_add_to_queue.php

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


$sonos_port = 1400;
$metadata = isset($_GET['meta']) ? $_GET['meta'] : '';
$instance_id = 0;
$desired_first_track = 0;
$enqueue_as_next = 0;

// SOAP XML Body
$soap_body = <<<XML
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:AddURIToQueue xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
      <InstanceID>$instance_id</InstanceID>
      <EnqueuedURI>$file</EnqueuedURI>
      <EnqueuedURIMetaData>$metadata</EnqueuedURIMetaData>
      <DesiredFirstTrackNumberEnqueued>$desired_first_track</DesiredFirstTrackNumberEnqueued>
      <EnqueueAsNext>$enqueue_as_next</EnqueueAsNext>
    </u:AddURIToQueue>
  </s:Body>
</s:Envelope>
XML;

// Ziel-URL
$url = "http://$ip:$sonos_port/MediaRenderer/AVTransport/Control";

// Header
$headers = [
    'Content-Type: text/xml; charset="utf-8"',
    'SOAPACTION: "urn:schemas-upnp-org:service:AVTransport:1#AddURIToQueue"'
];

// cURL initialisieren
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $soap_body);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

// Ausgabe
header('Content-Type: text/plain; charset=utf-8');
if ($error) {
    echo "Fehler beim Senden des SOAP-Requests: $error\n";
} else {
    echo "SOAP-Request gesendet. Antwort:\n\n";
    echo $response;
}
?>

