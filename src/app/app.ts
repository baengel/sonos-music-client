import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SonosService } from './sonos.service';
import { HttpClientModule } from '@angular/common/http';

interface FileInfo {
  path: string;
  fileName: string;
  size: number;
  fullLine: string;
}

interface Player {
  name: string;
  ip: string;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('sonos-music-client');
  protected readonly filteredFiles = signal<FileInfo[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly searchTerm = signal('snap');
  protected searchInput = 'snap';
  private searchTimeout: any = null;
  protected openDropdownIndex: number | null = null;

  // Player-Liste
  protected readonly availablePlayers: Player[] = [
    { name: 'Len', ip: '192.168.1.101' },
    { name: 'Juna', ip: '192.168.1.102' },
    { name: 'Maxim', ip: '192.168.1.103' },
    { name: 'Kueche', ip: '192.168.1.105' },
    { name: 'Wohnzimmer', ip: '192.168.1.100' }
  ];

  // Globale ausgewählte Player (Set von IPs)
  protected selectedPlayerIps = signal<Set<string>>(new Set());

  constructor(private sonosService: SonosService) {}

  ngOnInit() {
    // Rufe loadAndFilterFile beim Laden der Komponente auf
    this.loadAndFilterFile('files_and_size.txt', this.searchTerm())
      .catch(error => console.error('Fehler beim Laden und Filtern:', error));
  }

  protected toggleDropdown(index: number) {
    this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
  }

  protected closeDropdown() {
    this.openDropdownIndex = null;
  }

  protected handlePlayClick(file: FileInfo, index: number) {
    const selectedIps = this.selectedPlayerIps();
    if (selectedIps.size > 0) {
      // Wenn Player global ausgewählt sind, auf allen abspielen
      selectedIps.forEach(ip => {
        this.playOnDevice(file, ip);
      });
    } else {
      // Wenn kein Player ausgewählt ist, Dropdown öffnen
      this.toggleDropdown(index);
    }
  }

  protected togglePlayerSelection(playerIp: string) {
    const currentSelection = new Set(this.selectedPlayerIps());
    if (currentSelection.has(playerIp)) {
      currentSelection.delete(playerIp);
    } else {
      currentSelection.add(playerIp);
    }
    this.selectedPlayerIps.set(currentSelection);
  }

  protected isPlayerSelected(playerIp: string): boolean {
    return this.selectedPlayerIps().has(playerIp);
  }

  protected clearPlayerSelection() {
    this.selectedPlayerIps.set(new Set());
  }

  protected getSelectedPlayerNames(): string {
    const selected = this.availablePlayers.filter(p => this.selectedPlayerIps().has(p.ip));
    return selected.map(p => p.name).join(', ');
  }

  protected async playOnDevice(file: FileInfo, playerIp: string) {
    this.closeDropdown();
    try {
      const fullPath = `${file.path}/${file.fileName}`;
      console.log('Spiele ab:', {
        file: fullPath,
        player: playerIp
      });
      this.sonosService.play(fullPath, playerIp).subscribe({
        next: () => {
          console.log('Erfolgreich gestartet!');
          // Optional: Erfolgs-Benachrichtigung anzeigen
        },
        error: (err) => {
          console.error('Fehler beim Abspielen:', err);
          // Optional: Fehler-Benachrichtigung anzeigen
        }
      });
    } catch (error) {
      console.error('Fehler beim Senden des Play-Requests:', error);
    }
  }

  protected onSearch() {
    // Lösche den vorherigen Timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Setze einen neuen Timeout für 500ms
    this.searchTimeout = setTimeout(() => {
      const trimmedInput = this.searchInput.trim();
      if (trimmedInput) {
        this.searchTerm.set(trimmedInput);
        this.loadAndFilterFile('files_and_size.txt', this.searchTerm())
          .catch(error => console.error('Fehler beim Laden und Filtern:', error));
      } else {
        // Wenn leer, zeige alle Dateien oder leere die Liste
        this.filteredFiles.set([]);
        this.isLoading.set(false);
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
}
