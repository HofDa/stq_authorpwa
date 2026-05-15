import { useEffect, useState } from 'react';
import { CompassDial } from '@/components/rrr-runtime/CompassDial';
import { useLiveDeviceHeading } from '@/components/rrr-runtime/useLiveDeviceHeading';

interface CompassPlayerProps {
  targetDegrees: number;
  tolerance: number;
  holdMs?: number;
  enableLabel: string;
  startingLabel: string;
  unavailableLabel: string;
  deniedLabel: string;
  alignedLabel: string;
  alignLabel: string;
  onCorrect: () => void;
  disabled?: boolean;
}

export function CompassPlayer({
  targetDegrees,
  tolerance,
  holdMs = 600,
  enableLabel,
  startingLabel,
  unavailableLabel,
  deniedLabel,
  alignedLabel,
  alignLabel,
  onCorrect,
  disabled = false,
}: CompassPlayerProps) {
  const live = useLiveDeviceHeading();
  const [solved, setSolved] = useState(false);

  const heading = live.heading;
  const inZone =
    typeof heading === 'number' &&
    angularDistance(heading, targetDegrees) <= Math.max(1, tolerance);

  useEffect(() => {
    if (solved || disabled) return undefined;
    if (!inZone) return undefined;
    const timer = window.setTimeout(() => {
      setSolved(true);
      onCorrect();
    }, holdMs);
    return () => window.clearTimeout(timer);
  }, [inZone, solved, disabled, holdMs, onCorrect]);

  return (
    <div className="stq-riddle-compass-player">
      <CompassDial
        heading={heading ?? targetDegrees}
        targetDegrees={targetDegrees}
        tolerance={tolerance}
      />
      <div className="stq-riddle-compass-player__status">
        {renderStatus({
          status: live.status,
          heading,
          inZone,
          solved,
          enableLabel,
          startingLabel,
          unavailableLabel,
          deniedLabel,
          alignedLabel,
          alignLabel,
          onEnable: live.start,
        })}
      </div>
    </div>
  );
}

interface StatusRenderArgs {
  status: ReturnType<typeof useLiveDeviceHeading>['status'];
  heading: number | undefined;
  inZone: boolean;
  solved: boolean;
  enableLabel: string;
  startingLabel: string;
  unavailableLabel: string;
  deniedLabel: string;
  alignedLabel: string;
  alignLabel: string;
  onEnable: () => void;
}

function renderStatus({
  status,
  heading,
  inZone,
  solved,
  enableLabel,
  startingLabel,
  unavailableLabel,
  deniedLabel,
  alignedLabel,
  alignLabel,
  onEnable,
}: StatusRenderArgs) {
  if (solved || inZone) {
    return (
      <span className="stq-riddle-compass-player__hint stq-riddle-compass-player__hint--ok">
        {alignedLabel}
      </span>
    );
  }
  if (status === 'available' && heading !== undefined) {
    return <span className="stq-riddle-compass-player__hint">{alignLabel}</span>;
  }
  if (status === 'unavailable') {
    return (
      <span className="stq-riddle-compass-player__hint stq-riddle-compass-player__hint--muted">
        {unavailableLabel}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="stq-riddle-compass-player__hint stq-riddle-compass-player__hint--muted">
        {deniedLabel}
      </span>
    );
  }
  return (
    <button
      type="button"
      className="stq-riddle-compass-player__enable"
      onClick={onEnable}
      disabled={status === 'starting'}
    >
      {status === 'starting' ? startingLabel : enableLabel}
    </button>
  );
}

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalize(a) - normalize(b));
  return Math.min(diff, 360 - diff);
}

function normalize(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
