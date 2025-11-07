import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'seek-buttons',
  template: `
    <button class="seek-btn"
            (click)="seek.emit(-10)"
            [disabled]="disabled">
      «
    </button>
    <button class="seek-btn"
            (click)="seek.emit(10)"
            [disabled]="disabled">
       »
    </button>
  `,
  styles: [`
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
  `]
})
export class SeekButtonsComponent {
  @Input() disabled: boolean = false;
  @Output() seek = new EventEmitter<number>();
}

