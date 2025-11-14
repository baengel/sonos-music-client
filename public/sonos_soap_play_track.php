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
$track = null;

if (isset($_POST['ip']) && isset($_POST['track'])) {
  $ip = $_POST['ip'];
  $track = $_POST['track'];
} else {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (isset($data['ip']) && isset($data['track'])) {
    $ip = $data['ip'];
    $track = $data['track'];
  }
}

if (!$ip || !$track) {
  header('Content-Type: application/json');
  http_response_code(400);
  echo json_encode(['error' => 'ip und track müssen angegeben werden']);
  exit;
}


$sonos_port = 1400;
$metadata = isset($_GET['meta']) ? $_GET['meta'] : '';
$instance_id = 0;
$desired_first_track = 0;
$enqueue_as_next = 0;

// SOAP XML Body
$soap_body = <<<XML
<s:Envelope
        xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"
        s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
            <u:Seek
                xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
                <InstanceID>
                    0
                    </InstanceID>
                <Unit>
                    TRACK_NR
                    </Unit>
                <Target>
                    $track
                    </Target>
                </u:Seek>
            </s:Body>
        </s:Envelope>
XML;

// Ziel-URL
$url = "http://$ip:$sonos_port/MediaRenderer/AVTransport/Control";

// Zusätzliche Sonos-Header aus POST/JSON übernehmen
$api_key = isset($_POST['api_key']) ? $_POST['api_key'] : (isset($data['api_key']) ? $data['api_key'] : '');
$corr_id = isset($_POST['corr_id']) ? $_POST['corr_id'] : (isset($data['corr_id']) ? $data['corr_id'] : '');
$target_udn = isset($_POST['target_udn']) ? $_POST['target_udn'] : (isset($data['target_udn']) ? $data['target_udn'] : '');

// Header
$headers = [
    'Content-Type: text/xml; charset="utf-8"',
    'SOAPACTION: "urn:schemas-upnp-org:service:AVTransport:1#Seek"'
];
if ($api_key) $headers[] = 'X-Sonos-Api-Key: ' . $api_key;
if ($corr_id) $headers[] = 'X-Sonos-Corr-Id: ' . $corr_id;
if ($target_udn) $headers[] = 'X-SONOS-TARGET-UDN: ' . $target_udn;

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
