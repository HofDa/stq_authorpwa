import { useEffect } from 'react';
import { getDirectionHotColdFeedback } from '@/rrr/runtime';
import { DirectionHotColdVisual } from '@/components/rrr-runtime/DirectionHotColdVisual';
import { useLiveDeviceHeading } from '@/components/rrr-runtime/useLiveDeviceHeading';

const LABELS = {
  liveEnable: 'Kompass aktivieren',
  liveStarting: 'Kompass wird gestartet...',
  liveHeading: 'Live:',
  liveUnavailable: 'Kompass auf diesem Geraet nicht verfuegbar.',
  liveDenied: 'Kompasszugriff verweigert.',
  simulateHeading: 'Richtung simulieren',
  simulateTarget: 'Zielrichtung simulieren',
} as const;

interface DirectionHotColdControlProps {
  heading: number;
  targetDegrees: number;
  successTolerance: number;
  onHeadingChange: (heading: number) => void;
}

export function DirectionHotColdControl({
  heading,
  targetDegrees,
  successTolerance,
  onHeadingChange,
}: DirectionHotColdControlProps) {
  const live = useLiveDeviceHeading();
  const feedback = getDirectionHotColdFeedback({
    headingDegrees: heading,
    targetDegrees,
    successTolerance,
  });

  useEffect(() => {
    if (live.status === 'available' && typeof live.heading === 'number') {
      onHeadingChange(live.heading);
    }
  }, [live.heading, live.status, onHeadingChange]);

  return (
    <div className="stq-rrr-hotcold-control">
      <DirectionHotColdVisual {...feedback} />

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
        {LABELS.liveHeading} {Math.round(heading)} Grad
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
