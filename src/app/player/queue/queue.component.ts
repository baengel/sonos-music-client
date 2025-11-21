import {Component, EventEmitter, Output} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {QueueService} from '../../queue.service';
import {BalButton, BalCardContent} from '@baloise/ds-angular';

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

  @Output() playTrack = new EventEmitter<number>();
  @Output() removeTrack = new EventEmitter<number>();
  @Output() queuePlay = new EventEmitter<number>();
  @Output() clearQueue = new EventEmitter<void>();
  @Output() moveTrack = new EventEmitter<{from: number, to: number}>();

  dragIndex: number | null = null;

  constructor(private queueService: QueueService) {}

  onPlayQueue() {
    this.queuePlay.emit();
  }

  onRemoveTrack(index: number) {
    this.removeTrack.emit(index);
  }

  onClearQueue() {
    this.clearQueue.emit();
  }

  onDragStart(index: number) {
    this.dragIndex = index;
  }

  onDragOver(event: Event) {
    event.preventDefault();
  }

  onDrop(dropIndex: number) {
    if (this.dragIndex !== null && this.dragIndex !== dropIndex) {
      // Event auslösen, Elternkomponente ruft Service
      this.moveTrack.emit({from: this.dragIndex, to: dropIndex});
    }
    this.dragIndex = null;
  }
}
