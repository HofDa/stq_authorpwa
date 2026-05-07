import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDeviceOrientationSensorAdapter } from './deviceOrientationAdapter';

type OrientationListener = (event: DeviceOrientationEvent) => void;

type DeviceOrientationConstructorStub = {
  requestPermission?: () => Promise<'granted' | 'denied' | 'prompt'>;
};

const originalWindow = globalThis.window;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });
});

describe('createDeviceOrientationSensorAdapter', () => {
  it('reports device orientation as unavailable outside browser support', async () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: undefined,
    });

    const adapter = createDeviceOrientationSensorAdapter({ now: () => 1000 });
    const listener = vi.fn();
    adapter.subscribe(listener);

    await adapter.start();

    expect(adapter.getState()).toEqual({
      orientationStatus: 'unavailable',
      error: {
        source: 'device_orientation',
        code: 'unavailable',
        message: 'Device orientation is not available in this browser.',
      },
      timestamp: 1000,
    });
    expect(listener).toHaveBeenCalledWith(adapter.getState());
  });

  it('handles denied iOS-style permission without adding a listener', async () => {
    const requestPermission = vi.fn(async () => 'denied' as const);
    const addEventListener = vi.fn();
    stubWindow({
      DeviceOrientationEvent: { requestPermission },
      addEventListener,
      removeEventListener: vi.fn(),
    });

    const adapter = createDeviceOrientationSensorAdapter({ now: () => 2000 });
    await adapter.start();

    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(addEventListener).not.toHaveBeenCalled();
    expect(adapter.getState()).toEqual({
      orientationStatus: 'error',
      error: {
        source: 'device_orientation',
        code: 'permission_denied',
        message: 'Device orientation permission was not granted.',
      },
      timestamp: 2000,
    });
  });

  it('normalizes webkit compass heading and removes the listener on stop', async () => {
    let listener: OrientationListener | undefined;
    const addEventListener = vi.fn(
      (type: string, nextListener: EventListenerOrEventListenerObject): void => {
        if (type === 'deviceorientation') {
          listener = nextListener as OrientationListener;
        }
      },
    );
    const removeEventListener = vi.fn();
    stubWindow({
      DeviceOrientationEvent: {},
      addEventListener,
      removeEventListener,
    });

    const adapter = createDeviceOrientationSensorAdapter({ now: () => 3000 });
    await adapter.start();
    listener?.(
      createOrientationEvent({
        beta: 12,
        gamma: -4,
        webkitCompassHeading: 725,
      }),
    );
    adapter.stop();

    expect(adapter.getState()).toMatchObject({
      heading: 5,
      orientationStatus: 'available',
      tiltX: 12,
      tiltY: -4,
      timestamp: 3000,
    });
    expect(removeEventListener).toHaveBeenCalledWith(
      'deviceorientation',
      expect.any(Function),
    );
  });

  it('uses alpha only when the event is marked absolute', async () => {
    let listener: OrientationListener | undefined;
    stubWindow({
      DeviceOrientationEvent: {},
      addEventListener: (
        _type: string,
        nextListener: EventListenerOrEventListenerObject,
      ): void => {
        listener = nextListener as OrientationListener;
      },
      removeEventListener: vi.fn(),
    });

    const adapter = createDeviceOrientationSensorAdapter({ now: () => 4000 });
    await adapter.start();
    listener?.(createOrientationEvent({ alpha: 45, absolute: false }));
    expect(adapter.getState()).toMatchObject({
      orientationStatus: 'unavailable',
      timestamp: 4000,
    });

    listener?.(createOrientationEvent({ alpha: 45, absolute: true }));
    expect(adapter.getState()).toMatchObject({
      heading: 315,
      orientationStatus: 'available',
      timestamp: 4000,
    });
  });
});

function stubWindow(
  browserWindow: {
    DeviceOrientationEvent?: DeviceOrientationConstructorStub;
    addEventListener: Window['addEventListener'];
    removeEventListener: Window['removeEventListener'];
  },
): void {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: browserWindow,
  });
}

function createOrientationEvent(
  event: Partial<
    DeviceOrientationEvent & {
      webkitCompassHeading?: number;
    }
  >,
): DeviceOrientationEvent {
  return event as DeviceOrientationEvent;
}
