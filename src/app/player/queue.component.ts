import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'sonos-queue',
  standalone: true,
  template: `
    <section class="queue-section">
      <h3>Queue</h3>
      @if (queueLoading) {
        <div>Lade Queue...</div>
      }
      @if (queueError) {
        <div>{{ queueError }}</div>
      }
      @if (!queueLoading && !queueError && !!queue.length) {
        <ul>
          @for (item of queue; track item; let i = $index) {
            <li>
              <span (click)="playTrack.emit(i+1)">
                {{ i + 1 }}. {{ item.title || 'Unbekannt' }}
                @if (item.artist) {
                  <span> - {{ item.artist }}</span>
                }
                @if (item.album) {
                  <span> ({{ item.album }})</span>
                }
              </span>
              <button class="remove-btn" (click)="removeTrack.emit(i+1)">-</button>
            </li>
          }
        </ul>
      }
      @if (!queueLoading && !queueError && !(queue && queue.length > 0)) {
        <div>Keine Einträge in der Queue.</div>
      }
    </section>
  `,
  styleUrls: ['./queue.component.css']
})
export class QueueComponent {
  @Input() queue: any[] = [];
  @Input() queueLoading: boolean = false;
  @Input() queueError: string = '';
  @Output() playTrack = new EventEmitter<number>();
  @Output() removeTrack = new EventEmitter<number>();
}
