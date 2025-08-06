import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IPlace } from '../../../core/models/iplace.model';
import { AuthService } from '../../../core/services/auth.service';
import { PlaceService } from '../../../core/services/place.service';


@Component({
  selector: 'app-place-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './place-details.html',
  styleUrl: './place-details.css'
})
export class PlaceDetails implements OnInit {
  @Input() place!: IPlace;
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  placeType!: string;

  constructor(private auth: AuthService, private placeService: PlaceService) {}

  ngOnInit() {
    // Convert place type to human-readable string
    this.placeType = this.placeService.getPlaceTypeString(this.place.placeType);
  }

  get isAdmin(): boolean {
    const user = this.auth.getCurrentUser();
    return !!user && user.role === 'ADMIN';
  }

  editPlace() {
    this.edit.emit();
  }

  deletePlace() {
    this.delete.emit();
  }
}
