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
  private places: PlaceModel[] = [
    {
      id: 1,
      name: 'Camp Nou',
      location: 'Barcelona',
      type: '11 side',
      imageUrl: '/campnou-2-2.jpg',
      description: 'Legendary stadium in Barcelona, home of FC Barcelona.'
    },
    {
      id: 2,
      name: 'Mini Estadi',
      location: 'Barcelona',
      type: '7 side',
      imageUrl: '/Mini Estadi.webp',
      description: 'Smaller pitch for 7-a-side games.'
    },
    {
      id: 3,
      name: 'City Arena',
      location: 'Madrid',
      type: '5 side',
      imageUrl: '/5.jpg',
      description: 'Popular 5-a-side pitch in Madrid.'
    }
    
  ];
  private nextId = 4;

  getAllPlaces(): PlaceModel[] {
    return [...this.places];
  }

  addPlace(place: Omit<PlaceModel, 'id'>): PlaceModel {
    const newPlace: PlaceModel = { ...place, id: this.nextId++ };
    this.places.push(newPlace);
    return newPlace;
  }

  updatePlace(id: number, updated: Partial<Omit<PlaceModel, 'id'>>): boolean {
    const idx = this.places.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.places[idx] = { ...this.places[idx], ...updated };
    return true;
  }

  deletePlace(id: number): boolean {
    const idx = this.places.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.places.splice(idx, 1);
    return true;
  }

  filterPlaces(query: { location?: string; type?: string }): PlaceModel[] {
    return this.places.filter(p =>
      (!query.location || p.location === query.location) &&
      (!query.type || p.type === query.type)
    );
  }
}
