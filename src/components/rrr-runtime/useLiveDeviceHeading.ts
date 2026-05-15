import { useCallback, useEffect, useState } from 'react';
import {
  createDeviceOrientationSensorAdapter,
  type RrrSensorAdapter,
  type RrrSensorState,
} from '@/rrr/sensors';

export interface LiveDeviceHeadingState {
  heading: number | undefined;
  status: RrrSensorState['orientationStatus'];
  start: () => void;
}

export function useLiveDeviceHeading(): LiveDeviceHeadingState {
  const [state, setState] = useState<RrrSensorState>({
    orientationStatus: 'idle',
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
    const created = createDeviceOrientationSensorAdapter();
    setAdapter(created);
    void created.start();
  }, [adapter]);

  return {
    heading:
      state.orientationStatus === 'available' && typeof state.heading === 'number'
        ? state.heading
        : undefined,
    status: state.orientationStatus,
    start,
  };
}
