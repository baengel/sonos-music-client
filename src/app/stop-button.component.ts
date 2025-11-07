import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'stop-button',
  standalone: true,
  template: `
    <button class="stop-all-btn"
            (click)="stop.emit()"
            [disabled]="disabled">
      ⏹️ Stop
    </button>
  `
})
export class StopButtonComponent {
  @Input() disabled: boolean = false;
  @Output() stop = new EventEmitter<void>();
}

