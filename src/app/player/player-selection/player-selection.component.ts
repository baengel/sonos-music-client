import {Component, EventEmitter, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BalDropdown, BalOption, BalSegment, BalSegmentItem} from '@baloise/ds-angular';
import {availablePlayers} from '../../app';
import {ActivatedRoute} from '@angular/router';

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
  selectedPlayer: string =  this.availablePlayers[0].ip;

  constructor(private route: ActivatedRoute) {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 600;
    });
    this.route.queryParams.subscribe(params => {
      const paramsLoc = new URLSearchParams(window.location.search);
      let param = params['player']?.toLowerCase().trim();
      if (!param) {
        param = paramsLoc.get('player')?.toLowerCase().trim() || '';
      }
      if (param) {
        console.log('select:', param);
        const found = this.availablePlayers.find(
          p => p.ip.toLowerCase().trim() === param || p.name.toLowerCase().trim() === param
        );
        this.selectedPlayer = found ? found.ip : this.availablePlayers[0].ip;
      } else {
        this.selectedPlayer = this.availablePlayers[0].ip;
      }
      this.selectedPlayerIp.emit(this.selectedPlayer);
    });
  }

  onPlayerSelected(ip: string) {
    this.selectedPlayerIp.emit(ip);
  }
}
