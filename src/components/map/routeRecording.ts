import type { RecordedRoutePoint } from '@/schema';
import { calculateRouteLengthMeters } from '@/map/routePlanning';

export function createRecordedRoutePoint(
  position: GeolocationPosition,
): RecordedRoutePoint {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  };
}

export function shouldAppendRecordedPoint(
  previous: RecordedRoutePoint | undefined,
  next: RecordedRoutePoint,
) {
  if (next.accuracy && next.accuracy > 80) {
    return false;
  }
  if (!previous) {
    return true;
  }

  const elapsedMs = next.timestamp - previous.timestamp;
  const deltaMeters = calculateRouteLengthMeters([previous, next]);
  return elapsedMs >= 3_000 || deltaMeters >= 4;
}

