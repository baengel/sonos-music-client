import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {SonosService} from './sonos.service';

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private playedSubject = new BehaviorSubject<any[]>([]);
  private playedSortedSubject = new BehaviorSubject<any[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  constructor(private sonosService: SonosService) {}

  getPlayed$(): Observable<any[]> {
    return this.playedSubject.asObservable();
  }

  getPlayedSorted$(): Observable<any[]> {
    return this.playedSortedSubject.asObservable();
  }

  getLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  getError$(): Observable<string | null> {
    return this.errorSubject.asObservable();
  }

  loadPlayedList(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    this.sonosService.getPlayedTitles().subscribe({
      next: (data) => {
        this.playedSubject.next(data);
        this.playedSortedSubject.next([...data].sort((a, b) => b.count - a.count));
        this.loadingSubject.next(false);
      },
      error: (err) => {
        this.errorSubject.next('Fehler beim Laden der Played List');
        this.loadingSubject.next(false);
      }
    });
  }
}
