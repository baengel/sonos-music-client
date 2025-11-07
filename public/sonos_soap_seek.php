<?php
// Sonos SOAP Seek und GetPositionInfo Script

// POST-Parameter einlesen (application/x-www-form-urlencoded oder application/json)
$raw = file_get_contents('php://input');
$data = [];
if (!empty($_POST)) {
    $data = $_POST;
} else if (!empty($raw)) {
    $json = json_decode($raw, true);
    if (is_array($json)) {
        $data = $json;
    }
}

$sonos_ip = isset($data['ip']) ? $data['ip'] : '192.168.188.34';
$duration = isset($data['duration']) ? $data['duration'] : '10';
$action = isset($data['action']) ? $data['action'] : 'seek';

$sonos_port = '1400';
$uri = "http://$sonos_ip:$sonos_port/MediaRenderer/AVTransport/Control";

// Hilfsfunktion: Sekunden zu hh:mm:ss
function secondsToHMS($seconds) {
    $seconds = intval($seconds);
    $h = floor($seconds / 3600);
    $m = floor(($seconds % 3600) / 60);
    $s = $seconds % 60;
    return sprintf('%02d:%02d:%02d', $h, $m, $s);
}

function sendSoapRequest($uri, $body, $soapAction) {
    $headers = [
        'HOST: ' . parse_url($uri, PHP_URL_HOST) . ':' . parse_url($uri, PHP_URL_PORT),
        'Accept: application/text',
        'Content-type: text/xml; charset="utf-8"',
        'SOAPACTION: "' . $soapAction . '"'
    ];

//    echo "body=$body\n";
    // Debug-Ausgabe kann optional bleiben
    // echo "call uri=$uri with action=$soapAction\n";
    $ch = curl_init($uri);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    if ($err) {
        return [false, $err];
    }
    return [true, $response];
}

// GetPositionInfo SOAP Body
$getPositionBody = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:GetPositionInfo xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><Channel>Master</Channel></u:GetPositionInfo></s:Body></s:Envelope>';
$getPositionAction = 'urn:schemas-upnp-org:service:AVTransport:1#GetPositionInfo';

if ($action === 'seek') {
    // 1. GetPositionInfo aufrufen
    list($ok, $result) = sendSoapRequest($uri, $getPositionBody, $getPositionAction);
    header('Content-Type: text/plain');
    if (!$ok) {
        echo "Fehler bei GetPositionInfo: $result";
        exit;
    }
//    echo "GetPositionInfo erfolgreich.\n";
//    echo $result . "\n";

    // 2. RelTime aus Antwort extrahieren
    $baseTime = null;
    if (preg_match('/<RelTime>([^<]*)<\/RelTime>/', $result, $matches)) {
        $baseTime = $matches[1];
    } else {
        echo "Konnte aktuelle Position nicht ermitteln.";
        exit;
    }

    // 3. $duration (Sekunden oder hh:mm:ss) zu Sekunden umwandeln
    $addSeconds = 0;
    if (is_numeric($duration)) {
        $addSeconds = intval($duration);
    } else if (preg_match('/^(\d{2}):(\d{2}):(\d{2})$/', $duration, $dMatch)) {
        $addSeconds = ($dMatch[1] * 3600) + ($dMatch[2] * 60) + $dMatch[3];
    }

    // 4. baseTime (hh:mm:ss, h:mm:ss, mm:ss, m:ss oder s) zu Sekunden
    $baseSeconds = 0;
    if (preg_match('/^(\d{1,2}):(\d{2}):(\d{2})$/', $baseTime, $bMatch)) {
        // h:mm:ss oder hh:mm:ss
        $baseSeconds = ($bMatch[1] * 3600) + ($bMatch[2] * 60) + $bMatch[3];
    } else if (preg_match('/^(\d{1,2}):(\d{2})$/', $baseTime, $bMatch)) {
        // mm:ss oder m:ss
        $baseSeconds = ($bMatch[1] * 60) + $bMatch[2];
    } else if (is_numeric($baseTime)) {
        $baseSeconds = intval($baseTime);
    } else {
        echo "Ungültiges RelTime-Format: $baseTime";
        exit;
    }

    // 5. Summieren und wieder zu hh:mm:ss
    $seekTarget = secondsToHMS($baseSeconds + $addSeconds);

    // Seek SOAP Body
    $seekBody = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:Seek xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><Target>' . htmlspecialchars($seekTarget) . '</Target><InstanceID>0</InstanceID><Unit>REL_TIME</Unit></u:Seek></s:Body></s:Envelope>';
    $seekAction = 'urn:schemas-upnp-org:service:AVTransport:1#Seek';

    // 6. Seek aufrufen
    list($ok, $result) = sendSoapRequest($uri, $seekBody, $seekAction);
    if ($ok) {
        echo "Seek erfolgreich.\n";
        echo $result;
    } else {
        echo "Fehler beim Seek: $result";
    }
} else {
    // 1. GetPositionInfo aufrufen
    list($ok, $result) = sendSoapRequest($uri, $getPositionBody, $getPositionAction);
    header('Content-Type: text/plain');
    if ($ok) {
        echo "GetPositionInfo erfolgreich.\n";
        echo $result;
    } else {
        echo "Fehler bei GetPositionInfo: $result";
    }
}
