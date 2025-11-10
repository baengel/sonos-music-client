import { Component } from '@angular/core';
import { VolumeControlComponent } from './volume-control.component';
import {SeekButtonsComponent} from './seek-buttons.component';
import {StopButtonComponent} from './stop-button.component';

@Component({
  selector: 'app-player',
  imports: [VolumeControlComponent, SeekButtonsComponent, StopButtonComponent],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent {}
