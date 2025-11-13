<?php
// sonos_soap_remove_from_queue.php
// Entfernt einen Track aus der Sonos-Queue

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Content-Type: application/json');
  http_response_code(405);
  echo json_encode(['error' => 'Nur POST erlaubt']);
  exit;
}

$ip = null;
$track = null;

if (isset($_POST['ip']) && isset($_POST['track'])) {
  $ip = $_POST['ip'];
  $track = intval($_POST['track']);
} else {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (isset($data['ip']) && isset($data['track'])) {
    $ip = $data['ip'];
    $track = intval($data['track']);
  }
}

if (!$ip || $track === null) {
  header('Content-Type: application/json');
  http_response_code(400);
  $debug = [
    '_POST' => $_POST,
    'php://input' => file_get_contents('php://input'),
    'parsed_json' => isset($data) ? $data : null
  ];
  echo json_encode([
    'error' => 'ip und track müssen angegeben werden',
    'debug' => $debug
  ]);
  exit;
}

$sonos_port = 1400;
$instance_id = 0;
$object_id = $track + 1; // Sonos Queue ist 1-basiert

$soap_body = <<<XML
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:RemoveTrackFromQueue xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
      <InstanceID>$instance_id</InstanceID>
      <ObjectID>$object_id</ObjectID>
    </u:RemoveTrackFromQueue>
  </s:Body>
</s:Envelope>
XML;

$url = "http://$ip:$sonos_port/MediaRenderer/AVTransport/Control";
$headers = [
    'Content-Type: text/xml; charset="utf-8"',
    'SOAPACTION: "urn:schemas-upnp-org:service:AVTransport:1#RemoveTrackFromQueue"'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $soap_body);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

header('Content-Type: text/plain; charset=utf-8');
if ($error) {
    echo "Fehler beim Senden des SOAP-Requests: $error\n";
} else {
    echo "SOAP-Request gesendet. Antwort:\n\n";
    echo $response;
}
?>

