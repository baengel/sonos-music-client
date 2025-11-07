import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../environments/environment';


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
      } else if (window.location.pathname.startsWith('asustor')) {
        this.baseUrl = environment.apiBaseUrl.replace('www/', '');
      } else {
        this.baseUrl = environment.apiBaseUrl;
      }
    }

    console.log("this.baseUrl=", this.baseUrl);
    return this.baseUrl;
  }

  play(fileUrl: string, playerIp: string): void {
    // return this.http.get(this.getApiBaseUrl() + 'hello.php');
    this.http.post(this.getApiBaseUrl() + 'sonos_soap_set_mp3.php', {
      fileUrl,
      playerIp
    }).subscribe(response => {
      return this.http.post(this.getApiBaseUrl() + 'sonos_soap_play.php', {
        playerIp
      }).subscribe({
        next: () => {
          console.log('Erfolgreich gestartet!');
          // Optional: Erfolgs-Benachrichtigung anzeigen
        },
        error: (err) => {
          console.error('Fehler beim Abspielen:', err);
        }
      });
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
