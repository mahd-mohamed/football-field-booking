import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaceService } from '../../../core/services/place.service';
import { IPlace } from '../../../core/models/iplace.model';
import { FilterBar } from '../filter-bar/filter-bar';
import { PlaceDetails } from '../place-details/place-details';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-place-list',
  imports: [CommonModule, FilterBar, PlaceDetails, FormsModule],
  templateUrl: './place-list.html',
  styleUrl: './place-list.css'
})
export class PlaceList implements OnInit, OnDestroy {
  allPlaces: IPlace[] = [];
  places: IPlace[] = [];
  locations: string[] = [];
  types: string[] = [];

  showDetailsModal = false;
  selectedPlace: IPlace | null = null;
  showAddPlaceModal = false;
  newPlace = { name: '', location: '', placeType: '', imageUrl: '', description: '' };
  showEditPlaceModal = false;
  editPlaceData: any = null;
  showDeleteConfirmModal = false;
  successMessage = '';
  deletePlaceId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private placeService: PlaceService, private auth: AuthService) {}

  ngOnInit() {
    this.loadPlaces();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlaces() {
    this.placeService.getAllPlaces().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (places) => {
        console.log('PlaceList: Loaded', places.length, 'places');
        this.allPlaces = places;
        this.places = [...this.allPlaces];
        this.locations = Array.from(new Set(this.allPlaces.map(p => p.location).filter(loc => loc)));

        // Get unique types and transform them to human-readable strings
        const uniqueTypes = Array.from(new Set(this.allPlaces.map(p => p.placeType).filter(type => type)));
        this.types = uniqueTypes.map(type => this.getPlaceTypeString(type));

        // Debug: Check for any places with undefined type
        const placesWithUndefinedType = this.allPlaces.filter(p => !p.placeType);
        if (placesWithUndefinedType.length > 0) {
          console.warn('Places with undefined type:', placesWithUndefinedType);
        }
      },
      error: (error) => {
        console.error('Failed to load places:', error);
        this.successMessage = '';
        // You might want to show an error message to the user
      }
    });
  }

  get isAdmin(): boolean {
    const user = this.auth.getCurrentUser();
    return !!user && user.role === 'ADMIN';
  }

  get placeTypes() {
    return this.placeService.getAllPlaceTypes();
  }

  // Method to get the human-readable type string
  getPlaceTypeString(type: string): string {
    return this.placeService.getPlaceTypeString(type);
  }

  onFilterChange(filter: { location: string; type: string }) {
    // Use string type directly for filtering
    const actualFilter = {
      location: filter.location,
      type: filter.type || ''
    };

    this.placeService.filterPlaces(actualFilter).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (filteredPlaces) => {
        this.places = filteredPlaces;
      },
      error: (error) => {
        console.error('Failed to filter places:', error);
      }
    });
  }

  openDetails(place: IPlace) {
    this.selectedPlace = place;
    this.showDetailsModal = true;
  }

  closeDetails() {
    this.showDetailsModal = false;
    this.selectedPlace = null;
  }

  openAddPlaceModal() {
    this.showAddPlaceModal = true;
    this.newPlace = { name: '', location: '', placeType: '', imageUrl: '', description: '' };
  }

  closeAddPlaceModal() {
    this.showAddPlaceModal = false;
  }

  addPlace() {
    console.log('AddPlace called with:', this.newPlace);

    if (!this.newPlace.name || !this.newPlace.location || !this.newPlace.placeType || !this.newPlace.imageUrl || !this.newPlace.description) {
      console.warn('Form validation failed:', {
        name: !!this.newPlace.name,
        location: !!this.newPlace.location,
        placeType: !!this.newPlace.placeType,
        imageUrl: !!this.newPlace.imageUrl,
        description: !!this.newPlace.description
      });
      return;
    }

    console.log('Sending to service:', {
      name: this.newPlace.name,
      location: this.newPlace.location,
      placeType: this.newPlace.placeType,
      imageUrl: this.newPlace.imageUrl,
      description: this.newPlace.description
    });

    this.placeService.addPlace({
      name: this.newPlace.name,
      location: this.newPlace.location,
      placeType: this.newPlace.placeType,
      imageUrl: this.newPlace.imageUrl,
      description: this.newPlace.description
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (newPlace) => {
        console.log('Place added successfully:', newPlace);
        this.refreshPlaces();
        this.closeAddPlaceModal();
        this.successMessage = 'Place added successfully!';
        // Success message will be cleared by user interaction or page navigation
      },
      error: (error) => {
        console.error('Failed to add place:', error);
        this.successMessage = '';
        // You might want to show an error message to the user
      }
    });
  }

  openEditPlaceModal() {
    if (!this.selectedPlace) return;

    // Copy the selected place data
    this.editPlaceData = { ...this.selectedPlace };

    // Debug: Check the current placeType value and available options
    console.log('Edit modal - Original placeType:', this.editPlaceData.placeType);
    console.log('Edit modal - Available placeTypes:', this.placeTypes);
    console.log('Edit modal - Available string values:', ['FIVE', 'SEVEN', 'ELEVEN']);

    // Ensure the placeType value matches exactly with one of the dropdown options
    // The dropdown expects string values like "FIVE", "SEVEN", "ELEVEN"
    if (this.editPlaceData.placeType) {
      const currentType = this.editPlaceData.placeType.toString().toUpperCase();

      // Check if the current type is one of the valid enum values
      const validTypes = ['FIVE', 'SEVEN', 'ELEVEN'];
      if (validTypes.includes(currentType)) {
        this.editPlaceData.placeType = currentType;
        console.log('Edit modal - Set placeType to:', this.editPlaceData.placeType);
      } else {
        console.warn('Edit modal - Invalid placeType value:', this.editPlaceData.placeType);
        // Try to map common variations
        switch (currentType) {
          case '5':
          case '5-A-SIDE':
            this.editPlaceData.placeType = 'FIVE';
            break;
          case '7':
          case '7-A-SIDE':
            this.editPlaceData.placeType = 'SEVEN';
            break;
          case '11':
          case '11-A-SIDE':
            this.editPlaceData.placeType = 'ELEVEN';
            break;
          default:
            this.editPlaceData.placeType = 'ELEVEN'; // Default fallback
        }
        console.log('Edit modal - Corrected placeType to:', this.editPlaceData.placeType);
      }
    } else {
      // If no placeType, set default
      this.editPlaceData.placeType = 'ELEVEN';
      console.log('Edit modal - No placeType found, setting default to ELEVEN');
    }

    this.showEditPlaceModal = true;
    this.closeDetails();
  }

  closeEditPlaceModal() {
    this.showEditPlaceModal = false;
    this.editPlaceData = null;
  }

  saveEditPlace() {
    console.log('SaveEditPlace called with:', this.editPlaceData);
    if (!this.editPlaceData) return;

    // The placeType should already be in the correct enum format (FIVE, SEVEN, ELEVEN)
    // from the dropdown selection
    console.log('Saving place with placeType:', this.editPlaceData.placeType);

    this.placeService.updatePlace(this.editPlaceData.id, {
      name: this.editPlaceData.name,
      location: this.editPlaceData.location,
      placeType: this.editPlaceData.placeType,
      imageUrl: this.editPlaceData.imageUrl,
      description: this.editPlaceData.description
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (success) => {
        console.log('Update place response - success flag:', success);
        if (success) {
          console.log('Place updated successfully:', this.editPlaceData);
          this.loadPlaces(); // Reload places to refresh the list
          this.closeEditPlaceModal();
          this.successMessage = 'Place updated successfully!';
          // Success message will be cleared by user interaction or page navigation
        } else {
          console.error('Update failed - service returned false');
          this.successMessage = 'Failed to update place. Please try again.';
          // Error message will be cleared by user interaction or page navigation
        }
      },
      error: (error) => {
        console.error('Failed to update place - error occurred:', error);
        this.successMessage = 'Error updating place. Please try again.';
        // Error message will be cleared by user interaction or page navigation
      }
    });
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
      this.placeService.deletePlace(this.deletePlaceId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (success) => {
          if (success) {
            this.refreshPlaces();
            this.successMessage = 'Place deleted successfully!';
            // Success message will be cleared by user interaction or page navigation
          }
        },
        error: (error) => {
          console.error('Failed to delete place:', error);
          this.successMessage = '';
          // You might want to show an error message to the user
        }
      });
    }
    this.closeDeleteConfirmModal();
  }

  refreshPlaces() {
    this.loadPlaces();
  }
}
