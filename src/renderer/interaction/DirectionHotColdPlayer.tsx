import { useEffect, useState } from 'react';
import { getDirectionHotColdFeedback } from '@/rrr/runtime';
import {
  ModuleFeedback,
  type ModuleFeedbackKind,
} from '@/components/rrr-runtime/ModuleFeedback';
import { DirectionHotColdVisual } from '@/components/rrr-runtime/DirectionHotColdVisual';
import { useLiveDeviceHeading } from '@/components/rrr-runtime/useLiveDeviceHeading';

interface DirectionHotColdPlayerProps {
  targetDegrees: number;
  successTolerance: number;
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

export function DirectionHotColdPlayer({
  targetDegrees,
  successTolerance,
  holdMs = 600,
  enableLabel,
  startingLabel,
  unavailableLabel,
  deniedLabel,
  alignedLabel,
  alignLabel,
  onCorrect,
  disabled = false,
}: DirectionHotColdPlayerProps) {
  const live = useLiveDeviceHeading();
  const [solved, setSolved] = useState(false);
  const heading = live.heading ?? targetDegrees + 180;
  const feedback = getDirectionHotColdFeedback({
    headingDegrees: heading,
    targetDegrees,
    successTolerance,
  });
  const inZone = live.heading !== undefined && feedback.proximity === 'correct';

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
    <div className="stq-riddle-hotcold-player">
      <DirectionHotColdVisual {...feedback} />
      <DirectionHotColdFeedback
        status={live.status}
        hasHeading={live.heading !== undefined}
        proximity={feedback.proximity}
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

function DirectionHotColdFeedback({
  status,
  hasHeading,
  proximity,
  solved,
  unavailableLabel,
  deniedLabel,
  alignedLabel,
  alignLabel,
}: {
  status: ReturnType<typeof useLiveDeviceHeading>['status'];
  hasHeading: boolean;
  proximity: ReturnType<typeof getDirectionHotColdFeedback>['proximity'];
  solved: boolean;
  unavailableLabel: string;
  deniedLabel: string;
  alignedLabel: string;
  alignLabel: string;
}) {
  let kind: ModuleFeedbackKind = 'idle';
  let message: string | undefined;

  if (solved || proximity === 'correct') {
    kind = 'success';
    message = alignedLabel;
  } else if (status === 'available' && hasHeading) {
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
      detail={kind === 'running' ? getProximityLabel(proximity) : undefined}
      sensoryFeedback={
        kind === 'success' || kind === 'error'
          ? { playKey: `direction-hotcold-${kind}-${message ?? ''}` }
          : false
      }
    />
  );
}

function getProximityLabel(
  proximity: ReturnType<typeof getDirectionHotColdFeedback>['proximity'],
): string {
  switch (proximity) {
    case 'very_warm':
      return 'Sehr warm';
    case 'warm':
      return 'Warm';
    case 'cold':
      return 'Kalt';
    case 'very_cold':
      return 'Sehr kalt';
    case 'correct':
      return 'Gefunden';
  }
}
