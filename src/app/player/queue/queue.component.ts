import {Component, EventEmitter, Output} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {QueueService} from '../../queue.service';

@Component({
  selector: 'sonos-queue',
  standalone: true,
  templateUrl: './queue.component.html',
  styleUrls: [],
  imports: [AsyncPipe]
})
export class QueueComponent {
  queue$ = this.queueService.getQueue$();
  queueLoading$ = this.queueService.getLoading$();
  queueError$ = this.queueService.getError$();

  @Output() playTrack = new EventEmitter<number>();
  @Output() removeTrack = new EventEmitter<number>();
  @Output() queuePlay = new EventEmitter<number>();

  constructor(private queueService: QueueService) {}

  onPlayQueue() {
    this.queuePlay.emit();
  }

  onRemoveTrack(index: number) {
    this.removeTrack.emit(index);
  }
}

