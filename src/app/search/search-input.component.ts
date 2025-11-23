import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.css']
})
export class SearchInputComponent {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  onInputChange(newValue: string) {
    this.value = newValue;
    this.valueChange.emit(newValue);
  }
}
