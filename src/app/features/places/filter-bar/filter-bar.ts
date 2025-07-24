import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.css'
})
export class FilterBar {
  @Input() locations: string[] = [];
  @Input() types: string[] = [];
  @Output() filterChange = new EventEmitter<{ location: string; type: string }>();

  selectedLocation: string = '';
  selectedType: string = '';

  onFilterChange() {
    this.filterChange.emit({
      location: this.selectedLocation,
      type: this.selectedType
    });
  }
}
