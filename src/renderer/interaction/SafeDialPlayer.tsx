import { useEffect, useState } from 'react';
import {
  ModuleFeedback,
  type ModuleFeedbackKind,
} from '@/components/rrr-runtime/ModuleFeedback';
import { SafeDialVisual } from '@/components/rrr-runtime/SafeDialVisual';
import { useLiveDeviceHeading } from '@/components/rrr-runtime/useLiveDeviceHeading';

interface SafeDialPlayerProps {
  targetDegrees: number;
  tolerance: number;
  holdMs: number;
  enableLabel: string;
  startingLabel: string;
  unavailableLabel: string;
  deniedLabel: string;
  unlockedLabel: string;
  alignLabel: string;
  onCorrect: () => void;
  disabled?: boolean;
}

export function SafeDialPlayer({
  targetDegrees,
  tolerance,
  holdMs,
  enableLabel,
  startingLabel,
  unavailableLabel,
  deniedLabel,
  unlockedLabel,
  alignLabel,
  onCorrect,
  disabled = false,
}: SafeDialPlayerProps) {
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
    }, Math.max(0, holdMs));
    return () => window.clearTimeout(timer);
  }, [inZone, solved, disabled, holdMs, onCorrect]);

  return (
    <div className="stq-riddle-safe-dial-player">
      <SafeDialVisual
        headingDegrees={heading ?? targetDegrees}
        targetDegrees={targetDegrees}
        tolerance={tolerance}
        unlocked={solved || inZone}
      />
      <SafeDialFeedback
        status={live.status}
        heading={heading}
        inZone={inZone}
        solved={solved}
        unavailableLabel={unavailableLabel}
        deniedLabel={deniedLabel}
        unlockedLabel={unlockedLabel}
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

function SafeDialFeedback({
  status,
  heading,
  inZone,
  solved,
  unavailableLabel,
  deniedLabel,
  unlockedLabel,
  alignLabel,
}: {
  status: ReturnType<typeof useLiveDeviceHeading>['status'];
  heading: number | undefined;
  inZone: boolean;
  solved: boolean;
  unavailableLabel: string;
  deniedLabel: string;
  unlockedLabel: string;
  alignLabel: string;
}) {
  let kind: ModuleFeedbackKind = 'idle';
  let message: string | undefined;

  if (solved) {
    kind = 'success';
    message = unlockedLabel;
  } else if (inZone) {
    kind = 'running';
    message = 'Code halten';
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

  return (
    <ModuleFeedback
      kind={kind}
      message={message}
      sensoryFeedback={
        kind === 'success' || kind === 'error' || message === 'Code halten'
          ? { playKey: `safe-dial-${kind}-${message ?? ''}` }
          : false
      }
    />
  );
}

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(diff, 360 - diff);
}

function normalizeDegrees(degrees: number): number {
  const normalized = degrees % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}
