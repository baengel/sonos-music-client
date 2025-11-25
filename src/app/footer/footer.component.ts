import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {PlayerComponent} from '../player/player.component';
import {SearchInput} from '../app';

interface Player {
  name: string;
  ip: string;
  room: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, PlayerComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  @Input() title: string = 'Sonos Music Client';
  @Input() availablePlayers: Player[] = [];
  @Input() selectedPlayerIp: string = '';
  @Input() searchInput: SearchInput = { term: '', latest: false };
  @Output() selectedPlayerIpChange = new EventEmitter<string>();
  @Output() refreshPlayerInfo = new EventEmitter<void>();
  @Output() searchInputChange = new EventEmitter<SearchInput>();


  selectPlayerTab(ip: string) {
    this.selectedPlayerIpChange.emit(ip);
  }

  getPlayerName(ip: string): string {
    const player = this.availablePlayers.find(p => p.ip === ip);
    return player ? player.name : ip;
  }

  onShowLatest() {
    this.searchInput = { ...this.searchInput, latest: true };
    this.searchInputChange.emit(this.searchInput);
  }

}
