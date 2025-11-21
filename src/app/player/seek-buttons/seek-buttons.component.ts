import {Component, EventEmitter, Input, Output} from '@angular/core';
import {PlayButtonsComponent} from '../play-buttons/play-buttons.component';
import {BalButton} from '@baloise/ds-angular';

@Component({
  selector: 'seek-buttons',
  standalone: true,
  imports: [PlayButtonsComponent, BalButton],
  templateUrl: './seek-buttons.component.html',
  styleUrls: ['./seek-buttons.component.css']
})
export class SeekButtonsComponent {
  @Input() playerIp: string = '';
  @Input() fileUrl: string = '';
  @Input() disabled: boolean = false;
  @Output() seek = new EventEmitter<number>();
  @Output() stop = new EventEmitter<void>();
  @Output() play = new EventEmitter<void>();
  @Output() queuePlay = new EventEmitter<void>();
  @Output() trackRelative = new EventEmitter<number>();

  constructor() {}

  onPlay() {
    this.play.emit();
  }

  onStop() {
    this.stop.emit();
  }

  onQueuePlay() {
    this.queuePlay.emit();
  }

  playTrackRelative(offset: number) {
    this.trackRelative.emit(offset);
  }
}
