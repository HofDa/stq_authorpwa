import { describe, expect, it } from 'vitest';
import type { RecordedRoutePoint, RiddleEntry } from '@/schema';
import { buildValidStation } from '@/test/fixtures';
import {
  distanceMeters,
  findNearbyStation,
  findNearestStationAnchorIndex,
  findSegmentSlice,
  formatDistance,
  getRecordedSegmentSlices,
  isNearStation,
  normalizeSegmentForSave,
  stationAnchorPoint,
} from './routeWorkspaceHelpers';

const EARTH_RADIUS_METERS = 6_371_000;

function station(
  id: string,
  number: number,
  lat: number,
  lng: number,
): RiddleEntry {
  const entry = buildValidStation(id, number);
  entry.position_lat = lat;
  entry.position_lng = lng;
  return entry;
}

function invalidStation(id: string, number: number): RiddleEntry {
  return station(id, number, 0, 0);
}

function point(
  lat: number,
  lng: number,
  timestamp: number,
): RecordedRoutePoint {
  return { lat, lng, timestamp };
}

function pointNorthOf(
  entry: RiddleEntry,
  meters: number,
  timestamp = 1,
): RecordedRoutePoint {
  return {
    lat:
      entry.position_lat +
      (meters / EARTH_RADIUS_METERS) * (180 / Math.PI),
    lng: entry.position_lng,
    timestamp,
  };
}

describe('routeWorkspaceHelpers', () => {
  it('builds station anchor points from station coordinates', () => {
    const from = station('station-a', 1, 46.5, 11.35);

    expect(stationAnchorPoint(from, 123)).toEqual({
      lat: 46.5,
      lng: 11.35,
      timestamp: 123,
    });
  });

  it('normalizes a segment by inserting missing station anchors', () => {
    const from = station('station-a', 1, 46.5, 11.35);
    const to = station('station-b', 2, 46.501, 11.351);
    const interior = point(46.5005, 11.3505, 100);

    const normalized = normalizeSegmentForSave([interior], from, to, 200);

    expect(normalized).toEqual([
      { lat: from.position_lat, lng: from.position_lng, timestamp: 199 },
      interior,
      { lat: to.position_lat, lng: to.position_lng, timestamp: 200 },
    ]);
  });

  it('snaps existing endpoint points to exact station coordinates without mutating input', () => {
    const from = station('station-a', 1, 46.5, 11.35);
    const to = station('station-b', 2, 46.501, 11.351);
    const input = [
      pointNorthOf(from, 5, 10),
      point(46.5005, 11.3505, 11),
      pointNorthOf(to, 5, 12),
    ];
    const original = input.map((entry) => ({ ...entry }));

    const normalized = normalizeSegmentForSave(input, from, to, 200);

    expect(input).toEqual(original);
    expect(normalized[0]).toEqual({
      ...input[0],
      lat: from.position_lat,
      lng: from.position_lng,
    });
    expect(normalized.at(-1)).toEqual({
      ...input[2],
      lat: to.position_lat,
      lng: to.position_lng,
    });
  });

  it('finds inclusive segment slices between station anchors', () => {
    const from = station('station-a', 1, 46.5, 11.35);
    const to = station('station-b', 2, 46.501, 11.351);
    const route = [
      point(46.499, 11.349, 1),
      stationAnchorPoint(from, 2),
      point(46.5005, 11.3505, 3),
      stationAnchorPoint(to, 4),
    ];

    expect(findSegmentSlice(route, from, to)).toEqual({ start: 1, end: 3 });
  });

  it('returns null when segment endpoints are unusable or incomplete', () => {
    const from = station('station-a', 1, 46.5, 11.35);
    const to = station('station-b', 2, 46.501, 11.351);
    const route = [stationAnchorPoint(from, 1)];

    expect(findSegmentSlice(route, invalidStation('bad', 9), to)).toBeNull();
    expect(findSegmentSlice(route, from, to)).toBeNull();
    expect(findSegmentSlice([stationAnchorPoint(to, 1)], from, to)).toBeNull();
  });

  it('walks consecutive segment slices in route order and skips invalid station pairs', () => {
    const a = station('station-a', 1, 46.5, 11.35);
    const b = station('station-b', 2, 46.501, 11.351);
    const invalid = invalidStation('station-invalid', 3);
    const c = station('station-c', 4, 46.502, 11.352);
    const d = station('station-d', 5, 46.503, 11.353);
    const route = [
      stationAnchorPoint(a, 1),
      point(46.5005, 11.3505, 2),
      stationAnchorPoint(b, 3),
      stationAnchorPoint(c, 4),
      point(46.5025, 11.3525, 5),
      stationAnchorPoint(d, 6),
    ];

    expect(getRecordedSegmentSlices([a, b, invalid, c, d], route)).toEqual([
      { start: 0, end: 2 },
      { start: 3, end: 5 },
    ]);
  });

  it('finds the last matching station anchor', () => {
    const from = station('station-a', 1, 46.5, 11.35);
    const route = [
      stationAnchorPoint(from, 1),
      point(46.5005, 11.3505, 2),
      stationAnchorPoint(from, 3),
    ];

    expect(findNearestStationAnchorIndex(route, from)).toBe(2);
    expect(findNearestStationAnchorIndex(route, invalidStation('bad', 9))).toBe(
      -1,
    );
  });

  it('finds nearby stations within the snap radius only', () => {
    const from = station('station-a', 1, 46.5, 11.35);
    const to = station('station-b', 2, 46.501, 11.351);

    expect(findNearbyStation(pointNorthOf(from, 10), [from, to])).toBe(from);
    expect(findNearbyStation(pointNorthOf(from, 25), [from, to])).toBeNull();
  });

  it('treats points at the snap radius as near and points beyond it as far', () => {
    const from = station('station-a', 1, 46.5, 11.35);
    const exactlyNear = pointNorthOf(from, 20);
    const beyond = pointNorthOf(from, 20.2);

    expect(
      distanceMeters(exactlyNear, {
        lat: from.position_lat,
        lng: from.position_lng,
      }),
    ).toBeCloseTo(20, 6);
    expect(isNearStation(exactlyNear, from)).toBe(true);
    expect(isNearStation(beyond, from)).toBe(false);
  });

  it('formats route distances for compact route stats', () => {
    expect(formatDistance(Number.NaN)).toBe('0 m');
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(12.4)).toBe('12 m');
    expect(formatDistance(1234)).toBe('1,23 km');
  });
});
