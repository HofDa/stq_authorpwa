import type { RiddleEntry } from '@/schema';

export function formatDistanceMeters(distanceMeters: number) {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(distanceMeters)} m`;
}

export function formatStationLabel(station: RiddleEntry) {
  return (
    station.en.location ||
    station.de.location ||
    station.it.location ||
    station.id
  );
}

