import { useCallback, useEffect, useState } from 'react';
import {
  createGeolocationSensorAdapter,
  type RrrSensorAdapter,
  type RrrSensorState,
} from '@/rrr/sensors';

export interface LiveGeolocationState {
  latitude: number | undefined;
  longitude: number | undefined;
  accuracy: number | undefined;
  status: RrrSensorState['geolocationStatus'];
  start: () => void;
}

export function useLiveGeolocation(): LiveGeolocationState {
  const [state, setState] = useState<RrrSensorState>({
    geolocationStatus: 'idle',
    timestamp: 0,
  });
  const [adapter, setAdapter] = useState<RrrSensorAdapter | null>(null);

  useEffect(() => {
    if (!adapter) return undefined;
    const unsubscribe = adapter.subscribe((next) => setState(next));
    setState(adapter.getState());
    return () => {
      unsubscribe();
      adapter.stop();
    };
  }, [adapter]);

  const start = useCallback(() => {
    if (adapter) {
      void adapter.start();
      return;
    }
    const created = createGeolocationSensorAdapter({
      positionOptions: {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 12000,
      },
    });
    setAdapter(created);
    void created.start();
  }, [adapter]);

  return {
    latitude:
      state.geolocationStatus === 'available' &&
      typeof state.latitude === 'number'
        ? state.latitude
        : undefined,
    longitude:
      state.geolocationStatus === 'available' &&
      typeof state.longitude === 'number'
        ? state.longitude
        : undefined,
    accuracy:
      state.geolocationStatus === 'available' &&
      typeof state.accuracy === 'number'
        ? state.accuracy
        : undefined,
    status: state.geolocationStatus,
    start,
  };
}
