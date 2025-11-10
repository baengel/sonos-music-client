import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../environments/environment';

// TODO ids etmitteln http://<SONOS-IP>:1400/status or http://<sonos-ip>:1400/status/rincon.xml
const RINCON_ID_MAP: Record<string, string> = {
  '192.168.188.34': 'RINCON_7828CAB5D9D201400', // Len
  '192.168.188.43': 'RINCON_7828CAB5D9D202400', // Juna
  '192.168.188.35': 'RINCON_7828CAB5D9D203400', // Maxim
  '192.168.188.146': 'RINCON_7828CAB5D9D204400', // Kueche
  '192.168.188.86': 'RINCON_7828CAB5D9D205400', // Wohnzimmer
};

@Injectable({providedIn: 'root'})
export class SonosService {
  baseUrl: string | undefined = undefined;

  constructor(private http: HttpClient) {
  }

  /**
   * Ermittelt die dynamische Basis-URL für API-Calls (inkl. Relay-Token, falls vorhanden)
   * Wenn im environment eine apiBaseUrl gesetzt ist, wird diese verwendet (z.B. lokal oder für Proxy).
   * Sonst wird Relay-Token-Logik oder Standard-Pfad genutzt.
   */
  public getApiBaseUrl(): string {
    if (!this.baseUrl) {
      console.log("window.location.hostname=" + window.location.hostname);
      if (window.location.hostname.startsWith('relay-')) {
        console.log("evaluate token window.location.pathname=" + window.location.pathname);
        const match = window.location.pathname.match(/^\/([^\/]+)\//);
        if (match) {
          const token = match[1].trim();
          console.log("token=", token);
          this.baseUrl = `/${token}${environment.apiBaseUrl}`;
        } else {
          this.baseUrl = environment.apiBaseUrl;
        }
      } else if (window.location.hostname.startsWith('asustor')) {
        console.log("as environment.apiBaseUrl=", environment.apiBaseUrl);
        this.baseUrl = environment.apiBaseUrl.replace('www/', '');
        console.log("as this.baseUrl=", this.baseUrl);
      } else {
        console.log("else");
        this.baseUrl = environment.apiBaseUrl;
      }
    }

    console.log("this.baseUrl=", this.baseUrl);
    return this.baseUrl;
  }

  play(fileUrl: string, playerIp: string): void {
    this.http.post(this.getApiBaseUrl() + 'sonos_soap_set_mp3.php', {
      ip: playerIp,
      file: fileUrl
    }).subscribe({
      next: (response: any) => {
        console.log("MP3 set, now play it.");
        this.playOnly(playerIp);
      },
      error: (err) => {
        // Versuche, die Fehlermeldung aus dem Response-Body zu extrahieren, falls vorhanden
        if (err && err.error && err.error.error) {
          console.error('Fehler beim Setzen des MP3-Links 1:', err.error.error, err);
        } else if (err && err.error) {
          console.error('Fehler beim Setzen des MP3-Links 2:', err.error, err);
        } else {
          console.error('Fehler beim Setzen des MP3-Links 3:', err);
        }
      }
    });
  }

  playOnly(playerIp: string) {
    this.http.post(this.getApiBaseUrl() + 'sonos_soap_play.php', {
      ip: playerIp
    }).subscribe({
      next: () => {
        console.log('playing on player=' + playerIp);
      },
      error: (err) => {
        console.error('Fehler beim Abspielen:', err);
      }
    });
  }

  stop(ip: string): Observable<any> {
    return this.http.post(this.getApiBaseUrl() + 'sonos_soap_stop.php', {
      ip
    });
  }

  setVolume(ip: string, volume: number): Observable<any> {
    return this.http.post(this.getApiBaseUrl() + 'sonos_soap_volume.php', {
      ip,
      volume
    });
  }

  seek(ip: string, seconds: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post(this.getApiBaseUrl() + 'sonos_soap_seek.php', {
        ip,
        duration: seconds
      }).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  addToQueue(ip: string, uri: string, meta: string = '') {
    const url = '/public/sonos_soap_add_to_queue.php';
    const params = new URLSearchParams({ ip, uri, meta });
    return this.http.get(url + '?' + params.toString(), { responseType: 'text' });
  }

  setQueueAndPlay(ip: string, uri: string, track: number = 0) {
    // Setzt die Queue und spielt den ersten Track ab
    const url = '/public/sonos_soap_set_queue.php';
    const params = new URLSearchParams({ ip, rincon: this.getRinconId(ip), track: track.toString() });
    this.http.post(url, params, { responseType: 'text' }).subscribe({
      next: () => {
        this.playOnly(ip);
      },
      error: (err) => {
        console.error('Fehler beim Setzen der Queue:', err);
      }
    });
  }


  getRinconId(ip: string): string {
    // Ermittelt die RINCON-ID anhand der IP-Adresse
    return RINCON_ID_MAP[ip] || '';
  }

  playTrack(ip: string, track: number) {
    // Ruft das PHP-Skript zum Track-Wechsel auf
    return this.http.post('/public/sonos_soap_play_track.php', { ip, track }, { responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Track gewechselt:', response);
      },
      error: (err) => {
        console.error('Fehler beim Track-Wechsel:', err);
      }
    });
  }
}
