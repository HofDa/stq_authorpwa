import type { RrrSensorAdapter, RrrSensorError, RrrSensorState } from './types';

type DeviceOrientationPermissionResponse = 'granted' | 'denied' | 'prompt';

type DeviceOrientationEventConstructor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<DeviceOrientationPermissionResponse>;
};

type DeviceOrientationEventWithCompass = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

type WindowWithDeviceOrientation = Window & {
  DeviceOrientationEvent?: DeviceOrientationEventConstructor;
};

export interface RrrDeviceOrientationAdapterOptions {
  initialState?: RrrSensorState;
  now?: () => number;
}

export function createDeviceOrientationSensorAdapter(
  options: RrrDeviceOrientationAdapterOptions = {},
): RrrSensorAdapter {
  return new DeviceOrientationSensorAdapter(options);
}

class DeviceOrientationSensorAdapter implements RrrSensorAdapter {
  private readonly listeners = new Set<(state: RrrSensorState) => void>();
  private readonly now: () => number;
  private state: RrrSensorState;
  private listeningWindow: Window | null = null;

  constructor({
    initialState,
    now = Date.now,
  }: RrrDeviceOrientationAdapterOptions) {
    this.now = now;
    this.state = initialState ?? {
      orientationStatus: 'idle',
      timestamp: now(),
    };
  }

  async start(): Promise<void> {
    if (this.listeningWindow) {
      return;
    }

    const browserWindow = getBrowserWindow();
    const orientationEvent = browserWindow
      ? getDeviceOrientationEvent(browserWindow)
      : null;

    if (!browserWindow || !orientationEvent) {
      this.setError({
        source: 'device_orientation',
        code: 'unavailable',
        message: 'Device orientation is not available in this browser.',
      });
      return;
    }

    this.setState({
      ...this.state,
      orientationStatus: 'starting',
      error: undefined,
      timestamp: this.now(),
    });

    const permissionGranted = await this.requestPermissionIfNeeded(
      orientationEvent,
    );
    if (!permissionGranted) {
      return;
    }

    browserWindow.addEventListener('deviceorientation', this.handleOrientation);
    this.listeningWindow = browserWindow;
    this.setState({
      ...this.state,
      orientationStatus: 'available',
      error: undefined,
      timestamp: this.now(),
    });
  }

  stop(): void {
    if (!this.listeningWindow) {
      return;
    }

    this.listeningWindow.removeEventListener(
      'deviceorientation',
      this.handleOrientation,
    );
    this.listeningWindow = null;
  }

  getState(): RrrSensorState {
    return { ...this.state };
  }

  subscribe(listener: (state: RrrSensorState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private readonly handleOrientation = (
    event: DeviceOrientationEventWithCompass,
  ): void => {
    const heading = getHeadingDegrees(event);
    this.setState({
      ...this.state,
      heading: heading ?? this.state.heading,
      tiltX: readFiniteNumber(event.beta) ?? this.state.tiltX,
      tiltY: readFiniteNumber(event.gamma) ?? this.state.tiltY,
      orientationStatus: heading === undefined ? 'unavailable' : 'available',
      error: undefined,
      timestamp: this.now(),
    });
  };

  private async requestPermissionIfNeeded(
    orientationEvent: DeviceOrientationEventConstructor,
  ): Promise<boolean> {
    if (typeof orientationEvent.requestPermission !== 'function') {
      return true;
    }

    try {
      const permission = await orientationEvent.requestPermission();
      if (permission === 'granted') {
        return true;
      }

      this.setError({
        source: 'device_orientation',
        code: 'permission_denied',
        message: 'Device orientation permission was not granted.',
      });
      return false;
    } catch (error) {
      this.setError({
        source: 'device_orientation',
        code: 'unknown',
        message:
          error instanceof Error
            ? error.message
            : 'Could not request device orientation permission.',
      });
      return false;
    }
  }

  private setError(error: RrrSensorError): void {
    this.setState({
      ...this.state,
      orientationStatus:
        error.code === 'unavailable' ? 'unavailable' : 'error',
      error,
      timestamp: this.now(),
    });
  }

  private setState(state: RrrSensorState): void {
    this.state = { ...state };
    if (this.state.error === undefined) {
      delete this.state.error;
    }
    this.notify();
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}

function getBrowserWindow(): Window | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window;
}

function getDeviceOrientationEvent(
  browserWindow: WindowWithDeviceOrientation,
): DeviceOrientationEventConstructor | null {
  return browserWindow.DeviceOrientationEvent ?? null;
}

function getHeadingDegrees(
  event: DeviceOrientationEventWithCompass,
): number | undefined {
  const webkitHeading = readFiniteNumber(event.webkitCompassHeading);
  if (webkitHeading !== undefined) {
    return normalizeDegrees(webkitHeading);
  }

  const alpha = readFiniteNumber(event.alpha);
  if (alpha === undefined || event.absolute !== true) {
    return undefined;
  }

  return normalizeDegrees(360 - alpha);
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function readFiniteNumber(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
