import { useEffect } from 'react';
import { CompassDial } from '@/components/rrr-runtime/CompassDial';
import { useLiveDeviceHeading } from '@/components/rrr-runtime/useLiveDeviceHeading';

const LABELS = {
  liveEnable: 'Kompass aktivieren',
  liveStarting: 'Kompass wird gestartet…',
  liveHeading: 'Live:',
  liveUnavailable: 'Kompass auf diesem Gerät nicht verfügbar.',
  liveDenied: 'Kompasszugriff verweigert.',
  simulateHeading: 'Richtung simulieren',
  simulateTarget: 'Zielrichtung simulieren',
} as const;

interface CompassControlProps {
  heading: number;
  targetDegrees: number;
  tolerance: number;
  onHeadingChange: (heading: number) => void;
}

export function CompassControl({
  heading,
  targetDegrees,
  tolerance,
  onHeadingChange,
}: CompassControlProps) {
  const live = useLiveDeviceHeading();

  useEffect(() => {
    if (live.status === 'available' && typeof live.heading === 'number') {
      onHeadingChange(live.heading);
    }
  }, [live.heading, live.status, onHeadingChange]);

  const sliderValue = Math.round(heading);

  return (
    <div className="stq-rrr-compass-control">
      <CompassDial
        heading={heading}
        targetDegrees={targetDegrees}
        tolerance={tolerance}
      />

      <div className="stq-rrr-compass-control__live">
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
          {LABELS.simulateHeading}: {sliderValue} Grad
        </span>
        <input
          type="range"
          min="0"
          max="359"
          value={sliderValue}
          onChange={(event) => onHeadingChange(Number(event.target.value))}
          disabled={live.status === 'available'}
        />
      </label>

      <button
        type="button"
        className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
        onClick={() => onHeadingChange(targetDegrees)}
      >
        {LABELS.simulateTarget}
      </button>
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
