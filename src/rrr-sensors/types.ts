export type RrrSensorState = {
  heading?: number;
  tiltX?: number;
  tiltY?: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  isStill?: boolean;
  geolocationStatus?: RrrSensorAvailability;
  orientationStatus?: RrrSensorAvailability;
  error?: RrrSensorError;
  timestamp: number;
};

export type RrrSensorAvailability =
  | 'idle'
  | 'starting'
  | 'available'
  | 'unavailable'
  | 'error';

export type RrrSensorError = {
  source: 'geolocation' | 'device_orientation';
  code:
    | 'unavailable'
    | 'permission_denied'
    | 'position_unavailable'
    | 'timeout'
    | 'unknown';
  message: string;
};

export interface RrrSensorAdapter {
  start(): Promise<void>;
  stop(): void;
  getState(): RrrSensorState;
  subscribe(listener: (state: RrrSensorState) => void): () => void;
}
