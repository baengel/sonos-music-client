import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'stop-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="seek-btn stop-btn"
            (click)="stop.emit()"
            [disabled]="disabled">
      <ng-container *ngIf="loading; else stopIcon">
        <span class="spinner" style="display: inline-block; width: 1em; height: 1em; border: 2px solid #b00; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
      </ng-container>
      <ng-template #stopIcon>stop</ng-template>
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
    .stop-btn {
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class StopButtonComponent {
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Output() stop = new EventEmitter<void>();
}
