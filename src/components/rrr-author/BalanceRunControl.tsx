import { useEffect } from 'react';
import { BalanceRunVisual } from '@/components/rrr-runtime/BalanceRunVisual';
import { useLiveDeviceBalance } from '@/components/rrr-runtime/useLiveDeviceBalance';
import { useLiveGeolocation } from '@/components/rrr-runtime/useLiveGeolocation';

const LABELS = {
  gpsEnable: 'GPS aktivieren',
  gpsStarting: 'GPS wird gestartet...',
  balanceEnable: 'Balance aktivieren',
  balanceStarting: 'Balance wird gestartet...',
  simulateStart: 'An den Start setzen',
  simulateTarget: 'In den Zielradius setzen',
  balanceOk: 'Balance halten',
} as const;

interface BalanceRunControlProps {
  currentLat: number;
  currentLng: number;
  startLat: number;
  startLng: number;
  targetLat: number;
  targetLng: number;
  successRadiusMeters: number;
  timeLimitMs: number;
  maxTiltDegrees: number;
  balanceOk: boolean;
  onPositionChange: (position: { lat: number; lng: number }) => void;
  onBalanceChange: (balanceOk: boolean) => void;
}

export function BalanceRunControl({
  currentLat,
  currentLng,
  startLat,
  startLng,
  targetLat,
  targetLng,
  successRadiusMeters,
  timeLimitMs,
  maxTiltDegrees,
  balanceOk,
  onPositionChange,
  onBalanceChange,
}: BalanceRunControlProps) {
  const gps = useLiveGeolocation();
  const balance = useLiveDeviceBalance();
  const distanceToTarget = distanceMeters(
    currentLat,
    currentLng,
    targetLat,
    targetLng,
  );
  const tiltMagnitude = balance.magnitude ?? (balanceOk ? 0 : maxTiltDegrees + 8);

  useEffect(() => {
    if (
      gps.status === 'available' &&
      typeof gps.latitude === 'number' &&
      typeof gps.longitude === 'number'
    ) {
      onPositionChange({ lat: gps.latitude, lng: gps.longitude });
    }
  }, [gps.latitude, gps.longitude, gps.status, onPositionChange]);

  useEffect(() => {
    if (balance.magnitude !== undefined) {
      onBalanceChange(balance.magnitude <= maxTiltDegrees);
    }
  }, [balance.magnitude, maxTiltDegrees, onBalanceChange]);

  return (
    <div className="stq-rrr-balance-run-control">
      <BalanceRunVisual
        distanceMeters={distanceToTarget}
        successRadiusMeters={successRadiusMeters}
        elapsedMs={0}
        timeLimitMs={timeLimitMs}
        tiltX={balance.tiltX ?? tiltMagnitude}
        tiltY={balance.tiltY ?? 0}
        maxTiltDegrees={maxTiltDegrees}
        running
        complete={distanceToTarget <= successRadiusMeters && balanceOk}
        failed={!balanceOk}
      />

      <div className="stq-rrr-balance-run-control__live">
        <small className="stq-rrr-compass-control__status">
          GPS {gps.status === 'available' ? 'aktiv' : gps.status}
        </small>
        {gps.status !== 'available' && (
          <button
            type="button"
            className="stq-rrr-compass-control__button"
            onClick={gps.start}
            disabled={gps.status === 'starting'}
          >
            {gps.status === 'starting' ? LABELS.gpsStarting : LABELS.gpsEnable}
          </button>
        )}
      </div>

      <div className="stq-rrr-balance-run-control__live">
        <small className="stq-rrr-compass-control__status">
          Balance {balance.status === 'available' ? 'aktiv' : balance.status}
        </small>
        {balance.status !== 'available' && (
          <button
            type="button"
            className="stq-rrr-compass-control__button"
            onClick={balance.start}
            disabled={balance.status === 'starting'}
          >
            {balance.status === 'starting'
              ? LABELS.balanceStarting
              : LABELS.balanceEnable}
          </button>
        )}
      </div>

      <div className="stq-rrr-guide__choice">
        <button
          type="button"
          className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
          onClick={() => onPositionChange({ lat: startLat, lng: startLng })}
        >
          {LABELS.simulateStart}
        </button>
        <button
          type="button"
          className="stq-rrr-editor__button"
          onClick={() => onPositionChange({ lat: targetLat, lng: targetLng })}
        >
          {LABELS.simulateTarget}
        </button>
      </div>

      <label className="stq-rrr-check">
        <input
          type="checkbox"
          checked={balanceOk}
          onChange={(event) => onBalanceChange(event.target.checked)}
        />
        <span>{LABELS.balanceOk}</span>
      </label>
    </div>
  );
}

function distanceMeters(
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
): number {
  const earthRadiusMeters = 6371000;
  const latDelta = toRadians(latB - latA);
  const lngDelta = toRadians(lngB - lngA);
  const startLatRad = toRadians(latA);
  const endLatRad = toRadians(latB);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLatRad) * Math.cos(endLatRad) * Math.sin(lngDelta / 2) ** 2;
  return (
    2 *
    earthRadiusMeters *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
