import {Component, EventEmitter, Input, Output} from '@angular/core';
import {BalContent} from '@baloise/ds-angular';
import {SonosService} from '../../sonos.service';
import {PlaylistService} from '../../playlist.service';

@Component({
  selector: 'played-list',
  standalone: true,
  templateUrl: './played-list.component.html',
  imports: [
    BalContent
  ],
  styleUrls: ['./played-list.component.css']
})
export class PlayedListComponent {
  @Input() playerIp: string = '';
  @Input() played: any[] | null = [];
  @Input() playedSorted: any[] | null = [];
  @Input() loading: boolean | null = false;
  @Input() error: string | null = null;
  @Output() playItem = new EventEmitter<any>();

  constructor(private sonosService: SonosService,
              private playlistService: PlaylistService) {
  }

  onPlayItem(item: any) {
    this.playItem.emit(item);
    if (!this.playerIp || !item?.fileUrl) return;
    this.sonosService.play(item.fileUrl, this.playerIp).subscribe(r =>
      this.playlistService.loadPlayedList()
    );
  }
}
