import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BalTag} from '@baloise/ds-angular';
import {PlayerComponent} from '../player/player.component';
import {SearchInputComponent} from '../search/search-input.component';
import {SearchInput} from '../app';

interface Player {
  name: string;
  ip: string;
  room: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, PlayerComponent, BalTag, SearchInputComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() title: string = 'Sonos Music Client';
  @Input() availablePlayers: Player[] = [];
  @Input() selectedPlayerIp: string = '';
  @Input() searchInput: SearchInput = { term: '', latest: false };
  @Output() selectedPlayerIpChange = new EventEmitter<string>();
  @Output() refreshPlayerInfo = new EventEmitter<void>();
  @Output() searchInputChange = new EventEmitter<SearchInput>();

  isCompactHeader: boolean = false;
  filteredResults: any[] = [];
  allEntries: any[] = [];

  @HostListener('window:scroll', [])
  onWindowScroll() {
      this.isCompactHeader = window.scrollY > 100;
  }

  onSearchInputChange(value: SearchInput) {
    this.searchInput = value;
    if (value.latest) {
      // Filter für die 20 neuesten Einträge
      this.filteredResults = this.allEntries.slice(-20).reverse();
    } else {
      // Normale Suche nach Suchbegriff
      this.filteredResults = this.allEntries.filter((entry: any) =>
        entry.name?.toLowerCase().includes(value.term.toLowerCase()) ||
        entry.title?.toLowerCase().includes(value.term.toLowerCase())
      );
    }
    this.searchInputChange.emit(this.searchInput);
  }

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
