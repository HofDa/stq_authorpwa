import { useEffect, useState } from 'react';
import { CompassDial } from '@/components/rrr-runtime/CompassDial';
import { useLiveDeviceHeading } from '@/components/rrr-runtime/useLiveDeviceHeading';
import { ModuleFeedback, type ModuleFeedbackKind } from './ModuleFeedback';

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
      <CompassFeedback
        status={live.status}
        heading={heading}
        inZone={inZone}
        solved={solved}
        unavailableLabel={unavailableLabel}
        deniedLabel={deniedLabel}
        alignedLabel={alignedLabel}
        alignLabel={alignLabel}
      />
      {live.status !== 'available' && live.status !== 'unavailable' && (
        <button
          type="button"
          className="stq-riddle-compass-player__enable"
          onClick={live.start}
          disabled={live.status === 'starting'}
        >
          {live.status === 'starting' ? startingLabel : enableLabel}
        </button>
      )}
    </div>
  );
}

function CompassFeedback({
  status,
  heading,
  inZone,
  solved,
  unavailableLabel,
  deniedLabel,
  alignedLabel,
  alignLabel,
}: {
  status: ReturnType<typeof useLiveDeviceHeading>['status'];
  heading: number | undefined;
  inZone: boolean;
  solved: boolean;
  unavailableLabel: string;
  deniedLabel: string;
  alignedLabel: string;
  alignLabel: string;
}) {
  let kind: ModuleFeedbackKind = 'idle';
  let message: string | undefined;

  if (solved || inZone) {
    kind = 'success';
    message = alignedLabel;
  } else if (status === 'available' && heading !== undefined) {
    kind = 'running';
    message = alignLabel;
  } else if (status === 'unavailable') {
    kind = 'error';
    message = unavailableLabel;
  } else if (status === 'error') {
    kind = 'error';
    message = deniedLabel;
  }

  return <ModuleFeedback kind={kind} message={message} />;
}

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalize(a) - normalize(b));
  return Math.min(diff, 360 - diff);
}

function normalize(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
