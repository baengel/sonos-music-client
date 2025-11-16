import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, switchMap, tap} from 'rxjs';
import {PlayerMapService} from './player-map.service';
import {ApiBaseUrlService} from './api-base-url.service';
import {QueueService} from './queue.service';

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
  constructor(private http: HttpClient,
              private playerMap: PlayerMapService,
              private queueService: QueueService,
              private apiBaseUrlService: ApiBaseUrlService) {
  }

  play(fileUrl: string, playerIp: string) {
    return this.http.post(this.apiBaseUrlService.getApiBaseUrl() + 'sonos_soap_set_mp3.php', {
      ip: playerIp,
      file: fileUrl
    }).pipe(
      tap(() => {
        console.log("MP3 set, now play it.");
      }),
      switchMap(() => this.playOnly(playerIp)),
      switchMap(() => this.queueService.getQueue(playerIp))
    );
  }

  playOnly(playerIp: string) {
    return this.http.post(this.apiBaseUrlService.getApiBaseUrl() + 'sonos_soap_play.php', {
      ip: playerIp
    }).pipe(
      switchMap(() => this.queueService.getQueue(playerIp))
    );
  }

  stop(ip: string): Observable<any> {
    return this.http.post(this.apiBaseUrlService.getApiBaseUrl() + 'sonos_soap_stop.php', {
      ip
    });
  }

  setVolume(ip: string, volume: number): Observable<any> {
    return this.http.post(this.apiBaseUrlService.getApiBaseUrl() + 'sonos_soap_volume.php', {
      ip,
      volume
    });
  }

  seek(ip: string, seconds: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post(this.apiBaseUrlService.getApiBaseUrl() + 'sonos_soap_seek.php', {
        ip,
        duration: seconds
      }).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  setQueueAndPlay(ip: string, uri: string, track: number = 1) {
    const url = this.apiBaseUrlService.getApiBaseUrl() + 'sonos_duncan_play_mp3.php';
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
    return RINCON_ID_MAP[ip] || '';
  }

  playTrack(ip: string, track: number) {
    return this.http.post(this.apiBaseUrlService.getApiBaseUrl() + 'sonos_duncan_play_queue_track.php', {
      ip,
      room: this.playerMap.getRoomByIp(ip),
      track
    }, {responseType: 'text'}).pipe(
      switchMap(() => this.queueService.getQueue(ip))
    );
  }

  /**
   * Holt den aktuellen Status des Players (Track, Titel, Position, Lautstärke)
   */
  getStatus(ip: string): Observable<SonosStatus> {
    return this.http.get<SonosStatus>(this.apiBaseUrlService.getApiBaseUrl() + `sonos_status.php?ip=${ip}`);
  }


  /**
   * Holt die Liste der zuletzt gespielten Titel
   */
  public getPlayedTitles(): Observable<any[]> {
    const url = this.apiBaseUrlService.getApiBaseUrl() + '/read_titles.php';
    return this.http.get<any[]>(url);
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

export interface SonosStatus {
  track: string;
  position: string;
  title: string;
  volume: string;
}
