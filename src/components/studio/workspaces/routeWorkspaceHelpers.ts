import type { RecordedRoutePoint, RiddleEntry } from '@/schema';
import { hasUsableStationCoordinate } from '@/utils/coordinates';

export const ROUTE_STATION_SNAP_METERS = 20;
export const ROUTE_DUPLICATE_POINT_METERS = 1;

const EARTH_RADIUS_METERS = 6_371_000;

export interface RecordedSegmentSlice {
  start: number;
  end: number;
}

export function stationAnchorPoint(
  station: RiddleEntry,
  timestamp: number,
): RecordedRoutePoint {
  return {
    lat: station.position_lat,
    lng: station.position_lng,
    timestamp,
  };
}

export function normalizeSegmentForSave(
  points: RecordedRoutePoint[],
  from: RiddleEntry,
  to: RiddleEntry,
  timestamp: number,
): RecordedRoutePoint[] {
  const segment = points.slice();
  const fromAnchor = stationAnchorPoint(from, timestamp - 1);
  const toAnchor = stationAnchorPoint(to, timestamp);

  if (segment.length === 0 || !isNearStation(segment[0], from)) {
    segment.unshift(fromAnchor);
  } else {
    segment[0] = { ...segment[0], lat: fromAnchor.lat, lng: fromAnchor.lng };
  }

  const last = segment[segment.length - 1];
  if (!last || !isNearStation(last, to)) {
    segment.push(toAnchor);
  } else {
    segment[segment.length - 1] = {
      ...last,
      lat: toAnchor.lat,
      lng: toAnchor.lng,
    };
  }

  return segment;
}

export function findSegmentSlice(
  recordedRoute: RecordedRoutePoint[],
  from: RiddleEntry,
  to: RiddleEntry,
): RecordedSegmentSlice | null {
  if (!hasUsableStationCoordinate(from) || !hasUsableStationCoordinate(to)) {
    return null;
  }

  let start = -1;
  for (let index = 0; index < recordedRoute.length; index += 1) {
    if (isNearStation(recordedRoute[index], from)) {
      start = index;
      break;
    }
  }
  if (start === -1) return null;

  let end = -1;
  for (let index = start + 1; index < recordedRoute.length; index += 1) {
    if (isNearStation(recordedRoute[index], to)) {
      end = index;
      break;
    }
  }
  if (end === -1) return null;

  return { start, end };
}

export function getRecordedSegmentSlices(
  stations: RiddleEntry[],
  recordedRoute: RecordedRoutePoint[],
): RecordedSegmentSlice[] {
  const slices: RecordedSegmentSlice[] = [];
  let searchStart = 0;

  for (let index = 0; index < stations.length - 1; index += 1) {
    const from = stations[index];
    const to = stations[index + 1];
    if (!hasUsableStationCoordinate(from) || !hasUsableStationCoordinate(to)) {
      continue;
    }

    const fromCoord = { lat: from.position_lat, lng: from.position_lng };
    const toCoord = { lat: to.position_lat, lng: to.position_lng };
    let start = -1;
    for (
      let routeIndex = searchStart;
      routeIndex < recordedRoute.length;
      routeIndex += 1
    ) {
      if (
        distanceMeters(recordedRoute[routeIndex], fromCoord) <=
        ROUTE_STATION_SNAP_METERS
      ) {
        start = routeIndex;
        break;
      }
    }
    if (start === -1) continue;

    let end = -1;
    for (
      let routeIndex = start + 1;
      routeIndex < recordedRoute.length;
      routeIndex += 1
    ) {
      if (
        distanceMeters(recordedRoute[routeIndex], toCoord) <=
        ROUTE_STATION_SNAP_METERS
      ) {
        end = routeIndex;
        break;
      }
    }
    if (end === -1) continue;

    slices.push({ start, end });
    searchStart = end;
  }

  return slices;
}

export function findNearestStationAnchorIndex(
  recordedRoute: RecordedRoutePoint[],
  station: RiddleEntry,
): number {
  if (!hasUsableStationCoordinate(station)) return -1;

  for (let index = recordedRoute.length - 1; index >= 0; index -= 1) {
    if (isNearStation(recordedRoute[index], station)) {
      return index;
    }
  }

  return -1;
}

export function isNearStation(
  point: { lat: number; lng: number },
  station: RiddleEntry,
): boolean {
  if (!hasUsableStationCoordinate(station)) return false;
  return (
    distanceMeters(point, {
      lat: station.position_lat,
      lng: station.position_lng,
    }) <= ROUTE_STATION_SNAP_METERS
  );
}

export function findNearbyStation(
  point: { lat: number; lng: number },
  stationsWithCoordinates: RiddleEntry[],
): RiddleEntry | null {
  return (
    stationsWithCoordinates.find(
      (station) =>
        distanceMeters(point, {
          lat: station.position_lat,
          lng: station.position_lng,
        }) <= ROUTE_STATION_SNAP_METERS,
    ) ?? null
  );
}

export function distanceMeters(
  left: { lat: number; lng: number },
  right: { lat: number; lng: number },
): number {
  const lat1 = left.lat * (Math.PI / 180);
  const lat2 = right.lat * (Math.PI / 180);
  const deltaLat = (right.lat - left.lat) * (Math.PI / 180);
  const deltaLng = (right.lng - left.lng) * (Math.PI / 180);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '0 m';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2).replace('.', ',')} km`;
}
