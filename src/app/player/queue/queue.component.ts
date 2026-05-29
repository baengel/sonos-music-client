import {Component, EventEmitter, Input, Output} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {QueueService} from '../../queue.service';
import {BalButton, BalCardContent} from '@baloise/ds-angular';
import {SonosService} from '../../sonos.service';
import {PlaylistService} from '../../playlist.service';

@Component({
  selector: 'sonos-queue',
  standalone: true,
  templateUrl: './queue.component.html',
  styleUrls: [],
  imports: [AsyncPipe, BalButton, BalCardContent]
})
export class QueueComponent {
  queue$ = this.queueService.getQueue$();
  queueLoading$ = this.queueService.getLoading$();
  queueError$ = this.queueService.getError$();

  @Input()
  playerIp: string = '';

  dragIndex: number | null = null;

  constructor(private queueService: QueueService,
              private sonosService: SonosService,
              private playlistService: PlaylistService) {
  }


  onDragStart(index: number) {
    this.dragIndex = index;
  }

  onDragOver(event: Event) {
    event.preventDefault();
  }

  onDrop(dropIndex: number) {
    if (this.dragIndex !== null && this.dragIndex !== dropIndex) {
      this.onMoveTrack({from: this.dragIndex, to: dropIndex});
    }
    this.dragIndex = null;
  }

  onMoveTrack(event: { from: number, to: number }) {
    if (!this.playerIp) return;
    this.queueService.moveQueueItem(this.playerIp, event.from, event.to);
  }

  playTrack(newTrack: number): void {
    if (!this.playerIp) return;
    this.sonosService.playTrack(this.playerIp, newTrack).subscribe(r => {
      this.queueService.loadQueue(this.playerIp);
      this.playlistService.loadPlayedList();
    });
  }

  onPlayQueue(): void {
    console.log("onQueuePlayItem ip=" + this.playerIp);
    if (!this.playerIp) return;
    this.sonosService.playTrack(this.playerIp, 1).subscribe(_ => {
      // this.loadPlayerStatus();
      this.queueService.loadQueue(this.playerIp);
    });
  }

  onRemoveTrack(trackIndex: number): void {
    if (!this.playerIp) return;
    this.queueService.removeFromQueue(this.playerIp, trackIndex);
  }

  onClearQueue(): void {
    if (!this.playerIp) return;
    this.queueService.clearQueue(this.playerIp).subscribe({
      next: () => {
        this.queueService.loadQueue(this.playerIp);
      },
      error: (err) => {
        console.error('Fehler beim Löschen der Queue:', err);
      }
    });
  }

  protected readonly onplay = onplay;
}
