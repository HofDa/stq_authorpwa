import type { Locale, RecordedRoutePoint, RiddleEntry, TourDraft } from '@/schema';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AuthorMapBasemapKey,
  AuthorMapControlAction,
  AuthorMapCoordinate,
} from '@/components/map/mapTypes';
import { AUTHOR_MAP_BASEMAPS } from '@/components/map/mapTypes';
import type { CurrentGps } from '@/components/studio/field/types';
import { Icon } from '@/components/studio/Icon';
import { calculateRouteLengthMeters } from '@/map/routePlanning';
import { getTourTitleLabel } from '@/utils/localizedContent';
import { hasUsableStationCoordinate } from '@/utils/coordinates';
import { MapView } from './MapView';
import { StationPillBar } from './StationPillBar';
import { StationBottomSheet, type BottomSheetState } from './StationBottomSheet';

type FieldMapEditTool = 'station' | 'route';

const ROUTE_STATION_SNAP_METERS = 20;
const ROUTE_DUPLICATE_POINT_METERS = 1;
const ESTIMATED_STEP_LENGTH_METERS = 0.75;
const EARTH_RADIUS_METERS = 6_371_000;

interface Props {
  draft: TourDraft;
  locale: Locale;
  selectedStation: RiddleEntry | null;
  selectedStationId: string | null;
  gps: CurrentGps | null;
  gpsLive: boolean;
  gpsError: string | null;
  basemap: AuthorMapBasemapKey;
  authorMode: boolean;
  solvedStationIds: Set<string>;
  bottomSheetState: BottomSheetState;
  isFirst: boolean;
  isLast: boolean;
  onSelectStation: (stationId: string) => void;
  onSheetStateChange: (state: BottomSheetState) => void;
  onAuthorModeChange: (enabled: boolean) => void;
  onStationSolved: (stationId: string) => void;
  onBackToTour: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleGps: () => void;
  onBasemapChange: (basemap: AuthorMapBasemapKey) => void;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

export function MapScreen({
  draft,
  locale,
  selectedStation,
  selectedStationId,
  gps,
  gpsLive,
  gpsError,
  basemap,
  authorMode,
  solvedStationIds,
  bottomSheetState,
  isFirst,
  isLast,
  onSelectStation,
  onSheetStateChange,
  onAuthorModeChange,
  onStationSolved,
  onBackToTour,
  onPrev,
  onNext,
  onToggleGps,
  onBasemapChange,
  onChange,
}: Props) {
  const [editTool, setEditTool] = useState<FieldMapEditTool>('station');
  const [mapControlAction, setMapControlAction] =
    useState<AuthorMapControlAction | null>(null);
  const [navigationSegment, setNavigationSegment] = useState<{
    from: AuthorMapCoordinate;
    to: AuthorMapCoordinate;
    progress: number;
    trigger: string;
  } | null>(null);
  const navigationFrameRef = useRef<number | null>(null);
  const routeStartStationIdRef = useRef<string | null>(null);
  const selectedIndex = selectedStation
    ? draft.stations.findIndex((station) => station.id === selectedStation.id)
    : -1;
  const nextStation =
    selectedIndex >= 0 && selectedIndex < draft.stations.length - 1
      ? draft.stations[selectedIndex + 1]
      : null;
  const selectedRouteSegment =
    selectedStation &&
    nextStation &&
    hasUsableStationCoordinate(selectedStation) &&
    hasUsableStationCoordinate(nextStation)
      ? {
          from: {
            lat: selectedStation.position_lat,
            lng: selectedStation.position_lng,
          },
          to: {
            lat: nextStation.position_lat,
            lng: nextStation.position_lng,
          },
        }
      : null;

  useEffect(() => {
    if (!authorMode) setEditTool('station');
  }, [authorMode]);

  useEffect(
    () => () => {
      if (navigationFrameRef.current !== null) {
        window.cancelAnimationFrame(navigationFrameRef.current);
      }
    },
    [],
  );

  function openStation(stationId: string) {
    onSelectStation(stationId);
    onSheetStateChange('expanded');
  }

  function handleMapStationSelect(stationId: string) {
    if (authorMode && editTool === 'route') {
      const station = draft.stations.find((candidate) => candidate.id === stationId);
      if (!station || !hasUsableStationCoordinate(station)) {
        return;
      }

      if (nextStation && station.id === nextStation.id) {
        finishRouteSegment();
        return;
      }

      appendRoutePoint({
        lat: station.position_lat,
        lng: station.position_lng,
      });
      return;
    }

    openStation(stationId);
  }

  function changeStationCoordinate(
    stationId: string,
    coordinate: { lat: number; lng: number },
  ) {
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((station) =>
        station.id === stationId
          ? {
              ...station,
              position_lat: coordinate.lat,
              position_lng: coordinate.lng,
            }
          : station,
      ),
    }));
  }

  function changeRoutePointCoordinate(
    routePointId: string,
    coordinate: { lat: number; lng: number },
  ) {
    const routePointIndex = Number(routePointId);
    if (!Number.isInteger(routePointIndex) || routePointIndex < 0) {
      return;
    }

    onChange((prev) => {
      if (routePointIndex >= prev.recordedRoute.length) {
        return prev;
      }

      return {
        ...prev,
        recordedRoute: prev.recordedRoute.map((point, index) =>
          index === routePointIndex
            ? {
                ...point,
                lat: coordinate.lat,
                lng: coordinate.lng,
                timestamp: Date.now(),
              }
            : point,
        ),
      };
    });
  }

  function placeSelectedStation(coordinate: { lat: number; lng: number }) {
    if (!selectedStation) return;
    changeStationCoordinate(selectedStation.id, coordinate);
    onSheetStateChange('closed');
  }

  function placeSelectedStationAtGps() {
    if (!gps) return;
    placeSelectedStation({ lat: gps.lat, lng: gps.lng });
  }

  function handleMapClick(coordinate: AuthorMapCoordinate) {
    if (authorMode && editTool === 'station') {
      placeSelectedStation(coordinate);
      return;
    }
    appendRoutePoint(coordinate);
  }

  function appendRoutePoint(coordinate: { lat: number; lng: number }) {
    const snapped = snapRouteCoordinate(coordinate, nextStation);
    const point: RecordedRoutePoint = {
      lat: snapped.lat,
      lng: snapped.lng,
      timestamp: Date.now(),
    };
    const routeShouldStartAtSelectedStation =
      selectedStation && routeStartStationIdRef.current !== selectedStation.id;

    onChange((prev) => {
      const nextPoints = [...prev.recordedRoute];
      if (routeShouldStartAtSelectedStation) {
        ensureRouteAnchoredAtStation(nextPoints, selectedStation, point.timestamp - 1);
      }
      appendIfNotDuplicate(nextPoints, point);
      return { ...prev, recordedRoute: nextPoints };
    });

    if (routeShouldStartAtSelectedStation) {
      routeStartStationIdRef.current = selectedStation.id;
    }
  }

  function appendGpsRoutePoint() {
    if (!gps) return;
    appendRoutePoint({ lat: gps.lat, lng: gps.lng });
  }

  function finishRouteSegment() {
    if (
      !selectedStation ||
      !nextStation ||
      !hasUsableStationCoordinate(selectedStation) ||
      !hasUsableStationCoordinate(nextStation)
    ) {
      return;
    }

    const now = Date.now();
    const endPoint: RecordedRoutePoint = {
      lat: nextStation.position_lat,
      lng: nextStation.position_lng,
      timestamp: now,
    };
    const routeShouldStartAtSelectedStation =
      routeStartStationIdRef.current !== selectedStation.id;

    onChange((prev) => {
      const nextPoints = [...prev.recordedRoute];
      if (routeShouldStartAtSelectedStation) {
        ensureRouteAnchoredAtStation(nextPoints, selectedStation, now - 1);
      }
      appendIfNotDuplicate(nextPoints, endPoint);
      return { ...prev, recordedRoute: nextPoints };
    });

    routeStartStationIdRef.current = nextStation.id;
    onSelectStation(nextStation.id);
    onSheetStateChange('closed');
  }

  function undoLastRoutePoint() {
    routeStartStationIdRef.current = null;
    onChange((prev) => ({
      ...prev,
      recordedRoute: prev.recordedRoute.slice(0, -1),
    }));
  }

  function clearRoutePath() {
    routeStartStationIdRef.current = null;
    onChange((prev) => ({ ...prev, recordedRoute: [] }));
  }

  function dispatchMapControl(type: AuthorMapControlAction['type']) {
    setMapControlAction({ type, nonce: Date.now() });
    if (type === 'recenter' && !gpsLive) {
      onToggleGps();
    }
  }

  function cycleBasemap() {
    const keys = Object.keys(AUTHOR_MAP_BASEMAPS) as AuthorMapBasemapKey[];
    const currentIndex = keys.indexOf(basemap);
    onBasemapChange(keys[(currentIndex + 1) % keys.length] ?? keys[0]);
  }

  function toggleEditTool() {
    setEditTool((current) => {
      const next = current === 'station' ? 'route' : 'station';
      onSheetStateChange(next === 'route' ? 'closed' : 'collapsed');
      return next;
    });
  }

  function deleteStation(stationId: string) {
    const currentIndex = draft.stations.findIndex((station) => station.id === stationId);
    const nextStation =
      draft.stations[currentIndex + 1] ??
      draft.stations[currentIndex - 1] ??
      draft.stations.find((station) => station.id !== stationId) ??
      null;

    onChange((prev) => ({
      ...prev,
      stations: prev.stations
        .filter((station) => station.id !== stationId)
        .map((station, index) => ({ ...station, number: index + 1 })),
    }));
    onSelectStation(nextStation?.id ?? '');
    onSheetStateChange(nextStation ? 'collapsed' : 'closed');
  }

  function goToNextWithNavigation() {
    if (!selectedStation || !nextStation) {
      onNext();
      return;
    }

    if (
      authorMode ||
      !hasUsableStationCoordinate(selectedStation) ||
      !hasUsableStationCoordinate(nextStation)
    ) {
      onNext();
      return;
    }

    if (navigationFrameRef.current !== null) {
      window.cancelAnimationFrame(navigationFrameRef.current);
      navigationFrameRef.current = null;
    }

    const from = {
      lat: selectedStation.position_lat,
      lng: selectedStation.position_lng,
    };
    const to = {
      lat: nextStation.position_lat,
      lng: nextStation.position_lng,
    };
    const trigger = `${selectedStation.id}-${nextStation.id}-${Date.now()}`;
    const startedAt = performance.now();
    const durationMs = 1450;

    onSheetStateChange('closed');
    setNavigationSegment({ from, to, progress: 0, trigger });

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setNavigationSegment({ from, to, progress: eased, trigger });

      if (progress < 1) {
        navigationFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      navigationFrameRef.current = null;
      window.setTimeout(() => {
        setNavigationSegment(null);
        onNext();
      }, 120);
    };

    navigationFrameRef.current = window.requestAnimationFrame(tick);
  }

  const draggableStationIds = useMemo(
    () =>
      authorMode && editTool === 'station'
        ? draft.stations.map((station) => station.id)
        : [],
    [authorMode, draft.stations, editTool],
  );
  const routeLengthMeters = useMemo(
    () => calculateRouteLengthMeters(draft.recordedRoute),
    [draft.recordedRoute],
  );
  const tourTitle = getTourTitleLabel(draft.tour, locale, 'Rätseltour');

  return (
    <main className="stq-field-map-screen">
      <MapView
        stations={draft.stations}
        selectedStationId={selectedStationId}
        locale={locale}
        gps={gps}
        gpsLive={gpsLive}
        basemap={basemap}
        recordedRoute={draft.recordedRoute}
        routeEditActive={authorMode && editTool === 'route'}
        stationEditActive={authorMode && editTool === 'station'}
        selectedRouteSegment={selectedRouteSegment}
        onSelectStation={handleMapStationSelect}
        onMapClick={handleMapClick}
        draggableStationIds={draggableStationIds}
        onStationCoordinateChange={changeStationCoordinate}
        onRoutePointCoordinateChange={changeRoutePointCoordinate}
        navigationSegment={navigationSegment}
        controlAction={mapControlAction}
      />
      <div className="stq-field-map-topbar">
        <button
          type="button"
          className="stq-field-map-title-pill"
          onClick={onBackToTour}
          aria-label="Back to tour"
        >
          <Icon name="chevron-left" size={20} />
          <span>{tourTitle}</span>
        </button>
        {authorMode && (
          <button
            type="button"
            className={`stq-field-map-tool-toggle stq-field-map-tool-toggle--${editTool}`}
            onClick={toggleEditTool}
            aria-label={
              editTool === 'station'
                ? 'Switch to route editing'
                : 'Switch to station editing'
            }
            aria-pressed={editTool === 'route'}
            title={editTool === 'station' ? 'Station editing' : 'Route editing'}
          >
            <Icon name={editTool === 'station' ? 'flag' : 'route'} size={16} />
          </button>
        )}
        <button
          type="button"
          className={`stq-field-map-edit-toggle${authorMode ? ' active' : ''}`}
          onClick={() => {
            if (authorMode) setEditTool('station');
            onAuthorModeChange(!authorMode);
          }}
          aria-label={authorMode ? 'Disable editing' : 'Enable editing'}
          aria-pressed={authorMode}
        >
          <Icon name="edit" size={16} />
        </button>
      </div>
      {authorMode && (
        <div className="stq-field-map-controls" aria-label="Map controls">
          <button
            type="button"
            onClick={() => dispatchMapControl('zoomIn')}
            aria-label="Zoom in"
          >
            <Icon name="plus" size={18} stroke={2.2} />
          </button>
          <button
            type="button"
            onClick={cycleBasemap}
            aria-label="Change map layer"
            title={`Basemap: ${AUTHOR_MAP_BASEMAPS[basemap].label}`}
          >
            <Icon name="layers" size={16} />
          </button>
        </div>
      )}
      <div className="stq-field-map-zoom" aria-label="Zoom controls">
        <button
          type="button"
          onClick={() => dispatchMapControl('zoomIn')}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => dispatchMapControl('zoomOut')}
          aria-label="Zoom out"
        >
          -
        </button>
      </div>
      {gpsError && <div className="stq-field-map-error">{gpsError}</div>}
      {authorMode && editTool === 'station' && (
        <StationEditBar
          selectedStation={selectedStation}
          locale={locale}
          gpsAvailable={Boolean(gps)}
          hasPosition={Boolean(
            selectedStation && hasUsableStationCoordinate(selectedStation),
          )}
          onUseGps={placeSelectedStationAtGps}
        />
      )}
      {authorMode && editTool === 'route' && (
        <RouteEditBar
          selectedStation={selectedStation}
          nextStation={nextStation}
          locale={locale}
          pointCount={draft.recordedRoute.length}
          routeLengthMeters={routeLengthMeters}
          gpsAvailable={Boolean(gps)}
          canUndo={draft.recordedRoute.length > 0}
          canFinish={Boolean(nextStation && hasUsableStationCoordinate(nextStation))}
          onUseGps={appendGpsRoutePoint}
          onFinish={finishRouteSegment}
          onUndo={undoLastRoutePoint}
          onClear={clearRoutePath}
        />
      )}
      <StationPillBar
        stations={draft.stations}
        selectedStationId={selectedStationId}
        locale={locale}
        onSelectStation={openStation}
        onNext={goToNextWithNavigation}
        nextDisabled={!nextStation}
      />
      <StationBottomSheet
        state={bottomSheetState}
        draft={draft}
        station={selectedStation}
        locale={locale}
        authorMode={authorMode}
        solved={selectedStation ? solvedStationIds.has(selectedStation.id) : false}
        onAuthorModeChange={onAuthorModeChange}
        onStationSolved={onStationSolved}
        isFirst={isFirst}
        isLast={isLast}
        onStateChange={onSheetStateChange}
        onBack={() => onSheetStateChange('closed')}
        onPrev={onPrev}
        onNext={goToNextWithNavigation}
        onDeleteStation={deleteStation}
        onChange={onChange}
      />
    </main>
  );
}

function StationEditBar({
  selectedStation,
  locale,
  gpsAvailable,
  hasPosition,
  onUseGps,
}: {
  selectedStation: RiddleEntry | null;
  locale: Locale;
  gpsAvailable: boolean;
  hasPosition: boolean;
  onUseGps: () => void;
}) {
  const label = selectedStation
    ? selectedStation[locale].location || `Station ${selectedStation.number}`
    : 'No station selected';

  return (
    <section className="stq-field-route-editbar stq-field-station-editbar" aria-label="Station placement tools">
      <div className="stq-field-route-editbar-copy">
        <span>Station</span>
        <strong>{label}</strong>
        <small>
          {hasPosition ? 'Drag pin or tap map to update position' : 'Drag pin, tap map, or use GPS to place it'}
        </small>
      </div>
      <div className="stq-field-route-editbar-actions">
        <button type="button" onClick={onUseGps} disabled={!gpsAvailable}>
          <Icon name="map-pin" size={14} />
          GPS
        </button>
      </div>
    </section>
  );
}

function RouteEditBar({
  selectedStation,
  nextStation,
  locale,
  pointCount,
  routeLengthMeters,
  gpsAvailable,
  canUndo,
  canFinish,
  onUseGps,
  onFinish,
  onUndo,
  onClear,
}: {
  selectedStation: RiddleEntry | null;
  nextStation: RiddleEntry | null;
  locale: Locale;
  pointCount: number;
  routeLengthMeters: number;
  gpsAvailable: boolean;
  canUndo: boolean;
  canFinish: boolean;
  onUseGps: () => void;
  onFinish: () => void;
  onUndo: () => void;
  onClear: () => void;
}) {
  const fromLabel = selectedStation
    ? selectedStation[locale].location || `Station ${selectedStation.number}`
    : 'No station';
  const toLabel = nextStation
    ? nextStation[locale].location || `Station ${nextStation.number}`
    : 'No next station';
  const estimatedSteps = Math.round(routeLengthMeters / ESTIMATED_STEP_LENGTH_METERS);

  return (
    <section className="stq-field-route-editbar" aria-label="Route editing tools">
      <div className="stq-field-route-editbar-copy">
        <span>Route</span>
        <strong>
          {fromLabel} {'->'} {toLabel}
        </strong>
        <small>
          {formatRouteLength(routeLengthMeters)} · {estimatedSteps} steps ·{' '}
          {pointCount} point{pointCount === 1 ? '' : 's'}
        </small>
      </div>
      <div className="stq-field-route-editbar-actions">
        <button type="button" onClick={onUseGps} disabled={!gpsAvailable}>
          <Icon name="map-pin" size={14} />
          GPS
        </button>
        <button type="button" onClick={onFinish} disabled={!canFinish}>
          <Icon name="check" size={14} />
          Finish
        </button>
        <button type="button" onClick={onUndo} disabled={!canUndo}>
          <Icon name="chevron-left" size={14} />
          Undo
        </button>
        <button type="button" onClick={onClear} disabled={!canUndo}>
          <Icon name="trash" size={14} />
          Clear
        </button>
      </div>
    </section>
  );
}

function snapRouteCoordinate(
  coordinate: { lat: number; lng: number },
  targetStation: RiddleEntry | null,
) {
  if (!targetStation || !hasUsableStationCoordinate(targetStation)) {
    return coordinate;
  }

  const target = {
    lat: targetStation.position_lat,
    lng: targetStation.position_lng,
  };
  return distanceMeters(coordinate, target) <= ROUTE_STATION_SNAP_METERS
    ? target
    : coordinate;
}

function appendIfNotDuplicate(
  points: RecordedRoutePoint[],
  point: RecordedRoutePoint,
) {
  const previous = points[points.length - 1];
  if (
    previous &&
    distanceMeters(previous, point) <= ROUTE_DUPLICATE_POINT_METERS
  ) {
    return;
  }
  points.push(point);
}

function ensureRouteAnchoredAtStation(
  points: RecordedRoutePoint[],
  station: RiddleEntry | null,
  timestamp: number,
) {
  if (!station || !hasUsableStationCoordinate(station)) {
    return;
  }

  const anchor: RecordedRoutePoint = {
    lat: station.position_lat,
    lng: station.position_lng,
    timestamp,
  };
  const previous = points[points.length - 1];
  if (
    previous &&
    distanceMeters(previous, anchor) <= ROUTE_STATION_SNAP_METERS
  ) {
    points[points.length - 1] = anchor;
    return;
  }

  points.push(anchor);
}

function formatRouteLength(meters: number) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

function distanceMeters(
  left: { lat: number; lng: number },
  right: { lat: number; lng: number },
) {
  const lat1 = left.lat * (Math.PI / 180);
  const lat2 = right.lat * (Math.PI / 180);
  const deltaLat = (right.lat - left.lat) * (Math.PI / 180);
  const deltaLng = (right.lng - left.lng) * (Math.PI / 180);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
