import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { VolumeControlComponent } from './volume-control.component';
import { SeekButtonsComponent } from './seek-buttons.component';
import { QueueComponent } from './queue.component';
import { PlayedListComponent } from './played-list.component';
import { SonosService } from '../sonos.service';

@Component({
  selector: 'app-player',
  imports: [VolumeControlComponent, SeekButtonsComponent, QueueComponent, PlayedListComponent],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, OnChanges {
  @Input() playerIp: string = '';
  @Input() refreshTrigger: number = 0;
  @Input() fileUrl: string = '';
  track: string = '';
  title: string = '';
  position: string = '';
  volume: number = 0;
  queue: any[] = [];
  queueLoading: boolean = false;
  queueError: string = '';
  played: any[] = [];
  playedSorted: any[] = [];
  playedLoading: boolean = false;
  playedError: string | null = null;

  constructor(private sonosService: SonosService) {}

  ngOnInit(): void {
    if (this.playerIp) {
      this.loadPlayerStatus();
      this.loadQueue();
      this.loadPlayedList();
    }
    this.sortPlayed();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['playerIp'] && changes['playerIp'].currentValue) {
      this.loadPlayerStatus();
      this.loadQueue();
      this.loadPlayedList();
    }
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      this.loadPlayerStatus();
      this.loadQueue();
      this.loadPlayedList();
    }
    this.sortPlayed();
  }

  loadPlayerStatus(): void {
    if (!this.playerIp) return;
    this.sonosService.getStatus(this.playerIp).subscribe((data: any) => {
      this.track = data.track || '';
      this.title = data.title || '';
      this.position = data.position || '';
      this.volume = data.volume || 0;
    });
  }

  loadQueue(): void {
    if (!this.playerIp) return;
    this.queueLoading = true;
    this.queueError = '';
    this.sonosService.getQueue(this.playerIp).subscribe({
      next: (data: any) => {
        this.queue = data.tracks || [];
        this.queueLoading = false;
      },
      error: (err) => {
        this.queueError = 'Fehler beim Laden der Queue';
        this.queueLoading = false;
      }
    });
  }

  loadPlayedList(): void {
    this.playedLoading = true;
    this.playedError = null;
    this.sonosService.getPlayedTitles().subscribe({
      next: (data) => {
        this.played = data;
        this.sortPlayed();
        this.playedLoading = false;
      },
      error: (err) => {
        this.playedError = 'Fehler beim Laden der Played List';
        this.playedLoading = false;
      }
    });
  }

  sortPlayed(): void {
    this.playedSorted = [...this.played].sort((a, b) => b.count - a.count);
  }

  handleVolumeChange(event: any): void {
    const newVolume = Number(event.target.value);
    if (!this.playerIp) return;
    this.sonosService.setVolume(this.playerIp, newVolume).subscribe({
      next: () => {
        this.loadPlayerStatus();
      }
    });
  }

  onSeek(offset: number): void {
    if (!this.playerIp) return;
    this.sonosService.seek(this.playerIp, offset).then(() => {
      this.loadPlayerStatus();
    });
  }

  onStop(): void {
    if (!this.playerIp) return;
    this.sonosService.stop(this.playerIp).subscribe({
      next: () => {
        this.loadPlayerStatus();
      }
    });
  }

  onPlay(): void {
    if (!this.playerIp) return;
    this.sonosService.playOnly(this.playerIp);
    setTimeout(() => this.loadPlayerStatus(), 500);
  }

  onQueuePlay(): void {
    console.log("onQueuePlay ip=" + this.playerIp + " fileUrl=" + this.fileUrl);
    if (!this.playerIp || !this.fileUrl) return;
    this.sonosService.setQueueAndPlay(this.playerIp, this.fileUrl);
    setTimeout(() => {
      this.loadPlayerStatus();
      this.loadQueue();
    }, 500);
  }

  onPlayTrack(newTrack: number): void {
    if (!this.playerIp) return;
    this.sonosService.playTrack(this.playerIp, newTrack);
    setTimeout(() => {
      this.loadPlayerStatus();
      this.loadQueue();
    }, 500);
  }

  onRemoveTrack(trackIndex: number): void {
    if (!this.playerIp) return;
    this.queueLoading = true;
    this.sonosService.removeFromQueue(this.playerIp, trackIndex).subscribe({
      next: () => {
        this.loadQueue();
      },
      error: (err) => {
        this.queueError = 'Fehler beim Entfernen des Tracks';
        this.queueLoading = false;
      }
    });
  }

  onPlayedItemClick(item: any): void {
    if (!this.playerIp || !item?.fileUrl) return;
    this.sonosService.play(item.fileUrl, this.playerIp);
  }

  onQueuePlayItem(event: { track: number, fileUrl: string }): void {
    if (!this.playerIp || !event?.fileUrl) return;
    this.sonosService.setQueueAndPlay(this.playerIp, event.fileUrl, event.track);
  }
}
