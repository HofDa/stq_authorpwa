import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGeolocationSensorAdapter } from './geolocationAdapter';

const originalNavigator = globalThis.navigator;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: originalNavigator,
  });
});

describe('createGeolocationSensorAdapter', () => {
  it('reports geolocation as unavailable outside browser geolocation support', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: undefined,
    });

    const adapter = createGeolocationSensorAdapter({ now: () => 1000 });
    const listener = vi.fn();
    adapter.subscribe(listener);

    await adapter.start();

    expect(adapter.getState()).toEqual({
      geolocationStatus: 'unavailable',
      error: {
        source: 'geolocation',
        code: 'unavailable',
        message: 'Geolocation is not available in this browser.',
      },
      timestamp: 1000,
    });
    expect(listener).toHaveBeenCalledWith(adapter.getState());
  });

  it('watches positions and clears the watcher on stop', async () => {
    let success: PositionCallback | undefined;
    const watchPosition = vi.fn(
      (nextSuccess: PositionCallback): number => {
        success = nextSuccess;
        return 42;
      },
    );
    const clearWatch = vi.fn();
    stubGeolocation({ clearWatch, watchPosition });

    const adapter = createGeolocationSensorAdapter({ now: () => 1000 });
    const listener = vi.fn();
    adapter.subscribe(listener);

    await adapter.start();
    success?.({
      coords: {
        accuracy: 8,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        latitude: 46.4983,
        longitude: 11.3548,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: 1200,
      toJSON: () => ({}),
    });
    adapter.stop();

    expect(watchPosition).toHaveBeenCalledTimes(1);
    expect(clearWatch).toHaveBeenCalledWith(42);
    expect(adapter.getState()).toMatchObject({
      accuracy: 8,
      geolocationStatus: 'available',
      latitude: 46.4983,
      longitude: 11.3548,
      timestamp: 1200,
    });
    expect(listener).toHaveBeenLastCalledWith(adapter.getState());
  });

  it('stores permission errors without throwing', async () => {
    let failure: PositionErrorCallback | undefined;
    const watchPosition = vi.fn(
      (
        _success: PositionCallback,
        nextFailure: PositionErrorCallback | null | undefined,
      ): number => {
        failure = nextFailure ?? undefined;
        return 7;
      },
    );
    stubGeolocation({ clearWatch: vi.fn(), watchPosition });

    const adapter = createGeolocationSensorAdapter({ now: () => 2000 });
    await adapter.start();
    failure?.({
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
      code: 1,
      message: 'User denied Geolocation',
    });

    expect(adapter.getState()).toEqual({
      geolocationStatus: 'error',
      error: {
        source: 'geolocation',
        code: 'permission_denied',
        message: 'User denied Geolocation',
      },
      timestamp: 2000,
    });
  });
});

function stubGeolocation(geolocation: Partial<Geolocation>): void {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      geolocation,
    } as Navigator,
  });
}
