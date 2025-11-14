import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'sonos-queue',
  standalone: true,
  template: `
    <section class="queue-section">
      <div class="queue-header" style="display: flex; align-items: center; justify-content: space-between;">
        <h3 style="margin: 0;">Queue</h3>
        <button class="seek-btn queue-btn"
                (click)="onSetQueue()"
                [disabled]="queueLoading">
          @if (queueLoading) {
            <span class="spinner" style="display: inline-block; width: 1em; height: 1em; border: 2px solid #00b; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
          } @else {
            ▶️☰
          }
        </button>
      </div>
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
  @Output() queuePlay = new EventEmitter<{ track: number, fileUrl: string }>();

  onSetQueue() {
    // Finde den ersten Eintrag in der Queue
    if (!this.queue || this.queue.length === 0) return;
    // Standard: spiele den ersten Track ab
    const first = this.queue[0];
    const fileUrl = first.uri || first.fileUrl;
    this.queuePlay.emit({ track: 1, fileUrl });
  }
}
