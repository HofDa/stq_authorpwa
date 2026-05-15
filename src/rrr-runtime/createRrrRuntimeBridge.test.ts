import { describe, expect, it, vi } from 'vitest';
import type { RrrInteraction } from '@/rrr';
import { createMockSensorAdapter } from '@/rrr-sensors';
import { createRrrRuntimeBridge } from './createRrrRuntimeBridge';

const interaction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'gps',
      type: 'gps_enter',
      label: 'Reach point',
      config: { lat: 46.4983, lng: 11.3548, radiusMeters: 20 },
    },
    {
      id: 'compass',
      type: 'compass_align',
      label: 'Face east',
      config: { targetDegrees: 90, tolerance: 10 },
    },
  ],
  condition: {
    type: 'sequence',
    steps: [
      { type: 'module', moduleId: 'gps' },
      { type: 'module', moduleId: 'compass' },
    ],
  },
};

describe('createRrrRuntimeBridge', () => {
  it('normalizes sensor adapter state and updates runtime results', () => {
    const adapter = createMockSensorAdapter({
      initialState: {
        geolocationStatus: 'available',
        orientationStatus: 'available',
      },
      now: () => 1000,
    });
    const bridge = createRrrRuntimeBridge({
      interaction,
      adapters: [adapter],
      evaluationIntervalMs: 0,
      now: () => 1000,
    });
    const listener = vi.fn();
    bridge.subscribe(listener);

    expect(bridge.getSnapshot().result.modules.gps.message).toBe(
      'Warte auf GPS-Position',
    );

    adapter.patchState({
      latitude: 46.4983,
      longitude: 11.3548,
    });

    expect(bridge.getSnapshot().session.completedModuleIds).toContain('gps');
    expect(bridge.getSnapshot().mockState).toMatchObject({
      gpsLat: 46.4983,
      gpsLng: 11.3548,
    });

    adapter.patchState({ heading: 90 });

    expect(bridge.getSnapshot().session.completedModuleIds).toEqual([
      'gps',
      'compass',
    ]);
    expect(bridge.getSnapshot().result.status).toBe('success');
    expect(listener).toHaveBeenCalled();

    adapter.patchState({ latitude: undefined, longitude: undefined, heading: 0 });
    bridge.reset();

    expect(bridge.getSnapshot().session.completedModuleIds).toEqual([]);
    expect(bridge.getSnapshot().result.status).toBe('running');
  });

  it('exposes start and stop methods for adapters', async () => {
    const adapter = createMockSensorAdapter();
    const start = vi.spyOn(adapter, 'start');
    const stop = vi.spyOn(adapter, 'stop');
    const bridge = createRrrRuntimeBridge({
      interaction,
      adapters: [adapter],
      evaluationIntervalMs: 0,
    });

    await bridge.start();
    bridge.stop();

    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(bridge.getSnapshot().started).toBe(false);
  });

  it('keeps raw GPS state while ignoring very poor accuracy for evaluation', () => {
    const adapter = createMockSensorAdapter({
      initialState: {
        geolocationStatus: 'available',
        latitude: 46.4983,
        longitude: 11.3548,
        accuracy: 8,
      },
    });
    const bridge = createRrrRuntimeBridge({
      interaction,
      adapters: [adapter],
      evaluationIntervalMs: 0,
      smoothing: {
        gpsAlpha: 1,
        maxGpsAccuracyMeters: 50,
      },
    });

    expect(bridge.getSnapshot().mockState.gpsLat).toBe(46.4983);

    adapter.patchState({
      latitude: 46.7,
      longitude: 11.7,
      accuracy: 120,
    });

    expect(bridge.getSnapshot().rawSensorState).toMatchObject({
      latitude: 46.7,
      longitude: 11.7,
      accuracy: 120,
    });
    expect(bridge.getSnapshot().sensorState).toMatchObject({
      latitude: 46.4983,
      longitude: 11.3548,
      accuracy: 8,
    });
    expect(bridge.getSnapshot().smoothing).toMatchObject({
      gpsAccepted: false,
      gpsIgnoredReason: 'poor_accuracy',
    });
  });
});
