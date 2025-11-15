import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'player-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label class="player-label">Player:</label>
    <div class="player-checkboxes">
      <label class="checkbox-label" *ngFor="let player of players">
        <input
          type="checkbox"
          [checked]="selectedPlayerIps.has(player.ip)"
          (change)="togglePlayerSelection.emit(player.ip)"
          class="player-checkbox"
        />
        <span class="checkbox-text">{{ player.name }}</span>
      </label>
    </div>
  `
})
export class PlayerSelectionComponent {
  @Input() players: { name: string, ip: string }[] = [];
  @Input() selectedPlayerIps: Set<string> = new Set();
  @Output() togglePlayerSelection = new EventEmitter<string>();
}
