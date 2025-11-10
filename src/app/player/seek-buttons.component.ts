import { Component, Input, Output, EventEmitter } from '@angular/core';
import { StopButtonComponent } from './stop-button.component';

@Component({
  selector: 'seek-buttons',
  standalone: true,
  imports: [StopButtonComponent],
  template: `
    <button class="seek-btn"
            (click)="seek.emit(-10)"
            [disabled]="disabled">
      «
    </button>
    <stop-button [disabled]="disabled" (stop)="stop.emit()"></stop-button>
    <button class="seek-btn"
            (click)="seek.emit(10)"
            [disabled]="disabled">
       »
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
}
