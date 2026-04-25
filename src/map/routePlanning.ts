import type { RecordedRoutePoint, RiddleEntry } from '@/schema';
import { hasUsableStationCoordinate } from '@/utils/coordinates';

const EARTH_RADIUS_METERS = 6_371_000;

export interface DerivedStationPath {
  stationId: string;
  polylineString: string;
  pointCount: number;
  distanceMeters: number;
}

export interface StationRouteDerivation {
  optimizedRoute: RecordedRoutePoint[];
  stationPaths: DerivedStationPath[];
  warnings: string[];
}

export function calculateRouteLengthMeters(points: RecordedRoutePoint[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distanceMeters(points[index - 1], points[index]);
  }
  return total;
}

export function simplifyRoute(
  points: RecordedRoutePoint[],
  toleranceMeters: number,
): RecordedRoutePoint[] {
  if (points.length <= 2 || toleranceMeters <= 0) {
    return dedupeRoute(points);
  }

  const deduped = dedupeRoute(points);
  if (deduped.length <= 2) {
    return deduped;
  }

  const keep = new Array(deduped.length).fill(false);
  keep[0] = true;
  keep[deduped.length - 1] = true;
  simplifySection(deduped, 0, deduped.length - 1, toleranceMeters, keep);
  return deduped.filter((_, index) => keep[index]);
}

export function deriveStationPathsFromRecordedRoute(
  stations: RiddleEntry[],
  recordedRoute: RecordedRoutePoint[],
  toleranceMeters: number,
): StationRouteDerivation {
  const warnings: string[] = [];
  const orderedStations = [...stations].sort((left, right) => left.number - right.number);
  const optimizedRoute = simplifyRoute(recordedRoute, toleranceMeters);

  if (orderedStations.length === 0) {
    warnings.push('No stations exist yet, so no station paths could be generated.');
    return { optimizedRoute, stationPaths: [], warnings };
  }

  const skippedStations = orderedStations.filter(
    (station) => !hasUsableStationCoordinate(station),
  );
  if (skippedStations.length > 0) {
    warnings.push(
      `Skipped ${skippedStations.length} station${
        skippedStations.length === 1 ? '' : 's'
      } without usable coordinates: ${skippedStations
        .map((station) => station.number)
        .join(', ')}.`,
    );
  }

  const usableStations = orderedStations.filter(hasUsableStationCoordinate);
  if (usableStations.length === 0) {
    warnings.push(
      'Add GPS coordinates to at least one station before generating optimized station paths.',
    );
    return { optimizedRoute, stationPaths: [], warnings };
  }

  if (optimizedRoute.length < 2) {
    warnings.push('Record more route points before generating optimized station paths.');
    return { optimizedRoute, stationPaths: [], warnings };
  }

  const stationPaths: DerivedStationPath[] = [];
  let searchStartIndex = 0;

  for (let index = 0; index < usableStations.length; index += 1) {
    const station = usableStations[index];
    const nearestIndex = findNearestRouteIndexFrom(
      optimizedRoute,
      station.position_lat,
      station.position_lng,
      searchStartIndex,
    );

    const nearestPoint = optimizedRoute[nearestIndex];
    const nearestDistance = distanceMeters(nearestPoint, {
      lat: station.position_lat,
      lng: station.position_lng,
    });

    if (nearestDistance > 80) {
      warnings.push(
        `Station ${station.number} is ${Math.round(nearestDistance)}m away from the recorded track.`,
      );
    }

    const segmentStart = index === 0 ? 0 : searchStartIndex;
    const segment = optimizedRoute.slice(segmentStart, nearestIndex + 1);
    const completedSegment = ensureSegmentEndsAtStation(segment, station);

    stationPaths.push({
      stationId: station.id,
      polylineString: encodePolyline(completedSegment),
      pointCount: completedSegment.length,
      distanceMeters: calculateRouteLengthMeters(completedSegment),
    });

    searchStartIndex = nearestIndex;
  }

  return { optimizedRoute, stationPaths, warnings };
}

export function encodePolyline(points: RecordedRoutePoint[]): string {
  let lastLat = 0;
  let lastLng = 0;
  let result = '';

  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);
    result += encodeCoordinate(lat - lastLat);
    result += encodeCoordinate(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }

  return result;
}

function encodeCoordinate(value: number): string {
  let coord = value < 0 ? ~(value << 1) : value << 1;
  let output = '';

  while (coord >= 0x20) {
    output += String.fromCharCode((0x20 | (coord & 0x1f)) + 63);
    coord >>= 5;
  }

  output += String.fromCharCode(coord + 63);
  return output;
}

function dedupeRoute(points: RecordedRoutePoint[]): RecordedRoutePoint[] {
  return points.filter((point, index) => {
    if (index === 0) return true;
    return distanceMeters(point, points[index - 1]) > 1;
  });
}

function simplifySection(
  points: RecordedRoutePoint[],
  startIndex: number,
  endIndex: number,
  toleranceMeters: number,
  keep: boolean[],
) {
  if (endIndex - startIndex <= 1) {
    return;
  }

  let maxDistance = 0;
  let maxDistanceIndex = -1;

  for (let index = startIndex + 1; index < endIndex; index += 1) {
    const distance = perpendicularDistanceMeters(
      points[index],
      points[startIndex],
      points[endIndex],
    );
    if (distance > maxDistance) {
      maxDistance = distance;
      maxDistanceIndex = index;
    }
  }

  if (maxDistanceIndex === -1 || maxDistance <= toleranceMeters) {
    return;
  }

  keep[maxDistanceIndex] = true;
  simplifySection(points, startIndex, maxDistanceIndex, toleranceMeters, keep);
  simplifySection(points, maxDistanceIndex, endIndex, toleranceMeters, keep);
}

function perpendicularDistanceMeters(
  point: RecordedRoutePoint,
  start: RecordedRoutePoint,
  end: RecordedRoutePoint,
): number {
  const originLat = ((start.lat + end.lat) / 2) * (Math.PI / 180);
  const projectedPoint = projectPoint(point, originLat);
  const projectedStart = projectPoint(start, originLat);
  const projectedEnd = projectPoint(end, originLat);

  const dx = projectedEnd.x - projectedStart.x;
  const dy = projectedEnd.y - projectedStart.y;
  if (dx === 0 && dy === 0) {
    return distanceMeters(point, start);
  }

  const ratio = clamp(
    ((projectedPoint.x - projectedStart.x) * dx +
      (projectedPoint.y - projectedStart.y) * dy) /
      (dx * dx + dy * dy),
    0,
    1,
  );

  const closestX = projectedStart.x + ratio * dx;
  const closestY = projectedStart.y + ratio * dy;
  return Math.hypot(projectedPoint.x - closestX, projectedPoint.y - closestY);
}

function projectPoint(point: { lat: number; lng: number }, originLat: number) {
  return {
    x: point.lng * (Math.PI / 180) * EARTH_RADIUS_METERS * Math.cos(originLat),
    y: point.lat * (Math.PI / 180) * EARTH_RADIUS_METERS,
  };
}

function distanceMeters(
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

function findNearestRouteIndexFrom(
  route: RecordedRoutePoint[],
  lat: number,
  lng: number,
  startIndex: number,
): number {
  let bestIndex = clamp(startIndex, 0, route.length - 1);
  let bestDistance = distanceMeters(route[bestIndex], { lat, lng });

  for (let index = bestIndex + 1; index < route.length; index += 1) {
    const distance = distanceMeters(route[index], { lat, lng });
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function ensureSegmentEndsAtStation(
  segment: RecordedRoutePoint[],
  station: RiddleEntry,
): RecordedRoutePoint[] {
  if (segment.length === 0) {
    return [
      {
        lat: station.position_lat,
        lng: station.position_lng,
        timestamp: Date.now(),
      },
    ];
  }

  const stationPoint: RecordedRoutePoint = {
    lat: station.position_lat,
    lng: station.position_lng,
    timestamp: segment[segment.length - 1]?.timestamp ?? Date.now(),
  };

  const lastPoint = segment[segment.length - 1];
  if (distanceMeters(lastPoint, stationPoint) <= 3) {
    return segment;
  }

  return [...segment, stationPoint];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
