import { describe, expect, it } from 'vitest';
import type { RecordedRoutePoint } from '@/schema';
import { buildValidStation } from '@/test/fixtures';
import { deriveStationPathsFromRecordedRoute } from './routePlanning';

function buildRecordedRoute(): RecordedRoutePoint[] {
  return [
    {
      lat: 46.498,
      lng: 11.3544,
      timestamp: 1_700_000_000_000,
      accuracy: 8,
    },
    {
      lat: 46.4983,
      lng: 11.3548,
      timestamp: 1_700_000_006_000,
      accuracy: 8,
    },
    {
      lat: 46.4987,
      lng: 11.3553,
      timestamp: 1_700_000_012_000,
      accuracy: 8,
    },
  ];
}

describe('deriveStationPathsFromRecordedRoute', () => {
  it('ignores a station with placeholder 0/0 coordinates', () => {
    const invalidStation = buildValidStation('station-1', 1);
    invalidStation.position_lat = 0;
    invalidStation.position_lng = 0;

    const derivation = deriveStationPathsFromRecordedRoute(
      [invalidStation],
      buildRecordedRoute(),
      12,
    );

    expect(derivation.stationPaths).toEqual([]);
    expect(
      derivation.warnings.some((warning) =>
        warning.includes('Skipped 1 station without usable coordinates'),
      ),
    ).toBe(true);
  });

  it('includes a valid station in route derivation', () => {
    const validStation = buildValidStation('station-1', 1);

    const derivation = deriveStationPathsFromRecordedRoute(
      [validStation],
      buildRecordedRoute(),
      12,
    );

    expect(derivation.stationPaths).toHaveLength(1);
    expect(derivation.stationPaths[0].stationId).toBe(validStation.id);
    expect(derivation.stationPaths[0].pointCount).toBeGreaterThan(0);
  });

  it('warns when mixed valid and invalid stations are present', () => {
    const invalidStation = buildValidStation('station-1', 1);
    invalidStation.position_lat = 0;
    invalidStation.position_lng = 0;
    const validStation = buildValidStation('station-2', 2);

    const derivation = deriveStationPathsFromRecordedRoute(
      [invalidStation, validStation],
      buildRecordedRoute(),
      12,
    );

    expect(
      derivation.warnings.some((warning) =>
        warning.includes('Skipped 1 station without usable coordinates'),
      ),
    ).toBe(true);
    expect(derivation.stationPaths).toHaveLength(1);
  });

  it('does not create a route segment for a 0/0 station', () => {
    const invalidStation = buildValidStation('station-1', 1);
    invalidStation.position_lat = 0;
    invalidStation.position_lng = 0;
    const validStation = buildValidStation('station-2', 2);

    const derivation = deriveStationPathsFromRecordedRoute(
      [invalidStation, validStation],
      buildRecordedRoute(),
      12,
    );

    expect(derivation.stationPaths.map((path) => path.stationId)).toEqual([
      validStation.id,
    ]);
  });
});
