import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PlayButtonsComponent } from './play-buttons.component';
import { SonosService } from '../sonos.service';

@Component({
  selector: 'seek-buttons',
  standalone: true,
  imports: [PlayButtonsComponent],
  template: `
    <button class="seek-btn"
            (click)="playTrackRelative(-1)"
            [disabled]="disabled">
      ⏮️
    </button>
    <button class="seek-btn"
            (click)="seek.emit(-10)"
            [disabled]="disabled">
      ⏪
    </button>
    <stop-button [disabled]="disabled" (stop)="stop.emit()"></stop-button>
    <button class="seek-btn"
            (click)="seek.emit(10)"
            [disabled]="disabled">
      ⏩
    </button>
    <button class="seek-btn"
            (click)="playTrackRelative(1)"
            [disabled]="disabled">
      ⏭️
    </button>
  `,
  styles: [
    `
    .seek-btn {
      margin: 0 2px;
      padding: 4px 10px;
      font-size: 1em;
      border-radius: 4px;
      border: 1px solid #bbb;
      background: #f7f7f7;
      cursor: pointer;
      transition: background 0.2s;
    }
    .seek-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    :host { display: inline-flex; align-items: center; gap: 2px; }
    `
  ]
})
export class SeekButtonsComponent {
  @Input() disabled: boolean = false;
  @Output() seek = new EventEmitter<number>();
  @Output() stop = new EventEmitter<void>();

  @Input() playerIp: string = '';
  @Input() currentTrack: number = 1;

  constructor(private sonosService: SonosService) {}

  playTrackRelative(offset: number) {
    if (!this.playerIp) return;
    const newTrack = this.currentTrack + offset;
    if (newTrack < 1) return;
    this.sonosService.playTrack(this.playerIp, newTrack);
  }
}
