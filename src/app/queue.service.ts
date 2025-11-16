import {Injectable} from '@angular/core';
import {SonosQueueResponse} from './sonos.service';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ApiBaseUrlService} from './api-base-url.service';
import {PlayerMapService} from './player-map.service';

@Injectable({providedIn: 'root'})
export class QueueService {
  private queueSubject = new BehaviorSubject<any[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string>('');

  constructor(private http: HttpClient,
              private apiBaseUrlService: ApiBaseUrlService,
              private playerMap: PlayerMapService) {
  }

  getQueue$(): Observable<any[]> {
    return this.queueSubject.asObservable();
  }

  getLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  getError$(): Observable<string> {
    return this.errorSubject.asObservable();
  }

  loadQueue(playerIp: string): void {
    if (!playerIp) return;
    this.loadingSubject.next(true);
    this.errorSubject.next('');
    this.getQueue(playerIp).subscribe({
      next: (data: any) => {
        this.queueSubject.next(data.tracks || []);
        this.loadingSubject.next(false);
      },
      error: () => {
        this.errorSubject.next('Fehler beim Laden der Queue');
        this.loadingSubject.next(false);
      }
    });
  }

  /**
   * Holt die aktuelle Queue des Players
   */
  getQueue(ip: string): Observable<SonosQueueResponse> {
    // GET-Request, damit es mit Proxy/Relay und direktem Aufruf funktioniert
    return this.http.get<SonosQueueResponse>(this.apiBaseUrlService.getApiBaseUrl() + 'sonos_soap_get_queue.php?ip=' + encodeURIComponent(ip));
  }

  private removeFromQueueCall(ip: string, track: number) {
    const url = this.apiBaseUrlService.getApiBaseUrl() + 'sonos_duncan_remove_from_queue.php';
    const body = {
      ip,
      room: this.playerMap.getRoomByIp(ip),
      track
    };
    return this.http.post(url, body, {responseType: 'text'});
  }

  removeFromQueue(playerIp: string, trackIndex: number): void {
    if (!playerIp) return;
    this.loadingSubject.next(true);
    this.removeFromQueueCall(playerIp, trackIndex).subscribe({
      next: () => {
        this.loadQueue(playerIp);
      },
      error: () => {
        this.errorSubject.next('Fehler beim Entfernen des Tracks');
        this.loadingSubject.next(false);
      }
    });
  }

  addToQueue(playerIp: string, trackUri: string): void {
    this.addToQueueCall(playerIp, trackUri).subscribe({
      next: () => {
        this.loadQueue(playerIp);
      },
      error: () => {
        this.errorSubject.next('Fehler beim Hinzufügen des Tracks');
      }
    });
  }

  private addToQueueCall(ip: string, uri: string, meta: string = ''): Observable<any> {
    const url = this.apiBaseUrlService.getApiBaseUrl() + 'sonos_duncan_add_mp3_to_queue.php';
    const body = {
      ip,
      room: this.playerMap.getRoomByIp(ip),
      file: uri
    };
    return this.http.post(url, body, {responseType: 'text'});
  }

  /**
   * Löscht die gesamte Queue des Players
   */
  clearQueue(playerIp: string): Observable<any> {
    return this.http.post(
      this.apiBaseUrlService.getApiBaseUrl() + 'sonos_duncan_clear_queue.php',
      { ip: playerIp },
      { responseType: 'text' }
    );
  }
}
