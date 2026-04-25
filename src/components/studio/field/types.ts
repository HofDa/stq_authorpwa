export interface CurrentGps {
  lat: number;
  lng: number;
  accuracy: number;
}

export type FieldView = 'map' | 'station' | 'list';
