import { useEffect, useState } from 'react';
import type { TourDraft } from '@/schema';
import { RoutePlannerMap } from './RoutePlannerMap';
import { useDerivedStationRoutes } from './useDerivedStationRoutes';
import { useRouteRecording } from './useRouteRecording';

interface Props {
  draft: TourDraft;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

/**
 * The Studio map cell. Renders only the map — the route stats, recording
 * controls, and warnings cards that used to sit above and below were
 * removed when we tightened the Studio chrome (see commit message). The
 * underlying recording / derivation hooks and helper components are still
 * on disk so a future dedicated "Route" tab can re-use them.
 */
export function LiveRoutePlannerPanel({ draft, onChange }: Props) {
  const [selectedStationId, setSelectedStationId] = useState(
    draft.stations[0]?.id ?? '',
  );
  const [fitTrigger] = useState(1);

  useEffect(() => {
    if (
      selectedStationId &&
      draft.stations.some((station) => station.id === selectedStationId)
    ) {
      return;
    }
    setSelectedStationId(draft.stations[0]?.id ?? '');
  }, [draft.stations, selectedStationId]);

  // Recording is still wired up so the user's GPS track keeps appending to
  // `draft.recordedRoute` even though the toggle/clear UI lives elsewhere.
  const { currentPosition } = useRouteRecording({
    recordedRoute: draft.recordedRoute,
    onAppendPoint: (point) => {
      onChange((prev) => ({
        ...prev,
        recordedRoute: [...prev.recordedRoute, point],
      }));
    },
    onError: () => {
      /* errors will surface in the future Route tab; ignored here. */
    },
  });

  const { derivation } = useDerivedStationRoutes({
    stations: draft.stations,
    recordedRoute: draft.recordedRoute,
    toleranceMeters: 12,
    selectedStationId,
  });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <RoutePlannerMap
        stations={draft.stations}
        recordedRoute={draft.recordedRoute}
        optimizedRoute={derivation.optimizedRoute}
        currentPosition={currentPosition}
        selectedStationId={selectedStationId}
        fitTrigger={fitTrigger}
        onSelectStation={setSelectedStationId}
      />
    </div>
  );
}
