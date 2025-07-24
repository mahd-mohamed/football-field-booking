import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Place, PlaceModel } from '../../../core/services/place';
import { FilterBar } from '../filter-bar/filter-bar';
import { PlaceDetails } from '../place-details/place-details';
import { Auth } from '../../../core/services/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-place-list',
  imports: [CommonModule, FilterBar, PlaceDetails, FormsModule],
  templateUrl: './place-list.html',
  styleUrl: './place-list.css'
})
export class PlaceList implements OnInit {
  allPlaces: PlaceModel[] = [];
  places: PlaceModel[] = [];
  locations: string[] = [];
  types: string[] = [];

  showDetailsModal = false;
  selectedPlace: PlaceModel | null = null;
  showAddPlaceModal = false;
  newPlace = { name: '', location: '', type: '', imageUrl: '', description: '' };
  showEditPlaceModal = false;
  editPlaceData: any = null;
  showDeleteConfirmModal = false;
  successMessage = '';
  deletePlaceId: number | null = null;

  constructor(private placeService: Place, private auth: Auth) {}

  ngOnInit() {
    this.allPlaces = this.placeService.getAllPlaces();
    this.places = [...this.allPlaces];
    this.locations = Array.from(new Set(this.allPlaces.map(p => p.location)));
    this.types = Array.from(new Set(this.allPlaces.map(p => p.type)));
  }

  get isAdmin(): boolean {
    const user = this.auth.getCurrentUser();
    return !!user && user.role === 'ADMIN';
  }

  onFilterChange(filter: { location: string; type: string }) {
    this.places = this.placeService.filterPlaces(filter);
  }

  openDetails(place: PlaceModel) {
    this.selectedPlace = place;
    this.showDetailsModal = true;
  }

  closeDetails() {
    this.showDetailsModal = false;
    this.selectedPlace = null;
  }

  openAddPlaceModal() {
    this.showAddPlaceModal = true;
    this.newPlace = { name: '', location: '', type: '', imageUrl: '', description: '' };
  }

  closeAddPlaceModal() {
    this.showAddPlaceModal = false;
  }

  addPlace() {
    if (!this.newPlace.name || !this.newPlace.location || !this.newPlace.type || !this.newPlace.imageUrl || !this.newPlace.description) return;
    this.placeService.addPlace({
      name: this.newPlace.name,
      location: this.newPlace.location,
      type: this.newPlace.type,
      imageUrl: this.newPlace.imageUrl,
      description: this.newPlace.description
    });
    this.refreshPlaces();
    this.closeAddPlaceModal();
  }

  openEditPlaceModal() {
    if (!this.selectedPlace) return;
    this.editPlaceData = { ...this.selectedPlace };
    this.showEditPlaceModal = true;
    this.closeDetails();
  }

  closeEditPlaceModal() {
    this.showEditPlaceModal = false;
    this.editPlaceData = null;
  }

  saveEditPlace() {
    if (!this.editPlaceData) return;
    this.placeService.updatePlace(this.editPlaceData.id, {
      name: this.editPlaceData.name,
      location: this.editPlaceData.location,
      type: this.editPlaceData.type,
      imageUrl: this.editPlaceData.imageUrl,
      description: this.editPlaceData.description
    });
    this.refreshPlaces();
    this.closeEditPlaceModal();
    this.successMessage = 'Place updated successfully!';
    setTimeout(() => this.successMessage = '', 2500);
  }

  confirmDeletePlace() {
    if (this.selectedPlace) {
      this.deletePlaceId = this.selectedPlace.id;
    }
    this.closeDetails();
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal() {
    this.showDeleteConfirmModal = false;
    this.deletePlaceId = null;
  }

  deletePlaceConfirmed() {
    if (this.deletePlaceId !== null) {
      this.placeService.deletePlace(this.deletePlaceId);
      this.refreshPlaces();
      this.successMessage = 'Place deleted successfully!';
      setTimeout(() => this.successMessage = '', 2500);
    }
    this.closeDeleteConfirmModal();
  }

  refreshPlaces() {
    this.allPlaces = this.placeService.getAllPlaces();
    this.places = [...this.allPlaces];
    this.locations = Array.from(new Set(this.allPlaces.map(p => p.location)));
    this.types = Array.from(new Set(this.allPlaces.map(p => p.type)));
  }
}
