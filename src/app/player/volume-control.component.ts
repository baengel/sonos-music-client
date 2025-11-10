import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'volume-control',
  standalone: true,
  template: `
    <label for="volume-slider">Lautstärke:</label>
    <input id="volume-slider"
           type="range"
           min="1" max="100"
           [value]="volume"
           (input)="onVolumeChange.emit($event)"
           [disabled]="disabled">
    <span>{{ volume }}</span>
  `
})
export class VolumeControlComponent {
  @Input() volume: number = 30;
  @Input() disabled: boolean = false;
  @Output() onVolumeChange = new EventEmitter<any>();
}

