export interface IPlace {
  id: string;
  name: string;
  location: string;
  placeType: string; 
  imageUrl: string;
  description?: string; // Optional field for additional details
}
