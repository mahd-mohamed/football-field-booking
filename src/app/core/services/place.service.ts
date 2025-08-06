import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { IPlace } from "../models/iplace.model";



@Injectable({
  providedIn: 'root'
})
export class PlaceService {
  private apiUrl = 'http://localhost:8080/api/place';
  private places: IPlace[] = [];
  private nextId = '1';

  constructor(private http: HttpClient) {
    // this.getAllPlaces();
  }

  getAllPlaces(): Observable<IPlace[]> {
    console.log('PlaceService: Fetching all places from API');
    return this.http.get<any>(`${this.apiUrl}/all`).pipe(
      map((response: any) => {
        // Extract places from paginated response
        const places = (!response)? [] : response.content;
        console.log('PlaceService: Retrieved', places.length, 'places from API');

        // Transform places to ensure consistent structure
        const transformedPlaces: IPlace[] = places.map((place: any) => ({
          id: place.id,
          name: place.name,
          location: place.location,
          placeType: place.placeType || 'ELEVEN', // Default if missing
          imageUrl: place.imageUrl,
          description: place.description
        }));

        return transformedPlaces;
      }),
      tap((places: IPlace[]) => {
        this.places = places;
        console.log('PlaceService: Loaded', this.places, 'places into local cache');
      }),
      catchError(error => {
        console.error('PlaceService: Failed to fetch places from API:', error);
        return of(this.places);
      })
    );
  }

  //Done
  addPlace(place: Omit<IPlace, 'id'>): Observable<IPlace> {
    console.log('PlaceService: Starting to add new place:', place);

    // Ensure placeType is in the correct format (FIVE, SEVEN, ELEVEN)
    let placeTypeString = place.placeType;
    if (place.placeType && !['FIVE', 'SEVEN', 'ELEVEN'].includes(place.placeType)) {
      // Try to convert human-readable format to API format
      const converted = this.getPlaceTypeFromString(place.placeType);
      placeTypeString = converted || place.placeType;
    }

    // Transform the place object to match API expectations
    const apiPlace = {
      name: place.name,
      description: place.description,
      location: place.location,
      placeType: placeTypeString,
      imageUrl: place.imageUrl
    };

    console.log('PlaceService: Sending to API endpoint:', `${this.apiUrl}/create`);
    console.log('PlaceService: Request payload:', apiPlace);

    return this.http.post<any>(`${this.apiUrl}`, apiPlace).pipe(
      map((response: any) => {
        console.log('PlaceService: Raw API response:', response);

        // Transform response back to frontend format
        const newPlace: IPlace = {
          id: response.id,
          name: response.name,
          location: response.location,
          placeType: response.placeType || response.type,
          imageUrl: response.imageUrl,
          description: response.description
        };

        console.log('PlaceService: Transformed response to frontend format:', newPlace);
        return newPlace;
      }),
      tap((newPlace: IPlace) => {
        this.places.push(newPlace);
        console.log('PlaceService: Successfully added place to local cache. Total places:', this.places.length);
      }),
      catchError(error => {
        console.error('PlaceService: API request failed with error:', error);
        console.error('PlaceService: Error status:', error.status);
        console.error('PlaceService: Error message:', error.message);

        if (error.error) {
          console.error('PlaceService: Server error details:', error.error);
        }
        return of();
      })
    );
  }


  // Done
  updatePlace(id: string, updated: Partial<Omit<IPlace, 'id'>>): Observable<boolean> {
    console.log('PlaceService: Updating place via API:', id, updated);
    return this.http.patch<IPlace>(`${this.apiUrl}/${id}`, updated).pipe(
      tap((updatedPlace: IPlace) => {
        console.log('PlaceService: Successfully updated place via API:', updatedPlace);
      }),
      map(() => true),
      catchError(error => {
        console.error('PlaceService: Failed to update place via API : ', error);
        return of(true);
      })
    );
  }

  //Done
  deletePlace(id: string): Observable<boolean> {
    console.log('PlaceService: Deleting place via API:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const idx = this.places.findIndex(p => p.id === id);
        if (idx !== -1) {
          this.places.splice(idx, 1);
        }
        console.log('PlaceService: Successfully deleted place via API:', id);
      }),
      map(() => true),
      catchError(error => {
        console.error('PlaceService: Failed to delete place via API, using local storage:', error);
        // Fallback to local storage if API fails
        const idx = this.places.findIndex(p => p.id === id);
        if (idx === -1) return of(false);
        this.places.splice(idx, 1);
        return of(true);
      })
    );
  }

  //Done
  filterPlaces(query: { location?: string; type?: string }): Observable<IPlace[]> {
    console.log('PlaceService: Filtering places:', query);

    // Build query parameters for the API
    let params = new HttpParams();

    if (query.type && query.type.trim() !== '') {
      // Convert human-readable type to API format (FIVE, SEVEN, ELEVEN)
      const apiType = this.getPlaceTypeFromString(query.type) || query.type;
      params = params.set('placeType', apiType);
      console.log('PlaceService: Converted type from', query.type, 'to', apiType);
    }

    if (query.location && query.location.trim() !== '') {
      params = params.set('location', query.location);
    }

    console.log('PlaceService: Fetching filtered places from API with params:', params.toString());

    return this.http.get<any>(`${this.apiUrl}/all`, { params }).pipe(
      map((response: any) => {
        // Extract places from paginated response
        const places = response.content || [];
        console.log('PlaceService: Retrieved', places.length, 'filtered places from API');

        // Transform places to ensure consistent structure
        const transformedPlaces: IPlace[] = places.map((place: any) => ({
          id: place.id,
          name: place.name,
          location: place.location,
          placeType: place.placeType || 'ELEVEN', // Default if missing
          imageUrl: place.imageUrl,
          description: place.description
        }));

        return transformedPlaces;
      }),
      tap((places: IPlace[]) => {
        console.log('PlaceService: Filtered places result:', places);
      }),
      catchError(error => {

        return of([]);
      })
    );
  }


  //Utils

  // Method to get the human-readable representation of the place type
  getPlaceTypeString(type: string): string {
    switch (type) {
      case 'FIVE':
        return '5-a-side';
      case 'SEVEN':
        return '7-a-side';
      case 'ELEVEN':
        return '11-a-side';
      default:
        console.warn('Unknown place type:', type);
        return type || 'Unknown'; // Return the original value if not recognized
    }
  }

  // Method to convert human-readable string back to enum-like string value
  getPlaceTypeFromString(typeString: string): string | null {
    switch (typeString) {
      case '5-a-side':
        return 'FIVE';
      case '7-a-side':
        return 'SEVEN';
      case '11-a-side':
        return 'ELEVEN';
      // Also handle direct values
      case 'FIVE':
      case 'SEVEN':
      case 'ELEVEN':
        return typeString;
      default:
        return null;
    }
  }

  // Method to get all available place types
  getAllPlaceTypes(): string[] {
    return ['FIVE', 'SEVEN', 'ELEVEN'];
  }

}
