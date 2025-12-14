import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BalDropdown, BalOption, BalSegment, BalSegmentItem } from '@baloise/ds-angular';
import { availablePlayers } from '../../app';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-player-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, BalSegment, BalSegmentItem, BalDropdown, BalOption],
  templateUrl: './player-selection.component.html',
  styleUrls: ['./player-selection.component.css']
})
export class PlayerSelectionComponent {
  @Output() selectedPlayerIp = new EventEmitter<string>();
  availablePlayers = availablePlayers;
  isMobile = window.innerWidth < 600;
  selectedPlayer: string | null = null;

  constructor(private route: ActivatedRoute) {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 600;
    });
    this.route.queryParams.subscribe(params => {
      const param = params['player']?.toLowerCase();
      if (param) {
        const found = this.availablePlayers.find(
          p => p.ip.toLowerCase() === param || p.name.toLowerCase() === param
        );
        this.selectedPlayer = found ? found.ip : this.availablePlayers[0].ip;
      } else {
        const len = this.availablePlayers.find(p => p.name.toLowerCase() === 'len');
        this.selectedPlayer = len ? len.ip : this.availablePlayers[0].ip;
      }
    });
  }

  onPlayerSelected(ip: string) {
    this.selectedPlayerIp.emit(ip);
  }
}
