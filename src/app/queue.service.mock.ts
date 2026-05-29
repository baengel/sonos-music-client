import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QueueServiceMock {
  private queueSubject = new BehaviorSubject<any[]>([
    { title: 'Mock Song 1', artist: 'Mock Artist', album: 'Mock Album', uri: 'mock://track1' },
    { title: 'Mock Song 2', artist: 'Mock Artist', album: 'Mock Album', uri: 'mock://track2' }
  ]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string>('');

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
    this.loadingSubject.next(true);
    setTimeout(() => {
      this.loadingSubject.next(false);
      this.queueSubject.next([
        { title: 'Mock Song 1', artist: 'Mock Artist', album: 'Mock Album', uri: 'mock://track1' },
        { title: 'Mock Song 2', artist: 'Mock Artist', album: 'Mock Album', uri: 'mock://track2' }
      ]);
    }, 500);
  }

  addToQueue(playerIp: string, trackUri: string): void {
    const current = this.queueSubject.value;
    this.queueSubject.next([...current, { title: 'Neuer Mock Song', artist: 'Mock Artist', album: 'Mock Album', uri: trackUri }]);
  }

  clearQueue(playerIp: string): Observable<any> {
    console.log("cleare queue");
    this.queueSubject.next([]);
    return of('OK');
  }

  removeFromQueue(playerIp: string, trackIndex: number): void {
    const current = this.queueSubject.value;
    if (trackIndex >= 0 && trackIndex < current.length) {
      const newQueue = [...current];
      newQueue.splice(trackIndex, 1);
      this.queueSubject.next(newQueue);
    }
  }

  getQueue(ip: string): Observable<any> {
    return of({ tracks: this.queueSubject.value });
  }

  removeFromQueueCall(ip: string, track: number) {
    return of('OK');
  }

  addToQueueCall(ip: string, uri: string, meta: string = ''): Observable<any> {
    return of('OK');
  }
}
