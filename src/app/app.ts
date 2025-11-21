import {Component, EventEmitter, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SonosService} from './sonos.service';
import {HttpClientModule} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {PlayerComponent} from './player/player.component';
import {QueueService} from './queue.service';
import {SonosServiceMock} from './sonos.service.mock';
import {forkJoin} from 'rxjs';
import {ApiBaseUrlService} from './api-base-url.service';
import {BalHeading, BalNavbar} from '@baloise/ds-angular';

interface FileInfo {
  path: string;
  fileName: string;
  size: number;
  fullLine: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, HttpClientModule, PlayerComponent, BalNavbar, BalHeading],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('sonos-music-client');
  protected readonly filteredFiles = signal<FileInfo[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly searchTerm = signal('');
  protected searchInput = '';
  private searchTimeout: any = null;
  protected openDropdownIndex: number | null = null;

  // Player-Liste
  protected readonly availablePlayers = [
    { name: 'Len', ip: '192.168.188.34', room: 'Len Zimmer' },
    { name: 'Juna', ip: '192.168.188.43', room: 'Juna Zimmer' },
    { name: 'Maxim', ip: '192.168.188.35', room: 'Maxim Zimmer' },
    { name: 'Kueche', ip: '192.168.188.146', room: 'Kueche (L)' },
    { name: 'Wohnzimmer', ip: '192.168.188.86', room: 'Wohnzimmer' }
  ];

  // Globale ausgewählte Player (nur eine IP für Tabs)
  protected selectedPlayerIp: string = this.availablePlayers.length > 0 ? this.availablePlayers[0].ip : '';
  private apiUrl: string = '';
  playLoadingIndex: number | null = null;
  addQueueLoadingIndex: number | null = null;
  playedFIles: number[] = [];
  volume: number = 30;
  stopLoading: boolean = false;
  sortKey: 'pfad' | 'name' | 'größe' = 'pfad';
  sortDirection: 'asc' | 'desc' = 'asc';
  playerRefreshCounter: number = 0;

  // EventEmitter für Player-Info-Refresh
  refreshPlayerInfo: EventEmitter<void> = new EventEmitter<void>();

  constructor(private sonosService: SonosService,
              private queueService: QueueService,
              private apiBaseUrlService: ApiBaseUrlService,
              private router: Router,
              private route: ActivatedRoute) {}

  ngOnInit() {
    // URL-Parameter auslesen
    this.apiUrl = this.getUrl(); // URL nur einmal bestimmen
    const params = new URLSearchParams(window.location.search);
    const urlSearch = params.get('search');
    if (urlSearch && urlSearch.trim().length > 0) {
      this.searchInput = urlSearch;
      this.searchTerm.set(urlSearch);
      // Nur wenn Suchparameter vorhanden, initial suchen
      this.loadAndFilterFile(this.apiUrl, this.searchTerm())
        .catch(error => console.error('Fehler beim Laden und Filtern:', error));
    }
    // Keine Initialsuche ohne Suchparameter
  }

  private getUrl() {
    let url = this.apiBaseUrlService.getApiBaseUrl();
    if (this.sonosService instanceof SonosServiceMock) {
      url = "http://localhost:4200/";
    } else {
      url = url.replace('sonos-music-client/', '').replace('public/', '');
    }
    url += 'files_and_size.txt';
    console.log("url=", url);
    return url;
  }

  protected toggleDropdown(index: number) {
    this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
  }

  protected closeDropdown() {
    this.openDropdownIndex = null;
  }

  protected async handlePlayClick(file: FileInfo, index: number) {
    if (this.playLoadingIndex !== null) return;
    this.playLoadingIndex = index;

    this.playedFIles = [...this.playedFIles, index];
    const selectedIps = this.selectedPlayerIps();
    if (selectedIps.size > 0) {
      const playObservables = Array.from(selectedIps).map(ip =>
        this.sonosService.play(`${file.path}/${file.fileName}`, ip)
      );
      forkJoin(playObservables).subscribe({
        next: () => {
          this.playerRefreshCounter++;
        },
        error: (err) => {
          console.error('Fehler beim Abspielen:', err);
        }
      });
    }
    this.playLoadingIndex = null;
  }

  protected async handleAddToQueue(file: FileInfo, index: number) {
    if (this.addQueueLoadingIndex !== null) return;
    this.addQueueLoadingIndex = index;
    const selectedIps = this.selectedPlayerIps();
    if (selectedIps.size > 0) {
      const addPromises = Array.from(selectedIps).map(ip => {
        // Metadaten können hier ggf. generiert werden, aktuell leer
        return this.queueService.addToQueue(ip, `${file.path}/${file.fileName}`);
      });
      try {
        await Promise.all(addPromises);
        // Optional: Erfolgsmeldung anzeigen
      } catch (err) {
        console.error('Fehler beim Hinzufügen zur Queue:', err);
      }
    }
    this.addQueueLoadingIndex = null;
  }

  protected onSearch() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      const trimmedInput = this.searchInput.trim();
      if (trimmedInput.length >= 2) {
        this.playedFIles = [];
        this.searchTerm.set(trimmedInput);
        // Query-Parameter per Router setzen
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { search: trimmedInput },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
        this.loadAndFilterFile(this.apiUrl, this.searchTerm())
          .catch(error => console.error('Fehler beim Laden und Filtern:', error));
      } else {
        this.filteredFiles.set([]);
        this.isLoading.set(false);
        // Query-Parameter entfernen
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { search: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
    }, 500);
  }

  protected highlightText(text: string, searchTerm: string): string {
    if (!searchTerm) return text;

    const terms = this.parseSearchTerms(searchTerm);
    let result = text;

    terms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    });

    return result;
  }

  private parseSearchTerms(searchTerm: string): string[] {
    const terms: string[] = [];
    const regex = /"([^"]+)"|(\S+)/g;
    let match;

    while ((match = regex.exec(searchTerm)) !== null) {
      // match[1] = Text in Anführungszeichen
      // match[2] = Wort ohne Anführungszeichen
      terms.push(match[1] || match[2]);
    }

    return terms;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private matchesAllTerms(text: string, searchTerms: string[]): boolean {
    const lowerText = text.toLowerCase();
    return searchTerms.every(term => lowerText.includes(term.toLowerCase()));
  }

  private parseFileLine(line: string): FileInfo | null {
    // Format: -rwxrwxrwx 1 baengel users 3737073 Mar 20 2009 /volume1/Music/best mp3/CD1 burned/Snap! - Rame (Original Version).mp3
    const parts = line.split(/\s+/);

    if (parts.length < 9) {
      return null; // Ungültige Zeile
    }

    // Größe ist an Position 4
    const size = parseInt(parts[4], 10);

    // Pfad beginnt ab Position 8 (kann Leerzeichen enthalten)
    const fullPath = parts.slice(8).join(' ');

    // Trenne Pfad und Dateiname
    const lastSlashIndex = fullPath.lastIndexOf('/');
    const path = fullPath.substring(0, lastSlashIndex);
    const fileName = fullPath.substring(lastSlashIndex + 1);

    return {
      path,
      fileName,
      size,
      fullLine: line
    };
  }

  // In Ihrem Angular Service/Component
  async loadAndFilterFile(url: string, filterTerm: string) {
    this.isLoading.set(true);
    this.filteredFiles.set([]); // Zurücksetzen

    const searchTerms = this.parseSearchTerms(filterTerm);

    const response = await fetch(url);

    if (!response.body) {
      throw new Error('Response body not available as a stream');
    }

    const reader = response.body.getReader();
    let accumulatedText = '';
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        const chunkText = new TextDecoder().decode(value, { stream: true });
        accumulatedText += chunkText;

        const lines = accumulatedText.split('\n');
        accumulatedText = lines.pop() || '';

        for (const line of lines) {
          if (this.matchesAllTerms(line, searchTerms)) {
            const fileInfo = this.parseFileLine(line);
            if (fileInfo) {
              this.filteredFiles.update(current => [...current, fileInfo]);
            }
          }
        }
      }
    }

    if (accumulatedText.length > 0) {
      if (this.matchesAllTerms(accumulatedText, searchTerms)) {
        const fileInfo = this.parseFileLine(accumulatedText);
        if (fileInfo) {
          this.filteredFiles.update(current => [...current, fileInfo]);
        }
      }
    }

    this.isLoading.set(false);
    console.log('Filtern abgeschlossen.');
  }

  onVolumeChange(event: any, setImmediately = false) {
    this.volume = Number(event.target.value);
    if (setImmediately) {
      this.setVolumeForSelectedPlayers();
    }
  }

  async setVolumeForSelectedPlayers() {
    const selectedIps = this.selectedPlayerIps();
    if (selectedIps.size > 0) {
      const volumePromises = Array.from(selectedIps).map(ip => {
        return new Promise<void>((resolve) => {
          this.sonosService.setVolume(ip, this.volume).subscribe({
            next: () => resolve(),
            error: () => resolve()
          });
        });
      });
      await Promise.all(volumePromises);
    }
  }

  async stopAllSelectedPlayers() {
    this.stopLoading = true;
    const selectedIps = this.selectedPlayerIps();
    if (selectedIps.size > 0) {
      const stopPromises = Array.from(selectedIps).map(ip => {
        return new Promise<void>((resolve) => {
          this.sonosService.stop(ip).subscribe({
            next: () => resolve(),
            error: () => resolve()
          });
        });
      });
      await Promise.all(stopPromises);
    }
    this.stopLoading = false;
  }

  async seekAllSelectedPlayers(seconds: number) {
    const selectedIps = this.selectedPlayerIps();
    if (selectedIps.size === 0) return;
    for (const ip of selectedIps) {
      try {
        await this.sonosService.seek(ip, seconds);
      } catch (err) {
        console.error('Fehler beim Seek für', ip, err);
      }
    }
  }

  setSortKey(key: 'pfad' | 'name' | 'größe') {
    this.sortKey = key;
  }

  setSortDirection(direction: 'asc' | 'desc') {
    this.sortDirection = direction;
  }

  getSortedFiles(): FileInfo[] {
    const files = [...this.filteredFiles()];
    switch (this.sortKey) {
      case 'größe':
        files.sort((a, b) => this.sortDirection === 'asc' ? a.size - b.size : b.size - a.size);
        break;
      case 'name':
        files.sort((a, b) => this.sortDirection === 'asc'
          ? a.fileName.localeCompare(b.fileName)
          : b.fileName.localeCompare(a.fileName));
        break;
      case 'pfad':
      default:
        files.sort((a, b) => {
          const pathCompare = this.sortDirection === 'asc'
            ? a.path.localeCompare(b.path)
            : b.path.localeCompare(a.path);
          if (pathCompare !== 0) return pathCompare;
          return this.sortDirection === 'asc'
            ? a.fileName.localeCompare(b.fileName)
            : b.fileName.localeCompare(a.fileName);
        });
        break;
    }
    return files;
  }

  // Methode zum Auswählen eines Players per Tab
  selectPlayerTab(ip: string) {
    this.selectedPlayerIp = ip;
  }

  // Hilfsmethode für Template-Kompatibilität
  selectedPlayerIps() {
    // Für die Tab-Variante: gibt ein Set mit der ausgewählten IP zurück, falls vorhanden
    return new Set(this.selectedPlayerIp ? [this.selectedPlayerIp] : []);
  }
}
