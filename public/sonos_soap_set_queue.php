<?php
// sonos_soap_set_queue.php
// Setzt die Queue als Wiedergabequelle auf einem Sonos-Lautsprecher

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Content-Type: application/json');
  http_response_code(405);
  echo json_encode(['error' => 'Nur POST erlaubt']);
  exit;
}

$ip = null;
$rincon = null;
$track = 0;

if (isset($_POST['ip']) && isset($_POST['rincon'])) {
  $ip = $_POST['ip'];
  $rincon = $_POST['rincon'];
  if (isset($_POST['track'])) $track = intval($_POST['track']);
} else {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (isset($data['ip']) && isset($data['rincon'])) {
    $ip = $data['ip'];
    $rincon = $data['rincon'];
    if (isset($data['track'])) $track = intval($data['track']);
  }
}

if (!$ip || !$rincon) {
  header('Content-Type: application/json');
  http_response_code(400);
  // Debug-Ausgaben für Fehlersuche
  $debug = [
    '_POST' => $_POST,
    'php://input' => file_get_contents('php://input'),
    'parsed_json' => isset($data) ? $data : null
  ];
  echo json_encode([
    'error' => 'ip und rincon müssen angegeben werden',
    'debug' => $debug
  ]);
  exit;
}

$sonos_port = 1400;
$instance_id = 0;
$current_uri = "x-rincon-queue:$rincon#$track";
$current_uri_metadata = '';

$soap_body = <<<XML
 <s:Envelope
        xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"
        s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
            <u:AddURIToQueue
                xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
                <InstanceID>
                    $instance_id
                    </InstanceID>
                <EnqueuedURI>
                    $current_uri
                    </EnqueuedURI>
                <EnqueuedURIMetaData>
                    $current_uri_metadata
                    </EnqueuedURIMetaData>
                <DesiredFirstTrackNumberEnqueued>
                    0
                    </DesiredFirstTrackNumberEnqueued>
                <EnqueueAsNext>
                    0
                    </EnqueueAsNext>
                </u:AddURIToQueue>
            </s:Body>
        </s:Envelope>
XML;

$url = "http://$ip:$sonos_port/MediaRenderer/AVTransport/Control";
$headers = [
    'Content-Type: text/xml; charset="utf-8"',
    'SOAPACTION: "urn:schemas-upnp-org:service:AVTransport:1#SetAVTransportURI"'
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

