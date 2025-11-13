import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { VolumeControlComponent } from './volume-control.component';
import { SeekButtonsComponent } from './seek-buttons.component';
import { QueueComponent } from './queue.component';
import { SonosService } from '../sonos.service';

@Component({
  selector: 'app-player',
  imports: [VolumeControlComponent, SeekButtonsComponent, QueueComponent],
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

  constructor(private sonosService: SonosService) {}

  ngOnInit(): void {
    if (this.playerIp) {
      this.loadPlayerStatus();
      this.loadQueue();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['playerIp'] && changes['playerIp'].currentValue) {
      this.loadPlayerStatus();
      this.loadQueue();
    }
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      this.loadPlayerStatus();
      this.loadQueue();
    }
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
}
