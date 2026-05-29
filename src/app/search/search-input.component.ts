import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {BalButton, BalTooltip} from '@baloise/ds-angular';

interface SearchInput {
  term: string;
  latest: boolean;
}

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule, BalButton, BalTooltip],
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.css']
})
export class SearchInputComponent {
  @Input() value: SearchInput = { term: '', latest: false };
  @Output() valueChange = new EventEmitter<SearchInput>();
  @Output() showLatest = new EventEmitter<SearchInput>();
  @Output() playRandom = new EventEmitter<void>();

  onInputChange(newValue: string) {
    this.value = { ...this.value, term: newValue, latest: false };
    this.valueChange.emit(this.value);
  }

  onShowLatest() {
    this.value = { ...this.value, latest: true };
    this.showLatest.emit(this.value);
  }

  onPlayRandom() {
    this.playRandom.emit();
  }
}
