import { useEffect, useMemo, useRef, useState } from 'react';
import { calculateRouteLengthMeters } from '@/map/routePlanning';
import { hasUsableStationCoordinate } from '@/utils/coordinates';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import {
  toAuthorMapCoordinate,
  type AuthorMapCoordinate,
  type AuthorMapRoute,
  type AuthorMapRoutePointMarker,
} from '@/components/map/mapTypes';
import type { RecordedRoutePoint, RiddleEntry } from '@/schema';
import { Icon } from '../Icon';
import { PhoneMapMockup } from './PhoneMapMockup';
import type { BaseWorkspaceProps } from './workspaceTypes';

interface Props extends BaseWorkspaceProps {
  selectedId: string | null;
  onSelectStation: (id: string) => void;
}

const FIELD_ROUTE_COLOR = '#2196f3';
const ROUTE_STATION_SNAP_METERS = 20;
const ROUTE_DUPLICATE_POINT_METERS = 1;
const EARTH_RADIUS_METERS = 6_371_000;

export function RouteWorkspace({
  draft,
  locale,
  selectedId,
  onChange,
}: Props) {
  const { t } = useEditorLanguage();
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState<string | null>(null);
  const [selectedSegmentFromId, setSelectedSegmentFromId] = useState<string | null>(
    null,
  );
  const routeStartStationIdRef = useRef<string | null>(null);

  // Segment selection lives entirely inside this workspace. The arrow
  // between station N and N+1 in the dock selects station N as the
  // segment origin; tapping the same arrow again leaves it selected.
  const validSegmentOrigins = useMemo(
    () =>
      draft.stations
        .slice(0, Math.max(0, draft.stations.length - 1))
        .map((station) => station.id),
    [draft.stations],
  );
  useEffect(() => {
    if (
      selectedSegmentFromId &&
      validSegmentOrigins.includes(selectedSegmentFromId)
    ) {
      return;
    }
    setSelectedSegmentFromId(validSegmentOrigins[0] ?? null);
  }, [validSegmentOrigins, selectedSegmentFromId]);

  const segmentFromIndex = selectedSegmentFromId
    ? draft.stations.findIndex((station) => station.id === selectedSegmentFromId)
    : -1;
  const selectedStation =
    segmentFromIndex >= 0 ? draft.stations[segmentFromIndex] : null;
  const nextStation =
    segmentFromIndex >= 0 && segmentFromIndex < draft.stations.length - 1
      ? draft.stations[segmentFromIndex + 1]
      : null;

  const selectedRouteSegment = useMemo(
    () =>
      selectedStation &&
      nextStation &&
      hasUsableStationCoordinate(selectedStation) &&
      hasUsableStationCoordinate(nextStation)
        ? {
            from: {
              lat: selectedStation.position_lat,
              lng: selectedStation.position_lng,
            },
            to: { lat: nextStation.position_lat, lng: nextStation.position_lng },
          }
        : null,
    [selectedStation, nextStation],
  );

  const stationsWithCoordinates = useMemo(
    () => draft.stations.filter(hasUsableStationCoordinate),
    [draft.stations],
  );

  // Find the [start, end] slice of recordedRoute that belongs to the
  // currently selected segment. Slice is inclusive of the anchor points.
  // If either endpoint anchor isn't found, returns null.
  const segmentSlice = useMemo(() => {
    if (!selectedStation || !nextStation) return null;
    if (
      !hasUsableStationCoordinate(selectedStation) ||
      !hasUsableStationCoordinate(nextStation)
    ) {
      return null;
    }
    const fromCoord = {
      lat: selectedStation.position_lat,
      lng: selectedStation.position_lng,
    };
    const toCoord = {
      lat: nextStation.position_lat,
      lng: nextStation.position_lng,
    };

    let start = -1;
    for (let i = 0; i < draft.recordedRoute.length; i += 1) {
      if (distanceMeters(draft.recordedRoute[i], fromCoord) <= ROUTE_STATION_SNAP_METERS) {
        start = i;
        break;
      }
    }
    if (start === -1) return null;

    let end = -1;
    for (let i = start + 1; i < draft.recordedRoute.length; i += 1) {
      if (distanceMeters(draft.recordedRoute[i], toCoord) <= ROUTE_STATION_SNAP_METERS) {
        end = i;
        break;
      }
    }
    if (end === -1) return null;
    return { start, end };
  }, [selectedStation, nextStation, draft.recordedRoute]);

  const routePointMarkers = useMemo<AuthorMapRoutePointMarker[]>(
    () =>
      draft.recordedRoute
        .map((point, index) => ({ point, index }))
        .filter(({ point }) => !findNearbyStation(point, stationsWithCoordinates))
        .map(({ point, index }) => ({
          id: String(index),
          coordinate: toAuthorMapCoordinate(point),
          color: FIELD_ROUTE_COLOR,
          draggable: true,
        })),
    [draft.recordedRoute, stationsWithCoordinates],
  );

  const routes = useMemo<AuthorMapRoute[]>(() => {
    const list: AuthorMapRoute[] = [];

    if (selectedRouteSegment) {
      list.push({
        id: 'studio-route-segment-guide',
        points: [selectedRouteSegment.from, selectedRouteSegment.to],
        style: {
          color: FIELD_ROUTE_COLOR,
          weight: 5,
          opacity: 0.8,
          dashArray: '6 7',
        },
      });
    }

    if (draft.recordedRoute.length >= 2) {
      list.push({
        id: 'studio-recorded-route',
        points: draft.recordedRoute.map(toAuthorMapCoordinate),
        style: {
          color: FIELD_ROUTE_COLOR,
          weight: 6,
          opacity: 0.95,
        },
      });
    }

    return list;
  }, [selectedRouteSegment, draft.recordedRoute]);

  const fitPoints = useMemo<AuthorMapCoordinate[]>(() => {
    const stationPoints = stationsWithCoordinates.map((station) => ({
      lat: station.position_lat,
      lng: station.position_lng,
    }));
    const routePoints = draft.recordedRoute.map(toAuthorMapCoordinate);
    return [...stationPoints, ...routePoints];
  }, [stationsWithCoordinates, draft.recordedRoute]);

  const fitSignature = useMemo(
    () =>
      fitPoints
        .map((point) => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`)
        .join('|'),
    [fitPoints],
  );

  function appendRoutePoint(coordinate: AuthorMapCoordinate) {
    const snapped = snapToStation(coordinate, nextStation);
    const point: RecordedRoutePoint = {
      lat: snapped.lat,
      lng: snapped.lng,
      timestamp: Date.now(),
    };

    // If the selected segment is fully anchored already (both station
    // anchors exist in recordedRoute), insert the new waypoint just
    // before the destination anchor. This lets the author edit any
    // segment, not only the last one.
    if (segmentSlice) {
      onChange((prev) => {
        const route = [...prev.recordedRoute];
        const insertAt = segmentSlice.end;
        const previous = route[insertAt - 1];
        if (
          previous &&
          distanceMeters(previous, point) <= ROUTE_DUPLICATE_POINT_METERS
        ) {
          return prev;
        }
        route.splice(insertAt, 0, point);
        return { ...prev, recordedRoute: route };
      });
      return;
    }

    // Fallback (no anchors yet for this segment): start a fresh segment
    // by anchoring at the selected station and pushing the tapped point.
    const shouldAnchorAtStart =
      selectedStation && routeStartStationIdRef.current !== selectedStation.id;

    onChange((prev) => {
      const next = [...prev.recordedRoute];
      if (shouldAnchorAtStart) {
        ensureAnchoredAtStation(next, selectedStation, point.timestamp - 1);
      }
      appendIfNotDuplicate(next, point);
      return { ...prev, recordedRoute: next };
    });

    if (shouldAnchorAtStart && selectedStation) {
      routeStartStationIdRef.current = selectedStation.id;
    }
  }

  function finishSegment() {
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
    const shouldAnchorAtStart = routeStartStationIdRef.current !== selectedStation.id;
    onChange((prev) => {
      const next = [...prev.recordedRoute];
      if (shouldAnchorAtStart) {
        ensureAnchoredAtStation(next, selectedStation, now - 1);
      }
      appendIfNotDuplicate(next, endPoint);
      return { ...prev, recordedRoute: next };
    });
    routeStartStationIdRef.current = nextStation.id;
    // Advance the in-workspace segment selection to the next pair, if any.
    const nextNextIndex = segmentFromIndex + 1;
    if (
      nextNextIndex >= 0 &&
      nextNextIndex < draft.stations.length - 1
    ) {
      setSelectedSegmentFromId(draft.stations[nextNextIndex].id);
    }
  }

  // Tapping a station on the map: if it's the next-in-line, finish the
  // segment; otherwise append its coordinate as a route waypoint
  // (matches field mode's shortcut).
  function handleStationSelect(stationId: string) {
    const station = draft.stations.find((s) => s.id === stationId);
    if (!station || !hasUsableStationCoordinate(station)) return;
    if (nextStation && station.id === nextStation.id) {
      finishSegment();
      return;
    }
    appendRoutePoint({
      lat: station.position_lat,
      lng: station.position_lng,
    });
  }

  function handleMapClick(coordinate: AuthorMapCoordinate) {
    appendRoutePoint(coordinate);
  }

  function handleRoutePointDrag(
    routePointId: string,
    coordinate: AuthorMapCoordinate,
  ) {
    const index = Number(routePointId);
    if (!Number.isInteger(index) || index < 0) return;
    onChange((prev) => {
      if (index >= prev.recordedRoute.length) return prev;
      return {
        ...prev,
        recordedRoute: prev.recordedRoute.map((point, i) =>
          i === index
            ? { ...point, lat: coordinate.lat, lng: coordinate.lng, timestamp: Date.now() }
            : point,
        ),
      };
    });
  }

  // Remove the last interior point of the selected segment (i.e. the
  // last point strictly between the anchor and the next-station anchor).
  // If no interior points exist, removing the next-station anchor "opens"
  // the segment so the author can re-record it.
  function undoLast() {
    if (!segmentSlice) {
      // No anchors yet — fall back to popping the global tail.
      onChange((prev) => ({
        ...prev,
        recordedRoute: prev.recordedRoute.slice(0, -1),
      }));
      routeStartStationIdRef.current = null;
      return;
    }
    const { start, end } = segmentSlice;
    onChange((prev) => {
      const route = prev.recordedRoute;
      if (end - start > 1) {
        const removeAt = end - 1; // last interior point
        return {
          ...prev,
          recordedRoute: [...route.slice(0, removeAt), ...route.slice(removeAt + 1)],
        };
      }
      // No interior points: drop the trailing anchor so the segment opens.
      return {
        ...prev,
        recordedRoute: [...route.slice(0, end), ...route.slice(end + 1)],
      };
    });
    routeStartStationIdRef.current = null;
  }

  // Erase the selected segment only: keep both anchors, drop everything
  // strictly between them. If anchors aren't yet present we no-op.
  function clearSegment() {
    if (!segmentSlice) return;
    const { start, end } = segmentSlice;
    if (end - start <= 1) return;
    onChange((prev) => ({
      ...prev,
      recordedRoute: [
        ...prev.recordedRoute.slice(0, start + 1),
        ...prev.recordedRoute.slice(end),
      ],
    }));
    routeStartStationIdRef.current = null;
  }

  function toggleFocus() {
    if (focusEnabled) {
      setFocusEnabled(false);
      setFocusTrigger(null);
      return;
    }
    if (fitPoints.length < 2) return;
    setFocusEnabled(true);
    setFocusTrigger(String(Date.now()));
  }

  const totalDistance = useMemo(
    () => calculateRouteLengthMeters(draft.recordedRoute),
    [draft.recordedRoute],
  );

  const fromLabel = selectedStation
    ? selectedStation[locale].location || `${t('studio.station')} ${selectedStation.number}`
    : '—';
  const toLabel = nextStation
    ? nextStation[locale].location || `${t('studio.station')} ${nextStation.number}`
    : '—';

  return (
    <PhoneMapMockup
      draft={draft}
      locale={locale}
      selectedId={selectedId}
      onSelectStation={handleStationSelect}
      detail={t('workflow.route')}
      routes={routes}
      routePointMarkers={routePointMarkers}
      onRoutePointCoordinateChange={handleRoutePointDrag}
      onMapClick={handleMapClick}
      showLayersControl
      toolbar={
        <>
          <button
            type="button"
            className={focusEnabled ? 'is-active' : ''}
            onClick={toggleFocus}
            disabled={!focusEnabled && fitPoints.length < 2}
            aria-label="Focus route"
            aria-pressed={focusEnabled}
          >
            <Icon name="compass" size={15} />
          </button>
          <button
            type="button"
            onClick={finishSegment}
            disabled={!nextStation || !hasUsableStationCoordinate(nextStation)}
            aria-label="Finish segment"
          >
            <Icon name="check" size={15} />
          </button>
          <button
            type="button"
            onClick={undoLast}
            disabled={
              segmentSlice
                ? segmentSlice.end - segmentSlice.start <= 0
                : draft.recordedRoute.length === 0
            }
            aria-label="Undo last point in this segment"
          >
            <Icon name="chevron-left" size={15} />
          </button>
          <button
            type="button"
            onClick={clearSegment}
            disabled={
              !segmentSlice || segmentSlice.end - segmentSlice.start <= 1
            }
            aria-label="Clear this segment"
          >
            <Icon name="trash" size={15} />
          </button>
        </>
      }
      fitToCoordinates={focusEnabled && fitPoints.length > 1 ? fitPoints : undefined}
      fitTrigger={focusEnabled ? `${focusTrigger ?? 'on'}:${fitSignature}` : undefined}
      bottomSheet={
        <div className="stq-phone-map-route-stats">
          <span>{t('workflow.route')}</span>
          <strong>{formatDistance(totalDistance)}</strong>
          <small>
            {fromLabel} → {toLabel} · {draft.recordedRoute.length} {t('studio.points')}
          </small>
        </div>
      }
      segmentArrows={{
        selectedFromId: selectedSegmentFromId,
        onSelect: (fromStationId) => {
          setSelectedSegmentFromId(fromStationId);
          // Switching segments invalidates the start-anchor ref so the
          // first tap on the new segment re-anchors at its origin.
          routeStartStationIdRef.current = null;
        },
      }}
    />
  );
}

function snapToStation(
  coordinate: AuthorMapCoordinate,
  target: RiddleEntry | null,
): AuthorMapCoordinate {
  if (!target || !hasUsableStationCoordinate(target)) return coordinate;
  const targetCoord = { lat: target.position_lat, lng: target.position_lng };
  return distanceMeters(coordinate, targetCoord) <= ROUTE_STATION_SNAP_METERS
    ? targetCoord
    : coordinate;
}

function appendIfNotDuplicate(
  points: RecordedRoutePoint[],
  point: RecordedRoutePoint,
) {
  const previous = points[points.length - 1];
  if (previous && distanceMeters(previous, point) <= ROUTE_DUPLICATE_POINT_METERS) {
    return;
  }
  points.push(point);
}

function ensureAnchoredAtStation(
  points: RecordedRoutePoint[],
  station: RiddleEntry | null,
  timestamp: number,
) {
  if (!station || !hasUsableStationCoordinate(station)) return;
  const anchor: RecordedRoutePoint = {
    lat: station.position_lat,
    lng: station.position_lng,
    timestamp,
  };
  const previous = points[points.length - 1];
  if (previous && distanceMeters(previous, anchor) <= ROUTE_STATION_SNAP_METERS) {
    points[points.length - 1] = anchor;
    return;
  }
  points.push(anchor);
}

function findNearbyStation(
  point: { lat: number; lng: number },
  stationsWithCoordinates: RiddleEntry[],
) {
  return (
    stationsWithCoordinates.find(
      (station) =>
        distanceMeters(point, {
          lat: station.position_lat,
          lng: station.position_lng,
        }) <= ROUTE_STATION_SNAP_METERS,
    ) ?? null
  );
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

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '0 m';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2).replace('.', ',')} km`;
}
