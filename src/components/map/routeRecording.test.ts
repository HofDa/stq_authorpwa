import { describe, expect, it } from 'vitest';
import type { RecordedRoutePoint } from '@/schema';
import { shouldAppendRecordedPoint } from './routeRecording';

function buildPoint(
  overrides: Partial<RecordedRoutePoint> = {},
): RecordedRoutePoint {
  return {
    lat: 46.4983,
    lng: 11.3548,
    timestamp: 1_700_000_000_000,
    accuracy: 8,
    ...overrides,
  };
}

describe('shouldAppendRecordedPoint', () => {
  it('rejects points with poor GPS accuracy', () => {
    expect(
      shouldAppendRecordedPoint(undefined, buildPoint({ accuracy: 81 })),
    ).toBe(false);
  });

  it('accepts the first recorded point', () => {
    expect(shouldAppendRecordedPoint(undefined, buildPoint())).toBe(true);
  });

  it('rejects nearby points recorded too soon', () => {
    const previous = buildPoint();
    const next = buildPoint({
      lat: previous.lat + 0.00001,
      lng: previous.lng + 0.00001,
      timestamp: previous.timestamp + 2_000,
    });

    expect(shouldAppendRecordedPoint(previous, next)).toBe(false);
  });

  it('accepts points when enough time elapsed', () => {
    const previous = buildPoint();
    const next = buildPoint({
      timestamp: previous.timestamp + 3_000,
    });

    expect(shouldAppendRecordedPoint(previous, next)).toBe(true);
  });

  it('accepts points when distance threshold is exceeded', () => {
    const previous = buildPoint();
    const next = buildPoint({
      lat: previous.lat + 0.00005,
      lng: previous.lng + 0.00005,
      timestamp: previous.timestamp + 1_000,
    });

    expect(shouldAppendRecordedPoint(previous, next)).toBe(true);
  });
});

