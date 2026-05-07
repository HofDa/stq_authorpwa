import type { RrrSensorAdapter, RrrSensorError, RrrSensorState } from './types';

export interface RrrGeolocationAdapterOptions {
  initialState?: RrrSensorState;
  positionOptions?: PositionOptions;
  now?: () => number;
}

export function createGeolocationSensorAdapter(
  options: RrrGeolocationAdapterOptions = {},
): RrrSensorAdapter {
  return new GeolocationSensorAdapter(options);
}

class GeolocationSensorAdapter implements RrrSensorAdapter {
  private readonly listeners = new Set<(state: RrrSensorState) => void>();
  private readonly now: () => number;
  private readonly positionOptions?: PositionOptions;
  private state: RrrSensorState;
  private watchId: number | null = null;

  constructor({
    initialState,
    positionOptions,
    now = Date.now,
  }: RrrGeolocationAdapterOptions) {
    this.now = now;
    this.positionOptions = positionOptions;
    this.state = initialState ?? {
      geolocationStatus: 'idle',
      timestamp: now(),
    };
  }

  async start(): Promise<void> {
    if (this.watchId !== null) {
      return;
    }

    const geolocation = getBrowserGeolocation();
    if (!geolocation) {
      this.setError({
        source: 'geolocation',
        code: 'unavailable',
        message: 'Geolocation is not available in this browser.',
      });
      return;
    }

    this.setState({
      ...this.state,
      geolocationStatus: 'starting',
      timestamp: this.now(),
    });

    try {
      this.watchId = geolocation.watchPosition(
        (position) => this.handlePosition(position),
        (error) => this.handlePositionError(error),
        this.positionOptions,
      );
    } catch (error) {
      this.setError({
        source: 'geolocation',
        code: 'unknown',
        message:
          error instanceof Error
            ? error.message
            : 'Could not start geolocation watcher.',
      });
    }
  }

  stop(): void {
    if (this.watchId === null) {
      return;
    }

    const geolocation = getBrowserGeolocation();
    if (geolocation) {
      geolocation.clearWatch(this.watchId);
    }
    this.watchId = null;
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

  private handlePosition(position: GeolocationPosition): void {
    this.setState({
      ...this.state,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      geolocationStatus: 'available',
      error: undefined,
      timestamp: position.timestamp,
    });
  }

  private handlePositionError(error: GeolocationPositionError): void {
    this.setError(toSensorError(error));
  }

  private setError(error: RrrSensorError): void {
    this.setState({
      ...this.state,
      geolocationStatus:
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

function getBrowserGeolocation(): Geolocation | null {
  if (typeof navigator === 'undefined') {
    return null;
  }

  return navigator.geolocation ?? null;
}

function toSensorError(error: GeolocationPositionError): RrrSensorError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        source: 'geolocation',
        code: 'permission_denied',
        message: error.message || 'Geolocation permission was denied.',
      };
    case error.POSITION_UNAVAILABLE:
      return {
        source: 'geolocation',
        code: 'position_unavailable',
        message: error.message || 'Geolocation position is unavailable.',
      };
    case error.TIMEOUT:
      return {
        source: 'geolocation',
        code: 'timeout',
        message: error.message || 'Geolocation request timed out.',
      };
    default:
      return {
        source: 'geolocation',
        code: 'unknown',
        message: error.message || 'Geolocation failed.',
      };
  }
}
