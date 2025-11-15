import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, tap, switchMap} from 'rxjs';
import {environment} from '../environments/environment';
import {PlayerMapService} from './player-map.service';

// TODO ids etmitteln http://<SONOS-IP>:1400/status or http://<sonos-ip>:1400/status/rincon.xml
const RINCON_ID_MAP: Record<string, string> = {
  '192.168.188.34': 'RINCON_7828CAB5D9D201400', // Len
  '192.168.188.43': 'RINCON_7828CAB5D82401400', // Juna
  '192.168.188.35': 'RINCON_7828CA0CD13A01400', // Maxim
  '192.168.188.146': 'RINCON_38420B10415001400', // Kueche // r: RINCON_7828CA0CC1C201400
  '192.168.188.86': 'RINCON_949F3ECAC7FD01400', // Wohnzimmer
};

@Injectable({providedIn: 'root'})
export class SonosService {
  baseUrl: string | undefined = undefined;

  constructor(private http: HttpClient,
              private playerMap: PlayerMapService) {
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

  play(fileUrl: string, playerIp: string) {
   return  this.http.post(this.getApiBaseUrl() + 'sonos_soap_set_mp3.php', {
      ip: playerIp,
      file: fileUrl
    }).pipe(
      tap(() => {
        console.log("MP3 set, now play it.");
      }),
      switchMap(() => this.playOnly(playerIp))
    );
  }

  playOnly(playerIp: string) {
    return this.http.post(this.getApiBaseUrl() + 'sonos_soap_play.php', {
      ip: playerIp
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

  addToQueue(ip: string, uri: string, meta: string = ''): Observable<any> {
    const url = this.getApiBaseUrl() + 'sonos_duncan_add_mp3_to_queue.php';
    const body = {
      ip,
      room: this.playerMap.getRoomByIp(ip),
      file: uri
    };
    return this.http.post(url, body, {responseType: 'text'});
  }

  setQueueAndPlay(ip: string, uri: string, track: number = 1) {
    // Setzt die Queue und spielt den gewünschten Track ab
    const url = this.getApiBaseUrl() + 'sonos_duncan_play_mp3.php';
    const body = {
      ip,
      room: this.playerMap.getRoomByIp(ip),
      file: uri,
      track
    };
    this.http.post(url, body, {responseType: 'text'}).subscribe({
      next: () => {
        this.playOnly(ip).subscribe();
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
    return this.http.post(this.getApiBaseUrl() + 'sonos_duncan_play_queue_track.php', {
      ip,
      room: this.playerMap.getRoomByIp(ip),
      track
    }, {responseType: 'text'});
  }

  /**
   * Holt den aktuellen Status des Players (Track, Titel, Position, Lautstärke)
   */
  getStatus(ip: string): Observable<any> {
    return this.http.get(this.getApiBaseUrl() + `sonos_status.php?ip=${ip}`);
  }

  /**
   * Holt die aktuelle Queue des Players
   */
  getQueue(ip: string): Observable<SonosQueueResponse> {
    // GET-Request, damit es mit Proxy/Relay und direktem Aufruf funktioniert
    return this.http.get<SonosQueueResponse>(this.getApiBaseUrl() + 'sonos_soap_get_queue.php?ip=' + encodeURIComponent(ip));
  }

  /**
   * Entfernt einen Track aus der Queue
   */
  removeFromQueue(ip: string, track: number) {
    const url = this.getApiBaseUrl() + 'sonos_duncan_remove_from_queue.php';
    const body = {
      ip,
      room: this.playerMap.getRoomByIp(ip),
      track
    };
    return this.http.post(url, body, {responseType: 'text'});
  }

  /**
   * Holt die Liste der zuletzt gespielten Titel
   */
  public getPlayedTitles(): Observable<any[]> {
    const url = this.getApiBaseUrl() + '/read_titles.php';
    return this.http.get<any[]>(url);
  }

  public mapIpToRoom(ip: string): string {
    return this.playerMap.getRoomByIp(ip);
  }
}

export interface SonosQueueTrack {
  title: string;
  artist: string;
  album: string;
  uri: string;
}

export interface SonosQueueResponse {
  success: boolean;
  tracks: SonosQueueTrack[];
}
