import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'volume-control',
  standalone: true,
  templateUrl: './volume-control.component.html',
  styleUrls: ['./volume-control.component.css']
})
export class VolumeControlComponent {
  @Input() volume: number = 30;
  @Input() disabled: boolean = false;
  @Output() onVolumeChange = new EventEmitter<any>();
}

