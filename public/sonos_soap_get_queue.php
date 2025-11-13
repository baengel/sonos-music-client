<?php
// sonos_soap_get_queue.php
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$ip = null;
if ($method === 'GET') {
    if (isset($_GET['ip'])) {
        $ip = $_GET['ip'];
    }
} elseif ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (isset($data['ip'])) {
        $ip = $data['ip'];
    } elseif (isset($_POST['ip'])) {
        $ip = $_POST['ip'];
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Nur GET oder POST erlaubt']);
    exit;
}

if (!$ip) {
    http_response_code(400);
    echo json_encode(['error' => 'IP-Adresse fehlt!']);
    exit;
}

// SOAP-Request zum Auslesen der Queue
$soapBody = '
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"
            s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">
      <ObjectID>Q:0</ObjectID>
      <BrowseFlag>BrowseDirectChildren</BrowseFlag>
      <Filter>*</Filter>
      <StartingIndex>0</StartingIndex>
      <RequestedCount>100</RequestedCount>
      <SortCriteria></SortCriteria>
    </u:Browse>
  </s:Body>
</s:Envelope>';

$url = "http://$ip:1400/MediaServer/ContentDirectory/Control";

$options = [
    'http' => [
        'header'  => [
            "Content-type: text/xml; charset=utf-8",
            "SOAPACTION: \"urn:schemas-upnp-org:service:ContentDirectory:1#Browse\""
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
    // Extrahiere die Queue-Einträge aus der XML-Antwort
    $xml = simplexml_load_string($result);
    $xml->registerXPathNamespace('s', 'http://schemas.xmlsoap.org/soap/envelope/');
    $xml->registerXPathNamespace('u', 'urn:schemas-upnp-org:service:ContentDirectory:1');
    $xml->registerXPathNamespace('didl', 'urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/');
    $xml->registerXPathNamespace('dc', 'http://purl.org/dc/elements/1.1/');
    $xml->registerXPathNamespace('upnp', 'urn:schemas-upnp-org:metadata-1-0/upnp/');

    $resultNodes = $xml->xpath('//Result');
    $tracks = [];
    if ($resultNodes && count($resultNodes) > 0) {
        $didl = simplexml_load_string($resultNodes[0]);
        foreach ($didl->item as $item) {
            $track = [
                'title' => (string)$item->children('http://purl.org/dc/elements/1.1/')->title,
                'artist' => (string)$item->children('urn:schemas-upnp-org:metadata-1-0/upnp/')->artist,
                'album' => (string)$item->children('urn:schemas-upnp-org:metadata-1-0/upnp/')->album,
                'uri' => (string)$item->res
            ];
            $tracks[] = $track;
        }
    }
    echo json_encode(['success' => true, 'tracks' => $tracks]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
