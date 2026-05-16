import { useEffect, useState } from 'react';
import { getProximityHintFeedback } from '@/rrr/runtime';
import {
  ModuleFeedback,
  type ModuleFeedbackKind,
} from '@/components/rrr-runtime/ModuleFeedback';
import { ProximityRadarVisual } from '@/components/rrr-runtime/ProximityRadarVisual';
import { useLiveGeolocation } from '@/components/rrr-runtime/useLiveGeolocation';

interface ProximityRadarPlayerProps {
  targetLat: number;
  targetLng: number;
  successRadiusMeters: number;
  enableLabel?: string;
  startingLabel?: string;
  unavailableLabel?: string;
  deniedLabel?: string;
  onCorrect: () => void;
  disabled?: boolean;
}

export function ProximityRadarPlayer({
  targetLat,
  targetLng,
  successRadiusMeters,
  enableLabel = 'GPS aktivieren',
  startingLabel = 'GPS wird gestartet...',
  unavailableLabel = 'GPS auf diesem Geraet nicht verfuegbar.',
  deniedLabel = 'GPS-Zugriff verweigert.',
  onCorrect,
  disabled = false,
}: ProximityRadarPlayerProps) {
  const live = useLiveGeolocation();
  const [solved, setSolved] = useState(false);
  const currentLat = live.latitude ?? targetLat + 0.01;
  const currentLng = live.longitude ?? targetLng + 0.01;
  const feedback = getProximityHintFeedback({
    currentLat,
    currentLng,
    targetLat,
    targetLng,
    successRadiusMeters,
  });
  const inside =
    live.latitude !== undefined &&
    live.longitude !== undefined &&
    feedback.proximity === 'inside_target_radius';

  useEffect(() => {
    if (solved || disabled || !inside) return;
    setSolved(true);
    onCorrect();
  }, [inside, solved, disabled, onCorrect]);

  return (
    <div className="stq-riddle-radar-player">
      <ProximityRadarVisual {...feedback} />
      <RadarFeedback
        status={live.status}
        hasPosition={live.latitude !== undefined && live.longitude !== undefined}
        solved={solved}
        distanceMeters={feedback.distanceMeters}
        successRadiusMeters={feedback.successRadiusMeters}
        unavailableLabel={unavailableLabel}
        deniedLabel={deniedLabel}
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

function RadarFeedback({
  status,
  hasPosition,
  solved,
  distanceMeters,
  successRadiusMeters,
  unavailableLabel,
  deniedLabel,
}: {
  status: ReturnType<typeof useLiveGeolocation>['status'];
  hasPosition: boolean;
  solved: boolean;
  distanceMeters: number;
  successRadiusMeters: number;
  unavailableLabel: string;
  deniedLabel: string;
}) {
  let kind: ModuleFeedbackKind = 'idle';
  let message: string | undefined;
  let detail: string | undefined;

  if (solved || distanceMeters <= successRadiusMeters) {
    kind = 'success';
    message = 'Ziel erreicht';
  } else if (status === 'available' && hasPosition) {
    kind = 'running';
    message = 'Gehe zum Zielpunkt';
    detail = `${Math.round(distanceMeters)} m entfernt`;
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
      detail={detail}
      sensoryFeedback={
        kind === 'success' || kind === 'error'
          ? { playKey: `proximity-radar-${kind}-${message ?? ''}` }
          : false
      }
    />
  );
}
