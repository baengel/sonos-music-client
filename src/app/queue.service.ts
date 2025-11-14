// ...existing code...
import {Injectable} from '@angular/core';
import {SonosService} from './sonos.service';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({providedIn: 'root'})
export class QueueService {
  private queueSubject = new BehaviorSubject<any[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string>('');

  constructor(private sonosService: SonosService) {
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
    this.sonosService.getQueue(playerIp).subscribe({
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

  removeFromQueue(playerIp: string, trackIndex: number): void {
    if (!playerIp) return;
    this.loadingSubject.next(true);
    this.sonosService.removeFromQueue(playerIp, trackIndex).subscribe({
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
    this.sonosService.addToQueue(playerIp, trackUri).subscribe({
      next: () => {
        this.loadQueue(playerIp);
      },
      error: () => {
        this.errorSubject.next('Fehler beim Hinzufügen des Tracks');
      }
    });
  }

}


