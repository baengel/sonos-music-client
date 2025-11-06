# SonosMusicClient

copy dist/browser files to Web/music/sonos-music-client


# api 

https://github.com/duncan3dc/sonos/
install: composer require duncan3dc/sonos

bsp:

```php
<?php
use duncan3dc\Sonos\Network;

$sonos = new Network();
$controllers = $sonos->getControllers();

foreach ($controllers as $controller) {
    echo $controller->getRoom() . ": " . $controller->getState() . "\n";
    $controller->play();
}
?>
```

```php
<?php
use duncan3dc\Sonos\Cloud;
use duncan3dc\Sonos\Tracks\Stream;

require "vendor/autoload.php";

// Authentifizierung mit Sonos Cloud
$cloud = new Cloud("client_id", "client_secret", "redirect_uri");

// Player „Len“ finden
$player = $cloud->getControllerByRoom("Len");

// MP3-Stream vorbereiten
$track = new Stream("https://example.com/audio/song.mp3");

// Abspielen
$player->play($track);
?>
```
