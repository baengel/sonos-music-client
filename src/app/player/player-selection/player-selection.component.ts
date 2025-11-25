import {Component, EventEmitter, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BalRadio, BalRadioGroup} from '@baloise/ds-angular';
import {availablePlayers} from '../../app';

@Component({
  selector: 'app-player-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, BalRadioGroup, BalRadio],
  templateUrl: './player-selection.component.html',
  styleUrls: ['./player-selection.component.css']
})
export class PlayerSelectionComponent {
  @Output()
  selectedPlayerIp = new EventEmitter<string>();

  protected readonly availablePlayers = availablePlayers;

  onPlayerSelected(ip: string) {
    this.selectedPlayerIp.emit(ip);
  }

  getIp(name: string): string {
    return this.availablePlayers.find(p => p.name === name)?.ip || '';
  }
}
