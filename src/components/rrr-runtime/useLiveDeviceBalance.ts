import { useCallback, useEffect, useState } from 'react';
import {
  createDeviceOrientationSensorAdapter,
  type RrrSensorAdapter,
  type RrrSensorState,
} from '@/rrr/sensors';

export interface LiveDeviceBalanceState {
  tiltX: number | undefined;
  tiltY: number | undefined;
  magnitude: number | undefined;
  status: RrrSensorState['orientationStatus'];
  start: () => void;
}

export function useLiveDeviceBalance(): LiveDeviceBalanceState {
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

  const tiltX =
    state.orientationStatus === 'available' && typeof state.tiltX === 'number'
      ? state.tiltX
      : undefined;
  const tiltY =
    state.orientationStatus === 'available' && typeof state.tiltY === 'number'
      ? state.tiltY
      : undefined;

  return {
    tiltX,
    tiltY,
    magnitude:
      tiltX !== undefined && tiltY !== undefined
        ? Math.hypot(tiltX, tiltY)
        : undefined,
    status: state.orientationStatus,
    start,
  };
}
