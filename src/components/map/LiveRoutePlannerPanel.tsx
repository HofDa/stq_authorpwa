import { useEffect, useState } from 'react';
import type { TourDraft } from '@/schema';
import { RoutePlannerControls } from './RoutePlannerControls';
import { RoutePlannerMap } from './RoutePlannerMap';
import { RouteStats } from './RouteStats';
import { RouteWarnings } from './RouteWarnings';
import { SelectedStationPathSummary } from './SelectedStationPathSummary';
import { useDerivedStationRoutes } from './useDerivedStationRoutes';
import { useRouteRecording } from './useRouteRecording';

interface Props {
  draft: TourDraft;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

export function LiveRoutePlannerPanel({ draft, onChange }: Props) {
  const [selectedStationId, setSelectedStationId] = useState(
    draft.stations[0]?.id ?? '',
  );
  const [plannerError, setPlannerError] = useState<string | null>(null);
  const [toleranceMeters, setToleranceMeters] = useState(12);
  const [fitTrigger, setFitTrigger] = useState(1);

  useEffect(() => {
    if (
      selectedStationId &&
      draft.stations.some((station) => station.id === selectedStationId)
    ) {
      return;
    }
    setSelectedStationId(draft.stations[0]?.id ?? '');
  }, [draft.stations, selectedStationId]);

  const { tracking, setTracking, currentPosition } = useRouteRecording({
    recordedRoute: draft.recordedRoute,
    onAppendPoint: (point) => {
      onChange((prev) => ({
        ...prev,
        recordedRoute: [...prev.recordedRoute, point],
      }));
    },
    onError: setPlannerError,
  });

  const {
    derivation,
    rawDistanceMeters,
    optimizedDistanceMeters,
    selectedStationPath,
  } = useDerivedStationRoutes({
    stations: draft.stations,
    recordedRoute: draft.recordedRoute,
    toleranceMeters,
    selectedStationId,
  });
  const selectedStation = draft.stations.find(
    (station) => station.id === selectedStationId,
  );

  function assignCurrentPositionToStation() {
    if (!selectedStationId || !currentPosition) {
      return;
    }
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((station) =>
        station.id === selectedStationId
          ? {
              ...station,
              position_lat: currentPosition.lat,
              position_lng: currentPosition.lng,
            }
          : station,
      ),
    }));
  }

  function clearRecordedRoute() {
    if (!confirm('Clear the recorded route for this tour draft?')) {
      return;
    }
    onChange((prev) => ({ ...prev, recordedRoute: [] }));
  }

  function applyOptimizedPaths() {
    if (derivation.stationPaths.length === 0) {
      setPlannerError(
        derivation.warnings[derivation.warnings.length - 1] ??
          'Record a route before generating optimized station paths.',
      );
      return;
    }

    setPlannerError(null);
    const polylineByStationId = new Map(
      derivation.stationPaths.map((path) => [path.stationId, path.polylineString]),
    );
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((station) => ({
        ...station,
        polylineString:
          polylineByStationId.get(station.id) ?? station.polylineString,
      })),
    }));
  }

  return (
    <section className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-labelSm uppercase tracking-[0.18em] text-primary/80">
            Live Route
          </p>
          <h2 className="mt-1 text-h5">Map Planner</h2>
          <p className="mt-1 text-bodySm text-disabled">
            Walk the tour, record the path, then write optimized route segments
            into each station.
          </p>
        </div>
        <button className="btn-ghost" onClick={() => setFitTrigger((value) => value + 1)}>
          Recenter
        </button>
      </div>

      <RouteStats
        rawPointCount={draft.recordedRoute.length}
        optimizedPointCount={derivation.optimizedRoute.length}
        rawDistanceMeters={rawDistanceMeters}
        optimizedDistanceMeters={optimizedDistanceMeters}
      />

      <RoutePlannerMap
        stations={draft.stations}
        recordedRoute={draft.recordedRoute}
        optimizedRoute={derivation.optimizedRoute}
        currentPosition={currentPosition}
        selectedStationId={selectedStationId}
        fitTrigger={fitTrigger}
        onSelectStation={setSelectedStationId}
      />

      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <section className="rounded-md border border-border bg-background p-3">
          <RoutePlannerControls
            stations={draft.stations}
            selectedStationId={selectedStationId}
            toleranceMeters={toleranceMeters}
            tracking={tracking}
            canAssignCurrentPosition={Boolean(selectedStationId && currentPosition)}
            canWriteOptimizedPaths={derivation.stationPaths.length > 0}
            canClearTrack={draft.recordedRoute.length > 0}
            onSelectedStationChange={setSelectedStationId}
            onToleranceChange={setToleranceMeters}
            onToggleTracking={() => setTracking((value) => !value)}
            onAssignCurrentPosition={assignCurrentPositionToStation}
            onWriteOptimizedPaths={applyOptimizedPaths}
            onClearTrack={clearRecordedRoute}
          />
          <RouteWarnings
            plannerError={plannerError}
            tracking={tracking}
            warnings={derivation.warnings}
          />
        </section>

        <SelectedStationPathSummary
          station={selectedStation}
          stationPath={selectedStationPath}
        />
      </div>
    </section>
  );
}
