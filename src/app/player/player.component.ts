import {Component, OnInit, Input, OnChanges, SimpleChanges} from '@angular/core';
import {VolumeControlComponent} from './volume-control.component';
import {SeekButtonsComponent} from './seek-buttons.component';
import {QueueComponent} from './queue.component';
import {PlayedListComponent} from './played-list.component';
import {SonosService} from '../sonos.service';
import {QueueService} from '../queue.service';

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
  played: any[] = [];
  playedSorted: any[] = [];
  playedLoading: boolean = false;
  playedError: string | null = null;

  constructor(private sonosService: SonosService,
              private queueService: QueueService) {
  }

  ngOnInit(): void {
    if (this.playerIp) {
      this.loadPlayerStatus();
      this.queueService.loadQueue(this.playerIp);
      this.loadPlayedList();
    }
    this.queueService.getQueue$().subscribe();
    this.queueService.getLoading$().subscribe();
    this.queueService.getError$().subscribe();
    this.sortPlayed();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['playerIp'] && changes['playerIp'].currentValue) {
      this.loadPlayerStatus();
      this.queueService.loadQueue(this.playerIp);
      this.loadPlayedList();
    }
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      this.loadPlayerStatus();
      this.queueService.loadQueue(this.playerIp);
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
      this.queueService.loadQueue(this.playerIp);
    }, 500);
  }

  onPlayTrack(newTrack: number): void {
    if (!this.playerIp) return;
    this.sonosService.playTrack(this.playerIp, newTrack).subscribe(_ => {
      this.loadPlayerStatus();
      this.queueService.loadQueue(this.playerIp);
    });
  }

  onRemoveTrack(trackIndex: number): void {
    if (!this.playerIp) return;
    this.queueService.removeFromQueue(this.playerIp, trackIndex);
  }

  onPlayedItemClick(item: any): void {
    if (!this.playerIp || !item?.fileUrl) return;
    this.sonosService.play(item.fileUrl, this.playerIp);
  }

  onQueuePlayItem(track: number): void {
    console.log("onQueuePlayItem ip=" + this.playerIp);
    if (!this.playerIp ) return;
    this.sonosService.playTrack(this.playerIp, track).subscribe(_ => {
      this.loadPlayerStatus();
      this.queueService.loadQueue(this.playerIp);
    });
  }
}
