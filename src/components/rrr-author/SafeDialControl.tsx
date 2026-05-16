import { useEffect } from 'react';
import { SafeDialVisual } from '@/components/rrr-runtime/SafeDialVisual';
import { useLiveDeviceHeading } from '@/components/rrr-runtime/useLiveDeviceHeading';

const LABELS = {
  liveEnable: 'Kompass aktivieren',
  liveStarting: 'Kompass wird gestartet...',
  liveHeading: 'Live:',
  liveUnavailable: 'Kompass auf diesem Geraet nicht verfuegbar.',
  liveDenied: 'Kompasszugriff verweigert.',
  simulateHeading: 'Drehrad simulieren',
  simulateTarget: 'Codeposition simulieren',
  hold: 'Haltezeit',
} as const;

interface SafeDialControlProps {
  heading: number;
  targetDegrees: number;
  tolerance: number;
  holdMs: number;
  onHeadingChange: (heading: number) => void;
}

export function SafeDialControl({
  heading,
  targetDegrees,
  tolerance,
  holdMs,
  onHeadingChange,
}: SafeDialControlProps) {
  const live = useLiveDeviceHeading();
  const unlocked = angularDistance(heading, targetDegrees) <= Math.max(1, tolerance);

  useEffect(() => {
    if (live.status === 'available' && typeof live.heading === 'number') {
      onHeadingChange(live.heading);
    }
  }, [live.heading, live.status, onHeadingChange]);

  return (
    <div className="stq-rrr-safe-dial-control">
      <SafeDialVisual
        headingDegrees={heading}
        targetDegrees={targetDegrees}
        tolerance={tolerance}
        unlocked={unlocked}
      />

      <div className="stq-rrr-safe-dial-control__live">
        <LiveStatus status={live.status} heading={live.heading} />
        {live.status !== 'available' && (
          <button
            type="button"
            className="stq-rrr-compass-control__button"
            onClick={live.start}
            disabled={live.status === 'starting'}
          >
            {live.status === 'starting' ? LABELS.liveStarting : LABELS.liveEnable}
          </button>
        )}
      </div>

      <label className="stq-rrr-field">
        <span>
          {LABELS.simulateHeading}: {Math.round(heading)} Grad
        </span>
        <input
          type="range"
          min="0"
          max="359"
          value={Math.round(heading)}
          onChange={(event) => onHeadingChange(Number(event.target.value))}
          disabled={live.status === 'available'}
        />
      </label>

      <div className="stq-rrr-safe-dial-control__footer">
        <small>
          {LABELS.hold}: {formatHoldMs(holdMs)}
        </small>
        <button
          type="button"
          className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
          onClick={() => onHeadingChange(targetDegrees)}
        >
          {LABELS.simulateTarget}
        </button>
      </div>
    </div>
  );
}

function LiveStatus({
  status,
  heading,
}: {
  status: ReturnType<typeof useLiveDeviceHeading>['status'];
  heading: number | undefined;
}) {
  if (status === 'available' && heading !== undefined) {
    return (
      <small className="stq-rrr-compass-control__status">
        {LABELS.liveHeading} {Math.round(heading)}°
      </small>
    );
  }
  if (status === 'unavailable') {
    return (
      <small className="stq-rrr-compass-control__status stq-rrr-compass-control__status--muted">
        {LABELS.liveUnavailable}
      </small>
    );
  }
  if (status === 'error') {
    return (
      <small className="stq-rrr-compass-control__status stq-rrr-compass-control__status--muted">
        {LABELS.liveDenied}
      </small>
    );
  }
  return null;
}

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(diff, 360 - diff);
}

function normalizeDegrees(degrees: number): number {
  const normalized = degrees % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function formatHoldMs(holdMs: number): string {
  return holdMs < 1000 ? `${Math.round(holdMs)} ms` : `${(holdMs / 1000).toFixed(1)} s`;
}
