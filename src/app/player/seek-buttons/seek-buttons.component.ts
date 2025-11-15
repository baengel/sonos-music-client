import { Component, Input, Output, EventEmitter } from '@angular/core';
import {PlayButtonsComponent} from '../play-buttons/play-buttons.component';

@Component({
  selector: 'seek-buttons',
  standalone: true,
  imports: [PlayButtonsComponent],
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
    // Implementiere die Logik für Track-Wechsel relativ
  }
}
