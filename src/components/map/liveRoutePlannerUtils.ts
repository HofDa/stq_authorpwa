import type { Locale, RiddleEntry } from '@/schema';
import { getStationLocationLabel } from '@/utils/localizedContent';

export function formatDistanceMeters(distanceMeters: number) {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(distanceMeters)} m`;
}

export function formatStationLabel(station: RiddleEntry, locale?: Locale) {
  return getStationLocationLabel(station, locale, station.id);
}
