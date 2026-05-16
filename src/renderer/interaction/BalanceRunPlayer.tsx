import { useEffect, useMemo, useState } from 'react';
import { BalanceRunVisual } from '@/components/rrr-runtime/BalanceRunVisual';
import {
  ModuleFeedback,
  type ModuleFeedbackKind,
} from '@/components/rrr-runtime/ModuleFeedback';
import { useLiveDeviceBalance } from '@/components/rrr-runtime/useLiveDeviceBalance';
import { useLiveGeolocation } from '@/components/rrr-runtime/useLiveGeolocation';

interface BalanceRunPlayerProps {
  startLat: number;
  startLng: number;
  targetLat: number;
  targetLng: number;
  successRadiusMeters: number;
  timeLimitMs: number;
  maxTiltDegrees: number;
  onCorrect: () => void;
  disabled?: boolean;
}

export function BalanceRunPlayer({
  startLat,
  startLng,
  targetLat,
  targetLng,
  successRadiusMeters,
  timeLimitMs,
  maxTiltDegrees,
  onCorrect,
  disabled = false,
}: BalanceRunPlayerProps) {
  const gps = useLiveGeolocation();
  const balance = useLiveDeviceBalance();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [failedReason, setFailedReason] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const currentLat = gps.latitude ?? startLat;
  const currentLng = gps.longitude ?? startLng;
  const distanceToStart = distanceMeters(currentLat, currentLng, startLat, startLng);
  const distanceToTarget = distanceMeters(
    currentLat,
    currentLng,
    targetLat,
    targetLng,
  );
  const elapsedMs = startedAt === null ? 0 : nowMs - startedAt;
  const started = startedAt !== null;
  const atStart =
    gps.latitude !== undefined &&
    gps.longitude !== undefined &&
    distanceToStart <= successRadiusMeters;
  const atTarget =
    gps.latitude !== undefined &&
    gps.longitude !== undefined &&
    distanceToTarget <= successRadiusMeters;
  const tiltMagnitude = balance.magnitude ?? 0;
  const balanceOk =
    balance.magnitude === undefined || tiltMagnitude <= maxTiltDegrees;

  useEffect(() => {
    if (!started || solved || failedReason) return undefined;
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [started, solved, failedReason]);

  useEffect(() => {
    if (!started || solved || failedReason || disabled) return;
    if (!balanceOk) {
      setFailedReason('Balance verloren');
      return;
    }
    if (elapsedMs > timeLimitMs) {
      setFailedReason('Zeit abgelaufen');
      return;
    }
    if (atTarget) {
      setSolved(true);
      onCorrect();
    }
  }, [
    atTarget,
    balanceOk,
    disabled,
    elapsedMs,
    failedReason,
    onCorrect,
    solved,
    started,
    timeLimitMs,
  ]);

  const feedback = useMemo(
    () =>
      getBalanceRunFeedback({
        gpsStatus: gps.status,
        balanceStatus: balance.status,
        atStart,
        started,
        solved,
        failedReason,
        distanceToStart,
        distanceToTarget,
      }),
    [
      atStart,
      balance.status,
      distanceToStart,
      distanceToTarget,
      failedReason,
      gps.status,
      solved,
      started,
    ],
  );

  function startSensors() {
    gps.start();
    balance.start();
  }

  function startRun() {
    if (!atStart || disabled) return;
    setStartedAt(Date.now());
    setNowMs(Date.now());
    setFailedReason(null);
    setSolved(false);
  }

  function resetRun() {
    setStartedAt(null);
    setFailedReason(null);
    setSolved(false);
    setNowMs(Date.now());
  }

  return (
    <div className="stq-riddle-balance-run-player">
      <BalanceRunVisual
        distanceMeters={distanceToTarget}
        successRadiusMeters={successRadiusMeters}
        elapsedMs={elapsedMs}
        timeLimitMs={timeLimitMs}
        tiltX={balance.tiltX ?? 0}
        tiltY={balance.tiltY ?? 0}
        maxTiltDegrees={maxTiltDegrees}
        running={started && !failedReason && !solved}
        failed={Boolean(failedReason)}
        complete={solved}
      />
      <ModuleFeedback
        kind={feedback.kind}
        message={feedback.message}
        detail={feedback.detail}
        sensoryFeedback={
          feedback.kind === 'success' || feedback.kind === 'error'
            ? { playKey: `balance-run-${feedback.kind}-${feedback.message}` }
            : false
        }
      />
      {(gps.status !== 'available' || balance.status !== 'available') && (
        <button
          type="button"
          className="stq-riddle-compass-player__enable"
          onClick={startSensors}
          disabled={gps.status === 'starting' || balance.status === 'starting'}
        >
          Sensoren aktivieren
        </button>
      )}
      {gps.status === 'available' &&
        balance.status === 'available' &&
        !started &&
        !solved && (
          <button
            type="button"
            className="stq-riddle-compass-player__enable"
            onClick={startRun}
            disabled={!atStart || disabled}
          >
            Balance-Lauf starten
          </button>
        )}
      {failedReason && (
        <button
          type="button"
          className="stq-riddle-compass-player__enable"
          onClick={resetRun}
          disabled={disabled}
        >
          Neu starten
        </button>
      )}
    </div>
  );
}

function getBalanceRunFeedback({
  gpsStatus,
  balanceStatus,
  atStart,
  started,
  solved,
  failedReason,
  distanceToStart,
  distanceToTarget,
}: {
  gpsStatus: ReturnType<typeof useLiveGeolocation>['status'];
  balanceStatus: ReturnType<typeof useLiveDeviceBalance>['status'];
  atStart: boolean;
  started: boolean;
  solved: boolean;
  failedReason: string | null;
  distanceToStart: number;
  distanceToTarget: number;
}): {
  kind: ModuleFeedbackKind;
  message?: string;
  detail?: string;
} {
  if (solved) {
    return { kind: 'success', message: 'Ziel in Balance erreicht' };
  }
  if (failedReason) {
    return { kind: 'error', message: failedReason };
  }
  if (gpsStatus === 'error' || balanceStatus === 'error') {
    return { kind: 'error', message: 'Sensorzugriff verweigert' };
  }
  if (gpsStatus === 'unavailable' || balanceStatus === 'unavailable') {
    return { kind: 'error', message: 'Sensoren nicht verfuegbar' };
  }
  if (!started && !atStart) {
    return {
      kind: 'running',
      message: 'Gehe zum Startpunkt',
      detail: `${Math.round(distanceToStart)} m entfernt`,
    };
  }
  if (!started) {
    return { kind: 'idle' };
  }
  return {
    kind: 'running',
    message: 'Zum Ziel gehen und Balance halten',
    detail: `${Math.round(distanceToTarget)} m bis zum Ziel`,
  };
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
