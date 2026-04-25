export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function isPlaceholderCoordinate(lat: number, lng: number): boolean {
  return lat === 0 && lng === 0;
}

export function hasUsableStationCoordinate(station: {
  position_lat: number;
  position_lng: number;
}): boolean {
  return (
    isValidCoordinate(station.position_lat, station.position_lng) &&
    !isPlaceholderCoordinate(station.position_lat, station.position_lng)
  );
}
