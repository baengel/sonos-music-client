import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BalTag} from '@baloise/ds-angular';
import {SeekButtonsComponent} from '../player/seek-buttons/seek-buttons.component';
import {VolumeControlComponent} from '../player/volume-control/volume-control.component';
import {PlayerComponent} from '../player/player.component';

interface Player {
  name: string;
  ip: string;
  room: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, SeekButtonsComponent, VolumeControlComponent, PlayerComponent, BalTag],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() title: string = 'Sonos Music Client';
  @Input() availablePlayers: Player[] = [];
  @Input() selectedPlayerIp: string = '';
  @Output() selectedPlayerIpChange = new EventEmitter<string>();
  @Output() refreshPlayerInfo = new EventEmitter<void>();
  @Output() searchTermChange = new EventEmitter<string>();

  searchInput: string = '';
  isCompactHeader: boolean = false;
  private scrollTimeout: any;

  @HostListener('window:scroll', [])
  onWindowScroll() {
      this.isCompactHeader = window.scrollY > 100;
  }

  onSearch() {
    this.searchTermChange.emit(this.searchInput);
  }

  selectPlayerTab(ip: string) {
    this.selectedPlayerIpChange.emit(ip);
  }

  getPlayerName(ip: string): string {
    const player = this.availablePlayers.find(p => p.ip === ip);
    return player ? player.name : ip;
  }

}
