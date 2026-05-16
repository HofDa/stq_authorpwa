import { useEffect } from 'react';
import { getProximityHintFeedback } from '@/rrr/runtime';
import { ProximityRadarVisual } from '@/components/rrr-runtime/ProximityRadarVisual';
import { useLiveGeolocation } from '@/components/rrr-runtime/useLiveGeolocation';

const LABELS = {
  liveEnable: 'GPS aktivieren',
  liveStarting: 'GPS wird gestartet...',
  liveUnavailable: 'GPS auf diesem Geraet nicht verfuegbar.',
  liveDenied: 'GPS-Zugriff verweigert.',
  simulateInside: 'In den Zielradius setzen',
  simulateOutside: 'Ausserhalb des Radars setzen',
} as const;

interface ProximityRadarControlProps {
  currentLat: number;
  currentLng: number;
  targetLat: number;
  targetLng: number;
  successRadiusMeters: number;
  onPositionChange: (position: { lat: number; lng: number }) => void;
}

export function ProximityRadarControl({
  currentLat,
  currentLng,
  targetLat,
  targetLng,
  successRadiusMeters,
  onPositionChange,
}: ProximityRadarControlProps) {
  const live = useLiveGeolocation();
  const feedback = getProximityHintFeedback({
    currentLat,
    currentLng,
    targetLat,
    targetLng,
    successRadiusMeters,
  });

  useEffect(() => {
    if (
      live.status === 'available' &&
      typeof live.latitude === 'number' &&
      typeof live.longitude === 'number'
    ) {
      onPositionChange({ lat: live.latitude, lng: live.longitude });
    }
  }, [live.latitude, live.longitude, live.status, onPositionChange]);

  return (
    <div className="stq-rrr-radar-control">
      <ProximityRadarVisual {...feedback} />

      <div className="stq-rrr-radar-control__live">
        <LiveStatus status={live.status} accuracy={live.accuracy} />
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

      <div className="stq-rrr-guide__choice">
        <button
          type="button"
          className="stq-rrr-editor__button"
          onClick={() => onPositionChange({ lat: targetLat, lng: targetLng })}
        >
          {LABELS.simulateInside}
        </button>
        <button
          type="button"
          className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
          onClick={() =>
            onPositionChange({
              lat: targetLat + 0.01,
              lng: targetLng + 0.01,
            })
          }
        >
          {LABELS.simulateOutside}
        </button>
      </div>
    </div>
  );
}

function LiveStatus({
  status,
  accuracy,
}: {
  status: ReturnType<typeof useLiveGeolocation>['status'];
  accuracy: number | undefined;
}) {
  if (status === 'available') {
    return (
      <small className="stq-rrr-compass-control__status">
        GPS aktiv
        {typeof accuracy === 'number' ? `, +/-${Math.round(accuracy)} m` : ''}
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
