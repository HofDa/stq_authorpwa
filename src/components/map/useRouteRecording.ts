import { useEffect, useRef, useState } from 'react';
import type { RecordedRoutePoint } from '@/schema';
import {
  createRecordedRoutePoint,
  shouldAppendRecordedPoint,
} from './routeRecording';

interface Props {
  recordedRoute: RecordedRoutePoint[];
  onAppendPoint: (point: RecordedRoutePoint) => void;
  onError: (message: string | null) => void;
}

export function useRouteRecording({
  recordedRoute,
  onAppendPoint,
  onError,
}: Props) {
  const [tracking, setTracking] = useState(false);
  const [currentPosition, setCurrentPosition] =
    useState<RecordedRoutePoint | null>(null);
  const lastRecordedPointRef = useRef<RecordedRoutePoint | undefined>(
    recordedRoute[recordedRoute.length - 1],
  );
  const appendPointRef = useRef(onAppendPoint);

  useEffect(() => {
    lastRecordedPointRef.current = recordedRoute[recordedRoute.length - 1];
  }, [recordedRoute]);

  useEffect(() => {
    appendPointRef.current = onAppendPoint;
  }, [onAppendPoint]);

  useEffect(() => {
    if (!tracking) {
      return;
    }

    if (!navigator.geolocation) {
      onError('Geolocation is not supported on this device.');
      setTracking(false);
      return;
    }

    onError(null);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point = createRecordedRoutePoint(position);
        setCurrentPosition(point);
        const lastPoint = lastRecordedPointRef.current;
        if (!shouldAppendRecordedPoint(lastPoint, point)) {
          return;
        }
        lastRecordedPointRef.current = point;
        appendPointRef.current(point);
      },
      (error) => {
        onError(`GPS tracking error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10_000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, onError]);

  return {
    tracking,
    setTracking,
    currentPosition,
  };
}

