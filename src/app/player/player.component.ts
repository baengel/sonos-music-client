import {Component, OnInit, Input, OnChanges, SimpleChanges} from '@angular/core';
import {VolumeControlComponent} from './volume-control.component';
import {SeekButtonsComponent} from './seek-buttons.component';
import {QueueComponent} from './queue.component';
import {SonosService} from '../sonos.service';
import {QueueService} from '../queue.service';
import { PlaylistService } from '../playlist.service';
import { AsyncPipe } from '@angular/common';
import { PlayedListComponent } from './played-list.component';

@Component({
  selector: 'app-player',
  imports: [VolumeControlComponent, SeekButtonsComponent, QueueComponent, PlayedListComponent, AsyncPipe],
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
  played$ = this.playlistService.getPlayed$();
  playedSorted$ = this.playlistService.getPlayedSorted$();
  playedLoading$ = this.playlistService.getLoading$();
  playedError$ = this.playlistService.getError$();

  constructor(
    private sonosService: SonosService,
    private queueService: QueueService,
    private playlistService: PlaylistService
  ) {}

  ngOnInit(): void {
    if (this.playerIp) {
      this.loadPlayerStatus();
      this.queueService.loadQueue(this.playerIp);
      this.playlistService.loadPlayedList();
    }
    this.queueService.getQueue$().subscribe();
    this.queueService.getLoading$().subscribe();
    this.queueService.getError$().subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['playerIp'] && changes['playerIp'].currentValue) {
      this.loadPlayerStatus();
      this.queueService.loadQueue(this.playerIp);
      this.playlistService.loadPlayedList();
    }
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      this.loadPlayerStatus();
      this.queueService.loadQueue(this.playerIp);
      this.playlistService.loadPlayedList();
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

  async handlePlayClick(file: any, index: number) {
    if (!this.playerIp) return;
    await this.sonosService.play(`${file.path}/${file.fileName}`, this.playerIp);
    this.loadPlayerStatus();
    this.playlistService.loadPlayedList();
  }

  async onPlayTrack(newTrack: number) {
    if (!this.playerIp) return;
    await this.sonosService.playTrack(this.playerIp, newTrack);
    this.loadPlayerStatus();
    this.queueService.loadQueue(this.playerIp);
    this.playlistService.loadPlayedList();
  }

  async onPlayedItemClick(item: any) {
    if (!this.playerIp || !item?.fileUrl) return;
    await this.sonosService.play(item.fileUrl, this.playerIp);
    this.playlistService.loadPlayedList();
  }

  onRemoveTrack(trackIndex: number): void {
    if (!this.playerIp) return;
    this.queueService.removeFromQueue(this.playerIp, trackIndex);
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
