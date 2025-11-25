import {Component, EventEmitter, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BalDropdown, BalOption, BalRadio, BalRadioGroup, BalSegment, BalSegmentItem} from '@baloise/ds-angular';
import {availablePlayers} from '../../app';

@Component({
  selector: 'app-player-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, BalRadioGroup, BalRadio, BalSegment, BalSegmentItem, BalDropdown, BalOption],
  templateUrl: './player-selection.component.html',
  styleUrls: ['./player-selection.component.css']
})
export class PlayerSelectionComponent {
  @Output()
  selectedPlayerIp = new EventEmitter<string>();

  protected readonly availablePlayers = availablePlayers;

  isMobile: boolean = window.innerWidth < 600;

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 600;
    });
  }

  onPlayerSelected(ip: string) {
    this.selectedPlayerIp.emit(ip);
  }

  getIp(name: string): string {
    return this.availablePlayers.find(p => p.name === name)?.ip || '';
  }

  markDocumentAsRead(player: any): void {
    console.log('PDF für Player gelesen:', player);
  }
}
