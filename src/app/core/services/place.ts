import { Injectable } from '@angular/core';

export interface PlaceModel {
  id: number;
  name: string;
  location: string;
  type: string;
  imageUrl: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class Place {
  private storageKey = 'places';
  private idKey = 'places_nextId';
  private places: PlaceModel[] = [];
  private nextId = 1;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const placesJson = localStorage.getItem(this.storageKey);
    const idJson = localStorage.getItem(this.idKey);
    if (placesJson) {
      this.places = JSON.parse(placesJson);
    } else {
      // Default data if nothing in storage
      this.places = [
        {
          id: 1,
          name: 'Camp Nou',
          location: 'Barcelona',
          type: '11-a-side',
          imageUrl: '/campnou-2-2.jpg',
          description: 'Legendary stadium in Barcelona, home of FC Barcelona.'
        },
        {
          id: 2,
          name: 'Mini Estadi',
          location: 'Barcelona',
          type: '7-a-side',
          imageUrl: '/Mini Estadi.webp',
          description: 'Smaller pitch for 7-a-side games.'
        },
        {
          id: 3,
          name: 'City Arena',
          location: 'Madrid',
          type: '5-a-side',
          imageUrl: '/5.jpg',
          description: 'Popular 5-a-side pitch in Madrid.'
        },
                {
          id: 4,
          name: 'City Arena',
          location: 'Madrid',
          type: '5-a-side',
          imageUrl: '/Mini Estadi.webp',
          description: 'Popular 5-a-side pitch in Madrid.'
        }
        
      ];
      this.nextId = 4;
      this.saveToStorage();
      return;
    }
    this.nextId = idJson ? +idJson : (this.places.length ? Math.max(...this.places.map(p => p.id)) + 1 : 1);
  }

  private saveToStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.places));
    localStorage.setItem(this.idKey, this.nextId.toString());
  }

  getAllPlaces(): PlaceModel[] {
    return [...this.places];
  }

  addPlace(place: Omit<PlaceModel, 'id'>): PlaceModel {
    const newPlace: PlaceModel = { ...place, id: this.nextId++ };
    this.places.push(newPlace);
    this.saveToStorage();
    return newPlace;
  }

  updatePlace(id: number, updated: Partial<Omit<PlaceModel, 'id'>>): boolean {
    const idx = this.places.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.places[idx] = { ...this.places[idx], ...updated };
    this.saveToStorage();
    return true;
  }

  deletePlace(id: number): boolean {
    const idx = this.places.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.places.splice(idx, 1);
    this.saveToStorage();
    return true;
  }

  filterPlaces(query: { location?: string; type?: string }): PlaceModel[] {
    return this.places.filter(p =>
      (!query.location || p.location === query.location) &&
      (!query.type || p.type === query.type)
    );
  }
}
