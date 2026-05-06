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
 * The Studio map cell. Renders only the route map; route stats and warning
 * cards live in the desktop Route workspace.
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

  // Keep the hook here for current-position support; tracking stays off until
  // a field capture flow explicitly enables it.
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
