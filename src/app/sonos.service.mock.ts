import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SonosQueueTrack, SonosQueueResponse } from './sonos.service';

@Injectable({ providedIn: 'root' })
export class SonosServiceMock {
  baseUrl: string | undefined = undefined;
  private queue: SonosQueueTrack[] = [
    { title: 'Mock Song', artist: 'Mock Artist', album: 'Mock Album', uri: 'mock.mp3' },
    { title: 'Schoenes', artist: 'Lied', album: 'Mock Album', uri: 'mock.mp3' },
    { title: 'Jump', artist: 'Tatana', album: 'Mock Album', uri: 'mock.mp3' }
  ];
  private playedList: any[] = [
    { title: 'Mock Song', artist: 'Mock Artist', album: 'Mock Album', fileUrl: 'mock.mp3', count: 5 }
  ];

  getApiBaseUrl(): string {
    return 'http://localhost/mock-api/';
  }

  play(fileUrl: string, playerIp: string): void {
    console.log(`[MOCK] play: ${fileUrl} on ${playerIp}`);
    this.addToPlayedList(fileUrl);
  }

  playOnly(playerIp: string) {
    console.log(`[MOCK] playOnly: ${playerIp}`);
  }

  stop(ip: string): Observable<any> {
    console.log(`[MOCK] stop: ${ip}`);
    return of({ success: true });
  }

  setVolume(ip: string, volume: number): Observable<any> {
    console.log(`[MOCK] setVolume: ${ip} -> ${volume}`);
    return of({ success: true });
  }

  seek(ip: string, seconds: number): Promise<void> {
    console.log(`[MOCK] seek: ${ip} -> ${seconds}`);
    return Promise.resolve();
  }

  addToQueue(ip: string, uri: string, meta: string = ''): Observable<any> {
    const newTrack: SonosQueueTrack = {
      title: 'Neuer Track',
      artist: 'Mock Artist',
      album: 'Mock Album',
      uri
    };
    this.queue.push(newTrack);
    console.log(`[MOCK] addToQueue: ${ip}, ${uri}, ${meta}`);
    return of({ success: true });
  }

  setQueueAndPlay(ip: string, uri: string, track: number = 1) {
    console.log(`[MOCK] setQueueAndPlay: ${ip}, ${uri}, track=${track}`);
  }

  getRinconId(ip: string): string {
    return 'MOCK_RINCON_ID';
  }

  playTrack(ip: string, track: number): Observable<any> {
    console.log(`[MOCK] playTrack: ${ip}, track=${track}`);
    const trackObj = this.queue[track - 1];
    if (trackObj) {
      this.addToPlayedList(trackObj.uri);
    }
    return of({ success: true });
  }

  private addToPlayedList(fileUrl: string) {
    const found = this.playedList.find(item => item.fileUrl === fileUrl);
    if (found) {
      found.count++;
    } else {
      const fileName = fileUrl.split('/').pop() || fileUrl;
      this.playedList.push({
        title: fileName,
        artist: 'Mock Artist',
        album: 'Mock Album',
        fileUrl,
        count: 1
      });
    }
  }

  getStatus(ip: string): Observable<any> {
    console.log(`[MOCK] getStatus: ${ip}`);
    return of({ track: 'Mock Track', title: 'Mock Title', position: '00:00', volume: 50 });
  }

  getQueue(ip: string): Observable<SonosQueueResponse> {
    console.log(`[MOCK] getQueue: ${ip}`);
    return of({ success: true, tracks: [...this.queue] });
  }

  removeFromQueue(ip: string, track: number): Observable<any> {
    // track ist 1-basiert, also -1 für Index
    if (track > 0 && track <= this.queue.length) {
      this.queue.splice(track - 1, 1);
      console.log(`[MOCK] removeFromQueue: ${ip}, track=${track} (entfernt)`);
    } else {
      console.log(`[MOCK] removeFromQueue: ${ip}, track=${track} (ungültig)`);
    }
    return of({ success: true });
  }

  getPlayedTitles(): Observable<any[]> {
    console.log(`[MOCK] getPlayedTitles`);
    return of([...this.playedList]);
  }

  mapIpToRoom(ip: string): string {
    return 'Mock Room';
  }
}
