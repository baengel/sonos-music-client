import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';


@Injectable({ providedIn: 'root' })
export class SonosService {
  constructor(private http: HttpClient) {}

  /**
   * Ermittelt die dynamische Basis-URL für API-Calls (inkl. Relay-Token, falls vorhanden)
   * Wenn im environment eine apiBaseUrl gesetzt ist, wird diese verwendet (z.B. lokal oder für Proxy).
   * Sonst wird Relay-Token-Logik oder Standard-Pfad genutzt.
   */
  private getApiBaseUrl(): string {
    if (window.location.hostname.startsWith('relay-')) {
      const match = window.location.pathname.match(/^\/([^\/]+)\//);
      if (match) {
        const token = match[1];
        return `/${token}${environment.apiBaseUrl}`;
      }
    }
    return environment.apiBaseUrl;
  }

  play(fileUrl: string, playerIp: string): Observable<any> {
    // return this.http.get(this.getApiBaseUrl() + 'hello.php');
    return this.http.post(this.getApiBaseUrl() + 'sonos_soap_play.php', {
      fileUrl,
      playerIp
    });
  }

  stop(playerIp: string): Observable<any> {
    return this.http.post(this.getApiBaseUrl() + 'sonos_soap_stop.php', {
      playerIp
    });
  }

  setVolume(playerIp: string, volume: number): Observable<any> {
    return this.http.post(this.getApiBaseUrl() + 'sonos_soap_volume.php', {
      playerIp,
      volume
    });
  }
}
