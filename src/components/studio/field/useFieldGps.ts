import { useEffect, useState } from 'react';
import type { CurrentGps } from './types';

export function useFieldGps() {
  const [gpsLive, setGpsLive] = useState(false);
  const [gps, setGps] = useState<CurrentGps | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    if (!gpsLive) return;
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported on this device.');
      setGpsLive(false);
      return;
    }

    setGpsError(null);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGps({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        setGpsError(`GPS error: ${error.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [gpsLive]);

  return {
    gpsLive,
    gps,
    gpsError,
    toggleGps: () => setGpsLive((value) => !value),
  };
}
