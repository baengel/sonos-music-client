import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { VolumeControlComponent } from './volume-control.component';
import { SeekButtonsComponent } from './seek-buttons.component';
import { SonosService } from '../sonos.service';

@Component({
  selector: 'app-player',
  imports: [VolumeControlComponent, SeekButtonsComponent],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, OnChanges {
  @Input() playerIp: string = '';
  @Input() refreshTrigger: number = 0;
  track: string = '';
  title: string = '';
  position: string = '';
  volume: number = 0;

  constructor(private sonosService: SonosService) {}

  ngOnInit(): void {
    if (this.playerIp) {
      this.loadPlayerStatus();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['playerIp'] && changes['playerIp'].currentValue) {
      this.loadPlayerStatus();
    }
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      this.loadPlayerStatus();
    }
  }

  loadPlayerStatus(): void {
    if (!this.playerIp) return;
    this.sonosService.getStatus(this.playerIp).subscribe((data: any) => {
      this.track = data.track || '';
      this.title = data.title || '';
      this.position = data.position || '';
      this.volume = data.volume || 0;
    });
  }

  handleVolumeChange(event: any): void {
    const newVolume = Number(event.target.value);
    if (!this.playerIp) return;
    this.sonosService.setVolume(this.playerIp, newVolume).subscribe({
      next: () => {
        this.loadPlayerStatus();
      }
    });
  }
}
