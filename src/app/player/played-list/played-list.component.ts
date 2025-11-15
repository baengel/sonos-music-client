import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'played-list',
  standalone: true,
  templateUrl: './played-list.component.html',
  styleUrls: ['./played-list.component.css']
})
export class PlayedListComponent {
  @Input() played: any[] | null = [];
  @Input() playedSorted: any[] | null = [];
  @Input() loading: boolean | null = false;
  @Input() error: string | null = null;
  @Output() playItem = new EventEmitter<any>();
}
