import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'volume-control',
  standalone: true,
  templateUrl: './volume-control.component.html',
  styleUrls: ['./volume-control.component.css']
})
export class VolumeControlComponent {
  @Input() volume: number = 30;
  @Input() disabled: boolean = false;
  @Input() playerIp: string = '';
  @Output() onVolumeChange = new EventEmitter<any>();
}
