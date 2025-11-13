import { Component, Input } from '@angular/core';

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
              {{ i + 1 }}. {{ item.title || 'Unbekannt' }}
              @if (item.artist) {
                <span> - {{ item.artist }}</span>
              }
              @if (item.album) {
                <span> ({{ item.album }})</span>
              }
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
}
