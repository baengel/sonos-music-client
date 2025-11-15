import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SonosService} from '../../sonos.service';

@Component({
  selector: 'play-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './play-buttons.component.html',
  styleUrls: ['./play-buttons.component.css']
})
export class PlayButtonsComponent {
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() playerIp: string = '';
  @Input() fileUrl: string = '';
  @Output() stop = new EventEmitter<void>();
  @Output() play = new EventEmitter<void>();
  @Output() queuePlay = new EventEmitter<void>();
  @Output() playlistUpdated = new EventEmitter<any>();

  playLoading: boolean = false;
  queueLoading: boolean = false;

  constructor(private sonosService: SonosService) {}

  onPlay() {
    console.log('playing' + this.playerIp);
    if (!this.playerIp) return;
    this.playLoading = true;
    this.sonosService.playOnly(this.playerIp).subscribe({
      next: (queue) => {
        this.playlistUpdated.emit(queue);
        this.playLoading = false;
        this.play.emit();
      },
      error: () => {
        this.playLoading = false;
      }
    });
  }
}

